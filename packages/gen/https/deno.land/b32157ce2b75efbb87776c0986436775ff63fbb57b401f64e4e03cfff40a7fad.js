import { base64, HmacSha256, Sha256 } from "../deps.ts";
function assert(cond) {
    if (!cond) {
        throw new Error("assertion failed");
    }
}
export class AuthError extends Error {
    reason;
    constructor(reason, message) {
        super(message ?? reason);
        this.reason = reason;
    }
}
export var Reason;
(function (Reason) {
    Reason["BadMessage"] = "server sent an ill-formed message";
    Reason["BadServerNonce"] = "server sent an invalid nonce";
    Reason["BadSalt"] = "server specified an invalid salt";
    Reason["BadIterationCount"] = "server specified an invalid iteration count";
    Reason["BadVerifier"] = "server sent a bad verifier";
    Reason["Rejected"] = "rejected by server";
})(Reason || (Reason = {}));
var State;
(function (State) {
    State[State["Init"] = 0] = "Init";
    State[State["ClientChallenge"] = 1] = "ClientChallenge";
    State[State["ServerChallenge"] = 2] = "ServerChallenge";
    State[State["ClientResponse"] = 3] = "ClientResponse";
    State[State["ServerResponse"] = 4] = "ServerResponse";
    State[State["Failed"] = 5] = "Failed";
})(State || (State = {}));
const defaultNonceSize = 16;
export class Client {
    username;
    password;
    keys;
    clientNonce;
    serverNonce;
    authMessage;
    state;
    constructor(username, password, nonce) {
        this.username = username;
        this.password = password;
        this.clientNonce = nonce ?? generateNonce(defaultNonceSize);
        this.authMessage = "";
        this.state = State.Init;
    }
    composeChallenge() {
        assert(this.state === State.Init);
        try {
            const header = "n,,";
            const username = escape(normalize(this.username));
            const challenge = `n=${username},r=${this.clientNonce}`;
            const message = header + challenge;
            this.authMessage += challenge;
            this.state = State.ClientChallenge;
            return message;
        }
        catch (e) {
            this.state = State.Failed;
            throw e;
        }
    }
    receiveChallenge(challenge) {
        assert(this.state === State.ClientChallenge);
        try {
            const attrs = parseAttributes(challenge);
            const nonce = attrs.r;
            if (!attrs.r || !attrs.r.startsWith(this.clientNonce)) {
                throw new AuthError(Reason.BadServerNonce);
            }
            this.serverNonce = nonce;
            let salt;
            if (!attrs.s) {
                throw new AuthError(Reason.BadSalt);
            }
            try {
                salt = base64.decode(attrs.s);
            }
            catch {
                throw new AuthError(Reason.BadSalt);
            }
            const iterCount = parseInt(attrs.i) | 0;
            if (iterCount <= 0) {
                throw new AuthError(Reason.BadIterationCount);
            }
            this.keys = deriveKeys(this.password, salt, iterCount);
            this.authMessage += "," + challenge;
            this.state = State.ServerChallenge;
        }
        catch (e) {
            this.state = State.Failed;
            throw e;
        }
    }
    composeResponse() {
        assert(this.state === State.ServerChallenge);
        assert(this.keys);
        assert(this.serverNonce);
        try {
            const responseWithoutProof = `c=biws,r=${this.serverNonce}`;
            this.authMessage += "," + responseWithoutProof;
            const proof = base64.encode(computeProof(computeSignature(this.authMessage, this.keys.stored), this.keys.client));
            const message = `${responseWithoutProof},p=${proof}`;
            this.state = State.ClientResponse;
            return message;
        }
        catch (e) {
            this.state = State.Failed;
            throw e;
        }
    }
    receiveResponse(response) {
        assert(this.state === State.ClientResponse);
        assert(this.keys);
        try {
            const attrs = parseAttributes(response);
            if (attrs.e) {
                throw new AuthError(Reason.Rejected, attrs.e);
            }
            const verifier = base64.encode(computeSignature(this.authMessage, this.keys.server));
            if (attrs.v !== verifier) {
                throw new AuthError(Reason.BadVerifier);
            }
            this.state = State.ServerResponse;
        }
        catch (e) {
            this.state = State.Failed;
            throw e;
        }
    }
}
function generateNonce(size) {
    return base64.encode(crypto.getRandomValues(new Uint8Array(size)));
}
function parseAttributes(str) {
    const attrs = {};
    for (const entry of str.split(",")) {
        const pos = entry.indexOf("=");
        if (pos < 1) {
            throw new AuthError(Reason.BadMessage);
        }
        const key = entry.substr(0, pos);
        const value = entry.substr(pos + 1);
        attrs[key] = value;
    }
    return attrs;
}
function deriveKeys(password, salt, iterCount) {
    const ikm = bytes(normalize(password));
    const key = pbkdf2((msg) => sign(msg, ikm), salt, iterCount, 1);
    const server = sign(bytes("Server Key"), key);
    const client = sign(bytes("Client Key"), key);
    const stored = digest(client);
    return { server, client, stored };
}
function computeSignature(message, key) {
    return sign(bytes(message), key);
}
function computeProof(signature, key) {
    const proof = new Uint8Array(signature.length);
    for (let i = 0; i < proof.length; i++) {
        proof[i] = signature[i] ^ key[i];
    }
    return proof;
}
function bytes(str) {
    return new TextEncoder().encode(str);
}
function normalize(str) {
    const unsafe = /[^\x21-\x7e]/;
    if (unsafe.test(str)) {
        throw new Error("scram username/password is currently limited to safe ascii characters");
    }
    return str;
}
function escape(str) {
    return str
        .replace(/=/g, "=3D")
        .replace(/,/g, "=2C");
}
function digest(msg) {
    const hash = new Sha256();
    hash.update(msg);
    return new Uint8Array(hash.arrayBuffer());
}
function sign(msg, key) {
    const hmac = new HmacSha256(key);
    hmac.update(msg);
    return new Uint8Array(hmac.arrayBuffer());
}
function pbkdf2(prf, salt, iterCount, index) {
    let block = new Uint8Array(salt.length + 4);
    block.set(salt);
    block[salt.length + 0] = (index >> 24) & 0xFF;
    block[salt.length + 1] = (index >> 16) & 0xFF;
    block[salt.length + 2] = (index >> 8) & 0xFF;
    block[salt.length + 3] = index & 0xFF;
    block = prf(block);
    const key = block;
    for (let r = 1; r < iterCount; r++) {
        block = prf(block);
        for (let i = 0; i < key.length; i++) {
            key[i] ^= block[i];
        }
    }
    return key;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NyYW0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzY3JhbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFFeEQsU0FBUyxNQUFNLENBQUMsSUFBYTtJQUMzQixJQUFJLENBQUMsSUFBSSxFQUFFO1FBQ1QsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0tBQ3JDO0FBQ0gsQ0FBQztBQUdELE1BQU0sT0FBTyxTQUFVLFNBQVEsS0FBSztJQUNmO0lBQW5CLFlBQW1CLE1BQWMsRUFBRSxPQUFnQjtRQUNqRCxLQUFLLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxDQUFDO1FBRFIsV0FBTSxHQUFOLE1BQU0sQ0FBUTtJQUVqQyxDQUFDO0NBQ0Y7QUFHRCxNQUFNLENBQU4sSUFBWSxNQU9YO0FBUEQsV0FBWSxNQUFNO0lBQ2hCLDBEQUFnRCxDQUFBO0lBQ2hELHlEQUErQyxDQUFBO0lBQy9DLHNEQUE0QyxDQUFBO0lBQzVDLDJFQUFpRSxDQUFBO0lBQ2pFLG9EQUEwQyxDQUFBO0lBQzFDLHlDQUErQixDQUFBO0FBQ2pDLENBQUMsRUFQVyxNQUFNLEtBQU4sTUFBTSxRQU9qQjtBQUdELElBQUssS0FPSjtBQVBELFdBQUssS0FBSztJQUNSLGlDQUFJLENBQUE7SUFDSix1REFBZSxDQUFBO0lBQ2YsdURBQWUsQ0FBQTtJQUNmLHFEQUFjLENBQUE7SUFDZCxxREFBYyxDQUFBO0lBQ2QscUNBQU0sQ0FBQTtBQUNSLENBQUMsRUFQSSxLQUFLLEtBQUwsS0FBSyxRQU9UO0FBR0QsTUFBTSxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7QUFPNUIsTUFBTSxPQUFPLE1BQU07SUFDVCxRQUFRLENBQVM7SUFDakIsUUFBUSxDQUFTO0lBQ2pCLElBQUksQ0FBUTtJQUNaLFdBQVcsQ0FBUztJQUNwQixXQUFXLENBQVU7SUFDckIsV0FBVyxDQUFT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