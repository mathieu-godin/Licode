import { create_hash as createHash, digest_hash as digestHash, update_hash as updateHash, } from "./wasm.js";
import * as hex from "../../encoding/hex.ts";
import * as base64 from "../../encoding/base64.ts";
const TYPE_ERROR_MSG = "hash: `data` is invalid type";
export class Hash {
    #hash;
    #digested;
    constructor(algorithm) {
        this.#hash = createHash(algorithm);
        this.#digested = false;
    }
    update(data) {
        let msg;
        if (typeof data === "string") {
            msg = new TextEncoder().encode(data);
        }
        else if (typeof data === "object") {
            if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
                msg = new Uint8Array(data);
            }
            else {
                throw new Error(TYPE_ERROR_MSG);
            }
        }
        else {
            throw new Error(TYPE_ERROR_MSG);
        }
        const CHUNK_SIZE = 65_536;
        for (let offset = 0; offset < msg.length; offset += CHUNK_SIZE) {
            updateHash(this.#hash, new Uint8Array(msg.buffer, offset, Math.min(CHUNK_SIZE, msg.length - offset)));
        }
        return this;
    }
    digest() {
        if (this.#digested)
            throw new Error("hash: already digested");
        this.#digested = true;
        return digestHash(this.#hash);
    }
    toString(format = "hex") {
        const finalized = new Uint8Array(this.digest());
        switch (format) {
            case "hex":
                return new TextDecoder().decode(hex.encode(finalized));
            case "base64":
                return base64.encode(finalized);
            default:
                throw new Error("hash: invalid format");
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFzaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEwMS4wL2hhc2gvX3dhc20vaGFzaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxPQUFPLEVBQ0wsV0FBVyxJQUFJLFVBQVUsRUFFekIsV0FBVyxJQUFJLFVBQVUsRUFDekIsV0FBVyxJQUFJLFVBQVUsR0FDMUIsTUFBTSxXQUFXLENBQUM7QUFFbkIsT0FBTyxLQUFLLEdBQUcsTUFBTSx1QkFBdUIsQ0FBQztBQUM3QyxPQUFPLEtBQUssTUFBTSxNQUFNLDBCQUEwQixDQUFDO0FBR25ELE1BQU0sY0FBYyxHQUFHLDhCQUE4QixDQUFDO0FBRXRELE1BQU0sT0FBTyxJQUFJO0lBQ2YsS0FBSyxDQUFXO0lBQ2hCLFNBQVMsQ0FBVTtJQUVuQixZQUFZLFNBQWlCO1FBQzNCLElBQUksQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ25DLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO0lBQ3pCLENBQUM7SUFNRCxNQUFNLENBQUMsSUFBYTtRQUNsQixJQUFJLEdBQWUsQ0FBQztRQUVwQixJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRTtZQUM1QixHQUFHLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBYyxDQUFDLENBQUM7U0FDaEQ7YUFBTSxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRTtZQUNuQyxJQUFJLElBQUksWUFBWSxXQUFXLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDM0QsR0FBRyxHQUFHLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQzVCO2lCQUFNO2dCQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7YUFDakM7U0FDRjthQUFNO1lBQ0wsTUFBTSxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztTQUNqQztRQUlELE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQztRQUUxQixLQUFLLElBQUksTUFBTSxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxNQUFNLElBQUksVUFBVSxFQUFFO1lBQzlELFVBQVUsQ0FDUixJQUFJLENBQUMsS0FBSyxFQUNWLElBQUksVUFBVSxDQUNaLEdBQUcsQ0FBQyxNQUFNLEVBQ1YsTUFBTSxFQUNOLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLENBQzFDLENBQ0YsQ0FBQztTQUNIO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBR0QsTUFBTTtRQUNKLElBQUksSUFBSSxDQUFDLFNBQVM7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFFOUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDdEIsT0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFNRCxRQUFRLENBQUMsU0FBdUIsS0FBSztRQUNuQyxNQUFNLFNBQVMsR0FBRyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUVoRCxRQUFRLE1BQU0sRUFBRTtZQUNkLEtBQUssS0FBSztnQkFDUixPQUFPLElBQUksV0FBVyxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUN6RCxLQUFLLFFBQVE7Z0JBQ1gsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2xDO2dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQztTQUMzQztJQUNILENBQUM7Q0FDRiJ9