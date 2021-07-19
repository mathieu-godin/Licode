import { getStr } from "./wasm.ts";
import { Status, Types, Values } from "./constants.ts";
import SqliteError from "./error.ts";
import { RowObjects } from "./row_objects.ts";
export class Rows {
    _wasm;
    _stmt;
    _cleanup;
    _done;
    constructor(wasm, stmt, cleanup) {
        this._wasm = wasm;
        this._stmt = stmt;
        this._done = false;
        this._cleanup = cleanup;
        if (wasm == null) {
            this._done = true;
        }
    }
    return() {
        if (!this._done) {
            if (this._cleanup != null) {
                this._wasm.finalize(this._stmt);
                this._cleanup.delete(this._stmt);
            }
            this._done = true;
        }
        return { done: true, value: null };
    }
    done() {
        this.return();
    }
    next() {
        if (this._done)
            return { value: null, done: true };
        const row = this._get();
        const status = this._wasm.step(this._stmt);
        switch (status) {
            case Status.SqliteRow:
                break;
            case Status.SqliteDone:
                this.return();
                break;
            default:
                this.return();
                throw new SqliteError(this._wasm, status);
                break;
        }
        return { value: row, done: false };
    }
    columns() {
        if (this._done) {
            throw new SqliteError("Unable to retrieve column names as transaction is finalized.");
        }
        const columnCount = this._wasm.column_count(this._stmt);
        const columns = [];
        for (let i = 0; i < columnCount; i++) {
            const name = getStr(this._wasm, this._wasm.column_name(this._stmt, i));
            const originName = getStr(this._wasm, this._wasm.column_origin_name(this._stmt, i));
            const tableName = getStr(this._wasm, this._wasm.column_table_name(this._stmt, i));
            columns.push({ name, originName, tableName });
        }
        return columns;
    }
    asObjects() {
        return new RowObjects(this);
    }
    [Symbol.iterator]() {
        return this;
    }
    _get() {
        const row = [];
        for (let i = 0, c = this._wasm.column_count(this._stmt); i < c; i++) {
            switch (this._wasm.column_type(this._stmt, i)) {
                case Types.Integer:
                    row.push(this._wasm.column_int(this._stmt, i));
                    break;
                case Types.Float:
                    row.push(this._wasm.column_double(this._stmt, i));
                    break;
                case Types.Text:
                    row.push(getStr(this._wasm, this._wasm.column_text(this._stmt, i)));
                    break;
                case Types.Blob: {
                    const ptr = this._wasm.column_blob(this._stmt, i);
                    if (ptr === 0) {
                        row.push(null);
                    }
                    else {
                        const length = this._wasm.column_bytes(this._stmt, i);
                        row.push(new Uint8Array(this._wasm.memory.buffer, ptr, length).slice());
                    }
                    break;
                }
                case Types.BigInteger: {
                    const ptr = this._wasm.column_text(this._stmt, i);
                    row.push(BigInt(getStr(this._wasm, ptr)));
                    break;
                }
                default:
                    row.push(null);
                    break;
            }
        }
        return row;
    }
}
export const Empty = new Rows(null, Values.Null);
Empty._done = true;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm93cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvc3FsaXRlQHYyLjQuMC9zcmMvcm93cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQ25DLE9BQU8sRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ3ZELE9BQU8sV0FBVyxNQUFNLFlBQVksQ0FBQztBQUNyQyxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFROUMsTUFBTSxPQUFPLElBQUk7SUFDUCxLQUFLLENBQU87SUFDWixLQUFLLENBQWU7SUFDcEIsUUFBUSxDQUFxQjtJQUM3QixLQUFLLENBQVU7SUFhdkIsWUFBWSxJQUFVLEVBQUUsSUFBa0IsRUFBRSxPQUEyQjtRQUNyRSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUNsQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUNsQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUduQixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUV4QixJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7WUFDaEIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7U0FDbkI7SUFDSCxDQUFDO0lBU0QsTUFBTTtRQUNKLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFO1lBR2YsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksRUFBRTtnQkFDekIsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNoQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDbEM7WUFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUks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