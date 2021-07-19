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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJxdWVyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsTUFBTSxFQUFjLE1BQU0sYUFBYSxDQUFDO0FBQ2pELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFHckMsTUFBTSxnQkFBZ0IsR0FBRyxvQ0FBb0MsQ0FBQztBQVk5RCxNQUFNLENBQU4sSUFBWSxVQUdYO0FBSEQsV0FBWSxVQUFVO0lBQ3BCLDZDQUFLLENBQUE7SUFDTCwrQ0FBTSxDQUFBO0FBQ1IsQ0FBQyxFQUhXLFVBQVUsS0FBVixVQUFVLFFBR3JCO0FBVUQsTUFBTSxVQUFVLHFCQUFxQixDQUNuQyxRQUE4QixFQUM5QixJQUFvQixFQUVwQixXQUFjO0lBRWQsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUU7UUFDakQsT0FBTyxHQUFHLElBQUksSUFBSSxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUM7SUFDbkMsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztBQUMvQyxDQUFDO0FBMkNELE1BQU0sT0FBTyxXQUFXO0lBU0g7SUFOWixLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ2QsT0FBTyxDQUFlO0lBQ3RCLFFBQVEsQ0FBVTtJQUNsQixjQUFjLENBQWtCO0lBQ2hDLFFBQVEsR0FBb0IsRUFBRSxDQUFDO0lBRXRDLFlBQW1CLEtBQXdCO1FBQXhCLFVBQUssR0FBTCxLQUFLLENBQW1CO0lBQUcsQ0FBQztJQU0vQyxzQkFBc0IsQ0FBQyxXQUEyQjtRQUNoRCxJQUFJLENBQUMsY0FBYyxHQUFHLFdBQVcsQ0FBQztJQUNwQyxDQUFDO0lBRUQscUJBQXFCLENBQUMsVUFBa0I7UUFDdEMsTUFBTSxLQUFLLEdBQUcs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