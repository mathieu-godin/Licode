export function normalize(args) {
    const normalized = [];
    let inLiteral = false;
    for (const arg of args) {
        if (inLiteral) {
            normalized.push(arg);
        }
        else if (arg === "--") {
            inLiteral = true;
            normalized.push(arg);
        }
        else if (arg.length > 1 && arg[0] === "-") {
            const isLong = arg[1] === "-";
            const isDotted = !isLong && arg[2] === ".";
            if (arg.includes("=")) {
                const parts = arg.split("=");
                const flag = parts.shift();
                if (isLong) {
                    normalized.push(flag);
                }
                else {
                    normalizeShortFlags(flag);
                }
                normalized.push(parts.join("="));
            }
            else if (isLong || isDotted) {
                normalized.push(arg);
            }
            else {
                normalizeShortFlags(arg);
            }
        }
        else {
            normalized.push(arg);
        }
    }
    return normalized;
    function normalizeShortFlags(flag) {
        const flags = flag.slice(1).split("");
        if (isNaN(Number(flag[flag.length - 1]))) {
            flags.forEach((val) => normalized.push(`-${val}`));
        }
        else {
            normalized.push(`-${flags.shift()}`);
            normalized.push(flags.join(""));
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9ybWFsaXplLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cHM6Ly9kZW5vLmxhbmQveC9jbGlmZnlAdjAuMTkuMi9mbGFncy9ub3JtYWxpemUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBSUEsTUFBTSxVQUFVLFNBQVMsQ0FBQyxJQUFjO0lBQ3RDLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQztJQUN0QixJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7SUFFdEIsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLEVBQUU7UUFDdEIsSUFBSSxTQUFTLEVBQUU7WUFDYixVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3RCO2FBQU0sSUFBSSxHQUFHLEtBQUssSUFBSSxFQUFFO1lBQ3ZCLFNBQVMsR0FBRyxJQUFJLENBQUM7WUFDakIsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUN0QjthQUFNLElBQUksR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtZQUMzQyxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDO1lBQzlCLE1BQU0sUUFBUSxHQUFHLENBQUMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUM7WUFFM0MsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNyQixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUM3QixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsS0FBSyxFQUFZLENBQUM7Z0JBRXJDLElBQUksTUFBTSxFQUFFO29CQUNWLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQ3ZCO3FCQUFNO29CQUNMLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUMzQjtnQkFDRCxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzthQUNsQztpQkFBTSxJQUFJLE1BQU0sSUFBSSxRQUFRLEVBQUU7Z0JBQzdCLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDdEI7aUJBQU07Z0JBQ0wsbUJBQW1CLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDMUI7U0FDRjthQUFNO1lBQ0wsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUN0QjtLQUNGO0lBRUQsT0FBTyxVQUFVLENBQUM7SUFNbEIsU0FBUyxtQkFBbUIsQ0FBQyxJQUFZO1FBQ3ZDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRXRDLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDeEMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUNwRDthQUFNO1lBQ0wsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDckMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDakM7SUFDSCxDQUFDO0FBQ0gsQ0FBQyJ9