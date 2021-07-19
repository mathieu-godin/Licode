import { DeferredStack } from "./deferred.ts";
import { Connection } from "./connection.ts";
import { log } from "./logger.ts";
export class PoolConnection extends Connection {
    _pool = undefined;
    _idleTimer = undefined;
    _idle = false;
    enterIdle() {
        this._idle = true;
        if (this.config.idleTimeout) {
            this._idleTimer = setTimeout(() => {
                log.info("connection idle timeout");
                this._pool.remove(this);
                try {
                    this.close();
                }
                catch (error) {
                    log.warning(`error closing idle connection`, error);
                }
            }, this.config.idleTimeout);
        }
    }
    exitIdle() {
        this._idle = false;
        if (this._idleTimer !== undefined) {
            clearTimeout(this._idleTimer);
        }
    }
    removeFromPool() {
        this._pool.reduceSize();
        this._pool = undefined;
    }
    returnToPool() {
        this._pool?.push(this);
    }
}
export class ConnectionPool {
    _deferred;
    _connections = [];
    _closed = false;
    constructor(maxSize, creator) {
        this._deferred = new DeferredStack(maxSize, this._connections, async () => {
            const conn = await creator();
            conn._pool = this;
            return conn;
        });
    }
    get info() {
        return {
            size: this._deferred.size,
            maxSize: this._deferred.maxSize,
            available: this._deferred.available,
        };
    }
    push(conn) {
        if (this._closed) {
            conn.close();
            this.reduceSize();
        }
        if (this._deferred.push(conn)) {
            conn.enterIdle();
        }
    }
    async pop() {
        if (this._closed) {
            throw new Error("Connection pool is closed");
        }
        let conn = this._deferred.tryPopAvailable();
        if (conn) {
            conn.exitIdle();
        }
        else {
            conn = await this._deferred.pop();
        }
        return conn;
    }
    remove(conn) {
        return this._deferred.remove(conn);
    }
    close() {
        this._closed = true;
        let conn;
        while (conn = this._deferred.tryPopAvailable()) {
            conn.exitIdle();
            conn.close();
            this.reduceSize();
        }
    }
    reduceSize() {
        this._deferred.reduceSize();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbXlzcWxAdjIuOS4wL3NyYy9wb29sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDOUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQzdDLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFHbEMsTUFBTSxPQUFPLGNBQWUsU0FBUSxVQUFVO0lBQzVDLEtBQUssR0FBb0IsU0FBUyxDQUFDO0lBRTNCLFVBQVUsR0FBWSxTQUFTLENBQUM7SUFDaEMsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUt0QixTQUFTO1FBQ1AsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDbEIsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRTtZQUMzQixJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2hDLEdBQUcsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsQ0FBQztnQkFDcEMsSUFBSSxDQUFDLEtBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3pCLElBQUk7b0JBQ0YsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2lCQUNkO2dCQUFDLE9BQU8sS0FBSyxFQUFFO29CQUNkLEdBQUcsQ0FBQyxPQUFPLENBQUMsK0JBQStCLEVBQUUsS0FBSyxDQUFDLENBQUM7aUJBQ3JEO1lBQ0gsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDN0I7SUFDSCxDQUFDO0lBS0QsUUFBUTtRQUNOLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksSUFBSSxDQUFDLFVBQVUsS0FBSyxTQUFTLEVBQUU7WUFDakMsWUFBWSxDQUFDLElBQUksQ0FBQyxV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