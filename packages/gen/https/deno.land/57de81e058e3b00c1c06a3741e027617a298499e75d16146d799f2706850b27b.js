import { KeyMap, KeyMapCtrl, KeyMapShift, SpecialKeyMap } from "./key_codes.ts";
const kUTF16SurrogateThreshold = 0x10000;
const kEscape = "\x1b";
export function parse(data) {
    let index = -1;
    const keys = [];
    const input = data instanceof Uint8Array
        ? new TextDecoder().decode(data)
        : data;
    const hasNext = () => input.length - 1 >= index + 1;
    const next = () => input[++index];
    parseNext();
    return keys;
    function parseNext() {
        let ch = next();
        let s = ch;
        let escaped = false;
        const key = {
            name: undefined,
            sequence: undefined,
            code: undefined,
            ctrl: false,
            meta: false,
            shift: false,
        };
        if (ch === kEscape && hasNext()) {
            escaped = true;
            s += (ch = next());
            if (ch === kEscape) {
                s += (ch = next());
            }
        }
        if (escaped && (ch === "O" || ch === "[")) {
            let code = ch;
            let modifier = 0;
            if (ch === "O") {
                s += (ch = next());
                if (ch >= "0" && ch <= "9") {
                    modifier = (Number(ch) >> 0) - 1;
                    s += (ch = next());
                }
                code += ch;
            }
            else if (ch === "[") {
                s += (ch = next());
                if (ch === "[") {
                    code += ch;
                    s += (ch = next());
                }
                const cmdStart = s.length - 1;
                if (ch >= "0" && ch <= "9") {
                    s += (ch = next());
                    if (ch >= "0" && ch <= "9") {
                        s += (ch = next());
                    }
                }
                if (ch === ";") {
                    s += (ch = next());
                    if (ch >= "0" && ch <= "9") {
                        s += next();
                    }
                }
                const cmd = s.slice(cmdStart);
                let match;
                if ((match = cmd.match(/^(\d\d?)(;(\d))?([~^$])$/))) {
                    code += match[1] + match[4];
                    modifier = (Number(match[3]) || 1) - 1;
                }
                else if ((match = cmd.match(/^((\d;)?(\d))?([A-Za-z])$/))) {
                    code += match[4];
                    modifier = (Number(match[3]) || 1) - 1;
                }
                else {
                    code += cmd;
                }
            }
            key.ctrl = !!(modifier & 4);
            key.meta = !!(modifier & 10);
            key.shift = !!(modifier & 1);
            key.code = code;
            if (code in KeyMap) {
                key.name = KeyMap[code];
            }
            else if (code in KeyMapShift) {
                key.name = KeyMapShift[code];
                key.shift = true;
            }
            else if (code in KeyMapCtrl) {
                key.name = KeyMapCtrl[code];
                key.ctrl = true;
            }
            else {
                key.name = "undefined";
            }
        }
        else if (ch in SpecialKeyMap) {
            key.name = SpecialKeyMap[ch];
            key.meta = escaped;
        }
        else if (!escaped && ch <= "\x1a") {
            key.name = String.fromCharCode(ch.charCodeAt(0) + "a".charCodeAt(0) - 1);
            key.ctrl = true;
        }
        else if (/^[0-9A-Za-z]$/.test(ch)) {
            key.name = ch.toLowerCase();
            key.shift = /^[A-Z]$/.test(ch);
            key.meta = escaped;
        }
        else if (escaped) {
            key.name = ch.length ? undefined : "escape";
            key.meta = true;
        }
        key.sequence = s;
        if (s.length !== 0 && (key.name !== undefined || escaped)) {
            keys.push(key);
        }
        else if (charLengthAt(s, 0) === s.length) {
            keys.push(key);
        }
        else {
            throw new Error("Unrecognized or broken escape sequence");
        }
        if (hasNext()) {
            parseNext();
        }
    }
}
function charLengthAt(str, i) {
    const pos = str.codePointAt(i);
    if (typeof pos === "undefined") {
        return 1;
    }
    return pos >= kUTF16SurrogateThreshold ? 2 : 1;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5X2NvZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJrZXlfY29kZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFLaEYsTUFBTSx3QkFBd0IsR0FBRyxPQUFPLENBQUM7QUFDekMsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDO0FBd0J2QixNQUFNLFVBQVUsS0FBSyxDQUFDLElBQXlCO0lBNEI3QyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNmLE1BQU0sSUFBSSxHQUFjLEVBQUUsQ0FBQztJQUMzQixNQUFNLEtBQUssR0FBVyxJQUFJLFlBQVksVUFBVTtRQUM5QyxDQUFDLENBQUMsSUFBSSxXQUFXLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFFVCxNQUFNLE9BQU8sR0FBRyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ3BELE1BQU0sSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRWxDLFNBQVMsRUFBRSxDQUFDO0lBRVosT0FBTyxJQUFJLENBQUM7SUFFWixTQUFTLFNBQVM7UUFDaEIsSUFBSSxFQUFFLEdBQVcsSUFBSSxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLEdBQVcsRUFBRSxDQUFDO1FBQ25CLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztRQUVwQixNQUFNLEdBQUcsR0FBWTtZQUNuQixJQUFJLEVBQUUsU0FBUztZQUNmLFFBQVEsRUFBRSxTQUFTO1lBQ25CLElBQUksRUFBRSxTQUFTO1lBQ2YsSUFBSSxFQUFFLEtBQUs7WUFDWCxJQUFJLEVBQUUsS0FBSztZQUNYLEtBQUssRUFBRSxLQUFL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