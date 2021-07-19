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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBvb2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUM5QyxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDN0MsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUdsQyxNQUFNLE9BQU8sY0FBZSxTQUFRLFVBQVU7SUFDNUMsS0FBSyxHQUFvQixTQUFTLENBQUM7SUFFM0IsVUFBVSxHQUFZLFNBQVMsQ0FBQztJQUNoQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBS3RCLFNBQVM7UUFDUCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUNsQixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFO1lBQzNCLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRTtnQkFDaEMsR0FBRyxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO2dCQUNwQyxJQUFJLENBQUMsS0FBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDekIsSUFBSTtvQkFDRixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7aUJBQ2Q7Z0JBQUMsT0FBTyxLQUFLLEVBQUU7b0JBQ2QsR0FBRyxDQUFDLE9BQU8sQ0FBQywrQkFBK0IsRUFBRSxLQUFLLENBQUMsQ0FBQztpQkFDckQ7WUFDSCxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUM3QjtJQUNILENBQUM7SUFLRCxRQUFRO1FBQ04sSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsSUFBSSxJQUFJLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRTtZQUNqQyxZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQy9CO0lBQ0gsQ0FBQztJQUtELGNB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