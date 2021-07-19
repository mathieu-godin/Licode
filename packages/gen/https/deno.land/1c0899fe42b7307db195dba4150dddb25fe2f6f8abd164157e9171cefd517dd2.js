import { Query, ResultType, templateStringToQuery, } from "./query.ts";
import { isTemplateString } from "../utils.ts";
import { PostgresError, TransactionError } from "../connection/warning.ts";
export class Savepoint {
    name;
    #instance_count = 0;
    #release_callback;
    #update_callback;
    constructor(name, update_callback, release_callback) {
        this.name = name;
        this.#release_callback = release_callback;
        this.#update_callback = update_callback;
    }
    get instances() {
        return this.#instance_count;
    }
    async release() {
        if (this.#instance_count === 0) {
            throw new Error("This savepoint has no instances to release");
        }
        await this.#release_callback(this.name);
        --this.#instance_count;
    }
    async update() {
        await this.#update_callback(this.name);
        ++this.#instance_count;
    }
}
export class Transaction {
    name;
    #client;
    #executeQuery;
    #isolation_level;
    #read_only;
    #savepoints = [];
    #snapshot;
    #updateClientLock;
    constructor(name, options, client, execute_query_callback, update_client_lock_callback) {
        this.name = name;
        this.#client = client;
        this.#executeQuery = execute_query_callback;
        this.#isolation_level = options?.isolation_level ?? "read_committed";
        this.#read_only = options?.read_only ?? false;
        this.#snapshot = options?.snapshot;
        this.#updateClientLock = update_client_lock_callback;
    }
    get isolation_level() {
        return this.#isolation_level;
    }
    get savepoints() {
        return this.#savepoints;
    }
    #assertTransactionOpen = () => {
        if (this.#client.current_transaction !== this.name) {
            throw new Error(`This transaction has not been started yet, make sure to use the "begin" method to do so`);
        }
    };
    #resetTransaction = () => {
        this.#savepoints = [];
    };
    async begin() {
        if (this.#client.current_transaction !== null) {
            if (this.#client.current_transaction === this.name) {
                throw new Error("This transaction is already open");
            }
            throw new Error(`This client already has an ongoing transaction "${this.#client.current_transaction}"`);
        }
        let isolation_level;
        switch (this.#isolation_level) {
            case "read_committed": {
                isolation_level = "READ COMMITTED";
                break;
            }
            case "repeatable_read": {
                isolation_level = "REPEATABLE READ";
                break;
            }
            case "serializable": {
                isolation_level = "SERIALIZABLE";
                break;
            }
            default:
                throw new Error(`Unexpected isolation level "${this.#isolation_level}"`);
        }
        let permissions;
        if (this.#read_only) {
            permissions = "READ ONLY";
        }
        else {
            permissions = "READ WRITE";
        }
        let snapshot = "";
        if (this.#snapshot) {
            snapshot = `SET TRANSACTION SNAPSHOT '${this.#snapshot}'`;
        }
        try {
            await this.#client.queryArray(`BEGIN ${permissions} ISOLATION LEVEL ${isolation_level};${snapshot}`);
        }
        catch (e) {
            if (e instanceof PostgresError) {
                throw new TransactionError(this.name, e);
            }
            else {
                throw e;
            }
        }
        this.#updateClientLock(this.name);
    }
    async commit(options) {
        this.#assertTransactionOpen();
        const chain = options?.chain ?? false;
        try {
            await this.queryArray(`COMMIT ${chain ? "AND CHAIN" : ""}`);
        }
        catch (e) {
            if (e instanceof PostgresError) {
                throw new TransactionError(this.name, e);
            }
            else {
                throw e;
            }
        }
        this.#resetTransaction();
        if (!chain) {
            this.#updateClientLock(null);
        }
    }
    getSavepoint(name) {
        return this.#savepoints.find((sv) => sv.name === name.toLowerCase());
    }
    getSavepoints() {
        return this.#savepoints
            .filter(({ instances }) => instances > 0)
            .map(({ name }) => name);
    }
    async getSnapshot() {
        this.#assertTransactionOpen();
        const { rows } = await this.queryObject `SELECT PG_EXPORT_SNAPSHOT() AS SNAPSHOT;`;
        return rows[0].snapshot;
    }
    async queryArray(query_template_or_config, ...args) {
        this.#assertTransactionOpen();
        let query;
        if (typeof query_template_or_config === "string") {
            query = new Query(query_template_or_config, ResultType.ARRAY, ...args);
        }
        else if (isTemplateString(query_template_or_config)) {
            query = templateStringToQuery(query_template_or_config, args, ResultType.ARRAY);
        }
        else {
            query = new Query(query_template_or_config, ResultType.ARRAY);
        }
        try {
            return await this.#executeQuery(query);
        }
        catch (e) {
            if (e instanceof PostgresError) {
                await this.commit();
                throw new TransactionError(this.name, e);
            }
            else {
                throw e;
            }
        }
    }
    async queryObject(query_template_or_config, ...args) {
        this.#assertTransactionOpen();
        let query;
        if (typeof query_template_or_config === "string") {
            query = new Query(query_template_or_config, ResultType.OBJECT, ...args);
        }
        else if (isTemplateString(query_template_or_config)) {
            query = templateStringToQuery(query_template_or_config, args, ResultType.OBJECT);
        }
        else {
            query = new Query(query_template_or_config, ResultType.OBJECT);
        }
        try {
            return await this.#executeQuery(query);
        }
        catch (e) {
            if (e instanceof PostgresError) {
                await this.commit();
                throw new TransactionError(this.name, e);
            }
            else {
                throw e;
            }
        }
    }
    async rollback(savepoint_or_options) {
        this.#assertTransactionOpen();
        let savepoint_option;
        if (typeof savepoint_or_options === "string" ||
            savepoint_or_options instanceof Savepoint) {
            savepoint_option = savepoint_or_options;
        }
        else {
            savepoint_option =
                savepoint_or_options?.savepoint;
        }
        let savepoint_name;
        if (savepoint_option instanceof Savepoint) {
            savepoint_name = savepoint_option.name;
        }
        else if (typeof savepoint_option === "string") {
            savepoint_name = savepoint_option.toLowerCase();
        }
        let chain_option = false;
        if (typeof savepoint_or_options === "object") {
            chain_option = savepoint_or_options?.chain ??
                false;
        }
        if (chain_option && savepoint_name) {
            throw new Error("The chain option can't be used alongside a savepoint on a rollback operation");
        }
        if (typeof savepoint_option !== "undefined") {
            const ts_savepoint = this.#savepoints.find(({ name }) => name === savepoint_name);
            if (!ts_savepoint) {
                throw new Error(`There is no "${savepoint_name}" savepoint registered in this transaction`);
            }
            if (!ts_savepoint.instances) {
                throw new Error(`There are no savepoints of "${savepoint_name}" left to rollback to`);
            }
            await this.queryArray(`ROLLBACK TO ${savepoint_name}`);
            return;
        }
        try {
            await this.queryArray(`ROLLBACK ${chain_option ? "AND CHAIN" : ""}`);
        }
        catch (e) {
            if (e instanceof PostgresError) {
                await this.commit();
                throw new TransactionError(this.name, e);
            }
            else {
                throw e;
            }
        }
        this.#resetTransaction();
        if (!chain_option) {
            this.#updateClientLock(null);
        }
    }
    async savepoint(name) {
        this.#assertTransactionOpen();
        if (!/^[a-zA-Z_]{1}[\w]{0,62}$/.test(name)) {
            if (!Number.isNaN(Number(name[0]))) {
                throw new Error("The savepoint name can't begin with a number");
            }
            if (name.length > 63) {
                throw new Error("The savepoint name can't be longer than 63 characters");
            }
            throw new Error("The savepoint name can only contain alphanumeric characters");
        }
        name = name.toLowerCase();
        let savepoint = this.#savepoints.find((sv) => sv.name === name);
        if (savepoint) {
            try {
                await savepoint.update();
            }
            catch (e) {
                if (e instanceof PostgresError) {
                    await this.commit();
                    throw new TransactionError(this.name, e);
                }
                else {
                    throw e;
                }
            }
        }
        else {
            savepoint = new Savepoint(name, async (name) => {
                await this.queryArray(`SAVEPOINT ${name}`);
            }, async (name) => {
                await this.queryArray(`RELEASE SAVEPOINT ${name}`);
            });
            try {
                await savepoint.update();
            }
            catch (e) {
                if (e instanceof PostgresError) {
                    await this.commit();
                    throw new TransactionError(this.name, e);
                }
                else {
                    throw e;
                }
            }
            this.#savepoints.push(savepoint);
        }
        return savepoint;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNhY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJodHRwczovL2Rlbm8ubGFuZC94L3Bvc3RncmVzQHYwLjExLjIvcXVlcnkvdHJhbnNhY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUNMLEtBQUssRUFPTCxVQUFVLEVBQ1YscUJBQXFCLEdBQ3RCLE1BQU0sWUFBWSxDQUFDO0FBQ3BCLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUMvQyxPQUFPLEVBQUUsYUFBYSxFQUFFLGdCQUFnQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFFM0UsTUFBTSxPQUFPLFNBQVM7SUFTRjtJQUxsQixlQUFlLEdBQUcsQ0FBQyxDQUFDO0lBQ3BCLGlCQUFpQixDQUFrQztJQUNuRCxnQkFBZ0IsQ0FBa0M7SUFFbEQsWUFDa0IsSUFBWSxFQUU1QixlQUFnRCxFQUVoRCxnQkFBaUQ7UUFKakMsU0FBSSxHQUFKLElBQUksQ0FBUTtRQU01QixJQUFJLENBQUMsaUJBQWlCLEdBQUcsZ0JBQWdCLENBQUM7UUFDMUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGVBQWUsQ0FBQztJQUMxQyxDQUFDO0lBRUQsSUFBSSxTQUFTO1FBQ1gsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO0lBQzlCLENBQUM7SUFzQkQsS0FBSyxDQUFDLE9BQU87UUFDWCxJQUFJLElBQUksQ0FBQyxlQUFlLEtBQUssQ0FBQyxFQUFFO1lBQzlCLE1BQU0sSUFBSSxLQUFLLENBQUMsNENBQTRDLENBQUMsQ0FBQztTQUMvRDtRQUVELE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4QyxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUM7SUFDekIsQ0FBQztJQXFCRCxLQUFLLENBQUMsTUFBTTtRQUNWLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztR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