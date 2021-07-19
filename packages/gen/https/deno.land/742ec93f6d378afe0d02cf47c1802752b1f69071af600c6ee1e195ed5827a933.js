import { State } from "./cli/state.ts";
import { CliffyCommand, CliffyCompletionsCommand, CliffyHelpCommand, dirname, format, resolve, yellow, } from "./deps.ts";
import { DB_CLIENTS, DB_DIALECTS, DEFAULT_CONFIG_FILE, DEFAULT_MIGRATION_FOLDER, DEFAULT_SEED_FOLDER, REGEXP_MIGRATION_FILE_NAME_LEGACY, VERSION, } from "./consts.ts";
import { getConfigTemplate } from "./cli/templates.ts";
import { isFileUrl, isMigrationFile } from "./cli/utils.ts";
import { NessieError } from "./cli/errors.ts";
const cli = async () => {
    await new CliffyCommand()
        .name("Nessie Migrations")
        .version(VERSION)
        .description("A database migration tool for Deno.")
        .option("-d, --debug", "Enables verbose output", { global: true })
        .option("-c, --config <config:string>", "Path to config file.", { global: true, default: `./${DEFAULT_CONFIG_FILE}` })
        .command("init", "Generates the config file.")
        .option("--mode <mode:string>", "Select the mode for what to create, can be one of 'config' or 'folders'. If not sumbitted, it will create both the config file and folders.", {
        value: (value) => {
            if (!["config", "folders"].includes(value)) {
                throw new NessieError(`Mode must be one of 'config' or 'folders', but got '${value}'.`);
            }
            return value;
        },
    })
        .option("--dialect <dialect:string>", `Set the database dialect for the config file, can be one of '${DB_DIALECTS.PGSQL}', '${DB_DIALECTS.MYSQL}' or '${DB_DIALECTS.SQLITE}'. If not submitted, a general config file will be generated.`, {
        value: (value) => {
            if (!(value in DB_CLIENTS)) {
                throw new NessieError(`Mode must be one of '${DB_DIALECTS.PGSQL}', '${DB_DIALECTS.MYSQL}' or '${DB_DIALECTS.SQLITE}', but got '${value}'.`);
            }
            return value;
        },
    })
        .action(initNessie)
        .command("make:migration <fileName:string>", "Creates a migration file with the name. Allows lower snake case and digits e.g. `some_migration_1`.")
        .alias("make")
        .action(makeMigration)
        .command("make:seed <fileName:string>", "Creates a seed file with the name. Allows lower snake case and digits e.g. `some_seed_1`.")
        .action(makeSeed)
        .command("seed [matcher:string]", "Seeds the database with the files found with the matcher in the seed folder specified in the config file. Matcher is optional, and accepts string literals and RegExp.")
        .action(seed)
        .command("migrate [amount:number]", "Migrates migrations. Optional number of migrations. If not provided, it will do all available.")
        .action(migrate)
        .command("rollback [amount:string]", "Rolls back migrations. Optional number of rollbacks or 'all'. If not provided, it will do one.")
        .action(rollback)
        .command("update_timestamps", "Update the timestamp format from milliseconds to timestamp. This command should be run inside of the folder where you store your migrations. Will only update timestams where the value is less than 1672531200000 (2023-01-01) so that the timestamps won't be updated multiple times.")
        .action(updateTimestamps)
        .command("completions", new CliffyCompletionsCommand())
        .command("help", new CliffyHelpCommand())
        .parse(Deno.args);
};
const initNessie = async (options) => {
    const template = getConfigTemplate(options.dialect);
    if (options.mode !== "folders") {
        await Deno.writeTextFile(resolve(Deno.cwd(), DEFAULT_CONFIG_FILE), template);
    }
    if (options.mode !== "config") {
        await Deno.mkdir(resolve(Deno.cwd(), DEFAULT_MIGRATION_FOLDER), {
            recursive: true,
        });
        await Deno.mkdir(resolve(Deno.cwd(), DEFAULT_SEED_FOLDER), {
            recursive: true,
        });
        await Deno.create(resolve(Deno.cwd(), DEFAULT_MIGRATION_FOLDER, ".gitkeep"));
        await Deno.create(resolve(Deno.cwd(), DEFAULT_SEED_FOLDER, ".gitkeep"));
    }
};
const makeMigration = async (options, fileName) => {
    const state = await State.init(options);
    await state.makeMigration(fileName);
};
const makeSeed = async (options, fileName) => {
    const state = await State.init(options);
    await state.makeSeed(fileName);
};
const seed = async (options, matcher) => {
    const state = await State.init(options);
    await state.client.prepare();
    await state.client.seed(matcher);
    await state.client.close();
};
const migrate = async (options, amount) => {
    const state = await State.init(options);
    await state.client.prepare();
    await state.client.migrate(amount);
    await state.client.close();
};
const rollback = async (options, amount) => {
    const state = await State.init(options);
    await state.client.prepare();
    await state.client.rollback(amount);
    await state.client.close();
};
const updateTimestamps = async (options) => {
    const state = await State.init(options);
    await state.client.prepare();
    await state.client.updateTimestamps();
    await state.client.close();
    const migrationFiles = state.client.migrationFiles
        .filter((el) => isFileUrl(el.path) &&
        REGEXP_MIGRATION_FILE_NAME_LEGACY.test(el.name) &&
        parseInt(el.name.split("-")[0]) < 1672531200000)
        .map((el) => {
        const filenameArray = el.name.split("-", 2);
        const milliseconds = filenameArray[0];
        const filename = filenameArray[1];
        const timestamp = new Date(parseInt(milliseconds));
        const newDateTime = format(timestamp, "yyyyMMddHHmmss");
        const newName = newDateTime + "_" + filename;
        if (!isMigrationFile(newName)) {
            console.warn(`Migration ${el.name} has been updated to ${newName}, but this is not a valid filename. Please change this filename manually. See the method 'isMigrationFile' from 'mod.ts' for filename validation`);
        }
        return {
            oldPath: el.path,
            newPath: resolve(dirname(el.path), newName),
        };
    });
    for await (const { oldPath, newPath } of migrationFiles) {
        await Deno.rename(oldPath, newPath);
    }
    const output = migrationFiles
        .map(({ oldPath, newPath }) => `${oldPath} => ${newPath}`)
        .join("\n");
    console.info(output);
};
const run = async () => {
    try {
        await cli();
        Deno.exit();
    }
    catch (e) {
        if (e instanceof NessieError) {
            console.error(e);
        }
        else {
            console.error(e, "\n", yellow("This error is most likely unrelated to Nessie, and is probably related to the client, the connection config or the query you are trying to execute."));
        }
        Deno.exit(1);
    }
};
run();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cHM6Ly9kZW5vLmxhbmQveC9uZXNzaWVAMi4wLjAvY2xpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUN2QyxPQUFPLEVBQ0wsYUFBYSxFQUNiLHdCQUF3QixFQUN4QixpQkFBaUIsRUFFakIsT0FBTyxFQUNQLE1BQU0sRUFDTixPQUFPLEVBQ1AsTUFBTSxHQUNQLE1BQU0sV0FBVyxDQUFDO0FBQ25CLE9BQU8sRUFDTCxVQUFVLEVBQ1YsV0FBVyxFQUNYLG1CQUFtQixFQUNuQix3QkFBd0IsRUFDeEIsbUJBQW1CLEVBQ25CLGlDQUFpQyxFQUNqQyxPQUFPLEdBQ1IsTUFBTSxhQUFhLENBQUM7QUFPckIsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFDdkQsT0FBTyxFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUM1RCxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFZOUMsTUFBTSxHQUFHLEdBQUcsS0FBSyxJQUFJLEVBQUU7SUFDckIsTUFBTSxJQUFJLGFBQWEsRUFBNEI7U0FDaEQsSUFBSSxDQUFDLG1CQUFtQixDQUFDO1NBQ3pCLE9BQU8sQ0FBQyxPQUFPLENBQUM7U0FDaEIsV0FBVyxDQUFDLHFDQUFxQyxDQUFDO1NBQ2xELE1BQU0sQ0FBQyxhQUFhLEVBQUUsd0JBQXdCLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUM7U0FDakUsTUFBTSxDQUNMLDhCQUE4QixFQUM5QixzQkFBc0IsRUFDdEIsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLG1CQUFtQixFQUFFLEVBQUUsQ0FDdEQ7U0FDQSxPQUFPLENBQUMsTUFBTSxFQUFFLDRCQUE0QixDQUFDO1NBQzdDLE1BQU0sQ0FDTCxzQkFB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