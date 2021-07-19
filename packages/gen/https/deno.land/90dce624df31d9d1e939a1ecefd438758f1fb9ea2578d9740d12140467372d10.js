/*!
 * Substantial parts adapted from https://github.com/brianc/node-postgres
 * which is licensed as follows:
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2010 - 2019 Brian Carlson
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { bold, BufReader, BufWriter, yellow } from "../deps.ts";
import { DeferredStack } from "./deferred.ts";
import { hashMd5Password, readUInt32BE } from "../utils.ts";
import { PacketReader } from "./packet_reader.ts";
import { PacketWriter } from "./packet_writer.ts";
import { parseError, parseNotice } from "./warning.ts";
import { QueryArrayResult, QueryObjectResult, ResultType, } from "../query/query.ts";
import * as scram from "./scram.ts";
export var Format;
(function (Format) {
    Format[Format["TEXT"] = 0] = "TEXT";
    Format[Format["BINARY"] = 1] = "BINARY";
})(Format || (Format = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["Idle"] = "I";
    TransactionStatus["IdleInTransaction"] = "T";
    TransactionStatus["InFailedTransaction"] = "E";
})(TransactionStatus || (TransactionStatus = {}));
function assertArgumentsResponse(msg) {
    switch (msg.type) {
        case "2":
            break;
        case "E":
            throw parseError(msg);
        default:
            throw new Error(`Unexpected frame: ${msg.type}`);
    }
}
function assertSuccessfulStartup(msg) {
    switch (msg.type) {
        case "E":
            throw parseError(msg);
    }
}
function assertSuccessfulAuthentication(auth_message) {
    if (auth_message.type === "E") {
        throw parseError(auth_message);
    }
    else if (auth_message.type !== "R") {
        throw new Error(`Unexpected auth response: ${auth_message.type}.`);
    }
    const responseCode = auth_message.reader.readInt32();
    if (responseCode !== 0) {
        throw new Error(`Unexpected auth response code: ${responseCode}.`);
    }
}
function assertQueryResponse(msg) {
    switch (msg.type) {
        case "1":
            break;
        case "E":
            throw parseError(msg);
        default:
            throw new Error(`Unexpected frame: ${msg.type}`);
    }
}
export class Message {
    type;
    byteCount;
    body;
    reader;
    constructor(type, byteCount, body) {
        this.type = type;
        this.byteCount = byteCount;
        this.body = body;
        this.reader = new PacketReader(body);
    }
}
export class Column {
    name;
    tableOid;
    index;
    typeOid;
    columnLength;
    typeModifier;
    format;
    constructor(name, tableOid, index, typeOid, columnLength, typeModifier, format) {
        this.name = name;
        this.tableOid = tableOid;
        this.index = index;
        this.typeOid = typeOid;
        this.columnLength = columnLength;
        this.typeModifier = typeModifier;
        this.format = format;
    }
}
export class RowDescription {
    columnCount;
    columns;
    constructor(columnCount, columns) {
        this.columnCount = columnCount;
        this.columns = columns;
    }
}
const decoder = new TextDecoder();
const encoder = new TextEncoder();
export class Connection {
    connParams;
    #bufReader;
    #bufWriter;
    #conn;
    connected = false;
    #packetWriter = new PacketWriter();
    #parameters = {};
    #pid;
    #queryLock = new DeferredStack(1, [undefined]);
    #secretKey;
    #transactionStatus;
    constructor(connParams) {
        this.connParams = connParams;
    }
    async readMessage() {
        const header = new Uint8Array(5);
        await this.#bufReader.readFull(header);
        const msgType = decoder.decode(header.slice(0, 1));
        const msgLength = readUInt32BE(header, 1) - 4;
        const msgBody = new Uint8Array(msgLength);
        await this.#bufReader.readFull(msgBody);
        return new Message(msgType, msgLength, msgBody);
    }
    async serverAcceptsTLS() {
        const writer = this.#packetWriter;
        writer.clear();
        writer
            .addInt32(8)
            .addInt32(80877103)
            .join();
        await this.#bufWriter.write(writer.flush());
        await this.#bufWriter.flush();
        const response = new Uint8Array(1);
        await this.#conn.read(response);
        switch (String.fromCharCode(response[0])) {
            case "S":
                return true;
            case "N":
                return false;
            default:
                throw new Error(`Could not check if server accepts SSL connections, server responded with: ${response}`);
        }
    }
    async sendStartupMessage() {
        const writer = this.#packetWriter;
        writer.clear();
        writer.addInt16(3).addInt16(0);
        const connParams = this.connParams;
        writer.addCString("user").addCString(connParams.user);
        writer.addCString("database").addCString(connParams.database);
        writer.addCString("application_name").addCString(connParams.applicationName);
        writer.addCString("client_encoding").addCString("'utf-8'");
        writer.addCString("");
        const bodyBuffer = writer.flush();
        const bodyLength = bodyBuffer.length + 4;
        writer.clear();
        const finalBuffer = writer
            .addInt32(bodyLength)
            .add(bodyBuffer)
            .join();
        await this.#bufWriter.write(finalBuffer);
        await this.#bufWriter.flush();
        return await this.readMessage();
    }
    async startup() {
        const { hostname, port, tls: { enforce: enforceTLS, }, } = this.connParams;
        this.#conn = await Deno.connect({ port, hostname });
        this.#bufWriter = new BufWriter(this.#conn);
        if (await this.serverAcceptsTLS()) {
            try {
                if ("startTls" in Deno) {
                    this.#conn = await Deno.startTls(this.#conn, { hostname });
                }
                else {
                    throw new Error("You need to execute Deno with the `--unstable` argument in order to stablish a TLS connection");
                }
            }
            catch (e) {
                if (!enforceTLS) {
                    console.error(bold(yellow("TLS connection failed with message: ")) +
                        e.message +
                        "\n" +
                        bold("Defaulting to non-encrypted connection"));
                    this.#conn = await Deno.connect({ port, hostname });
                }
                else {
                    throw e;
                }
            }
            this.#bufWriter = new BufWriter(this.#conn);
        }
        else if (enforceTLS) {
            throw new Error("The server isn't accepting TLS connections. Change the client configuration so TLS configuration isn't required to connect");
        }
        this.#bufReader = new BufReader(this.#conn);
        try {
            const startup_response = await this.sendStartupMessage();
            assertSuccessfulStartup(startup_response);
            await this.authenticate(startup_response);
            let msg;
            connection_status: while (true) {
                msg = await this.readMessage();
                switch (msg.type) {
                    case "E":
                        await this.processError(msg, false);
                        break;
                    case "K":
                        this._processBackendKeyData(msg);
                        break;
                    case "S":
                        this._processParameterStatus(msg);
                        break;
                    case "Z": {
                        this._processReadyForQuery(msg);
                        break connection_status;
                    }
                    default:
                        throw new Error(`Unknown response for startup: ${msg.type}`);
                }
            }
            this.connected = true;
        }
        catch (e) {
            this.#conn.close();
            throw e;
        }
    }
    async authenticate(msg) {
        const code = msg.reader.readInt32();
        switch (code) {
            case 0:
                break;
            case 3:
                await assertSuccessfulAuthentication(await this.authenticateWithClearPassword());
                break;
            case 5: {
                const salt = msg.reader.readBytes(4);
                await assertSuccessfulAuthentication(await this.authenticateWithMd5(salt));
                break;
            }
            case 7: {
                throw new Error("Database server expected gss authentication, which is not supported at the moment");
            }
            case 10: {
                await assertSuccessfulAuthentication(await this.authenticateWithScramSha256());
                break;
            }
            default:
                throw new Error(`Unknown auth message code ${code}`);
        }
    }
    async authenticateWithClearPassword() {
        this.#packetWriter.clear();
        const password = this.connParams.password || "";
        const buffer = this.#packetWriter.addCString(password).flush(0x70);
        await this.#bufWriter.write(buffer);
        await this.#bufWriter.flush();
        return this.readMessage();
    }
    async authenticateWithMd5(salt) {
        this.#packetWriter.clear();
        if (!this.connParams.password) {
            throw new Error("Auth Error: attempting MD5 auth with password unset");
        }
        const password = hashMd5Password(this.connParams.password, this.connParams.user, salt);
        const buffer = this.#packetWriter.addCString(password).flush(0x70);
        await this.#bufWriter.write(buffer);
        await this.#bufWriter.flush();
        return this.readMessage();
    }
    async authenticateWithScramSha256() {
        if (!this.connParams.password) {
            throw new Error("Auth Error: attempting SCRAM-SHA-256 auth with password unset");
        }
        const client = new scram.Client(this.connParams.user, this.connParams.password);
        const utf8 = new TextDecoder("utf-8");
        const clientFirstMessage = client.composeChallenge();
        this.#packetWriter.clear();
        this.#packetWriter.addCString("SCRAM-SHA-256");
        this.#packetWriter.addInt32(clientFirstMessage.length);
        this.#packetWriter.addString(clientFirstMessage);
        this.#bufWriter.write(this.#packetWriter.flush(0x70));
        this.#bufWriter.flush();
        const saslContinue = await this.readMessage();
        switch (saslContinue.type) {
            case "R": {
                if (saslContinue.reader.readInt32() != 11) {
                    throw new Error("AuthenticationSASLContinue is expected");
                }
                break;
            }
            case "E": {
                throw parseError(saslContinue);
            }
            default: {
                throw new Error("unexpected message");
            }
        }
        const serverFirstMessage = utf8.decode(saslContinue.reader.readAllBytes());
        client.receiveChallenge(serverFirstMessage);
        const clientFinalMessage = client.composeResponse();
        this.#packetWriter.clear();
        this.#packetWriter.addString(clientFinalMessage);
        this.#bufWriter.write(this.#packetWriter.flush(0x70));
        this.#bufWriter.flush();
        const saslFinal = await this.readMessage();
        switch (saslFinal.type) {
            case "R": {
                if (saslFinal.reader.readInt32() !== 12) {
                    throw new Error("AuthenticationSASLFinal is expected");
                }
                break;
            }
            case "E": {
                throw parseError(saslFinal);
            }
            default: {
                throw new Error("unexpected message");
            }
        }
        const serverFinalMessage = utf8.decode(saslFinal.reader.readAllBytes());
        client.receiveResponse(serverFinalMessage);
        return this.readMessage();
    }
    _processBackendKeyData(msg) {
        this.#pid = msg.reader.readInt32();
        this.#secretKey = msg.reader.readInt32();
    }
    _processParameterStatus(msg) {
        const key = msg.reader.readCString();
        const value = msg.reader.readCString();
        this.#parameters[key] = value;
    }
    _processReadyForQuery(msg) {
        const txStatus = msg.reader.readByte();
        this.#transactionStatus = String.fromCharCode(txStatus);
    }
    async _readReadyForQuery() {
        const msg = await this.readMessage();
        if (msg.type !== "Z") {
            throw new Error(`Unexpected message type: ${msg.type}, expected "Z" (ReadyForQuery)`);
        }
        this._processReadyForQuery(msg);
    }
    async _simpleQuery(query) {
        this.#packetWriter.clear();
        const buffer = this.#packetWriter.addCString(query.text).flush(0x51);
        await this.#bufWriter.write(buffer);
        await this.#bufWriter.flush();
        let result;
        if (query.result_type === ResultType.ARRAY) {
            result = new QueryArrayResult(query);
        }
        else {
            result = new QueryObjectResult(query);
        }
        let msg;
        msg = await this.readMessage();
        switch (msg.type) {
            case "T":
                result.loadColumnDescriptions(this.parseRowDescription(msg));
                break;
            case "n":
                break;
            case "E":
                await this.processError(msg);
                break;
            case "N":
                result.warnings.push(await this.processNotice(msg));
                break;
            case "C": {
                const commandTag = this.getCommandTag(msg);
                result.handleCommandComplete(commandTag);
                result.done();
                break;
            }
            default:
                throw new Error(`Unexpected frame: ${msg.type}`);
        }
        while (true) {
            msg = await this.readMessage();
            switch (msg.type) {
                case "D": {
                    result.insertRow(this.parseRowData(msg));
                    break;
                }
                case "C": {
                    const commandTag = this.getCommandTag(msg);
                    result.handleCommandComplete(commandTag);
                    result.done();
                    break;
                }
                case "Z":
                    this._processReadyForQuery(msg);
                    return result;
                case "E":
                    await this.processError(msg);
                    break;
                case "N":
                    result.warnings.push(await this.processNotice(msg));
                    break;
                case "T":
                    result.loadColumnDescriptions(this.parseRowDescription(msg));
                    break;
                default:
                    throw new Error(`Unexpected frame: ${msg.type}`);
            }
        }
    }
    async appendQueryToMessage(query) {
        this.#packetWriter.clear();
        const buffer = this.#packetWriter
            .addCString("")
            .addCString(query.text)
            .addInt16(0)
            .flush(0x50);
        await this.#bufWriter.write(buffer);
    }
    async appendArgumentsToMessage(query) {
        this.#packetWriter.clear();
        const hasBinaryArgs = query.args.some((arg) => arg instanceof Uint8Array);
        this.#packetWriter.clear();
        this.#packetWriter
            .addCString("")
            .addCString("");
        if (hasBinaryArgs) {
            this.#packetWriter.addInt16(query.args.length);
            query.args.forEach((arg) => {
                this.#packetWriter.addInt16(arg instanceof Uint8Array ? 1 : 0);
            });
        }
        else {
            this.#packetWriter.addInt16(0);
        }
        this.#packetWriter.addInt16(query.args.length);
        query.args.forEach((arg) => {
            if (arg === null || typeof arg === "undefined") {
                this.#packetWriter.addInt32(-1);
            }
            else if (arg instanceof Uint8Array) {
                this.#packetWriter.addInt32(arg.length);
                this.#packetWriter.add(arg);
            }
            else {
                const byteLength = encoder.encode(arg).length;
                this.#packetWriter.addInt32(byteLength);
                this.#packetWriter.addString(arg);
            }
        });
        this.#packetWriter.addInt16(0);
        const buffer = this.#packetWriter.flush(0x42);
        await this.#bufWriter.write(buffer);
    }
    async appendQueryTypeToMessage() {
        this.#packetWriter.clear();
        const buffer = this.#packetWriter.addCString("P").flush(0x44);
        await this.#bufWriter.write(buffer);
    }
    async appendExecuteToMessage() {
        this.#packetWriter.clear();
        const buffer = this.#packetWriter
            .addCString("")
            .addInt32(0)
            .flush(0x45);
        await this.#bufWriter.write(buffer);
    }
    async appendSyncToMessage() {
        this.#packetWriter.clear();
        const buffer = this.#packetWriter.flush(0x53);
        await this.#bufWriter.write(buffer);
    }
    async processError(msg, recoverable = true) {
        const error = parseError(msg);
        if (recoverable) {
            await this._readReadyForQuery();
        }
        throw error;
    }
    processNotice(msg) {
        const warning = parseNotice(msg);
        console.error(`${bold(yellow(warning.severity))}: ${warning.message}`);
        return warning;
    }
    async _preparedQuery(query) {
        await this.appendQueryToMessage(query);
        await this.appendArgumentsToMessage(query);
        await this.appendQueryTypeToMessage();
        await this.appendExecuteToMessage();
        await this.appendSyncToMessage();
        await this.#bufWriter.flush();
        await assertQueryResponse(await this.readMessage());
        await assertArgumentsResponse(await this.readMessage());
        let result;
        if (query.result_type === ResultType.ARRAY) {
            result = new QueryArrayResult(query);
        }
        else {
            result = new QueryObjectResult(query);
        }
        let msg;
        msg = await this.readMessage();
        switch (msg.type) {
            case "T": {
                const rowDescription = this.parseRowDescription(msg);
                result.loadColumnDescriptions(rowDescription);
                break;
            }
            case "n":
                break;
            case "E":
                await this.processError(msg);
                break;
            default:
                throw new Error(`Unexpected frame: ${msg.type}`);
        }
        outerLoop: while (true) {
            msg = await this.readMessage();
            switch (msg.type) {
                case "D": {
                    const rawDataRow = this.parseRowData(msg);
                    result.insertRow(rawDataRow);
                    break;
                }
                case "C": {
                    const commandTag = this.getCommandTag(msg);
                    result.handleCommandComplete(commandTag);
                    result.done();
                    break outerLoop;
                }
                case "E":
                    await this.processError(msg);
                    break;
                default:
                    throw new Error(`Unexpected frame: ${msg.type}`);
            }
        }
        await this._readReadyForQuery();
        return result;
    }
    async query(query) {
        if (!this.connected) {
            throw new Error("The connection hasn't been initialized");
        }
        await this.#queryLock.pop();
        try {
            if (query.args.length === 0) {
                return await this._simpleQuery(query);
            }
            else {
                return await this._preparedQuery(query);
            }
        }
        finally {
            this.#queryLock.push(undefined);
        }
    }
    parseRowDescription(msg) {
        const columnCount = msg.reader.readInt16();
        const columns = [];
        for (let i = 0; i < columnCount; i++) {
            const column = new Column(msg.reader.readCString(), msg.reader.readInt32(), msg.reader.readInt16(), msg.reader.readInt32(), msg.reader.readInt16(), msg.reader.readInt32(), msg.reader.readInt16());
            columns.push(column);
        }
        return new RowDescription(columnCount, columns);
    }
    parseRowData(msg) {
        const fieldCount = msg.reader.readInt16();
        const row = [];
        for (let i = 0; i < fieldCount; i++) {
            const colLength = msg.reader.readInt32();
            if (colLength == -1) {
                row.push(null);
                continue;
            }
            row.push(msg.reader.readBytes(colLength));
        }
        return row;
    }
    getCommandTag(msg) {
        return msg.reader.readString(msg.byteCount);
    }
    async end() {
        if (this.connected) {
            const terminationMessage = new Uint8Array([0x58, 0x00, 0x00, 0x00, 0x04]);
            await this.#bufWriter.write(terminationMessage);
            await this.#bufWriter.flush();
            this.#conn.close();
            this.connected = false;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbm5lY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBMEJHO0FBRUgsT0FBTyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxNQUFNLFlBQVksQ0FBQztBQUNoRSxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzlDLE9BQU8sRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQzVELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUNsRCxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFDbEQsT0FBTyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDdkQsT0FBTyxFQUVMLGdCQUFnQixFQUNoQixpQkFBaUIsRUFFakIsVUFBVSxHQUNYLE1BQU0sbUJBQW1CLENBQUM7QUFFM0IsT0FBTyxLQUFLLEtBQUssTUFBTSxZQUFZLENBQUM7QUFFcEMsTUFBTSxDQUFOLElBQVksTUFHWDtBQUhELFdBQVksTUFBTTtJQUNoQixtQ0FBUSxDQUFBO0lBQ1IsdUNBQVUsQ0FBQTtBQUNaLENBQUMsRUFIVyxNQUFNLEtBQU4sTUFBTSxRQUdqQjtBQUVELElBQUssaUJBSUo7QUFKRCxXQUFLLGlCQUFpQjtJQUNwQiwrQkFBVSxDQUFBO0lBQ1YsNENBQXVCLENBQUE7SUFDdkIsOENBQXlCLENBQUE7QUFDM0IsQ0FBQyxFQUpJLGlCQUFpQixLQUFqQixpQkFBaUIsUUFJckI7QUFLRCxTQUFTLHVCQUF1QixDQUFDLEdBQVk7SUFDM0MsUUFBUSxHQUFHLENBQUMsSUFBSSxFQUFFO1FBRWhCLEtBQUssR0FBRztZQUVOLE1BQU07UUFFUixLQUFLLEdBQUc7WUFDTixNQUFNLFVBQVUsQ0FBQyxH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