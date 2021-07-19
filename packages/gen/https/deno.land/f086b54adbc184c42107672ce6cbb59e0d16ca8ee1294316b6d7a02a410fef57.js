import { didYouMeanOption, didYouMeanType, getFlag } from "./_utils.ts";
export class FlagsError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, FlagsError.prototype);
    }
}
export class UnknownRequiredOption extends FlagsError {
    constructor(option, options) {
        super(`Unknown required option "${getFlag(option)}".${didYouMeanOption(option, options)}`);
        Object.setPrototypeOf(this, UnknownRequiredOption.prototype);
    }
}
export class UnknownConflictingOption extends FlagsError {
    constructor(option, options) {
        super(`Unknown conflicting option "${getFlag(option)}".${didYouMeanOption(option, options)}`);
        Object.setPrototypeOf(this, UnknownConflictingOption.prototype);
    }
}
export class UnknownType extends FlagsError {
    constructor(type, types) {
        super(`Unknown type "${type}".${didYouMeanType(type, types)}`);
        Object.setPrototypeOf(this, UnknownType.prototype);
    }
}
export class ValidationError extends FlagsError {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
export class DuplicateOption extends ValidationError {
    constructor(name) {
        super(`Option "${getFlag(name).replace(/^--no-/, "--")}" can only occur once, but was found several times.`);
        Object.setPrototypeOf(this, DuplicateOption.prototype);
    }
}
export class UnknownOption extends ValidationError {
    constructor(option, options) {
        super(`Unknown option "${getFlag(option)}".${didYouMeanOption(option, options)}`);
        Object.setPrototypeOf(this, UnknownOption.prototype);
    }
}
export class MissingOptionValue extends ValidationError {
    constructor(option) {
        super(`Missing value for option "${getFlag(option)}".`);
        Object.setPrototypeOf(this, MissingOptionValue.prototype);
    }
}
export class InvalidOptionValue extends ValidationError {
    constructor(option, expected, value) {
        super(`Option "${getFlag(option)}" must be of type "${expected}", but got "${value}".`);
        Object.setPrototypeOf(this, InvalidOptionValue.prototype);
    }
}
export class OptionNotCombinable extends ValidationError {
    constructor(option) {
        super(`Option "${getFlag(option)}" cannot be combined with other options.`);
        Object.setPrototypeOf(this, OptionNotCombinable.prototype);
    }
}
export class ConflictingOption extends ValidationError {
    constructor(option, conflictingOption) {
        super(`Option "${getFlag(option)}" conflicts with option "${getFlag(conflictingOption)}".`);
        Object.setPrototypeOf(this, ConflictingOption.prototype);
    }
}
export class DependingOption extends ValidationError {
    constructor(option, dependingOption) {
        super(`Option "${getFlag(option)}" depends on option "${getFlag(dependingOption)}".`);
        Object.setPrototypeOf(this, DependingOption.prototype);
    }
}
export class MissingRequiredOption extends ValidationError {
    constructor(option) {
        super(`Missing required option "${getFlag(option)}".`);
        Object.setPrototypeOf(this, MissingRequiredOption.prototype);
    }
}
export class RequiredArgumentFollowsOptionalArgument extends ValidationError {
    constructor(arg) {
        super(`An required argument cannot follow an optional argument, but "${arg}"  is defined as required.`);
        Object.setPrototypeOf(this, RequiredArgumentFollowsOptionalArgument.prototype);
    }
}
export class ArgumentFollowsVariadicArgument extends ValidationError {
    constructor(arg) {
        super(`An argument cannot follow an variadic argument, but got "${arg}".`);
        Object.setPrototypeOf(this, ArgumentFollowsVariadicArgument.prototype);
    }
}
export class NoArguments extends ValidationError {
    constructor() {
        super(`No arguments.`);
        Object.setPrototypeOf(this, NoArguments.prototype);
    }
}
export class InvalidTypeError extends ValidationError {
    constructor({ label, name, value, type }, expected) {
        super(`${label} "${name}" must be of type "${type}", but got "${value}".` + (expected
            ? ` Expected values: ${expected.map((value) => `"${value}"`).join(", ")}`
            : ""));
        Object.setPrototypeOf(this, MissingOptionValue.prototype);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2Vycm9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjE5LjIvZmxhZ3MvX2Vycm9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxFQUFFLE9BQU8sRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUd4RSxNQUFNLE9BQU8sVUFBVyxTQUFRLEtBQUs7SUFDbkMsWUFBWSxPQUFlO1FBQ3pCLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNmLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNwRCxDQUFDO0NBQ0Y7QUFFRCxNQUFNLE9BQU8scUJBQXNCLFNBQVEsVUFBVTtJQUNuRCxZQUFZLE1BQWMsRUFBRSxPQUE0QjtRQUN0RCxLQUFLLENBQ0gsNEJBQTRCLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FDekMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FDbEMsRUFBRSxDQUNILENBQUM7UUFDRixNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxxQkFBcUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMvRCxDQUFDO0NBQ0Y7QUFFRCxNQUFNLE9BQU8sd0JBQXlCLFNBQVEsVUFBVTtJQUN0RCxZQUFZLE1BQWMsRUFBRSxPQUE0QjtRQUN0RCxLQUFLLENBQ0gsK0JBQStCLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FDNUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FDbEMsRUFBRSxDQUNILENBQUM7UUFDRixNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSx3QkFBd0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNsRSxDQUFDO0NBQ0Y7QUFFRCxNQUFNLE9BQU8sV0FBWSxTQUFRLFVBQVU7SUFDekMsWUFBWSxJQUFZLEVBQUUsS0FBb0I7UUFDNUMsS0FBSyxDQUFDLGlCQUFp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