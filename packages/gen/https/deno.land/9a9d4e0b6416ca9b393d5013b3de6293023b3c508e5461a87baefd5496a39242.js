import { Type } from "../type.ts";
function resolveYamlNull(data) {
    const max = data.length;
    return ((max === 1 && data === "~") ||
        (max === 4 && (data === "null" || data === "Null" || data === "NULL")));
}
function constructYamlNull() {
    return null;
}
function isNull(object) {
    return object === null;
}
export const nil = new Type("tag:yaml.org,2002:null", {
    construct: constructYamlNull,
    defaultStyle: "lowercase",
    kind: "scalar",
    predicate: isNull,
    represent: {
        canonical() {
            return "~";
        },
        lowercase() {
            return "null";
        },
        uppercase() {
            return "NULL";
        },
        camelcase() {
            return "Null";
        },
    },
    resolve: resolveYamlNull,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmlsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQDAuOTkuMC9lbmNvZGluZy9feWFtbC90eXBlL25pbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFLQSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBRWxDLFNBQVMsZUFBZSxDQUFDLElBQVk7SUFDbkMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUV4QixPQUFPLENBQ0wsQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxHQUFHLENBQUM7UUFDM0IsQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUN2RSxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsaUJBQWlCO0lBQ3hCLE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELFNBQVMsTUFBTSxDQUFDLE1BQWU7SUFDN0IsT0FBTyxNQUFNLEtBQUssSUFBSSxDQUFDO0FBQ3pCLENBQUM7QUFFRCxNQUFNLENBQUMsTUFBTSxHQUFHLEdBQUcsSUFBSSxJQUFJLENBQUMsd0JBQXdCLEVBQUU7SUFDcEQsU0FBUyxFQUFFLGlCQUFpQjtJQUM1QixZQUFZLEVBQUUsV0FBVztJQUN6QixJQUFJLEVBQUUsUUFBUTtJQUNkLFNBQVMsRUFBRSxNQUFNO0lBQ2pCLFNBQVMsRUFBRTtRQUNULFNBQVM7WUFDUCxPQUFPLEdBQUcsQ0FBQztRQUNiLENBQUM7UUFDRCxTQUFTO1lBQ1AsT0FBTyxNQUFNLENBQUM7UUFDaEIsQ0FBQztRQUNELFNBQVM7WUFDUCxPQUFPLE1BQU0sQ0FBQztRQUNoQixDQUFDO1FBQ0QsU0FBUztZQUNQLE9BQU8sTUFBTSxDQUFDO1FBQ2hCLENBQUM7S0FDRjtJQUNELE9BQU8sRUFBRSxlQUFlO0NBQ3pCLENBQUMsQ0FBQyJ9