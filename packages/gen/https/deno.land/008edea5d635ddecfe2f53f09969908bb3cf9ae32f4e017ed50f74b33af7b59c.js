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
import { bold, BufReader, BufWriter, joinPath, yellow } from "../deps.ts";
import { DeferredStack } from "../utils/deferred.ts";
import { getSocketName, readUInt32BE } from "../utils/utils.ts";
import { PacketWriter } from "./packet.ts";
import { Message, parseBackendKeyMessage, parseCommandCompleteMessage, parseNoticeMessage, parseRowDataMessage, parseRowDescriptionMessage, } from "./message.ts";
import { QueryArrayResult, QueryObjectResult, ResultType, } from "../query/query.ts";
import * as scram from "./scram.ts";
import { ConnectionError, ConnectionParamsError, PostgresError, } from "../client/error.ts";
import { AUTHENTICATION_TYPE, ERROR_MESSAGE, INCOMING_AUTHENTICATION_MESSAGES, INCOMING_QUERY_MESSAGES, INCOMING_TLS_MESSAGES, } from "./message_code.ts";
import { hashMd5Password } from "./auth.ts";
function assertSuccessfulStartup(msg) {
    switch (msg.type) {
        case ERROR_MESSAGE:
            throw new PostgresError(parseNoticeMessage(msg));
    }
}
function assertSuccessfulAuthentication(auth_message) {
    if (auth_message.type === ERROR_MESSAGE) {
        throw new PostgresError(parseNoticeMessage(auth_message));
    }
    if (auth_message.type !== INCOMING_AUTHENTICATION_MESSAGES.AUTHENTICATION) {
        throw new Error(`Unexpected auth response: ${auth_message.type}.`);
    }
    const responseCode = auth_message.reader.readInt32();
    if (responseCode !== 0) {
        throw new Error(`Unexpected auth response code: ${responseCode}.`);
    }
}
function logNotice(notice) {
    console.error(`${bold(yellow(notice.severity))}: ${notice.message}`);
}
const decoder = new TextDecoder();
const encoder = new TextEncoder();
export class Connection {
    #bufReader;
    #bufWriter;
    #conn;
    connected = false;
    #connection_params;
    #message_header = new Uint8Array(5);
    #onDisconnection;
    #packetWriter = new PacketWriter();
    #pid;
    #queryLock = new DeferredStack(1, [undefined]);
    #secretKey;
    #tls;
    #transport;
    get pid() {
        return this.#pid;
    }
    get tls() {
        return this.#tls;
    }
    get transport() {
        return this.#transport;
    }
    constructor(connection_params, disconnection_callback) {
        this.#connection_params = connection_params;
        this.#onDisconnection = disconnection_callback;
    }
    async #readMessage() {
        this.#message_header.fill(0);
        await this.#bufReader.readFull(this.#message_header);
        const type = decoder.decode(this.#message_header.slice(0, 1));
        if (type === "\x00") {
            throw new ConnectionError("The session was terminated unexpectedly");
        }
        const length = readUInt32BE(this.#message_header, 1) - 4;
        const body = new Uint8Array(length);
        await this.#bufReader.readFull(body);
        return new Message(type, length, body);
    }
    async #serverAcceptsTLS() {
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
            case INCOMING_TLS_MESSAGES.ACCEPTS_TLS:
                return true;
            case INCOMING_TLS_MESSAGES.NO_ACCEPTS_TLS:
                return false;
            default:
                throw new Error(`Could not check if server accepts SSL connections, server responded with: ${response}`);
        }
    }
    async #sendStartupMessage() {
        const writer = this.#packetWriter;
        writer.clear();
        writer.addInt16(3).addInt16(0);
        const connParams = this.#connection_params;
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
        return await this.#readMessage();
    }
    async #openConnection(options) {
        this.#conn = await Deno.connect(options);
        this.#bufWriter = new BufWriter(this.#conn);
        this.#bufReader = new BufReader(this.#conn);
    }
    async #openSocketConnection(path, port) {
        if (Deno.build.os === "windows") {
            throw new Error("Socket connection is only available on UNIX systems");
        }
        const socket = await Deno.stat(path);
        if (socket.isFile) {
            await this.#openConnection({ path, transport: "unix" });
        }
        else {
            const socket_guess = joinPath(path, getSocketName(port));
            try {
                await this.#openConnection({
                    path: socket_guess,
                    transport: "unix",
                });
            }
            catch (e) {
                if (e instanceof Deno.errors.NotFound) {
                    throw new ConnectionError(`Could not open socket in path "${socket_guess}"`);
                }
                throw e;
            }
        }
    }
    async #openTlsConnection(connection, options) {
        if ("startTls" in Deno) {
            this.#conn = await Deno.startTls(connection, options);
            this.#bufWriter = new BufWriter(this.#conn);
            this.#bufReader = new BufReader(this.#conn);
        }
        else {
            throw new Error("You need to execute Deno with the `--unstable` argument in order to stablish a TLS connection");
        }
    }
    #resetConnectionMetadata() {
        this.connected = false;
        this.#packetWriter = new PacketWriter();
        this.#pid = undefined;
        this.#queryLock = new DeferredStack(1, [undefined]);
        this.#secretKey = undefined;
        this.#tls = undefined;
        this.#transport = undefined;
    }
    #closeConnection() {
        try {
            this.#conn.close();
        }
        catch (_e) {
        }
        finally {
            this.#resetConnectionMetadata();
        }
    }
    async #startup() {
        this.#closeConnection();
        const { hostname, host_type, port, tls: { enabled: tls_enabled, enforce: tls_enforced, caCertificates, }, } = this.#connection_params;
        if (host_type === "socket") {
            await this.#openSocketConnection(hostname, port);
            this.#tls = undefined;
            this.#transport = "socket";
        }
        else {
            await this.#openConnection({ hostname, port, transport: "tcp" });
            this.#tls = false;
            this.#transport = "tcp";
            if (tls_enabled) {
                const accepts_tls = await this.#serverAcceptsTLS()
                    .catch((e) => {
                    this.#closeConnection();
                    throw e;
                });
                if (accepts_tls) {
                    try {
                        await this.#openTlsConnection(this.#conn, {
                            hostname,
                            caCerts: caCertificates,
                        });
                        this.#tls = true;
                    }
                    catch (e) {
                        if (!tls_enforced) {
                            console.error(bold(yellow("TLS connection failed with message: ")) +
                                e.message +
                                "\n" +
                                bold("Defaulting to non-encrypted connection"));
                            await this.#openConnection({ hostname, port, transport: "tcp" });
                            this.#tls = false;
                        }
                        else {
                            throw e;
                        }
                    }
                }
                else if (tls_enforced) {
                    this.#closeConnection();
                    throw new Error("The server isn't accepting TLS connections. Change the client configuration so TLS configuration isn't required to connect");
                }
            }
        }
        try {
            let startup_response;
            try {
                startup_response = await this.#sendStartupMessage();
            }
            catch (e) {
                this.#closeConnection();
                if (e instanceof Deno.errors.InvalidData && tls_enabled) {
                    if (tls_enforced) {
                        throw new Error("The certificate used to secure the TLS connection is invalid.");
                    }
                    else {
                        console.error(bold(yellow("TLS connection failed with message: ")) +
                            e.message +
                            "\n" +
                            bold("Defaulting to non-encrypted connection"));
                        await this.#openConnection({ hostname, port, transport: "tcp" });
                        this.#tls = false;
                        this.#transport = "tcp";
                        startup_response = await this.#sendStartupMessage();
                    }
                }
                else {
                    throw e;
                }
            }
            assertSuccessfulStartup(startup_response);
            await this.#authenticate(startup_response);
            let message = await this.#readMessage();
            while (message.type !== INCOMING_AUTHENTICATION_MESSAGES.READY) {
                switch (message.type) {
                    case ERROR_MESSAGE:
                        await this.#processErrorUnsafe(message, false);
                        break;
                    case INCOMING_AUTHENTICATION_MESSAGES.BACKEND_KEY: {
                        const { pid, secret_key } = parseBackendKeyMessage(message);
                        this.#pid = pid;
                        this.#secretKey = secret_key;
                        break;
                    }
                    case INCOMING_AUTHENTICATION_MESSAGES.PARAMETER_STATUS:
                        break;
                    default:
                        throw new Error(`Unknown response for startup: ${message.type}`);
                }
                message = await this.#readMessage();
            }
            this.connected = true;
        }
        catch (e) {
            this.#closeConnection();
            throw e;
        }
    }
    async startup(is_reconnection) {
        if (is_reconnection && this.#connection_params.connection.attempts === 0) {
            throw new Error("The client has been disconnected from the database. Enable reconnection in the client to attempt reconnection after failure");
        }
        let reconnection_attempts = 0;
        const max_reconnections = this.#connection_params.connection.attempts;
        let error;
        if (!is_reconnection && this.#connection_params.connection.attempts === 0) {
            try {
                await this.#startup();
            }
            catch (e) {
                error = e;
            }
        }
        else {
            while (reconnection_attempts < max_reconnections) {
                try {
                    await this.#startup();
                    break;
                }
                catch (e) {
                    reconnection_attempts++;
                    if (reconnection_attempts === max_reconnections) {
                        error = e;
                    }
                }
            }
        }
        if (error) {
            await this.end();
            throw error;
        }
    }
    async #authenticate(authentication_request) {
        const authentication_type = authentication_request.reader.readInt32();
        let authentication_result;
        switch (authentication_type) {
            case AUTHENTICATION_TYPE.NO_AUTHENTICATION:
                authentication_result = authentication_request;
                break;
            case AUTHENTICATION_TYPE.CLEAR_TEXT:
                authentication_result = await this.#authenticateWithClearPassword();
                break;
            case AUTHENTICATION_TYPE.MD5: {
                const salt = authentication_request.reader.readBytes(4);
                authentication_result = await this.#authenticateWithMd5(salt);
                break;
            }
            case AUTHENTICATION_TYPE.SCM:
                throw new Error("Database server expected SCM authentication, which is not supported at the moment");
            case AUTHENTICATION_TYPE.GSS_STARTUP:
                throw new Error("Database server expected GSS authentication, which is not supported at the moment");
            case AUTHENTICATION_TYPE.GSS_CONTINUE:
                throw new Error("Database server expected GSS authentication, which is not supported at the moment");
            case AUTHENTICATION_TYPE.SSPI:
                throw new Error("Database server expected SSPI authentication, which is not supported at the moment");
            case AUTHENTICATION_TYPE.SASL_STARTUP:
                authentication_result = await this.#authenticateWithSasl();
                break;
            default:
                throw new Error(`Unknown auth message code ${authentication_type}`);
        }
        await assertSuccessfulAuthentication(authentication_result);
    }
    async #authenticateWithClearPassword() {
        this.#packetWriter.clear();
        const password = this.#connection_params.password || "";
        const buffer = this.#packetWriter.addCString(password).flush(0x70);
        await this.#bufWriter.write(buffer);
        await this.#bufWriter.flush();
        return this.#readMessage();
    }
    async #authenticateWithMd5(salt) {
        this.#packetWriter.clear();
        if (!this.#connection_params.password) {
            throw new ConnectionParamsError("Attempting MD5 authentication with unset password");
        }
        const password = await hashMd5Password(this.#connection_params.password, this.#connection_params.user, salt);
        const buffer = this.#packetWriter.addCString(password).flush(0x70);
        await this.#bufWriter.write(buffer);
        await this.#bufWriter.flush();
        return this.#readMessage();
    }
    async #authenticateWithSasl() {
        if (!this.#connection_params.password) {
            throw new ConnectionParamsError("Attempting SASL auth with unset password");
        }
        const client = new scram.Client(this.#connection_params.user, this.#connection_params.password);
        const utf8 = new TextDecoder("utf-8");
        const clientFirstMessage = client.composeChallenge();
        this.#packetWriter.clear();
        this.#packetWriter.addCString("SCRAM-SHA-256");
        this.#packetWriter.addInt32(clientFirstMessage.length);
        this.#packetWriter.addString(clientFirstMessage);
        this.#bufWriter.write(this.#packetWriter.flush(0x70));
        this.#bufWriter.flush();
        const maybe_sasl_continue = await this.#readMessage();
        switch (maybe_sasl_continue.type) {
            case INCOMING_AUTHENTICATION_MESSAGES.AUTHENTICATION: {
                const authentication_type = maybe_sasl_continue.reader.readInt32();
                if (authentication_type !== AUTHENTICATION_TYPE.SASL_CONTINUE) {
                    throw new Error(`Unexpected authentication type in SASL negotiation: ${authentication_type}`);
                }
                break;
            }
            case ERROR_MESSAGE:
                throw new PostgresError(parseNoticeMessage(maybe_sasl_continue));
            default:
                throw new Error(`Unexpected message in SASL negotiation: ${maybe_sasl_continue.type}`);
        }
        const sasl_continue = utf8.decode(maybe_sasl_continue.reader.readAllBytes());
        await client.receiveChallenge(sasl_continue);
        this.#packetWriter.clear();
        this.#packetWriter.addString(await client.composeResponse());
        this.#bufWriter.write(this.#packetWriter.flush(0x70));
        this.#bufWriter.flush();
        const maybe_sasl_final = await this.#readMessage();
        switch (maybe_sasl_final.type) {
            case INCOMING_AUTHENTICATION_MESSAGES.AUTHENTICATION: {
                const authentication_type = maybe_sasl_final.reader.readInt32();
                if (authentication_type !== AUTHENTICATION_TYPE.SASL_FINAL) {
                    throw new Error(`Unexpected authentication type in SASL finalization: ${authentication_type}`);
                }
                break;
            }
            case ERROR_MESSAGE:
                throw new PostgresError(parseNoticeMessage(maybe_sasl_final));
            default:
                throw new Error(`Unexpected message in SASL finalization: ${maybe_sasl_continue.type}`);
        }
        const sasl_final = utf8.decode(maybe_sasl_final.reader.readAllBytes());
        await client.receiveResponse(sasl_final);
        return this.#readMessage();
    }
    async #simpleQuery(query) {
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
        let error;
        let current_message = await this.#readMessage();
        while (current_message.type !== INCOMING_QUERY_MESSAGES.READY) {
            switch (current_message.type) {
                case ERROR_MESSAGE:
                    error = new PostgresError(parseNoticeMessage(current_message));
                    break;
                case INCOMING_QUERY_MESSAGES.COMMAND_COMPLETE: {
                    result.handleCommandComplete(parseCommandCompleteMessage(current_message));
                    break;
                }
                case INCOMING_QUERY_MESSAGES.DATA_ROW: {
                    const row_data = parseRowDataMessage(current_message);
                    try {
                        result.insertRow(row_data);
                    }
                    catch (e) {
                        error = e;
                    }
                    break;
                }
                case INCOMING_QUERY_MESSAGES.EMPTY_QUERY:
                    break;
                case INCOMING_QUERY_MESSAGES.NOTICE_WARNING: {
                    const notice = parseNoticeMessage(current_message);
                    logNotice(notice);
                    result.warnings.push(notice);
                    break;
                }
                case INCOMING_QUERY_MESSAGES.PARAMETER_STATUS:
                    break;
                case INCOMING_QUERY_MESSAGES.READY:
                    break;
                case INCOMING_QUERY_MESSAGES.ROW_DESCRIPTION: {
                    result.loadColumnDescriptions(parseRowDescriptionMessage(current_message));
                    break;
                }
                default:
                    throw new Error(`Unexpected simple query message: ${current_message.type}`);
            }
            current_message = await this.#readMessage();
        }
        if (error)
            throw error;
        return result;
    }
    async #appendQueryToMessage(query) {
        this.#packetWriter.clear();
        const buffer = this.#packetWriter
            .addCString("")
            .addCString(query.text)
            .addInt16(0)
            .flush(0x50);
        await this.#bufWriter.write(buffer);
    }
    async #appendArgumentsToMessage(query) {
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
    async #appendDescribeToMessage() {
        this.#packetWriter.clear();
        const buffer = this.#packetWriter.addCString("P").flush(0x44);
        await this.#bufWriter.write(buffer);
    }
    async #appendExecuteToMessage() {
        this.#packetWriter.clear();
        const buffer = this.#packetWriter
            .addCString("")
            .addInt32(0)
            .flush(0x45);
        await this.#bufWriter.write(buffer);
    }
    async #appendSyncToMessage() {
        this.#packetWriter.clear();
        const buffer = this.#packetWriter.flush(0x53);
        await this.#bufWriter.write(buffer);
    }
    async #processErrorUnsafe(msg, recoverable = true) {
        const error = new PostgresError(parseNoticeMessage(msg));
        if (recoverable) {
            let maybe_ready_message = await this.#readMessage();
            while (maybe_ready_message.type !== INCOMING_QUERY_MESSAGES.READY) {
                maybe_ready_message = await this.#readMessage();
            }
        }
        throw error;
    }
    async #preparedQuery(query) {
        await this.#appendQueryToMessage(query);
        await this.#appendArgumentsToMessage(query);
        await this.#appendDescribeToMessage();
        await this.#appendExecuteToMessage();
        await this.#appendSyncToMessage();
        await this.#bufWriter.flush();
        let result;
        if (query.result_type === ResultType.ARRAY) {
            result = new QueryArrayResult(query);
        }
        else {
            result = new QueryObjectResult(query);
        }
        let error;
        let current_message = await this.#readMessage();
        while (current_message.type !== INCOMING_QUERY_MESSAGES.READY) {
            switch (current_message.type) {
                case ERROR_MESSAGE: {
                    error = new PostgresError(parseNoticeMessage(current_message));
                    break;
                }
                case INCOMING_QUERY_MESSAGES.BIND_COMPLETE:
                    break;
                case INCOMING_QUERY_MESSAGES.COMMAND_COMPLETE: {
                    result.handleCommandComplete(parseCommandCompleteMessage(current_message));
                    break;
                }
                case INCOMING_QUERY_MESSAGES.DATA_ROW: {
                    const row_data = parseRowDataMessage(current_message);
                    try {
                        result.insertRow(row_data);
                    }
                    catch (e) {
                        error = e;
                    }
                    break;
                }
                case INCOMING_QUERY_MESSAGES.NO_DATA:
                    break;
                case INCOMING_QUERY_MESSAGES.NOTICE_WARNING: {
                    const notice = parseNoticeMessage(current_message);
                    logNotice(notice);
                    result.warnings.push(notice);
                    break;
                }
                case INCOMING_QUERY_MESSAGES.PARAMETER_STATUS:
                    break;
                case INCOMING_QUERY_MESSAGES.PARSE_COMPLETE:
                    break;
                case INCOMING_QUERY_MESSAGES.ROW_DESCRIPTION: {
                    result.loadColumnDescriptions(parseRowDescriptionMessage(current_message));
                    break;
                }
                default:
                    throw new Error(`Unexpected prepared query message: ${current_message.type}`);
            }
            current_message = await this.#readMessage();
        }
        if (error)
            throw error;
        return result;
    }
    async query(query) {
        if (!this.connected) {
            await this.startup(true);
        }
        await this.#queryLock.pop();
        try {
            if (query.args.length === 0) {
                return await this.#simpleQuery(query);
            }
            else {
                return await this.#preparedQuery(query);
            }
        }
        catch (e) {
            if (e instanceof ConnectionError) {
                await this.end();
            }
            throw e;
        }
        finally {
            this.#queryLock.push(undefined);
        }
    }
    async end() {
        if (this.connected) {
            const terminationMessage = new Uint8Array([0x58, 0x00, 0x00, 0x00, 0x04]);
            await this.#bufWriter.write(terminationMessage);
            try {
                await this.#bufWriter.flush();
            }
            catch (_e) {
            }
            finally {
                this.#closeConnection();
                this.#onDisconnection();
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbm5lY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBMEJHO0FBRUgsT0FBTyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFDMUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQ3JELE9BQU8sRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFDaEUsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUMzQyxPQUFPLEVBQ0wsT0FBTyxFQUVQLHNCQUFzQixFQUN0QiwyQkFBMkIsRUFDM0Isa0JBQWtCLEVBQ2xCLG1CQUFtQixFQUNuQiwwQkFBMEIsR0FDM0IsTUFBTSxjQUFjLENBQUM7QUFDdEIsT0FBTyxFQUVMLGdCQUFnQixFQUNoQixpQkFBaUIsRUFFakIsVUFBVSxHQUNYLE1BQU0sbUJBQW1CLENBQUM7QUFFM0IsT0FBTyxLQUFLLEtBQUssTUFBTSxZQUFZLENBQUM7QUFDcEMsT0FBTyxFQUNMLGVBQWUsRUFDZixxQkFBcUIsRUFDckIsYUFBYSxHQUNkLE1BQU0sb0JBQW9CLENBQUM7QUFDNUIsT0FBTyxFQUNMLG1CQUFtQixFQUNuQixhQUFhLEVBQ2IsZ0NBQWdDLEVBQ2hDLHVCQUF1QixFQUN2QixxQkFBcUIsR0FDdEIsTUFBTSxtQkFBbUIsQ0FBQztBQUMzQixPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBTzVDLFNBQVMsdUJBQXVCLENBQUMsR0FBWTtJQUMzQyxRQUFRLEdBQUcsQ0FBQyxJQUFJLEVBQUU7UUFDaEIsS0FBSyxhQUFhO1lBQ2hCLE1BQU0sSUFBSSxhQUFhLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FB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LElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2FBQ3pCO1NBQ0Y7SUFDSCxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIFN1YnN0YW50aWFsIHBhcnRzIGFkYXB0ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vYnJpYW5jL25vZGUtcG9zdGdyZXNcbiAqIHdoaWNoIGlzIGxpY2Vuc2VkIGFzIGZvbGxvd3M6XG4gKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDEwIC0gMjAxOSBCcmlhbiBDYXJsc29uXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nXG4gKiBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbiAqICdTb2Z0d2FyZScpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbiAqIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbiAqIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xuICogcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvXG4gKiB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcbiAqIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELFxuICogRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4gKiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuXG4gKiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWVxuICogQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCxcbiAqIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFXG4gKiBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG5pbXBvcnQgeyBib2xkLCBCdWZSZWFkZXIsIEJ1ZldyaXRlciwgam9pblBhdGgsIHllbGxvdyB9IGZyb20gXCIuLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyBEZWZlcnJlZFN0YWNrIH0gZnJvbSBcIi4uL3V0aWxzL2RlZmVycmVkLnRzXCI7XG5pbXBvcnQgeyBnZXRTb2NrZXROYW1lLCByZWFkVUludDMyQkUgfSBmcm9tIFwiLi4vdXRpbHMvdXRpbHMudHNcIjtcbmltcG9ydCB7IFBhY2tldFdyaXRlciB9IGZyb20gXCIuL3BhY2tldC50c1wiO1xuaW1wb3J0IHtcbiAgTWVzc2FnZSxcbiAgTm90aWNlLFxuICBwYXJzZUJhY2tlbmRLZXlNZXNzYWdlLFxuICBwYXJzZUNvbW1hbmRDb21wbGV0ZU1lc3NhZ2UsXG4gIHBhcnNlTm90aWNlTWVzc2FnZSxcbiAgcGFyc2VSb3dEYXRhTWVzc2FnZSxcbiAgcGFyc2VSb3dEZXNjcmlwdGlvbk1lc3NhZ2UsXG59IGZyb20gXCIuL21lc3NhZ2UudHNcIjtcbmltcG9ydCB7XG4gIFF1ZXJ5LFxuICBRdWVyeUFycmF5UmVzdWx0LFxuICBRdWVyeU9iamVjdFJlc3VsdCxcbiAgUXVlcnlSZXN1bHQsXG4gIFJlc3VsdFR5cGUsXG59IGZyb20gXCIuLi9xdWVyeS9xdWVyeS50c1wiO1xuaW1wb3J0IHsgQ2xpZW50Q29uZmlndXJhdGlvbiB9IGZyb20gXCIuL2Nvbm5lY3Rpb25fcGFyYW1zLnRzXCI7XG5pbXBvcnQgKiBhcyBzY3JhbSBmcm9tIFwiLi9zY3JhbS50c1wiO1xuaW1wb3J0IHtcbiAgQ29ubmVjdGlvbkVycm9yLFxuICBDb25uZWN0aW9uUGFyYW1zRXJyb3IsXG4gIFBvc3RncmVzRXJyb3IsXG59IGZyb20gXCIuLi9jbGllbnQvZXJyb3IudHNcIjtcbmltcG9ydCB7XG4gIEFVVEhFTlRJQ0FUSU9OX1RZUEUsXG4gIEVSUk9SX01FU1NBR0UsXG4gIElOQ09NSU5HX0FVVEhFTlRJQ0FUSU9OX01FU1NBR0VTLFxuICBJTkNPTUlOR19RVUVSWV9NRVNTQUdFUyxcbiAgSU5DT01JTkdfVExTX01FU1NBR0VTLFxufSBmcm9tIFwiLi9tZXNzYWdlX2NvZGUudHNcIjtcbmltcG9ydCB7IGhhc2hNZDVQYXNzd29yZCB9IGZyb20gXCIuL2F1dGgudHNcIjtcblxuLy8gV29yayBhcm91bmQgdW5zdGFibGUgbGltaXRhdGlvblxudHlwZSBDb25uZWN0T3B0aW9ucyA9XG4gIHwgeyBob3N0bmFtZTogc3RyaW5nOyBwb3J0OiBudW1iZXI7IHRyYW5zcG9ydDogXCJ0Y3BcIiB9XG4gIHwgeyBwYXRoOiBzdHJpbmc7IHRyYW5zcG9ydDogXCJ1bml4XCIgfTtcblxuZnVuY3Rpb24gYXNzZXJ0U3VjY2Vzc2Z1bFN0YXJ0dXAobXNnOiBNZXNzYWdlKSB7XG4gIHN3aXRjaCAobXNnLnR5cGUpIHtcbiAgICBjYXNlIEVSUk9SX01FU1NBR0U6XG4gICAgICB0aHJvdyBuZXcgUG9zdGdyZXNFcnJvcihwYXJzZU5vdGljZU1lc3NhZ2UobXNnKSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXNzZXJ0U3VjY2Vzc2Z1bEF1dGhlbnRpY2F0aW9uKGF1dGhfbWVzc2FnZTogTWVzc2FnZSkge1xuICBpZiAoYXV0aF9tZXNzYWdlLnR5cGUgPT09IEVSUk9SX01FU1NBR0UpIHtcbiAgICB0aHJvdyBuZXcgUG9zdGdyZXNFcnJvcihwYXJzZU5vdGljZU1lc3NhZ2UoYXV0aF9tZXNzYWdlKSk7XG4gIH1cblxuICBpZiAoXG4gICAgYXV0aF9tZXNzYWdlLnR5cGUgIT09IElOQ09NSU5HX0FVVEhFTlRJQ0FUSU9OX01FU1NBR0VTLkFVVEhFTlRJQ0FUSU9OXG4gICkge1xuICAgIHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCBhdXRoIHJlc3BvbnNlOiAke2F1dGhfbWVzc2FnZS50eXBlfS5gKTtcbiAgfVxuXG4gIGNvbnN0IHJlc3BvbnNlQ29kZSA9IGF1dGhfbWVzc2FnZS5yZWFkZXIucmVhZEludDMyKCk7XG4gIGlmIChyZXNwb25zZUNvZGUgIT09IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgYXV0aCByZXNwb25zZSBjb2RlOiAke3Jlc3BvbnNlQ29kZX0uYCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbG9nTm90aWNlKG5vdGljZTogTm90aWNlKSB7XG4gIGNvbnNvbGUuZXJyb3IoYCR7Ym9sZCh5ZWxsb3cobm90aWNlLnNldmVyaXR5KSl9OiAke25vdGljZS5tZXNzYWdlfWApO1xufVxuXG5jb25zdCBkZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG5jb25zdCBlbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG5cbi8vIFRPRE9cbi8vIC0gUmVmYWN0b3IgcHJvcGVydGllcyB0byBub3QgYmUgbGF6aWx5IGluaXRpYWxpemVkXG4vLyAgIG9yIHRvIGhhbmRsZSB0aGVpciB1bmRlZmluZWQgdmFsdWVcbmV4cG9ydCBjbGFzcyBDb25uZWN0aW9uIHtcbiAgI2J1ZlJlYWRlciE6IEJ1ZlJlYWRlcjtcbiAgI2J1ZldyaXRlciE6IEJ1ZldyaXRlcjtcbiAgI2Nvbm4hOiBEZW5vLkNvbm47XG4gIGNvbm5lY3RlZCA9IGZhbHNlO1xuICAjY29ubmVjdGlvbl9wYXJhbXM6IENsaWVudENvbmZpZ3VyYXRpb247XG4gICNtZXNzYWdlX2hlYWRlciA9IG5ldyBVaW50OEFycmF5KDUpO1xuICAjb25EaXNjb25uZWN0aW9uOiAoKSA9PiBQcm9taXNlPHZvaWQ+O1xuICAjcGFja2V0V3JpdGVyID0gbmV3IFBhY2tldFdyaXRlcigpO1xuICAjcGlkPzogbnVtYmVyO1xuICAjcXVlcnlMb2NrOiBEZWZlcnJlZFN0YWNrPHVuZGVmaW5lZD4gPSBuZXcgRGVmZXJyZWRTdGFjayhcbiAgICAxLFxuICAgIFt1bmRlZmluZWRdLFxuICApO1xuICAvLyBUT0RPXG4gIC8vIEZpbmQgb3V0IHdoYXQgdGhlIHNlY3JldCBrZXkgaXMgZm9yXG4gICNzZWNyZXRLZXk/OiBudW1iZXI7XG4gICN0bHM/OiBib29sZWFuO1xuICAjdHJhbnNwb3J0PzogXCJ0Y3BcIiB8IFwic29ja2V0XCI7XG5cbiAgZ2V0IHBpZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jcGlkO1xuICB9XG5cbiAgLyoqIEluZGljYXRlcyBpZiB0aGUgY29ubmVjdGlvbiBpcyBjYXJyaWVkIG92ZXIgVExTICovXG4gIGdldCB0bHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuI3RscztcbiAgfVxuXG4gIC8qKiBJbmRpY2F0ZXMgdGhlIGNvbm5lY3Rpb24gcHJvdG9jb2wgdXNlZCAqL1xuICBnZXQgdHJhbnNwb3J0KCkge1xuICAgIHJldHVybiB0aGlzLiN0cmFuc3BvcnQ7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihcbiAgICBjb25uZWN0aW9uX3BhcmFtczogQ2xpZW50Q29uZmlndXJhdGlvbixcbiAgICBkaXNjb25uZWN0aW9uX2NhbGxiYWNrOiAoKSA9PiBQcm9taXNlPHZvaWQ+LFxuICApIHtcbiAgICB0aGlzLiNjb25uZWN0aW9uX3BhcmFtcyA9IGNvbm5lY3Rpb25fcGFyYW1zO1xuICAgIHRoaXMuI29uRGlzY29ubmVjdGlvbiA9IGRpc2Nvbm5lY3Rpb25fY2FsbGJhY2s7XG4gIH1cblxuICAvKipcbiAgICogUmVhZCBzaW5nbGUgbWVzc2FnZSBzZW50IGJ5IGJhY2tlbmRcbiAgICovXG4gIGFzeW5jICNyZWFkTWVzc2FnZSgpOiBQcm9taXNlPE1lc3NhZ2U+IHtcbiAgICAvLyBDbGVhciBidWZmZXIgYmVmb3JlIHJlYWRpbmcgdGhlIG1lc3NhZ2UgdHlwZVxuICAgIHRoaXMuI21lc3NhZ2VfaGVhZGVyLmZpbGwoMCk7XG4gICAgYXdhaXQgdGhpcy4jYnVmUmVhZGVyLnJlYWRGdWxsKHRoaXMuI21lc3NhZ2VfaGVhZGVyKTtcbiAgICBjb25zdCB0eXBlID0gZGVjb2Rlci5kZWNvZGUodGhpcy4jbWVzc2FnZV9oZWFkZXIuc2xpY2UoMCwgMSkpO1xuICAgIC8vIFRPRE9cbiAgICAvLyBJbnZlc3RpZ2F0ZSBpZiB0aGUgYXNjaWkgdGVybWluYXRvciBpcyB0aGUgYmVzdCB3YXkgdG8gY2hlY2sgZm9yIGEgYnJva2VuXG4gICAgLy8gc2Vzc2lvblxuICAgIGlmICh0eXBlID09PSBcIlxceDAwXCIpIHtcbiAgICAgIC8vIFRoaXMgZXJyb3IgbWVhbnMgdGhhdCB0aGUgZGF0YWJhc2UgdGVybWluYXRlZCB0aGUgc2Vzc2lvbiB3aXRob3V0IG5vdGlmeWluZ1xuICAgICAgLy8gdGhlIGxpYnJhcnlcbiAgICAgIC8vIFRPRE9cbiAgICAgIC8vIFRoaXMgd2lsbCBiZSByZW1vdmVkIG9uY2Ugd2UgbW92ZSB0byBhc3luYyBoYW5kbGluZyBvZiBtZXNzYWdlcyBieSB0aGUgZnJvbnRlbmRcbiAgICAgIC8vIEhvd2V2ZXIsIHVubm90aWZpZWQgZGlzY29ubmVjdGlvbiB3aWxsIHJlbWFpbiBhIHBvc3NpYmlsaXR5LCB0aGF0IHdpbGwgbGlrZWx5XG4gICAgICAvLyBiZSBoYW5kbGVkIGluIGFub3RoZXIgcGxhY2VcbiAgICAgIHRocm93IG5ldyBDb25uZWN0aW9uRXJyb3IoXCJUaGUgc2Vzc2lvbiB3YXMgdGVybWluYXRlZCB1bmV4cGVjdGVkbHlcIik7XG4gICAgfVxuICAgIGNvbnN0IGxlbmd0aCA9IHJlYWRVSW50MzJCRSh0aGlzLiNtZXNzYWdlX2hlYWRlciwgMSkgLSA0O1xuICAgIGNvbnN0IGJvZHkgPSBuZXcgVWludDhBcnJheShsZW5ndGgpO1xuICAgIGF3YWl0IHRoaXMuI2J1ZlJlYWRlci5yZWFkRnVsbChib2R5KTtcblxuICAgIHJldHVybiBuZXcgTWVzc2FnZSh0eXBlLCBsZW5ndGgsIGJvZHkpO1xuICB9XG5cbiAgYXN5bmMgI3NlcnZlckFjY2VwdHNUTFMoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3Qgd3JpdGVyID0gdGhpcy4jcGFja2V0V3JpdGVyO1xuICAgIHdyaXRlci5jbGVhcigpO1xuICAgIHdyaXRlclxuICAgICAgLmFkZEludDMyKDgpXG4gICAgICAuYWRkSW50MzIoODA4NzcxMDMpXG4gICAgICAuam9pbigpO1xuXG4gICAgYXdhaXQgdGhpcy4jYnVmV3JpdGVyLndyaXRlKHdyaXRlci5mbHVzaCgpKTtcbiAgICBhd2FpdCB0aGlzLiNidWZXcml0ZXIuZmx1c2goKTtcblxuICAgIGNvbnN0IHJlc3BvbnNlID0gbmV3IFVpbnQ4QXJyYXkoMSk7XG4gICAgYXdhaXQgdGhpcy4jY29ubi5yZWFkKHJlc3BvbnNlKTtcblxuICAgIHN3aXRjaCAoU3RyaW5nLmZyb21DaGFyQ29kZShyZXNwb25zZVswXSkpIHtcbiAgICAgIGNhc2UgSU5DT01JTkdfVExTX01FU1NBR0VTLkFDQ0VQVFNfVExTOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIGNhc2UgSU5DT01JTkdfVExTX01FU1NBR0VTLk5PX0FDQ0VQVFNfVExTOlxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYENvdWxkIG5vdCBjaGVjayBpZiBzZXJ2ZXIgYWNjZXB0cyBTU0wgY29ubmVjdGlvbnMsIHNlcnZlciByZXNwb25kZWQgd2l0aDogJHtyZXNwb25zZX1gLFxuICAgICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jICNzZW5kU3RhcnR1cE1lc3NhZ2UoKTogUHJvbWlzZTxNZXNzYWdlPiB7XG4gICAgY29uc3Qgd3JpdGVyID0gdGhpcy4jcGFja2V0V3JpdGVyO1xuICAgIHdyaXRlci5jbGVhcigpO1xuICAgIC8vIHByb3RvY29sIHZlcnNpb24gLSAzLjAsIHdyaXR0ZW4gYXNcbiAgICB3cml0ZXIuYWRkSW50MTYoMykuYWRkSW50MTYoMCk7XG4gICAgY29uc3QgY29ublBhcmFtcyA9IHRoaXMuI2Nvbm5lY3Rpb25fcGFyYW1zO1xuICAgIC8vIFRPRE86IHJlY29nbml6ZSBvdGhlciBwYXJhbWV0ZXJzXG4gICAgd3JpdGVyLmFkZENTdHJpbmcoXCJ1c2VyXCIpLmFkZENTdHJpbmcoY29ublBhcmFtcy51c2VyKTtcbiAgICB3cml0ZXIuYWRkQ1N0cmluZyhcImRhdGFiYXNlXCIpLmFkZENTdHJpbmcoY29ublBhcmFtcy5kYXRhYmFzZSk7XG4gICAgd3JpdGVyLmFkZENTdHJpbmcoXCJhcHBsaWNhdGlvbl9uYW1lXCIpLmFkZENTdHJpbmcoXG4gICAgICBjb25uUGFyYW1zLmFwcGxpY2F0aW9uTmFtZSxcbiAgICApO1xuXG4gICAgLy8gZXBsaWNpdGx5IHNldCB1dGYtOCBlbmNvZGluZ1xuICAgIHdyaXRlci5hZGRDU3RyaW5nKFwiY2xpZW50X2VuY29kaW5nXCIpLmFkZENTdHJpbmcoXCIndXRmLTgnXCIpO1xuICAgIC8vIHRlcm1pbmF0b3IgYWZ0ZXIgYWxsIHBhcmFtZXRlcnMgd2VyZSB3cml0dGVyXG4gICAgd3JpdGVyLmFkZENTdHJpbmcoXCJcIik7XG5cbiAgICBjb25zdCBib2R5QnVmZmVyID0gd3JpdGVyLmZsdXNoKCk7XG4gICAgY29uc3QgYm9keUxlbmd0aCA9IGJvZHlCdWZmZXIubGVuZ3RoICsgNDtcblxuICAgIHdyaXRlci5jbGVhcigpO1xuXG4gICAgY29uc3QgZmluYWxCdWZmZXIgPSB3cml0ZXJcbiAgICAgIC5hZGRJbnQzMihib2R5TGVuZ3RoKVxuICAgICAgLmFkZChib2R5QnVmZmVyKVxuICAgICAgLmpvaW4oKTtcblxuICAgIGF3YWl0IHRoaXMuI2J1ZldyaXRlci53cml0ZShmaW5hbEJ1ZmZlcik7XG4gICAgYXdhaXQgdGhpcy4jYnVmV3JpdGVyLmZsdXNoKCk7XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jcmVhZE1lc3NhZ2UoKTtcbiAgfVxuXG4gIGFzeW5jICNvcGVuQ29ubmVjdGlvbihvcHRpb25zOiBDb25uZWN0T3B0aW9ucykge1xuICAgIC8vIEB0cy1pZ25vcmUgVGhpcyB3aWxsIHRocm93IGluIHJ1bnRpbWUgaWYgdGhlIG9wdGlvbnMgcGFzc2VkIHRvIGl0IGFyZSBzb2NrZXQgcmVsYXRlZCBhbmQgZGVubyBpcyBydW5uaW5nXG4gICAgLy8gb24gc3RhYmxlXG4gICAgdGhpcy4jY29ubiA9IGF3YWl0IERlbm8uY29ubmVjdChvcHRpb25zKTtcbiAgICB0aGlzLiNidWZXcml0ZXIgPSBuZXcgQnVmV3JpdGVyKHRoaXMuI2Nvbm4pO1xuICAgIHRoaXMuI2J1ZlJlYWRlciA9IG5ldyBCdWZSZWFkZXIodGhpcy4jY29ubik7XG4gIH1cblxuICBhc3luYyAjb3BlblNvY2tldENvbm5lY3Rpb24ocGF0aDogc3RyaW5nLCBwb3J0OiBudW1iZXIpIHtcbiAgICBpZiAoRGVuby5idWlsZC5vcyA9PT0gXCJ3aW5kb3dzXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJTb2NrZXQgY29ubmVjdGlvbiBpcyBvbmx5IGF2YWlsYWJsZSBvbiBVTklYIHN5c3RlbXNcIixcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IHNvY2tldCA9IGF3YWl0IERlbm8uc3RhdChwYXRoKTtcblxuICAgIGlmIChzb2NrZXQuaXNGaWxlKSB7XG4gICAgICBhd2FpdCB0aGlzLiNvcGVuQ29ubmVjdGlvbih7IHBhdGgsIHRyYW5zcG9ydDogXCJ1bml4XCIgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHNvY2tldF9ndWVzcyA9IGpvaW5QYXRoKHBhdGgsIGdldFNvY2tldE5hbWUocG9ydCkpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgdGhpcy4jb3BlbkNvbm5lY3Rpb24oe1xuICAgICAgICAgIHBhdGg6IHNvY2tldF9ndWVzcyxcbiAgICAgICAgICB0cmFuc3BvcnQ6IFwidW5peFwiLFxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBEZW5vLmVycm9ycy5Ob3RGb3VuZCkge1xuICAgICAgICAgIHRocm93IG5ldyBDb25uZWN0aW9uRXJyb3IoXG4gICAgICAgICAgICBgQ291bGQgbm90IG9wZW4gc29ja2V0IGluIHBhdGggXCIke3NvY2tldF9ndWVzc31cImAsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jICNvcGVuVGxzQ29ubmVjdGlvbihcbiAgICBjb25uZWN0aW9uOiBEZW5vLkNvbm4sXG4gICAgb3B0aW9uczogeyBob3N0bmFtZTogc3RyaW5nOyBjYUNlcnRzOiBzdHJpbmdbXSB9LFxuICApIHtcbiAgICAvLyBUT0RPXG4gICAgLy8gUmVtb3ZlIHVuc3RhYmxlIGNoZWNrIG9uIDEuMTcuMFxuICAgIGlmIChcInN0YXJ0VGxzXCIgaW4gRGVubykge1xuICAgICAgLy8gQHRzLWlnbm9yZSBUaGlzIEFQSSBzaG91bGQgYmUgYXZhaWxhYmxlIG9uIHVuc3RhYmxlXG4gICAgICB0aGlzLiNjb25uID0gYXdhaXQgRGVuby5zdGFydFRscyhjb25uZWN0aW9uLCBvcHRpb25zKTtcbiAgICAgIHRoaXMuI2J1ZldyaXRlciA9IG5ldyBCdWZXcml0ZXIodGhpcy4jY29ubik7XG4gICAgICB0aGlzLiNidWZSZWFkZXIgPSBuZXcgQnVmUmVhZGVyKHRoaXMuI2Nvbm4pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiWW91IG5lZWQgdG8gZXhlY3V0ZSBEZW5vIHdpdGggdGhlIGAtLXVuc3RhYmxlYCBhcmd1bWVudCBpbiBvcmRlciB0byBzdGFibGlzaCBhIFRMUyBjb25uZWN0aW9uXCIsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gICNyZXNldENvbm5lY3Rpb25NZXRhZGF0YSgpIHtcbiAgICB0aGlzLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgIHRoaXMuI3BhY2tldFdyaXRlciA9IG5ldyBQYWNrZXRXcml0ZXIoKTtcbiAgICB0aGlzLiNwaWQgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy4jcXVlcnlMb2NrID0gbmV3IERlZmVycmVkU3RhY2soXG4gICAgICAxLFxuICAgICAgW3VuZGVmaW5lZF0sXG4gICAgKTtcbiAgICB0aGlzLiNzZWNyZXRLZXkgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy4jdGxzID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuI3RyYW5zcG9ydCA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gICNjbG9zZUNvbm5lY3Rpb24oKSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuI2Nvbm4uY2xvc2UoKTtcbiAgICB9IGNhdGNoIChfZSkge1xuICAgICAgLy8gU3dhbGxvdyBpZiB0aGUgY29ubmVjdGlvbiBoYWQgZXJyb3JlZCBvciBiZWVuIGNsb3NlZCBiZWZvcmVoYW5kXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuI3Jlc2V0Q29ubmVjdGlvbk1ldGFkYXRhKCk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgI3N0YXJ0dXAoKSB7XG4gICAgdGhpcy4jY2xvc2VDb25uZWN0aW9uKCk7XG5cbiAgICBjb25zdCB7XG4gICAgICBob3N0bmFtZSxcbiAgICAgIGhvc3RfdHlwZSxcbiAgICAgIHBvcnQsXG4gICAgICB0bHM6IHtcbiAgICAgICAgZW5hYmxlZDogdGxzX2VuYWJsZWQsXG4gICAgICAgIGVuZm9yY2U6IHRsc19lbmZvcmNlZCxcbiAgICAgICAgY2FDZXJ0aWZpY2F0ZXMsXG4gICAgICB9LFxuICAgIH0gPSB0aGlzLiNjb25uZWN0aW9uX3BhcmFtcztcblxuICAgIGlmIChob3N0X3R5cGUgPT09IFwic29ja2V0XCIpIHtcbiAgICAgIGF3YWl0IHRoaXMuI29wZW5Tb2NrZXRDb25uZWN0aW9uKGhvc3RuYW1lLCBwb3J0KTtcbiAgICAgIHRoaXMuI3RscyA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuI3RyYW5zcG9ydCA9IFwic29ja2V0XCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEEgQnVmV3JpdGVyIG5lZWRzIHRvIGJlIGF2YWlsYWJsZSBpbiBvcmRlciB0byBjaGVjayBpZiB0aGUgc2VydmVyIGFjY2VwdHMgVExTIGNvbm5lY3Rpb25zXG4gICAgICBhd2FpdCB0aGlzLiNvcGVuQ29ubmVjdGlvbih7IGhvc3RuYW1lLCBwb3J0LCB0cmFuc3BvcnQ6IFwidGNwXCIgfSk7XG4gICAgICB0aGlzLiN0bHMgPSBmYWxzZTtcbiAgICAgIHRoaXMuI3RyYW5zcG9ydCA9IFwidGNwXCI7XG5cbiAgICAgIGlmICh0bHNfZW5hYmxlZCkge1xuICAgICAgICAvLyBJZiBUTFMgaXMgZGlzYWJsZWQsIHdlIGRvbid0IGV2ZW4gdHJ5IHRvIGNvbm5lY3QuXG4gICAgICAgIGNvbnN0IGFjY2VwdHNfdGxzID0gYXdhaXQgdGhpcy4jc2VydmVyQWNjZXB0c1RMUygpXG4gICAgICAgICAgLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICAvLyBNYWtlIHN1cmUgdG8gY2xvc2UgdGhlIGNvbm5lY3Rpb24gaWYgdGhlIFRMUyB2YWxpZGF0aW9uIHRocm93c1xuICAgICAgICAgICAgdGhpcy4jY2xvc2VDb25uZWN0aW9uKCk7XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGh0dHBzOi8vd3d3LnBvc3RncmVzcWwub3JnL2RvY3MvMTQvcHJvdG9jb2wtZmxvdy5odG1sI2lkLTEuMTAuNS43LjExXG4gICAgICAgIGlmIChhY2NlcHRzX3Rscykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLiNvcGVuVGxzQ29ubmVjdGlvbih0aGlzLiNjb25uLCB7XG4gICAgICAgICAgICAgIGhvc3RuYW1lLFxuICAgICAgICAgICAgICBjYUNlcnRzOiBjYUNlcnRpZmljYXRlcyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy4jdGxzID0gdHJ1ZTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBpZiAoIXRsc19lbmZvcmNlZCkge1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgICAgIGJvbGQoeWVsbG93KFwiVExTIGNvbm5lY3Rpb24gZmFpbGVkIHdpdGggbWVzc2FnZTogXCIpKSArXG4gICAgICAgICAgICAgICAgICBlLm1lc3NhZ2UgK1xuICAgICAgICAgICAgICAgICAgXCJcXG5cIiArXG4gICAgICAgICAgICAgICAgICBib2xkKFwiRGVmYXVsdGluZyB0byBub24tZW5jcnlwdGVkIGNvbm5lY3Rpb25cIiksXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMuI29wZW5Db25uZWN0aW9uKHsgaG9zdG5hbWUsIHBvcnQsIHRyYW5zcG9ydDogXCJ0Y3BcIiB9KTtcbiAgICAgICAgICAgICAgdGhpcy4jdGxzID0gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0bHNfZW5mb3JjZWQpIHtcbiAgICAgICAgICAvLyBNYWtlIHN1cmUgdG8gY2xvc2UgdGhlIGNvbm5lY3Rpb24gYmVmb3JlIGVycm9yaW5nXG4gICAgICAgICAgdGhpcy4jY2xvc2VDb25uZWN0aW9uKCk7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgXCJUaGUgc2VydmVyIGlzbid0IGFjY2VwdGluZyBUTFMgY29ubmVjdGlvbnMuIENoYW5nZSB0aGUgY2xpZW50IGNvbmZpZ3VyYXRpb24gc28gVExTIGNvbmZpZ3VyYXRpb24gaXNuJ3QgcmVxdWlyZWQgdG8gY29ubmVjdFwiLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgbGV0IHN0YXJ0dXBfcmVzcG9uc2U7XG4gICAgICB0cnkge1xuICAgICAgICBzdGFydHVwX3Jlc3BvbnNlID0gYXdhaXQgdGhpcy4jc2VuZFN0YXJ0dXBNZXNzYWdlKCk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIE1ha2Ugc3VyZSB0byBjbG9zZSB0aGUgY29ubmVjdGlvbiBiZWZvcmUgZXJyb3Jpbmcgb3IgcmVzZXRpbmdcbiAgICAgICAgdGhpcy4jY2xvc2VDb25uZWN0aW9uKCk7XG4gICAgICAgIGlmIChlIGluc3RhbmNlb2YgRGVuby5lcnJvcnMuSW52YWxpZERhdGEgJiYgdGxzX2VuYWJsZWQpIHtcbiAgICAgICAgICBpZiAodGxzX2VuZm9yY2VkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgIFwiVGhlIGNlcnRpZmljYXRlIHVzZWQgdG8gc2VjdXJlIHRoZSBUTFMgY29ubmVjdGlvbiBpcyBpbnZhbGlkLlwiLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgICAgYm9sZCh5ZWxsb3coXCJUTFMgY29ubmVjdGlvbiBmYWlsZWQgd2l0aCBtZXNzYWdlOiBcIikpICtcbiAgICAgICAgICAgICAgICBlLm1lc3NhZ2UgK1xuICAgICAgICAgICAgICAgIFwiXFxuXCIgK1xuICAgICAgICAgICAgICAgIGJvbGQoXCJEZWZhdWx0aW5nIHRvIG5vbi1lbmNyeXB0ZWQgY29ubmVjdGlvblwiKSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLiNvcGVuQ29ubmVjdGlvbih7IGhvc3RuYW1lLCBwb3J0LCB0cmFuc3BvcnQ6IFwidGNwXCIgfSk7XG4gICAgICAgICAgICB0aGlzLiN0bHMgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuI3RyYW5zcG9ydCA9IFwidGNwXCI7XG4gICAgICAgICAgICBzdGFydHVwX3Jlc3BvbnNlID0gYXdhaXQgdGhpcy4jc2VuZFN0YXJ0dXBNZXNzYWdlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGFzc2VydFN1Y2Nlc3NmdWxTdGFydHVwKHN0YXJ0dXBfcmVzcG9uc2UpO1xuICAgICAgYXdhaXQgdGhpcy4jYXV0aGVudGljYXRlKHN0YXJ0dXBfcmVzcG9uc2UpO1xuXG4gICAgICAvLyBIYW5kbGUgY29ubmVjdGlvbiBzdGF0dXNcbiAgICAgIC8vIFByb2Nlc3MgY29ubmVjdGlvbiBpbml0aWFsaXphdGlvbiBtZXNzYWdlcyB1bnRpbCBjb25uZWN0aW9uIHJldHVybnMgcmVhZHlcbiAgICAgIGxldCBtZXNzYWdlID0gYXdhaXQgdGhpcy4jcmVhZE1lc3NhZ2UoKTtcbiAgICAgIHdoaWxlIChtZXNzYWdlLnR5cGUgIT09IElOQ09NSU5HX0FVVEhFTlRJQ0FUSU9OX01FU1NBR0VTLlJFQURZKSB7XG4gICAgICAgIHN3aXRjaCAobWVzc2FnZS50eXBlKSB7XG4gICAgICAgICAgLy8gQ29ubmVjdGlvbiBlcnJvciAod3JvbmcgZGF0YWJhc2Ugb3IgdXNlcilcbiAgICAgICAgICBjYXNlIEVSUk9SX01FU1NBR0U6XG4gICAgICAgICAgICBhd2FpdCB0aGlzLiNwcm9jZXNzRXJyb3JVbnNhZmUobWVzc2FnZSwgZmFsc2UpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBJTkNPTUlOR19BVVRIRU5USUNBVElPTl9NRVNTQUdFUy5CQUNLRU5EX0tFWToge1xuICAgICAgICAgICAgY29uc3QgeyBwaWQsIHNlY3JldF9rZXkgfSA9IHBhcnNlQmFja2VuZEtleU1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgICAgICB0aGlzLiNwaWQgPSBwaWQ7XG4gICAgICAgICAgICB0aGlzLiNzZWNyZXRLZXkgPSBzZWNyZXRfa2V5O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNhc2UgSU5DT01JTkdfQVVUSEVOVElDQVRJT05fTUVTU0FHRVMuUEFSQU1FVEVSX1NUQVRVUzpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gcmVzcG9uc2UgZm9yIHN0YXJ0dXA6ICR7bWVzc2FnZS50eXBlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgbWVzc2FnZSA9IGF3YWl0IHRoaXMuI3JlYWRNZXNzYWdlKCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuY29ubmVjdGVkID0gdHJ1ZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aGlzLiNjbG9zZUNvbm5lY3Rpb24oKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxpbmcgc3RhcnR1cCBvbiBhIGNvbm5lY3Rpb24gdHdpY2Ugd2lsbCBjcmVhdGUgYSBuZXcgc2Vzc2lvbiBhbmQgb3ZlcndyaXRlIHRoZSBwcmV2aW91cyBvbmVcbiAgICpcbiAgICogQHBhcmFtIGlzX3JlY29ubmVjdGlvbiBUaGlzIGluZGljYXRlcyB3aGV0aGVyIHRoZSBzdGFydHVwIHNob3VsZCBiZWhhdmUgYXMgaWYgdGhlcmUgd2FzXG4gICAqIGEgY29ubmVjdGlvbiBwcmV2aW91c2x5IGVzdGFibGlzaGVkLCBvciBpZiBpdCBzaG91bGQgYXR0ZW1wdCB0byBjcmVhdGUgYSBjb25uZWN0aW9uIGZpcnN0XG4gICAqXG4gICAqIGh0dHBzOi8vd3d3LnBvc3RncmVzcWwub3JnL2RvY3MvMTQvcHJvdG9jb2wtZmxvdy5odG1sI2lkLTEuMTAuNS43LjNcbiAgICovXG4gIGFzeW5jIHN0YXJ0dXAoaXNfcmVjb25uZWN0aW9uOiBib29sZWFuKSB7XG4gICAgaWYgKGlzX3JlY29ubmVjdGlvbiAmJiB0aGlzLiNjb25uZWN0aW9uX3BhcmFtcy5jb25uZWN0aW9uLmF0dGVtcHRzID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiVGhlIGNsaWVudCBoYXMgYmVlbiBkaXNjb25uZWN0ZWQgZnJvbSB0aGUgZGF0YWJhc2UuIEVuYWJsZSByZWNvbm5lY3Rpb24gaW4gdGhlIGNsaWVudCB0byBhdHRlbXB0IHJlY29ubmVjdGlvbiBhZnRlciBmYWlsdXJlXCIsXG4gICAgICApO1xuICAgIH1cblxuICAgIGxldCByZWNvbm5lY3Rpb25fYXR0ZW1wdHMgPSAwO1xuICAgIGNvbnN0IG1heF9yZWNvbm5lY3Rpb25zID0gdGhpcy4jY29ubmVjdGlvbl9wYXJhbXMuY29ubmVjdGlvbi5hdHRlbXB0cztcblxuICAgIGxldCBlcnJvcjogRXJyb3IgfCB1bmRlZmluZWQ7XG4gICAgLy8gSWYgbm8gY29ubmVjdGlvbiBoYXMgYmVlbiBlc3RhYmxpc2hlZCBhbmQgdGhlIHJlY29ubmVjdGlvbiBhdHRlbXB0cyBhcmVcbiAgICAvLyBzZXQgdG8gemVybywgYXR0ZW1wdCB0byBjb25uZWN0IGF0IGxlYXN0IG9uY2VcbiAgICBpZiAoIWlzX3JlY29ubmVjdGlvbiAmJiB0aGlzLiNjb25uZWN0aW9uX3BhcmFtcy5jb25uZWN0aW9uLmF0dGVtcHRzID09PSAwKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCB0aGlzLiNzdGFydHVwKCk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGVycm9yID0gZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgdGhlIHJlY29ubmVjdGlvbiBhdHRlbXB0cyBhcmUgc2V0IHRvIHplcm8gdGhlIGNsaWVudCB3b24ndCBhdHRlbXB0IHRvXG4gICAgICAvLyByZWNvbm5lY3QsIGJ1dCBpdCB3b24ndCBlcnJvciBlaXRoZXIsIHRoaXMgXCJubyByZWNvbm5lY3Rpb25zXCIgYmVoYXZpb3JcbiAgICAgIC8vIHNob3VsZCBiZSBoYW5kbGVkIHdoZXJldmVyIHRoZSByZWNvbm5lY3Rpb24gaXMgcmVxdWVzdGVkXG4gICAgICB3aGlsZSAocmVjb25uZWN0aW9uX2F0dGVtcHRzIDwgbWF4X3JlY29ubmVjdGlvbnMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLiNzdGFydHVwKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAvLyBUT0RPXG4gICAgICAgICAgLy8gRXZlbnR1YWxseSBkaXN0aW5ndWlzaCBiZXR3ZWVuIGNvbm5lY3Rpb24gZXJyb3JzIGFuZCBub3JtYWwgZXJyb3JzXG4gICAgICAgICAgcmVjb25uZWN0aW9uX2F0dGVtcHRzKys7XG4gICAgICAgICAgaWYgKHJlY29ubmVjdGlvbl9hdHRlbXB0cyA9PT0gbWF4X3JlY29ubmVjdGlvbnMpIHtcbiAgICAgICAgICAgIGVycm9yID0gZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIGF3YWl0IHRoaXMuZW5kKCk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogV2lsbCBhdHRlbXB0IHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBkYXRhYmFzZSB1c2luZyB0aGUgcHJvdmlkZWRcbiAgICogcGFzc3dvcmQgY3JlZGVudGlhbHNcbiAgICovXG4gIGFzeW5jICNhdXRoZW50aWNhdGUoYXV0aGVudGljYXRpb25fcmVxdWVzdDogTWVzc2FnZSkge1xuICAgIGNvbnN0IGF1dGhlbnRpY2F0aW9uX3R5cGUgPSBhdXRoZW50aWNhdGlvbl9yZXF1ZXN0LnJlYWRlci5yZWFkSW50MzIoKTtcblxuICAgIGxldCBhdXRoZW50aWNhdGlvbl9yZXN1bHQ6IE1lc3NhZ2U7XG4gICAgc3dpdGNoIChhdXRoZW50aWNhdGlvbl90eXBlKSB7XG4gICAgICBjYXNlIEFVVEhFTlRJQ0FUSU9OX1RZUEUuTk9fQVVUSEVOVElDQVRJT046XG4gICAgICAgIGF1dGhlbnRpY2F0aW9uX3Jlc3VsdCA9IGF1dGhlbnRpY2F0aW9uX3JlcXVlc3Q7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBBVVRIRU5USUNBVElPTl9UWVBFLkNMRUFSX1RFWFQ6XG4gICAgICAgIGF1dGhlbnRpY2F0aW9uX3Jlc3VsdCA9IGF3YWl0IHRoaXMuI2F1dGhlbnRpY2F0ZVdpdGhDbGVhclBhc3N3b3JkKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBBVVRIRU5USUNBVElPTl9UWVBFLk1ENToge1xuICAgICAgICBjb25zdCBzYWx0ID0gYXV0aGVudGljYXRpb25fcmVxdWVzdC5yZWFkZXIucmVhZEJ5dGVzKDQpO1xuICAgICAgICBhdXRoZW50aWNhdGlvbl9yZXN1bHQgPSBhd2FpdCB0aGlzLiNhdXRoZW50aWNhdGVXaXRoTWQ1KHNhbHQpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgQVVUSEVOVElDQVRJT05fVFlQRS5TQ006XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBcIkRhdGFiYXNlIHNlcnZlciBleHBlY3RlZCBTQ00gYXV0aGVudGljYXRpb24sIHdoaWNoIGlzIG5vdCBzdXBwb3J0ZWQgYXQgdGhlIG1vbWVudFwiLFxuICAgICAgICApO1xuICAgICAgY2FzZSBBVVRIRU5USUNBVElPTl9UWVBFLkdTU19TVEFSVFVQOlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgXCJEYXRhYmFzZSBzZXJ2ZXIgZXhwZWN0ZWQgR1NTIGF1dGhlbnRpY2F0aW9uLCB3aGljaCBpcyBub3Qgc3VwcG9ydGVkIGF0IHRoZSBtb21lbnRcIixcbiAgICAgICAgKTtcbiAgICAgIGNhc2UgQVVUSEVOVElDQVRJT05fVFlQRS5HU1NfQ09OVElOVUU6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBcIkRhdGFiYXNlIHNlcnZlciBleHBlY3RlZCBHU1MgYXV0aGVudGljYXRpb24sIHdoaWNoIGlzIG5vdCBzdXBwb3J0ZWQgYXQgdGhlIG1vbWVudFwiLFxuICAgICAgICApO1xuICAgICAgY2FzZSBBVVRIRU5USUNBVElPTl9UWVBFLlNTUEk6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBcIkRhdGFiYXNlIHNlcnZlciBleHBlY3RlZCBTU1BJIGF1dGhlbnRpY2F0aW9uLCB3aGljaCBpcyBub3Qgc3VwcG9ydGVkIGF0IHRoZSBtb21lbnRcIixcbiAgICAgICAgKTtcbiAgICAgIGNhc2UgQVVUSEVOVElDQVRJT05fVFlQRS5TQVNMX1NUQVJUVVA6XG4gICAgICAgIGF1dGhlbnRpY2F0aW9uX3Jlc3VsdCA9IGF3YWl0IHRoaXMuI2F1dGhlbnRpY2F0ZVdpdGhTYXNsKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGF1dGggbWVzc2FnZSBjb2RlICR7YXV0aGVudGljYXRpb25fdHlwZX1gKTtcbiAgICB9XG5cbiAgICBhd2FpdCBhc3NlcnRTdWNjZXNzZnVsQXV0aGVudGljYXRpb24oYXV0aGVudGljYXRpb25fcmVzdWx0KTtcbiAgfVxuXG4gIGFzeW5jICNhdXRoZW50aWNhdGVXaXRoQ2xlYXJQYXNzd29yZCgpOiBQcm9taXNlPE1lc3NhZ2U+IHtcbiAgICB0aGlzLiNwYWNrZXRXcml0ZXIuY2xlYXIoKTtcbiAgICBjb25zdCBwYXNzd29yZCA9IHRoaXMuI2Nvbm5lY3Rpb25fcGFyYW1zLnBhc3N3b3JkIHx8IFwiXCI7XG4gICAgY29uc3QgYnVmZmVyID0gdGhpcy4jcGFja2V0V3JpdGVyLmFkZENTdHJpbmcocGFzc3dvcmQpLmZsdXNoKDB4NzApO1xuXG4gICAgYXdhaXQgdGhpcy4jYnVmV3JpdGVyLndyaXRlKGJ1ZmZlcik7XG4gICAgYXdhaXQgdGhpcy4jYnVmV3JpdGVyLmZsdXNoKCk7XG5cbiAgICByZXR1cm4gdGhpcy4jcmVhZE1lc3NhZ2UoKTtcbiAgfVxuXG4gIGFzeW5jICNhdXRoZW50aWNhdGVXaXRoTWQ1KHNhbHQ6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPE1lc3NhZ2U+IHtcbiAgICB0aGlzLiNwYWNrZXRXcml0ZXIuY2xlYXIoKTtcblxuICAgIGlmICghdGhpcy4jY29ubmVjdGlvbl9wYXJhbXMucGFzc3dvcmQpIHtcbiAgICAgIHRocm93IG5ldyBDb25uZWN0aW9uUGFyYW1zRXJyb3IoXG4gICAgICAgIFwiQXR0ZW1wdGluZyBNRDUgYXV0aGVudGljYXRpb24gd2l0aCB1bnNldCBwYXNzd29yZFwiLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBwYXNzd29yZCA9IGF3YWl0IGhhc2hNZDVQYXNzd29yZChcbiAgICAgIHRoaXMuI2Nvbm5lY3Rpb25fcGFyYW1zLnBhc3N3b3JkLFxuICAgICAgdGhpcy4jY29ubmVjdGlvbl9wYXJhbXMudXNlcixcbiAgICAgIHNhbHQsXG4gICAgKTtcbiAgICBjb25zdCBidWZmZXIgPSB0aGlzLiNwYWNrZXRXcml0ZXIuYWRkQ1N0cmluZyhwYXNzd29yZCkuZmx1c2goMHg3MCk7XG5cbiAgICBhd2FpdCB0aGlzLiNidWZXcml0ZXIud3JpdGUoYnVmZmVyKTtcbiAgICBhd2FpdCB0aGlzLiNidWZXcml0ZXIuZmx1c2goKTtcblxuICAgIHJldHVybiB0aGlzLiNyZWFkTWVzc2FnZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIGh0dHBzOi8vd3d3LnBvc3RncmVzcWwub3JnL2RvY3MvMTQvc2FzbC1hdXRoZW50aWNhdGlvbi5odG1sXG4gICAqL1xuICBhc3luYyAjYXV0aGVudGljYXRlV2l0aFNhc2woKTogUHJvbWlzZTxNZXNzYWdlPiB7XG4gICAgaWYgKCF0aGlzLiNjb25uZWN0aW9uX3BhcmFtcy5wYXNzd29yZCkge1xuICAgICAgdGhyb3cgbmV3IENvbm5lY3Rpb25QYXJhbXNFcnJvcihcbiAgICAgICAgXCJBdHRlbXB0aW5nIFNBU0wgYXV0aCB3aXRoIHVuc2V0IHBhc3N3b3JkXCIsXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGNsaWVudCA9IG5ldyBzY3JhbS5DbGllbnQoXG4gICAgICB0aGlzLiNjb25uZWN0aW9uX3BhcmFtcy51c2VyLFxuICAgICAgdGhpcy4jY29ubmVjdGlvbl9wYXJhbXMucGFzc3dvcmQsXG4gICAgKTtcbiAgICBjb25zdCB1dGY4ID0gbmV3IFRleHREZWNvZGVyKFwidXRmLThcIik7XG5cbiAgICAvLyBTQVNMSW5pdGlhbFJlc3BvbnNlXG4gICAgY29uc3QgY2xpZW50Rmlyc3RNZXNzYWdlID0gY2xpZW50LmNvbXBvc2VDaGFsbGVuZ2UoKTtcbiAgICB0aGlzLiNwYWNrZXRXcml0ZXIuY2xlYXIoKTtcbiAgICB0aGlzLiNwYWNrZXRXcml0ZXIuYWRkQ1N0cmluZyhcIlNDUkFNLVNIQS0yNTZcIik7XG4gICAgdGhpcy4jcGFja2V0V3JpdGVyLmFkZEludDMyKGNsaWVudEZpcnN0TWVzc2FnZS5sZW5ndGgpO1xuICAgIHRoaXMuI3BhY2tldFdyaXRlci5hZGRTdHJpbmcoY2xpZW50Rmlyc3RNZXNzYWdlKTtcbiAgICB0aGlzLiNidWZXcml0ZXIud3JpdGUodGhpcy4jcGFja2V0V3JpdGVyLmZsdXNoKDB4NzApKTtcbiAgICB0aGlzLiNidWZXcml0ZXIuZmx1c2goKTtcblxuICAgIGNvbnN0IG1heWJlX3Nhc2xfY29udGludWUgPSBhd2FpdCB0aGlzLiNyZWFkTWVzc2FnZSgpO1xuICAgIHN3aXRjaCAobWF5YmVfc2FzbF9jb250aW51ZS50eXBlKSB7XG4gICAgICBjYXNlIElOQ09NSU5HX0FVVEhFTlRJQ0FUSU9OX01FU1NBR0VTLkFVVEhFTlRJQ0FUSU9OOiB7XG4gICAgICAgIGNvbnN0IGF1dGhlbnRpY2F0aW9uX3R5cGUgPSBtYXliZV9zYXNsX2NvbnRpbnVlLnJlYWRlci5yZWFkSW50MzIoKTtcbiAgICAgICAgaWYgKGF1dGhlbnRpY2F0aW9uX3R5cGUgIT09IEFVVEhFTlRJQ0FUSU9OX1RZUEUuU0FTTF9DT05USU5VRSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIGBVbmV4cGVjdGVkIGF1dGhlbnRpY2F0aW9uIHR5cGUgaW4gU0FTTCBuZWdvdGlhdGlvbjogJHthdXRoZW50aWNhdGlvbl90eXBlfWAsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgRVJST1JfTUVTU0FHRTpcbiAgICAgICAgdGhyb3cgbmV3IFBvc3RncmVzRXJyb3IocGFyc2VOb3RpY2VNZXNzYWdlKG1heWJlX3Nhc2xfY29udGludWUpKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgVW5leHBlY3RlZCBtZXNzYWdlIGluIFNBU0wgbmVnb3RpYXRpb246ICR7bWF5YmVfc2FzbF9jb250aW51ZS50eXBlfWAsXG4gICAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IHNhc2xfY29udGludWUgPSB1dGY4LmRlY29kZShcbiAgICAgIG1heWJlX3Nhc2xfY29udGludWUucmVhZGVyLnJlYWRBbGxCeXRlcygpLFxuICAgICk7XG4gICAgYXdhaXQgY2xpZW50LnJlY2VpdmVDaGFsbGVuZ2Uoc2FzbF9jb250aW51ZSk7XG5cbiAgICB0aGlzLiNwYWNrZXRXcml0ZXIuY2xlYXIoKTtcbiAgICB0aGlzLiNwYWNrZXRXcml0ZXIuYWRkU3RyaW5nKGF3YWl0IGNsaWVudC5jb21wb3NlUmVzcG9uc2UoKSk7XG4gICAgdGhpcy4jYnVmV3JpdGVyLndyaXRlKHRoaXMuI3BhY2tldFdyaXRlci5mbHVzaCgweDcwKSk7XG4gICAgdGhpcy4jYnVmV3JpdGVyLmZsdXNoKCk7XG5cbiAgICBjb25zdCBtYXliZV9zYXNsX2ZpbmFsID0gYXdhaXQgdGhpcy4jcmVhZE1lc3NhZ2UoKTtcbiAgICBzd2l0Y2ggKG1heWJlX3Nhc2xfZmluYWwudHlwZSkge1xuICAgICAgY2FzZSBJTkNPTUlOR19BVVRIRU5USUNBVElPTl9NRVNTQUdFUy5BVVRIRU5USUNBVElPTjoge1xuICAgICAgICBjb25zdCBhdXRoZW50aWNhdGlvbl90eXBlID0gbWF5YmVfc2FzbF9maW5hbC5yZWFkZXIucmVhZEludDMyKCk7XG4gICAgICAgIGlmIChhdXRoZW50aWNhdGlvbl90eXBlICE9PSBBVVRIRU5USUNBVElPTl9UWVBFLlNBU0xfRklOQUwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgVW5leHBlY3RlZCBhdXRoZW50aWNhdGlvbiB0eXBlIGluIFNBU0wgZmluYWxpemF0aW9uOiAke2F1dGhlbnRpY2F0aW9uX3R5cGV9YCxcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBFUlJPUl9NRVNTQUdFOlxuICAgICAgICB0aHJvdyBuZXcgUG9zdGdyZXNFcnJvcihwYXJzZU5vdGljZU1lc3NhZ2UobWF5YmVfc2FzbF9maW5hbCkpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBVbmV4cGVjdGVkIG1lc3NhZ2UgaW4gU0FTTCBmaW5hbGl6YXRpb246ICR7bWF5YmVfc2FzbF9jb250aW51ZS50eXBlfWAsXG4gICAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IHNhc2xfZmluYWwgPSB1dGY4LmRlY29kZShcbiAgICAgIG1heWJlX3Nhc2xfZmluYWwucmVhZGVyLnJlYWRBbGxCeXRlcygpLFxuICAgICk7XG4gICAgYXdhaXQgY2xpZW50LnJlY2VpdmVSZXNwb25zZShzYXNsX2ZpbmFsKTtcblxuICAgIC8vIFJldHVybiBhdXRoZW50aWNhdGlvbiByZXN1bHRcbiAgICByZXR1cm4gdGhpcy4jcmVhZE1lc3NhZ2UoKTtcbiAgfVxuXG4gIGFzeW5jICNzaW1wbGVRdWVyeShcbiAgICBxdWVyeTogUXVlcnk8UmVzdWx0VHlwZS5BUlJBWT4sXG4gICk6IFByb21pc2U8UXVlcnlBcnJheVJlc3VsdD47XG4gIGFzeW5jICNzaW1wbGVRdWVyeShcbiAgICBxdWVyeTogUXVlcnk8UmVzdWx0VHlwZS5PQkpFQ1Q+LFxuICApOiBQcm9taXNlPFF1ZXJ5T2JqZWN0UmVzdWx0PjtcbiAgYXN5bmMgI3NpbXBsZVF1ZXJ5KFxuICAgIHF1ZXJ5OiBRdWVyeTxSZXN1bHRUeXBlPixcbiAgKTogUHJvbWlzZTxRdWVyeVJlc3VsdD4ge1xuICAgIHRoaXMuI3BhY2tldFdyaXRlci5jbGVhcigpO1xuXG4gICAgY29uc3QgYnVmZmVyID0gdGhpcy4jcGFja2V0V3JpdGVyLmFkZENTdHJpbmcocXVlcnkudGV4dCkuZmx1c2goMHg1MSk7XG5cbiAgICBhd2FpdCB0aGlzLiNidWZXcml0ZXIud3JpdGUoYnVmZmVyKTtcbiAgICBhd2FpdCB0aGlzLiNidWZXcml0ZXIuZmx1c2goKTtcblxuICAgIGxldCByZXN1bHQ7XG4gICAgaWYgKHF1ZXJ5LnJlc3VsdF90eXBlID09PSBSZXN1bHRUeXBlLkFSUkFZKSB7XG4gICAgICByZXN1bHQgPSBuZXcgUXVlcnlBcnJheVJlc3VsdChxdWVyeSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCA9IG5ldyBRdWVyeU9iamVjdFJlc3VsdChxdWVyeSk7XG4gICAgfVxuXG4gICAgbGV0IGVycm9yOiBFcnJvciB8IHVuZGVmaW5lZDtcbiAgICBsZXQgY3VycmVudF9tZXNzYWdlID0gYXdhaXQgdGhpcy4jcmVhZE1lc3NhZ2UoKTtcblxuICAgIC8vIFByb2Nlc3MgbWVzc2FnZXMgdW50aWwgcmVhZHkgc2lnbmFsIGlzIHNlbnRcbiAgICAvLyBEZWxheSBlcnJvciBoYW5kbGluZyB1bnRpbCBhZnRlciB0aGUgcmVhZHkgc2lnbmFsIGlzIHNlbnRcbiAgICB3aGlsZSAoY3VycmVudF9tZXNzYWdlLnR5cGUgIT09IElOQ09NSU5HX1FVRVJZX01FU1NBR0VTLlJFQURZKSB7XG4gICAgICBzd2l0Y2ggKGN1cnJlbnRfbWVzc2FnZS50eXBlKSB7XG4gICAgICAgIGNhc2UgRVJST1JfTUVTU0FHRTpcbiAgICAgICAgICBlcnJvciA9IG5ldyBQb3N0Z3Jlc0Vycm9yKHBhcnNlTm90aWNlTWVzc2FnZShjdXJyZW50X21lc3NhZ2UpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBJTkNPTUlOR19RVUVSWV9NRVNTQUdFUy5DT01NQU5EX0NPTVBMRVRFOiB7XG4gICAgICAgICAgcmVzdWx0LmhhbmRsZUNvbW1hbmRDb21wbGV0ZShcbiAgICAgICAgICAgIHBhcnNlQ29tbWFuZENvbXBsZXRlTWVzc2FnZShjdXJyZW50X21lc3NhZ2UpLFxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBJTkNPTUlOR19RVUVSWV9NRVNTQUdFUy5EQVRBX1JPVzoge1xuICAgICAgICAgIGNvbnN0IHJvd19kYXRhID0gcGFyc2VSb3dEYXRhTWVzc2FnZShjdXJyZW50X21lc3NhZ2UpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXN1bHQuaW5zZXJ0Um93KHJvd19kYXRhKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBlcnJvciA9IGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgSU5DT01JTkdfUVVFUllfTUVTU0FHRVMuRU1QVFlfUVVFUlk6XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgSU5DT01JTkdfUVVFUllfTUVTU0FHRVMuTk9USUNFX1dBUk5JTkc6IHtcbiAgICAgICAgICBjb25zdCBub3RpY2UgPSBwYXJzZU5vdGljZU1lc3NhZ2UoY3VycmVudF9tZXNzYWdlKTtcbiAgICAgICAgICBsb2dOb3RpY2Uobm90aWNlKTtcbiAgICAgICAgICByZXN1bHQud2FybmluZ3MucHVzaChub3RpY2UpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgSU5DT01JTkdfUVVFUllfTUVTU0FHRVMuUEFSQU1FVEVSX1NUQVRVUzpcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBJTkNPTUlOR19RVUVSWV9NRVNTQUdFUy5SRUFEWTpcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBJTkNPTUlOR19RVUVSWV9NRVNTQUdFUy5ST1dfREVTQ1JJUFRJT046IHtcbiAgICAgICAgICByZXN1bHQubG9hZENvbHVtbkRlc2NyaXB0aW9ucyhcbiAgICAgICAgICAgIHBhcnNlUm93RGVzY3JpcHRpb25NZXNzYWdlKGN1cnJlbnRfbWVzc2FnZSksXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIGBVbmV4cGVjdGVkIHNpbXBsZSBxdWVyeSBtZXNzYWdlOiAke2N1cnJlbnRfbWVzc2FnZS50eXBlfWAsXG4gICAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgY3VycmVudF9tZXNzYWdlID0gYXdhaXQgdGhpcy4jcmVhZE1lc3NhZ2UoKTtcbiAgICB9XG5cbiAgICBpZiAoZXJyb3IpIHRocm93IGVycm9yO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGFzeW5jICNhcHBlbmRRdWVyeVRvTWVzc2FnZTxUIGV4dGVuZHMgUmVzdWx0VHlwZT4ocXVlcnk6IFF1ZXJ5PFQ+KSB7XG4gICAgdGhpcy4jcGFja2V0V3JpdGVyLmNsZWFyKCk7XG5cbiAgICBjb25zdCBidWZmZXIgPSB0aGlzLiNwYWNrZXRXcml0ZXJcbiAgICAgIC5hZGRDU3RyaW5nKFwiXCIpIC8vIFRPRE86IGhhbmRsZSBuYW1lZCBxdWVyaWVzIChjb25maWcubmFtZSlcbiAgICAgIC5hZGRDU3RyaW5nKHF1ZXJ5LnRleHQpXG4gICAgICAuYWRkSW50MTYoMClcbiAgICAgIC5mbHVzaCgweDUwKTtcbiAgICBhd2FpdCB0aGlzLiNidWZXcml0ZXIud3JpdGUoYnVmZmVyKTtcbiAgfVxuXG4gIGFzeW5jICNhcHBlbmRBcmd1bWVudHNUb01lc3NhZ2U8VCBleHRlbmRzIFJlc3VsdFR5cGU+KFxuICAgIHF1ZXJ5OiBRdWVyeTxUPixcbiAgKSB7XG4gICAgdGhpcy4jcGFja2V0V3JpdGVyLmNsZWFyKCk7XG5cbiAgICBjb25zdCBoYXNCaW5hcnlBcmdzID0gcXVlcnkuYXJncy5zb21lKChhcmcpID0+IGFyZyBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpO1xuXG4gICAgLy8gYmluZCBzdGF0ZW1lbnRcbiAgICB0aGlzLiNwYWNrZXRXcml0ZXIuY2xlYXIoKTtcbiAgICB0aGlzLiNwYWNrZXRXcml0ZXJcbiAgICAgIC5hZGRDU3RyaW5nKFwiXCIpIC8vIFRPRE86IHVubmFtZWQgcG9ydGFsXG4gICAgICAuYWRkQ1N0cmluZyhcIlwiKTsgLy8gVE9ETzogdW5uYW1lZCBwcmVwYXJlZCBzdGF0ZW1lbnRcblxuICAgIGlmIChoYXNCaW5hcnlBcmdzKSB7XG4gICAgICB0aGlzLiNwYWNrZXRXcml0ZXIuYWRkSW50MTYocXVlcnkuYXJncy5sZW5ndGgpO1xuXG4gICAgICBxdWVyeS5hcmdzLmZvckVhY2goKGFyZykgPT4ge1xuICAgICAgICB0aGlzLiNwYWNrZXRXcml0ZXIuYWRkSW50MTYoYXJnIGluc3RhbmNlb2YgVWludDhBcnJheSA/IDEgOiAwKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiNwYWNrZXRXcml0ZXIuYWRkSW50MTYoMCk7XG4gICAgfVxuXG4gICAgdGhpcy4jcGFja2V0V3JpdGVyLmFkZEludDE2KHF1ZXJ5LmFyZ3MubGVuZ3RoKTtcblxuICAgIHF1ZXJ5LmFyZ3MuZm9yRWFjaCgoYXJnKSA9PiB7XG4gICAgICBpZiAoYXJnID09PSBudWxsIHx8IHR5cGVvZiBhcmcgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgdGhpcy4jcGFja2V0V3JpdGVyLmFkZEludDMyKC0xKTtcbiAgICAgIH0gZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgICAgICB0aGlzLiNwYWNrZXRXcml0ZXIuYWRkSW50MzIoYXJnLmxlbmd0aCk7XG4gICAgICAgIHRoaXMuI3BhY2tldFdyaXRlci5hZGQoYXJnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGJ5dGVMZW5ndGggPSBlbmNvZGVyLmVuY29kZShhcmcpLmxlbmd0aDtcbiAgICAgICAgdGhpcy4jcGFja2V0V3JpdGVyLmFkZEludDMyKGJ5dGVMZW5ndGgpO1xuICAgICAgICB0aGlzLiNwYWNrZXRXcml0ZXIuYWRkU3RyaW5nKGFyZyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLiNwYWNrZXRXcml0ZXIuYWRkSW50MTYoMCk7XG4gICAgY29uc3QgYnVmZmVyID0gdGhpcy4jcGFja2V0V3JpdGVyLmZsdXNoKDB4NDIpO1xuICAgIGF3YWl0IHRoaXMuI2J1ZldyaXRlci53cml0ZShidWZmZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgZnVuY3Rpb24gYXBwZW5kcyB0aGUgcXVlcnkgdHlwZSAoaW4gdGhpcyBjYXNlIHByZXBhcmVkIHN0YXRlbWVudClcbiAgICogdG8gdGhlIG1lc3NhZ2VcbiAgICovXG4gIGFzeW5jICNhcHBlbmREZXNjcmliZVRvTWVzc2FnZSgpIHtcbiAgICB0aGlzLiNwYWNrZXRXcml0ZXIuY2xlYXIoKTtcblxuICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMuI3BhY2tldFdyaXRlci5hZGRDU3RyaW5nKFwiUFwiKS5mbHVzaCgweDQ0KTtcbiAgICBhd2FpdCB0aGlzLiNidWZXcml0ZXIud3JpdGUoYnVmZmVyKTtcbiAgfVxuXG4gIGFzeW5jICNhcHBlbmRFeGVjdXRlVG9NZXNzYWdlKCkge1xuICAgIHRoaXMuI3BhY2tldFdyaXRlci5jbGVhcigpO1xuXG4gICAgY29uc3QgYnVmZmVyID0gdGhpcy4jcGFja2V0V3JpdGVyXG4gICAgICAuYWRkQ1N0cmluZyhcIlwiKSAvLyB1bm5hbWVkIHBvcnRhbFxuICAgICAgLmFkZEludDMyKDApXG4gICAgICAuZmx1c2goMHg0NSk7XG4gICAgYXdhaXQgdGhpcy4jYnVmV3JpdGVyLndyaXRlKGJ1ZmZlcik7XG4gIH1cblxuICBhc3luYyAjYXBwZW5kU3luY1RvTWVzc2FnZSgpIHtcbiAgICB0aGlzLiNwYWNrZXRXcml0ZXIuY2xlYXIoKTtcblxuICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMuI3BhY2tldFdyaXRlci5mbHVzaCgweDUzKTtcbiAgICBhd2FpdCB0aGlzLiNidWZXcml0ZXIud3JpdGUoYnVmZmVyKTtcbiAgfVxuXG4gIC8vIFRPRE9cbiAgLy8gUmVuYW1lIHByb2Nlc3MgZnVuY3Rpb24gdG8gYSBtb3JlIG1lYW5pbmdmdWwgbmFtZSBhbmQgbW92ZSBvdXQgb2YgY2xhc3NcbiAgYXN5bmMgI3Byb2Nlc3NFcnJvclVuc2FmZShcbiAgICBtc2c6IE1lc3NhZ2UsXG4gICAgcmVjb3ZlcmFibGUgPSB0cnVlLFxuICApIHtcbiAgICBjb25zdCBlcnJvciA9IG5ldyBQb3N0Z3Jlc0Vycm9yKHBhcnNlTm90aWNlTWVzc2FnZShtc2cpKTtcbiAgICBpZiAocmVjb3ZlcmFibGUpIHtcbiAgICAgIGxldCBtYXliZV9yZWFkeV9tZXNzYWdlID0gYXdhaXQgdGhpcy4jcmVhZE1lc3NhZ2UoKTtcbiAgICAgIHdoaWxlIChtYXliZV9yZWFkeV9tZXNzYWdlLnR5cGUgIT09IElOQ09NSU5HX1FVRVJZX01FU1NBR0VTLlJFQURZKSB7XG4gICAgICAgIG1heWJlX3JlYWR5X21lc3NhZ2UgPSBhd2FpdCB0aGlzLiNyZWFkTWVzc2FnZSgpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBodHRwczovL3d3dy5wb3N0Z3Jlc3FsLm9yZy9kb2NzLzE0L3Byb3RvY29sLWZsb3cuaHRtbCNQUk9UT0NPTC1GTE9XLUVYVC1RVUVSWVxuICAgKi9cbiAgYXN5bmMgI3ByZXBhcmVkUXVlcnk8VCBleHRlbmRzIFJlc3VsdFR5cGU+KFxuICAgIHF1ZXJ5OiBRdWVyeTxUPixcbiAgKTogUHJvbWlzZTxRdWVyeVJlc3VsdD4ge1xuICAgIC8vIFRoZSBwYXJzZSBtZXNzYWdlcyBkZWNsYXJlcyB0aGUgc3RhdGVtZW50LCBxdWVyeSBhcmd1bWVudHMgYW5kIHRoZSBjdXJzb3IgdXNlZCBpbiB0aGUgdHJhbnNhY3Rpb25cbiAgICAvLyBUaGUgZGF0YWJhc2Ugd2lsbCByZXNwb25kIHdpdGggYSBwYXJzZSByZXNwb25zZVxuICAgIGF3YWl0IHRoaXMuI2FwcGVuZFF1ZXJ5VG9NZXNzYWdlKHF1ZXJ5KTtcbiAgICBhd2FpdCB0aGlzLiNhcHBlbmRBcmd1bWVudHNUb01lc3NhZ2UocXVlcnkpO1xuICAgIC8vIFRoZSBkZXNjcmliZSBtZXNzYWdlIHdpbGwgc3BlY2lmeSB0aGUgcXVlcnkgdHlwZSBhbmQgdGhlIGN1cnNvciBpbiB3aGljaCB0aGUgY3VycmVudCBxdWVyeSB3aWxsIGJlIHJ1bm5pbmdcbiAgICAvLyBUaGUgZGF0YWJhc2Ugd2lsbCByZXNwb25kIHdpdGggYSBiaW5kIHJlc3BvbnNlXG4gICAgYXdhaXQgdGhpcy4jYXBwZW5kRGVzY3JpYmVUb01lc3NhZ2UoKTtcbiAgICAvLyBUaGUgZXhlY3V0ZSByZXNwb25zZSBjb250YWlucyB0aGUgcG9ydGFsIGluIHdoaWNoIHRoZSBxdWVyeSB3aWxsIGJlIHJ1biBhbmQgaG93IG1hbnkgcm93cyBzaG91bGQgaXQgcmV0dXJuXG4gICAgYXdhaXQgdGhpcy4jYXBwZW5kRXhlY3V0ZVRvTWVzc2FnZSgpO1xuICAgIGF3YWl0IHRoaXMuI2FwcGVuZFN5bmNUb01lc3NhZ2UoKTtcbiAgICAvLyBzZW5kIGFsbCBtZXNzYWdlcyB0byBiYWNrZW5kXG4gICAgYXdhaXQgdGhpcy4jYnVmV3JpdGVyLmZsdXNoKCk7XG5cbiAgICBsZXQgcmVzdWx0O1xuICAgIGlmIChxdWVyeS5yZXN1bHRfdHlwZSA9PT0gUmVzdWx0VHlwZS5BUlJBWSkge1xuICAgICAgcmVzdWx0ID0gbmV3IFF1ZXJ5QXJyYXlSZXN1bHQocXVlcnkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgPSBuZXcgUXVlcnlPYmplY3RSZXN1bHQocXVlcnkpO1xuICAgIH1cblxuICAgIGxldCBlcnJvcjogRXJyb3IgfCB1bmRlZmluZWQ7XG4gICAgbGV0IGN1cnJlbnRfbWVzc2FnZSA9IGF3YWl0IHRoaXMuI3JlYWRNZXNzYWdlKCk7XG5cbiAgICB3aGlsZSAoY3VycmVudF9tZXNzYWdlLnR5cGUgIT09IElOQ09NSU5HX1FVRVJZX01FU1NBR0VTLlJFQURZKSB7XG4gICAgICBzd2l0Y2ggKGN1cnJlbnRfbWVzc2FnZS50eXBlKSB7XG4gICAgICAgIGNhc2UgRVJST1JfTUVTU0FHRToge1xuICAgICAgICAgIGVycm9yID0gbmV3IFBvc3RncmVzRXJyb3IocGFyc2VOb3RpY2VNZXNzYWdlKGN1cnJlbnRfbWVzc2FnZSkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgSU5DT01JTkdfUVVFUllfTUVTU0FHRVMuQklORF9DT01QTEVURTpcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBJTkNPTUlOR19RVUVSWV9NRVNTQUdFUy5DT01NQU5EX0NPTVBMRVRFOiB7XG4gICAgICAgICAgcmVzdWx0LmhhbmRsZUNvbW1hbmRDb21wbGV0ZShcbiAgICAgICAgICAgIHBhcnNlQ29tbWFuZENvbXBsZXRlTWVzc2FnZShjdXJyZW50X21lc3NhZ2UpLFxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBJTkNPTUlOR19RVUVSWV9NRVNTQUdFUy5EQVRBX1JPVzoge1xuICAgICAgICAgIGNvbnN0IHJvd19kYXRhID0gcGFyc2VSb3dEYXRhTWVzc2FnZShjdXJyZW50X21lc3NhZ2UpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXN1bHQuaW5zZXJ0Um93KHJvd19kYXRhKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBlcnJvciA9IGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgSU5DT01JTkdfUVVFUllfTUVTU0FHRVMuTk9fREFUQTpcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBJTkNPTUlOR19RVUVSWV9NRVNTQUdFUy5OT1RJQ0VfV0FSTklORzoge1xuICAgICAgICAgIGNvbnN0IG5vdGljZSA9IHBhcnNlTm90aWNlTWVzc2FnZShjdXJyZW50X21lc3NhZ2UpO1xuICAgICAgICAgIGxvZ05vdGljZShub3RpY2UpO1xuICAgICAgICAgIHJlc3VsdC53YXJuaW5ncy5wdXNoKG5vdGljZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBJTkNPTUlOR19RVUVSWV9NRVNTQUdFUy5QQVJBTUVURVJfU1RBVFVTOlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIElOQ09NSU5HX1FVRVJZX01FU1NBR0VTLlBBUlNFX0NPTVBMRVRFOlxuICAgICAgICAgIC8vIFRPRE86IGFkZCB0byBhbHJlYWR5IHBhcnNlZCBxdWVyaWVzIGlmXG4gICAgICAgICAgLy8gcXVlcnkgaGFzIG5hbWUsIHNvIGl0J3Mgbm90IHBhcnNlZCBhZ2FpblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIElOQ09NSU5HX1FVRVJZX01FU1NBR0VTLlJPV19ERVNDUklQVElPTjoge1xuICAgICAgICAgIHJlc3VsdC5sb2FkQ29sdW1uRGVzY3JpcHRpb25zKFxuICAgICAgICAgICAgcGFyc2VSb3dEZXNjcmlwdGlvbk1lc3NhZ2UoY3VycmVudF9tZXNzYWdlKSxcbiAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYFVuZXhwZWN0ZWQgcHJlcGFyZWQgcXVlcnkgbWVzc2FnZTogJHtjdXJyZW50X21lc3NhZ2UudHlwZX1gLFxuICAgICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGN1cnJlbnRfbWVzc2FnZSA9IGF3YWl0IHRoaXMuI3JlYWRNZXNzYWdlKCk7XG4gICAgfVxuXG4gICAgaWYgKGVycm9yKSB0aHJvdyBlcnJvcjtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBhc3luYyBxdWVyeShcbiAgICBxdWVyeTogUXVlcnk8UmVzdWx0VHlwZS5BUlJBWT4sXG4gICk6IFByb21pc2U8UXVlcnlBcnJheVJlc3VsdD47XG4gIGFzeW5jIHF1ZXJ5KFxuICAgIHF1ZXJ5OiBRdWVyeTxSZXN1bHRUeXBlLk9CSkVDVD4sXG4gICk6IFByb21pc2U8UXVlcnlPYmplY3RSZXN1bHQ+O1xuICBhc3luYyBxdWVyeShcbiAgICBxdWVyeTogUXVlcnk8UmVzdWx0VHlwZT4sXG4gICk6IFByb21pc2U8UXVlcnlSZXN1bHQ+IHtcbiAgICBpZiAoIXRoaXMuY29ubmVjdGVkKSB7XG4gICAgICBhd2FpdCB0aGlzLnN0YXJ0dXAodHJ1ZSk7XG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy4jcXVlcnlMb2NrLnBvcCgpO1xuICAgIHRyeSB7XG4gICAgICBpZiAocXVlcnkuYXJncy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuI3NpbXBsZVF1ZXJ5KHF1ZXJ5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLiNwcmVwYXJlZFF1ZXJ5KHF1ZXJ5KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIENvbm5lY3Rpb25FcnJvcikge1xuICAgICAgICBhd2FpdCB0aGlzLmVuZCgpO1xuICAgICAgfVxuICAgICAgdGhyb3cgZTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy4jcXVlcnlMb2NrLnB1c2godW5kZWZpbmVkKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBlbmQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29ubmVjdGVkKSB7XG4gICAgICBjb25zdCB0ZXJtaW5hdGlvbk1lc3NhZ2UgPSBuZXcgVWludDhBcnJheShbMHg1OCwgMHgwMCwgMHgwMCwgMHgwMCwgMHgwNF0pO1xuICAgICAgYXdhaXQgdGhpcy4jYnVmV3JpdGVyLndyaXRlKHRlcm1pbmF0aW9uTWVzc2FnZSk7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCB0aGlzLiNidWZXcml0ZXIuZmx1c2goKTtcbiAgICAgIH0gY2F0Y2ggKF9lKSB7XG4gICAgICAgIC8vIFRoaXMgc3RlcHMgY2FuIGZhaWwgaWYgdGhlIHVuZGVybHlpbmcgY29ubmVjdGlvbiB3YXMgY2xvc2VkIHVuZ3JhY2VmdWxseVxuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgdGhpcy4jY2xvc2VDb25uZWN0aW9uKCk7XG4gICAgICAgIHRoaXMuI29uRGlzY29ubmVjdGlvbigpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19