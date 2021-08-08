import { Context } from "./context.ts";
import { assert, STATUS_TEXT } from "./deps.ts";
import { hasNativeHttp, HttpServerNative, NativeRequest, } from "./http_server_native.ts";
import { HttpServerStd } from "./http_server_std.ts";
import { KeyStack } from "./keyStack.ts";
import { compose } from "./middleware.ts";
import { cloneState } from "./structured_clone.ts";
import { isConn } from "./util.ts";
const ADDR_REGEXP = /^\[?([^\]]*)\]?:([0-9]{1,5})$/;
export class ApplicationErrorEvent extends ErrorEvent {
    context;
    constructor(eventInitDict) {
        super("error", eventInitDict);
        this.context = eventInitDict.context;
    }
}
function logErrorListener({ error, context }) {
    if (error instanceof Error) {
        console.error(`[uncaught oak error]: ${error.name} - ${error.message}`);
    }
    else {
        console.error(`[uncaught oak error]\n`, error);
    }
    if (context) {
        console.error(`\nrequest:`, {
            url: context.request.url.toString(),
            method: context.request.method,
            hasBody: context.request.hasBody,
        });
        console.error(`response:`, {
            status: context.response.status,
            type: context.response.type,
            hasBody: !!context.response.body,
            writable: context.response.writable,
        });
    }
    if (error instanceof Error && error.stack) {
        console.error(`\n${error.stack.split("\n").slice(1).join("\n")}`);
    }
}
export class ApplicationListenEvent extends Event {
    hostname;
    port;
    secure;
    serverType;
    constructor(eventInitDict) {
        super("listen", eventInitDict);
        this.hostname = eventInitDict.hostname;
        this.port = eventInitDict.port;
        this.secure = eventInitDict.secure;
        this.serverType = eventInitDict.serverType;
    }
}
export class Application extends EventTarget {
    #composedMiddleware;
    #contextState;
    #eventHandler;
    #keys;
    #middleware = [];
    #serverConstructor;
    get keys() {
        return this.#keys;
    }
    set keys(keys) {
        if (!keys) {
            this.#keys = undefined;
            return;
        }
        else if (Array.isArray(keys)) {
            this.#keys = new KeyStack(keys);
        }
        else {
            this.#keys = keys;
        }
    }
    proxy;
    state;
    constructor(options = {}) {
        super();
        const { state, keys, proxy, serverConstructor = hasNativeHttp() ? HttpServerNative : HttpServerStd, contextState = "clone", logErrors = true, } = options;
        this.proxy = proxy ?? false;
        this.keys = keys;
        this.state = state ?? {};
        this.#serverConstructor = serverConstructor;
        this.#contextState = contextState;
        if (logErrors) {
            this.addEventListener("error", logErrorListener);
        }
    }
    #getComposed() {
        if (!this.#composedMiddleware) {
            this.#composedMiddleware = compose(this.#middleware);
        }
        return this.#composedMiddleware;
    }
    #getContextState() {
        switch (this.#contextState) {
            case "alias":
                return this.state;
            case "clone":
                return cloneState(this.state);
            case "empty":
                return {};
            case "prototype":
                return Object.create(this.state);
        }
    }
    #handleError(context, error) {
        if (!(error instanceof Error)) {
            error = new Error(`non-error thrown: ${JSON.stringify(error)}`);
        }
        const { message } = error;
        this.dispatchEvent(new ApplicationErrorEvent({ context, message, error }));
        if (!context.response.writable) {
            return;
        }
        for (const key of context.response.headers.keys()) {
            context.response.headers.delete(key);
        }
        if (error.headers && error.headers instanceof Headers) {
            for (const [key, value] of error.headers) {
                context.response.headers.set(key, value);
            }
        }
        context.response.type = "text";
        const status = context.response.status =
            Deno.errors && error instanceof Deno.errors.NotFound
                ? 404
                : error.status && typeof error.status === "number"
                    ? error.status
                    : 500;
        context.response.body = error.expose
            ? error.message
            : STATUS_TEXT.get(status);
    }
    async #handleRequest(request, secure, state) {
        const context = new Context(this, request, this.#getContextState(), secure);
        let resolve;
        const handlingPromise = new Promise((res) => resolve = res);
        state.handling.add(handlingPromise);
        if (!state.closing && !state.closed) {
            try {
                await this.#getComposed()(context);
            }
            catch (err) {
                this.#handleError(context, err);
            }
        }
        if (context.respond === false) {
            context.response.destroy();
            resolve();
            state.handling.delete(handlingPromise);
            return;
        }
        let closeResources = true;
        let response;
        try {
            if (request instanceof NativeRequest) {
                closeResources = false;
                response = await context.response.toDomResponse();
            }
            else {
                response = await context.response.toServerResponse();
            }
        }
        catch (err) {
            this.#handleError(context, err);
            if (request instanceof NativeRequest) {
                response = await context.response.toDomResponse();
            }
            else {
                response = await context.response.toServerResponse();
            }
        }
        assert(response);
        try {
            await request.respond(response);
        }
        catch (err) {
            this.#handleError(context, err);
        }
        finally {
            context.response.destroy(closeResources);
            resolve();
            state.handling.delete(handlingPromise);
            if (state.closing) {
                state.server.close();
                state.closed = true;
            }
        }
    }
    addEventListener(type, listener, options) {
        super.addEventListener(type, listener, options);
    }
    fetchEventHandler({ proxy = true, secure = true } = {}) {
        if (this.#eventHandler) {
            return this.#eventHandler;
        }
        this.proxy = proxy;
        return this.#eventHandler = {
            handleEvent: async (requestEvent) => {
                let resolve;
                let reject;
                const responsePromise = new Promise((res, rej) => {
                    resolve = res;
                    reject = rej;
                });
                const respondedPromise = requestEvent.respondWith(responsePromise);
                const response = await this.handle(requestEvent.request, undefined, secure);
                if (response) {
                    resolve(response);
                }
                else {
                    reject(new Error("No response returned from app handler."));
                }
                try {
                    await respondedPromise;
                }
                catch (error) {
                    this.dispatchEvent(new ApplicationErrorEvent({ error }));
                }
            },
        };
    }
    handle = (async (request, secureOrConn, secure = false) => {
        if (!this.#middleware.length) {
            throw new TypeError("There is no middleware to process requests.");
        }
        let contextRequest;
        if (request instanceof Request) {
            assert(isConn(secureOrConn) || typeof secureOrConn === "undefined");
            contextRequest = new NativeRequest({
                request,
                respondWith() {
                    return Promise.resolve(undefined);
                },
            }, { conn: secureOrConn });
        }
        else {
            assert(typeof secureOrConn === "boolean" ||
                typeof secureOrConn === "undefined");
            secure = secureOrConn ?? false;
            contextRequest = request;
        }
        const context = new Context(this, contextRequest, this.#getContextState(), secure);
        try {
            await this.#getComposed()(context);
        }
        catch (err) {
            this.#handleError(context, err);
        }
        if (context.respond === false) {
            context.response.destroy();
            return;
        }
        try {
            const response = contextRequest instanceof NativeRequest
                ? await context.response.toDomResponse()
                : await context.response.toServerResponse();
            context.response.destroy(false);
            return response;
        }
        catch (err) {
            this.#handleError(context, err);
            throw err;
        }
    });
    async listen(options) {
        if (!this.#middleware.length) {
            throw new TypeError("There is no middleware to process requests.");
        }
        if (typeof options === "string") {
            const match = ADDR_REGEXP.exec(options);
            if (!match) {
                throw TypeError(`Invalid address passed: "${options}"`);
            }
            const [, hostname, portStr] = match;
            options = { hostname, port: parseInt(portStr, 10) };
        }
        const server = new this.#serverConstructor(this, options);
        const { signal } = options;
        const state = {
            closed: false,
            closing: false,
            handling: new Set(),
            server,
        };
        if (signal) {
            signal.addEventListener("abort", () => {
                if (!state.handling.size) {
                    server.close();
                    state.closed = true;
                }
                state.closing = true;
            });
        }
        const { hostname, port, secure = false } = options;
        const serverType = server instanceof HttpServerStd
            ? "std"
            : server instanceof HttpServerNative
                ? "native"
                : "custom";
        this.dispatchEvent(new ApplicationListenEvent({ hostname, port, secure, serverType }));
        try {
            for await (const request of server) {
                this.#handleRequest(request, secure, state);
            }
            await Promise.all(state.handling);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Application Error";
            this.dispatchEvent(new ApplicationErrorEvent({ message, error }));
        }
    }
    use(...middleware) {
        this.#middleware.push(...middleware);
        this.#composedMiddleware = undefined;
        return this;
    }
    [Symbol.for("Deno.customInspect")](inspect) {
        const { keys, proxy, state } = this;
        return `${this.constructor.name} ${inspect({ "#middleware": this.#middleware, keys, proxy, state })}`;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhcHBsaWNhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBQ3ZDLE9BQU8sRUFBRSxNQUFNLEVBQVUsV0FBVyxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQ3hELE9BQU8sRUFDTCxhQUFhLEVBQ2IsZ0JBQWdCLEVBQ2hCLGFBQWEsR0FDZCxNQUFNLHlCQUF5QixDQUFDO0FBQ2pDLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUVyRCxPQUFPLEVBQU8sUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzlDLE9BQU8sRUFBRSxPQUFPLEVBQWMsTUFBTSxpQkFBaUIsQ0FBQztBQUN0RCxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFNbkQsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLFdBQVcsQ0FBQztBQTRKbkMsTUFBTSxXQUFXLEdBQUcsK0JBQStCLENBQUM7QUFFcEQsTUFBTSxPQUFPLHFCQUNYLFNBQVEsVUFBVTtJQUNsQixPQUFPLENBQWtCO0lBRXpCLFlBQVksYUFBK0M7UUFDekQsS0FBSyxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQztRQUM5QixJQUFJLENBQUMsT0FBTyxHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQUM7SUFDdkMsQ0FBQztDQUNGO0FBRUQsU0FBUyxnQkFBZ0IsQ0FDdkIsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFnQztJQUVoRCxJQUFJLEtBQUssWUFBWSxLQUFLLEVBQUU7UUFDMUIsT0FBTyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsS0FBSyxDQUFDLElBQUksTUFBTSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztLQUN6RTtTQUFNO1FBQ0wsT0FBTyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxLQUFLLENBQUMsQ0FB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