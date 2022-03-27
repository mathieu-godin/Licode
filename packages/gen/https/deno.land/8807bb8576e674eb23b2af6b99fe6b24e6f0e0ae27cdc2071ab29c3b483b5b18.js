import { compare } from "./tssCompare.ts";
import { encodeBase64Safe, importKey, sign } from "./util.ts";
export class KeyStack {
    #cryptoKeys = new Map();
    #keys;
    async #toCryptoKey(key) {
        if (!this.#cryptoKeys.has(key)) {
            this.#cryptoKeys.set(key, await importKey(key));
        }
        return this.#cryptoKeys.get(key);
    }
    get length() {
        return this.#keys.length;
    }
    constructor(keys) {
        if (!(0 in keys)) {
            throw new TypeError("keys must contain at least one value");
        }
        this.#keys = keys;
    }
    async sign(data) {
        const key = await this.#toCryptoKey(this.#keys[0]);
        return encodeBase64Safe(await sign(data, key));
    }
    async verify(data, digest) {
        return (await this.indexOf(data, digest)) > -1;
    }
    async indexOf(data, digest) {
        for (let i = 0; i < this.#keys.length; i++) {
            const cryptoKey = await this.#toCryptoKey(this.#keys[i]);
            if (await compare(digest, encodeBase64Safe(await sign(data, cryptoKey)))) {
                return i;
            }
        }
        return -1;
    }
    [Symbol.for("Deno.customInspect")](inspect) {
        const { length } = this;
        return `${this.constructor.name} ${inspect({ length })}`;
    }
    [Symbol.for("nodejs.util.inspect.custom")](depth, options, inspect) {
        if (depth < 0) {
            return options.stylize(`[${this.constructor.name}]`, "special");
        }
        const newOptions = Object.assign({}, options, {
            depth: options.depth === null ? null : options.depth - 1,
        });
        const { length } = this;
        return `${options.stylize(this.constructor.name, "special")} ${inspect({ length }, newOptions)}`;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5U3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJrZXlTdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFNQSxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDMUMsT0FBTyxFQUFFLGdCQUFnQixFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFHOUQsTUFBTSxPQUFPLFFBQVE7SUFDbkIsV0FBVyxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO0lBQ3hDLEtBQUssQ0FBUTtJQUViLEtBQUssQ0FBQyxZQUFZLENBQUMsR0FBUTtRQUN6QixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDOUIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE1BQU0sU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDakQ7UUFDRCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBRSxDQUFDO0lBQ3BDLENBQUM7SUFFRCxJQUFJLE1BQU07UUFDUixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO0lBQzNCLENBQUM7SUFTRCxZQUFZLElBQVc7UUFDckIsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxFQUFFO1lBQ2hCLE1BQU0sSUFBSSxTQUFTLENBQUMsc0NBQXNDLENBQUMsQ0FBQztTQUM3RDtRQUNELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQ3BCLENBQUM7SUFLRCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQVU7UUFDbkIsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRCxPQUFPLGdCQUFnQixDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFLRCxLQUFLLENBQUMsTUFBTSxDQUFDLElBQVUsRUFBRSxNQUFjO1FBQ3JDLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUtELEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBVSxFQUFFLE1BQWM7UUFDdEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzFDLE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekQsSUFDRSxNQUFNLE9BQU8sQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFDcEU7Z0JBQ0EsT0FBTyxDQUFDLENBQUM7YUFDVjtTQUNGO1FBQ0QsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUNaLENBQUM7SUFFRCxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLE9BQW1DO1FBQ3BFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFDeEIsT0FBTyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxJQUFJLE9BQU8sQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQztJQUMzRCxDQUFDO0lBRUQsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLENBQUMsQ0FDeEMsS0FBYSxFQUViLE9BQVksRUFDWixPQUFzRDtRQUV0RCxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7WUFDYixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1NBQ2pFO1FBRUQsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFO1lBQzVDLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLENBQUM7U0FDekQsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQztRQUN4QixPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsSUFDekQsT0FBTyxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsVUFBVSxDQUNoQyxFQUFFLENBQUM7SUFDTCxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBvYWsgYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbi8vIFRoaXMgd2FzIGluc3BpcmVkIGJ5IFtrZXlncmlwXShodHRwczovL2dpdGh1Yi5jb20vY3J5cHRvLXV0aWxzL2tleWdyaXAvKVxuLy8gd2hpY2ggYWxsb3dzIHNpZ25pbmcgb2YgZGF0YSAoY29va2llcykgdG8gcHJldmVudCB0YW1wZXJpbmcsIGJ1dCBhbHNvIGFsbG93c1xuLy8gZm9yIGVhc3kga2V5IHJvdGF0aW9uIHdpdGhvdXQgbmVlZGluZyB0byByZXNpZ24gdGhlIGRhdGEuXG5cbmltcG9ydCB7IGNvbXBhcmUgfSBmcm9tIFwiLi90c3NDb21wYXJlLnRzXCI7XG5pbXBvcnQgeyBlbmNvZGVCYXNlNjRTYWZlLCBpbXBvcnRLZXksIHNpZ24gfSBmcm9tIFwiLi91dGlsLnRzXCI7XG5pbXBvcnQgdHlwZSB7IERhdGEsIEtleSB9IGZyb20gXCIuL3R5cGVzLmQudHNcIjtcblxuZXhwb3J0IGNsYXNzIEtleVN0YWNrIHtcbiAgI2NyeXB0b0tleXMgPSBuZXcgTWFwPEtleSwgQ3J5cHRvS2V5PigpO1xuICAja2V5czogS2V5W107XG5cbiAgYXN5bmMgI3RvQ3J5cHRvS2V5KGtleTogS2V5KTogUHJvbWlzZTxDcnlwdG9LZXk+IHtcbiAgICBpZiAoIXRoaXMuI2NyeXB0b0tleXMuaGFzKGtleSkpIHtcbiAgICAgIHRoaXMuI2NyeXB0b0tleXMuc2V0KGtleSwgYXdhaXQgaW1wb3J0S2V5KGtleSkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy4jY3J5cHRvS2V5cy5nZXQoa2V5KSE7XG4gIH1cblxuICBnZXQgbGVuZ3RoKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuI2tleXMubGVuZ3RoO1xuICB9XG5cbiAgLyoqIEEgY2xhc3Mgd2hpY2ggYWNjZXB0cyBhbiBhcnJheSBvZiBrZXlzIHRoYXQgYXJlIHVzZWQgdG8gc2lnbiBhbmQgdmVyaWZ5XG4gICAqIGRhdGEgYW5kIGFsbG93cyBlYXN5IGtleSByb3RhdGlvbiB3aXRob3V0IGludmFsaWRhdGlvbiBvZiBwcmV2aW91c2x5IHNpZ25lZFxuICAgKiBkYXRhLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5cyBBbiBhcnJheSBvZiBrZXlzLCBvZiB3aGljaCB0aGUgaW5kZXggMCB3aWxsIGJlIHVzZWQgdG8gc2lnblxuICAgKiAgICAgICAgICAgICBkYXRhLCBidXQgdmVyaWZpY2F0aW9uIGNhbiBoYXBwZW4gYWdhaW5zdCBhbnkga2V5LlxuICAgKi9cbiAgY29uc3RydWN0b3Ioa2V5czogS2V5W10pIHtcbiAgICBpZiAoISgwIGluIGtleXMpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwia2V5cyBtdXN0IGNvbnRhaW4gYXQgbGVhc3Qgb25lIHZhbHVlXCIpO1xuICAgIH1cbiAgICB0aGlzLiNrZXlzID0ga2V5cztcbiAgfVxuXG4gIC8qKiBUYWtlIGBkYXRhYCBhbmQgcmV0dXJuIGEgU0hBMjU2IEhNQUMgZGlnZXN0IHRoYXQgdXNlcyB0aGUgY3VycmVudCAwIGluZGV4XG4gICAqIG9mIHRoZSBga2V5c2AgcGFzc2VkIHRvIHRoZSBjb25zdHJ1Y3Rvci4gIFRoaXMgZGlnZXN0IGlzIGluIHRoZSBmb3JtIG9mIGFcbiAgICogVVJMIHNhZmUgYmFzZTY0IGVuY29kZWQgc3RyaW5nLiAqL1xuICBhc3luYyBzaWduKGRhdGE6IERhdGEpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGtleSA9IGF3YWl0IHRoaXMuI3RvQ3J5cHRvS2V5KHRoaXMuI2tleXNbMF0pO1xuICAgIHJldHVybiBlbmNvZGVCYXNlNjRTYWZlKGF3YWl0IHNpZ24oZGF0YSwga2V5KSk7XG4gIH1cblxuICAvKiogR2l2ZW4gYGRhdGFgIGFuZCBhIGBkaWdlc3RgLCB2ZXJpZnkgdGhhdCBvbmUgb2YgdGhlIGBrZXlzYCBwcm92aWRlZCB0aGVcbiAgICogY29uc3RydWN0b3Igd2FzIHVzZWQgdG8gZ2VuZXJhdGUgdGhlIGBkaWdlc3RgLiAgUmV0dXJucyBgdHJ1ZWAgaWYgb25lIG9mXG4gICAqIHRoZSBrZXlzIHdhcyB1c2VkLCBvdGhlcndpc2UgYGZhbHNlYC4gKi9cbiAgYXN5bmMgdmVyaWZ5KGRhdGE6IERhdGEsIGRpZ2VzdDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmluZGV4T2YoZGF0YSwgZGlnZXN0KSkgPiAtMTtcbiAgfVxuXG4gIC8qKiBHaXZlbiBgZGF0YWAgYW5kIGEgYGRpZ2VzdGAsIHJldHVybiB0aGUgY3VycmVudCBpbmRleCBvZiB0aGUga2V5IGluIHRoZVxuICAgKiBga2V5c2AgcGFzc2VkIHRoZSBjb25zdHJ1Y3RvciB0aGF0IHdhcyB1c2VkIHRvIGdlbmVyYXRlIHRoZSBkaWdlc3QuICBJZiBub1xuICAgKiBrZXkgY2FuIGJlIGZvdW5kLCB0aGUgbWV0aG9kIHJldHVybnMgYC0xYC4gKi9cbiAgYXN5bmMgaW5kZXhPZihkYXRhOiBEYXRhLCBkaWdlc3Q6IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLiNrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjcnlwdG9LZXkgPSBhd2FpdCB0aGlzLiN0b0NyeXB0b0tleSh0aGlzLiNrZXlzW2ldKTtcbiAgICAgIGlmIChcbiAgICAgICAgYXdhaXQgY29tcGFyZShkaWdlc3QsIGVuY29kZUJhc2U2NFNhZmUoYXdhaXQgc2lnbihkYXRhLCBjcnlwdG9LZXkpKSlcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gaTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xO1xuICB9XG5cbiAgW1N5bWJvbC5mb3IoXCJEZW5vLmN1c3RvbUluc3BlY3RcIildKGluc3BlY3Q6ICh2YWx1ZTogdW5rbm93bikgPT4gc3RyaW5nKSB7XG4gICAgY29uc3QgeyBsZW5ndGggfSA9IHRoaXM7XG4gICAgcmV0dXJuIGAke3RoaXMuY29uc3RydWN0b3IubmFtZX0gJHtpbnNwZWN0KHsgbGVuZ3RoIH0pfWA7XG4gIH1cblxuICBbU3ltYm9sLmZvcihcIm5vZGVqcy51dGlsLmluc3BlY3QuY3VzdG9tXCIpXShcbiAgICBkZXB0aDogbnVtYmVyLFxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgb3B0aW9uczogYW55LFxuICAgIGluc3BlY3Q6ICh2YWx1ZTogdW5rbm93biwgb3B0aW9ucz86IHVua25vd24pID0+IHN0cmluZyxcbiAgKSB7XG4gICAgaWYgKGRlcHRoIDwgMCkge1xuICAgICAgcmV0dXJuIG9wdGlvbnMuc3R5bGl6ZShgWyR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfV1gLCBcInNwZWNpYWxcIik7XG4gICAgfVxuXG4gICAgY29uc3QgbmV3T3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHtcbiAgICAgIGRlcHRoOiBvcHRpb25zLmRlcHRoID09PSBudWxsID8gbnVsbCA6IG9wdGlvbnMuZGVwdGggLSAxLFxuICAgIH0pO1xuICAgIGNvbnN0IHsgbGVuZ3RoIH0gPSB0aGlzO1xuICAgIHJldHVybiBgJHtvcHRpb25zLnN0eWxpemUodGhpcy5jb25zdHJ1Y3Rvci5uYW1lLCBcInNwZWNpYWxcIil9ICR7XG4gICAgICBpbnNwZWN0KHsgbGVuZ3RoIH0sIG5ld09wdGlvbnMpXG4gICAgfWA7XG4gIH1cbn1cbiJdfQ==