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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXlfcGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXJyYXlfcGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQU9BLFNBQVMsWUFBWSxDQUFDLEtBQWE7SUFDakMsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBT0QsTUFBTSxVQUFVLFVBQVUsQ0FBQyxNQUFjLEVBQUUsU0FBUyxHQUFHLFlBQVk7SUFDakUsT0FBTyxJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDcEQsQ0FBQztBQUVELE1BQU0sV0FBVztJQU9OO0lBQ0E7SUFQVCxRQUFRLEdBQUcsQ0FBQyxDQUFDO0lBQ2IsT0FBTyxHQUFtQixFQUFFLENBQUM7SUFDN0IsUUFBUSxHQUFhLEVBQUUsQ0FBQztJQUN4QixTQUFTLEdBQUcsQ0FBQyxDQUFDO0lBRWQsWUFDUyxNQUFjLEVBQ2QsU0FBeUI7UUFEekIsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQUNkLGNBQVMsR0FBVCxTQUFTLENBQWdCO0lBQy9CLENBQUM7SUFFSixLQUFLO1FBQ0gsT0FBTyxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQzdDLENBQUM7SUFFRCxhQUFhO1FBQ1gsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUMvQyxJQUFJLFNBQVMsS0FBSyxJQUFJLEVBQUU7WUFDdEIsT0FBTztnQkFDTCxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ25DLE9BQU8sRUFBRSxJQUFJO2FBQ2QsQ0FBQztTQUNIO1FBQ0QsT0FBTztZQUNMLEtBQUssRUFBRSxTQUFTO1lBQ2hCLE9BQU8sRUFBRSxLQUFLO1NBQ2YsQ0FBQztJQUNKLENBQUM7SUFFRCxNQUFNLENBQUMsU0FBaUI7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