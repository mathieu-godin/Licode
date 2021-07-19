import { ConnnectionError, ProtocolError, ReadError, ResponseTimeoutError, } from "./constant/errors.ts";
import { log } from "./logger.ts";
import { buildAuth } from "./packets/builders/auth.ts";
import { buildQuery } from "./packets/builders/query.ts";
import { ReceivePacket, SendPacket } from "./packets/packet.ts";
import { parseError } from "./packets/parsers/err.ts";
import { AuthResult, parseAuth, parseHandshake, } from "./packets/parsers/handshake.ts";
import { parseField, parseRow } from "./packets/parsers/result.ts";
import { PacketType } from "./constant/packet.ts";
import authPlugin from "./auth_plugin/index.ts";
export var ConnectionState;
(function (ConnectionState) {
    ConnectionState[ConnectionState["CONNECTING"] = 0] = "CONNECTING";
    ConnectionState[ConnectionState["CONNECTED"] = 1] = "CONNECTED";
    ConnectionState[ConnectionState["CLOSING"] = 2] = "CLOSING";
    ConnectionState[ConnectionState["CLOSED"] = 3] = "CLOSED";
})(ConnectionState || (ConnectionState = {}));
export class Connection {
    config;
    state = ConnectionState.CONNECTING;
    capabilities = 0;
    serverVersion = "";
    conn = undefined;
    _timedOut = false;
    get remoteAddr() {
        return this.config.socketPath
            ? `unix:${this.config.socketPath}`
            : `${this.config.hostname}:${this.config.port}`;
    }
    constructor(config) {
        this.config = config;
    }
    async _connect() {
        const { hostname, port = 3306, socketPath, username = "", password } = this.config;
        log.info(`connecting ${this.remoteAddr}`);
        this.conn = !socketPath
            ? await Deno.connect({
                transport: "tcp",
                hostname,
                port,
            })
            : await Deno.connect({
                transport: "unix",
                path: socketPath,
            });
        try {
            let receive = await this.nextPacket();
            const handshakePacket = parseHandshake(receive.body);
            const data = buildAuth(handshakePacket, {
                username,
                password,
                db: this.config.db,
            });
            await new SendPacket(data, 0x1).send(this.conn);
            this.state = ConnectionState.CONNECTING;
            this.serverVersion = handshakePacket.serverVersion;
            this.capabilities = handshakePacket.serverCapabilities;
            receive = await this.nextPacket();
            const authResult = parseAuth(receive);
            let handler;
            switch (authResult) {
                case AuthResult.AuthMoreRequired:
                    const adaptedPlugin = authPlugin[handshakePacket.authPluginName];
                    handler = adaptedPlugin;
                    break;
                case AuthResult.MethodMismatch:
                    throw new Error("Currently cannot support auth method mismatch!");
            }
            let result;
            if (handler) {
                result = handler.start(handshakePacket.seed, password);
                while (!result.done) {
                    if (result.data) {
                        const sequenceNumber = receive.header.no + 1;
                        await new SendPacket(result.data, sequenceNumber).send(this.conn);
                        receive = await this.nextPacket();
                    }
                    if (result.quickRead) {
                        await this.nextPacket();
                    }
                    if (result.next) {
                        result = result.next(receive);
                    }
                }
            }
            const header = receive.body.readUint8();
            if (header === 0xff) {
                const error = parseError(receive.body, this);
                log.error(`connect error(${error.code}): ${error.message}`);
                this.close();
                throw new Error(error.message);
            }
            else {
                log.info(`connected to ${this.remoteAddr}`);
                this.state = ConnectionState.CONNECTED;
            }
            if (this.config.charset) {
                await this.execute(`SET NAMES ${this.config.charset}`);
            }
        }
        catch (error) {
            this.close();
            throw error;
        }
    }
    async connect() {
        await this._connect();
    }
    async nextPacket() {
        if (!this.conn) {
            throw new ConnnectionError("Not connected");
        }
        const timeoutTimer = this.config.timeout
            ? setTimeout(this._timeoutCallback, this.config.timeout)
            : null;
        let packet;
        try {
            packet = await new ReceivePacket().parse(this.conn);
        }
        catch (error) {
            if (this._timedOut) {
                throw new ResponseTimeoutError("Connection read timed out");
            }
            timeoutTimer && clearTimeout(timeoutTimer);
            this.close();
            throw error;
        }
        timeoutTimer && clearTimeout(timeoutTimer);
        if (!packet) {
            this.close();
            throw new ReadError("Connection closed unexpectedly");
        }
        if (packet.type === PacketType.ERR_Packet) {
            packet.body.skip(1);
            const error = parseError(packet.body, this);
            throw new Error(error.message);
        }
        return packet;
    }
    _timeoutCallback = () => {
        log.info("connection read timed out");
        this._timedOut = true;
        this.close();
    };
    lessThan5_7() {
        const version = this.serverVersion;
        if (!version.includes("MariaDB"))
            return version < "5.7.0";
        const segments = version.split("-");
        if (segments[1] === "MariaDB")
            return segments[0] < "5.7.0";
        return false;
    }
    isMariaDBAndVersion10_0Or10_1() {
        const version = this.serverVersion;
        if (!version.includes("MariaDB"))
            return false;
        return version.includes("5.5.5-10.1") || version.includes("5.5.5-10.0");
    }
    close() {
        if (this.state != ConnectionState.CLOSED) {
            log.info("close connection");
            this.conn?.close();
            this.state = ConnectionState.CLOSED;
        }
    }
    async query(sql, params) {
        const result = await this.execute(sql, params);
        if (result && result.rows) {
            return result.rows;
        }
        else {
            return result;
        }
    }
    async execute(sql, params, iterator = false) {
        if (this.state != ConnectionState.CONNECTED) {
            if (this.state == ConnectionState.CLOSED) {
                throw new ConnnectionError("Connection is closed");
            }
            else {
                throw new ConnnectionError("Must be connected first");
            }
        }
        const data = buildQuery(sql, params);
        try {
            await new SendPacket(data, 0).send(this.conn);
            let receive = await this.nextPacket();
            if (receive.type === PacketType.OK_Packet) {
                receive.body.skip(1);
                return {
                    affectedRows: receive.body.readEncodedLen(),
                    lastInsertId: receive.body.readEncodedLen(),
                };
            }
            else if (receive.type !== PacketType.Result) {
                throw new ProtocolError();
            }
            let fieldCount = receive.body.readEncodedLen();
            const fields = [];
            while (fieldCount--) {
                const packet = await this.nextPacket();
                if (packet) {
                    const field = parseField(packet.body);
                    fields.push(field);
                }
            }
            const rows = [];
            if (this.lessThan5_7() || this.isMariaDBAndVersion10_0Or10_1()) {
                receive = await this.nextPacket();
                if (receive.type !== PacketType.EOF_Packet) {
                    throw new ProtocolError();
                }
            }
            if (!iterator) {
                while (true) {
                    receive = await this.nextPacket();
                    if (receive.type === PacketType.EOF_Packet) {
                        break;
                    }
                    else {
                        const row = parseRow(receive.body, fields);
                        rows.push(row);
                    }
                }
                return { rows, fields };
            }
            return {
                fields,
                iterator: this.buildIterator(fields),
            };
        }
        catch (error) {
            this.close();
            throw error;
        }
    }
    buildIterator(fields) {
        const next = async () => {
            const receive = await this.nextPacket();
            if (receive.type === PacketType.EOF_Packet) {
                return { done: true };
            }
            const value = parseRow(receive.body, fields);
            return {
                done: false,
                value,
            };
        };
        return {
            [Symbol.asyncIterator]: () => {
                return {
                    next,
                };
            },
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbXlzcWxAdjIuOS4wL3NyYy9jb25uZWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFDTCxnQkFBZ0IsRUFDaEIsYUFBYSxFQUNiLFNBQVMsRUFDVCxvQkFBb0IsR0FDckIsTUFBTSxzQkFBc0IsQ0FBQztBQUM5QixPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQ2xDLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUN2RCxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFDekQsT0FBTyxFQUFFLGFBQWEsRUFBRSxVQUFVLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUNoRSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDdEQsT0FBTyxFQUNMLFVBQVUsRUFDVixTQUFTLEVBQ1QsY0FBYyxHQUNmLE1BQU0sZ0NBQWdDLENBQUM7QUFDeEMsT0FBTyxFQUFhLFVBQVUsRUFBRSxRQUFRLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUM5RSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDbEQsT0FBTyxVQUFVLE1BQU0sd0JBQXdCLENBQUM7QUFLaEQsTUFBTSxDQUFOLElBQVksZUFLWDtBQUxELFdBQVksZUFBZTtJQUN6QixpRUFBVSxDQUFBO0lBQ1YsK0RBQVMsQ0FBQTtJQUNULDJEQUFPLENBQUE7SUFDUCx5REFBTSxDQUFBO0FBQ1IsQ0FBQyxFQUxXLGVBQWUsS0FBZixlQUFlLFFBSzFCO0FBY0QsTUFBTSxPQUFPLFVBQVU7SUFjQTtJQWJyQixLQUFLLEdBQW9CLGVBQWUsQ0FBQyxVQUFVLENBQUM7SUFDcEQsWUFBWSxHQUFXLENBQUMsQ0FBQztJQUN6QixhQUFhLEdBQVcsRUFBRSxDQUFDO0lBRW5CLElBQUks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