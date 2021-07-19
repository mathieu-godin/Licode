import { blue, dim, green, red } from "./deps.ts";
import { Figures } from "./figures.ts";
import { GenericList, } from "./_generic_list.ts";
import { GenericPrompt } from "./_generic_prompt.ts";
export class Checkbox extends GenericList {
    static inject(value) {
        GenericPrompt.inject(value);
    }
    static prompt(options) {
        return new this({
            pointer: blue(Figures.POINTER_SMALL),
            indent: " ",
            listPointer: blue(Figures.POINTER),
            maxRows: 10,
            searchLabel: blue(Figures.SEARCH),
            minOptions: 0,
            maxOptions: Infinity,
            check: green(Figures.TICK),
            uncheck: red(Figures.CROSS),
            ...options,
            keys: {
                check: ["space"],
                ...(options.keys ?? {}),
            },
            options: Checkbox.mapOptions(options),
        }).prompt();
    }
    static separator(label) {
        return {
            ...super.separator(label),
            icon: false,
        };
    }
    static mapOptions(options) {
        return options.options
            .map((item) => typeof item === "string" ? { value: item } : item)
            .map((item) => ({
            ...this.mapOption(item),
            checked: typeof item.checked === "undefined" && options.default &&
                options.default.indexOf(item.value) !== -1
                ? true
                : !!item.checked,
            icon: typeof item.icon === "undefined" ? true : item.icon,
        }));
    }
    getListItem(item, isSelected) {
        let line = this.settings.indent;
        line += isSelected ? this.settings.listPointer + " " : "  ";
        if (item.icon) {
            let check = item.checked
                ? this.settings.check + " "
                : this.settings.uncheck + " ";
            if (item.disabled) {
                check = dim(check);
            }
            line += check;
        }
        else {
            line += "  ";
        }
        line += `${isSelected
            ? this.highlight(item.name, (val) => val)
            : this.highlight(item.name)}`;
        return line;
    }
    getValue() {
        return this.settings.options
            .filter((item) => item.checked)
            .map((item) => item.value);
    }
    async handleEvent(event) {
        switch (true) {
            case this.isKey(this.settings.keys, "check", event):
                this.checkValue();
                break;
            default:
                await super.handleEvent(event);
        }
    }
    checkValue() {
        const item = this.options[this.listIndex];
        item.checked = !item.checked;
    }
    validate(value) {
        const isValidValue = Array.isArray(value) &&
            value.every((val) => typeof val === "string" &&
                val.length > 0 &&
                this.settings.options.findIndex((option) => option.value === val) !== -1);
        if (!isValidValue) {
            return false;
        }
        if (value.length < this.settings.minOptions) {
            return `The minimum number of options is ${this.settings.minOptions} but got ${value.length}.`;
        }
        if (value.length > this.settings.maxOptions) {
            return `The maximum number of options is ${this.settings.maxOptions} but got ${value.length}.`;
        }
        return true;
    }
    transform(value) {
        return value.map((val) => val.trim());
    }
    format(value) {
        return value.map((val) => this.getOptionByValue(val)?.name ?? val)
            .join(", ");
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlY2tib3guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJodHRwczovL2Rlbm8ubGFuZC94L2NsaWZmeUB2MC4xOS4yL3Byb21wdC9jaGVja2JveC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQ2xELE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDdkMsT0FBTyxFQUNMLFdBQVcsR0FNWixNQUFNLG9CQUFvQixDQUFDO0FBQzVCLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQThDckQsTUFBTSxPQUFPLFFBQ1gsU0FBUSxXQUFpRDtJQUtsRCxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQWU7UUFDbEMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBR00sTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUF3QjtRQUMzQyxPQUFPLElBQUksSUFBSSxDQUFDO1lBQ2QsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDO1lBQ3BDLE1BQU0sRUFBRSxHQUFHO1lBQ1gsV0FBVyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO1lBQ2xDLE9BQU8sRUFBRSxFQUFFO1lBQ1gsV0FBVyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1lBQ2pDLFVBQVUsRUFBRSxDQUFDO1lBQ2IsVUFBVSxFQUFFLFFBQVE7WUFDcEIsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztZQUMzQixHQUFHLE9BQU87WUFDVixJQUFJLEVBQUU7Z0JBQ0osS0FBSyxFQUFFLENBQUMsT0FBTyxDQUFDO2dCQUNoQixHQUFHLENBQUMs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