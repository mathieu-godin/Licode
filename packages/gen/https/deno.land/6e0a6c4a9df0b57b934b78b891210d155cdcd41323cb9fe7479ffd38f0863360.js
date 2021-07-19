import { GenericPrompt } from "./_generic_prompt.ts";
import { GenericSuggestions, } from "./_generic_suggestions.ts";
import { parseNumber } from "./_utils.ts";
import { blue } from "./deps.ts";
import { Figures } from "./figures.ts";
export class Number extends GenericSuggestions {
    static prompt(options) {
        if (typeof options === "string") {
            options = { message: options };
        }
        return new this({
            pointer: blue(Figures.POINTER_SMALL),
            indent: " ",
            listPointer: blue(Figures.POINTER),
            maxRows: 8,
            min: -Infinity,
            max: Infinity,
            float: false,
            round: 2,
            ...options,
            keys: {
                increaseValue: ["up", "u", "+"],
                decreaseValue: ["down", "d", "-"],
                ...(options.keys ?? {}),
            },
        }).prompt();
    }
    static inject(value) {
        GenericPrompt.inject(value);
    }
    success(value) {
        this.saveSuggestions(value);
        return super.success(value);
    }
    async handleEvent(event) {
        switch (true) {
            case this.settings.suggestions &&
                this.isKey(this.settings.keys, "next", event):
                if (this.settings.list) {
                    this.selectPreviousSuggestion();
                }
                else {
                    this.selectNextSuggestion();
                }
                break;
            case this.settings.suggestions &&
                this.isKey(this.settings.keys, "previous", event):
                if (this.settings.list) {
                    this.selectNextSuggestion();
                }
                else {
                    this.selectPreviousSuggestion();
                }
                break;
            case this.isKey(this.settings.keys, "increaseValue", event):
                this.increaseValue();
                break;
            case this.isKey(this.settings.keys, "decreaseValue", event):
                this.decreaseValue();
                break;
            default:
                await super.handleEvent(event);
        }
    }
    increaseValue() {
        this.manipulateIndex(false);
    }
    decreaseValue() {
        this.manipulateIndex(true);
    }
    manipulateIndex(decrease) {
        if (this.inputValue[this.inputIndex] === "-") {
            this.inputIndex++;
        }
        if (this.inputValue.length && (this.inputIndex > this.inputValue.length - 1)) {
            this.inputIndex--;
        }
        const decimalIndex = this.inputValue.indexOf(".");
        const [abs, dec] = this.inputValue.split(".");
        if (dec && this.inputIndex === decimalIndex) {
            this.inputIndex--;
        }
        const inDecimal = decimalIndex !== -1 &&
            this.inputIndex > decimalIndex;
        let value = (inDecimal ? dec : abs) || "0";
        const oldLength = this.inputValue.length;
        const index = inDecimal
            ? this.inputIndex - decimalIndex - 1
            : this.inputIndex;
        const increaseValue = Math.pow(10, value.length - index - 1);
        value = (parseInt(value) + (decrease ? -increaseValue : increaseValue))
            .toString();
        this.inputValue = !dec
            ? value
            : (this.inputIndex > decimalIndex ? abs + "." + value
                : value + "." + dec);
        if (this.inputValue.length > oldLength) {
            this.inputIndex++;
        }
        else if (this.inputValue.length < oldLength &&
            this.inputValue[this.inputIndex - 1] !== "-") {
            this.inputIndex--;
        }
        this.inputIndex = Math.max(0, Math.min(this.inputIndex, this.inputValue.length - 1));
    }
    addChar(char) {
        if (isNumeric(char)) {
            super.addChar(char);
        }
        else if (this.settings.float &&
            char === "." &&
            this.inputValue.indexOf(".") === -1 &&
            (this.inputValue[0] === "-" ? this.inputIndex > 1 : this.inputIndex > 0)) {
            super.addChar(char);
        }
    }
    validate(value) {
        if (!isNumeric(value)) {
            return false;
        }
        const val = parseFloat(value);
        if (val > this.settings.max) {
            return `Value must be lower or equal than ${this.settings.max}`;
        }
        if (val < this.settings.min) {
            return `Value must be greater or equal than ${this.settings.min}`;
        }
        return true;
    }
    transform(value) {
        const val = parseFloat(value);
        if (this.settings.float) {
            return parseFloat(val.toFixed(this.settings.round));
        }
        return val;
    }
    format(value) {
        return value.toString();
    }
    getValue() {
        return this.inputValue;
    }
}
function isNumeric(value) {
    return typeof value === "number" || (!!value && !isNaN(parseNumber(value)));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVtYmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibnVtYmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUNyRCxPQUFPLEVBQ0wsa0JBQWtCLEdBSW5CLE1BQU0sMkJBQTJCLENBQUM7QUFDbkMsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUMxQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQ2pDLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxjQUFjLENBQUM7QUE0QnZDLE1BQU0sT0FBTyxNQUFPLFNBQVEsa0JBQWtEO0lBRXJFLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBK0I7UUFDbEQsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLEVBQUU7WUFDL0IsT0FBTyxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDO1NBQ2hDO1FBRUQsT0FBTyxJQUFJLElBQUksQ0FBQztZQUNkLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQztZQUNwQyxNQUFNLEVBQUUsR0FBRztZQUNYLFdBQVcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztZQUNsQyxPQUFPLEVBQUUsQ0FBQztZQUNWLEdBQUcsRUFBRSxDQUFDLFFBQVE7WUFDZCxHQUFHLEVBQUUsUUFBUTtZQUNiLEtBQUssRUFBRSxLQUFLO1lBQ1osS0FBSyxFQUFFLENBQUM7WUFDUixHQUFHLE9BQU87WUFDVixJQUFJLEVBQUU7Z0JBQ0osYUFBYSxFQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUM7Z0JBQy9CLGFBQWEsRUFBRSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDO2dCQUNqQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7YUFDeEI7U0FDRixDQUFDLENB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