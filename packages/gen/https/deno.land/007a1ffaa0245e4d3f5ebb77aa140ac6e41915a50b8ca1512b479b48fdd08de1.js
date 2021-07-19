import { getDefaultValue, getOption, paramCaseToCamelCase } from "./_utils.ts";
import { ConflictingOption, DependingOption, MissingOptionValue, MissingRequiredOption, NoArguments, OptionNotCombinable, UnknownOption, } from "./_errors.ts";
export function validateFlags(flags, values, _knownFlaks, allowEmpty, optionNames = {}) {
    const defaultValues = {};
    for (const option of flags) {
        let name;
        let defaultValue = undefined;
        if (option.name.startsWith("no-")) {
            const propName = option.name.replace(/^no-/, "");
            if (propName in values) {
                continue;
            }
            const positiveOption = getOption(flags, propName);
            if (positiveOption) {
                continue;
            }
            name = paramCaseToCamelCase(propName);
            defaultValue = true;
        }
        if (!name) {
            name = paramCaseToCamelCase(option.name);
        }
        if (!(name in optionNames)) {
            optionNames[name] = option.name;
        }
        const hasDefaultValue = typeof values[name] === "undefined" && (typeof option.default !== "undefined" ||
            typeof defaultValue !== "undefined");
        if (hasDefaultValue) {
            values[name] = getDefaultValue(option) ?? defaultValue;
            defaultValues[option.name] = true;
            if (typeof option.value === "function") {
                values[name] = option.value(values[name]);
            }
        }
    }
    const keys = Object.keys(values);
    if (keys.length === 0 && allowEmpty) {
        return;
    }
    const options = keys.map((name) => ({
        name,
        option: getOption(flags, optionNames[name]),
    }));
    for (const { name, option } of options) {
        if (!option) {
            throw new UnknownOption(name, flags);
        }
        if (option.standalone) {
            if (keys.length > 1) {
                if (options.every(({ option: opt }) => opt &&
                    (option === opt || defaultValues[opt.name]))) {
                    return;
                }
                throw new OptionNotCombinable(option.name);
            }
            return;
        }
        option.conflicts?.forEach((flag) => {
            if (isset(flag, values)) {
                throw new ConflictingOption(option.name, flag);
            }
        });
        option.depends?.forEach((flag) => {
            if (!isset(flag, values) && !defaultValues[option.name]) {
                throw new DependingOption(option.name, flag);
            }
        });
        const isArray = (option.args?.length || 0) > 1;
        option.args?.forEach((arg, i) => {
            if (arg.requiredValue &&
                (typeof values[name] === "undefined" ||
                    (isArray &&
                        typeof values[name][i] === "undefined"))) {
                throw new MissingOptionValue(option.name);
            }
        });
    }
    for (const option of flags) {
        if (option.required && !(paramCaseToCamelCase(option.name) in values)) {
            if ((!option.conflicts ||
                !option.conflicts.find((flag) => !!values[flag])) &&
                !options.find((opt) => opt.option?.conflicts?.find((flag) => flag === option.name))) {
                throw new MissingRequiredOption(option.name);
            }
        }
    }
    if (keys.length === 0 && !allowEmpty) {
        throw new NoArguments();
    }
}
function isset(flag, values) {
    const name = paramCaseToCamelCase(flag);
    return typeof values[name] !== "undefined";
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGVfZmxhZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJodHRwczovL2Rlbm8ubGFuZC94L2NsaWZmeUB2MC4xOS4yL2ZsYWdzL3ZhbGlkYXRlX2ZsYWdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxlQUFlLEVBQUUsU0FBUyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQy9FLE9BQU8sRUFDTCxpQkFBaUIsRUFDakIsZUFBZSxFQUNmLGtCQUFrQixFQUNsQixxQkFBcUIsRUFDckIsV0FBVyxFQUNYLG1CQUFtQixFQUNuQixhQUFhLEdBQ2QsTUFBTSxjQUFjLENBQUM7QUFvQnRCLE1BQU0sVUFBVSxhQUFhLENBQzNCLEtBQXFCLEVBQ3JCLE1BQStCLEVBQy9CLFdBQXFDLEVBQ3JDLFVBQW9CLEVBQ3BCLGNBQXNDLEVBQUU7SUFFeEMsTUFBTSxhQUFhLEdBQTRCLEVBQUUsQ0FBQztJQUdsRCxLQUFLLE1BQU0sTUFBTSxJQUFJLEtBQUssRUFBRTtRQUMxQixJQUFJLElBQXdCLENBQUM7UUFDN0IsSUFBSSxZQUFZLEdBQVksU0FBUyxDQUFDO1FBR3RDLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDakMsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2pELElBQUksUUFBUSxJQUFJLE1BQU0sRUFBRTtnQkFDdEIsU0FBUzthQUNWO1lBQ0QsTUFBTSxjQUFjLEdBQUcsU0FBUyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNsRCxJQUFJLGNBQWMsRUFBRTtnQkFDbEIsU0FBUzthQUNWO1lBQ0QsSUFBSSxHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3RDLFlBQVksR0FBRyxJQUFJLENBQUM7U0FDckI7UUFFRCxJQUFJLENBQUMsSUFB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