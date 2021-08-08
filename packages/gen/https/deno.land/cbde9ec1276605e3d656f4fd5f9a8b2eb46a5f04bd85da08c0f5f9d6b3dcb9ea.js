import { isWebSocketCloseEvent, isWebSocketPingEvent, isWebSocketPongEvent, } from "./deps.ts";
export class WebSocketShim extends EventTarget {
    #binaryType = "blob";
    #protocol = "";
    #readyState = WebSocket.CONNECTING;
    #socket;
    #url;
    #wasClean = false;
    #getBinaryData(data) {
        if (this.#binaryType === "arraybuffer") {
            return data.buffer;
        }
        return new Blob([data]);
    }
    #listen() {
        queueMicrotask(async () => {
            for await (const event of this.#socket) {
                if (this.#readyState === WebSocket.CONNECTING) {
                    this.#readyState = WebSocket.OPEN;
                    this.dispatchEvent(new Event("open", { cancelable: false }));
                }
                if (this.#readyState === WebSocket.CLOSING &&
                    !isWebSocketCloseEvent(event)) {
                    const error = new Error("Received an event while closing.");
                    this.dispatchEvent(new ErrorEvent("error", { error, cancelable: false }));
                }
                if (isWebSocketCloseEvent(event)) {
                    this.#readyState = WebSocket.CLOSED;
                    const { code, reason } = event;
                    const wasClean = this.#wasClean;
                    this.dispatchEvent(new CloseEvent("close", {
                        code,
                        reason,
                        wasClean,
                        cancelable: false,
                    }));
                    return;
                }
                else if (isWebSocketPingEvent(event) || isWebSocketPongEvent(event)) {
                    const [type, data] = event;
                    this.dispatchEvent(new MessageEvent("message", { data: type, cancelable: false }));
                    this.dispatchEvent(new MessageEvent("message", { data, cancelable: false }));
                }
                else {
                    const data = typeof event === "string"
                        ? event
                        : this.#getBinaryData(event);
                    this.dispatchEvent(new MessageEvent("message", { data, cancelable: false }));
                }
                if (this.#readyState === WebSocket.CLOSED) {
                    return;
                }
            }
        });
    }
    get binaryType() {
        return this.#binaryType;
    }
    set binaryType(value) {
        this.#binaryType = value;
    }
    get bufferedAmount() {
        return 0;
    }
    get extensions() {
        return "";
    }
    onclose = null;
    onerror = null;
    onmessage = null;
    onopen = null;
    get protocol() {
        return this.#protocol;
    }
    get readyState() {
        return this.#readyState;
    }
    get url() {
        return this.#url;
    }
    constructor(socket, url, protocol = "") {
        super();
        this.#protocol = protocol;
        this.#socket = socket;
        this.#url = url;
        this.#listen();
    }
    close(code, reason) {
        queueMicrotask(async () => {
            try {
                this.#readyState = WebSocket.CLOSING;
                await this.#socket.close(code, reason);
                this.#wasClean = true;
            }
            catch (error) {
                this.dispatchEvent(new ErrorEvent("error", { error }));
            }
        });
    }
    send(data) {
        queueMicrotask(async () => {
            try {
                let d;
                if (typeof data === "string") {
                    d = data;
                }
                else if (data instanceof Blob) {
                    d = new Uint8Array(await data.arrayBuffer());
                }
                else if (ArrayBuffer.isView(data)) {
                    d = new Uint8Array(data.buffer);
                }
                else {
                    d = new Uint8Array(data);
                }
                await this.#socket.send(d);
            }
            catch (error) {
                this.dispatchEvent(new ErrorEvent("error", { error, cancelable: false }));
            }
        });
    }
    dispatchEvent(event) {
        if (event.type === "error" && this.onerror) {
            this.onerror.call(this, event);
        }
        else if (event.type === "close" && event instanceof CloseEvent && this.onclose) {
            this.onclose.call(this, event);
        }
        else if (event.type === "message" && event instanceof MessageEvent &&
            this.onmessage) {
            this.onmessage.call(this, event);
        }
        else if (event.type === "open" && this.onopen) {
            this.onopen.call(this, event);
        }
        if (!event.defaultPrevented) {
            return super.dispatchEvent(event);
        }
        else {
            return false;
        }
    }
    get CLOSED() {
        return WebSocket.CLOSED;
    }
    get CLOSING() {
        return WebSocket.CLOSING;
    }
    get CONNECTING() {
        return WebSocket.CONNECTING;
    }
    get OPEN() {
        return WebSocket.OPEN;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vic29ja2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsid2Vic29ja2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sRUFDTCxxQkFBcUIsRUFDckIsb0JBQW9CLEVBQ3BCLG9CQUFvQixHQUVyQixNQUFNLFdBQVcsQ0FBQztBQVFuQixNQUFNLE9BQU8sYUFBYyxTQUFRLFdBQVc7SUFDNUMsV0FBVyxHQUFlLE1BQU0sQ0FBQztJQUNqQyxTQUFTLEdBQUcsRUFBRSxDQUFDO0lBQ2YsV0FBVyxHQUFHLFNBQVMsQ0FBQyxVQUFVLENBQUM7SUFDbkMsT0FBTyxDQUFlO0lBQ3RCLElBQUksQ0FBUztJQUNiLFNBQVMsR0FBRyxLQUFLLENBQUM7SUFFbEIsY0FBYyxDQUFDLElBQWdCO1FBQzdCLElBQUksSUFBSSxDQUFDLFdBQVcsS0FBSyxhQUFhLEVBQUU7WUFDdEMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1NBQ3BCO1FBQ0QsT0FBTyxJQUFJLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQUVELE9BQU87UUFDTCxjQUFjLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDeEIsSUFBSSxLQUFLLEVBQUUsTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDdEMsSUFBSSxJQUFJLENBQUMsV0FBVyxLQUFLLFNBQVMsQ0FBQyxVQUFVLEVBQUU7b0JBQzdDLElBQUksQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQztvQkFDbEMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO2lCQUM5RDtnQkFDRCxJQUNFLElBQUksQ0FBQyxXQUFXLEtBQUssU0FBUyxDQUFDLE9BQU87b0JBQ3RDLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLEVBQzdCO29CQUNBLE1BQU0sS0FB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