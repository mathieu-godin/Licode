export class PostgresError extends Error {
    fields;
    constructor(fields) {
        super(fields.message);
        this.fields = fields;
        this.name = "PostgresError";
    }
}
export class TransactionError extends Error {
    cause;
    constructor(transaction_name, cause) {
        super(`The transaction "${transaction_name}" has been aborted due to \`${cause}\`. Check the "cause" property to get more details`);
        this.cause = cause;
    }
}
export function parseError(msg) {
    return new PostgresError(parseWarning(msg));
}
export function parseNotice(msg) {
    return parseWarning(msg);
}
function parseWarning(msg) {
    const errorFields = {};
    let byte;
    let char;
    let errorMsg;
    while ((byte = msg.reader.readByte())) {
        char = String.fromCharCode(byte);
        errorMsg = msg.reader.readCString();
        switch (char) {
            case "S":
                errorFields.severity = errorMsg;
                break;
            case "C":
                errorFields.code = errorMsg;
                break;
            case "M":
                errorFields.message = errorMsg;
                break;
            case "D":
                errorFields.detail = errorMsg;
                break;
            case "H":
                errorFields.hint = errorMsg;
                break;
            case "P":
                errorFields.position = errorMsg;
                break;
            case "p":
                errorFields.internalPosition = errorMsg;
                break;
            case "q":
                errorFields.internalQuery = errorMsg;
                break;
            case "W":
                errorFields.where = errorMsg;
                break;
            case "s":
                errorFields.schema = errorMsg;
                break;
            case "t":
                errorFields.table = errorMsg;
                break;
            case "c":
                errorFields.column = errorMsg;
                break;
            case "d":
                errorFields.dataTypeName = errorMsg;
                break;
            case "n":
                errorFields.constraint = errorMsg;
                break;
            case "F":
                errorFields.file = errorMsg;
                break;
            case "L":
                errorFields.line = errorMsg;
                break;
            case "R":
                errorFields.routine = errorMsg;
                break;
            default:
                break;
        }
    }
    return errorFields;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2FybmluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIndhcm5pbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBc0JBLE1BQU0sT0FBTyxhQUFjLFNBQVEsS0FBSztJQUMvQixNQUFNLENBQWdCO0lBRTdCLFlBQVksTUFBcUI7UUFDL0IsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN0QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsSUFBSSxHQUFHLGVBQWUsQ0FBQztJQUM5QixDQUFDO0NBQ0Y7QUFJRCxNQUFNLE9BQU8sZ0JBQWlCLFNBQVEsS0FBSztJQUloQztJQUhULFlBRUUsZ0JBQXdCLEVBQ2pCLEtBQW9CO1FBRTNCLEtBQUssQ0FDSCxvQkFBb0IsZ0JBQWdCLCtCQUErQixLQUFLLG9EQUFvRCxDQUM3SCxDQUFDO1FBSkssVUFBSyxHQUFMLEtBQUssQ0FBZTtJQUs3QixDQUFDO0NBQ0Y7QUFFRCxNQUFNLFVBQVUsVUFBVSxDQUFDLEdBQVk7SUFDckMsT0FBTyxJQUFJLGFBQWEsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM5QyxDQUFDO0FBRUQsTUFBTSxVQUFVLFdBQVcsQ0FBQyxHQUFZO0lBQ3RDLE9BQU8sWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLENBQUM7QUFLRCxTQUFTLFlBQVksQ0FBQyxHQUFZO0lBR2hDLE1BQU0sV0FBVyxHQUFRLEVBQUUsQ0FBQztJQUU1QixJQUFJLElBQVksQ0FBQztJQUNqQixJQUFJLElBQVksQ0FBQztJQUNqQixJQUFJLFFBQWdCLENBQUM7SUFFckIsT0FBTyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUU7UUFDckMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsUUFBUSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7UUFFcEMsUUFBUSxJQUFJLEVBQUU7WUFDWixLQUFLLEdBQUc7Z0JBQ04sV0FBVyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7Z0JBQ2hDLE1BQU07WUFDUixLQUFLLEdBQUc7Z0JBQ04sV0FBVyxDQUFDLElBQUksR0FBRyxRQUFRLENBQUM7Z0JBQzVCLE1BQU07WUFDUixLQUFLLEdBQUc7Z0JBQ04sV0FBVyxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUM7Z0JBQy9CLE1BQU07WUFDUixLQUFLLEdBQUc7Z0JBQ04sV0FBVyxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUM7Z0JBQzlCLE1BQU07WUFDUixLQUFLLEdBQUc7Z0JBQ04sV0FBVyxDQUFDLElBQUksR0FBRyxRQUFRLENBQUM7Z0JBQzVCLE1BQU07WUFDUixLQUFLLEdBQUc7Z0JBQ04sV0FBVyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7Z0JBQ2hDLE1BQU07WUFDUixLQUFLLEdBQUc7Z0JBQ04sV0FBVyxDQUFDLGdCQUFnQixHQUFHLFFBQVEsQ0FBQztnQkFDeEMsTUFBTTtZQUNSLEtBQUssR0FBRztnQkFDTixXQUFXLENBQUMsYUFBYSxHQUFHLFFBQVEsQ0FBQztnQkFDckMsTUFBTTtZQUNSLEtBQUssR0FBRztnQkFDTixXQUFXLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQztnQkFDN0IsTUFBTTtZQUNSLEtBQUssR0FBRztnQkFDTixXQUFXLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQztnQkFDOUIsTUFBTTtZQUNSLEtBQUssR0FBRztnQkFDTixXQUFXLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQztnQkFDN0IsTUFBTTtZQUNSLEtBQUssR0FBRztnQkFDTixXQUFXLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQztnQkFDOUIsTUFBTTtZQUNSLEtBQUssR0FBRztnQkFDTixXQUFXLENBQUMsWUFBWSxHQUFHLFFBQVEsQ0FBQztnQkFDcEMsTUFBTTtZQUNSLEtBQUssR0FBRztnQkFDTixXQUFXLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQztnQkFDbEMsTUFBTTtZQUNSLEtBQUssR0FBRztnQkFDTixXQUFXLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQztnQkFDNUIsTUFBTTtZQUNSLEtBQUssR0FBRztnQkFDTixXQUFXLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQztnQkFDNUIsTUFBTTtZQUNSLEtBQUssR0FBRztnQkFDTixXQUFXLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQztnQkFDL0IsTUFBTTtZQUNSO2dCQUlFLE1BQU07U0FDVDtLQUNGO0lBRUQsT0FBTyxXQUFXLENBQUM7QUFDckIsQ0FBQyJ9