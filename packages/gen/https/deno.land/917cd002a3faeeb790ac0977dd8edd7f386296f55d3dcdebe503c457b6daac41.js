import { encode } from "./encode.ts";
import { decode } from "./decode.ts";
const commandTagRegexp = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/;
export var ResultType;
(function (ResultType) {
    ResultType[ResultType["ARRAY"] = 0] = "ARRAY";
    ResultType[ResultType["OBJECT"] = 1] = "OBJECT";
})(ResultType || (ResultType = {}));
export function templateStringToQuery(template, args, result_type) {
    const text = template.reduce((curr, next, index) => {
        return `${curr}$${index}${next}`;
    });
    return new Query(text, result_type, ...args);
}
export class QueryResult {
    query;
    _done = false;
    command;
    rowCount;
    rowDescription;
    warnings = [];
    constructor(query) {
        this.query = query;
    }
    loadColumnDescriptions(description) {
        this.rowDescription = description;
    }
    handleCommandComplete(commandTag) {
        const match = commandTagRegexp.exec(commandTag);
        if (match) {
            this.command = match[1];
            if (match[3]) {
                this.rowCount = parseInt(match[3], 10);
            }
            else {
                this.rowCount = parseInt(match[2], 10);
            }
        }
    }
    insertRow(_row) {
        throw new Error("No implementation for insertRow is defined");
    }
    done() {
        this._done = true;
    }
}
export class QueryArrayResult extends QueryResult {
    rows = [];
    insertRow(row_data) {
        if (this._done) {
            throw new Error("Tried to add a new row to the result after the result is done reading");
        }
        if (!this.rowDescription) {
            throw new Error("The row descriptions required to parse the result data weren't initialized");
        }
        const row = row_data.map((raw_value, index) => {
            const column = this.rowDescription.columns[index];
            if (raw_value === null) {
                return null;
            }
            return decode(raw_value, column);
        });
        this.rows.push(row);
    }
}
export class QueryObjectResult extends QueryResult {
    rows = [];
    insertRow(row_data) {
        if (this._done) {
            throw new Error("Tried to add a new row to the result after the result is done reading");
        }
        if (!this.rowDescription) {
            throw new Error("The row descriptions required to parse the result data weren't initialized");
        }
        if (this.query.fields &&
            this.rowDescription.columns.length !== this.query.fields.length) {
            throw new RangeError("The fields provided for the query don't match the ones returned as a result " +
                `(${this.rowDescription.columns.length} expected, ${this.query.fields.length} received)`);
        }
        const row = row_data.reduce((row, raw_value, index) => {
            const column = this.rowDescription.columns[index];
            const name = this.query.fields?.[index] ?? column.name;
            if (raw_value === null) {
                row[name] = null;
            }
            else {
                row[name] = decode(raw_value, column);
            }
            return row;
        }, {});
        this.rows.push(row);
    }
}
export class Query {
    args;
    fields;
    result_type;
    text;
    constructor(config_or_text, result_type, ...args) {
        this.result_type = result_type;
        let config;
        if (typeof config_or_text === "string") {
            config = { text: config_or_text, args };
        }
        else {
            const { fields, ...query_config } = config_or_text;
            if (fields) {
                const clean_fields = fields.map((field) => field.toString().toLowerCase());
                if ((new Set(clean_fields)).size !== clean_fields.length) {
                    throw new TypeError("The fields provided for the query must be unique");
                }
                this.fields = clean_fields;
            }
            config = query_config;
        }
        this.text = config.text;
        this.args = this._prepareArgs(config);
    }
    _prepareArgs(config) {
        const encodingFn = config.encoder ? config.encoder : encode;
        return (config.args || []).map(encodingFn);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJodHRwczovL2Rlbm8ubGFuZC94L3Bvc3RncmVzQHYwLjExLjIvcXVlcnkvcXVlcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLE1BQU0sRUFBYyxNQUFNLGFBQWEsQ0FBQztBQUNqRCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBR3JDLE1BQU0sZ0JBQWdCLEdBQUcsb0NBQW9DLENBQUM7QUFZOUQsTUFBTSxDQUFOLElBQVksVUFHWDtBQUhELFdBQVksVUFBVTtJQUNwQiw2Q0FBSyxDQUFBO0lBQ0wsK0NBQU0sQ0FBQTtBQUNSLENBQUMsRUFIVyxVQUFVLEtBQVYsVUFBVSxRQUdyQjtBQVVELE1BQU0sVUFBVSxxQkFBcUIsQ0FDbkMsUUFBOEIsRUFDOUIsSUFBb0IsRUFFcEIsV0FBYztJQUVkLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO1FBQ2pELE9BQU8sR0FBRyxJQUFJLElBQUksS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDO0lBQ25DLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDL0MsQ0FBQztBQTJDRCxNQUFNLE9BQU8sV0FBVztJQVNIO0lBTlosS0FBSyxHQUFHLEtBQUssQ0FBQztJQUNkLE9BQU8sQ0FBZTtJQUN0QixRQUFRLENBQVU7SUFDbEIsY0FBYyxDQUFrQjtJQUNoQyxRQUFRLEdBQW9CLEVBQUUsQ0FBQztJQUV0QyxZQUFtQixLQUF3QjtRQUF4QixVQUFLLEdBQUwsS0FBSyxDQUFtQjtJQUFHLENBQUM7SUFNL0Msc0JBQXNCLENBQUMsV0FBMkI7UUFDaEQsSUFBSSxDQUFDLGNBQWMsR0FBRyxXQUFXLENBQUM7SUFDcEMsQ0FBQztJ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