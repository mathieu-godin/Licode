import { readerFromStreamReader } from "./deps.ts";
import { httpErrors } from "./httpError.ts";
import { isMediaType } from "./isMediaType.ts";
import { FormDataReader } from "./multipart.ts";
import { assert } from "./util.ts";
const DEFAULT_LIMIT = 10_485_760;
const defaultBodyContentTypes = {
    json: ["json", "application/*+json", "application/csp-report"],
    form: ["urlencoded"],
    formData: ["multipart"],
    text: ["text"],
};
function resolveType(contentType, contentTypes) {
    const contentTypesJson = [
        ...defaultBodyContentTypes.json,
        ...(contentTypes.json ?? []),
    ];
    const contentTypesForm = [
        ...defaultBodyContentTypes.form,
        ...(contentTypes.form ?? []),
    ];
    const contentTypesFormData = [
        ...defaultBodyContentTypes.formData,
        ...(contentTypes.formData ?? []),
    ];
    const contentTypesText = [
        ...defaultBodyContentTypes.text,
        ...(contentTypes.text ?? []),
    ];
    if (contentTypes.bytes && isMediaType(contentType, contentTypes.bytes)) {
        return "bytes";
    }
    else if (isMediaType(contentType, contentTypesJson)) {
        return "json";
    }
    else if (isMediaType(contentType, contentTypesForm)) {
        return "form";
    }
    else if (isMediaType(contentType, contentTypesFormData)) {
        return "form-data";
    }
    else if (isMediaType(contentType, contentTypesText)) {
        return "text";
    }
    return "bytes";
}
const decoder = new TextDecoder();
export class RequestBody {
    #body;
    #formDataReader;
    #headers;
    #stream;
    #readAllBody;
    #readBody;
    #type;
    #exceedsLimit(limit) {
        if (!limit || limit === Infinity) {
            return false;
        }
        if (!this.#body) {
            return false;
        }
        const contentLength = this.#headers.get("content-length");
        if (!contentLength) {
            return true;
        }
        const parsed = parseInt(contentLength, 10);
        if (isNaN(parsed)) {
            return true;
        }
        return parsed > limit;
    }
    #parse(type, limit) {
        switch (type) {
            case "form":
                this.#type = "bytes";
                if (this.#exceedsLimit(limit)) {
                    return () => Promise.reject(new RangeError(`Body exceeds a limit of ${limit}.`));
                }
                return async () => new URLSearchParams(decoder.decode(await this.#valuePromise()).replace(/\+/g, " "));
            case "form-data":
                this.#type = "form-data";
                return () => {
                    const contentType = this.#headers.get("content-type");
                    assert(contentType);
                    const readableStream = this.#body ?? new ReadableStream();
                    return this.#formDataReader ??
                        (this.#formDataReader = new FormDataReader(contentType, readerFromStreamReader(readableStream.getReader())));
                };
            case "json":
                this.#type = "bytes";
                if (this.#exceedsLimit(limit)) {
                    return () => Promise.reject(new RangeError(`Body exceeds a limit of ${limit}.`));
                }
                return async () => JSON.parse(decoder.decode(await this.#valuePromise()));
            case "bytes":
                this.#type = "bytes";
                if (this.#exceedsLimit(limit)) {
                    return () => Promise.reject(new RangeError(`Body exceeds a limit of ${limit}.`));
                }
                return () => this.#valuePromise();
            case "text":
                this.#type = "bytes";
                if (this.#exceedsLimit(limit)) {
                    return () => Promise.reject(new RangeError(`Body exceeds a limit of ${limit}.`));
                }
                return async () => decoder.decode(await this.#valuePromise());
            default:
                throw new TypeError(`Invalid body type: "${type}"`);
        }
    }
    #validateGetArgs(type, contentTypes) {
        if (type === "reader" && this.#type && this.#type !== "reader") {
            throw new TypeError(`Body already consumed as "${this.#type}" and cannot be returned as a reader.`);
        }
        if (type === "stream" && this.#type && this.#type !== "stream") {
            throw new TypeError(`Body already consumed as "${this.#type}" and cannot be returned as a stream.`);
        }
        if (type === "form-data" && this.#type && this.#type !== "form-data") {
            throw new TypeError(`Body already consumed as "${this.#type}" and cannot be returned as a stream.`);
        }
        if (this.#type === "reader" && type !== "reader") {
            throw new TypeError("Body already consumed as a reader and can only be returned as a reader.");
        }
        if (this.#type === "stream" && type !== "stream") {
            throw new TypeError("Body already consumed as a stream and can only be returned as a stream.");
        }
        if (this.#type === "form-data" && type !== "form-data") {
            throw new TypeError("Body already consumed as form data and can only be returned as form data.");
        }
        if (type && Object.keys(contentTypes).length) {
            throw new TypeError(`"type" and "contentTypes" cannot be specified at the same time`);
        }
    }
    #valuePromise() {
        return this.#readAllBody ?? (this.#readAllBody = this.#readBody());
    }
    constructor({ body, readBody }, headers) {
        this.#body = body;
        this.#headers = headers;
        this.#readBody = readBody;
    }
    get({ limit = DEFAULT_LIMIT, type, contentTypes = {} } = {}) {
        this.#validateGetArgs(type, contentTypes);
        if (type === "reader") {
            if (!this.#body) {
                this.#type = "undefined";
                throw new TypeError(`Body is undefined and cannot be returned as "reader".`);
            }
            this.#type = "reader";
            return {
                type,
                value: readerFromStreamReader(this.#body.getReader()),
            };
        }
        if (type === "stream") {
            if (!this.#body) {
                this.#type = "undefined";
                throw new TypeError(`Body is undefined and cannot be returned as "stream".`);
            }
            this.#type = "stream";
            const streams = (this.#stream ?? this.#body)
                .tee();
            this.#stream = streams[1];
            return { type, value: streams[0] };
        }
        if (!this.has()) {
            this.#type = "undefined";
        }
        else if (!this.#type) {
            const encoding = this.#headers.get("content-encoding") ??
                "identity";
            if (encoding !== "identity") {
                throw new httpErrors.UnsupportedMediaType(`Unsupported content-encoding: ${encoding}`);
            }
        }
        if (this.#type === "undefined" && (!type || type === "undefined")) {
            return { type: "undefined", value: undefined };
        }
        if (!type) {
            const contentType = this.#headers.get("content-type");
            assert(contentType, "The Content-Type header is missing from the request");
            type = resolveType(contentType, contentTypes);
        }
        assert(type);
        const body = Object.create(null);
        Object.defineProperties(body, {
            type: {
                value: type,
                configurable: true,
                enumerable: true,
            },
            value: {
                get: this.#parse(type, limit),
                configurable: true,
                enumerable: true,
            },
        });
        return body;
    }
    has() {
        return this.#body != null;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm9keS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJvZHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsT0FBTyxFQUFFLHNCQUFzQixFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQ25ELE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUM1QyxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDL0MsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBRWhELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFxSW5DLE1BQU0sYUFBYSxHQUFHLFVBQVUsQ0FBQztBQUVqQyxNQUFNLHVCQUF1QixHQUFHO0lBQzlCLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxvQkFBb0IsRUFBRSx3QkFBd0IsQ0FBQztJQUM5RCxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUM7SUFDcEIsUUFBUSxFQUFFLENBQUMsV0FBVyxDQUFDO0lBQ3ZCLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQztDQUNmLENBQUM7QUFFRixTQUFTLFdBQVcsQ0FDbEIsV0FBbUIsRUFDbkIsWUFBcUM7SUFFckMsTUFBTSxnQkFBZ0IsR0FBRztRQUN2QixHQUFHLHVCQUF1QixDQUFDLElBQUk7UUFDL0IsR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO0tBQzdCLENBQUM7SUFDRixNQUFNLGdCQUFnQixHQUFHO1FBQ3ZCLEdBQUcsdUJBQXVCLENBQUMsSUFBSTtRQUMvQixHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7S0FDN0IsQ0FBQztJQUNGLE1BQU0sb0JBQW9CLEdBQUc7UUFDM0IsR0FBRyx1QkFBdUIsQ0FBQyxRQUFRO1FBQ25DLEdBQUcsQ0FBQyxZQUFZLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQztLQUNqQyxDQUFDO0lBQ0YsTUFBTSxnQkFBZ0IsR0FBRztR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QUMsQ0FBQztZQUN0RCxNQUFNLENBQ0osV0FBVyxFQUNYLHFEQUFxRCxDQUN0RCxDQUFDO1lBQ0YsSUFBSSxHQUFHLFdBQVcsQ0FBQyxXQUFXLEVBQUUsWUFBWSxDQUFDLENBQUM7U0FDL0M7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDYixNQUFNLElBQUksR0FBUyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUU7WUFDNUIsSUFBSSxFQUFFO2dCQUNKLEtBQUssRUFBRSxJQUFJO2dCQUNYLFlBQVksRUFBRSxJQUFJO2dCQUNsQixVQUFVLEVBQUUsSUFBSTthQUNqQjtZQUNELEtBQUssRUFBRTtnQkFDTCxHQUFHLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDO2dCQUM3QixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsVUFBVSxFQUFFLElBQUk7YUFDakI7U0FDRixDQUFDLENBQUM7UUFDSCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFVRCxHQUFHO1FBQ0QsT0FBTyxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQztJQUM1QixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBvYWsgYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB7IHJlYWRlckZyb21TdHJlYW1SZWFkZXIgfSBmcm9tIFwiLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyBodHRwRXJyb3JzIH0gZnJvbSBcIi4vaHR0cEVycm9yLnRzXCI7XG5pbXBvcnQgeyBpc01lZGlhVHlwZSB9IGZyb20gXCIuL2lzTWVkaWFUeXBlLnRzXCI7XG5pbXBvcnQgeyBGb3JtRGF0YVJlYWRlciB9IGZyb20gXCIuL211bHRpcGFydC50c1wiO1xuaW1wb3J0IHR5cGUgeyBTZXJ2ZXJSZXF1ZXN0Qm9keSB9IGZyb20gXCIuL3R5cGVzLmQudHNcIjtcbmltcG9ydCB7IGFzc2VydCB9IGZyb20gXCIuL3V0aWwudHNcIjtcblxuLyoqIFRoZSB0eXBlIG9mIHRoZSBib2R5LCB3aGVyZTpcbiAqXG4gKiAtIGBcImJ5dGVzXCJgIC0gdGhlIGJvZHkgaXMgcHJvdmlkZWQgYXMgYSBwcm9taXNlIHdoaWNoIHJlc29sdmVzIHRvIGFuXG4gKiAgIHtAbGlua2NvZGUgVWludDhBcnJheX0uIFRoaXMgaXMgZXNzZW50aWFsbHkgYSBcInJhd1wiIGJvZHkgdHlwZS5cbiAqIC0gYFwiZm9ybVwiYCAtIHRoZSBib2R5IHdhcyBkZWNvZGVkIGFzIGEgZm9ybSB3aXRoIHRoZSBjb250ZW50cyBwcm92aWRlZCBhcyBhXG4gKiAgIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgd2l0aCBhIHtAbGlua2NvZGUgVVJMU2VhcmNoUGFyYW1zfS5cbiAqIC0gYFwiZm9ybS1kYXRhXCJgIC0gdGhlIGJvZHkgd2FzIGRlY29kZWQgYXMgYSBtdWx0aS1wYXJ0IGZvcm0gZGF0YSBhbmQgdGhlXG4gKiAgIGNvbnRlbnRzIGFyZSBwcm92aWRlZCBhcyBhIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgd2l0aCBhXG4gKiAgIHtAbGlua2NvZGUgRm9ybURhdGFSZWFkZXJ9LlxuICogLSBgXCJqc29uXCJgIC0gdGhlIGJvZHkgd2FzIGRlY29kZWQgYXMgSlNPTiwgd2hlcmUgdGhlIGNvbnRlbnRzIGFyZSBwcm92aWRlZCBhc1xuICogICB0aGUgcmVzdWx0IG9mIHVzaW5nIGBKU09OLnBhcnNlKClgIG9uIHRoZSBzdHJpbmcgY29udGVudHMgb2YgdGhlIGJvZHkuXG4gKiAtIGBcInRleHRcImAgLSB0aGUgYm9keSB3YXMgZGVjb2RlZCBhcyB0ZXh0LCB3aGVyZSB0aGUgY29udGVudHMgYXJlIHByb3ZpZGVkIGFzXG4gKiAgIGEgc3RyaW5nLlxuICogLSBgXCJyZWFkZXJcImAgLSB0aGUgYm9keSBpcyBwcm92aWRlZCBhcyB7QGxpbmtjb2RlIERlbm8uUmVhZGVyfSBpbnRlcmZhY2UgZm9yXG4gKiAgIHJlYWRpbmcgdGhlIFwicmF3XCIgYm9keS5cbiAqIC0gYFwic3RyZWFtXCJgIC0gdGhlIGJvZHkgaXMgcHJvdmlkZWQgYXMgYVxuICogICB7QGxpbmtjb2RlIFJlYWRhYmxlU3RyZWFtPFVpbnQ4QXJyYXk+fSBmb3IgcmVhZGluZyB0aGUgXCJyYXdcIiBib2R5LlxuICogLSBgXCJ1bmRlZmluZWRcImAgLSB0aGVyZSBpcyBubyByZXF1ZXN0IGJvZHkgb3IgaXQgY291bGQgbm90IGJlIGRlY29kZWQuXG4gKi9cbmV4cG9ydCB0eXBlIEJvZHlUeXBlID1cbiAgfCBcImJ5dGVzXCJcbiAgfCBcImZvcm1cIlxuICB8IFwiZm9ybS1kYXRhXCJcbiAgfCBcImpzb25cIlxuICB8IFwidGV4dFwiXG4gIHwgXCJyZWFkZXJcIlxuICB8IFwic3RyZWFtXCJcbiAgfCBcInVuZGVmaW5lZFwiO1xuXG4vKiogVGhlIHRhZ2dlZCB0eXBlIGZvciBgXCJieXRlc1wiYCBib2RpZXMuICovXG5leHBvcnQgdHlwZSBCb2R5Qnl0ZXMgPSB7XG4gIHJlYWRvbmx5IHR5cGU6IFwiYnl0ZXNcIjtcbiAgcmVhZG9ubHkgdmFsdWU6IFByb21pc2U8VWludDhBcnJheT47XG59O1xuLyoqIFRoZSB0YWdnZWQgdHlwZSBmb3IgYFwianNvblwiYCBib2RpZXMuICovXG5leHBvcnQgdHlwZSBCb2R5SnNvbiA9IHtcbiAgcmVhZG9ubHkgdHlwZTogXCJqc29uXCI7XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIHJlYWRvbmx5IHZhbHVlOiBQcm9taXNlPGFueT47XG59O1xuLyoqIFRoZSB0YWdnZWQgdHlwZSBmb3IgYFwiZm9ybVwiYCBib2RpZXMuICovXG5leHBvcnQgdHlwZSBCb2R5Rm9ybSA9IHtcbiAgcmVhZG9ubHkgdHlwZTogXCJmb3JtXCI7XG4gIHJlYWRvbmx5IHZhbHVlOiBQcm9taXNlPFVSTFNlYXJjaFBhcmFtcz47XG59O1xuLyoqIFRoZSB0YWdnZWQgdHlwZSBmb3IgYFwiZm9ybS1kYXRhXCJgIGJvZGllcy4gKi9cbmV4cG9ydCB0eXBlIEJvZHlGb3JtRGF0YSA9IHtcbiAgcmVhZG9ubHkgdHlwZTogXCJmb3JtLWRhdGFcIjtcbiAgcmVhZG9ubHkgdmFsdWU6IEZvcm1EYXRhUmVhZGVyO1xufTtcbi8qKiBUaGUgdGFnZ2VkIHR5cGUgZm9yIGBcInRleHRcImAgYm9kaWVzLiAqL1xuZXhwb3J0IHR5cGUgQm9keVRleHQgPSB7XG4gIHJlYWRvbmx5IHR5cGU6IFwidGV4dFwiO1xuICByZWFkb25seSB2YWx1ZTogUHJvbWlzZTxzdHJpbmc+O1xufTtcbi8qKiBUaGUgdGFnZ2VkIHR5cGUgZm9yIGBcInVuZGVmaW5lZFwiYCBib2RpZXMuICovXG5leHBvcnQgdHlwZSBCb2R5VW5kZWZpbmVkID0ge1xuICByZWFkb25seSB0eXBlOiBcInVuZGVmaW5lZFwiO1xuICByZWFkb25seSB2YWx1ZTogdW5kZWZpbmVkO1xufTtcbi8qKiBUaGUgdGFnZ2VkIHR5cGUgZm9yIGBcInJlYWRlclwiYCBib2RpZXMuICovXG5leHBvcnQgdHlwZSBCb2R5UmVhZGVyID0ge1xuICByZWFkb25seSB0eXBlOiBcInJlYWRlclwiO1xuICByZWFkb25seSB2YWx1ZTogRGVuby5SZWFkZXI7XG59O1xuLyoqIFRoZSB0YWdnZWQgdHlwZSBmb3IgYFwic3RyZWFtXCJgIGJvZGllcy4gKi9cbmV4cG9ydCB0eXBlIEJvZHlTdHJlYW0gPSB7XG4gIHJlYWRvbmx5IHR5cGU6IFwic3RyZWFtXCI7XG4gIHJlYWRvbmx5IHZhbHVlOiBSZWFkYWJsZVN0cmVhbTxVaW50OEFycmF5Pjtcbn07XG5cbi8qKiBUaGUgdHlwZSByZXR1cm5lZCBmcm9tIHRoZSBgLmJvZHkoKWAgZnVuY3Rpb24sIHdoaWNoIGlzIGEgdGFnZ2VkIHVuaW9uIHR5cGVcbiAqIG9mIGFsbCB0aGUgZGlmZmVyZW50IHR5cGVzIG9mIGJvZGllcyB3aGljaCBjYW4gYmUgaWRlbnRpZmllZCBieSB0aGUgYC50eXBlYFxuICogcHJvcGVydHkgd2hpY2ggd2lsbCBiZSBvZiB0eXBlIHtAbGlua2NvZGUgQm9keVR5cGV9IGFuZCB0aGUgYC52YWx1ZWBcbiAqIHByb3BlcnR5IGJlaW5nIGEgYFByb21pc2VgIHdoaWNoIHJlc29sdmVzIHdpdGggdGhlIGFwcHJvcHJpYXRlIHZhbHVlLCBvclxuICogYHVuZGVmaW5lZGAgaWYgdGhlcmUgaXMgbm8gYm9keS4gKi9cbmV4cG9ydCB0eXBlIEJvZHkgPVxuICB8IEJvZHlCeXRlc1xuICB8IEJvZHlKc29uXG4gIHwgQm9keUZvcm1cbiAgfCBCb2R5Rm9ybURhdGFcbiAgfCBCb2R5VGV4dFxuICB8IEJvZHlVbmRlZmluZWQ7XG5cbnR5cGUgQm9keVZhbHVlR2V0dGVyID0gKCkgPT4gQm9keVtcInZhbHVlXCJdO1xuXG4vKiogV2hlbiBzZXR0aW5nIHRoZSBgY29udGVudFR5cGVzYCBwcm9wZXJ0eSBvZiB7QGxpbmtjb2RlIEJvZHlPcHRpb25zfSwgcHJvdmlkZVxuICogYWRkaXRpb25hbCBjb250ZW50IHR5cGVzIHdoaWNoIGNhbiBpbmZsdWVuY2UgaG93IHRoZSBib2R5IGlzIGRlY29kZWQuIFRoaXNcbiAqIGlzIHNwZWNpZmljYWxseSBkZXNpZ25lZCB0byBhbGxvdyBhIHNlcnZlciB0byBzdXBwb3J0IGN1c3RvbSBvciBzcGVjaWFsaXplZFxuICogbWVkaWEgdHlwZXMgdGhhdCBhcmUgbm90IHBhcnQgb2YgdGhlIHB1YmxpYyBkYXRhYmFzZS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQm9keU9wdGlvbnNDb250ZW50VHlwZXMge1xuICAvKiogQ29udGVudCB0eXBlcyBsaXN0ZWQgaGVyZSB3aWxsIGFsd2F5cyByZXR1cm4gYW4gVWludDhBcnJheS4gKi9cbiAgYnl0ZXM/OiBzdHJpbmdbXTtcbiAgLyoqIENvbnRlbnQgdHlwZXMgbGlzdGVkIGhlcmUgd2lsbCBiZSBwYXJzZWQgYXMgYSBKU09OIHN0cmluZy4gKi9cbiAganNvbj86IHN0cmluZ1tdO1xuICAvKiogQ29udGVudCB0eXBlcyBsaXN0ZWQgaGVyZSB3aWxsIGJlIHBhcnNlZCBhcyBmb3JtIGRhdGEgYW5kIHJldHVyblxuICAgKiBgVVJMU2VhcmNoUGFyYW1ldGVyc2AgYXMgdGhlIHZhbHVlIG9mIHRoZSBib2R5LiAqL1xuICBmb3JtPzogc3RyaW5nW107XG4gIC8qKiBDb250ZW50IHR5cGVzIGxpc3RlZCBoZXJlIHdpbGwgYmUgcGFyc2VkIGFzIGZyb20gZGF0YSBhbmQgcmV0dXJuIGFcbiAgICogYEZvcm1EYXRhQm9keWAgaW50ZXJmYWNlIGFzIHRoZSB2YWx1ZSBvZiB0aGUgYm9keS4gKi9cbiAgZm9ybURhdGE/OiBzdHJpbmdbXTtcbiAgLyoqIENvbnRlbnQgdHlwZXMgbGlzdGVkIGhlcmUgd2lsbCBiZSBwYXJzZWQgYXMgdGV4dC4gKi9cbiAgdGV4dD86IHN0cmluZ1tdO1xufVxuXG4vKiogT3B0aW9ucyB3aGljaCBjYW4gYmUgdXNlZCB3aGVuIGFjY2Vzc2luZyB0aGUgYC5ib2R5KClgIG9mIGEgcmVxdWVzdC5cbiAqXG4gKiBAdGVtcGxhdGUgVCB0aGUge0BsaW5rY29kZSBCb2R5VHlwZX0gdG8gYXR0ZW1wdCB0byB1c2Ugd2hlbiBkZWNvZGluZyB0aGVcbiAqICAgICAgICAgICAgIHJlcXVlc3QgYm9keS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBCb2R5T3B0aW9uczxUIGV4dGVuZHMgQm9keVR5cGUgPSBCb2R5VHlwZT4ge1xuICAvKiogV2hlbiByZWFkaW5nIGEgbm9uLXN0cmVhbWluZyBib2R5LCBzZXQgYSBsaW1pdCB3aGVyZWJ5IGlmIHRoZSBjb250ZW50XG4gICAqIGxlbmd0aCBpcyBncmVhdGVyIHRoZW4gdGhlIGxpbWl0IG9yIG5vdCBzZXQsIHJlYWRpbmcgdGhlIGJvZHkgd2lsbCB0aHJvdy5cbiAgICpcbiAgICogVGhpcyBpcyB0byBwcmV2ZW50IG1hbGljaW91cyByZXF1ZXN0cyB3aGVyZSB0aGUgYm9keSBleGNlZWRzIHRoZSBjYXBhY2l0eVxuICAgKiBvZiB0aGUgc2VydmVyLiBTZXQgdGhlIGxpbWl0IHRvIDAgdG8gYWxsb3cgdW5ib3VuZGVkIHJlYWRzLiAgVGhlIGRlZmF1bHRcbiAgICogaXMgMTAgTWliLiAqL1xuICBsaW1pdD86IG51bWJlcjtcbiAgLyoqIEluc3RlYWQgb2YgdXRpbGl6aW5nIHRoZSBjb250ZW50IHR5cGUgb2YgdGhlIHJlcXVlc3QsIGF0dGVtcHQgdG8gcGFyc2UgdGhlXG4gICAqIGJvZHkgYXMgdGhlIHR5cGUgc3BlY2lmaWVkLiBUaGUgdmFsdWUgaGFzIHRvIGJlIG9mIHtAbGlua2NvZGUgQm9keVR5cGV9LiAqL1xuICB0eXBlPzogVDtcbiAgLyoqIEEgbWFwIG9mIGV4dHJhIGNvbnRlbnQgdHlwZXMgdG8gZGV0ZXJtaW5lIGhvdyB0byBwYXJzZSB0aGUgYm9keS4gKi9cbiAgY29udGVudFR5cGVzPzogQm9keU9wdGlvbnNDb250ZW50VHlwZXM7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQm9keUNvbnRlbnRUeXBlcyB7XG4gIGpzb24/OiBzdHJpbmdbXTtcbiAgZm9ybT86IHN0cmluZ1tdO1xuICB0ZXh0Pzogc3RyaW5nW107XG59XG5cbmNvbnN0IERFRkFVTFRfTElNSVQgPSAxMF80ODVfNzYwOyAvLyAxMG1iXG5cbmNvbnN0IGRlZmF1bHRCb2R5Q29udGVudFR5cGVzID0ge1xuICBqc29uOiBbXCJqc29uXCIsIFwiYXBwbGljYXRpb24vKitqc29uXCIsIFwiYXBwbGljYXRpb24vY3NwLXJlcG9ydFwiXSxcbiAgZm9ybTogW1widXJsZW5jb2RlZFwiXSxcbiAgZm9ybURhdGE6IFtcIm11bHRpcGFydFwiXSxcbiAgdGV4dDogW1widGV4dFwiXSxcbn07XG5cbmZ1bmN0aW9uIHJlc29sdmVUeXBlKFxuICBjb250ZW50VHlwZTogc3RyaW5nLFxuICBjb250ZW50VHlwZXM6IEJvZHlPcHRpb25zQ29udGVudFR5cGVzLFxuKTogQm9keVR5cGUge1xuICBjb25zdCBjb250ZW50VHlwZXNKc29uID0gW1xuICAgIC4uLmRlZmF1bHRCb2R5Q29udGVudFR5cGVzLmpzb24sXG4gICAgLi4uKGNvbnRlbnRUeXBlcy5qc29uID8/IFtdKSxcbiAgXTtcbiAgY29uc3QgY29udGVudFR5cGVzRm9ybSA9IFtcbiAgICAuLi5kZWZhdWx0Qm9keUNvbnRlbnRUeXBlcy5mb3JtLFxuICAgIC4uLihjb250ZW50VHlwZXMuZm9ybSA/PyBbXSksXG4gIF07XG4gIGNvbnN0IGNvbnRlbnRUeXBlc0Zvcm1EYXRhID0gW1xuICAgIC4uLmRlZmF1bHRCb2R5Q29udGVudFR5cGVzLmZvcm1EYXRhLFxuICAgIC4uLihjb250ZW50VHlwZXMuZm9ybURhdGEgPz8gW10pLFxuICBdO1xuICBjb25zdCBjb250ZW50VHlwZXNUZXh0ID0gW1xuICAgIC4uLmRlZmF1bHRCb2R5Q29udGVudFR5cGVzLnRleHQsXG4gICAgLi4uKGNvbnRlbnRUeXBlcy50ZXh0ID8/IFtdKSxcbiAgXTtcbiAgaWYgKGNvbnRlbnRUeXBlcy5ieXRlcyAmJiBpc01lZGlhVHlwZShjb250ZW50VHlwZSwgY29udGVudFR5cGVzLmJ5dGVzKSkge1xuICAgIHJldHVybiBcImJ5dGVzXCI7XG4gIH0gZWxzZSBpZiAoaXNNZWRpYVR5cGUoY29udGVudFR5cGUsIGNvbnRlbnRUeXBlc0pzb24pKSB7XG4gICAgcmV0dXJuIFwianNvblwiO1xuICB9IGVsc2UgaWYgKGlzTWVkaWFUeXBlKGNvbnRlbnRUeXBlLCBjb250ZW50VHlwZXNGb3JtKSkge1xuICAgIHJldHVybiBcImZvcm1cIjtcbiAgfSBlbHNlIGlmIChpc01lZGlhVHlwZShjb250ZW50VHlwZSwgY29udGVudFR5cGVzRm9ybURhdGEpKSB7XG4gICAgcmV0dXJuIFwiZm9ybS1kYXRhXCI7XG4gIH0gZWxzZSBpZiAoaXNNZWRpYVR5cGUoY29udGVudFR5cGUsIGNvbnRlbnRUeXBlc1RleHQpKSB7XG4gICAgcmV0dXJuIFwidGV4dFwiO1xuICB9XG4gIHJldHVybiBcImJ5dGVzXCI7XG59XG5cbmNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoKTtcblxuZXhwb3J0IGNsYXNzIFJlcXVlc3RCb2R5IHtcbiAgI2JvZHk6IFJlYWRhYmxlU3RyZWFtPFVpbnQ4QXJyYXk+IHwgbnVsbDtcbiAgI2Zvcm1EYXRhUmVhZGVyPzogRm9ybURhdGFSZWFkZXI7XG4gICNoZWFkZXJzOiBIZWFkZXJzO1xuICAjc3RyZWFtPzogUmVhZGFibGVTdHJlYW08VWludDhBcnJheT47XG4gICNyZWFkQWxsQm9keT86IFByb21pc2U8VWludDhBcnJheT47XG4gICNyZWFkQm9keTogKCkgPT4gUHJvbWlzZTxVaW50OEFycmF5PjtcbiAgI3R5cGU/OiBcImJ5dGVzXCIgfCBcImZvcm0tZGF0YVwiIHwgXCJyZWFkZXJcIiB8IFwic3RyZWFtXCIgfCBcInVuZGVmaW5lZFwiO1xuXG4gICNleGNlZWRzTGltaXQobGltaXQ6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGlmICghbGltaXQgfHwgbGltaXQgPT09IEluZmluaXR5KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICghdGhpcy4jYm9keSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBjb250ZW50TGVuZ3RoID0gdGhpcy4jaGVhZGVycy5nZXQoXCJjb250ZW50LWxlbmd0aFwiKTtcbiAgICBpZiAoIWNvbnRlbnRMZW5ndGgpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUludChjb250ZW50TGVuZ3RoLCAxMCk7XG4gICAgaWYgKGlzTmFOKHBhcnNlZCkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gcGFyc2VkID4gbGltaXQ7XG4gIH1cblxuICAjcGFyc2UodHlwZTogQm9keVR5cGUsIGxpbWl0OiBudW1iZXIpOiBCb2R5VmFsdWVHZXR0ZXIge1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSBcImZvcm1cIjpcbiAgICAgICAgdGhpcy4jdHlwZSA9IFwiYnl0ZXNcIjtcbiAgICAgICAgaWYgKHRoaXMuI2V4Y2VlZHNMaW1pdChsaW1pdCkpIHtcbiAgICAgICAgICByZXR1cm4gKCkgPT5cbiAgICAgICAgICAgIFByb21pc2UucmVqZWN0KG5ldyBSYW5nZUVycm9yKGBCb2R5IGV4Y2VlZHMgYSBsaW1pdCBvZiAke2xpbWl0fS5gKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFzeW5jICgpID0+XG4gICAgICAgICAgbmV3IFVSTFNlYXJjaFBhcmFtcyhcbiAgICAgICAgICAgIGRlY29kZXIuZGVjb2RlKGF3YWl0IHRoaXMuI3ZhbHVlUHJvbWlzZSgpKS5yZXBsYWNlKC9cXCsvZywgXCIgXCIpLFxuICAgICAgICAgICk7XG4gICAgICBjYXNlIFwiZm9ybS1kYXRhXCI6XG4gICAgICAgIHRoaXMuI3R5cGUgPSBcImZvcm0tZGF0YVwiO1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGNvbnRlbnRUeXBlID0gdGhpcy4jaGVhZGVycy5nZXQoXCJjb250ZW50LXR5cGVcIik7XG4gICAgICAgICAgYXNzZXJ0KGNvbnRlbnRUeXBlKTtcbiAgICAgICAgICBjb25zdCByZWFkYWJsZVN0cmVhbSA9IHRoaXMuI2JvZHkgPz8gbmV3IFJlYWRhYmxlU3RyZWFtKCk7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuI2Zvcm1EYXRhUmVhZGVyID8/XG4gICAgICAgICAgICAodGhpcy4jZm9ybURhdGFSZWFkZXIgPSBuZXcgRm9ybURhdGFSZWFkZXIoXG4gICAgICAgICAgICAgIGNvbnRlbnRUeXBlLFxuICAgICAgICAgICAgICByZWFkZXJGcm9tU3RyZWFtUmVhZGVyKFxuICAgICAgICAgICAgICAgIChyZWFkYWJsZVN0cmVhbSBhcyBSZWFkYWJsZVN0cmVhbTxVaW50OEFycmF5PikuZ2V0UmVhZGVyKCksXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgICApKTtcbiAgICAgICAgfTtcbiAgICAgIGNhc2UgXCJqc29uXCI6XG4gICAgICAgIHRoaXMuI3R5cGUgPSBcImJ5dGVzXCI7XG4gICAgICAgIGlmICh0aGlzLiNleGNlZWRzTGltaXQobGltaXQpKSB7XG4gICAgICAgICAgcmV0dXJuICgpID0+XG4gICAgICAgICAgICBQcm9taXNlLnJlamVjdChuZXcgUmFuZ2VFcnJvcihgQm9keSBleGNlZWRzIGEgbGltaXQgb2YgJHtsaW1pdH0uYCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhc3luYyAoKSA9PlxuICAgICAgICAgIEpTT04ucGFyc2UoZGVjb2Rlci5kZWNvZGUoYXdhaXQgdGhpcy4jdmFsdWVQcm9taXNlKCkpKTtcbiAgICAgIGNhc2UgXCJieXRlc1wiOlxuICAgICAgICB0aGlzLiN0eXBlID0gXCJieXRlc1wiO1xuICAgICAgICBpZiAodGhpcy4jZXhjZWVkc0xpbWl0KGxpbWl0KSkge1xuICAgICAgICAgIHJldHVybiAoKSA9PlxuICAgICAgICAgICAgUHJvbWlzZS5yZWplY3QobmV3IFJhbmdlRXJyb3IoYEJvZHkgZXhjZWVkcyBhIGxpbWl0IG9mICR7bGltaXR9LmApKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKCkgPT4gdGhpcy4jdmFsdWVQcm9taXNlKCk7XG4gICAgICBjYXNlIFwidGV4dFwiOlxuICAgICAgICB0aGlzLiN0eXBlID0gXCJieXRlc1wiO1xuICAgICAgICBpZiAodGhpcy4jZXhjZWVkc0xpbWl0KGxpbWl0KSkge1xuICAgICAgICAgIHJldHVybiAoKSA9PlxuICAgICAgICAgICAgUHJvbWlzZS5yZWplY3QobmV3IFJhbmdlRXJyb3IoYEJvZHkgZXhjZWVkcyBhIGxpbWl0IG9mICR7bGltaXR9LmApKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXN5bmMgKCkgPT4gZGVjb2Rlci5kZWNvZGUoYXdhaXQgdGhpcy4jdmFsdWVQcm9taXNlKCkpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgSW52YWxpZCBib2R5IHR5cGU6IFwiJHt0eXBlfVwiYCk7XG4gICAgfVxuICB9XG5cbiAgI3ZhbGlkYXRlR2V0QXJncyhcbiAgICB0eXBlOiBCb2R5VHlwZSB8IHVuZGVmaW5lZCxcbiAgICBjb250ZW50VHlwZXM6IEJvZHlPcHRpb25zQ29udGVudFR5cGVzLFxuICApIHtcbiAgICBpZiAodHlwZSA9PT0gXCJyZWFkZXJcIiAmJiB0aGlzLiN0eXBlICYmIHRoaXMuI3R5cGUgIT09IFwicmVhZGVyXCIpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIGBCb2R5IGFscmVhZHkgY29uc3VtZWQgYXMgXCIke3RoaXMuI3R5cGV9XCIgYW5kIGNhbm5vdCBiZSByZXR1cm5lZCBhcyBhIHJlYWRlci5gLFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09IFwic3RyZWFtXCIgJiYgdGhpcy4jdHlwZSAmJiB0aGlzLiN0eXBlICE9PSBcInN0cmVhbVwiKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICBgQm9keSBhbHJlYWR5IGNvbnN1bWVkIGFzIFwiJHt0aGlzLiN0eXBlfVwiIGFuZCBjYW5ub3QgYmUgcmV0dXJuZWQgYXMgYSBzdHJlYW0uYCxcbiAgICAgICk7XG4gICAgfVxuICAgIGlmICh0eXBlID09PSBcImZvcm0tZGF0YVwiICYmIHRoaXMuI3R5cGUgJiYgdGhpcy4jdHlwZSAhPT0gXCJmb3JtLWRhdGFcIikge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgYEJvZHkgYWxyZWFkeSBjb25zdW1lZCBhcyBcIiR7dGhpcy4jdHlwZX1cIiBhbmQgY2Fubm90IGJlIHJldHVybmVkIGFzIGEgc3RyZWFtLmAsXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAodGhpcy4jdHlwZSA9PT0gXCJyZWFkZXJcIiAmJiB0eXBlICE9PSBcInJlYWRlclwiKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICBcIkJvZHkgYWxyZWFkeSBjb25zdW1lZCBhcyBhIHJlYWRlciBhbmQgY2FuIG9ubHkgYmUgcmV0dXJuZWQgYXMgYSByZWFkZXIuXCIsXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAodGhpcy4jdHlwZSA9PT0gXCJzdHJlYW1cIiAmJiB0eXBlICE9PSBcInN0cmVhbVwiKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICBcIkJvZHkgYWxyZWFkeSBjb25zdW1lZCBhcyBhIHN0cmVhbSBhbmQgY2FuIG9ubHkgYmUgcmV0dXJuZWQgYXMgYSBzdHJlYW0uXCIsXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAodGhpcy4jdHlwZSA9PT0gXCJmb3JtLWRhdGFcIiAmJiB0eXBlICE9PSBcImZvcm0tZGF0YVwiKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICBcIkJvZHkgYWxyZWFkeSBjb25zdW1lZCBhcyBmb3JtIGRhdGEgYW5kIGNhbiBvbmx5IGJlIHJldHVybmVkIGFzIGZvcm0gZGF0YS5cIixcbiAgICAgICk7XG4gICAgfVxuICAgIGlmICh0eXBlICYmIE9iamVjdC5rZXlzKGNvbnRlbnRUeXBlcykubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICBgXCJ0eXBlXCIgYW5kIFwiY29udGVudFR5cGVzXCIgY2Fubm90IGJlIHNwZWNpZmllZCBhdCB0aGUgc2FtZSB0aW1lYCxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgI3ZhbHVlUHJvbWlzZSgpIHtcbiAgICByZXR1cm4gdGhpcy4jcmVhZEFsbEJvZHkgPz8gKHRoaXMuI3JlYWRBbGxCb2R5ID0gdGhpcy4jcmVhZEJvZHkoKSk7XG4gIH1cblxuICBjb25zdHJ1Y3Rvcih7IGJvZHksIHJlYWRCb2R5IH06IFNlcnZlclJlcXVlc3RCb2R5LCBoZWFkZXJzOiBIZWFkZXJzKSB7XG4gICAgdGhpcy4jYm9keSA9IGJvZHk7XG4gICAgdGhpcy4jaGVhZGVycyA9IGhlYWRlcnM7XG4gICAgdGhpcy4jcmVhZEJvZHkgPSByZWFkQm9keTtcbiAgfVxuXG4gIGdldChcbiAgICB7IGxpbWl0ID0gREVGQVVMVF9MSU1JVCwgdHlwZSwgY29udGVudFR5cGVzID0ge30gfTogQm9keU9wdGlvbnMgPSB7fSxcbiAgKTogQm9keSB8IEJvZHlSZWFkZXIgfCBCb2R5U3RyZWFtIHtcbiAgICB0aGlzLiN2YWxpZGF0ZUdldEFyZ3ModHlwZSwgY29udGVudFR5cGVzKTtcbiAgICBpZiAodHlwZSA9PT0gXCJyZWFkZXJcIikge1xuICAgICAgaWYgKCF0aGlzLiNib2R5KSB7XG4gICAgICAgIHRoaXMuI3R5cGUgPSBcInVuZGVmaW5lZFwiO1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgIGBCb2R5IGlzIHVuZGVmaW5lZCBhbmQgY2Fubm90IGJlIHJldHVybmVkIGFzIFwicmVhZGVyXCIuYCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuI3R5cGUgPSBcInJlYWRlclwiO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZSxcbiAgICAgICAgdmFsdWU6IHJlYWRlckZyb21TdHJlYW1SZWFkZXIodGhpcy4jYm9keS5nZXRSZWFkZXIoKSksXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gXCJzdHJlYW1cIikge1xuICAgICAgaWYgKCF0aGlzLiNib2R5KSB7XG4gICAgICAgIHRoaXMuI3R5cGUgPSBcInVuZGVmaW5lZFwiO1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgIGBCb2R5IGlzIHVuZGVmaW5lZCBhbmQgY2Fubm90IGJlIHJldHVybmVkIGFzIFwic3RyZWFtXCIuYCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuI3R5cGUgPSBcInN0cmVhbVwiO1xuICAgICAgY29uc3Qgc3RyZWFtcyA9XG4gICAgICAgICgodGhpcy4jc3RyZWFtID8/IHRoaXMuI2JvZHkpIGFzIFJlYWRhYmxlU3RyZWFtPFVpbnQ4QXJyYXk+KVxuICAgICAgICAgIC50ZWUoKTtcbiAgICAgIHRoaXMuI3N0cmVhbSA9IHN0cmVhbXNbMV07XG4gICAgICByZXR1cm4geyB0eXBlLCB2YWx1ZTogc3RyZWFtc1swXSB9O1xuICAgIH1cbiAgICBpZiAoIXRoaXMuaGFzKCkpIHtcbiAgICAgIHRoaXMuI3R5cGUgPSBcInVuZGVmaW5lZFwiO1xuICAgIH0gZWxzZSBpZiAoIXRoaXMuI3R5cGUpIHtcbiAgICAgIGNvbnN0IGVuY29kaW5nID0gdGhpcy4jaGVhZGVycy5nZXQoXCJjb250ZW50LWVuY29kaW5nXCIpID8/XG4gICAgICAgIFwiaWRlbnRpdHlcIjtcbiAgICAgIGlmIChlbmNvZGluZyAhPT0gXCJpZGVudGl0eVwiKSB7XG4gICAgICAgIHRocm93IG5ldyBodHRwRXJyb3JzLlVuc3VwcG9ydGVkTWVkaWFUeXBlKFxuICAgICAgICAgIGBVbnN1cHBvcnRlZCBjb250ZW50LWVuY29kaW5nOiAke2VuY29kaW5nfWAsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLiN0eXBlID09PSBcInVuZGVmaW5lZFwiICYmICghdHlwZSB8fCB0eXBlID09PSBcInVuZGVmaW5lZFwiKSkge1xuICAgICAgcmV0dXJuIHsgdHlwZTogXCJ1bmRlZmluZWRcIiwgdmFsdWU6IHVuZGVmaW5lZCB9O1xuICAgIH1cbiAgICBpZiAoIXR5cGUpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnRUeXBlID0gdGhpcy4jaGVhZGVycy5nZXQoXCJjb250ZW50LXR5cGVcIik7XG4gICAgICBhc3NlcnQoXG4gICAgICAgIGNvbnRlbnRUeXBlLFxuICAgICAgICBcIlRoZSBDb250ZW50LVR5cGUgaGVhZGVyIGlzIG1pc3NpbmcgZnJvbSB0aGUgcmVxdWVzdFwiLFxuICAgICAgKTtcbiAgICAgIHR5cGUgPSByZXNvbHZlVHlwZShjb250ZW50VHlwZSwgY29udGVudFR5cGVzKTtcbiAgICB9XG4gICAgYXNzZXJ0KHR5cGUpO1xuICAgIGNvbnN0IGJvZHk6IEJvZHkgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKGJvZHksIHtcbiAgICAgIHR5cGU6IHtcbiAgICAgICAgdmFsdWU6IHR5cGUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICB2YWx1ZToge1xuICAgICAgICBnZXQ6IHRoaXMuI3BhcnNlKHR5cGUsIGxpbWl0KSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICByZXR1cm4gYm9keTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGlmIHRoZSByZXF1ZXN0IG1pZ2h0IGhhdmUgYSBib2R5IG9yIG5vdCwgd2l0aG91dCBhdHRlbXB0aW5nIHRvXG4gICAqIGNvbnN1bWUgaXQuXG4gICAqXG4gICAqICoqV0FSTklORyoqIFRoaXMgaXMgYW4gdW5yZWxpYWJsZSBBUEkuIEluIEhUVFAvMiBpdCBpcyBub3QgcG9zc2libGUgdG9cbiAgICogZGV0ZXJtaW5lIGlmIGNlcnRhaW4gSFRUUCBtZXRob2RzIGhhdmUgYSBib2R5IG9yIG5vdCB3aXRob3V0IGF0dGVtcHRpbmcgdG9cbiAgICogcmVhZCB0aGUgYm9keS4gQXMgb2YgRGVubyAxLjE2LjEgYW5kIGxhdGVyLCBmb3IgSFRUUC8xLjEgYWxpZ25zIHRvIHRoZVxuICAgKiBIVFRQLzIgYmVoYXZpb3VyLlxuICAgKi9cbiAgaGFzKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiNib2R5ICE9IG51bGw7XG4gIH1cbn1cbiJdfQ==