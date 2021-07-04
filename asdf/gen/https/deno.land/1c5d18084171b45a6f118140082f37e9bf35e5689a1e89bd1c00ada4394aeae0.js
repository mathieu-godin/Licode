import { copyBytes } from "./deps.ts";
export class AsyncIterableReader {
    #asyncIterator;
    #closed = false;
    #current;
    #processValue;
    constructor(asyncIterable, processValue) {
        this.#asyncIterator = asyncIterable[Symbol.asyncIterator]();
        this.#processValue = processValue;
    }
    #close() {
        if (this.#asyncIterator.return) {
            this.#asyncIterator.return();
        }
        this.#asyncIterator = undefined;
        this.#closed = true;
    }
    async read(p) {
        if (this.#closed) {
            return null;
        }
        if (p.byteLength === 0) {
            this.#close();
            return 0;
        }
        if (!this.#current) {
            const { value, done } = await this.#asyncIterator.next();
            if (done) {
                this.#close();
            }
            if (value !== undefined) {
                this.#current = this.#processValue(value);
            }
        }
        if (!this.#current) {
            if (!this.#closed) {
                this.#close();
            }
            return null;
        }
        const len = copyBytes(this.#current, p);
        if (len >= this.#current.byteLength) {
            this.#current = undefined;
        }
        else {
            this.#current = this.#current.slice(len);
        }
        return len;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN5bmNfaXRlcmFibGVfcmVhZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXN5bmNfaXRlcmFibGVfcmVhZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFFdEMsTUFBTSxPQUFPLG1CQUFtQjtJQUM5QixjQUFjLENBQW1CO0lBQ2pDLE9BQU8sR0FBRyxLQUFLLENBQUM7SUFDaEIsUUFBUSxDQUF5QjtJQUNqQyxhQUFhLENBQTJCO0lBRXhDLFlBQ0UsYUFBK0IsRUFDL0IsWUFBc0M7UUFFdEMsSUFBSSxDQUFDLGNBQWMsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUM7UUFDNUQsSUFBSSxDQUFDLGFBQWEsR0FBRyxZQUFZLENBQUM7SUFDcEMsQ0FBQztJQUVELE1BQU07UUFDSixJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFO1lBQzlCLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDOUI7UUFFQSxJQUFZLENBQUMsY0FBYyxHQUFHLFNBQVMsQ0FBQztRQUN6QyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztJQUN0QixDQUFDO0lBRUQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFhO1FBQ3RCLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNoQixPQUFPLElBQUksQ0FBQztTQUNiO1FBQ0QsSUFBSSxDQUFDLENBQUMsVUFBVSxLQUFLLENBQUMsRUFBRTtZQUN0QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDZCxPQUFPLENBQUMsQ0FBQztTQUNWO1FBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDbEIsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDekQsSUFBSSxJQUFJLEVBQUU7Z0JBQ1IsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2FBQ2Y7WUFDRCxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7Z0JBQ3ZCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUMzQztTQUNGO1FBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDbEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ2pCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQzthQUNmO1lBQ0QsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUNELE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3hDLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFO1lBQ25DLElBQUksQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDO1NBQzNCO2FBQU07WUFDTCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzFDO1FBQ0QsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDO0NBQ0YifQ==