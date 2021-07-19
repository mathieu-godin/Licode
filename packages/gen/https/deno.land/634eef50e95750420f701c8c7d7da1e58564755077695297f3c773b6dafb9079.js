import { PoolClient } from "./client.ts";
import { Connection } from "./connection/connection.ts";
import { createParams, } from "./connection/connection_params.ts";
import { DeferredStack } from "./connection/deferred.ts";
export class Pool {
    #available_connections = null;
    #connection_params;
    #ended = false;
    #lazy;
    #max_size;
    #ready;
    constructor(connection_params, max_size, lazy = false) {
        this.#connection_params = createParams(connection_params);
        this.#lazy = lazy;
        this.#max_size = max_size;
        this.#ready = this.#initialize();
    }
    get available() {
        if (this.#available_connections == null) {
            return 0;
        }
        return this.#available_connections.available;
    }
    async connect() {
        if (this.#ended) {
            this.#ready = this.#initialize();
        }
        await this.#ready;
        const connection = await this.#available_connections.pop();
        const release = () => this.#available_connections.push(connection);
        return new PoolClient(connection, release);
    }
    #createConnection = async () => {
        const connection = new Connection(this.#connection_params);
        await connection.startup();
        return connection;
    };
    async end() {
        if (this.#ended) {
            throw new Error("Pool connections have already been terminated");
        }
        await this.#ready;
        while (this.available > 0) {
            const conn = await this.#available_connections.pop();
            await conn.end();
        }
        this.#available_connections = null;
        this.#ended = true;
    }
    #initialize = async () => {
        const initSize = this.#lazy ? 0 : this.#max_size;
        const connections = Array.from({ length: initSize }, () => this.#createConnection());
        this.#available_connections = new DeferredStack(this.#max_size, await Promise.all(connections), this.#createConnection.bind(this));
        this.#ended = false;
    };
    get size() {
        if (this.#available_connections == null) {
            return 0;
        }
        return this.#available_connections.size;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvcG9zdGdyZXNAdjAuMTEuMi9wb29sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDekMsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ3hELE9BQU8sRUFJTCxZQUFZLEdBQ2IsTUFBTSxtQ0FBbUMsQ0FBQztBQUMzQyxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFnRHpELE1BQU0sT0FBTyxJQUFJO0lBQ2Ysc0JBQXNCLEdBQXFDLElBQUksQ0FBQztJQUNoRSxrQkFBa0IsQ0FBbUI7SUFDckMsTUFBTSxHQUFHLEtBQUssQ0FBQztJQUNmLEtBQUssQ0FBVTtJQUNmLFNBQVMsQ0FBUztJQUdsQixNQUFNLENBQWdCO0lBRXRCLFlBRUUsaUJBQW1FLEVBRW5FLFFBQWdCLEVBQ2hCLE9BQWdCLEtBQUs7UUFFckIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQzFELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1FBQzFCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ25DLENBQUM7SUFPRCxJQUFJLFNBQVM7UUFDWCxJQUFJLElBQUksQ0FBQyxzQkFBc0IsSUFBSSxJQUFJLEVBQUU7WUFDdkMsT0FBTyxDQUFDLENBQUM7U0FDVjtRQUNELE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLFNBQVMsQ0FBQztJQUMvQyxDQUFDO0lBZUQsS0FBSyxDQUFDLE9BQU87UUFFWCxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDZixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztTQUNsQztRQUVELE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNsQixNQUFNLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQyxzQkFBdUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUM1RCxNQUFNLE9BQU8sR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsc0JBQXVCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3BFLE9BQU8sSUFBSSxVQUFVLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRCxpQkFBaUIsR0FBRyxLQUFLLElBQXlCLEVBQUU7UUFDbEQsTUFBTSxVQUFVLEdBQUcsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDM0QsTUFBTSxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0IsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQyxDQUFDO0lBcUJGLEtBQUssQ0FBQyxHQUFHO1FBQ1AsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2YsTUFBTSxJQUFJLEtBQUssQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO1NBQ2xFO1FBRUQsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ2xCLE9BQU8sSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLEVBQUU7WUFDekIsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsc0JBQXVCLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDdEQsTUFBTSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDbEI7UUFFRCxJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO1FBQ25DLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0lBQ3JCLENBQUM7SUFFRCxXQUFXLEdBQUcsS0FBSyxJQUFtQixFQUFFO1FBQ3RDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUNqRCxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUM1QixFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsRUFDcEIsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQy9CLENBQUM7UUFFRixJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxhQUFhLENBQzdDLElBQUksQ0FBQyxTQUFTLEVBQ2QsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUM5QixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUNsQyxDQUFDO1FBRUYsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7SUFDdEIsQ0FBQyxDQUFDO0lBT0YsSUFBSSxJQUFJO1FBQ04sSUFBSSxJQUFJLENBQUMsc0JBQXNCLElBQUksSUFBSSxFQUFFO1lBQ3ZDLE9BQU8sQ0FBQyxDQUFDO1NBQ1Y7UUFDRCxPQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUM7SUFDMUMsQ0FBQztDQUNGIn0=