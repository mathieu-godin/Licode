import { deferred } from "../deps.ts";
export class DeferredStack {
    _maxSize;
    _array;
    creator;
    _queue = [];
    _size = 0;
    constructor(_maxSize, _array = [], creator) {
        this._maxSize = _maxSize;
        this._array = _array;
        this.creator = creator;
        this._size = _array.length;
    }
    get size() {
        return this._size;
    }
    get maxSize() {
        return this._maxSize;
    }
    get available() {
        return this._array.length;
    }
    async pop() {
        if (this._array.length) {
            return this._array.pop();
        }
        else if (this._size < this._maxSize) {
            this._size++;
            let item;
            try {
                item = await this.creator();
            }
            catch (err) {
                this._size--;
                throw err;
            }
            return item;
        }
        const defer = deferred();
        this._queue.push(defer);
        return await defer;
    }
    push(item) {
        if (this._queue.length) {
            this._queue.shift().resolve(item);
            return false;
        }
        else {
            this._array.push(item);
            return true;
        }
    }
    tryPopAvailable() {
        return this._array.pop();
    }
    remove(item) {
        const index = this._array.indexOf(item);
        if (index < 0)
            return false;
        this._array.splice(index, 1);
        this._size--;
        return true;
    }
    reduceSize() {
        this._size--;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmZXJyZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkZWZlcnJlZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQVksUUFBUSxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBR2hELE1BQU0sT0FBTyxhQUFhO0lBS2I7SUFDRDtJQUNTO0lBTlgsTUFBTSxHQUFrQixFQUFFLENBQUM7SUFDM0IsS0FBSyxHQUFHLENBQUMsQ0FBQztJQUVsQixZQUNXLFFBQWdCLEVBQ2pCLFNBQWMsRUFBRSxFQUNQLE9BQXlCO1FBRmpDLGFBQVEsR0FBUixRQUFRLENBQVE7UUFDakIsV0FBTSxHQUFOLE1BQU0sQ0FBVTtRQUNQLFlBQU8sR0FBUCxPQUFPLENBQWtCO1FBRTFDLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUM3QixDQUFDO0lBRUQsSUFBSSxJQUFJO1FBQ04sT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BCLENBQUM7SUFFRCxJQUFJLE9BQU87UUFDVCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7SUFDdkIsQ0FBQztJQUVELElBQUksU0FBUztRQUNYLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDNUIsQ0FBQztJQUVELEtBQUssQ0FBQyxHQUFHO1FBQ1AsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtZQUN0QixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFHLENBQUM7U0FDM0I7YUFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNyQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDYixJQUFJLElBQU8sQ0FBQztZQUNaLElBQUk7Z0JBQ0YsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQzdCO1lBQUMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1osSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNiLE1BQU0sR0FBRyxDQUFDO2FBQ1g7WUFDRCxPQUFPLElBQUksQ0FBQztTQUNiO1FBQ0QsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFLLENBQUM7UUFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEIsT0FBTyxNQUFNLEtBQUssQ0FBQztJQUNyQixDQUFDO0lBR0QsSUFBSSxDQUFDLElBQU87UUFDVixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO1lBQ3RCLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25DLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7YUFBTTtZQUNMLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7SUFDSCxDQUFDO0lBRUQsZUFBZTtRQUNiLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBRUQsTUFBTSxDQUFDLElBQU87UUFDWixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4QyxJQUFJLEtBQUssR0FBRyxDQUFDO1lBQUUsT0FBTyxLQUFLLENBQUM7UUFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzdCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNiLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELFVBQVU7UUFDUixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDZixDQUFDO0NBQ0YifQ==