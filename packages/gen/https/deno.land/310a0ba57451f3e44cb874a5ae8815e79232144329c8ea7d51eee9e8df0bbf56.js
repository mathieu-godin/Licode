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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBYyxlQUFlLEVBQWlCLE1BQU0saUJBQWlCLENBQUM7QUFDN0UsT0FBTyxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDM0QsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQXNDbEMsTUFBTSxPQUFPLE1BQU07SUFDakIsTUFBTSxHQUFpQixFQUFFLENBQUM7SUFDbEIsS0FBSyxDQUFrQjtJQUV2QixLQUFLLENBQUMsZ0JBQWdCO1FBQzVCLElBQUksVUFBVSxHQUFHLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNqRCxNQUFNLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMzQixPQUFPLFVBQVUsQ0FBQztJQUNwQixDQUFDO0lBR0QsSUFBSSxJQUFJO1FBQ04sT0FBTyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQztJQUMxQixDQUFDO0lBT0QsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFvQjtRQUNoQyxJQUFJLENBQUMsTUFBTSxHQUFHO1lBQ1osUUFBUSxFQUFFLFdBQVc7WUFDckIsUUFBUSxFQUFFLE1BQU07WUFDaEIsSUFBSSxFQUFFLElBQUk7WUFDVixRQUFRLEVBQUUsQ0FBQztZQUNYLE9BQU8sRUFBRSxFQUFFLEdBQUcsSUFBSTtZQUNsQixXQUFXLEVBQUUsQ0FBQyxHQUFHLElBQUksR0FBRyxJQUFJO1lBQzVCLEdBQUcsTUFBTTtTQUNWLENBQUM7UUFDRixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksY0FBYyxDQUM3QixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsSUFBSSxFQUFFLEVBQzFCLElBQUksQ0FBQyxnQkFBZ0Is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