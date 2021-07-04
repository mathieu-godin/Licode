import { Context } from "./context.ts";
import { assert, STATUS_TEXT } from "./deps.ts";
import { hasNativeHttp, HttpServerNative, NativeRequest, } from "./http_server_native.ts";
import { HttpServerStd } from "./http_server_std.ts";
import { KeyStack } from "./keyStack.ts";
import { compose } from "./middleware.ts";
import { isConn } from "./util.ts";
const ADDR_REGEXP = /^\[?([^\]]*)\]?:([0-9]{1,5})$/;
export class ApplicationErrorEvent extends ErrorEvent {
    context;
    constructor(eventInitDict) {
        super("error", eventInitDict);
        this.context = eventInitDict.context;
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
        const { state, keys, proxy, serverConstructor = hasNativeHttp() ? HttpServerNative : HttpServerStd, } = options;
        this.proxy = proxy ?? false;
        this.keys = keys;
        this.state = state ?? {};
        this.#serverConstructor = serverConstructor;
    }
    #getComposed() {
        if (!this.#composedMiddleware) {
            this.#composedMiddleware = compose(this.#middleware);
        }
        return this.#composedMiddleware;
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
        const context = new Context(this, request, secure);
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
        try {
            if (request instanceof NativeRequest) {
                closeResources = false;
                await request.respond(await context.response.toDomResponse());
            }
            else {
                await request.respond(await context.response.toServerResponse());
            }
            if (state.closing) {
                state.server.close();
                state.closed = true;
            }
        }
        catch (err) {
            this.#handleError(context, err);
        }
        finally {
            context.response.destroy(closeResources);
            resolve();
            state.handling.delete(handlingPromise);
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
            }, secureOrConn);
        }
        else {
            assert(typeof secureOrConn === "boolean" ||
                typeof secureOrConn === "undefined");
            secure = secureOrConn ?? false;
            contextRequest = request;
        }
        const context = new Context(this, contextRequest, secure);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhcHBsaWNhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBQ3ZDLE9BQU8sRUFBRSxNQUFNLEVBQVUsV0FBVyxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQ3hELE9BQU8sRUFDTCxhQUFhLEVBQ2IsZ0JBQWdCLEVBQ2hCLGFBQWEsR0FDZCxNQUFNLHlCQUF5QixDQUFDO0FBQ2pDLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUVyRCxPQUFPLEVBQU8sUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzlDLE9BQU8sRUFBRSxPQUFPLEVBQWMsTUFBTSxpQkFBaUIsQ0FBQztBQU10RCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBNkhuQyxNQUFNLFdBQVcsR0FBRywrQkFBK0IsQ0FBQztBQUVwRCxNQUFNLE9BQU8scUJBQ1gsU0FBUSxVQUFVO0lBQ2xCLE9BQU8sQ0FBa0I7SUFFekIsWUFBWSxhQUErQztRQUN6RCxLQUFLLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQzlCLElBQUksQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FBQztJQUN2QyxDQUFDO0NBQ0Y7QUFFRCxNQUFNLE9BQU8sc0JBQXVCLFNBQVEsS0FBSztJQUMvQyxRQUFRLENBQVU7SUFDbEIsSUFBSSxDQUFTO0lBQ2IsTUFBTSxDQUFVO0lBQ2hCLFVBQVUsQ0FBOEI7SUFFeEMsWUFBWSxhQUF5QztRQUNuRCxLQUFLLENBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxRQUFRLEdBQUcsYUFBYSxDQUFDLFFBQVEsQ0FBQztRQUN2QyxJQUFJLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUM7UUFDL0IsSUFBSSxDQUFDLE1BQU0s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