import { PoolClient } from "./client.ts";
import { createParams, } from "./connection/connection_params.ts";
import { DeferredAccessStack } from "./utils/deferred.ts";
export class Pool {
    #available_connections;
    #connection_params;
    #ended = false;
    #lazy;
    #ready;
    #size;
    get available() {
        if (!this.#available_connections) {
            return 0;
        }
        return this.#available_connections.available;
    }
    get size() {
        if (!this.#available_connections) {
            return 0;
        }
        return this.#available_connections.size;
    }
    constructor(connection_params, size, lazy = false) {
        this.#connection_params = createParams(connection_params);
        this.#lazy = lazy;
        this.#size = size;
        this.#ready = this.#initialize();
    }
    async connect() {
        if (this.#ended) {
            this.#ready = this.#initialize();
        }
        await this.#ready;
        return this.#available_connections.pop();
    }
    async end() {
        if (this.#ended) {
            throw new Error("Pool connections have already been terminated");
        }
        await this.#ready;
        while (this.available > 0) {
            const client = await this.#available_connections.pop();
            await client.end();
        }
        this.#available_connections = undefined;
        this.#ended = true;
    }
    async #initialize() {
        const initialized = this.#lazy ? 0 : this.#size;
        const clients = Array.from({ length: this.#size }, async (_e, index) => {
            const client = new PoolClient(this.#connection_params, () => this.#available_connections.push(client));
            if (index < initialized) {
                await client.connect();
            }
            return client;
        });
        this.#available_connections = new DeferredAccessStack(await Promise.all(clients), (client) => client.connect(), (client) => client.connected);
        this.#ended = false;
    }
    async initialized() {
        if (!this.#available_connections) {
            return 0;
        }
        return await this.#available_connections.initialized();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBvb2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUN6QyxPQUFPLEVBSUwsWUFBWSxHQUNiLE1BQU0sbUNBQW1DLENBQUM7QUFDM0MsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFvRDFELE1BQU0sT0FBTyxJQUFJO0lBQ2Ysc0JBQXNCLENBQW1DO0lBQ3pELGtCQUFrQixDQUFzQjtJQUN4QyxNQUFNLEdBQUcsS0FBSyxDQUFDO0lBQ2YsS0FBSyxDQUFVO0lBR2YsTUFBTSxDQUFnQjtJQUN0QixLQUFLLENBQVM7SUFPZCxJQUFJLFNBQVM7UUFDWCxJQUFJLENBQUMsSUFBSSxDQUFDLHNCQUFzQixFQUFFO1lBQ2hDLE9BQU8sQ0FBQyxDQUFDO1NBQ1Y7UUFDRCxPQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxTQUFTLENBQUM7SUFDL0MsQ0FBQztJQU9ELElBQUksSUFBSTtRQUNOLElBQUksQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUU7WUFDaEMsT0FBTyxDQUFDLENBQUM7U0FDVjtRQUNELE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQztJQUMxQyxDQUFDO0lBRUQsWUFDRSxpQkFBK0QsRUFDL0QsSUFBWSxFQUNaLE9BQWdCLEtBQUs7UUFFckIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQzFELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBR2xCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ25DLENBQUM7SUFzQkQsS0FBSyxDQUFDLE9BQU87UUFFWCxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDZixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztTQUNsQztRQUVELE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNsQixPQUFPLElBQUksQ0FBQyxzQkFBdUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUM1QyxDQUFDO0lBNEJELEtBQUssQ0FBQyxHQUFHO1FBQ1AsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2YsTUFBTSxJQUFJLEtBQUssQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO1NBQ2xFO1FBRUQsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ2xCLE9BQU8sSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLEVBQUU7WUFDekIsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsc0JBQXVCLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDeEQsTUFBTSxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDcEI7UUFFRCxJQUFJLENBQUMsc0JBQXNCLEdBQUcsU0FBUyxDQUFDO1FBQ3hDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0lBQ3JCLENBQUM7SUFRRCxLQUFLLENBQUMsV0FBVztRQUNmLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUNoRCxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUN4QixFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQ3RCLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUU7WUFDbEIsTUFBTSxNQUFNLEdBQWUsSUFBSSxVQUFVLENBQ3ZDLElBQUksQ0FBQyxrQkFBa0IsRUFDdkIsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLHNCQUF1QixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FDaEQsQ0FBQztZQUVGLElBQUksS0FBSyxHQUFHLFdBQVcsRUFBRTtnQkFDdkIsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7YUFDeEI7WUFFRCxPQUFPLE1BQU0sQ0FBQztRQUNoQixDQUFDLENBQ0YsQ0FBQztRQUVGLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLG1CQUFtQixDQUNuRCxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQzFCLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLEVBQzVCLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUM3QixDQUFDO1FBRUYsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7SUFDdEIsQ0FBQztJQUlELEtBQUssQ0FBQyxXQUFXO1FBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsRUFBRTtZQUNoQyxPQUFPLENBQUMsQ0FBQztTQUNWO1FBRUQsT0FBTyxNQUFNLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUN6RCxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQb29sQ2xpZW50IH0gZnJvbSBcIi4vY2xpZW50LnRzXCI7XG5pbXBvcnQge1xuICBDbGllbnRDb25maWd1cmF0aW9uLFxuICBDbGllbnRPcHRpb25zLFxuICBDb25uZWN0aW9uU3RyaW5nLFxuICBjcmVhdGVQYXJhbXMsXG59IGZyb20gXCIuL2Nvbm5lY3Rpb24vY29ubmVjdGlvbl9wYXJhbXMudHNcIjtcbmltcG9ydCB7IERlZmVycmVkQWNjZXNzU3RhY2sgfSBmcm9tIFwiLi91dGlscy9kZWZlcnJlZC50c1wiO1xuXG4vKipcbiAqIENvbm5lY3Rpb24gcG9vbHMgYXJlIGEgcG93ZXJmdWwgcmVzb3VyY2UgdG8gZXhlY3V0ZSBwYXJhbGxlbCBxdWVyaWVzIGFuZFxuICogc2F2ZSB1cCB0aW1lIGluIGNvbm5lY3Rpb24gaW5pdGlhbGl6YXRpb24uIEl0IGlzIGhpZ2hseSByZWNvbW1lbmRlZCB0aGF0IGFsbFxuICogYXBwbGljYXRpb25zIHRoYXQgcmVxdWlyZSBjb25jdXJyZW50IGFjY2VzcyB1c2UgYSBwb29sIHRvIGNvbW11bmljYXRlXG4gKiB3aXRoIHRoZWlyIFBvc3RncmVTUUwgZGF0YWJhc2VcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgUG9vbCB9IGZyb20gXCIuL3Bvb2wudHNcIjtcbiAqXG4gKiBjb25zdCBwb29sID0gbmV3IFBvb2woe1xuICogICBkYXRhYmFzZTogXCJkYXRhYmFzZVwiLFxuICogICBob3N0bmFtZTogXCJob3N0bmFtZVwiLFxuICogICBwYXNzd29yZDogXCJwYXNzd29yZFwiLFxuICogICBwb3J0OiA1NDMyLFxuICogICB1c2VyOiBcInVzZXJcIixcbiAqIH0sIDEwKTsgLy8gQ3JlYXRlcyBhIHBvb2wgd2l0aCAxMCBhdmFpbGFibGUgY29ubmVjdGlvbnNcbiAqXG4gKiBjb25zdCBjbGllbnQgPSBhd2FpdCBwb29sLmNvbm5lY3QoKTtcbiAqIGF3YWl0IGNsaWVudC5xdWVyeUFycmF5YFNFTEVDVCAxYDtcbiAqIGNsaWVudC5yZWxlYXNlKCk7XG4gKiBgYGBcbiAqXG4gKiBZb3UgY2FuIGFsc28gb3B0IHRvIG5vdCBpbml0aWFsaXplIGFsbCB5b3VyIGNvbm5lY3Rpb25zIGF0IG9uY2UgYnkgcGFzc2luZyB0aGUgYGxhenlgXG4gKiBvcHRpb24gd2hlbiBpbnN0YW50aWF0aW5nIHlvdXIgcG9vbCwgdGhpcyBpcyB1c2VmdWwgdG8gcmVkdWNlIHN0YXJ0dXAgdGltZS4gSW5cbiAqIGFkZGl0aW9uIHRvIHRoaXMsIHRoZSBwb29sIHdvbid0IHN0YXJ0IHRoZSBjb25uZWN0aW9uIHVubGVzcyB0aGVyZSBpc24ndCBhbnkgYWxyZWFkeVxuICogYXZhaWxhYmxlIGNvbm5lY3Rpb25zIGluIHRoZSBwb29sXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IFBvb2wgfSBmcm9tIFwiLi9wb29sLnRzXCI7XG4gKlxuICogLy8gQ3JlYXRlcyBhIHBvb2wgd2l0aCAxMCBtYXggYXZhaWxhYmxlIGNvbm5lY3Rpb25zXG4gKiAvLyBDb25uZWN0aW9uIHdpdGggdGhlIGRhdGFiYXNlIHdvbid0IGJlIGVzdGFibGlzaGVkIHVudGlsIHRoZSB1c2VyIHJlcXVpcmVzIGl0XG4gKiBjb25zdCBwb29sID0gbmV3IFBvb2woe30sIDEwLCB0cnVlKTtcbiAqXG4gKiAvLyBDb25uZWN0aW9uIGlzIGNyZWF0ZWQgaGVyZSwgd2lsbCBiZSBhdmFpbGFibGUgZnJvbSBub3cgb25cbiAqIGNvbnN0IGNsaWVudF8xID0gYXdhaXQgcG9vbC5jb25uZWN0KCk7XG4gKiBhd2FpdCBjbGllbnRfMS5xdWVyeUFycmF5YFNFTEVDVCAxYDtcbiAqIGF3YWl0IGNsaWVudF8xLnJlbGVhc2UoKTtcbiAqXG4gKiAvLyBTYW1lIGNvbm5lY3Rpb24gYXMgYmVmb3JlLCB3aWxsIGJlIHJldXNlZCBpbnN0ZWFkIG9mIHN0YXJ0aW5nIGEgbmV3IG9uZVxuICogY29uc3QgY2xpZW50XzIgPSBhd2FpdCBwb29sLmNvbm5lY3QoKTtcbiAqIGF3YWl0IGNsaWVudF8yLnF1ZXJ5QXJyYXlgU0VMRUNUIDFgO1xuICpcbiAqIC8vIE5ldyBjb25uZWN0aW9uLCBzaW5jZSBwcmV2aW91cyBvbmUgaXMgc3RpbGwgaW4gdXNlXG4gKiAvLyBUaGVyZSB3aWxsIGJlIHR3byBvcGVuIGNvbm5lY3Rpb25zIGF2YWlsYWJsZSBmcm9tIG5vdyBvblxuICogY29uc3QgY2xpZW50XzMgPSBhd2FpdCBwb29sLmNvbm5lY3QoKTtcbiAqIGF3YWl0IGNsaWVudF8yLnJlbGVhc2UoKTtcbiAqIGF3YWl0IGNsaWVudF8zLnJlbGVhc2UoKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgUG9vbCB7XG4gICNhdmFpbGFibGVfY29ubmVjdGlvbnM/OiBEZWZlcnJlZEFjY2Vzc1N0YWNrPFBvb2xDbGllbnQ+O1xuICAjY29ubmVjdGlvbl9wYXJhbXM6IENsaWVudENvbmZpZ3VyYXRpb247XG4gICNlbmRlZCA9IGZhbHNlO1xuICAjbGF6eTogYm9vbGVhbjtcbiAgLy8gVE9ET1xuICAvLyBJbml0aWFsaXphdGlvbiBzaG91bGQgcHJvYmFibHkgaGF2ZSBhIHRpbWVvdXRcbiAgI3JlYWR5OiBQcm9taXNlPHZvaWQ+O1xuICAjc2l6ZTogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgbnVtYmVyIG9mIG9wZW4gY29ubmVjdGlvbnMgYXZhaWxhYmxlIGZvciB1c2VcbiAgICpcbiAgICogTGF6aWx5IGluaXRpYWxpemVkIHBvb2xzIHdvbid0IGhhdmUgYW55IG9wZW4gY29ubmVjdGlvbnMgYnkgZGVmYXVsdFxuICAgKi9cbiAgZ2V0IGF2YWlsYWJsZSgpOiBudW1iZXIge1xuICAgIGlmICghdGhpcy4jYXZhaWxhYmxlX2Nvbm5lY3Rpb25zKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuI2F2YWlsYWJsZV9jb25uZWN0aW9ucy5hdmFpbGFibGU7XG4gIH1cblxuICAvKipcbiAgICogVGhlIG51bWJlciBvZiB0b3RhbCBjb25uZWN0aW9ucyBvcGVuIGluIHRoZSBwb29sXG4gICAqXG4gICAqIEJvdGggYXZhaWxhYmxlIGFuZCBpbiB1c2UgY29ubmVjdGlvbnMgd2lsbCBiZSBjb3VudGVkXG4gICAqL1xuICBnZXQgc2l6ZSgpOiBudW1iZXIge1xuICAgIGlmICghdGhpcy4jYXZhaWxhYmxlX2Nvbm5lY3Rpb25zKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuI2F2YWlsYWJsZV9jb25uZWN0aW9ucy5zaXplO1xuICB9XG5cbiAgY29uc3RydWN0b3IoXG4gICAgY29ubmVjdGlvbl9wYXJhbXM6IENsaWVudE9wdGlvbnMgfCBDb25uZWN0aW9uU3RyaW5nIHwgdW5kZWZpbmVkLFxuICAgIHNpemU6IG51bWJlcixcbiAgICBsYXp5OiBib29sZWFuID0gZmFsc2UsXG4gICkge1xuICAgIHRoaXMuI2Nvbm5lY3Rpb25fcGFyYW1zID0gY3JlYXRlUGFyYW1zKGNvbm5lY3Rpb25fcGFyYW1zKTtcbiAgICB0aGlzLiNsYXp5ID0gbGF6eTtcbiAgICB0aGlzLiNzaXplID0gc2l6ZTtcblxuICAgIC8vIFRoaXMgbXVzdCBBTFdBWVMgYmUgY2FsbGVkIHRoZSBsYXN0XG4gICAgdGhpcy4jcmVhZHkgPSB0aGlzLiNpbml0aWFsaXplKCk7XG4gIH1cblxuICAvLyBUT0RPXG4gIC8vIFJlbmFtZSB0byBnZXRDbGllbnQgb3Igc2ltaWxhclxuICAvLyBUaGUgY29ubmVjdCBtZXRob2Qgc2hvdWxkIGluaXRpYWxpemUgdGhlIGNvbm5lY3Rpb25zIGluc3RlYWQgb2YgZG9pbmcgaXRcbiAgLy8gaW4gdGhlIGNvbnN0cnVjdG9yXG4gIC8qKlxuICAgKiBUaGlzIHdpbGwgcmV0dXJuIGEgbmV3IGNsaWVudCBmcm9tIHRoZSBhdmFpbGFibGUgY29ubmVjdGlvbnMgaW5cbiAgICogdGhlIHBvb2xcbiAgICpcbiAgICogSW4gdGhlIGNhc2Ugb2YgbGF6eSBpbml0aWFsaXplZCBwb29scywgYSBuZXcgY29ubmVjdGlvbiB3aWxsIGJlIGVzdGFibGlzaGVkXG4gICAqIHdpdGggdGhlIGRhdGFiYXNlIGlmIG5vIG90aGVyIGNvbm5lY3Rpb25zIGFyZSBhdmFpbGFibGVcbiAgICpcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgUG9vbCB9IGZyb20gXCIuL3Bvb2wudHNcIjtcbiAgICpcbiAgICogY29uc3QgcG9vbCA9IG5ldyBQb29sKHt9LCAxMCk7XG4gICAqIGNvbnN0IGNsaWVudCA9IGF3YWl0IHBvb2wuY29ubmVjdCgpO1xuICAgKiBhd2FpdCBjbGllbnQucXVlcnlBcnJheWBVUERBVEUgTVlfVEFCTEUgU0VUIFggPSAxYDtcbiAgICogY2xpZW50LnJlbGVhc2UoKTtcbiAgICogYGBgXG4gICAqL1xuICBhc3luYyBjb25uZWN0KCk6IFByb21pc2U8UG9vbENsaWVudD4ge1xuICAgIC8vIFJlaW5pdGlhbGl6ZSBwb29sIGlmIGl0IGhhcyBiZWVuIHRlcm1pbmF0ZWRcbiAgICBpZiAodGhpcy4jZW5kZWQpIHtcbiAgICAgIHRoaXMuI3JlYWR5ID0gdGhpcy4jaW5pdGlhbGl6ZSgpO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMuI3JlYWR5O1xuICAgIHJldHVybiB0aGlzLiNhdmFpbGFibGVfY29ubmVjdGlvbnMhLnBvcCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgd2lsbCBjbG9zZSBhbGwgb3BlbiBjb25uZWN0aW9ucyBhbmQgc2V0IGEgdGVybWluYXRlZCBzdGF0dXMgaW4gdGhlIHBvb2xcbiAgICpcbiAgICogYGBgdHNcbiAgICogaW1wb3J0IHsgUG9vbCB9IGZyb20gXCIuL3Bvb2wudHNcIjtcbiAgICpcbiAgICogY29uc3QgcG9vbCA9IG5ldyBQb29sKHt9LCAxMCk7XG4gICAqXG4gICAqIGF3YWl0IHBvb2wuZW5kKCk7XG4gICAqIGNvbnNvbGUuYXNzZXJ0KHBvb2wuYXZhaWxhYmxlID09PSAwLCBcIlRoZXJlIGFyZSBjb25uZWN0aW9ucyBhdmFpbGFibGUgYWZ0ZXIgZW5kaW5nIHRoZSBwb29sXCIpO1xuICAgKiBhd2FpdCBwb29sLmVuZCgpOyAvLyBBbiBleGNlcHRpb24gd2lsbCBiZSB0aHJvd24sIHBvb2wgZG9lc24ndCBoYXZlIGFueSBjb25uZWN0aW9ucyB0byBjbG9zZVxuICAgKiBgYGBcbiAgICpcbiAgICogSG93ZXZlciwgYSB0ZXJtaW5hdGVkIHBvb2wgY2FuIGJlIHJldXNlZCBieSB1c2luZyB0aGUgXCJjb25uZWN0XCIgbWV0aG9kLCB3aGljaFxuICAgKiB3aWxsIHJlaW5pdGlhbGl6ZSB0aGUgY29ubmVjdGlvbnMgYWNjb3JkaW5nIHRvIHRoZSBvcmlnaW5hbCBjb25maWd1cmF0aW9uIG9mIHRoZSBwb29sXG4gICAqXG4gICAqIGBgYHRzXG4gICAqIGltcG9ydCB7IFBvb2wgfSBmcm9tIFwiLi9wb29sLnRzXCI7XG4gICAqXG4gICAqIGNvbnN0IHBvb2wgPSBuZXcgUG9vbCh7fSwgMTApO1xuICAgKiBhd2FpdCBwb29sLmVuZCgpO1xuICAgKiBjb25zdCBjbGllbnQgPSBhd2FpdCBwb29sLmNvbm5lY3QoKTtcbiAgICogYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXlgU0VMRUNUIDFgOyAvLyBXb3JrcyFcbiAgICogYXdhaXQgY2xpZW50LnJlbGVhc2UoKTtcbiAgICogYGBgXG4gICAqL1xuICBhc3luYyBlbmQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuI2VuZGVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQb29sIGNvbm5lY3Rpb25zIGhhdmUgYWxyZWFkeSBiZWVuIHRlcm1pbmF0ZWRcIik7XG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy4jcmVhZHk7XG4gICAgd2hpbGUgKHRoaXMuYXZhaWxhYmxlID4gMCkge1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy4jYXZhaWxhYmxlX2Nvbm5lY3Rpb25zIS5wb3AoKTtcbiAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICB9XG5cbiAgICB0aGlzLiNhdmFpbGFibGVfY29ubmVjdGlvbnMgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy4jZW5kZWQgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemF0aW9uIHdpbGwgY3JlYXRlIGFsbCBwb29sIGNsaWVudHMgaW5zdGFuY2VzIGJ5IGRlZmF1bHRcbiAgICpcbiAgICogSWYgdGhlIHBvb2wgaXMgbGF6aWx5IGluaXRpYWxpemVkLCB0aGUgY2xpZW50cyB3aWxsIGNvbm5lY3Qgd2hlbiB0aGV5XG4gICAqIGFyZSByZXF1ZXN0ZWQgYnkgdGhlIHVzZXIsIG90aGVyd2lzZSB0aGV5IHdpbGwgYWxsIGNvbm5lY3Qgb24gaW5pdGlhbGl6YXRpb25cbiAgICovXG4gIGFzeW5jICNpbml0aWFsaXplKCkge1xuICAgIGNvbnN0IGluaXRpYWxpemVkID0gdGhpcy4jbGF6eSA/IDAgOiB0aGlzLiNzaXplO1xuICAgIGNvbnN0IGNsaWVudHMgPSBBcnJheS5mcm9tKFxuICAgICAgeyBsZW5ndGg6IHRoaXMuI3NpemUgfSxcbiAgICAgIGFzeW5jIChfZSwgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgY2xpZW50OiBQb29sQ2xpZW50ID0gbmV3IFBvb2xDbGllbnQoXG4gICAgICAgICAgdGhpcy4jY29ubmVjdGlvbl9wYXJhbXMsXG4gICAgICAgICAgKCkgPT4gdGhpcy4jYXZhaWxhYmxlX2Nvbm5lY3Rpb25zIS5wdXNoKGNsaWVudCksXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKGluZGV4IDwgaW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNsaWVudDtcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIHRoaXMuI2F2YWlsYWJsZV9jb25uZWN0aW9ucyA9IG5ldyBEZWZlcnJlZEFjY2Vzc1N0YWNrKFxuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoY2xpZW50cyksXG4gICAgICAoY2xpZW50KSA9PiBjbGllbnQuY29ubmVjdCgpLFxuICAgICAgKGNsaWVudCkgPT4gY2xpZW50LmNvbm5lY3RlZCxcbiAgICApO1xuXG4gICAgdGhpcy4jZW5kZWQgPSBmYWxzZTtcbiAgfSAvKipcbiAgICogVGhpcyB3aWxsIHJldHVybiB0aGUgbnVtYmVyIG9mIGluaXRpYWxpemVkIGNsaWVudHMgaW4gdGhlIHBvb2xcbiAgICovXG5cbiAgYXN5bmMgaW5pdGlhbGl6ZWQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAoIXRoaXMuI2F2YWlsYWJsZV9jb25uZWN0aW9ucykge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2F2YWlsYWJsZV9jb25uZWN0aW9ucy5pbml0aWFsaXplZCgpO1xuICB9XG59XG4iXX0=