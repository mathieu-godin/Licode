import { Cookies } from "./cookies.ts";
import { acceptable, acceptWebSocket } from "./deps.ts";
import { NativeRequest } from "./http_server_native.ts";
import { createHttpError } from "./httpError.ts";
import { Request } from "./request.ts";
import { Response } from "./response.ts";
import { send } from "./send.ts";
import { SSEStdLibTarget, SSEStreamTarget, } from "./server_sent_event.ts";
import { WebSocketShim } from "./websocket.ts";
export class Context {
    #socket;
    #sse;
    app;
    cookies;
    get isUpgradable() {
        return acceptable(this.request);
    }
    respond;
    request;
    response;
    get socket() {
        return this.#socket;
    }
    state;
    constructor(app, serverRequest, state, secure = false) {
        this.app = app;
        this.state = state;
        this.request = new Request(serverRequest, app.proxy, secure);
        this.respond = true;
        this.response = new Response(this.request);
        this.cookies = new Cookies(this.request, this.response, {
            keys: this.app.keys,
            secure: this.request.secure,
        });
    }
    assert(condition, errorStatus = 500, message, props) {
        if (condition) {
            return;
        }
        const err = createHttpError(errorStatus, message);
        if (props) {
            Object.assign(err, props);
        }
        throw err;
    }
    send(options) {
        const { path = this.request.url.pathname, ...sendOptions } = options;
        return send(this, path, sendOptions);
    }
    sendEvents(options) {
        if (!this.#sse) {
            if (this.request.originalRequest instanceof NativeRequest) {
                this.#sse = new SSEStreamTarget(this, options);
            }
            else {
                this.respond = false;
                this.#sse = new SSEStdLibTarget(this, options);
            }
        }
        return this.#sse;
    }
    throw(errorStatus, message, props) {
        const err = createHttpError(errorStatus, message);
        if (props) {
            Object.assign(err, props);
        }
        throw err;
    }
    async upgrade(options) {
        if (this.#socket) {
            return this.#socket;
        }
        if (this.request.originalRequest instanceof NativeRequest) {
            this.#socket = this.request.originalRequest.upgrade(options);
        }
        else {
            const { conn, r: bufReader, w: bufWriter, headers } = this.request.originalRequest;
            this.#socket = new WebSocketShim(await acceptWebSocket({ conn, bufReader, bufWriter, headers }), this.request.url.toString(), options?.protocol);
        }
        this.respond = false;
        return this.#socket;
    }
    [Symbol.for("Deno.customInspect")](inspect) {
        const { app, cookies, isUpgradable, respond, request, response, socket, state, } = this;
        return `${this.constructor.name} ${inspect({
            app,
            cookies,
            isUpgradable,
            respond,
            request,
            response,
            socket,
            state,
        })}`;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbnRleHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0EsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUN2QyxPQUFPLEVBQUUsVUFBVSxFQUFFLGVBQWUsRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUN4RCxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFFeEQsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBRWpELE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDdkMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUN6QyxPQUFPLEVBQUUsSUFBSSxFQUFlLE1BQU0sV0FBVyxDQUFDO0FBQzlDLE9BQU8sRUFFTCxlQUFlLEVBQ2YsZUFBZSxHQUNoQixNQUFNLHdCQUF3QixDQUFDO0FBR2hDLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQVkvQyxNQUFNLE9BQU8sT0FBTztJQUtsQixPQUFPLENBQWE7SUFDcEIsSUFBSSxDQUF5QjtJQUc3QixHQUFHLENBQWtCO0lBSXJCLE9BQU8sQ0FBVTtJQUtqQixJQUFJLFlBQVk7UUFDZCxPQUFPLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQVVELE9BQU8sQ0FBVTtJQUdqQixPQUFPLENBQVU7SUFJakIsUUFBUSxDQUFXO0lBSW5CLElBQUksTUFBTTtRQUNSLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUN0QixDQUFDO0lBc0JELEtBQUssQ0FBSTtJQUVULFlBQ0UsR0FBb0IsRUFDcEIsYUFBNEMsRUFDNUMsS0FBUSxFQUNSLE1BQU0sR0FBRyxLQUFLO1FBRWQsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDZixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FB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