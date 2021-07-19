import { copyBytes } from "../bytes/mod.ts";
import { assert } from "../_util/assert.ts";
const DEFAULT_BUF_SIZE = 4096;
const MIN_BUF_SIZE = 16;
const MAX_CONSECUTIVE_EMPTY_READS = 100;
const CR = "\r".charCodeAt(0);
const LF = "\n".charCodeAt(0);
export class BufferFullError extends Error {
    partial;
    name = "BufferFullError";
    constructor(partial) {
        super("Buffer full");
        this.partial = partial;
    }
}
export class PartialReadError extends Deno.errors.UnexpectedEof {
    name = "PartialReadError";
    partial;
    constructor() {
        super("Encountered UnexpectedEof, data only partially read");
    }
}
export class BufReader {
    buf;
    rd;
    r = 0;
    w = 0;
    eof = false;
    static create(r, size = DEFAULT_BUF_SIZE) {
        return r instanceof BufReader ? r : new BufReader(r, size);
    }
    constructor(rd, size = DEFAULT_BUF_SIZE) {
        if (size < MIN_BUF_SIZE) {
            size = MIN_BUF_SIZE;
        }
        this._reset(new Uint8Array(size), rd);
    }
    size() {
        return this.buf.byteLength;
    }
    buffered() {
        return this.w - this.r;
    }
    async _fill() {
        if (this.r > 0) {
            this.buf.copyWithin(0, this.r, this.w);
            this.w -= this.r;
            this.r = 0;
        }
        if (this.w >= this.buf.byteLength) {
            throw Error("bufio: tried to fill full buffer");
        }
        for (let i = MAX_CONSECUTIVE_EMPTY_READS; i > 0; i--) {
            const rr = await this.rd.read(this.buf.subarray(this.w));
            if (rr === null) {
                this.eof = true;
                return;
            }
            assert(rr >= 0, "negative read");
            this.w += rr;
            if (rr > 0) {
                return;
            }
        }
        throw new Error(`No progress after ${MAX_CONSECUTIVE_EMPTY_READS} read() calls`);
    }
    reset(r) {
        this._reset(this.buf, r);
    }
    _reset(buf, rd) {
        this.buf = buf;
        this.rd = rd;
        this.eof = false;
    }
    async read(p) {
        let rr = p.byteLength;
        if (p.byteLength === 0)
            return rr;
        if (this.r === this.w) {
            if (p.byteLength >= this.buf.byteLength) {
                const rr = await this.rd.read(p);
                const nread = rr ?? 0;
                assert(nread >= 0, "negative read");
                return rr;
            }
            this.r = 0;
            this.w = 0;
            rr = await this.rd.read(this.buf);
            if (rr === 0 || rr === null)
                return rr;
            assert(rr >= 0, "negative read");
            this.w += rr;
        }
        const copied = copyBytes(this.buf.subarray(this.r, this.w), p, 0);
        this.r += copied;
        return copied;
    }
    async readFull(p) {
        let bytesRead = 0;
        while (bytesRead < p.length) {
            try {
                const rr = await this.read(p.subarray(bytesRead));
                if (rr === null) {
                    if (bytesRead === 0) {
                        return null;
                    }
                    else {
                        throw new PartialReadError();
                    }
                }
                bytesRead += rr;
            }
            catch (err) {
                err.partial = p.subarray(0, bytesRead);
                throw err;
            }
        }
        return p;
    }
    async readByte() {
        while (this.r === this.w) {
            if (this.eof)
                return null;
            await this._fill();
        }
        const c = this.buf[this.r];
        this.r++;
        return c;
    }
    async readString(delim) {
        if (delim.length !== 1) {
            throw new Error("Delimiter should be a single character");
        }
        const buffer = await this.readSlice(delim.charCodeAt(0));
        if (buffer === null)
            return null;
        return new TextDecoder().decode(buffer);
    }
    async readLine() {
        let line;
        try {
            line = await this.readSlice(LF);
        }
        catch (err) {
            let { partial } = err;
            assert(partial instanceof Uint8Array, "bufio: caught error from `readSlice()` without `partial` property");
            if (!(err instanceof BufferFullError)) {
                throw err;
            }
            if (!this.eof &&
                partial.byteLength > 0 &&
                partial[partial.byteLength - 1] === CR) {
                assert(this.r > 0, "bufio: tried to rewind past start of buffer");
                this.r--;
                partial = partial.subarray(0, partial.byteLength - 1);
            }
            return { line: partial, more: !this.eof };
        }
        if (line === null) {
            return null;
        }
        if (line.byteLength === 0) {
            return { line, more: false };
        }
        if (line[line.byteLength - 1] == LF) {
            let drop = 1;
            if (line.byteLength > 1 && line[line.byteLength - 2] === CR) {
                drop = 2;
            }
            line = line.subarray(0, line.byteLength - drop);
        }
        return { line, more: false };
    }
    async readSlice(delim) {
        let s = 0;
        let slice;
        while (true) {
            let i = this.buf.subarray(this.r + s, this.w).indexOf(delim);
            if (i >= 0) {
                i += s;
                slice = this.buf.subarray(this.r, this.r + i + 1);
                this.r += i + 1;
                break;
            }
            if (this.eof) {
                if (this.r === this.w) {
                    return null;
                }
                slice = this.buf.subarray(this.r, this.w);
                this.r = this.w;
                break;
            }
            if (this.buffered() >= this.buf.byteLength) {
                this.r = this.w;
                const oldbuf = this.buf;
                const newbuf = this.buf.slice(0);
                this.buf = newbuf;
                throw new BufferFullError(oldbuf);
            }
            s = this.w - this.r;
            try {
                await this._fill();
            }
            catch (err) {
                err.partial = slice;
                throw err;
            }
        }
        return slice;
    }
    async peek(n) {
        if (n < 0) {
            throw Error("negative count");
        }
        let avail = this.w - this.r;
        while (avail < n && avail < this.buf.byteLength && !this.eof) {
            try {
                await this._fill();
            }
            catch (err) {
                err.partial = this.buf.subarray(this.r, this.w);
                throw err;
            }
            avail = this.w - this.r;
        }
        if (avail === 0 && this.eof) {
            return null;
        }
        else if (avail < n && this.eof) {
            return this.buf.subarray(this.r, this.r + avail);
        }
        else if (avail < n) {
            throw new BufferFullError(this.buf.subarray(this.r, this.w));
        }
        return this.buf.subarray(this.r, this.r + n);
    }
}
class AbstractBufBase {
    buf;
    usedBufferBytes = 0;
    err = null;
    size() {
        return this.buf.byteLength;
    }
    available() {
        return this.buf.byteLength - this.usedBufferBytes;
    }
    buffered() {
        return this.usedBufferBytes;
    }
}
export class BufWriter extends AbstractBufBase {
    writer;
    static create(writer, size = DEFAULT_BUF_SIZE) {
        return writer instanceof BufWriter ? writer : new BufWriter(writer, size);
    }
    constructor(writer, size = DEFAULT_BUF_SIZE) {
        super();
        this.writer = writer;
        if (size <= 0) {
            size = DEFAULT_BUF_SIZE;
        }
        this.buf = new Uint8Array(size);
    }
    reset(w) {
        this.err = null;
        this.usedBufferBytes = 0;
        this.writer = w;
    }
    async flush() {
        if (this.err !== null)
            throw this.err;
        if (this.usedBufferBytes === 0)
            return;
        try {
            await Deno.writeAll(this.writer, this.buf.subarray(0, this.usedBufferBytes));
        }
        catch (e) {
            this.err = e;
            throw e;
        }
        this.buf = new Uint8Array(this.buf.length);
        this.usedBufferBytes = 0;
    }
    async write(data) {
        if (this.err !== null)
            throw this.err;
        if (data.length === 0)
            return 0;
        let totalBytesWritten = 0;
        let numBytesWritten = 0;
        while (data.byteLength > this.available()) {
            if (this.buffered() === 0) {
                try {
                    numBytesWritten = await this.writer.write(data);
                }
                catch (e) {
                    this.err = e;
                    throw e;
                }
            }
            else {
                numBytesWritten = copyBytes(data, this.buf, this.usedBufferBytes);
                this.usedBufferBytes += numBytesWritten;
                await this.flush();
            }
            totalBytesWritten += numBytesWritten;
            data = data.subarray(numBytesWritten);
        }
        numBytesWritten = copyBytes(data, this.buf, this.usedBufferBytes);
        this.usedBufferBytes += numBytesWritten;
        totalBytesWritten += numBytesWritten;
        return totalBytesWritten;
    }
}
export class BufWriterSync extends AbstractBufBase {
    writer;
    static create(writer, size = DEFAULT_BUF_SIZE) {
        return writer instanceof BufWriterSync
            ? writer
            : new BufWriterSync(writer, size);
    }
    constructor(writer, size = DEFAULT_BUF_SIZE) {
        super();
        this.writer = writer;
        if (size <= 0) {
            size = DEFAULT_BUF_SIZE;
        }
        this.buf = new Uint8Array(size);
    }
    reset(w) {
        this.err = null;
        this.usedBufferBytes = 0;
        this.writer = w;
    }
    flush() {
        if (this.err !== null)
            throw this.err;
        if (this.usedBufferBytes === 0)
            return;
        try {
            Deno.writeAllSync(this.writer, this.buf.subarray(0, this.usedBufferBytes));
        }
        catch (e) {
            this.err = e;
            throw e;
        }
        this.buf = new Uint8Array(this.buf.length);
        this.usedBufferBytes = 0;
    }
    writeSync(data) {
        if (this.err !== null)
            throw this.err;
        if (data.length === 0)
            return 0;
        let totalBytesWritten = 0;
        let numBytesWritten = 0;
        while (data.byteLength > this.available()) {
            if (this.buffered() === 0) {
                try {
                    numBytesWritten = this.writer.writeSync(data);
                }
                catch (e) {
                    this.err = e;
                    throw e;
                }
            }
            else {
                numBytesWritten = copyBytes(data, this.buf, this.usedBufferBytes);
                this.usedBufferBytes += numBytesWritten;
                this.flush();
            }
            totalBytesWritten += numBytesWritten;
            data = data.subarray(numBytesWritten);
        }
        numBytesWritten = copyBytes(data, this.buf, this.usedBufferBytes);
        this.usedBufferBytes += numBytesWritten;
        totalBytesWritten += numBytesWritten;
        return totalBytesWritten;
    }
}
function createLPS(pat) {
    const lps = new Uint8Array(pat.length);
    lps[0] = 0;
    let prefixEnd = 0;
    let i = 1;
    while (i < lps.length) {
        if (pat[i] == pat[prefixEnd]) {
            prefixEnd++;
            lps[i] = prefixEnd;
            i++;
        }
        else if (prefixEnd === 0) {
            lps[i] = 0;
            i++;
        }
        else {
            prefixEnd = pat[prefixEnd - 1];
        }
    }
    return lps;
}
export async function* readDelim(reader, delim) {
    const delimLen = delim.length;
    const delimLPS = createLPS(delim);
    let inputBuffer = new Deno.Buffer();
    const inspectArr = new Uint8Array(Math.max(1024, delimLen + 1));
    let inspectIndex = 0;
    let matchIndex = 0;
    while (true) {
        const result = await reader.read(inspectArr);
        if (result === null) {
            yield inputBuffer.bytes();
            return;
        }
        if (result < 0) {
            return;
        }
        const sliceRead = inspectArr.subarray(0, result);
        await Deno.writeAll(inputBuffer, sliceRead);
        let sliceToProcess = inputBuffer.bytes();
        while (inspectIndex < sliceToProcess.length) {
            if (sliceToProcess[inspectIndex] === delim[matchIndex]) {
                inspectIndex++;
                matchIndex++;
                if (matchIndex === delimLen) {
                    const matchEnd = inspectIndex - delimLen;
                    const readyBytes = sliceToProcess.subarray(0, matchEnd);
                    const pendingBytes = sliceToProcess.slice(inspectIndex);
                    yield readyBytes;
                    sliceToProcess = pendingBytes;
                    inspectIndex = 0;
                    matchIndex = 0;
                }
            }
            else {
                if (matchIndex === 0) {
                    inspectIndex++;
                }
                else {
                    matchIndex = delimLPS[matchIndex - 1];
                }
            }
        }
        inputBuffer = new Deno.Buffer(sliceToProcess);
    }
}
export async function* readStringDelim(reader, delim) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    for await (const chunk of readDelim(reader, encoder.encode(delim))) {
        yield decoder.decode(chunk);
    }
}
export async function* readLines(reader) {
    yield* readStringDelim(reader, "\n");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmaW8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC43NC4wL2lvL2J1ZmlvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVNBLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUM1QyxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFFNUMsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7QUFDOUIsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDO0FBQ3hCLE1BQU0sMkJBQTJCLEdBQUcsR0FBRyxDQUFDO0FBQ3hDLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUU5QixNQUFNLE9BQU8sZUFBZ0IsU0FBUSxLQUFLO0lBRXJCO0lBRG5CLElBQUksR0FBRyxpQkFBaUIsQ0FBQztJQUN6QixZQUFtQixPQUFtQjtRQUNwQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7UUFESixZQUFPLEdBQVAsT0FBTyxDQUFZO0lBRXRDLENBQUM7Q0FDRjtBQUVELE1BQU0sT0FBTyxnQkFBaUIsU0FBUSxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWE7SUFDN0QsSUFBSSxHQUFHLGtCQUFrQixDQUFDO0lBQzFCLE9BQU8sQ0FBYztJQUNyQjtRQUNFLEtBQUssQ0FBQyxxREFBcUQsQ0FBQyxDQUFDO0lBQy9ELENBQUM7Q0FDRjtBQVNELE1BQU0sT0FBTyxTQUFTO0lBQ1osR0FBRyxDQUFjO0lBQ2pCLEVBQUUsQ0FBVTtJQUNaLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDTixDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ04sR0FBRyxHQUFHLEtBQUssQ0FBQztJQUtwQixNQUFNLENBQUMsTUFBTSxDQUFDLENBQVMsRUFBRSxPQUFlLGdCQUFnQjtR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