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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbm5lY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUNMLGdCQUFnQixFQUNoQixhQUFhLEVBQ2IsU0FBUyxFQUNULG9CQUFvQixHQUNyQixNQUFNLHNCQUFzQixDQUFDO0FBQzlCLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDbEMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ3ZELE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUN6RCxPQUFPLEVBQUUsYUFBYSxFQUFFLFVBQVUsRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBQ2hFLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUN0RCxPQUFPLEVBQ0wsVUFBVSxFQUNWLFNBQVMsRUFDVCxjQUFjLEdBQ2YsTUFBTSxnQ0FBZ0MsQ0FBQztBQUN4QyxPQUFPLEVBQWEsVUFBVSxFQUFFLFFBQVEsRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBQzlFLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUNsRCxPQUFPLFVBQVUsTUFBTSx3QkFBd0IsQ0FBQztBQUtoRCxNQUFNLENBQU4sSUFBWSxlQUtYO0FBTEQsV0FBWSxlQUFlO0lBQ3pCLGlFQUFVLENBQUE7SUFDViwrREFBUyxDQUFBO0lBQ1QsMkRBQU8sQ0FBQTtJQUNQLHlEQUFNLENBQUE7QUFDUixDQUFDLEVBTFcsZUFBZSxLQUFmLGVBQWUsUUFLMUI7QUFjRCxNQUFNLE9BQU8sVUFBVTtJQWNBO0lBYnJCLEtBQUssR0FBb0IsZUFBZSxDQUFDLFVBQVUsQ0FBQztJQUNwRCxZQUFZLEdBQVcsQ0FBQyxDQUFDO0lBQ3pCLGFBQWEsR0FBVyxFQUFFLENBQUM7SUFFbkIsSUFBSSxHQUFlLFNBQVMsQ0FBQztJQUM3QixTQUFTLEdBQUcsS0FBSyxD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