import { ConnectionState } from "./connection.ts";
import { ConnectionPool, PoolConnection } from "./pool.ts";
import { log } from "./logger.ts";
export class Client {
    config = {};
    _pool;
    async createConnection() {
        let connection = new PoolConnection(this.config);
        await connection.connect();
        return connection;
    }
    get pool() {
        return this._pool?.info;
    }
    async connect(config) {
        this.config = {
            hostname: "127.0.0.1",
            username: "root",
            port: 3306,
            poolSize: 1,
            timeout: 30 * 1000,
            idleTimeout: 4 * 3600 * 1000,
            ...config,
        };
        Object.freeze(this.config);
        this._pool = new ConnectionPool(this.config.poolSize || 10, this.createConnection.bind(this));
        return this;
    }
    async query(sql, params) {
        return await this.useConnection(async (connection) => {
            return await connection.query(sql, params);
        });
    }
    async execute(sql, params) {
        return await this.useConnection(async (connection) => {
            return await connection.execute(sql, params);
        });
    }
    async useConnection(fn) {
        if (!this._pool) {
            throw new Error("Unconnected");
        }
        const connection = await this._pool.pop();
        try {
            return await fn(connection);
        }
        finally {
            if (connection.state == ConnectionState.CLOSED) {
                connection.removeFromPool();
            }
            else {
                connection.returnToPool();
            }
        }
    }
    async transaction(processor) {
        return await this.useConnection(async (connection) => {
            try {
                await connection.execute("BEGIN");
                const result = await processor(connection);
                await connection.execute("COMMIT");
                return result;
            }
            catch (error) {
                if (connection.state == ConnectionState.CONNECTED) {
                    log.info(`ROLLBACK: ${error.message}`);
                    await connection.execute("ROLLBACK");
                }
                throw error;
            }
        });
    }
    async close() {
        if (this._pool) {
            this._pool.close();
            this._pool = undefined;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cHM6Ly9kZW5vLmxhbmQveC9teXNxbEB2Mi45LjAvc3JjL2NsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQWMsZUFBZSxFQUFpQixNQUFNLGlCQUFpQixDQUFDO0FBQzdFLE9BQU8sRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQzNELE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFzQ2xDLE1BQU0sT0FBTyxNQUFNO0lBQ2pCLE1BQU0sR0FBaUIsRUFBRSxDQUFDO0lBQ2xCLEtBQUssQ0FBa0I7SUFFdkIsS0FBSyxDQUFDLGdCQUFnQjtRQUM1QixJQUFJLFVBQVUsR0FBRyxJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakQsTUFBTSxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0IsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQztJQUdELElBQUksSUFBSTtRQUNOLE9BQU8sSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUM7SUFDMUIsQ0FBQztJQU9ELEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBb0I7UUFDaEMsSUFBSSxDQUFDLE1BQU0sR0FBRztZQUNaLFFBQVEsRUFBRSxXQUFXO1lBQ3JCLFFBQVEsRUFBRSxNQUFNO1lBQ2hCLElBQUksRUFBRSxJQUFJO1lBQ1YsUUFBUSxFQUFFLENBQUM7WUFDWCxPQUFPLEVBQUUsRUFBRSxHQUFHLElBQUk7WUFDbEIsV0FBVyxFQUFFLENBQUMsR0FBRyxJQUFJLEdBQUcsSUFBSTtZQUM1QixHQUFHLE1BQU07U0FDVixDQUFDO1FBQ0YsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0IsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLGNBQWMsQ0FDN0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxR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