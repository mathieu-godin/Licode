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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLFdBQW1DLE1BQU0sb0JBQW9CLENBQUM7QUFDckUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDM0MsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUNoRCxPQUFPLFdBQVcsTUFBTSxZQUFZLENBQUM7QUFDckMsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFrQnhDLE1BQU0sT0FBTyxFQUFFO0lBQ0wsS0FBSyxDQUFPO0lBQ1osS0FBSyxDQUFVO0lBQ2YsV0FBVyxDQUFvQjtJQVl2QyxZQUFZLE9BQWUsVUFBVTtRQUNuQyxJQUFJLENBQUMsS0FBSyxHQUFHLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQztRQUNuQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFHN0IsSUFBSSxNQUFNLENBQUM7UUFDWCxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUMvQixNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEMsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLE1BQU0sS0FBSyxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQzlCLE1BQU0sSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztTQUMzQztRQUNELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQ3BCLENBQUM7SUFrRUQsS0FBSyxDQUFDLEdBQVcsRUFBRSxNQUFrRDtRQUNuRSxNQUFNLElBQUksR0FB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