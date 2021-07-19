import { Connection } from "./connection/connection.ts";
import { createParams, } from "./connection/connection_params.ts";
import { Query, ResultType, templateStringToQuery, } from "./query/query.ts";
import { Transaction } from "./query/transaction.ts";
import { isTemplateString } from "./utils.ts";
export class QueryClient {
    connection;
    transaction = null;
    constructor(connection) {
        this.connection = connection;
    }
    get current_transaction() {
        return this.transaction;
    }
    executeQuery(query) {
        return this.connection.query(query);
    }
    createTransaction(name, options) {
        return new Transaction(name, options, this, this.executeQuery.bind(this), (name) => {
            this.transaction = name;
        });
    }
    queryArray(query_template_or_config, ...args) {
        if (this.current_transaction !== null) {
            throw new Error(`This connection is currently locked by the "${this.current_transaction}" transaction`);
        }
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
        return this.executeQuery(query);
    }
    queryObject(query_template_or_config, ...args) {
        if (this.current_transaction !== null) {
            throw new Error(`This connection is currently locked by the "${this.current_transaction}" transaction`);
        }
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
        return this.executeQuery(query);
    }
}
export class Client extends QueryClient {
    constructor(config) {
        super(new Connection(createParams(config)));
    }
    async connect() {
        await this.connection.startup();
    }
    async end() {
        await this.connection.end();
        this.transaction = null;
    }
}
export class PoolClient extends QueryClient {
    #release;
    constructor(connection, releaseCallback) {
        super(connection);
        this.#release = releaseCallback;
    }
    async release() {
        await this.#release();
        this.transaction = null;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cHM6Ly9kZW5vLmxhbmQveC9wb3N0Z3Jlc0B2MC4xMS4yL2NsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFDeEQsT0FBTyxFQUdMLFlBQVksR0FDYixNQUFNLG1DQUFtQyxDQUFDO0FBQzNDLE9BQU8sRUFDTCxLQUFLLEVBT0wsVUFBVSxFQUNWLHFCQUFxQixHQUN0QixNQUFNLGtCQUFrQixDQUFDO0FBQzFCLE9BQU8sRUFBRSxXQUFXLEVBQXNCLE1BQU0sd0JBQXdCLENBQUM7QUFDekUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sWUFBWSxDQUFDO0FBRTlDLE1BQU0sT0FBZ0IsV0FBVztJQUNyQixVQUFVLENBQWE7SUFDdkIsV0FBVyxHQUFrQixJQUFJLENBQUM7SUFFNUMsWUFBWSxVQUFzQjtRQUNoQyxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztJQUMvQixDQUFDO0lBRUQsSUFBSSxtQkFBbUI7UUFDckIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzFCLENBQUM7SUFRUyxZQUFZLENBQ3BCLEtBQXdCO1FBRXhCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQXlGRCxpQkFBaUIsQ0FBQyxJQUFZLEVBQUUsT0FBNEI7UUFDMUQsT0FBTyxJQUFJLFdBQVcsQ0FDcEIsSUFBSSxFQUNKLE9BQU8sRUFDUCxJQUFJLEVBRUosSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQzVCLENBQUMsSUFBbUIsRUFBRSxFQUFFO1lBQ3RCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBQzFCLENBQUMsQ0FDRixDQUFDO0lBQ0osQ0FBQztJQXNDRCxVQUFVLENBRVIsd0JBQXFFLEVBQ3JF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