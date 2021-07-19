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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZm9ybWF0dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFNTCxTQUFTLEdBQ1YsTUFBTSxnQkFBZ0IsQ0FBQztBQUV4QixTQUFTLE1BQU0sQ0FBQyxLQUFzQixFQUFFLEtBQUssR0FBRyxDQUFDO0lBQy9DLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDNUMsQ0FBQztBQTRCRCxTQUFTLHlCQUF5QixDQUFDLEtBQWE7SUFDOUMsT0FBTyxDQUFDLE1BQWMsRUFBYyxFQUFFO1FBQ3BDLE9BQU8sTUFBTSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7WUFDN0IsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFO1lBQ2pDLENBQUMsQ0FBQyxTQUFTLENBQUM7SUFDaEIsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsdUJBQXVCLENBQUMsS0FBYTtJQUM1QyxPQUFPLENBQUMsTUFBYyxFQUFjLEVBQUU7UUFDcEMsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsQyxJQUFJLE1BQU07WUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ2pFLENBQUMsQ0FBQztBQUNKLENBQUM7QUFHRCxNQUFNLFlBQVksR0FBRztJQUNuQjtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxNQUFNLENBQUM7UUFDdkMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDL0Q7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDckMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDL0Q7SUFFRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDckMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDaEU7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxHQUFHLENBQUM7UUFDcEMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDaEU7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDckMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDOUQ7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxHQUFHLENBQUM7UUFDcEMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDOUQ7SUFFRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDckMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDL0Q7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxHQUFHLENBQUM7UUFDcEMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDL0Q7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDckMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDO1lBQ3pCLElBQUksRUFBRSxNQUFNO1lBQ1osS0FBSyxFQUFFLFNBQVM7WUFDaEIsTUFBTSxFQUFFLElBQUk7U0FDYixDQUFDO0tBQ0g7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxHQUFHLENBQUM7UUFDcEMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDO1lBQ3pCLElBQUksRUFBRSxNQUFNO1lBQ1osS0FBSyxFQUFFLFNBQVM7WUFDaEIsTUFBTSxFQUFFLElBQUk7U0FDYixDQUFDO0tBQ0g7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDckMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDakU7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxHQUFHLENBQUM7UUFDcEMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDakU7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUM7UUFDckMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDakU7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxHQUFHLENBQUM7UUFDcEMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDakU7SUFDRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxLQUFLLENBQUM7UUFDdEMsRUFBRSxFQUFFLEdBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQztLQUNuRTtJQUNEO1FBQ0UsSUFBSSxFQUFFLHlCQUF5QixDQUFDLElBQUksQ0FBQztRQUNyQyxFQUFFLEVBQUUsR0FBbUIsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDO0tBQ25FO0lBQ0Q7UUFDRSxJQUFJLEVBQUUseUJBQXlCLENBQUMsR0FBRyxDQUFDO1FBQ3BDLEVBQUUsRUFBRSxHQUFtQixFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxrQkFBa0IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUM7S0FDbkU7SUFFRDtRQUNFLElBQUksRUFBRSx5QkFBeUIsQ0FBQyxHQUFHLENBQUM7UUFDcEMsRUFBRSxFQUFFLENBQUMsS0FBYyxFQUFrQixFQUFFLENBQUMsQ0FBQztZQUN2QyxJQUFJLEVBQUUsV0FBVztZQUNqQixLQUFLLEVBQUUsS0FBZTtTQUN2QixDQUFDO0tBQ0g7SUFHRDtRQUNFLElBQUksRUFBRSx1QkFBdUIsQ0FBQyw0QkFBNEIsQ0FBQztRQUMzRCxFQUFFLEVBQUUsQ0FBQyxLQUFjLEVBQWtCLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZDLElBQUksRUFBRSxTQUFTO1lBQ2YsS0FBSyxFQUFHLEtBQXlCLENBQUMsTUFBTyxDQUFDLEtBQWU7U0FDMUQsQ0FBQztLQUNIO0lBRUQ7UUFDRSxJQUFJLEVBQUUsdUJBQXVCLENBQUMsU0FBUyxDQUFDO1FBQ3hDLEVBQUUsRUFBRSxDQUFDLEtBQWMsRUFBa0IsRUFBRSxDQUFDLENBQUM7WUFDdkMsSUFBSSxFQUFFLFNBQVM7WUFDZixLQUFLLEVBQUcsS0FBeUIsQ0FBQyxDQUFDLENBQUM7U0FDckMsQ0FBQztLQUNIO0NBQ0YsQ0FBQztBQVNGLE1BQU0sT0FBTyxpQkFBaUI7SUFDNUIsT0FBTyxDQUFTO0lBRWhCLFlBQVksWUFBb0IsRUFBRSxRQUFnQixZQUFZO1FBQzVELE1BQU0sU0FBUyxHQUFHLElBQUksU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FDL0IsWUFBWSxFQUNaLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUU7WUFDMUIsTUFBTSxNQUFNLEdBQUc7Z0JBQ2IsSUFBSTtnQkFDSixLQUFLO2FBQ3VCLENBQUM7WUFDL0IsSUFBSSxNQUFNO2dCQUFFLE1BQU0sQ0FBQyxNQUFNLEdBQUcsTUFBaUIsQ0FBQztZQUM5QyxPQUFPLE1BQU0sQ0FBQztRQUNoQixDQUFDLENBQ1EsQ0FBQztJQUNkLENBQUM7SUFFRCxNQUFNLENBQUMsSUFBVSxFQUFFLFVBQW1CLEVBQUU7UUFDdEMsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBRWhCLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxRQUFRLEtBQUssS0FBSyxDQUFDO1FBRXZDLEtBQUssTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNoQyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1lBRXhCLFFBQVEsSUFBSSxFQUFFO2dCQUNaLEtBQUssTUFBTSxDQUFDLENBQUM7b0JBQ1gsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQkFDL0QsUUFBUSxLQUFLLENBQUMsS0FBSyxFQUFFO3dCQUNuQixLQUFLLFNBQVMsQ0FBQyxDQUFDOzRCQUNkLE1BQU0sSUFBSSxLQUFLLENBQUM7NEJBQ2hCLE1BQU07eUJBQ1A7d0JBQ0QsS0FBSyxTQUFTLENBQUMsQ0FBQzs0QkFDZCxNQUFNLElBQUksTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDckMsTUFBTTt5QkFDUDt3QkFDRDs0QkFDRSxNQUFNLEtBQUssQ0FDVCwwQkFBMEIsS0FBSyxDQUFDLEtBQUssb0JBQW9CLENBQzFELENBQUM7cUJBQ0w7b0JBQ0QsTUFBTTtpQkFDUDtnQkFDRCxLQUFLLE9BQU8sQ0FBQyxDQUFDO29CQUNaLE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDL0QsUUFBUSxLQUFLLENBQUMsS0FBSyxFQUFFO3dCQUNuQixLQUFLLFNBQVMsQ0FBQyxDQUFDOzRCQUNkLE1BQU0sSUFBSSxLQUFLLENBQUM7NEJBQ2hCLE1BQU07eUJBQ1A7d0JBQ0QsS0FBSyxTQUFTLENBQUMsQ0FBQzs0QkFDZCxNQUFNLElBQUksTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQzs0QkFDM0IsTUFBTTt5QkFDUDt3QkFDRDs0QkFDRSxNQUFNLEtBQUssQ0FDVCwwQkFBMEIsS0FBSyxDQUFDLEtBQUssb0JBQW9CLENBQzFELENBQUM7cUJBQ0w7b0JBQ0QsTUFBTTtpQkFDUDtnQkFDRCxLQUFLLEtBQUssQ0FBQyxDQUFDO29CQUNWLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ3ZELFFBQVEsS0FBSyxDQUFDLEtBQUssRUFBRTt3QkFDbkIsS0FBSyxTQUFTLENBQUMsQ0FBQzs0QkFDZCxNQUFNLElBQUksS0FBSyxDQUFDOzRCQUNoQixNQUFNO3lCQUNQO3dCQUNELEtBQUssU0FBUyxDQUFDLENBQUM7NEJBQ2QsTUFBTSxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7NEJBQzNCLE1BQU07eUJBQ1A7d0JBQ0Q7NEJBQ0UsTUFBTSxLQUFLLENBQ1QsMEJBQTBCLEtBQUssQ0FBQyxLQUFLLG9CQUFvQixDQUMxRCxDQUFDO3FCQUNMO29CQUNELE1BQU07aUJBQ1A7Z0JBQ0QsS0FBSyxNQUFNLENBQUMsQ0FBQztvQkFDWCxJQUFJLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUN2RCxLQUFLLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDdkQsUUFBUSxLQUFLLENBQUMsS0FBSyxFQUFFO3dCQUNuQixLQUFLLFNBQVMsQ0FBQyxDQUFDOzRCQUNkLE1BQU0sSUFBSSxLQUFLLENBQUM7NEJBQ2hCLE1BQU07eUJBQ1A7d0JBQ0QsS0FBSyxTQUFTLENBQUMsQ0FBQzs0QkFDZCxNQUFNLElBQUksTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQzs0QkFDM0IsTUFBTTt5QkFDUDt3QkFDRDs0QkFDRSxNQUFNLEtBQUssQ0FDVCwwQkFBMEIsS0FBSyxDQUFDLEtBQUssb0JBQW9CLENBQzFELENBQUM7cUJBQ0w7b0JBQ0QsTUFBTTtpQkFDUDtnQkFDRCxLQUFLLFFBQVEsQ0FBQyxDQUFDO29CQUNiLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQzdELFFBQVEsS0FBSyxDQUFDLEtBQUssRUFBRTt3QkFDbkIsS0FBSyxTQUFTLENBQUMsQ0FBQzs0QkFDZCxNQUFNLElBQUksS0FBSyxDQUFDOzRCQUNoQixNQUFNO3lCQUNQO3dCQUNELEtBQUssU0FBUyxDQUFDLENBQUM7NEJBQ2QsTUFBTSxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7NEJBQzNCLE1BQU07eUJBQ1A7d0JBQ0Q7NEJBQ0UsTUFBTSxLQUFLLENBQ1QsMEJBQTBCLEtBQUssQ0FBQyxLQUFLLG9CQUFvQixDQUMxRCxDQUFDO3FCQUNMO29CQUNELE1BQU07aUJBQ1A7Z0JBQ0QsS0FBSyxRQUFRLENBQUMsQ0FBQztvQkFDYixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUM3RCxRQUFRLEtBQUssQ0FBQyxLQUFLLEVBQUU7d0JBQ25CLEtBQUssU0FBUyxDQUFDLENBQUM7NEJBQ2QsTUFBTSxJQUFJLEtBQUssQ0FBQzs0QkFDaEIsTUFBTTt5QkFDUDt3QkFDRCxLQUFLLFNBQVMsQ0FBQyxDQUFDOzRCQUNkLE1BQU0sSUFBSSxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDOzRCQUMzQixNQUFNO3lCQUNQO3dCQUNEOzRCQUNFLE1BQU0sS0FBSyxDQUNULDBCQUEwQixLQUFLLENBQUMsS0FBSyxvQkFBb0IsQ0FDMUQsQ0FBQztxQkFDTDtvQkFDRCxNQUFNO2lCQUNQO2dCQUNELEtBQUssa0JBQWtCLENBQUMsQ0FBQztvQkFDdkIsTUFBTSxLQUFLLEdBQUcsR0FBRzt3QkFDZixDQUFDLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFO3dCQUMzQixDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO29CQUMzQixNQUFNLElBQUksTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7b0JBQzdDLE1BQU07aUJBQ1A7Z0JBRUQsS0FBSyxjQUFjLENBQUMsQ0FBQztvQkFFbkIsTUFBTTtpQkFDUDtnQkFDRCxLQUFLLFdBQVcsQ0FBQyxDQUFDO29CQUNoQixNQUFNLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ25FLE1BQU07aUJBQ1A7Z0JBQ0QsS0FBSyxTQUFTLENBQUMsQ0FBQztvQkFDZCxNQUFNLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQztvQkFDdEIsTUFBTTtpQkFDUDtnQkFFRDtvQkFDRSxNQUFNLEtBQUssQ0FBQyxxQkFBcUIsS0FBSyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQzthQUNuRTtTQUNGO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVELFlBQVksQ0FBQyxNQUFjO1FBQ3pCLE1BQU0sS0FBSyxHQUF5QixFQUFFLENBQUM7UUFFdkMsS0FBSyxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2hDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7WUFFeEIsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO1lBQ2YsUUFBUSxLQUFLLENBQUMsSUFBSSxFQUFFO2dCQUNsQixLQUFLLE1BQU0sQ0FBQyxDQUFDO29CQUNYLFFBQVEsS0FBSyxDQUFDLEtBQUssRUFBRTt3QkFDbkIsS0FBSyxTQUFTLENBQUMsQ0FBQzs0QkFDZCxLQUFLLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBVyxDQUFDOzRCQUMvQyxNQUFNO3lCQUNQO3dCQUNELEtBQUssU0FBUyxDQUFDLENBQUM7NEJBQ2QsS0FBSyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQVcsQ0FBQzs0QkFDL0MsTUFBTTt5QkFDUDtxQkFDRjtvQkFDRCxNQUFNO2lCQUNQO2dCQUNELEtBQUssT0FBTyxDQUFDLENBQUM7b0JBQ1osUUFBUSxLQUFLLENBQUMsS0FBSyxFQUFFO3dCQUNuQixLQUFLLFNBQVMsQ0FBQyxDQUFDOzRCQUNkLEtBQUssR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFXLENBQUM7NEJBQy9DLE1BQU07eUJBQ1A7d0JBQ0QsS0FBSyxTQUFTLENBQUMsQ0FBQzs0QkFDZCxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBVyxDQUFDOzRCQUM3QyxNQUFNO3lCQUNQO3dCQUNELEtBQUssUUFBUSxDQUFDLENBQUM7NEJBQ2IsS0FBSyxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQVcsQ0FBQzs0QkFDakQsTUFBTTt5QkFDUDt3QkFDRCxLQUFLLE9BQU8sQ0FBQyxDQUFDOzRCQUNaLEtBQUssR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFXLENBQUM7NEJBQ2pELE1BQU07eUJBQ1A7d0JBQ0QsS0FBSyxNQUFNLENBQUMsQ0FBQzs0QkFDWCxLQUFLLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBVyxDQUFDOzRCQUNqRCxNQUFNO3lCQUNQO3dCQUNEOzRCQUNFLE1BQU0sS0FBSyxDQUNULHVCQUF1QixLQUFLLENBQUMsS0FBSyxvQkFBb0IsQ0FDdkQsQ0FBQztxQkFDTDtvQkFDRCxNQUFNO2lCQUNQO2dCQUNELEtBQUssS0FBSyxDQUFDLENBQUM7b0JBQ1YsUUFBUSxLQUFLLENBQUMsS0FBSyxFQUFFO3dCQUNuQixLQUFLLFNBQVMsQ0FBQyxDQUFDOzRCQUNkLEtBQUssR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFXLENBQUM7NEJBQy9DLE1BQU07eUJBQ1A7d0JBQ0QsS0FBSyxTQUFTLENBQUMsQ0FBQzs0QkFDZCxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBVyxDQUFDOzRCQUM3QyxNQUFNO3lCQUNQO3dCQUNEOzRCQUNFLE1BQU0sS0FBSyxDQUNULHVCQUF1QixLQUFLLENBQUMsS0FBSyxvQkFBb0IsQ0FDdkQsQ0FBQztxQkFDTDtvQkFDRCxNQUFNO2lCQUNQO2dCQUNELEtBQUssTUFBTSxDQUFDLENBQUM7b0JBQ1gsUUFBUSxLQUFLLENBQUMsS0FBSyxFQUFFO3dCQUNuQixLQUFLLFNBQVMsQ0FBQyxDQUFDOzRCQUNkLEtBQUssR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFXLENBQUM7NEJBQy9DLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxFQUFFO2dDQUN4QyxPQUFPLENBQUMsS0FBSyxDQUNYLCtEQUErRCxDQUNoRSxDQUFDOzZCQUNIOzRCQUNELE1BQU07eUJBQ1A7d0JBQ0QsS0FBSyxTQUFTLENBQUMsQ0FBQzs0QkFDZCxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBVyxDQUFDOzRCQUM3QyxJQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQ0FDeEMsT0FBTyxDQUFDLEtBQUssQ0FDWCxpRUFBaUUsQ0FDbEUsQ0FBQzs2QkFDSDs0QkFDRCxNQUFNO3lCQUNQO3dCQUNEOzRCQUNFLE1BQU0sS0FBSyxDQUNULHVCQUF1QixLQUFLLENBQUMsS0FBSyxvQkFBb0IsQ0FDdkQsQ0FBQztxQkFDTDtvQkFDRCxNQUFNO2lCQUNQO2dCQUNELEtBQUssUUFBUSxDQUFDLENBQUM7b0JBQ2IsUUFBUSxLQUFLLENBQUMsS0FBSyxFQUFFO3dCQUNuQixLQUFLLFNBQVMsQ0FBQyxDQUFDOzRCQUNkLEtBQUssR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFXLENBQUM7NEJBQy9DLE1BQU07eUJBQ1A7d0JBQ0QsS0FBSyxTQUFTLENBQUMsQ0FBQzs0QkFDZCxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBVyxDQUFDOzRCQUM3QyxNQUFNO3lCQUNQO3dCQUNEOzRCQUNFLE1BQU0sS0FBSyxDQUNULHVCQUF1QixLQUFLLENBQUMsS0FBSyxvQkFBb0IsQ0FDdkQsQ0FBQztxQkFDTDtvQkFDRCxNQUFNO2lCQUNQO2dCQUNELEtBQUssUUFBUSxDQUFDLENBQUM7b0JBQ2IsUUFBUSxLQUFLLENBQUMsS0FBSyxFQUFFO3dCQUNuQixLQUFLLFNBQVMsQ0FBQyxDQUFDOzRCQUNkLEtBQUssR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFXLENBQUM7NEJBQy9DLE1BQU07eUJBQ1A7d0JBQ0QsS0FBSyxTQUFTLENBQUMsQ0FBQzs0QkFDZCxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBVyxDQUFDOzRCQUM3QyxNQUFNO3lCQUNQO3dCQUNEOzRCQUNFLE1BQU0sS0FBSyxDQUNULHVCQUF1QixLQUFLLENBQUMsS0FBSyxvQkFBb0IsQ0FDdkQsQ0FBQztxQkFDTDtvQkFDRCxNQUFNO2lCQUNQO2dCQUNELEtBQUssa0JBQWtCLENBQUMsQ0FBQztvQkFDdkIsS0FBSyxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FDcEQsRUFBRSxDQUFDLENBQUMsQ0FBVyxDQUFDO29CQUNsQixNQUFNO2lCQUNQO2dCQUNELEtBQUssY0FBYyxDQUFDLENBQUM7b0JBQ25CLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBZSxDQUFDO29CQUM5QixNQUFNO2lCQUNQO2dCQUNELEtBQUssV0FBVyxDQUFDLENBQUM7b0JBQ2hCLEtBQUssR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFXLENBQUM7b0JBQzlDLE1BQU07aUJBQ1A7Z0JBQ0QsS0FBSyxTQUFTLENBQUMsQ0FBQztvQkFDZCxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBZSxDQUFDLEVBQUU7d0JBQzdDLE1BQU0sS0FBSyxDQUNULFlBQVksS0FBSyxDQUFDLEtBQUssZ0JBQWdCLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQzlELENBQUM7cUJBQ0g7b0JBQ0QsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFlLENBQUM7b0JBQzlCLE1BQU07aUJBQ1A7Z0JBRUQ7b0JBQ0UsTUFBTSxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO2FBQy9DO1lBRUQsSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDVixNQUFNLEtBQUssQ0FDVCwrQkFBK0IsSUFBSSxJQUFJLEtBQUssTUFDMUMsTUFBTSxDQUFDLEtBQUssQ0FDVixDQUFDLEVBQ0QsRUFBRSxDQUVOLEVBQUUsQ0FDSCxDQUFDO2FBQ0g7WUFDRCxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFFNUIsTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3JDO1FBRUQsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFO1lBQ2pCLE1BQU0sS0FBSyxDQUNULHlDQUF5QyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUMvRCxDQUFDO1NBQ0g7UUFFRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFHRCxzQkFBc0IsQ0FBQyxLQUEyQjtRQUNoRCxJQUFJLE1BQU0sR0FBeUIsRUFBRSxDQUFDO1FBQ3RDLE1BQU0sU0FBUyxHQUFHO1lBQ2hCLE1BQU07WUFDTixPQUFPO1lBQ1AsS0FBSztZQUNMLE1BQU07WUFDTixRQUFRO1lBQ1IsUUFBUTtZQUNSLGtCQUFrQjtTQUNuQixDQUFDO1FBQ0YsS0FBSyxNQUFNLElBQUksSUFBSSxTQUFTLEVBQUU7WUFDNUIsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQztZQUMxRCxJQUFJLE9BQU8sS0FBSyxDQUFDLENBQUMsRUFBRTtnQkFDbEIsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNsRDtTQUNGO1FBQ0QsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDOUIsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVELFdBQVcsQ0FBQyxLQUEyQjtRQUNyQyxNQUFNLElBQUksR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO1FBQ3hCLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQ3BCLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLGNBQWMsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FDL0QsQ0FBQztRQUVGLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMvRCxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRTtZQUN4QixRQUFRLElBQUksQ0FBQyxJQUFJLEVBQUU7Z0JBQ2pCLEtBQUssTUFBTSxDQUFDLENBQUM7b0JBQ1gsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO29CQUNuRCxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzNELE1BQU07aUJBQ1A7Z0JBQ0QsS0FBSyxPQUFPLENBQUMsQ0FBQztvQkFDWixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDckMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNyRCxNQUFNO2lCQUNQO2dCQUNELEtBQUssS0FBSyxDQUFDLENBQUM7b0JBQ1YsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDakMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNuRCxNQUFNO2lCQUNQO2dCQUNELEtBQUssTUFBTSxDQUFDLENBQUM7b0JBQ1gsSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDL0IsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FDMUIsQ0FBQyxJQUF3QixFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLFdBQVcsQ0FDeEQsQ0FBQztvQkFDRixJQUFJLFNBQVMsRUFBRSxLQUFLLEtBQUssSUFBSTt3QkFBRSxLQUFLLElBQUksRUFBRSxDQUFDO29CQUMzQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3JELE1BQU07aUJBQ1A7Z0JBQ0QsS0FBSyxRQUFRLENBQUMsQ0FBQztvQkFDYixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNqQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3pELE1BQU07aUJBQ1A7Z0JBQ0QsS0FBSyxRQUFRLENBQUMsQ0FBQztvQkFDYixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNqQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3pELE1BQU07aUJBQ1A7Z0JBQ0QsS0FBSyxrQkFBa0IsQ0FBQyxDQUFDO29CQUN2QixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNqQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDbkUsTUFBTTtpQkFDUDthQUNGO1NBQ0Y7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxLQUFLLENBQUMsTUFBYztRQUNsQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3hDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyRCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDckMsQ0FBQztDQUNGIn0=