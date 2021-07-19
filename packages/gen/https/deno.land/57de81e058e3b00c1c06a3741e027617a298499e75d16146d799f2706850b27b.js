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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5X2NvZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJodHRwczovL2Rlbm8ubGFuZC94L2NsaWZmeUB2MC4xOS4yL2tleWNvZGUva2V5X2NvZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBS2hGLE1BQU0sd0JBQXdCLEdBQUcsT0FBTyxDQUFDO0FBQ3pDLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQztBQXdCdkIsTUFBTSxVQUFVLEtBQUssQ0FBQyxJQUF5QjtJQTRCN0MsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDZixNQUFNLElBQUksR0FBYyxFQUFFLENBQUM7SUFDM0IsTUFBTSxLQUFLLEdBQVcsSUFBSSxZQUFZLFVBQVU7UUFDOUMsQ0FBQyxDQUFDLElBQUksV0FBVyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBRVQsTUFBTSxPQUFPLEdBQUcsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztJQUNwRCxNQUFNLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVsQyxTQUFTLEVBQUUsQ0FBQztJQUVaLE9BQU8sSUFBSSxDQUFDO0lBRVosU0FBUyxTQUFTO1FBQ2hCLElBQUksRUFBRSxHQUFXLElBQUksRUFBRSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxHQUFXLEVBQUUsQ0FBQztRQUNuQixJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFFcEIsTUFBTSxHQUFHLEdBQVk7WUFDbkIsSUFBSSxFQUFFLFNBQVM7WUFDZixRQUFRLEVBQUUsU0FBUztZQUNuQixJQUFJLEVBQUUsU0FBUztZQUNmLElBQUksRUFBRSxL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