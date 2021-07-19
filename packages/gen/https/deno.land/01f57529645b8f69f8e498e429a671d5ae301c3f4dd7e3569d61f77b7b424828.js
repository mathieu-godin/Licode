export class ConnnectionError extends Error {
    constructor(msg) {
        super(msg);
    }
}
export class WriteError extends ConnnectionError {
    constructor(msg) {
        super(msg);
    }
}
export class ReadError extends ConnnectionError {
    constructor(msg) {
        super(msg);
    }
}
export class ResponseTimeoutError extends ConnnectionError {
    constructor(msg) {
        super(msg);
    }
}
export class ProtocolError extends ConnnectionError {
    constructor(msg) {
        super(msg);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXJyb3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sT0FBTyxnQkFBaUIsU0FBUSxLQUFLO0lBQ3pDLFlBQVksR0FBWTtRQUN0QixLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDYixDQUFDO0NBQ0Y7QUFFRCxNQUFNLE9BQU8sVUFBVyxTQUFRLGdCQUFnQjtJQUM5QyxZQUFZLEdBQVk7UUFDdEIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2IsQ0FBQztDQUNGO0FBRUQsTUFBTSxPQUFPLFNBQVUsU0FBUSxnQkFBZ0I7SUFDN0MsWUFBWSxHQUFZO1FBQ3RCLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNiLENBQUM7Q0FDRjtBQUVELE1BQU0sT0FBTyxvQkFBcUIsU0FBUSxnQkFBZ0I7SUFDeEQsWUFBWSxHQUFZO1FBQ3RCLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNiLENBQUM7Q0FDRjtBQUVELE1BQU0sT0FBTyxhQUFjLFNBQVEsZ0JBQWdCO0lBQ2pELFlBQVksR0FBWTtRQUN0QixLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDYixDQUFDO0NBQ0YifQ==