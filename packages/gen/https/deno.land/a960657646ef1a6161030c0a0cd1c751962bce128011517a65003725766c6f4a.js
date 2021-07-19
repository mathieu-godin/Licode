function defaultValue(value) {
    return value;
}
export function parseArray(source, transform = defaultValue) {
    return new ArrayParser(source, transform).parse();
}
class ArrayParser {
    source;
    transform;
    position = 0;
    entries = [];
    recorded = [];
    dimension = 0;
    constructor(source, transform) {
        this.source = source;
        this.transform = transform;
    }
    isEof() {
        return this.position >= this.source.length;
    }
    nextCharacter() {
        const character = this.source[this.position++];
        if (character === "\\") {
            return {
                value: this.source[this.position++],
                escaped: true,
            };
        }
        return {
            value: character,
            escaped: false,
        };
    }
    record(character) {
        this.recorded.push(character);
    }
    newEntry(includeEmpty = false) {
        let entry;
        if (this.recorded.length > 0 || includeEmpty) {
            entry = this.recorded.join("");
            if (entry === "NULL" && !includeEmpty) {
                entry = null;
            }
            if (entry !== null)
                entry = this.transform(entry);
            this.entries.push(entry);
            this.recorded = [];
        }
    }
    consumeDimensions() {
        if (this.source[0] === "[") {
            while (!this.isEof()) {
                const char = this.nextCharacter();
                if (char.value === "=")
                    break;
            }
        }
    }
    getSeparator() {
        if (/;(?![^(]*\))/.test(this.source.substr(1, this.source.length - 1))) {
            return ";";
        }
        return ",";
    }
    parse(nested = false) {
        const separator = this.getSeparator();
        let character, parser, quote;
        this.consumeDimensions();
        while (!this.isEof()) {
            character = this.nextCharacter();
            if (character.value === "{" && !quote) {
                this.dimension++;
                if (this.dimension > 1) {
                    parser = new ArrayParser(this.source.substr(this.position - 1), this.transform);
                    this.entries.push(parser.parse(true));
                    this.position += parser.position - 2;
                }
            }
            else if (character.value === "}" && !quote) {
                this.dimension--;
                if (!this.dimension) {
                    this.newEntry();
                    if (nested)
                        return this.entries;
                }
            }
            else if (character.value === '"' && !character.escaped) {
                if (quote)
                    this.newEntry(true);
                quote = !quote;
            }
            else if (character.value === separator && !quote) {
                this.newEntry();
            }
            else {
                this.record(character.value);
            }
        }
        if (this.dimension !== 0) {
            throw new Error("array dimension not balanced");
        }
        return this.entries;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXlfcGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cHM6Ly9kZW5vLmxhbmQveC9wb3N0Z3Jlc0B2MC4xMS4yL3F1ZXJ5L2FycmF5X3BhcnNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFPQSxTQUFTLFlBQVksQ0FBQyxLQUFhO0lBQ2pDLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQU9ELE1BQU0sVUFBVSxVQUFVLENBQUMsTUFBYyxFQUFFLFNBQVMsR0FBRyxZQUFZO0lBQ2pFLE9BQU8sSUFBSSxXQUFXLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ3BELENBQUM7QUFFRCxNQUFNLFdBQVc7SUFPTjtJQUNBO0lBUFQsUUFBUSxHQUFHLENBQUMsQ0FBQztJQUNiLE9BQU8sR0FBbUIsRUFBRSxDQUFDO0lBQzdCLFFBQVEsR0FBYSxFQUFFLENBQUM7SUFDeEIsU0FBUyxHQUFHLENBQUMsQ0FBQztJQUVkLFlBQ1MsTUFBYyxFQUNkLFNBQXlCO1FBRHpCLFdBQU0sR0FBTixNQUFNLENBQVE7UUFDZCxjQUFTLEdBQVQsU0FBUyxDQUFnQjtJQUMvQixDQUFDO0lBRUosS0FBSztRQUNILE9BQU8sSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUM3QyxDQUFDO0lBRUQsYUFBYTtRQUNYLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDL0MsSUFBSSxTQUFTLEtBQUssSUFBSSxFQUFFO1lBQ3RCLE9BQU87Z0JBQ0wsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNuQyxPQUFPLEVBQUUsSUFBSTthQUNkLENBQUM7U0FDSDtRQUNELE9BQU87WUFDTCxLQUFLLEVBQUUsU0FBUztZQUNoQixPQUFPLEVBQUUsS0FB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