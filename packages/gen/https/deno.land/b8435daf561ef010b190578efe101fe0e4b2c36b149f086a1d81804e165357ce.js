import { StringType } from "./string.ts";
export class CommandType extends StringType {
    complete(_cmd, parent) {
        return parent?.getCommands(false)
            .map((cmd) => cmd.getName()) || [];
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjE5LjIvY29tbWFuZC90eXBlcy9jb21tYW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFHekMsTUFBTSxPQUFPLFdBQVksU0FBUSxVQUFVO0lBRWxDLFFBQVEsQ0FBQyxJQUFhLEVBQUUsTUFBZ0I7UUFDN0MsT0FBTyxNQUFNLEVBQUUsV0FBVyxDQUFDLEtBQUssQ0FBQzthQUM5QixHQUFHLENBQUMsQ0FBQyxHQUFZLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNoRCxDQUFDO0NBQ0YifQ==