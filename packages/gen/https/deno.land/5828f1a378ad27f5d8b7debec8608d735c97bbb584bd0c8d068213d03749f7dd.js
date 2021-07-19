import { Command } from "../command.ts";
import { UnknownCompletionCommand } from "../_errors.ts";
export class CompleteCommand extends Command {
    constructor(cmd) {
        super();
        this.description("Get completions for given action from given command.")
            .arguments("<action:string> [command...:string]")
            .action(async (_, action, commandNames) => {
            let parent;
            const completeCommand = commandNames
                ?.reduce((cmd, name) => {
                parent = cmd;
                const childCmd = cmd.getCommand(name, false);
                if (!childCmd) {
                    throw new UnknownCompletionCommand(name, cmd.getCommands());
                }
                return childCmd;
            }, cmd || this.getMainCommand()) ?? (cmd || this.getMainCommand());
            const completion = completeCommand
                .getCompletion(action);
            const result = await completion?.complete(completeCommand, parent) ?? [];
            if (result?.length) {
                Deno.stdout.writeSync(new TextEncoder().encode(result.join("\n")));
            }
        })
            .reset();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGxldGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJodHRwczovL2Rlbm8ubGFuZC94L2NsaWZmeUB2MC4xOS4yL2NvbW1hbmQvY29tcGxldGlvbnMvY29tcGxldGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUN4QyxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFJekQsTUFBTSxPQUFPLGVBQ1gsU0FBUSxPQUE2RDtJQUNyRSxZQUFtQixHQUFhO1FBQzlCLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxzREFBc0QsQ0FBQzthQUNyRSxTQUFTLENBQUMscUNBQXFDLENBQUM7YUFDaEQsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsTUFBYyxFQUFFLFlBQTRCLEVBQUUsRUFBRTtZQUNoRSxJQUFJLE1BQTJCLENBQUM7WUFDaEMsTUFBTSxlQUFlLEdBQVksWUFBWTtnQkFDM0MsRUFBRSxNQUFNLENBQUMsQ0FBQyxHQUFZLEVBQUUsSUFBWSxFQUFXLEVBQUU7Z0JBQy9DLE1BQU0sR0FBRyxHQUFHLENBQUM7Z0JBQ2IsTUFBTSxRQUFRLEdBQXdCLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNsRSxJQUFJLENBQUMsUUFBUSxFQUFFO29CQUNiLE1BQU0sSUFBSSx3QkFBd0IsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7aUJBQzdEO2dCQUNELE9BQU8sUUFBUSxDQUFDO1lBQ2xCLENBQUMsRUFBRSxHQUFHLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUM7WUFFckUsTUFBTSxVQUFVLEdBQTRCLGVBQWU7aUJBQ3hELGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN6QixNQUFNLE1BQU0sR0FDVixNQUFNLFVBQVUsRUFBRSxRQUFRLENBQUMsZUFBZSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUU1RCxJQUFJLE1BQU0sRUFBRSxNQUFNLEVBQUU7Z0JBQ2xCLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksV0FBVyxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3BFO1FBQ0gsQ0FBQyxDQUFDO2FBQ0QsS0FBSyxFQUFFLENBQUM7SUFDYixDQUFDO0NBQ0YifQ==