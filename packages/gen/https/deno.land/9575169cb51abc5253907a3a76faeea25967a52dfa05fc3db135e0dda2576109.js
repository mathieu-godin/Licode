import { GenericPrompt } from "./_generic_prompt.ts";
import { GenericSuggestions, } from "./_generic_suggestions.ts";
import { blue, dim, underline } from "./deps.ts";
import { Figures } from "./figures.ts";
export class List extends GenericSuggestions {
    static prompt(options) {
        if (typeof options === "string") {
            options = { message: options };
        }
        return new this({
            pointer: blue(Figures.POINTER_SMALL),
            indent: " ",
            listPointer: blue(Figures.POINTER),
            maxRows: 8,
            separator: ",",
            minLength: 0,
            maxLength: Infinity,
            minTags: 0,
            maxTags: Infinity,
            ...options,
        }).prompt();
    }
    static inject(value) {
        GenericPrompt.inject(value);
    }
    input() {
        const oldInput = this.inputValue;
        const tags = this.getTags(oldInput);
        const separator = this.settings.separator + " ";
        this.inputValue = tags.join(separator);
        const diff = oldInput.length - this.inputValue.length;
        this.inputIndex -= diff;
        this.cursor.x -= diff;
        return tags
            .map((val) => underline(val))
            .join(separator) +
            dim(this.getSuggestion());
    }
    getTags(value = this.inputValue) {
        return value.trim().split(this.regexp());
    }
    regexp() {
        return new RegExp(this.settings.separator === " " ? ` +` : ` *${this.settings.separator} *`);
    }
    success(value) {
        this.saveSuggestions(...value);
        return super.success(value);
    }
    getValue() {
        return this.inputValue.replace(/,+\s*$/, "");
    }
    getCurrentInputValue() {
        return this.getTags().pop() ?? "";
    }
    addChar(char) {
        switch (char) {
            case this.settings.separator:
                if (this.inputValue.length &&
                    this.inputValue.trim().slice(-1) !== this.settings.separator) {
                    super.addChar(char);
                }
                this.suggestionsIndex = -1;
                this.suggestionsOffset = 0;
                break;
            default:
                super.addChar(char);
        }
    }
    deleteChar() {
        if (this.inputValue[this.inputIndex - 1] === " ") {
            super.deleteChar();
        }
        super.deleteChar();
    }
    complete() {
        if (this.suggestions.length && this.suggestions[this.suggestionsIndex]) {
            const tags = this.getTags().slice(0, -1);
            tags.push(this.suggestions[this.suggestionsIndex].toString());
            this.inputValue = tags.join(this.settings.separator + " ");
            this.inputIndex = this.inputValue.length;
            this.suggestionsIndex = 0;
            this.suggestionsOffset = 0;
        }
    }
    validate(value) {
        if (typeof value !== "string") {
            return false;
        }
        const values = this.transform(value);
        for (const val of values) {
            if (val.length < this.settings.minLength) {
                return `Value must be longer then ${this.settings.minLength} but has a length of ${val.length}.`;
            }
            if (val.length > this.settings.maxLength) {
                return `Value can't be longer then ${this.settings.maxLength} but has a length of ${val.length}.`;
            }
        }
        if (values.length < this.settings.minTags) {
            return `The minimum number of tags is ${this.settings.minTags} but got ${values.length}.`;
        }
        if (values.length > this.settings.maxTags) {
            return `The maximum number of tags is ${this.settings.maxTags} but got ${values.length}.`;
        }
        return true;
    }
    transform(value) {
        return this.getTags(value).filter((val) => val !== "");
    }
    format(value) {
        return value.join(`, `);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxpc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQ3JELE9BQU8sRUFDTCxrQkFBa0IsR0FJbkIsTUFBTSwyQkFBMkIsQ0FBQztBQUNuQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDakQsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLGNBQWMsQ0FBQztBQTJCdkMsTUFBTSxPQUFPLElBQUssU0FBUSxrQkFBa0Q7SUFFbkUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUE2QjtRQUNoRCxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRTtZQUMvQixPQUFPLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUM7U0FDaEM7UUFFRCxPQUFPLElBQUksSUFBSSxDQUFDO1lBQ2QsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDO1lBQ3BDLE1BQU0sRUFBRSxHQUFHO1lBQ1gsV0FBVyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO1lBQ2xDLE9BQU8sRUFBRSxDQUFDO1lBQ1YsU0FBUyxFQUFFLEdBQUc7WUFDZCxTQUFTLEVBQUUsQ0FBQztZQUNaLFNBQVMsRUFBRSxRQUFRO1lBQ25CLE9BQU8sRUFBRSxDQUFDO1lBQ1YsT0FBTyxFQUFFLFFBQVE7WUFDakIsR0FBRyxPQUFPO1NBQ1gsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ2QsQ0FBQztJQU1NLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBYTtRQUNoQyxhQUFhLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFUyxLQUFLO1FBQ2IsTUFBTSxRQUFRLEdBQVcsSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUN6QyxNQUFNLElBQUksR0FB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