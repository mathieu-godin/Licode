import { didYouMean } from "../flags/_utils.ts";
import { ArgumentFollowsVariadicArgument, RequiredArgumentFollowsOptionalArgument, } from "../flags/_errors.ts";
import { OptionType } from "../flags/types.ts";
export function getPermissions() {
    return hasPermissions([
        "env",
        "hrtime",
        "net",
        "plugin",
        "read",
        "run",
        "write",
    ]);
}
export function isUnstable() {
    return !!Deno.permissions;
}
export function didYouMeanCommand(command, commands, excludes = []) {
    const commandNames = commands
        .map((command) => command.getName())
        .filter((command) => !excludes.includes(command));
    return didYouMean(" Did you mean command", command, commandNames);
}
export async function hasPermission(permission) {
    try {
        return (await Deno.permissions?.query?.({ name: permission }))
            ?.state === "granted";
    }
    catch {
        return false;
    }
}
async function hasPermissions(names) {
    const permissions = {};
    await Promise.all(names.map((name) => hasPermission(name).then((hasPermission) => permissions[name] = hasPermission)));
    return permissions;
}
const ARGUMENT_REGEX = /^[<\[].+[\]>]$/;
const ARGUMENT_DETAILS_REGEX = /[<\[:>\]]/;
export function splitArguments(args) {
    const parts = args.trim().split(/[, =] */g);
    const typeParts = [];
    while (parts[parts.length - 1] &&
        ARGUMENT_REGEX.test(parts[parts.length - 1])) {
        typeParts.unshift(parts.pop());
    }
    const typeDefinition = typeParts.join(" ");
    return { flags: parts, typeDefinition };
}
export function parseArgumentsDefinition(argsDefinition) {
    const argumentDetails = [];
    let hasOptional = false;
    let hasVariadic = false;
    const parts = argsDefinition.split(/ +/);
    for (const arg of parts) {
        if (hasVariadic) {
            throw new ArgumentFollowsVariadicArgument(arg);
        }
        const parts = arg.split(ARGUMENT_DETAILS_REGEX);
        const type = parts[2] || OptionType.STRING;
        const details = {
            optionalValue: arg[0] !== "<",
            name: parts[1],
            action: parts[3] || type,
            variadic: false,
            list: type ? arg.indexOf(type + "[]") !== -1 : false,
            type,
        };
        if (!details.optionalValue && hasOptional) {
            throw new RequiredArgumentFollowsOptionalArgument(details.name);
        }
        if (arg[0] === "[") {
            hasOptional = true;
        }
        if (details.name.length > 3) {
            const istVariadicLeft = details.name.slice(0, 3) === "...";
            const istVariadicRight = details.name.slice(-3) === "...";
            hasVariadic = details.variadic = istVariadicLeft || istVariadicRight;
            if (istVariadicLeft) {
                details.name = details.name.slice(3);
            }
            else if (istVariadicRight) {
                details.name = details.name.slice(0, -3);
            }
        }
        if (details.name) {
            argumentDetails.push(details);
        }
    }
    return argumentDetails;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3V0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cHM6Ly9kZW5vLmxhbmQveC9jbGlmZnlAdjAuMTkuMi9jb21tYW5kL191dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFDaEQsT0FBTyxFQUNMLCtCQUErQixFQUMvQix1Q0FBdUMsR0FDeEMsTUFBTSxxQkFBcUIsQ0FBQztBQUM3QixPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFhL0MsTUFBTSxVQUFVLGNBQWM7SUFDNUIsT0FBTyxjQUFjLENBQUM7UUFDcEIsS0FBSztRQUNMLFFBQVE7UUFDUixLQUFLO1FBQ0wsUUFBUTtRQUNSLE1BQU07UUFDTixLQUFLO1FBQ0wsT0FBTztLQUNSLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxNQUFNLFVBQVUsVUFBVTtJQUV4QixPQUFPLENBQUMsQ0FBRSxJQUFZLENBQUMsV0FBVyxDQUFDO0FBQ3JDLENBQUM7QUFFRCxNQUFNLFVBQVUsaUJBQWlCLENBQy9CLE9BQWUsRUFDZixRQUF3QixFQUN4QixXQUEwQixFQUFFO0lBRTVCLE1BQU0sWUFBWSxHQUFHLFFBQVE7U0FDMUIsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDbkMsTUFBTSxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUNwRCxPQUFPLFVBQVUsQ0FBQyx1QkFBdUIsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7QUFDcEUsQ0FBQztBQUVELE1BQU0sQ0FBQyxLQUFLLFVBQVUsYUFBYSxDQUNqQyxVQUEwQjtJQUUxQixJQUFJO1FBRUYsT0FBTyxDQUFDLE1BQU8sSUFBWSxDQUFDLFdBQVcsRUFBRSxLQUFLLEVB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