import { isListenTlsOptions } from "./util.ts";
export const DomResponse = Response;
const serveHttp = "serveHttp" in Deno
    ?
        Deno.serveHttp.bind(Deno)
    : undefined;
const maybeUpgradeWebSocket = "upgradeWebSocket" in Deno
    ?
        Deno.upgradeWebSocket.bind(Deno)
    : undefined;
export function hasNativeHttp() {
    return !!serveHttp;
}
export class NativeRequest {
    #conn;
    #reject;
    #request;
    #requestPromise;
    #resolve;
    #resolved = false;
    #upgradeWebSocket;
    constructor(requestEvent, options = {}) {
        const { conn } = options;
        this.#conn = conn;
        this.#upgradeWebSocket = "upgradeWebSocket" in options
            ? options["upgradeWebSocket"]
            : maybeUpgradeWebSocket;
        this.#request = requestEvent.request;
        const p = new Promise((resolve, reject) => {
            this.#resolve = resolve;
            this.#reject = reject;
        });
        this.#requestPromise = requestEvent.respondWith(p);
    }
    get body() {
        return this.#request.body;
    }
    get donePromise() {
        return this.#requestPromise;
    }
    get headers() {
        return this.#request.headers;
    }
    get method() {
        return this.#request.method;
    }
    get remoteAddr() {
        return this.#conn?.remoteAddr?.hostname;
    }
    get request() {
        return this.#request;
    }
    get url() {
        try {
            const url = new URL(this.#request.url);
            return this.#request.url.replace(url.origin, "");
        }
        catch {
        }
        return this.#request.url;
    }
    get rawUrl() {
        return this.#request.url;
    }
    error(reason) {
        if (this.#resolved) {
            throw new Error("Request already responded to.");
        }
        this.#reject(reason);
        this.#resolved = true;
    }
    respond(response) {
        if (this.#resolved) {
            throw new Error("Request already responded to.");
        }
        this.#resolve(response);
        this.#resolved = true;
        return this.#requestPromise;
    }
    upgrade(options) {
        if (this.#resolved) {
            throw new Error("Request already responded to.");
        }
        if (!this.#upgradeWebSocket) {
            throw new TypeError("Upgrading web sockets not supported.");
        }
        const { response, websocket } = this.#upgradeWebSocket(this.#request, options);
        this.#resolve(response);
        this.#resolved = true;
        return websocket;
    }
}
export class HttpServerNative {
    #app;
    #closed = false;
    #listener;
    #options;
    constructor(app, options) {
        if (!("serveHttp" in Deno)) {
            throw new Error("The native bindings for serving HTTP are not available.");
        }
        this.#app = app;
        this.#options = options;
    }
    get app() {
        return this.#app;
    }
    get closed() {
        return this.#closed;
    }
    close() {
        this.#closed = true;
        if (this.#listener) {
            this.#listener.close();
            this.#listener = undefined;
        }
    }
    [Symbol.asyncIterator]() {
        const start = (controller) => {
            const server = this;
            const listener = this.#listener = isListenTlsOptions(this.#options)
                ? Deno.listenTls(this.#options)
                : Deno.listen(this.#options);
            async function serve(conn) {
                const httpConn = serveHttp(conn);
                while (true) {
                    try {
                        const requestEvent = await httpConn.nextRequest();
                        if (requestEvent === null) {
                            return;
                        }
                        const nativeRequest = new NativeRequest(requestEvent, { conn });
                        controller.enqueue(nativeRequest);
                        await nativeRequest.donePromise;
                    }
                    catch (error) {
                        server.app.dispatchEvent(new ErrorEvent("error", { error }));
                    }
                    if (server.closed) {
                        httpConn.close();
                        controller.close();
                    }
                }
            }
            async function accept() {
                while (true) {
                    try {
                        const conn = await listener.accept();
                        serve(conn);
                    }
                    catch (error) {
                        if (!server.closed) {
                            server.app.dispatchEvent(new ErrorEvent("error", { error }));
                        }
                    }
                    if (server.closed) {
                        controller.close();
                        return;
                    }
                }
            }
            accept();
        };
        const stream = new ReadableStream({ start });
        return stream[Symbol.asyncIterator]();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cF9zZXJ2ZXJfbmF0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cF9zZXJ2ZXJfbmF0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUlBLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUkvQyxNQUFNLENBQUMsTUFBTSxXQUFXLEdBQW9CLFFBQVEsQ0FBQztBQXVCckQsTUFBTSxTQUFTLEdBQWtDLFdBQVcsSUFBSSxJQUFJO0lBQ2xFLENBQUM7UUFDRSxJQUFZLENBQUMsU0FBUyxDQUFDLElBQUksQ0FDMUIsSUFBSSxDQUNMO0lBQ0gsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQVlkLE1BQU0scUJBQXFCLEdBQ3pCLGtCQUFrQixJQUFJLElBQUk7SUFDeEIsQ0FBQztRQUNFLElBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQzNDLENBQUMsQ0FBQyxTQUFTLENBQUM7QUFNaEIsTUFBTSxVQUFVLGFBQWE7SUFDM0IsT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDO0FBQ3JCLENBQUM7QUFPRCxNQUFNLE9BQU8sYUFBYTtJQUN4QixLQUFLLENBQWE7SUFFbEIsT0FBTyxDQUEwQjtJQUNqQyxRQUFRLENBQVU7SUFDbEIsZUFBZSxDQUFnQjtJQUMvQixRQUFRLENBQTZCO0lBQ3JDLFNBQVMsR0FBRyxLQUFLLENBQUM7SUFDbEIsaUJBQWlCLENBQXNCO0lBRXZDLFlBQ0UsWUFBMEIsRUFDMUIsVUFBZ0MsRUFBRTtRQUVsQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBRWxCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxrQkFBa0IsSUFBSSxPQUFPO1lBQ3BELENBQUMsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUM7WUFDN0IsQ0FBQyxDQUFDLHFCQUFxQixDQUFDO1FBQzFCLElBQUksQ0FBQyxRQUFRLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQztRQUNyQyxNQUFNLENBQUMsR0FBRyxJQUFJLE9BQU8sQ0FBVyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNsRCxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUN4QixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztRQUN4QixDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxlQUFlLEdBQUcsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBRUQsSUFBSSxJQUFJO1FBQ04sT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztJQUM1QixDQUFDO0lBRUQsSUFBSSxXQUFXO1FBQ2IsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO0lBQzlCLENBQUM7SUFFRCxJQUFJLE9BQU87UUFDVCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDO0lBQy9CLENBQUM7SUFFRCxJQUFJLE1BQU07UUFDUixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO0lBQzlCLENBQUM7SUFFRCxJQUFJLFVBQVU7UUFDWixPQUFRLElBQUksQ0FBQyxLQUFLLEVBQUUsVUFBMkIsRUFBRSxRQUFRLENBQUM7SUFDNUQsQ0FBQztJQUVELElBQUksT0FBTztRQUNULE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztJQUN2QixDQUFDO0lBRUQsSUFBSSxHQUFHO1FBQ0wsSUFBSTtZQUNGLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdkMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztTQUNsRDtRQUFDLE1BQU07U0FFUDtRQUNELE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7SUFDM0IsQ0FBQztJQUVELElBQUksTUFBTTtRQUNSLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7SUFDM0IsQ0FBQztJQUdELEtBQUssQ0FBQyxNQUFZO1FBQ2hCLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUM7U0FDbEQ7UUFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3JCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO0lBQ3hCLENBQUM7SUFFRCxPQUFPLENBQUMsUUFBa0I7UUFDeEIsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2xCLE1BQU0sSUFBSSxLQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQztTQUNsRDtRQUNELElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDeEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDdEIsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO0lBQzlCLENBQUM7SUFFRCxPQUFPLENBQUMsT0FBaUM7UUFDdkMsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2xCLE1BQU0sSUFBSSxLQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQztTQUNsRDtRQUNELElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUU7WUFDM0IsTUFBTSxJQUFJLFNBQVMsQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO1NBQzdEO1FBQ0QsTUFBTSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQ3BELElBQUksQ0FBQyxRQUFRLEVBQ2IsT0FBTyxDQUNSLENBQUM7UUFDRixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3hCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ3RCLE9BQU8sU0FBUyxDQUFDO0lBQ25CLENBQUM7Q0FDRjtBQUdELE1BQU0sT0FBTyxnQkFBZ0I7SUFFM0IsSUFBSSxDQUFrQjtJQUN0QixPQUFPLEdBQUcsS0FBSyxDQUFDO0lBQ2hCLFNBQVMsQ0FBaUI7SUFDMUIsUUFBUSxDQUE2QztJQUVyRCxZQUNFLEdBQW9CLEVBQ3BCLE9BQW1EO1FBRW5ELElBQUksQ0FBQyxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsRUFBRTtZQUMxQixNQUFNLElBQUksS0FBSyxDQUNiLHlEQUF5RCxDQUMxRCxDQUFDO1NBQ0g7UUFDRCxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUNoQixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztJQUMxQixDQUFDO0lBRUQsSUFBSSxHQUFHO1FBQ0wsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ25CLENBQUM7SUFFRCxJQUFJLE1BQU07UUFDUixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7SUFDdEIsQ0FBQztJQUVELEtBQUs7UUFDSCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNwQixJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDbEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN2QixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztTQUM1QjtJQUNILENBQUM7SUFFRCxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUM7UUFDcEIsTUFBTSxLQUFLLEdBQTJELENBQ3BFLFVBQVUsRUFDVixFQUFFO1lBRUYsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDO1lBQ3BCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLEdBQUcsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztnQkFDakUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztnQkFDL0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRS9CLEtBQUssVUFBVSxLQUFLLENBQUMsSUFBZTtnQkFDbEMsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNqQyxPQUFPLElBQUksRUFBRTtvQkFDWCxJQUFJO3dCQUNGLE1BQU0sWUFBWSxHQUFHLE1BQU0sUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO3dCQUNsRCxJQUFJLFlBQVksS0FBSyxJQUFJLEVBQUU7NEJBQ3pCLE9BQU87eUJBQ1I7d0JBQ0QsTUFBTSxhQUFhLEdBQUcsSUFBSSxhQUFhLENBQUMsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQzt3QkFDaEUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQzt3QkFDbEMsTUFBTSxhQUFhLENBQUMsV0FBVyxDQUFDO3FCQUNqQztvQkFBQyxPQUFPLEtBQUssRUFBRTt3QkFDZCxNQUFNLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7cUJBQzlEO29CQUNELElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRTt3QkFDakIsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUNqQixVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7cUJBQ3BCO2lCQUNGO1lBQ0gsQ0FBQztZQUVELEtBQUssVUFBVSxNQUFNO2dCQUNuQixPQUFPLElBQUksRUFBRTtvQkFDWCxJQUFJO3dCQUNGLE1BQU0sSUFBSSxHQUFHLE1BQU0sUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO3dCQUNyQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7cUJBQ2I7b0JBQUMsT0FBTyxLQUFLLEVBQUU7d0JBQ2QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7NEJBQ2xCLE1BQU0sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksVUFBVSxDQUFDLE9BQU8sRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQzt5QkFDOUQ7cUJBQ0Y7b0JBQ0QsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFO3dCQUNqQixVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQ25CLE9BQU87cUJBQ1I7aUJBQ0Y7WUFDSCxDQUFDO1lBRUQsTUFBTSxFQUFFLENBQUM7UUFDWCxDQUFDLENBQUM7UUFDRixNQUFNLE1BQU0sR0FBRyxJQUFJLGNBQWMsQ0FBZ0IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBRTVELE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDO0lBQ3hDLENBQUM7Q0FDRiJ9