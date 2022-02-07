import { Buffer } from "./buffer.ts";
import { writeAll } from "./util.ts";
const DEFAULT_CHUNK_SIZE = 16_640;
function isCloser(value) {
    return typeof value === "object" && value != null && "close" in value &&
        typeof value["close"] === "function";
}
export function readerFromIterable(iterable) {
    const iterator = iterable[Symbol.asyncIterator]?.() ??
        iterable[Symbol.iterator]?.();
    const buffer = new Buffer();
    return {
        async read(p) {
            if (buffer.length == 0) {
                const result = await iterator.next();
                if (result.done) {
                    return null;
                }
                else {
                    if (result.value.byteLength <= p.byteLength) {
                        p.set(result.value);
                        return result.value.byteLength;
                    }
                    p.set(result.value.subarray(0, p.byteLength));
                    await writeAll(buffer, result.value.subarray(p.byteLength));
                    return p.byteLength;
                }
            }
            else {
                const n = await buffer.read(p);
                if (n == null) {
                    return this.read(p);
                }
                return n;
            }
        },
    };
}
export function writerFromStreamWriter(streamWriter) {
    return {
        async write(p) {
            await streamWriter.ready;
            await streamWriter.write(p);
            return p.length;
        },
    };
}
export function readerFromStreamReader(streamReader) {
    const buffer = new Buffer();
    return {
        async read(p) {
            if (buffer.empty()) {
                const res = await streamReader.read();
                if (res.done) {
                    return null;
                }
                await writeAll(buffer, res.value);
            }
            return buffer.read(p);
        },
    };
}
export function writableStreamFromWriter(writer, options = {}) {
    const { autoClose = true } = options;
    return new WritableStream({
        async write(chunk, controller) {
            try {
                await writeAll(writer, chunk);
            }
            catch (e) {
                controller.error(e);
                if (isCloser(writer) && autoClose) {
                    writer.close();
                }
            }
        },
        close() {
            if (isCloser(writer) && autoClose) {
                writer.close();
            }
        },
        abort() {
            if (isCloser(writer) && autoClose) {
                writer.close();
            }
        },
    });
}
export function readableStreamFromIterable(iterable) {
    const iterator = iterable[Symbol.asyncIterator]?.() ??
        iterable[Symbol.iterator]?.();
    return new ReadableStream({
        async pull(controller) {
            const { value, done } = await iterator.next();
            if (done) {
                controller.close();
            }
            else {
                controller.enqueue(value);
            }
        },
    });
}
export function readableStreamFromReader(reader, options = {}) {
    const { autoClose = true, chunkSize = DEFAULT_CHUNK_SIZE, strategy, } = options;
    return new ReadableStream({
        async pull(controller) {
            const chunk = new Uint8Array(chunkSize);
            try {
                const read = await reader.read(chunk);
                if (read === null) {
                    if (isCloser(reader) && autoClose) {
                        reader.close();
                    }
                    controller.close();
                    return;
                }
                controller.enqueue(chunk.subarray(0, read));
            }
            catch (e) {
                controller.error(e);
                if (isCloser(reader)) {
                    reader.close();
                }
            }
        },
        cancel() {
            if (isCloser(reader) && autoClose) {
                reader.close();
            }
        },
    }, strategy);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyZWFtcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInN0cmVhbXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUNyQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBRXJDLE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxDQUFDO0FBRWxDLFNBQVMsUUFBUSxDQUFDLEtBQWM7SUFDOUIsT0FBTyxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxPQUFPLElBQUksS0FBSztRQUVuRSxPQUFRLEtBQTZCLENBQUMsT0FBTyxDQUFDLEtBQUssVUFBVSxDQUFDO0FBQ2xFLENBQUM7QUFnQkQsTUFBTSxVQUFVLGtCQUFrQixDQUNoQyxRQUEwRDtJQUUxRCxNQUFNLFFBQVEsR0FDWCxRQUFzQyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsRUFBRSxFQUFFO1FBQzlELFFBQWlDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsQ0FBQztJQUM1RCxNQUFNLE1BQU0sR0FBRyxJQUFJLE1BQU0sRUFBRSxDQUFDO0lBQzVCLE9BQU87UUFDTCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQWE7WUFDdEIsSUFBSSxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtnQkFDdEIsTUFBTSxNQUFNLEdBQUcsTUFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3JDLElBQUksTUFBTSxDQUFDLElBQUksRUFBRTtvQkFDZixPQUFPLElBQUksQ0FBQztpQkFDYjtxQkFBTTtvQkFDTCxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQyxVQUFVLEVBQUU7d0JBQzNDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUNwQixPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMs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QUFFO2dCQUNWLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BCLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUNwQixNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7aUJBQ2hCO2FBQ0Y7UUFDSCxDQUFDO1FBQ0QsTUFBTTtZQUNKLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLFNBQVMsRUFBRTtnQkFDakMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO2FBQ2hCO1FBQ0gsQ0FBQztLQUNGLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMSB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcIi4vYnVmZmVyLnRzXCI7XG5pbXBvcnQgeyB3cml0ZUFsbCB9IGZyb20gXCIuL3V0aWwudHNcIjtcblxuY29uc3QgREVGQVVMVF9DSFVOS19TSVpFID0gMTZfNjQwO1xuXG5mdW5jdGlvbiBpc0Nsb3Nlcih2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIERlbm8uQ2xvc2VyIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPSBudWxsICYmIFwiY2xvc2VcIiBpbiB2YWx1ZSAmJlxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgdHlwZW9mICh2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCBhbnk+KVtcImNsb3NlXCJdID09PSBcImZ1bmN0aW9uXCI7XG59XG5cbi8qKiBDcmVhdGUgYSBgRGVuby5SZWFkZXJgIGZyb20gYW4gaXRlcmFibGUgb2YgYFVpbnQ4QXJyYXlgcy5cbiAqXG4gKiAgICAgIC8vIFNlcnZlci1zZW50IGV2ZW50czogU2VuZCBydW50aW1lIG1ldHJpY3MgdG8gdGhlIGNsaWVudCBldmVyeSBzZWNvbmQuXG4gKiAgICAgIHJlcXVlc3QucmVzcG9uZCh7XG4gKiAgICAgICAgaGVhZGVyczogbmV3IEhlYWRlcnMoeyBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvZXZlbnQtc3RyZWFtXCIgfSksXG4gKiAgICAgICAgYm9keTogcmVhZGVyRnJvbUl0ZXJhYmxlKChhc3luYyBmdW5jdGlvbiogKCkge1xuICogICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAqICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHIpID0+IHNldFRpbWVvdXQociwgMTAwMCkpO1xuICogICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gYGRhdGE6ICR7SlNPTi5zdHJpbmdpZnkoRGVuby5tZXRyaWNzKCkpfVxcblxcbmA7XG4gKiAgICAgICAgICAgIHlpZWxkIG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShtZXNzYWdlKTtcbiAqICAgICAgICAgIH1cbiAqICAgICAgICB9KSgpKSxcbiAqICAgICAgfSk7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkZXJGcm9tSXRlcmFibGUoXG4gIGl0ZXJhYmxlOiBJdGVyYWJsZTxVaW50OEFycmF5PiB8IEFzeW5jSXRlcmFibGU8VWludDhBcnJheT4sXG4pOiBEZW5vLlJlYWRlciB7XG4gIGNvbnN0IGl0ZXJhdG9yOiBJdGVyYXRvcjxVaW50OEFycmF5PiB8IEFzeW5jSXRlcmF0b3I8VWludDhBcnJheT4gPVxuICAgIChpdGVyYWJsZSBhcyBBc3luY0l0ZXJhYmxlPFVpbnQ4QXJyYXk+KVtTeW1ib2wuYXN5bmNJdGVyYXRvcl0/LigpID8/XG4gICAgICAoaXRlcmFibGUgYXMgSXRlcmFibGU8VWludDhBcnJheT4pW1N5bWJvbC5pdGVyYXRvcl0/LigpO1xuICBjb25zdCBidWZmZXIgPSBuZXcgQnVmZmVyKCk7XG4gIHJldHVybiB7XG4gICAgYXN5bmMgcmVhZChwOiBVaW50OEFycmF5KTogUHJvbWlzZTxudW1iZXIgfCBudWxsPiB7XG4gICAgICBpZiAoYnVmZmVyLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgaWYgKHJlc3VsdC5kb25lKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHJlc3VsdC52YWx1ZS5ieXRlTGVuZ3RoIDw9IHAuYnl0ZUxlbmd0aCkge1xuICAgICAgICAgICAgcC5zZXQocmVzdWx0LnZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQudmFsdWUuYnl0ZUxlbmd0aDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcC5zZXQocmVzdWx0LnZhbHVlLnN1YmFycmF5KDAsIHAuYnl0ZUxlbmd0aCkpO1xuICAgICAgICAgIGF3YWl0IHdyaXRlQWxsKGJ1ZmZlciwgcmVzdWx0LnZhbHVlLnN1YmFycmF5KHAuYnl0ZUxlbmd0aCkpO1xuICAgICAgICAgIHJldHVybiBwLmJ5dGVMZW5ndGg7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG4gPSBhd2FpdCBidWZmZXIucmVhZChwKTtcbiAgICAgICAgaWYgKG4gPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLnJlYWQocCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG47XG4gICAgICB9XG4gICAgfSxcbiAgfTtcbn1cblxuLyoqIENyZWF0ZSBhIGBXcml0ZXJgIGZyb20gYSBgV3JpdGFibGVTdHJlYW1EZWZhdWx0UmVhZGVyYC4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZXJGcm9tU3RyZWFtV3JpdGVyKFxuICBzdHJlYW1Xcml0ZXI6IFdyaXRhYmxlU3RyZWFtRGVmYXVsdFdyaXRlcjxVaW50OEFycmF5Pixcbik6IERlbm8uV3JpdGVyIHtcbiAgcmV0dXJuIHtcbiAgICBhc3luYyB3cml0ZShwOiBVaW50OEFycmF5KTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICAgIGF3YWl0IHN0cmVhbVdyaXRlci5yZWFkeTtcbiAgICAgIGF3YWl0IHN0cmVhbVdyaXRlci53cml0ZShwKTtcbiAgICAgIHJldHVybiBwLmxlbmd0aDtcbiAgICB9LFxuICB9O1xufVxuXG4vKiogQ3JlYXRlIGEgYFJlYWRlcmAgZnJvbSBhIGBSZWFkYWJsZVN0cmVhbURlZmF1bHRSZWFkZXJgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRlckZyb21TdHJlYW1SZWFkZXIoXG4gIHN0cmVhbVJlYWRlcjogUmVhZGFibGVTdHJlYW1EZWZhdWx0UmVhZGVyPFVpbnQ4QXJyYXk+LFxuKTogRGVuby5SZWFkZXIge1xuICBjb25zdCBidWZmZXIgPSBuZXcgQnVmZmVyKCk7XG5cbiAgcmV0dXJuIHtcbiAgICBhc3luYyByZWFkKHA6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPG51bWJlciB8IG51bGw+IHtcbiAgICAgIGlmIChidWZmZXIuZW1wdHkoKSkge1xuICAgICAgICBjb25zdCByZXMgPSBhd2FpdCBzdHJlYW1SZWFkZXIucmVhZCgpO1xuICAgICAgICBpZiAocmVzLmRvbmUpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDsgLy8gRU9GXG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCB3cml0ZUFsbChidWZmZXIsIHJlcy52YWx1ZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBidWZmZXIucmVhZChwKTtcbiAgICB9LFxuICB9O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFdyaXRhYmxlU3RyZWFtRnJvbVdyaXRlck9wdGlvbnMge1xuICAvKipcbiAgICogSWYgdGhlIGB3cml0ZXJgIGlzIGFsc28gYSBgRGVuby5DbG9zZXJgLCBhdXRvbWF0aWNhbGx5IGNsb3NlIHRoZSBgd3JpdGVyYFxuICAgKiB3aGVuIHRoZSBzdHJlYW0gaXMgY2xvc2VkLCBhYm9ydGVkLCBvciBhIHdyaXRlIGVycm9yIG9jY3Vycy5cbiAgICpcbiAgICogRGVmYXVsdHMgdG8gYHRydWVgLiAqL1xuICBhdXRvQ2xvc2U/OiBib29sZWFuO1xufVxuXG4vKiogQ3JlYXRlIGEgYFdyaXRhYmxlU3RyZWFtYCBmcm9tIGEgYFdyaXRlcmAuICovXG5leHBvcnQgZnVuY3Rpb24gd3JpdGFibGVTdHJlYW1Gcm9tV3JpdGVyKFxuICB3cml0ZXI6IERlbm8uV3JpdGVyLFxuICBvcHRpb25zOiBXcml0YWJsZVN0cmVhbUZyb21Xcml0ZXJPcHRpb25zID0ge30sXG4pOiBXcml0YWJsZVN0cmVhbTxVaW50OEFycmF5PiB7XG4gIGNvbnN0IHsgYXV0b0Nsb3NlID0gdHJ1ZSB9ID0gb3B0aW9ucztcblxuICByZXR1cm4gbmV3IFdyaXRhYmxlU3RyZWFtKHtcbiAgICBhc3luYyB3cml0ZShjaHVuaywgY29udHJvbGxlcikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgd3JpdGVBbGwod3JpdGVyLCBjaHVuayk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnRyb2xsZXIuZXJyb3IoZSk7XG4gICAgICAgIGlmIChpc0Nsb3Nlcih3cml0ZXIpICYmIGF1dG9DbG9zZSkge1xuICAgICAgICAgIHdyaXRlci5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBjbG9zZSgpIHtcbiAgICAgIGlmIChpc0Nsb3Nlcih3cml0ZXIpICYmIGF1dG9DbG9zZSkge1xuICAgICAgICB3cml0ZXIuY2xvc2UoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGFib3J0KCkge1xuICAgICAgaWYgKGlzQ2xvc2VyKHdyaXRlcikgJiYgYXV0b0Nsb3NlKSB7XG4gICAgICAgIHdyaXRlci5jbG9zZSgpO1xuICAgICAgfVxuICAgIH0sXG4gIH0pO1xufVxuXG4vKiogQ3JlYXRlIGEgYFJlYWRhYmxlU3RyZWFtYCBmcm9tIGFueSBraW5kIG9mIGl0ZXJhYmxlLlxuICpcbiAqICAgICAgY29uc3QgcjEgPSByZWFkYWJsZVN0cmVhbUZyb21JdGVyYWJsZShbXCJmb28sIGJhciwgYmF6XCJdKTtcbiAqICAgICAgY29uc3QgcjIgPSByZWFkYWJsZVN0cmVhbUZyb21JdGVyYWJsZSgoYXN5bmMgZnVuY3Rpb24qICgpIHtcbiAqICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgoKHIpID0+IHNldFRpbWVvdXQociwgMTAwMCkpKTtcbiAqICAgICAgICB5aWVsZCBcImZvb1wiO1xuICogICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKCgocikgPT4gc2V0VGltZW91dChyLCAxMDAwKSkpO1xuICogICAgICAgIHlpZWxkIFwiYmFyXCI7XG4gKiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKChyKSA9PiBzZXRUaW1lb3V0KHIsIDEwMDApKSk7XG4gKiAgICAgICAgeWllbGQgXCJiYXpcIjtcbiAqICAgICAgfSkoKSk7XG4qL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRhYmxlU3RyZWFtRnJvbUl0ZXJhYmxlPFQ+KFxuICBpdGVyYWJsZTogSXRlcmFibGU8VD4gfCBBc3luY0l0ZXJhYmxlPFQ+LFxuKTogUmVhZGFibGVTdHJlYW08VD4ge1xuICBjb25zdCBpdGVyYXRvcjogSXRlcmF0b3I8VD4gfCBBc3luY0l0ZXJhdG9yPFQ+ID1cbiAgICAoaXRlcmFibGUgYXMgQXN5bmNJdGVyYWJsZTxUPilbU3ltYm9sLmFzeW5jSXRlcmF0b3JdPy4oKSA/P1xuICAgICAgKGl0ZXJhYmxlIGFzIEl0ZXJhYmxlPFQ+KVtTeW1ib2wuaXRlcmF0b3JdPy4oKTtcbiAgcmV0dXJuIG5ldyBSZWFkYWJsZVN0cmVhbSh7XG4gICAgYXN5bmMgcHVsbChjb250cm9sbGVyKSB7XG4gICAgICBjb25zdCB7IHZhbHVlLCBkb25lIH0gPSBhd2FpdCBpdGVyYXRvci5uZXh0KCk7XG5cbiAgICAgIGlmIChkb25lKSB7XG4gICAgICAgIGNvbnRyb2xsZXIuY2xvc2UoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZSh2YWx1ZSk7XG4gICAgICB9XG4gICAgfSxcbiAgfSk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVhZGFibGVTdHJlYW1Gcm9tUmVhZGVyT3B0aW9ucyB7XG4gIC8qKiBJZiB0aGUgYHJlYWRlcmAgaXMgYWxzbyBhIGBEZW5vLkNsb3NlcmAsIGF1dG9tYXRpY2FsbHkgY2xvc2UgdGhlIGByZWFkZXJgXG4gICAqIHdoZW4gYEVPRmAgaXMgZW5jb3VudGVyZWQsIG9yIGEgcmVhZCBlcnJvciBvY2N1cnMuXG4gICAqXG4gICAqIERlZmF1bHRzIHRvIGB0cnVlYC4gKi9cbiAgYXV0b0Nsb3NlPzogYm9vbGVhbjtcblxuICAvKiogVGhlIHNpemUgb2YgY2h1bmtzIHRvIGFsbG9jYXRlIHRvIHJlYWQsIHRoZSBkZWZhdWx0IGlzIH4xNktpQiwgd2hpY2ggaXNcbiAgICogdGhlIG1heGltdW0gc2l6ZSB0aGF0IERlbm8gb3BlcmF0aW9ucyBjYW4gY3VycmVudGx5IHN1cHBvcnQuICovXG4gIGNodW5rU2l6ZT86IG51bWJlcjtcblxuICAvKiogVGhlIHF1ZXVpbmcgc3RyYXRlZ3kgdG8gY3JlYXRlIHRoZSBgUmVhZGFibGVTdHJlYW1gIHdpdGguICovXG4gIHN0cmF0ZWd5PzogeyBoaWdoV2F0ZXJNYXJrPzogbnVtYmVyIHwgdW5kZWZpbmVkOyBzaXplPzogdW5kZWZpbmVkIH07XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgYFJlYWRhYmxlU3RyZWFtPFVpbnQ4QXJyYXk+YCBmcm9tIGZyb20gYSBgRGVuby5SZWFkZXJgLlxuICpcbiAqIFdoZW4gdGhlIHB1bGwgYWxnb3JpdGhtIGlzIGNhbGxlZCBvbiB0aGUgc3RyZWFtLCBhIGNodW5rIGZyb20gdGhlIHJlYWRlclxuICogd2lsbCBiZSByZWFkLiAgV2hlbiBgbnVsbGAgaXMgcmV0dXJuZWQgZnJvbSB0aGUgcmVhZGVyLCB0aGUgc3RyZWFtIHdpbGwgYmVcbiAqIGNsb3NlZCBhbG9uZyB3aXRoIHRoZSByZWFkZXIgKGlmIGl0IGlzIGFsc28gYSBgRGVuby5DbG9zZXJgKS5cbiAqXG4gKiBBbiBleGFtcGxlIGNvbnZlcnRpbmcgYSBgRGVuby5GaWxlYCBpbnRvIGEgcmVhZGFibGUgc3RyZWFtOlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyByZWFkYWJsZVN0cmVhbUZyb21SZWFkZXIgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkL2lvL21vZC50c1wiO1xuICpcbiAqIGNvbnN0IGZpbGUgPSBhd2FpdCBEZW5vLm9wZW4oXCIuL2ZpbGUudHh0XCIsIHsgcmVhZDogdHJ1ZSB9KTtcbiAqIGNvbnN0IGZpbGVTdHJlYW0gPSByZWFkYWJsZVN0cmVhbUZyb21SZWFkZXIoZmlsZSk7XG4gKiBgYGBcbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkYWJsZVN0cmVhbUZyb21SZWFkZXIoXG4gIHJlYWRlcjogRGVuby5SZWFkZXIgfCAoRGVuby5SZWFkZXIgJiBEZW5vLkNsb3NlciksXG4gIG9wdGlvbnM6IFJlYWRhYmxlU3RyZWFtRnJvbVJlYWRlck9wdGlvbnMgPSB7fSxcbik6IFJlYWRhYmxlU3RyZWFtPFVpbnQ4QXJyYXk+IHtcbiAgY29uc3Qge1xuICAgIGF1dG9DbG9zZSA9IHRydWUsXG4gICAgY2h1bmtTaXplID0gREVGQVVMVF9DSFVOS19TSVpFLFxuICAgIHN0cmF0ZWd5LFxuICB9ID0gb3B0aW9ucztcblxuICByZXR1cm4gbmV3IFJlYWRhYmxlU3RyZWFtKHtcbiAgICBhc3luYyBwdWxsKGNvbnRyb2xsZXIpIHtcbiAgICAgIGNvbnN0IGNodW5rID0gbmV3IFVpbnQ4QXJyYXkoY2h1bmtTaXplKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlYWQgPSBhd2FpdCByZWFkZXIucmVhZChjaHVuayk7XG4gICAgICAgIGlmIChyZWFkID09PSBudWxsKSB7XG4gICAgICAgICAgaWYgKGlzQ2xvc2VyKHJlYWRlcikgJiYgYXV0b0Nsb3NlKSB7XG4gICAgICAgICAgICByZWFkZXIuY2xvc2UoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udHJvbGxlci5jbG9zZSgpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb250cm9sbGVyLmVucXVldWUoY2h1bmsuc3ViYXJyYXkoMCwgcmVhZCkpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb250cm9sbGVyLmVycm9yKGUpO1xuICAgICAgICBpZiAoaXNDbG9zZXIocmVhZGVyKSkge1xuICAgICAgICAgIHJlYWRlci5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBjYW5jZWwoKSB7XG4gICAgICBpZiAoaXNDbG9zZXIocmVhZGVyKSAmJiBhdXRvQ2xvc2UpIHtcbiAgICAgICAgcmVhZGVyLmNsb3NlKCk7XG4gICAgICB9XG4gICAgfSxcbiAgfSwgc3RyYXRlZ3kpO1xufVxuIl19