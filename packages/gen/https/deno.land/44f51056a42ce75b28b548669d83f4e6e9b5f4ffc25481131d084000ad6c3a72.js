export class ZshCompletionsGenerator {
    cmd;
    actions = new Map();
    static generate(cmd) {
        return new ZshCompletionsGenerator(cmd).generate();
    }
    constructor(cmd) {
        this.cmd = cmd;
    }
    generate() {
        const path = this.cmd.getPath();
        const name = this.cmd.getName();
        const version = this.cmd.getVersion()
            ? ` v${this.cmd.getVersion()}`
            : "";
        return `#!/usr/bin/env zsh
# zsh completion support for ${path}${version}

autoload -U is-at-least

# shellcheck disable=SC2154
(( $+functions[__${replaceSpecialChars(name)}_complete] )) ||
function __${replaceSpecialChars(name)}_complete {
  local name="$1"; shift
  local action="$1"; shift
  integer ret=1
  local -a values
  local expl lines
  _tags "$name"
  while _tags; do
    if _requested "$name"; then
      # shellcheck disable=SC2034
      lines="$(${name} completions complete "\${action}" "\${@}")"
      values=("\${(ps:\\n:)lines}")
      if (( \${#values[@]} )); then
        while _next_label "$name" expl "$action"; do
          compadd -S '' "\${expl[@]}" "\${values[@]}"
        done
      fi
    fi
  done
}

${this.generateCompletions(this.cmd).trim()}

# _${replaceSpecialChars(path)} "\${@}"

compdef _${replaceSpecialChars(path)} ${path}

`;
    }
    generateCompletions(command, path = "") {
        if (!command.hasCommands(false) && !command.hasOptions(false) &&
            !command.hasArguments()) {
            return "";
        }
        path = (path ? path + " " : "") + command.getName();
        return `# shellcheck disable=SC2154
(( $+functions[_${replaceSpecialChars(path)}] )) ||
function _${replaceSpecialChars(path)}() {` +
            (!command.getParent()
                ? `
  local state`
                : "") +
            this.generateCommandCompletions(command, path) +
            this.generateSubCommandCompletions(command, path) +
            this.generateArgumentCompletions(command, path) +
            this.generateActions(command) +
            `\n}\n\n` +
            command.getCommands(false)
                .filter((subCommand) => subCommand !== command)
                .map((subCommand) => this.generateCompletions(subCommand, path))
                .join("");
    }
    generateCommandCompletions(command, path) {
        const commands = command.getCommands(false);
        let completions = commands
            .map((subCommand) => `'${subCommand.getName()}:${subCommand.getShortDescription()}'`)
            .join("\n      ");
        if (completions) {
            completions = `
    local -a commands
    # shellcheck disable=SC2034
    commands=(
      ${completions}
    )
    _describe 'command' commands`;
        }
        if (command.hasArguments()) {
            const completionsPath = path.split(" ").slice(1).join(" ");
            const arg = command.getArguments()[0];
            const action = this.addAction(arg, completionsPath);
            if (action && command.getCompletion(arg.action)) {
                completions += `\n    __${replaceSpecialChars(this.cmd.getName())}_complete ${action.arg.name} ${action.arg.action} ${action.cmd}`;
            }
        }
        if (completions) {
            completions = `\n\n  function _commands() {${completions}\n  }`;
        }
        return completions;
    }
    generateSubCommandCompletions(command, path) {
        if (command.hasCommands(false)) {
            const actions = command
                .getCommands(false)
                .map((command) => `${command.getName()}) _${replaceSpecialChars(path + " " + command.getName())} ;;`)
                .join("\n      ");
            return `\n
  function _command_args() {
    case "\${words[1]}" in\n      ${actions}\n    esac
  }`;
        }
        return "";
    }
    generateArgumentCompletions(command, path) {
        this.actions.clear();
        const options = this.generateOptions(command, path);
        let argIndex = 0;
        let argsCommand = "\n\n  _arguments -w -s -S -C";
        if (command.hasOptions()) {
            argsCommand += ` \\\n    ${options.join(" \\\n    ")}`;
        }
        if (command.hasCommands(false) || (command.getArguments()
            .filter((arg) => command.getCompletion(arg.action)).length)) {
            argsCommand += ` \\\n    '${++argIndex}: :_commands'`;
        }
        if (command.hasArguments() || command.hasCommands(false)) {
            const args = [];
            for (const arg of command.getArguments().slice(1)) {
                const completionsPath = path.split(" ").slice(1).join(" ");
                const action = this.addAction(arg, completionsPath);
                args.push(`${++argIndex}${arg.optionalValue ? "::" : ":"}${action.name}`);
            }
            argsCommand += args.map((arg) => `\\\n    '${arg}'`).join("");
            if (command.hasCommands(false)) {
                argsCommand += ` \\\n    '*:: :->command_args'`;
            }
        }
        return argsCommand;
    }
    generateOptions(command, path) {
        const options = [];
        const cmdArgs = path.split(" ");
        const _baseName = cmdArgs.shift();
        const completionsPath = cmdArgs.join(" ");
        const excludedFlags = command.getOptions(false)
            .map((option) => option.standalone ? option.flags : false)
            .flat()
            .filter((flag) => typeof flag === "string");
        for (const option of command.getOptions(false)) {
            options.push(this.generateOption(option, completionsPath, excludedFlags));
        }
        return options;
    }
    generateOption(option, completionsPath, excludedOptions) {
        const flags = option.flags;
        let excludedFlags = option.conflicts?.length
            ? [
                ...excludedOptions,
                ...option.conflicts.map((opt) => "--" + opt.replace(/^--/, "")),
            ]
            : excludedOptions;
        excludedFlags = option.collect ? excludedFlags : [
            ...excludedFlags,
            ...flags,
        ];
        let args = "";
        for (const arg of option.args) {
            const action = this.addAction(arg, completionsPath);
            if (arg.variadic) {
                args += `${arg.optionalValue ? "::" : ":"}${arg.name}:->${action.name}`;
            }
            else {
                args += `${arg.optionalValue ? "::" : ":"}${arg.name}:->${action.name}`;
            }
        }
        let description = option.description
            .trim()
            .split("\n")
            .shift();
        description = description
            .replace(/\[/g, "\\[")
            .replace(/]/g, "\\]")
            .replace(/"/g, '\\"')
            .replace(/'/g, "'\"'\"'");
        const collect = option.collect ? "*" : "";
        if (option.standalone) {
            return `'(- *)'{${collect}${flags}}'[${description}]${args}'`;
        }
        else {
            const excluded = excludedFlags.length
                ? `'(${excludedFlags.join(" ")})'`
                : "";
            if (collect || flags.length > 1) {
                return `${excluded}{${collect}${flags}}'[${description}]${args}'`;
            }
            else {
                return `${excluded}${flags}'[${description}]${args}'`;
            }
        }
    }
    addAction(arg, cmd) {
        const action = `${arg.name}-${arg.action}`;
        if (!this.actions.has(action)) {
            this.actions.set(action, {
                arg: arg,
                label: `${arg.name}: ${arg.action}`,
                name: action,
                cmd,
            });
        }
        return this.actions.get(action);
    }
    generateActions(command) {
        let actions = [];
        if (this.actions.size) {
            actions = Array
                .from(this.actions)
                .map(([name, action]) => `${name}) __${replaceSpecialChars(this.cmd.getName())}_complete ${action.arg.name} ${action.arg.action} ${action.cmd} ;;`);
        }
        if (command.hasCommands(false)) {
            actions.unshift(`command_args) _command_args ;;`);
        }
        if (actions.length) {
            return `\n\n  case "$state" in\n    ${actions.join("\n    ")}\n  esac`;
        }
        return "";
    }
}
function replaceSpecialChars(str) {
    return str.replace(/[^a-zA-Z0-9]/g, "_");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3pzaF9jb21wbGV0aW9uc19nZW5lcmF0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJodHRwczovL2Rlbm8ubGFuZC94L2NsaWZmeUB2MC4xOS4yL2NvbW1hbmQvY29tcGxldGlvbnMvX3pzaF9jb21wbGV0aW9uc19nZW5lcmF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBV0EsTUFBTSxPQUFPLHVCQUF1QjtJQVFKO0lBUHRCLE9BQU8sR0FBbUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUdyRCxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQVk7UUFDakMsT0FBTyxJQUFJLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ3JELENBQUM7SUFFRCxZQUE4QixHQUFZO1FBQVosUUFBRyxHQUFILEdBQUcsQ0FBUztJQUFHLENBQUM7SUFHdEMsUUFBUTtRQUNkLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNoQyxNQUFNLE9BQU8sR0FBdUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUU7WUFDdkQsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsRUFBRTtZQUM5QixDQUFDLENBQUMsRUFBRSxDQUFDO1FBRVAsT0FBTzsrQkFDb0IsSUFBSSxHQUFHLE9BQU87Ozs7O21CQUsxQixtQkFBbUIsQ0FBQyxJQUFJLENBQUM7YUFDL0IsbUJBQW1CLENBQUMsSUFBSSxDQUFDOzs7Ozs7Ozs7O2lCQVVyQixJQUFJOzs7Ozs7Ozs7OztFQVduQixJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRTs7S0FFdEMsbUJBQW1CLENBQUMsSUFBSSxDQUFDOztXQUVuQixtQkFBbUIsQ0FBQyxJQUFJ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