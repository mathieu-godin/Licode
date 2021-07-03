import { Type } from "../type.ts";
export const undefinedType = new Type("tag:yaml.org,2002:js/undefined", {
    kind: "scalar",
    resolve() {
        return true;
    },
    construct() {
        return undefined;
    },
    predicate(object) {
        return typeof object === "undefined";
    },
    represent() {
        return "";
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5kZWZpbmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQDAuOTkuMC9lbmNvZGluZy9feWFtbC90eXBlL3VuZGVmaW5lZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFLQSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBRWxDLE1BQU0sQ0FBQyxNQUFNLGFBQWEsR0FBRyxJQUFJLElBQUksQ0FBQyxnQ0FBZ0MsRUFBRTtJQUN0RSxJQUFJLEVBQUUsUUFBUTtJQUNkLE9BQU87UUFDTCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFDRCxTQUFTO1FBQ1AsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztJQUNELFNBQVMsQ0FBQyxNQUFNO1FBQ2QsT0FBTyxPQUFPLE1BQU0sS0FBSyxXQUFXLENBQUM7SUFDdkMsQ0FBQztJQUNELFNBQVM7UUFDUCxPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7Q0FDRixDQUFDLENBQUMifQ==