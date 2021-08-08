import { assert } from "./deps.ts";
import { NativeRequest } from "./http_server_native.ts";
const encoder = new TextEncoder();
const DEFAULT_KEEP_ALIVE_INTERVAL = 30_000;
class CloseEvent extends Event {
    constructor(eventInit) {
        super("close", eventInit);
    }
}
export class ServerSentEvent extends Event {
    #data;
    #id;
    #type;
    constructor(type, data, { replacer, space, ...eventInit } = {}) {
        super(type, eventInit);
        this.#type = type;
        try {
            this.#data = typeof data === "string"
                ? data
                : JSON.stringify(data, replacer, space);
        }
        catch (e) {
            assert(e instanceof Error);
            throw new TypeError(`data could not be coerced into a serialized string.\n  ${e.message}`);
        }
        const { id } = eventInit;
        this.#id = id;
    }
    get data() {
        return this.#data;
    }
    get id() {
        return this.#id;
    }
    toString() {
        const data = `data: ${this.#data.split("\n").join("\ndata: ")}\n`;
        return `${this.#type === "__message" ? "" : `event: ${this.#type}\n`}${this.#id ? `id: ${String(this.#id)}\n` : ""}${data}\n`;
    }
}
const response = `HTTP/1.1 200 OK\n`;
const responseHeaders = new Headers([
    ["Connection", "Keep-Alive"],
    ["Content-Type", "text/event-stream"],
    ["Cache-Control", "no-cache"],
    ["Keep-Alive", `timeout=${Number.MAX_SAFE_INTEGER}`],
]);
export class SSEStreamTarget extends EventTarget {
    #closed = false;
    #context;
    #controller;
    #keepAliveId;
    #error(error) {
        console.log("error", error);
        this.dispatchEvent(new CloseEvent({ cancelable: false }));
        const errorEvent = new ErrorEvent("error", { error });
        this.dispatchEvent(errorEvent);
        this.#context.app.dispatchEvent(errorEvent);
    }
    #push(payload) {
        if (!this.#controller) {
            this.#error(new Error("The controller has not been set."));
            return;
        }
        if (this.#closed) {
            return;
        }
        this.#controller.enqueue(encoder.encode(payload));
    }
    get closed() {
        return this.#closed;
    }
    constructor(context, { headers, keepAlive = false } = {}) {
        super();
        this.#context = context;
        context.response.body = new ReadableStream({
            start: (controller) => {
                this.#controller = controller;
            },
            cancel: (error) => {
                if (error instanceof Error && error.message.includes("connection closed")) {
                    this.close();
                }
                else {
                    this.#error(error);
                }
            },
        });
        if (headers) {
            for (const [key, value] of headers) {
                context.response.headers.set(key, value);
            }
        }
        for (const [key, value] of responseHeaders) {
            context.response.headers.set(key, value);
        }
        this.addEventListener("close", () => {
            this.#closed = true;
            if (this.#keepAliveId != null) {
                clearInterval(this.#keepAliveId);
                this.#keepAliveId = undefined;
            }
            if (this.#controller) {
                try {
                    this.#controller.close();
                }
                catch {
                }
            }
        });
        if (keepAlive) {
            const interval = typeof keepAlive === "number"
                ? keepAlive
                : DEFAULT_KEEP_ALIVE_INTERVAL;
            this.#keepAliveId = setInterval(() => {
                this.dispatchComment("keep-alive comment");
            }, interval);
        }
    }
    close() {
        this.dispatchEvent(new CloseEvent({ cancelable: false }));
        return Promise.resolve();
    }
    dispatchComment(comment) {
        this.#push(`: ${comment.split("\n").join("\n: ")}\n\n`);
        return true;
    }
    dispatchMessage(data) {
        const event = new ServerSentEvent("__message", data);
        return this.dispatchEvent(event);
    }
    dispatchEvent(event) {
        const dispatched = super.dispatchEvent(event);
        if (dispatched && event instanceof ServerSentEvent) {
            this.#push(String(event));
        }
        return dispatched;
    }
    [Symbol.for("Deno.customInspect")](inspect) {
        return `${this.constructor.name} ${inspect({ "#closed": this.#closed, "#context": this.#context })}`;
    }
}
export class SSEStdLibTarget extends EventTarget {
    #app;
    #closed = false;
    #keepAliveId;
    #prev = Promise.resolve();
    #ready;
    #serverRequest;
    #writer;
    async #send(payload, prev) {
        if (this.#closed) {
            return;
        }
        if (this.#ready !== true) {
            await this.#ready;
            this.#ready = true;
        }
        try {
            await prev;
            await this.#writer.write(encoder.encode(payload));
            await this.#writer.flush();
        }
        catch (error) {
            this.dispatchEvent(new CloseEvent({ cancelable: false }));
            const errorEvent = new ErrorEvent("error", { error });
            this.dispatchEvent(errorEvent);
            this.#app.dispatchEvent(errorEvent);
        }
    }
    async #setup(overrideHeaders) {
        const headers = new Headers(responseHeaders);
        if (overrideHeaders) {
            for (const [key, value] of overrideHeaders) {
                headers.set(key, value);
            }
        }
        let payload = response;
        for (const [key, value] of headers) {
            payload += `${key}: ${value}\n`;
        }
        payload += `\n`;
        try {
            await this.#writer.write(encoder.encode(payload));
            await this.#writer.flush();
        }
        catch (error) {
            this.dispatchEvent(new CloseEvent({ cancelable: false }));
            const errorEvent = new ErrorEvent("error", { error });
            this.dispatchEvent(errorEvent);
            this.#app.dispatchEvent(errorEvent);
            throw error;
        }
    }
    get closed() {
        return this.#closed;
    }
    constructor(context, { headers, keepAlive = false } = {}) {
        super();
        this.#app = context.app;
        assert(!(context.request.originalRequest instanceof NativeRequest));
        this.#serverRequest = context.request.originalRequest;
        this.#writer = this.#serverRequest.w;
        this.addEventListener("close", () => {
            this.#closed = true;
            if (this.#keepAliveId != null) {
                clearInterval(this.#keepAliveId);
                this.#keepAliveId = undefined;
            }
            try {
                this.#serverRequest.conn.close();
            }
            catch (error) {
                if (!(error instanceof Deno.errors.BadResource)) {
                    const errorEvent = new ErrorEvent("error", { error });
                    this.dispatchEvent(errorEvent);
                    this.#app.dispatchEvent(errorEvent);
                }
            }
        });
        if (keepAlive) {
            const interval = typeof keepAlive === "number"
                ? keepAlive
                : DEFAULT_KEEP_ALIVE_INTERVAL;
            this.#keepAliveId = setInterval(() => {
                this.dispatchComment("keep-alive comment");
            }, interval);
        }
        this.#ready = this.#setup(headers);
    }
    async close() {
        if (this.#ready !== true) {
            await this.#ready;
        }
        await this.#prev;
        this.dispatchEvent(new CloseEvent({ cancelable: false }));
    }
    dispatchComment(comment) {
        this.#prev = this.#send(`: ${comment.split("\n").join("\n: ")}\n\n`, this.#prev);
        return true;
    }
    dispatchMessage(data) {
        const event = new ServerSentEvent("__message", data);
        return this.dispatchEvent(event);
    }
    dispatchEvent(event) {
        const dispatched = super.dispatchEvent(event);
        if (dispatched && event instanceof ServerSentEvent) {
            this.#prev = this.#send(String(event), this.#prev);
        }
        return dispatched;
    }
    [Symbol.for("Deno.customInspect")](inspect) {
        return `${this.constructor.name} ${inspect({ "closed": this.closed })}`;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyX3NlbnRfZXZlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZXJ2ZXJfc2VudF9ldmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFJQSxPQUFPLEVBQUUsTUFBTSxFQUFhLE1BQU0sV0FBVyxDQUFDO0FBQzlDLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUd4RCxNQUFNLE9BQU8sR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFDO0FBRWxDLE1BQU0sMkJBQTJCLEdBQUcsTUFBTSxDQUFDO0FBK0IzQyxNQUFNLFVBQVcsU0FBUSxLQUFLO0lBQzVCLFlBQVksU0FBb0I7UUFDOUIsS0FBSyxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM1QixDQUFDO0NBQ0Y7QUFJRCxNQUFNLE9BQU8sZUFBZ0IsU0FBUSxLQUFLO0lBQ3hDLEtBQUssQ0FBUztJQUNkLEdBQUcsQ0FBVTtJQUNiLEtBQUssQ0FBUztJQUVkLFlBQ0UsSUFBWSxFQUVaLElBQVMsRUFDVCxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsR0FBRyxTQUFTLEtBQTBCLEVBQUU7UUFFM0QsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN2QixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUNsQixJQUFJO1lBQ0YsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLElBQUksS0FBSyxRQUFRO2dCQUNuQyxDQUFDLENBQUMsSUFBSTtnQkFDTixDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsUUFBK0IsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNsRTtRQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ1YsTUFBTSxDQUFDLENBQUMsWUFBWSxLQUFLLENBQUMsQ0FBQztZQUMzQixNQUFNLElBQUksU0FBUyxDQUNqQiwwREFBMEQsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUN0RSxDQUFDO1NBQ0g7UUFDRCxNQUFN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