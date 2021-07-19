import { tty } from "../ansi/tty.ts";
import { parse } from "../keycode/key_code.ts";
import { blue, bold, dim, green, italic, red, yellow } from "./deps.ts";
import { Figures } from "./figures.ts";
export class GenericPrompt {
    static injectedValue;
    settings;
    tty = tty;
    indent;
    cursor = {
        x: 0,
        y: 0,
    };
    #value;
    #lastError;
    #isFirstRun = true;
    static inject(value) {
        GenericPrompt.injectedValue = value;
    }
    constructor(settings) {
        this.settings = {
            ...settings,
            keys: {
                submit: ["enter", "return"],
                ...(settings.keys ?? {}),
            },
        };
        this.indent = this.settings.indent ?? " ";
    }
    async prompt() {
        try {
            return await this.#execute();
        }
        finally {
            this.tty.cursorShow();
        }
    }
    clear() {
        this.tty.cursorLeft.eraseDown();
    }
    #execute = async () => {
        if (typeof GenericPrompt.injectedValue !== "undefined" && this.#lastError) {
            throw new Error(await this.error());
        }
        await this.render();
        this.#lastError = undefined;
        if (!await this.read()) {
            return this.#execute();
        }
        if (typeof this.#value === "undefined") {
            throw new Error("internal error: failed to read value");
        }
        this.clear();
        const successMessage = this.success(this.#value);
        if (successMessage) {
            console.log(successMessage);
        }
        GenericPrompt.injectedValue = undefined;
        this.tty.cursorShow();
        return this.#value;
    };
    async render() {
        const result = await Promise.all([
            this.message(),
            this.body?.(),
            this.footer(),
        ]);
        const content = result.filter(Boolean).join("\n");
        const y = content.split("\n").length - this.cursor.y - 1;
        if (!this.#isFirstRun || this.#lastError) {
            this.clear();
        }
        this.#isFirstRun = false;
        if (Deno.build.os === "windows") {
            console.log(content);
            this.tty.cursorUp();
        }
        else {
            Deno.stdout.writeSync(new TextEncoder().encode(content));
        }
        if (y) {
            this.tty.cursorUp(y);
        }
        this.tty.cursorTo(this.cursor.x);
    }
    async read() {
        if (typeof GenericPrompt.injectedValue !== "undefined") {
            const value = GenericPrompt.injectedValue;
            await this.#validateValue(value);
        }
        else {
            const events = await this.#readKey();
            if (!events.length) {
                return false;
            }
            for (const event of events) {
                await this.handleEvent(event);
            }
        }
        return typeof this.#value !== "undefined";
    }
    submit() {
        return this.#validateValue(this.getValue());
    }
    message() {
        return `${this.settings.indent}${yellow("?")} ` +
            bold(this.settings.message) + this.defaults();
    }
    defaults() {
        let defaultMessage = "";
        if (typeof this.settings.default !== "undefined") {
            defaultMessage += dim(` (${this.format(this.settings.default)})`);
        }
        return defaultMessage;
    }
    success(value) {
        return `${this.settings.indent}${yellow("?")} ` +
            bold(this.settings.message) + this.defaults() +
            " " + this.settings.pointer +
            " " + green(this.format(value));
    }
    footer() {
        return this.error() ?? this.hint();
    }
    error() {
        return this.#lastError
            ? this.settings.indent + red(bold(`${Figures.CROSS} `) + this.#lastError)
            : undefined;
    }
    hint() {
        return this.settings.hint
            ? this.settings.indent +
                italic(blue(dim(`${Figures.POINTER} `) + this.settings.hint))
            : undefined;
    }
    async handleEvent(event) {
        switch (true) {
            case event.name === "c" && event.ctrl:
                this.clear();
                this.tty.cursorShow();
                Deno.exit(0);
                return;
            case this.isKey(this.settings.keys, "submit", event):
                await this.submit();
                break;
        }
    }
    #readKey = async () => {
        const data = await this.#readChar();
        return data.length ? parse(data) : [];
    };
    #readChar = async () => {
        const buffer = new Uint8Array(8);
        const isTty = Deno.isatty(Deno.stdin.rid);
        if (isTty) {
            Deno.setRaw(Deno.stdin.rid, true, { cbreak: this.settings.cbreak === true });
        }
        const nread = await Deno.stdin.read(buffer);
        if (isTty) {
            Deno.setRaw(Deno.stdin.rid, false);
        }
        if (nread === null) {
            return buffer;
        }
        return buffer.subarray(0, nread);
    };
    #transformValue = (value) => {
        return this.settings.transform
            ? this.settings.transform(value)
            : this.transform(value);
    };
    #validateValue = async (value) => {
        if (!value && typeof this.settings.default !== "undefined") {
            this.#value = this.settings.default;
            return;
        }
        this.#value = undefined;
        this.#lastError = undefined;
        const validation = await (this.settings.validate
            ? this.settings.validate(value)
            : this.validate(value));
        if (validation === false) {
            this.#lastError = `Invalid answer.`;
        }
        else if (typeof validation === "string") {
            this.#lastError = validation;
        }
        else {
            this.#value = this.#transformValue(value);
        }
    };
    isKey(keys, name, event) {
        const keyNames = keys?.[name];
        return typeof keyNames !== "undefined" && ((typeof event.name !== "undefined" &&
            keyNames.indexOf(event.name) !== -1) ||
            (typeof event.sequence !== "undefined" &&
                keyNames.indexOf(event.sequence) !== -1));
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2dlbmVyaWNfcHJvbXB0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX2dlbmVyaWNfcHJvbXB0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUNyQyxPQUFPLEVBQVcsS0FBSyxFQUFFLE1BQU0sd0JBQXdCLENBQUM7QUFDeEQsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUN4RSxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBNEN2QyxNQUFNLE9BQWdCLGFBQWE7SUFLdkIsTUFBTSxDQUFDLGFBQWEsQ0FBc0I7SUFDakMsUUFBUSxDQUFJO0lBQ1osR0FBRyxHQUFHLEdBQUcsQ0FBQztJQUNWLE1BQU0sQ0FBUztJQUNmLE1BQU0sR0FBVztRQUNsQyxDQUFDLEVBQUUsQ0FBQztRQUNKLENBQUMsRUFBRSxDQUFDO0tBQ0wsQ0FBQztJQUNGLE1BQU0sQ0FBZ0I7SUFDdEIsVUFBVSxDQUFxQjtJQUMvQixXQUFXLEdBQUcsSUFBSSxDQUFDO0lBTVosTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFjO1FBQ2pDLGFBQWEsQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO0lBQ3RDLENBQUM7SUFFRCxZQUFzQixRQUFXO1FBQy9CLElBQUksQ0FBQyxRQUFRLEdBQUc7WUFDZCxHQUFHLFFBQVE7WUFDWCxJQUFJLEVBQUU7Z0JBQ0osTUFBTSxFQUFFLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQztnQkFDM0IsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO2FBQ3pCO1NBQ0YsQ0FBQztRQUNGLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLElBQUksR0FBRyxDQUFDO0lBQzVDLENBQUM7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