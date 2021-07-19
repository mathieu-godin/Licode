import { GenericPrompt } from "./_generic_prompt.ts";
import { GenericSuggestions, } from "./_generic_suggestions.ts";
import { blue, dim } from "./deps.ts";
import { Figures } from "./figures.ts";
export class Confirm extends GenericSuggestions {
    static prompt(options) {
        if (typeof options === "string") {
            options = { message: options };
        }
        return new this({
            pointer: blue(Figures.POINTER_SMALL),
            indent: " ",
            listPointer: blue(Figures.POINTER),
            maxRows: 8,
            active: "Yes",
            inactive: "No",
            ...options,
            suggestions: [
                options.active ?? "Yes",
                options.inactive ?? "No",
            ],
            list: false,
            info: false,
        }).prompt();
    }
    static inject(value) {
        GenericPrompt.inject(value);
    }
    defaults() {
        let defaultMessage = "";
        if (this.settings.default === true) {
            defaultMessage += this.settings.active[0].toUpperCase() + "/" +
                this.settings.inactive[0].toLowerCase();
        }
        else if (this.settings.default === false) {
            defaultMessage += this.settings.active[0].toLowerCase() + "/" +
                this.settings.inactive[0].toUpperCase();
        }
        else {
            defaultMessage += this.settings.active[0].toLowerCase() + "/" +
                this.settings.inactive[0].toLowerCase();
        }
        return defaultMessage ? dim(` (${defaultMessage})`) : "";
    }
    success(value) {
        this.saveSuggestions(this.format(value));
        return super.success(value);
    }
    getValue() {
        return this.inputValue;
    }
    validate(value) {
        return typeof value === "string" &&
            [
                this.settings.active[0].toLowerCase(),
                this.settings.active.toLowerCase(),
                this.settings.inactive[0].toLowerCase(),
                this.settings.inactive.toLowerCase(),
            ].indexOf(value.toLowerCase()) !== -1;
    }
    transform(value) {
        switch (value.toLowerCase()) {
            case this.settings.active[0].toLowerCase():
            case this.settings.active.toLowerCase():
                return true;
            case this.settings.inactive[0].toLowerCase():
            case this.settings.inactive.toLowerCase():
                return false;
        }
        return;
    }
    format(value) {
        return value ? this.settings.active : this.settings.inactive;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlybS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbmZpcm0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQ3JELE9BQU8sRUFDTCxrQkFBa0IsR0FJbkIsTUFBTSwyQkFBMkIsQ0FBQztBQUNuQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUN0QyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBdUJ2QyxNQUFNLE9BQU8sT0FDWCxTQUFRLGtCQUFvRDtJQUVyRCxNQUFNLENBQUMsTUFBTSxDQUNsQixPQUFnQztRQUVoQyxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRTtZQUMvQixPQUFPLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUM7U0FDaEM7UUFFRCxPQUFPLElBQUksSUFBSSxDQUFDO1lBQ2QsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDO1lBQ3BDLE1BQU0sRUFBRSxHQUFHO1lBQ1gsV0FBVyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO1lBQ2xDLE9BQU8sRUFBRSxDQUFDO1lBQ1YsTUFBTSxFQUFFLEtBQUs7WUFDYixRQUFRLEVBQUUsSUFBSTtZQUNkLEdBQUcsT0FBTztZQUNWLFdBQVcsRUFBRTtnQkFDWCxPQUFPLENBQUMsTUFBTSxJQUFJLEtBQUs7Z0JBQ3ZCLE9BQU8sQ0FBQyxRQUFRLElBQUksSUFBSTthQUN6QjtZQUNELElBQUksRUFBRSxLQUFLO1lBQ1gsSUFBSSxFQUFFLEtBQUs7U0FDWixDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDZCxDQUFDO0lBTU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFhO1FBQ2hDLGFBQWEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUVTLFFBQVE7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