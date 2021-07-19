import { GenericPrompt } from "./_generic_prompt.ts";
import { GenericSuggestions, } from "./_generic_suggestions.ts";
import { blue } from "./deps.ts";
import { Figures } from "./figures.ts";
export class Input extends GenericSuggestions {
    static prompt(options) {
        if (typeof options === "string") {
            options = { message: options };
        }
        return new this({
            pointer: blue(Figures.POINTER_SMALL),
            indent: " ",
            listPointer: blue(Figures.POINTER),
            maxRows: 8,
            minLength: 0,
            maxLength: Infinity,
            ...options,
        }).prompt();
    }
    static inject(value) {
        GenericPrompt.inject(value);
    }
    success(value) {
        this.saveSuggestions(value);
        return super.success(value);
    }
    getValue() {
        return this.inputValue;
    }
    validate(value) {
        if (typeof value !== "string") {
            return false;
        }
        if (value.length < this.settings.minLength) {
            return `Value must be longer then ${this.settings.minLength} but has a length of ${value.length}.`;
        }
        if (value.length > this.settings.maxLength) {
            return `Value can't be longer then ${this.settings.maxLength} but has a length of ${value.length}.`;
        }
        return true;
    }
    transform(value) {
        return value.trim();
    }
    format(value) {
        return value;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDckQsT0FBTyxFQUNMLGtCQUFrQixHQUluQixNQUFNLDJCQUEyQixDQUFDO0FBQ25DLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDakMsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLGNBQWMsQ0FBQztBQW9CdkMsTUFBTSxPQUFPLEtBQU0sU0FBUSxrQkFBaUQ7SUFFbkUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUE4QjtRQUNqRCxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRTtZQUMvQixPQUFPLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUM7U0FDaEM7UUFFRCxPQUFPLElBQUksSUFBSSxDQUFDO1lBQ2QsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDO1lBQ3BDLE1BQU0sRUFBRSxHQUFHO1lBQ1gsV0FBVyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO1lBQ2xDLE9BQU8sRUFBRSxDQUFDO1lBQ1YsU0FBUyxFQUFFLENBQUM7WUFDWixTQUFTLEVBQUUsUUFBUTtZQUNuQixHQUFHLE9BQU87U0FDWCxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDZCxDQUFDO0lBTU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFhO1FBQ2hDLGFBQWEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUVTLE9BQU8sQ0FBQyxLQUFhO1FBQzdCLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUIsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFHUyxRQUFRO1FBQ2hCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztJQUN6QixDQUFDO0lBT1MsUUFBUSxDQUFDLEtBQWE7UUFDOUIsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7WUFDN0IsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUNELElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRTtZQUMxQyxPQUFPLDZCQUE2QixJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsd0JBQXdCLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQztTQUNwRztRQUNELElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRTtZQUMxQyxPQUFPLDhCQUE4QixJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsd0JBQXdCLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQztTQUNyRztRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQU9TLFNBQVMsQ0FBQyxLQUFhO1FBQy9CLE9BQU8sS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ3RCLENBQUM7SUFNUyxNQUFNLENBQUMsS0FBYTtRQUM1QixPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7Q0FDRiJ9