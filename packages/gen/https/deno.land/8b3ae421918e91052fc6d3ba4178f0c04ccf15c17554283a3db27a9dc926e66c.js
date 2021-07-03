export function buildFlags(options) {
    const flags = [];
    if (options.allow) {
        if (Array.isArray(options.allow)) {
            options.allow.forEach((flag) => flags.push(`--allow-${flag}`));
        }
        else if (options.allow === "all") {
            flags.push(`--allow-all`);
        }
        else if (typeof options.allow === "object") {
            Object.entries(options.allow).map(([flag, value]) => {
                if (!value || (typeof value === "boolean" && value)) {
                    flags.push(`--allow-${flag}`);
                }
                else {
                    flags.push(`--allow-${flag}=${value}`);
                }
            });
        }
    }
    if (options.importmap) {
        flags.push("--importmap");
        flags.push(options.importmap);
    }
    if (options.lock) {
        flags.push("--lock");
        flags.push(options.lock);
    }
    if (options.log) {
        flags.push("--log-level");
        flags.push(options.log);
    }
    if (options.tsconfig) {
        flags.push("--config");
        flags.push(options.tsconfig);
    }
    if (options.cert) {
        flags.push("--cert");
        flags.push(options.cert);
    }
    if (options.inspect) {
        flags.push(`--inspect=${options.inspect}`);
    }
    if (options.inspectBrk) {
        flags.push(`--inspect-brk=${options.inspectBrk}`);
    }
    if (options.noCheck) {
        flags.push("--no-check");
    }
    if (options.unstable) {
        flags.push("--unstable");
    }
    return flags;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NyaXB0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZGVub25AMi40Ljgvc3JjL3NjcmlwdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBeUdBLE1BQU0sVUFBVSxVQUFVLENBQUMsT0FBc0I7SUFDL0MsTUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO0lBQzNCLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRTtRQUNqQixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ2hDLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQ2hFO2FBQU0sSUFBSSxPQUFPLENBQUMsS0FBSyxLQUFLLEtBQUssRUFBRTtZQUNsQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1NBQzNCO2FBQU0sSUFBSSxPQUFPLE9BQU8sQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUFFO1lBQzVDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUU7Z0JBQ2xELElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxPQUFPLEtBQUssS0FBSyxTQUFTLElBQUksS0FBSyxDQUFDLEVBQUU7b0JBQ25ELEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2lCQUMvQjtxQkFBTTtvQkFDTCxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDLENBQUM7aUJBQ3hDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7U0FDSjtLQUNGO0lBQ0QsSUFBSSxPQUFPLENBQUMsU0FBUyxFQUFFO1FBQ3JCLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDMUIsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDL0I7SUFDRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUU7UUFDaEIsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyQixLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUMxQjtJQUNELElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRTtRQUNmLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDMUIsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDekI7SUFDRCxJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQUU7UUFDcEIsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN2QixLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUM5QjtJQUNELElBQUksT0FBTyxDQUFDLElBQUksRUFBRTtRQUNoQixLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3JCLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQzFCO0lBQ0QsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFO1FBQ25CLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztLQUM1QztJQUNELElBQUksT0FBTyxDQUFDLFVBQVUsRUFBRTtRQUN0QixLQUFLLENBQUMsSUFBSSxDQUFDLGlCQUFpQixPQUFPLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztLQUNuRDtJQUNELElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRTtRQUNuQixLQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0tBQzFCO0lBQ0QsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFO1FBQ3BCLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7S0FDMUI7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMifQ==