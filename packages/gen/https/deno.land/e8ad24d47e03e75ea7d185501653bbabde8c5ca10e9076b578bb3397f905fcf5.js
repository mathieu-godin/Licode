import { Tokenizer, } from "./tokenizer.ts";
function digits(value, count = 2) {
    return String(value).padStart(count, "0");
}
function createLiteralTestFunction(value) {
    return (string) => {
        return string.startsWith(value)
            ? { value, length: value.length }
            : undefined;
    };
}
function createMatchTestFunction(match) {
    return (string) => {
        const result = match.exec(string);
        if (result)
            return { value: result, length: result[0].length };
    };
}
const defaultRules = [
    {
        test: createLiteralTestFunction("yyyy"),
        fn: () => ({ type: "year", value: "numeric" }),
    },
    {
        test: createLiteralTestFunction("yy"),
        fn: () => ({ type: "year", value: "2-digit" }),
    },
    {
        test: createLiteralTestFunction("MM"),
        fn: () => ({ type: "month", value: "2-digit" }),
    },
    {
        test: createLiteralTestFunction("M"),
        fn: () => ({ type: "month", value: "numeric" }),
    },
    {
        test: createLiteralTestFunction("dd"),
        fn: () => ({ type: "day", value: "2-digit" }),
    },
    {
        test: createLiteralTestFunction("d"),
        fn: () => ({ type: "day", value: "numeric" }),
    },
    {
        test: createLiteralTestFunction("HH"),
        fn: () => ({ type: "hour", value: "2-digit" }),
    },
    {
        test: createLiteralTestFunction("H"),
        fn: () => ({ type: "hour", value: "numeric" }),
    },
    {
        test: createLiteralTestFunction("hh"),
        fn: () => ({
            type: "hour",
            value: "2-digit",
            hour12: true,
        }),
    },
    {
        test: createLiteralTestFunction("h"),
        fn: () => ({
            type: "hour",
            value: "numeric",
            hour12: true,
        }),
    },
    {
        test: createLiteralTestFunction("mm"),
        fn: () => ({ type: "minute", value: "2-digit" }),
    },
    {
        test: createLiteralTestFunction("m"),
        fn: () => ({ type: "minute", value: "numeric" }),
    },
    {
        test: createLiteralTestFunction("ss"),
        fn: () => ({ type: "second", value: "2-digit" }),
    },
    {
        test: createLiteralTestFunction("s"),
        fn: () => ({ type: "second", value: "numeric" }),
    },
    {
        test: createLiteralTestFunction("SSS"),
        fn: () => ({ type: "fractionalSecond", value: 3 }),
    },
    {
        test: createLiteralTestFunction("SS"),
        fn: () => ({ type: "fractionalSecond", value: 2 }),
    },
    {
        test: createLiteralTestFunction("S"),
        fn: () => ({ type: "fractionalSecond", value: 1 }),
    },
    {
        test: createLiteralTestFunction("a"),
        fn: (value) => ({
            type: "dayPeriod",
            value: value,
        }),
    },
    {
        test: createMatchTestFunction(/^(')(?<value>\\.|[^\']*)\1/),
        fn: (match) => ({
            type: "literal",
            value: match.groups.value,
        }),
    },
    {
        test: createMatchTestFunction(/^.+?\s*/),
        fn: (match) => ({
            type: "literal",
            value: match[0],
        }),
    },
];
export class DateTimeFormatter {
    #format;
    constructor(formatString, rules = defaultRules) {
        const tokenizer = new Tokenizer(rules);
        this.#format = tokenizer.tokenize(formatString, ({ type, value, hour12 }) => {
            const result = {
                type,
                value,
            };
            if (hour12)
                result.hour12 = hour12;
            return result;
        });
    }
    format(date, options = {}) {
        let string = "";
        const utc = options.timeZone === "UTC";
        for (const token of this.#format) {
            const type = token.type;
            switch (type) {
                case "year": {
                    const value = utc ? date.getUTCFullYear() : date.getFullYear();
                    switch (token.value) {
                        case "numeric": {
                            string += value;
                            break;
                        }
                        case "2-digit": {
                            string += digits(value, 2).slice(-2);
                            break;
                        }
                        default:
                            throw Error(`FormatterError: value "${token.value}" is not supported`);
                    }
                    break;
                }
                case "month": {
                    const value = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
                    switch (token.value) {
                        case "numeric": {
                            string += value;
                            break;
                        }
                        case "2-digit": {
                            string += digits(value, 2);
                            break;
                        }
                        default:
                            throw Error(`FormatterError: value "${token.value}" is not supported`);
                    }
                    break;
                }
                case "day": {
                    const value = utc ? date.getUTCDate() : date.getDate();
                    switch (token.value) {
                        case "numeric": {
                            string += value;
                            break;
                        }
                        case "2-digit": {
                            string += digits(value, 2);
                            break;
                        }
                        default:
                            throw Error(`FormatterError: value "${token.value}" is not supported`);
                    }
                    break;
                }
                case "hour": {
                    let value = utc ? date.getUTCHours() : date.getHours();
                    value -= token.hour12 && date.getHours() > 12 ? 12 : 0;
                    switch (token.value) {
                        case "numeric": {
                            string += value;
                            break;
                        }
                        case "2-digit": {
                            string += digits(value, 2);
                            break;
                        }
                        default:
                            throw Error(`FormatterError: value "${token.value}" is not supported`);
                    }
                    break;
                }
                case "minute": {
                    const value = utc ? date.getUTCMinutes() : date.getMinutes();
                    switch (token.value) {
                        case "numeric": {
                            string += value;
                            break;
                        }
                        case "2-digit": {
                            string += digits(value, 2);
                            break;
                        }
                        default:
                            throw Error(`FormatterError: value "${token.value}" is not supported`);
                    }
                    break;
                }
                case "second": {
                    const value = utc ? date.getUTCSeconds() : date.getSeconds();
                    switch (token.value) {
                        case "numeric": {
                            string += value;
                            break;
                        }
                        case "2-digit": {
                            string += digits(value, 2);
                            break;
                        }
                        default:
                            throw Error(`FormatterError: value "${token.value}" is not supported`);
                    }
                    break;
                }
                case "fractionalSecond": {
                    const value = utc
                        ? date.getUTCMilliseconds()
                        : date.getMilliseconds();
                    string += digits(value, Number(token.value));
                    break;
                }
                case "timeZoneName": {
                    break;
                }
                case "dayPeriod": {
                    string += token.value ? (date.getHours() >= 12 ? "PM" : "AM") : "";
                    break;
                }
                case "literal": {
                    string += token.value;
                    break;
                }
                default:
                    throw Error(`FormatterError: { ${token.type} ${token.value} }`);
            }
        }
        return string;
    }
    parseToParts(string) {
        const parts = [];
        for (const token of this.#format) {
            const type = token.type;
            let value = "";
            switch (token.type) {
                case "year": {
                    switch (token.value) {
                        case "numeric": {
                            value = /^\d{1,4}/.exec(string)?.[0];
                            break;
                        }
                        case "2-digit": {
                            value = /^\d{1,2}/.exec(string)?.[0];
                            break;
                        }
                    }
                    break;
                }
                case "month": {
                    switch (token.value) {
                        case "numeric": {
                            value = /^\d{1,2}/.exec(string)?.[0];
                            break;
                        }
                        case "2-digit": {
                            value = /^\d{2}/.exec(string)?.[0];
                            break;
                        }
                        case "narrow": {
                            value = /^[a-zA-Z]+/.exec(string)?.[0];
                            break;
                        }
                        case "short": {
                            value = /^[a-zA-Z]+/.exec(string)?.[0];
                            break;
                        }
                        case "long": {
                            value = /^[a-zA-Z]+/.exec(string)?.[0];
                            break;
                        }
                        default:
                            throw Error(`ParserError: value "${token.value}" is not supported`);
                    }
                    break;
                }
                case "day": {
                    switch (token.value) {
                        case "numeric": {
                            value = /^\d{1,2}/.exec(string)?.[0];
                            break;
                        }
                        case "2-digit": {
                            value = /^\d{2}/.exec(string)?.[0];
                            break;
                        }
                        default:
                            throw Error(`ParserError: value "${token.value}" is not supported`);
                    }
                    break;
                }
                case "hour": {
                    switch (token.value) {
                        case "numeric": {
                            value = /^\d{1,2}/.exec(string)?.[0];
                            if (token.hour12 && parseInt(value) > 12) {
                                console.error(`Trying to parse hour greater than 12. Use 'H' instead of 'h'.`);
                            }
                            break;
                        }
                        case "2-digit": {
                            value = /^\d{2}/.exec(string)?.[0];
                            if (token.hour12 && parseInt(value) > 12) {
                                console.error(`Trying to parse hour greater than 12. Use 'HH' instead of 'hh'.`);
                            }
                            break;
                        }
                        default:
                            throw Error(`ParserError: value "${token.value}" is not supported`);
                    }
                    break;
                }
                case "minute": {
                    switch (token.value) {
                        case "numeric": {
                            value = /^\d{1,2}/.exec(string)?.[0];
                            break;
                        }
                        case "2-digit": {
                            value = /^\d{2}/.exec(string)?.[0];
                            break;
                        }
                        default:
                            throw Error(`ParserError: value "${token.value}" is not supported`);
                    }
                    break;
                }
                case "second": {
                    switch (token.value) {
                        case "numeric": {
                            value = /^\d{1,2}/.exec(string)?.[0];
                            break;
                        }
                        case "2-digit": {
                            value = /^\d{2}/.exec(string)?.[0];
                            break;
                        }
                        default:
                            throw Error(`ParserError: value "${token.value}" is not supported`);
                    }
                    break;
                }
                case "fractionalSecond": {
                    value = new RegExp(`^\\d{${token.value}}`).exec(string)?.[0];
                    break;
                }
                case "timeZoneName": {
                    value = token.value;
                    break;
                }
                case "dayPeriod": {
                    value = /^(A|P)M/.exec(string)?.[0];
                    break;
                }
                case "literal": {
                    if (!string.startsWith(token.value)) {
                        throw Error(`Literal "${token.value}" not found "${string.slice(0, 25)}"`);
                    }
                    value = token.value;
                    break;
                }
                default:
                    throw Error(`${token.type} ${token.value}`);
            }
            if (!value) {
                throw Error(`value not valid for token { ${type} ${value} } ${string.slice(0, 25)}`);
            }
            parts.push({ type, value });
            string = string.slice(value.length);
        }
        if (string.length) {
            throw Error(`datetime string was not fully parsed! ${string.slice(0, 25)}`);
        }
        return parts;
    }
    sortDateTimeFormatPart(parts) {
        let result = [];
        const typeArray = [
            "year",
            "month",
            "day",
            "hour",
            "minute",
            "second",
            "fractionalSecond",
        ];
        for (const type of typeArray) {
            const current = parts.findIndex((el) => el.type === type);
            if (current !== -1) {
                result = result.concat(parts.splice(current, 1));
            }
        }
        result = result.concat(parts);
        return result;
    }
    partsToDate(parts) {
        const date = new Date();
        const utc = parts.find((part) => part.type === "timeZoneName" && part.value === "UTC");
        utc ? date.setUTCHours(0, 0, 0, 0) : date.setHours(0, 0, 0, 0);
        for (const part of parts) {
            switch (part.type) {
                case "year": {
                    const value = Number(part.value.padStart(4, "20"));
                    utc ? date.setUTCFullYear(value) : date.setFullYear(value);
                    break;
                }
                case "month": {
                    const value = Number(part.value) - 1;
                    utc ? date.setUTCMonth(value) : date.setMonth(value);
                    break;
                }
                case "day": {
                    const value = Number(part.value);
                    utc ? date.setUTCDate(value) : date.setDate(value);
                    break;
                }
                case "hour": {
                    let value = Number(part.value);
                    const dayPeriod = parts.find((part) => part.type === "dayPeriod");
                    if (dayPeriod?.value === "PM")
                        value += 12;
                    utc ? date.setUTCHours(value) : date.setHours(value);
                    break;
                }
                case "minute": {
                    const value = Number(part.value);
                    utc ? date.setUTCMinutes(value) : date.setMinutes(value);
                    break;
                }
                case "second": {
                    const value = Number(part.value);
                    utc ? date.setUTCSeconds(value) : date.setSeconds(value);
                    break;
                }
                case "fractionalSecond": {
                    const value = Number(part.value);
                    utc ? date.setUTCMilliseconds(value) : date.setMilliseconds(value);
                    break;
                }
            }
        }
        return date;
    }
    parse(string) {
        const parts = this.parseToParts(string);
        const sortParts = this.sortDateTimeFormatPart(parts);
        return this.partsToDate(sortParts);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZm9ybWF0dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFNTCxTQUFTLEdBQ1YsTUFBTSxnQkFBZ0IsQ0FBQztBQUV4QixTQUFTLE1BQU0sQ0FBQyxLQUFzQixFQUFFLEtBQUssR0FBRyxDQUFDO0lBQy9DLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDNUMsQ0FBQztBQTRCRCxTQUFTLHlCQUF5QixDQUFDLEtBQWE7SUFDOUMsT0FBTyxDQUFDLE1BQWMsRUFBYyxFQUFFO1FBQ3BDLE9BQU8sTUFBTSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7WUFDN0IsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFO1lBQ2pDLENBQUMsQ0FBQyxTQUFTLENBQUM7SUFDaEIsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsdUJBQXVCLENBQUMsS0FBYTtJQUM1QyxPQUFPLENBQUMsTUFBYyxFQUFjLEVBQUU7UUFDcEMsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsQyxJQUFJLE1BQU07WUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ2pFLENBQUMsQ0FBQztBQUNKLENBQUM7QUFHRCxNQUFNLFlBQVksR0FBRztJQUNuQjtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxNQUFNLENBQUM7UUFDdkMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDL0Q7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDckMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDL0Q7SUFFRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDckMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDaEU7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxHQUFHLENBQUM7UUFDcEMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDaEU7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDckMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDOUQ7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxHQUFHLENBQUM7UUFDcEMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDOUQ7SUFFRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDckMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDL0Q7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxHQUFHLENBQUM7UUFDcEMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDL0Q7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDckMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDO1lBQ3pCLElBQUksRUFBRSxNQUFNO1lBQ1osS0FBSyxFQUFFLFNBQVM7WUFDaEIsTUFBTSxFQUFFLElBQUk7U0FDYixDQUFDO0tBQ0g7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxHQUFHLENBQUM7UUFDcEMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDO1lBQ3pCLElBQUksRUFBRSxNQUFNO1lBQ1osS0FBSyxFQUFFLFNBQVM7WUFDaEIsTUFBTSxFQUFFLElBQUk7U0FDYixDQUFDO0tBQ0g7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDckMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDakU7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxHQUFHLENBQUM7UUFDcEMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDakU7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDckMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDakU7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxHQUFHLENBQUM7UUFDcEMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDakU7SUFDRDtRQUNFLElBQUksRUFBRSx5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QUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDckMsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMSB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmltcG9ydCB7XG4gIENhbGxiYWNrUmVzdWx0LFxuICBSZWNlaXZlclJlc3VsdCxcbiAgUnVsZSxcbiAgVGVzdEZ1bmN0aW9uLFxuICBUZXN0UmVzdWx0LFxuICBUb2tlbml6ZXIsXG59IGZyb20gXCIuL3Rva2VuaXplci50c1wiO1xuXG5mdW5jdGlvbiBkaWdpdHModmFsdWU6IHN0cmluZyB8IG51bWJlciwgY291bnQgPSAyKTogc3RyaW5nIHtcbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSkucGFkU3RhcnQoY291bnQsIFwiMFwiKTtcbn1cblxuLy8gYXMgZGVjbGFyZWQgYXMgaW4gbmFtZXNwYWNlIEludGxcbnR5cGUgRGF0ZVRpbWVGb3JtYXRQYXJ0VHlwZXMgPVxuICB8IFwiZGF5XCJcbiAgfCBcImRheVBlcmlvZFwiXG4gIC8vIHwgXCJlcmFcIlxuICB8IFwiaG91clwiXG4gIHwgXCJsaXRlcmFsXCJcbiAgfCBcIm1pbnV0ZVwiXG4gIHwgXCJtb250aFwiXG4gIHwgXCJzZWNvbmRcIlxuICB8IFwidGltZVpvbmVOYW1lXCJcbiAgLy8gfCBcIndlZWtkYXlcIlxuICB8IFwieWVhclwiXG4gIHwgXCJmcmFjdGlvbmFsU2Vjb25kXCI7XG5cbmludGVyZmFjZSBEYXRlVGltZUZvcm1hdFBhcnQge1xuICB0eXBlOiBEYXRlVGltZUZvcm1hdFBhcnRUeXBlcztcbiAgdmFsdWU6IHN0cmluZztcbn1cblxudHlwZSBUaW1lWm9uZSA9IFwiVVRDXCI7XG5cbmludGVyZmFjZSBPcHRpb25zIHtcbiAgdGltZVpvbmU/OiBUaW1lWm9uZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbih2YWx1ZTogc3RyaW5nKTogVGVzdEZ1bmN0aW9uIHtcbiAgcmV0dXJuIChzdHJpbmc6IHN0cmluZyk6IFRlc3RSZXN1bHQgPT4ge1xuICAgIHJldHVybiBzdHJpbmcuc3RhcnRzV2l0aCh2YWx1ZSlcbiAgICAgID8geyB2YWx1ZSwgbGVuZ3RoOiB2YWx1ZS5sZW5ndGggfVxuICAgICAgOiB1bmRlZmluZWQ7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU1hdGNoVGVzdEZ1bmN0aW9uKG1hdGNoOiBSZWdFeHApOiBUZXN0RnVuY3Rpb24ge1xuICByZXR1cm4gKHN0cmluZzogc3RyaW5nKTogVGVzdFJlc3VsdCA9PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gbWF0Y2guZXhlYyhzdHJpbmcpO1xuICAgIGlmIChyZXN1bHQpIHJldHVybiB7IHZhbHVlOiByZXN1bHQsIGxlbmd0aDogcmVzdWx0WzBdLmxlbmd0aCB9O1xuICB9O1xufVxuXG4vLyBhY2NvcmRpbmcgdG8gdW5pY29kZSBzeW1ib2xzIChodHRwOi8vd3d3LnVuaWNvZGUub3JnL3JlcG9ydHMvdHIzNS90cjM1LWRhdGVzLmh0bWwjRGF0ZV9GaWVsZF9TeW1ib2xfVGFibGUpXG5jb25zdCBkZWZhdWx0UnVsZXMgPSBbXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwieXl5eVwiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwieWVhclwiLCB2YWx1ZTogXCJudW1lcmljXCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwieXlcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcInllYXJcIiwgdmFsdWU6IFwiMi1kaWdpdFwiIH0pLFxuICB9LFxuXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiTU1cIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcIm1vbnRoXCIsIHZhbHVlOiBcIjItZGlnaXRcIiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJNXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJtb250aFwiLCB2YWx1ZTogXCJudW1lcmljXCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiZGRcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcImRheVwiLCB2YWx1ZTogXCIyLWRpZ2l0XCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiZFwiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwiZGF5XCIsIHZhbHVlOiBcIm51bWVyaWNcIiB9KSxcbiAgfSxcblxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcIkhIXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJob3VyXCIsIHZhbHVlOiBcIjItZGlnaXRcIiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJIXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJob3VyXCIsIHZhbHVlOiBcIm51bWVyaWNcIiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJoaFwiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7XG4gICAgICB0eXBlOiBcImhvdXJcIixcbiAgICAgIHZhbHVlOiBcIjItZGlnaXRcIixcbiAgICAgIGhvdXIxMjogdHJ1ZSxcbiAgICB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJoXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHtcbiAgICAgIHR5cGU6IFwiaG91clwiLFxuICAgICAgdmFsdWU6IFwibnVtZXJpY1wiLFxuICAgICAgaG91cjEyOiB0cnVlLFxuICAgIH0pLFxuICB9LFxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcIm1tXCIpLFxuICAgIGZuOiAoKTogQ2FsbGJhY2tSZXN1bHQgPT4gKHsgdHlwZTogXCJtaW51dGVcIiwgdmFsdWU6IFwiMi1kaWdpdFwiIH0pLFxuICB9LFxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcIm1cIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcIm1pbnV0ZVwiLCB2YWx1ZTogXCJudW1lcmljXCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwic3NcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcInNlY29uZFwiLCB2YWx1ZTogXCIyLWRpZ2l0XCIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwic1wiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwic2Vjb25kXCIsIHZhbHVlOiBcIm51bWVyaWNcIiB9KSxcbiAgfSxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZUxpdGVyYWxUZXN0RnVuY3Rpb24oXCJTU1NcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcImZyYWN0aW9uYWxTZWNvbmRcIiwgdmFsdWU6IDMgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiU1NcIiksXG4gICAgZm46ICgpOiBDYWxsYmFja1Jlc3VsdCA9PiAoeyB0eXBlOiBcImZyYWN0aW9uYWxTZWNvbmRcIiwgdmFsdWU6IDIgfSksXG4gIH0sXG4gIHtcbiAgICB0ZXN0OiBjcmVhdGVMaXRlcmFsVGVzdEZ1bmN0aW9uKFwiU1wiKSxcbiAgICBmbjogKCk6IENhbGxiYWNrUmVzdWx0ID0+ICh7IHR5cGU6IFwiZnJhY3Rpb25hbFNlY29uZFwiLCB2YWx1ZTogMSB9KSxcbiAgfSxcblxuICB7XG4gICAgdGVzdDogY3JlYXRlTGl0ZXJhbFRlc3RGdW5jdGlvbihcImFcIiksXG4gICAgZm46ICh2YWx1ZTogdW5rbm93bik6IENhbGxiYWNrUmVzdWx0ID0+ICh7XG4gICAgICB0eXBlOiBcImRheVBlcmlvZFwiLFxuICAgICAgdmFsdWU6IHZhbHVlIGFzIHN0cmluZyxcbiAgICB9KSxcbiAgfSxcblxuICAvLyBxdW90ZWQgbGl0ZXJhbFxuICB7XG4gICAgdGVzdDogY3JlYXRlTWF0Y2hUZXN0RnVuY3Rpb24oL14oJykoPzx2YWx1ZT5cXFxcLnxbXlxcJ10qKVxcMS8pLFxuICAgIGZuOiAobWF0Y2g6IHVua25vd24pOiBDYWxsYmFja1Jlc3VsdCA9PiAoe1xuICAgICAgdHlwZTogXCJsaXRlcmFsXCIsXG4gICAgICB2YWx1ZTogKG1hdGNoIGFzIFJlZ0V4cEV4ZWNBcnJheSkuZ3JvdXBzIS52YWx1ZSBhcyBzdHJpbmcsXG4gICAgfSksXG4gIH0sXG4gIC8vIGxpdGVyYWxcbiAge1xuICAgIHRlc3Q6IGNyZWF0ZU1hdGNoVGVzdEZ1bmN0aW9uKC9eLis/XFxzKi8pLFxuICAgIGZuOiAobWF0Y2g6IHVua25vd24pOiBDYWxsYmFja1Jlc3VsdCA9PiAoe1xuICAgICAgdHlwZTogXCJsaXRlcmFsXCIsXG4gICAgICB2YWx1ZTogKG1hdGNoIGFzIFJlZ0V4cEV4ZWNBcnJheSlbMF0sXG4gICAgfSksXG4gIH0sXG5dO1xuXG50eXBlIEZvcm1hdFBhcnQgPSB7XG4gIHR5cGU6IERhdGVUaW1lRm9ybWF0UGFydFR5cGVzO1xuICB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyO1xuICBob3VyMTI/OiBib29sZWFuO1xufTtcbnR5cGUgRm9ybWF0ID0gRm9ybWF0UGFydFtdO1xuXG5leHBvcnQgY2xhc3MgRGF0ZVRpbWVGb3JtYXR0ZXIge1xuICAjZm9ybWF0OiBGb3JtYXQ7XG5cbiAgY29uc3RydWN0b3IoZm9ybWF0U3RyaW5nOiBzdHJpbmcsIHJ1bGVzOiBSdWxlW10gPSBkZWZhdWx0UnVsZXMpIHtcbiAgICBjb25zdCB0b2tlbml6ZXIgPSBuZXcgVG9rZW5pemVyKHJ1bGVzKTtcbiAgICB0aGlzLiNmb3JtYXQgPSB0b2tlbml6ZXIudG9rZW5pemUoXG4gICAgICBmb3JtYXRTdHJpbmcsXG4gICAgICAoeyB0eXBlLCB2YWx1ZSwgaG91cjEyIH0pID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgdmFsdWUsXG4gICAgICAgIH0gYXMgdW5rbm93biBhcyBSZWNlaXZlclJlc3VsdDtcbiAgICAgICAgaWYgKGhvdXIxMikgcmVzdWx0LmhvdXIxMiA9IGhvdXIxMiBhcyBib29sZWFuO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSxcbiAgICApIGFzIEZvcm1hdDtcbiAgfVxuXG4gIGZvcm1hdChkYXRlOiBEYXRlLCBvcHRpb25zOiBPcHRpb25zID0ge30pOiBzdHJpbmcge1xuICAgIGxldCBzdHJpbmcgPSBcIlwiO1xuXG4gICAgY29uc3QgdXRjID0gb3B0aW9ucy50aW1lWm9uZSA9PT0gXCJVVENcIjtcblxuICAgIGZvciAoY29uc3QgdG9rZW4gb2YgdGhpcy4jZm9ybWF0KSB7XG4gICAgICBjb25zdCB0eXBlID0gdG9rZW4udHlwZTtcblxuICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgIGNhc2UgXCJ5ZWFyXCI6IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IHV0YyA/IGRhdGUuZ2V0VVRDRnVsbFllYXIoKSA6IGRhdGUuZ2V0RnVsbFllYXIoKTtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSB2YWx1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSBkaWdpdHModmFsdWUsIDIpLnNsaWNlKC0yKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgRm9ybWF0dGVyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcIm1vbnRoXCI6IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9ICh1dGMgPyBkYXRlLmdldFVUQ01vbnRoKCkgOiBkYXRlLmdldE1vbnRoKCkpICsgMTtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSB2YWx1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSBkaWdpdHModmFsdWUsIDIpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBGb3JtYXR0ZXJFcnJvcjogdmFsdWUgXCIke3Rva2VuLnZhbHVlfVwiIGlzIG5vdCBzdXBwb3J0ZWRgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZGF5XCI6IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IHV0YyA/IGRhdGUuZ2V0VVRDRGF0ZSgpIDogZGF0ZS5nZXREYXRlKCk7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICBzdHJpbmcgKz0gdmFsdWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIjItZGlnaXRcIjoge1xuICAgICAgICAgICAgICBzdHJpbmcgKz0gZGlnaXRzKHZhbHVlLCAyKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgRm9ybWF0dGVyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImhvdXJcIjoge1xuICAgICAgICAgIGxldCB2YWx1ZSA9IHV0YyA/IGRhdGUuZ2V0VVRDSG91cnMoKSA6IGRhdGUuZ2V0SG91cnMoKTtcbiAgICAgICAgICB2YWx1ZSAtPSB0b2tlbi5ob3VyMTIgJiYgZGF0ZS5nZXRIb3VycygpID4gMTIgPyAxMiA6IDA7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICBzdHJpbmcgKz0gdmFsdWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcIjItZGlnaXRcIjoge1xuICAgICAgICAgICAgICBzdHJpbmcgKz0gZGlnaXRzKHZhbHVlLCAyKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgRm9ybWF0dGVyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcIm1pbnV0ZVwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSB1dGMgPyBkYXRlLmdldFVUQ01pbnV0ZXMoKSA6IGRhdGUuZ2V0TWludXRlcygpO1xuICAgICAgICAgIHN3aXRjaCAodG9rZW4udmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJudW1lcmljXCI6IHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IHZhbHVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgc3RyaW5nICs9IGRpZ2l0cyh2YWx1ZSwgMik7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgICAgICAgYEZvcm1hdHRlckVycm9yOiB2YWx1ZSBcIiR7dG9rZW4udmFsdWV9XCIgaXMgbm90IHN1cHBvcnRlZGAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJzZWNvbmRcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gdXRjID8gZGF0ZS5nZXRVVENTZWNvbmRzKCkgOiBkYXRlLmdldFNlY29uZHMoKTtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSB2YWx1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHN0cmluZyArPSBkaWdpdHModmFsdWUsIDIpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBGb3JtYXR0ZXJFcnJvcjogdmFsdWUgXCIke3Rva2VuLnZhbHVlfVwiIGlzIG5vdCBzdXBwb3J0ZWRgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZnJhY3Rpb25hbFNlY29uZFwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSB1dGNcbiAgICAgICAgICAgID8gZGF0ZS5nZXRVVENNaWxsaXNlY29uZHMoKVxuICAgICAgICAgICAgOiBkYXRlLmdldE1pbGxpc2Vjb25kcygpO1xuICAgICAgICAgIHN0cmluZyArPSBkaWdpdHModmFsdWUsIE51bWJlcih0b2tlbi52YWx1ZSkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIC8vIEZJWE1FKGJhcnRsb21pZWp1KVxuICAgICAgICBjYXNlIFwidGltZVpvbmVOYW1lXCI6IHtcbiAgICAgICAgICAvLyBzdHJpbmcgKz0gdXRjID8gXCJaXCIgOiB0b2tlbi52YWx1ZVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJkYXlQZXJpb2RcIjoge1xuICAgICAgICAgIHN0cmluZyArPSB0b2tlbi52YWx1ZSA/IChkYXRlLmdldEhvdXJzKCkgPj0gMTIgPyBcIlBNXCIgOiBcIkFNXCIpIDogXCJcIjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibGl0ZXJhbFwiOiB7XG4gICAgICAgICAgc3RyaW5nICs9IHRva2VuLnZhbHVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBFcnJvcihgRm9ybWF0dGVyRXJyb3I6IHsgJHt0b2tlbi50eXBlfSAke3Rva2VuLnZhbHVlfSB9YCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cmluZztcbiAgfVxuXG4gIHBhcnNlVG9QYXJ0cyhzdHJpbmc6IHN0cmluZyk6IERhdGVUaW1lRm9ybWF0UGFydFtdIHtcbiAgICBjb25zdCBwYXJ0czogRGF0ZVRpbWVGb3JtYXRQYXJ0W10gPSBbXTtcblxuICAgIGZvciAoY29uc3QgdG9rZW4gb2YgdGhpcy4jZm9ybWF0KSB7XG4gICAgICBjb25zdCB0eXBlID0gdG9rZW4udHlwZTtcblxuICAgICAgbGV0IHZhbHVlID0gXCJcIjtcbiAgICAgIHN3aXRjaCAodG9rZW4udHlwZSkge1xuICAgICAgICBjYXNlIFwieWVhclwiOiB7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezEsNH0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7MSwyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcIm1vbnRoXCI6IHtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7MSwyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlxcZHsyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCJuYXJyb3dcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eW2EtekEtWl0rLy5leGVjKHN0cmluZyk/LlswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcInNob3J0XCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlthLXpBLVpdKy8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCJsb25nXCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlthLXpBLVpdKy8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBQYXJzZXJFcnJvcjogdmFsdWUgXCIke3Rva2VuLnZhbHVlfVwiIGlzIG5vdCBzdXBwb3J0ZWRgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZGF5XCI6IHtcbiAgICAgICAgICBzd2l0Y2ggKHRva2VuLnZhbHVlKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtZXJpY1wiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7MSwyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlxcZHsyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBQYXJzZXJFcnJvcjogdmFsdWUgXCIke3Rva2VuLnZhbHVlfVwiIGlzIG5vdCBzdXBwb3J0ZWRgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiaG91clwiOiB7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezEsMn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgaWYgKHRva2VuLmhvdXIxMiAmJiBwYXJzZUludCh2YWx1ZSkgPiAxMikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAgICAgICBgVHJ5aW5nIHRvIHBhcnNlIGhvdXIgZ3JlYXRlciB0aGFuIDEyLiBVc2UgJ0gnIGluc3RlYWQgb2YgJ2gnLmAsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgXCIyLWRpZ2l0XCI6IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSAvXlxcZHsyfS8uZXhlYyhzdHJpbmcpPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgICAgICBpZiAodG9rZW4uaG91cjEyICYmIHBhcnNlSW50KHZhbHVlKSA+IDEyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgICAgICAgIGBUcnlpbmcgdG8gcGFyc2UgaG91ciBncmVhdGVyIHRoYW4gMTIuIFVzZSAnSEgnIGluc3RlYWQgb2YgJ2hoJy5gLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgUGFyc2VyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcIm1pbnV0ZVwiOiB7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezEsMn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7Mn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgUGFyc2VyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInNlY29uZFwiOiB7XG4gICAgICAgICAgc3dpdGNoICh0b2tlbi52YWx1ZSkge1xuICAgICAgICAgICAgY2FzZSBcIm51bWVyaWNcIjoge1xuICAgICAgICAgICAgICB2YWx1ZSA9IC9eXFxkezEsMn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIFwiMi1kaWdpdFwiOiB7XG4gICAgICAgICAgICAgIHZhbHVlID0gL15cXGR7Mn0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgICBgUGFyc2VyRXJyb3I6IHZhbHVlIFwiJHt0b2tlbi52YWx1ZX1cIiBpcyBub3Qgc3VwcG9ydGVkYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImZyYWN0aW9uYWxTZWNvbmRcIjoge1xuICAgICAgICAgIHZhbHVlID0gbmV3IFJlZ0V4cChgXlxcXFxkeyR7dG9rZW4udmFsdWV9fWApLmV4ZWMoc3RyaW5nKVxuICAgICAgICAgICAgPy5bMF0gYXMgc3RyaW5nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJ0aW1lWm9uZU5hbWVcIjoge1xuICAgICAgICAgIHZhbHVlID0gdG9rZW4udmFsdWUgYXMgc3RyaW5nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJkYXlQZXJpb2RcIjoge1xuICAgICAgICAgIHZhbHVlID0gL14oQXxQKU0vLmV4ZWMoc3RyaW5nKT8uWzBdIGFzIHN0cmluZztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibGl0ZXJhbFwiOiB7XG4gICAgICAgICAgaWYgKCFzdHJpbmcuc3RhcnRzV2l0aCh0b2tlbi52YWx1ZSBhcyBzdHJpbmcpKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgICAgYExpdGVyYWwgXCIke3Rva2VuLnZhbHVlfVwiIG5vdCBmb3VuZCBcIiR7c3RyaW5nLnNsaWNlKDAsIDI1KX1cImAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YWx1ZSA9IHRva2VuLnZhbHVlIGFzIHN0cmluZztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgRXJyb3IoYCR7dG9rZW4udHlwZX0gJHt0b2tlbi52YWx1ZX1gKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICBgdmFsdWUgbm90IHZhbGlkIGZvciB0b2tlbiB7ICR7dHlwZX0gJHt2YWx1ZX0gfSAke1xuICAgICAgICAgICAgc3RyaW5nLnNsaWNlKFxuICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAyNSxcbiAgICAgICAgICAgIClcbiAgICAgICAgICB9YCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHBhcnRzLnB1c2goeyB0eXBlLCB2YWx1ZSB9KTtcblxuICAgICAgc3RyaW5nID0gc3RyaW5nLnNsaWNlKHZhbHVlLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgaWYgKHN0cmluZy5sZW5ndGgpIHtcbiAgICAgIHRocm93IEVycm9yKFxuICAgICAgICBgZGF0ZXRpbWUgc3RyaW5nIHdhcyBub3QgZnVsbHkgcGFyc2VkISAke3N0cmluZy5zbGljZSgwLCAyNSl9YCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcnRzO1xuICB9XG5cbiAgLyoqIHNvcnQgJiBmaWx0ZXIgZGF0ZVRpbWVGb3JtYXRQYXJ0ICovXG4gIHNvcnREYXRlVGltZUZvcm1hdFBhcnQocGFydHM6IERhdGVUaW1lRm9ybWF0UGFydFtdKTogRGF0ZVRpbWVGb3JtYXRQYXJ0W10ge1xuICAgIGxldCByZXN1bHQ6IERhdGVUaW1lRm9ybWF0UGFydFtdID0gW107XG4gICAgY29uc3QgdHlwZUFycmF5ID0gW1xuICAgICAgXCJ5ZWFyXCIsXG4gICAgICBcIm1vbnRoXCIsXG4gICAgICBcImRheVwiLFxuICAgICAgXCJob3VyXCIsXG4gICAgICBcIm1pbnV0ZVwiLFxuICAgICAgXCJzZWNvbmRcIixcbiAgICAgIFwiZnJhY3Rpb25hbFNlY29uZFwiLFxuICAgIF07XG4gICAgZm9yIChjb25zdCB0eXBlIG9mIHR5cGVBcnJheSkge1xuICAgICAgY29uc3QgY3VycmVudCA9IHBhcnRzLmZpbmRJbmRleCgoZWwpID0+IGVsLnR5cGUgPT09IHR5cGUpO1xuICAgICAgaWYgKGN1cnJlbnQgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQocGFydHMuc3BsaWNlKGN1cnJlbnQsIDEpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChwYXJ0cyk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnRzVG9EYXRlKHBhcnRzOiBEYXRlVGltZUZvcm1hdFBhcnRbXSk6IERhdGUge1xuICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnN0IHV0YyA9IHBhcnRzLmZpbmQoXG4gICAgICAocGFydCkgPT4gcGFydC50eXBlID09PSBcInRpbWVab25lTmFtZVwiICYmIHBhcnQudmFsdWUgPT09IFwiVVRDXCIsXG4gICAgKTtcblxuICAgIHV0YyA/IGRhdGUuc2V0VVRDSG91cnMoMCwgMCwgMCwgMCkgOiBkYXRlLnNldEhvdXJzKDAsIDAsIDAsIDApO1xuICAgIGZvciAoY29uc3QgcGFydCBvZiBwYXJ0cykge1xuICAgICAgc3dpdGNoIChwYXJ0LnR5cGUpIHtcbiAgICAgICAgY2FzZSBcInllYXJcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gTnVtYmVyKHBhcnQudmFsdWUucGFkU3RhcnQoNCwgXCIyMFwiKSk7XG4gICAgICAgICAgdXRjID8gZGF0ZS5zZXRVVENGdWxsWWVhcih2YWx1ZSkgOiBkYXRlLnNldEZ1bGxZZWFyKHZhbHVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibW9udGhcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gTnVtYmVyKHBhcnQudmFsdWUpIC0gMTtcbiAgICAgICAgICB1dGMgPyBkYXRlLnNldFVUQ01vbnRoKHZhbHVlKSA6IGRhdGUuc2V0TW9udGgodmFsdWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJkYXlcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gTnVtYmVyKHBhcnQudmFsdWUpO1xuICAgICAgICAgIHV0YyA/IGRhdGUuc2V0VVRDRGF0ZSh2YWx1ZSkgOiBkYXRlLnNldERhdGUodmFsdWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJob3VyXCI6IHtcbiAgICAgICAgICBsZXQgdmFsdWUgPSBOdW1iZXIocGFydC52YWx1ZSk7XG4gICAgICAgICAgY29uc3QgZGF5UGVyaW9kID0gcGFydHMuZmluZChcbiAgICAgICAgICAgIChwYXJ0OiBEYXRlVGltZUZvcm1hdFBhcnQpID0+IHBhcnQudHlwZSA9PT0gXCJkYXlQZXJpb2RcIixcbiAgICAgICAgICApO1xuICAgICAgICAgIGlmIChkYXlQZXJpb2Q/LnZhbHVlID09PSBcIlBNXCIpIHZhbHVlICs9IDEyO1xuICAgICAgICAgIHV0YyA/IGRhdGUuc2V0VVRDSG91cnModmFsdWUpIDogZGF0ZS5zZXRIb3Vycyh2YWx1ZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcIm1pbnV0ZVwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBOdW1iZXIocGFydC52YWx1ZSk7XG4gICAgICAgICAgdXRjID8gZGF0ZS5zZXRVVENNaW51dGVzKHZhbHVlKSA6IGRhdGUuc2V0TWludXRlcyh2YWx1ZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInNlY29uZFwiOiB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBOdW1iZXIocGFydC52YWx1ZSk7XG4gICAgICAgICAgdXRjID8gZGF0ZS5zZXRVVENTZWNvbmRzKHZhbHVlKSA6IGRhdGUuc2V0U2Vjb25kcyh2YWx1ZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImZyYWN0aW9uYWxTZWNvbmRcIjoge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gTnVtYmVyKHBhcnQudmFsdWUpO1xuICAgICAgICAgIHV0YyA/IGRhdGUuc2V0VVRDTWlsbGlzZWNvbmRzKHZhbHVlKSA6IGRhdGUuc2V0TWlsbGlzZWNvbmRzKHZhbHVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGF0ZTtcbiAgfVxuXG4gIHBhcnNlKHN0cmluZzogc3RyaW5nKTogRGF0ZSB7XG4gICAgY29uc3QgcGFydHMgPSB0aGlzLnBhcnNlVG9QYXJ0cyhzdHJpbmcpO1xuICAgIGNvbnN0IHNvcnRQYXJ0cyA9IHRoaXMuc29ydERhdGVUaW1lRm9ybWF0UGFydChwYXJ0cyk7XG4gICAgcmV0dXJuIHRoaXMucGFydHNUb0RhdGUoc29ydFBhcnRzKTtcbiAgfVxufVxuIl19