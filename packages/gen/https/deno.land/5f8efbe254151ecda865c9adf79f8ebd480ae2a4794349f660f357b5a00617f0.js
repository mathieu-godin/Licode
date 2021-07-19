import { GenericInput, } from "./_generic_input.ts";
import { blue, bold, dim, stripColor, underline } from "./deps.ts";
import { Figures } from "./figures.ts";
import { distance } from "../_utils/distance.ts";
export class GenericSuggestions extends GenericInput {
    suggestionsIndex = -1;
    suggestionsOffset = 0;
    suggestions = [];
    constructor(settings) {
        super({
            ...settings,
            keys: {
                complete: ["tab"],
                next: ["up"],
                previous: ["down"],
                nextPage: ["pageup"],
                previousPage: ["pagedown"],
                ...(settings.keys ?? {}),
            },
        });
        const suggestions = this.loadSuggestions();
        if (suggestions.length || this.settings.suggestions) {
            this.settings.suggestions = [
                ...suggestions,
                ...this.settings.suggestions ?? [],
            ].filter(uniqueSuggestions);
        }
    }
    get localStorage() {
        if (this.settings.id && "localStorage" in window) {
            try {
                return window.localStorage;
            }
            catch (_) {
            }
        }
        return null;
    }
    loadSuggestions() {
        if (this.settings.id) {
            const json = this.localStorage?.getItem(this.settings.id);
            const suggestions = json ? JSON.parse(json) : [];
            if (!Array.isArray(suggestions)) {
                return [];
            }
            return suggestions;
        }
        return [];
    }
    saveSuggestions(...suggestions) {
        if (this.settings.id) {
            this.localStorage?.setItem(this.settings.id, JSON.stringify([
                ...suggestions,
                ...this.loadSuggestions(),
            ].filter(uniqueSuggestions)));
        }
    }
    render() {
        this.match();
        return super.render();
    }
    match() {
        if (!this.settings.suggestions?.length) {
            return;
        }
        const input = this.getCurrentInputValue().toLowerCase();
        if (!input.length) {
            this.suggestions = this.settings.suggestions.slice();
        }
        else {
            this.suggestions = this.settings.suggestions
                .filter((value) => stripColor(value.toString())
                .toLowerCase()
                .startsWith(input))
                .sort((a, b) => distance((a || a).toString(), input) -
                distance((b || b).toString(), input));
        }
        this.suggestionsIndex = Math.max(this.getCurrentInputValue().trim().length === 0 ? -1 : 0, Math.min(this.suggestions.length - 1, this.suggestionsIndex));
        this.suggestionsOffset = Math.max(0, Math.min(this.suggestions.length - this.getListHeight(), this.suggestionsOffset));
    }
    input() {
        return super.input() + dim(this.getSuggestion());
    }
    getSuggestion() {
        return this.suggestions[this.suggestionsIndex]?.toString()
            .substr(this.getCurrentInputValue().length) ?? "";
    }
    body() {
        return this.getList() + this.getInfo();
    }
    getInfo() {
        if (!this.settings.info) {
            return "";
        }
        const selected = this.suggestionsIndex + 1;
        const matched = this.suggestions.length;
        const actions = [];
        if (this.settings.suggestions?.length) {
            if (this.settings.list) {
                actions.push(["Next", [Figures.ARROW_DOWN]], ["Previous", [Figures.ARROW_UP]], ["Next Page", [Figures.PAGE_DOWN]], ["Previous Page", [Figures.PAGE_UP]]);
            }
            else {
                actions.push(["Next", [Figures.ARROW_UP]], ["Previous", [Figures.ARROW_DOWN]]);
            }
            actions.push(["Complete", [Figures.TAB_RIGHT, dim(" or"), Figures.ARROW_RIGHT]]);
        }
        actions.push(["Submit", [Figures.ENTER]]);
        let info = this.settings.indent;
        if (this.settings.suggestions?.length) {
            info += (blue(Figures.INFO) + bold(` ${selected}/${matched} `));
        }
        info += actions
            .map((cur) => `${cur[0]}: ${bold(cur[1].join(" "))}`)
            .join(", ");
        return info;
    }
    getList() {
        if (!this.settings.suggestions?.length || !this.settings.list) {
            return "";
        }
        const list = [];
        const height = this.getListHeight();
        for (let i = this.suggestionsOffset; i < this.suggestionsOffset + height; i++) {
            list.push(this.getListItem(this.suggestions[i], this.suggestionsIndex === i));
        }
        if (list.length && this.settings.info) {
            list.push("");
        }
        return list.join("\n");
    }
    getListItem(value, isSelected) {
        let line = this.settings.indent ?? "";
        line += isSelected ? `${this.settings.listPointer} ` : "  ";
        if (isSelected) {
            line += underline(this.highlight(value));
        }
        else {
            line += this.highlight(value);
        }
        return line;
    }
    getListHeight(suggestions = this.suggestions) {
        return Math.min(suggestions.length, this.settings.maxRows || suggestions.length);
    }
    async handleEvent(event) {
        switch (true) {
            case this.isKey(this.settings.keys, "next", event):
                if (this.settings.list) {
                    this.selectPreviousSuggestion();
                }
                else {
                    this.selectNextSuggestion();
                }
                break;
            case this.isKey(this.settings.keys, "previous", event):
                if (this.settings.list) {
                    this.selectNextSuggestion();
                }
                else {
                    this.selectPreviousSuggestion();
                }
                break;
            case this.isKey(this.settings.keys, "nextPage", event):
                if (this.settings.list) {
                    this.selectPreviousSuggestionsPage();
                }
                else {
                    this.selectNextSuggestionsPage();
                }
                break;
            case this.isKey(this.settings.keys, "previousPage", event):
                if (this.settings.list) {
                    this.selectNextSuggestionsPage();
                }
                else {
                    this.selectPreviousSuggestionsPage();
                }
                break;
            case this.isKey(this.settings.keys, "complete", event):
                this.complete();
                break;
            case this.isKey(this.settings.keys, "moveCursorRight", event):
                if (this.inputIndex < this.inputValue.length) {
                    this.moveCursorRight();
                }
                else {
                    this.complete();
                }
                break;
            default:
                await super.handleEvent(event);
        }
    }
    deleteCharRight() {
        if (this.inputIndex < this.inputValue.length) {
            super.deleteCharRight();
            if (!this.getCurrentInputValue().length) {
                this.suggestionsIndex = -1;
                this.suggestionsOffset = 0;
            }
        }
    }
    complete() {
        if (this.suggestions.length && this.suggestions[this.suggestionsIndex]) {
            this.inputValue = this.suggestions[this.suggestionsIndex].toString();
            this.inputIndex = this.inputValue.length;
            this.suggestionsIndex = 0;
            this.suggestionsOffset = 0;
        }
    }
    selectPreviousSuggestion() {
        if (this.suggestions?.length) {
            if (this.suggestionsIndex > -1) {
                this.suggestionsIndex--;
                if (this.suggestionsIndex < this.suggestionsOffset) {
                    this.suggestionsOffset--;
                }
            }
        }
    }
    selectNextSuggestion() {
        if (this.suggestions?.length) {
            if (this.suggestionsIndex < this.suggestions.length - 1) {
                this.suggestionsIndex++;
                if (this.suggestionsIndex >=
                    this.suggestionsOffset + this.getListHeight()) {
                    this.suggestionsOffset++;
                }
            }
        }
    }
    selectPreviousSuggestionsPage() {
        if (this.suggestions?.length) {
            const height = this.getListHeight();
            if (this.suggestionsOffset >= height) {
                this.suggestionsIndex -= height;
                this.suggestionsOffset -= height;
            }
            else if (this.suggestionsOffset > 0) {
                this.suggestionsIndex -= this.suggestionsOffset;
                this.suggestionsOffset = 0;
            }
        }
    }
    selectNextSuggestionsPage() {
        if (this.suggestions?.length) {
            const height = this.getListHeight();
            if (this.suggestionsOffset + height + height < this.suggestions.length) {
                this.suggestionsIndex += height;
                this.suggestionsOffset += height;
            }
            else if (this.suggestionsOffset + height < this.suggestions.length) {
                const offset = this.suggestions.length - height;
                this.suggestionsIndex += offset - this.suggestionsOffset;
                this.suggestionsOffset = offset;
            }
        }
    }
}
function uniqueSuggestions(value, index, self) {
    return typeof value !== "undefined" && value !== "" &&
        self.indexOf(value) === index;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2dlbmVyaWNfc3VnZ2VzdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJfZ2VuZXJpY19zdWdnZXN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQ0wsWUFBWSxHQUliLE1BQU0scUJBQXFCLENBQUM7QUFDN0IsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDbkUsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUN2QyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUEwQ2pELE1BQU0sT0FBZ0Isa0JBSXBCLFNBQVEsWUFBcUI7SUFDbkIsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDdEIsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCLFdBQVcsR0FBMkIsRUFBRSxDQUFDO0lBTW5ELFlBQXNCLFFBQVc7UUFDL0IsS0FBSyxDQUFDO1lBQ0osR0FBRyxRQUFRO1lBQ1gsSUFBSSxFQUFFO2dCQUNKLFFBQVEsRUFBRSxDQUFDLEtBQUssQ0FBQztnQkFDakIsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDO2dCQUNaLFFBQVEsRUFBRSxDQUFDLE1BQU0sQ0FBQztnQkFDbEIsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDO2dCQUNwQixZQUFZLEVBQUUsQ0FBQyxVQUFVLENBQUM7Z0JBQzFCLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQzthQUN6QjtTQUNGLENBQUMsQ0FBQztRQUNILE1BQU0sV0FBVyxHQUEyQixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDbkUsSUFBSSxXQUFXLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFO1lBQ25ELElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxHQUFHO2dCQUMxQixHQUFHLFdB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