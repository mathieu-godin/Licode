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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBvb2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUN6QyxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFDeEQsT0FBTyxFQUlMLFlBQVksR0FDYixNQUFNLG1DQUFtQyxDQUFDO0FBQzNDLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQWdEekQsTUFBTSxPQUFPLElBQUk7SUFDZixzQkFBc0IsR0FBcUMsSUFBSSxDQUFDO0lBQ2hFLGtCQUFrQixDQUFtQjtJQUNyQyxNQUFNLEdBQUcsS0FBSyxDQUFDO0lBQ2YsS0FBSyxDQUFVO0lBQ2YsU0FBUyxDQUFTO0lBR2xCLE1BQU0sQ0FBZ0I7SUFFdEIsWUFFRSxpQkFBbUUsRUFFbkUsUUFBZ0IsRUFDaEIsT0FBZ0IsS0FBSztRQUVyQixJQUFJLENBQUMsa0JBQWtCLEdBQUcsWUFBWSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDMUQsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDbEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7UUFDMUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDbkMsQ0FBQztJQU9ELElBQUksU0FBUztRQUNYLElBQUksSUFBSSxDQUFDLHNCQUFzQixJQUFJLElBQUksRUFBRTtZQUN2QyxPQUFPLENBQUMsQ0FBQztTQUNWO1FBQ0QsT0FBTyxJQUFJLENBQUMsc0JBQXNCLENBQUMsU0FBUyxDQUFDO0lBQy9DLENBQUM7SUFlRCxLQUFLLENBQUMsT0FBTztRQUVYLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNmLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1NBQ2xDO1FBRUQsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ2xCLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLHNCQUF1QixDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzVELE1BQU0sT0FBTyxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxzQkFBdUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDcEUsT0FBTyxJQUFJLFVBQVUsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVELGlCQUFpQixHQUFHLEtBQUssSUFBeUIsRUFBRTtRQUNsRCxNQUFNLFVBQVUsR0FBRyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUMzRCxNQUFNLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMzQixPQUFPLFVBQVUsQ0FBQztJQUNwQixDQUFDLENBQUM7SUFxQkYsS0FBSyxDQUFDLEdBQUc7UUFDUCxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDZixNQUFNLElBQUksS0FBSyxDQUFDLCtDQUErQyxDQUFDLENBQUM7U0FDbEU7UUFFRCxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDbEIsT0FBTyxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsRUFBRTtZQUN6QixNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxzQkFBdUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUN0RCxNQUFNLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztTQUNsQjtRQUVELElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUM7UUFDbkMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7SUFDckIsQ0FBQztJQUVELFdBQVcsR0FBRyxLQUFLLElBQW1CLEVBQUU7UUFDdEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ2pELE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQzVCLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxFQUNwQixHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FDL0IsQ0FBQztRQUVGLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLGFBQWEsQ0FDN0MsSUFBSSxDQUFDLFNBQVMsRUFDZCxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQzlCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQ2xDLENBQUM7UUFFRixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztJQUN0QixDQUFDLENBQUM7SUFPRixJQUFJLElBQUk7UUFDTixJQUFJLElBQUksQ0FBQyxzQkFBc0IsSUFBSSxJQUFJLEVBQUU7WUFDdkMsT0FBTyxDQUFDLENBQUM7U0FDVjtRQUNELE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQztJQUMxQyxDQUFDO0NBQ0YifQ==