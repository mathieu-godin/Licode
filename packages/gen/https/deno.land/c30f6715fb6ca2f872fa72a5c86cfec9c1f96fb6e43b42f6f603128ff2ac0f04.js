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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUN4RCxPQUFPLEVBR0wsWUFBWSxHQUNiLE1BQU0sbUNBQW1DLENBQUM7QUFDM0MsT0FBTyxFQUNMLEtBQUssRUFPTCxVQUFVLEVBQ1YscUJBQXFCLEdBQ3RCLE1BQU0sa0JBQWtCLENBQUM7QUFDMUIsT0FBTyxFQUFFLFdBQVcsRUFBc0IsTUFBTSx3QkFBd0IsQ0FBQztBQUN6RSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFFOUMsTUFBTSxPQUFnQixXQUFXO0lBQ3JCLFVBQVUsQ0FBYTtJQUN2QixXQUFXLEdBQWtCLElBQUksQ0FBQztJQUU1QyxZQUFZLFVBQXNCO1FBQ2hDLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO0lBQy9CLENBQUM7SUFFRCxJQUFJLG1CQUFtQjtRQUNyQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDMUIsQ0FBQztJQVFTLFlBQVksQ0FDcEIsS0FBd0I7UUFFeEIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBeUZELGlCQUFpQixDQUFDLElBQVksRUFBRSxPQUE0QjtRQUMxRCxPQUFPLElBQUksV0FBVyxDQUNwQixJQUFJLEVBQ0osT0FBTyxFQUNQLElBQUksRUFFSixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFDNUIsQ0FBQyxJQUFtQixFQUFFLEVBQUU7WUFDdEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDMUIsQ0FBQyxDQUNGLENBQUM7SUFDSixDQUFDO0lBc0NELFVBQVUsQ0FFUix3QkFBcUUsRUFDckUsR0FBRyxJQUFvQjtRQUV2QixJQUFJLElBQUksQ0FBQyxtQkFB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