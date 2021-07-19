import instantiate from "../build/sqlite.js";
import { setArr, setStr } from "./wasm.ts";
import { Status, Values } from "./constants.ts";
import SqliteError from "./error.ts";
import { Empty, Rows } from "./rows.ts";
export class DB {
    _wasm;
    _open;
    _statements;
    constructor(path = ":memory:") {
        this._wasm = instantiate().exports;
        this._open = false;
        this._statements = new Set();
        let status;
        setStr(this._wasm, path, (ptr) => {
            status = this._wasm.open(ptr);
        });
        if (status !== Status.SqliteOk) {
            throw new SqliteError(this._wasm, status);
        }
        this._open = true;
    }
    query(sql, values) {
        const stmt = this.prepareStmt(sql);
        if (values != null) {
            try {
                this.bindStmt(stmt, values);
            }
            catch (err) {
                this._wasm.finalize(stmt);
                throw err;
            }
        }
        const status = this._wasm.step(stmt);
        switch (status) {
            case Status.SqliteDone:
                this._wasm.finalize(stmt);
                return Empty;
            case Status.SqliteRow:
                this._statements.add(stmt);
                return new Rows(this._wasm, stmt, this._statements);
            default:
                this._wasm.finalize(stmt);
                throw new SqliteError(this._wasm, status);
        }
    }
    prepareQuery(sql) {
        const stmt = this.prepareStmt(sql);
        let lastRows = null;
        const query = (values) => {
            if (lastRows != null) {
                lastRows.return();
                lastRows = null;
            }
            this._wasm.reset(stmt);
            this._wasm.clear_bindings(stmt);
            if (values != null) {
                this.bindStmt(stmt, values);
            }
            const status = this._wasm.step(stmt);
            switch (status) {
                case Status.SqliteDone:
                    return Empty;
                case Status.SqliteRow:
                    lastRows = new Rows(this._wasm, stmt);
                    return lastRows;
                default:
                    throw new SqliteError(this._wasm, status);
            }
        };
        this._statements.add(stmt);
        query.finalize = () => {
            this._wasm.finalize(stmt);
            this._statements.delete(stmt);
        };
        return query;
    }
    prepareStmt(sql) {
        if (!this._open) {
            throw new SqliteError("Database was closed.");
        }
        let stmt = Values.Null;
        setStr(this._wasm, sql, (ptr) => {
            stmt = this._wasm.prepare(ptr);
        });
        if (stmt === Values.Null) {
            throw new SqliteError(this._wasm);
        }
        return stmt;
    }
    bindStmt(stmt, values) {
        let parameters = [];
        if (Array.isArray(values)) {
            parameters = values;
        }
        else if (typeof values === "object") {
            for (const key of Object.keys(values)) {
                let idx = Values.Error;
                let name = key;
                if (name[0] !== ":" && name[0] !== "@" && name[0] !== "$") {
                    name = `:${name}`;
                }
                setStr(this._wasm, name, (ptr) => {
                    idx = this._wasm.bind_parameter_index(stmt, ptr);
                });
                if (idx === Values.Error) {
                    throw new SqliteError(`No parameter named '${name}'.`);
                }
                parameters[idx - 1] = values[key];
            }
        }
        for (let i = 0; i < parameters.length; i++) {
            let value = parameters[i];
            let status;
            switch (typeof value) {
                case "boolean":
                    value = value ? 1 : 0;
                case "number":
                    if (Number.isSafeInteger(value)) {
                        status = this._wasm.bind_int(stmt, i + 1, value);
                    }
                    else {
                        status = this._wasm.bind_double(stmt, i + 1, value);
                    }
                    break;
                case "bigint":
                    setStr(this._wasm, value.toString(), (ptr) => {
                        status = this._wasm.bind_big_int(stmt, i + 1, ptr);
                    });
                    break;
                case "string":
                    setStr(this._wasm, value, (ptr) => {
                        status = this._wasm.bind_text(stmt, i + 1, ptr);
                    });
                    break;
                default:
                    if (value instanceof Date) {
                        setStr(this._wasm, value.toISOString(), (ptr) => {
                            status = this._wasm.bind_text(stmt, i + 1, ptr);
                        });
                    }
                    else if (value instanceof Uint8Array) {
                        setArr(this._wasm, value, (ptr) => {
                            status = this._wasm.bind_blob(stmt, i + 1, ptr, value.length);
                        });
                    }
                    else if (value === null || value === undefined) {
                        status = this._wasm.bind_null(stmt, i + 1);
                    }
                    else {
                        throw new SqliteError(`Can not bind ${typeof value}.`);
                    }
                    break;
            }
            if (status !== Status.SqliteOk) {
                throw new SqliteError(this._wasm, status);
            }
        }
    }
    close(force = false) {
        if (!this._open) {
            return;
        }
        if (force) {
            for (const stmt of this._statements) {
                if (this._wasm.finalize(stmt) !== Status.SqliteOk) {
                    throw new SqliteError(this._wasm);
                }
            }
        }
        if (this._wasm.close() !== Status.SqliteOk) {
            throw new SqliteError(this._wasm);
        }
        this._open = false;
    }
    get lastInsertRowId() {
        return this._wasm.last_insert_rowid();
    }
    get changes() {
        return this._wasm.changes();
    }
    get totalChanges() {
        return this._wasm.total_changes();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJodHRwczovL2Rlbm8ubGFuZC94L3NxbGl0ZUB2Mi40LjAvc3JjL2RiLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sV0FBbUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNyRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUMzQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ2hELE9BQU8sV0FBVyxNQUFNLFlBQVksQ0FBQztBQUNyQyxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLFdBQVcsQ0FBQztBQWtCeEMsTUFBTSxPQUFPLEVBQUU7SUFDTCxLQUFLLENBQU87SUFDWixLQUFLLENBQVU7SUFDZixXQUFXLENBQW9CO0lBWXZDLFlBQVksT0FBZSxVQUFVO1FBQ25DLElBQUksQ0FBQyxLQUFLLEdBQUcsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDO1FBQ25DLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUc3QixJQUFJLE1BQU0sQ0FBQztRQUNYLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQy9CLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNoQyxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksTUFBTSxLQUFLLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDOUIsTUFBTSxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQzNDO1FBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7SUFDcEIsQ0FBQztJQWtFRCxLQUFLLENB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