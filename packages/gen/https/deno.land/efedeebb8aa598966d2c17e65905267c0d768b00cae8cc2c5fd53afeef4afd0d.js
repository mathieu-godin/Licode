import { GenericPrompt } from "./_generic_prompt.ts";
import { blue, underline } from "./deps.ts";
import { Figures } from "./figures.ts";
import { GenericInput, } from "./_generic_input.ts";
export class Secret extends GenericInput {
    static prompt(options) {
        if (typeof options === "string") {
            options = { message: options };
        }
        return new this({
            pointer: blue(Figures.POINTER_SMALL),
            indent: " ",
            label: "Password",
            hidden: false,
            minLength: 0,
            maxLength: Infinity,
            ...options,
        }).prompt();
    }
    static inject(value) {
        GenericPrompt.inject(value);
    }
    input() {
        return underline(this.settings.hidden ? "" : "*".repeat(this.inputValue.length));
    }
    read() {
        if (this.settings.hidden) {
            this.tty.cursorHide();
        }
        return super.read();
    }
    validate(value) {
        if (typeof value !== "string") {
            return false;
        }
        if (value.length < this.settings.minLength) {
            return `${this.settings.label} must be longer then ${this.settings.minLength} but has a length of ${value.length}.`;
        }
        if (value.length > this.settings.maxLength) {
            return `${this.settings.label} can't be longer then ${this.settings.maxLength} but has a length of ${value.length}.`;
        }
        return true;
    }
    transform(value) {
        return value;
    }
    format(value) {
        return this.settings.hidden ? "*".repeat(8) : "*".repeat(value.length);
    }
    getValue() {
        return this.inputValue;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjcmV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2VjcmV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUNyRCxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUM1QyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBQ3ZDLE9BQU8sRUFDTCxZQUFZLEdBSWIsTUFBTSxxQkFBcUIsQ0FBQztBQXlCN0IsTUFBTSxPQUFPLE1BQU8sU0FBUSxZQUE0QztJQUUvRCxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQStCO1FBQ2xELElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFO1lBQy9CLE9BQU8sR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQztTQUNoQztRQUVELE9BQU8sSUFBSSxJQUFJLENBQUM7WUFDZCxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUM7WUFDcEMsTUFBTSxFQUFFLEdBQUc7WUFDWCxLQUFLLEVBQUUsVUFBVTtZQUNqQixNQUFNLEVBQUUsS0FBSztZQUNiLFNBQVMsRUFBRSxDQUFDO1lBQ1osU0FBUyxFQUFFLFFBQVE7WUFDbkIsR0FBRyxPQUFPO1NBQ1gsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ2QsQ0FBQztJQU1NLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBYTtRQUNoQyxhQUFhLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFUyxLQUFLO1FBQ2IsT0FBTyxTQUFTLENBQ2QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUMvRCxDQUFDO0lBQ0osQ0FBQztJQUdTLElBQUk7UUFDWixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFO1lBQ3hCLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUM7U0FDdkI7UUFDRCxPQUFPLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBT1MsUUFBUSxDQUFDLEtBQWE7UUFDOUIsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7WUFDN0IsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUNELElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRTtZQUMxQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLHdCQUF3QixJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsd0JBQXdCLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQztTQUNySDtRQUNELElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRTtZQUMxQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLHlCQUF5QixJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsd0JBQXdCLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQztTQUN0SDtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQU9TLFNBQVMsQ0FBQyxLQUFhO1FBQy9CLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQU1TLE1BQU0sQ0FBQyxLQUFhO1FBQzVCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3pFLENBQUM7SUFHUyxRQUFRO1FBQ2hCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztJQUN6QixDQUFDO0NBQ0YifQ==