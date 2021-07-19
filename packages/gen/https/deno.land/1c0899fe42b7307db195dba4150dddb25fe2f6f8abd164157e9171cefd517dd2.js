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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNhY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0cmFuc2FjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQ0wsS0FBSyxFQU9MLFVBQVUsRUFDVixxQkFBcUIsR0FDdEIsTUFBTSxZQUFZLENBQUM7QUFDcEIsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQy9DLE9BQU8sRUFBRSxhQUFhLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUUzRSxNQUFNLE9BQU8sU0FBUztJQVNGO0lBTGxCLGVBQWUsR0FBRyxDQUFDLENBQUM7SUFDcEIsaUJBQWlCLENBQWtDO0lBQ25ELGdCQUFnQixDQUFrQztJQUVsRCxZQUNrQixJQUFZLEVBRTVCLGVBQWdELEVBRWhELGdCQUFpRDtRQUpqQyxTQUFJLEdBQUosSUFBSSxDQUFRO1FBTTVCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxnQkFBZ0IsQ0FBQztRQUMxQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZUFBZSxDQUFDO0lBQzFDLENBQUM7SUFFRCxJQUFJLFNBQVM7UUFDWCxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7SUFDOUIsQ0FBQztJQXNCRCxLQUFLLENBQUMsT0FBTztRQUNYLElBQUksSUFBSSxDQUFDLGVBQWUsS0FBSyxDQUFDLEVBQUU7WUFDOUIsTUFBTSxJQUFJLEtBQUssQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDO1NBQy9EO1FBRUQsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hDLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQztJQUN6QixDQUFDO0lBcUJELEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZDLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQztJQUN6QixDQUFDO0NB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