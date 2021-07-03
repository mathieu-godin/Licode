import { blue, bold, exists, grant, gray, log, reset, setColorEnabled, yellow, } from "../deps.ts";
import { getConfigFilename, writeConfigTemplate, } from "./config.ts";
import { Runner } from "./runner.ts";
import { templates } from "./templates.ts";
import { VERSION } from "../info.ts";
const logger = log.create("main");
export const PERMISSIONS = [
    { name: "read" },
    { name: "write" },
    { name: "run" },
];
export const PERMISSION_OPTIONAL = {
    initializeConfig: [{ name: "write" }],
};
export async function grantPermissions() {
    const permissions = await grant([...PERMISSIONS]);
    if (!permissions || permissions.length < PERMISSIONS.length) {
        logger.critical("Required permissions `read` and `run` not granted");
        Deno.exit(1);
    }
}
export async function initializeConfig(type = "json") {
    const permissions = await grant(PERMISSION_OPTIONAL.initializeConfig);
    if (!permissions ||
        permissions.length < PERMISSION_OPTIONAL.initializeConfig.length) {
        logger.critical("Required permissions for this operation not granted");
        Deno.exit(1);
    }
    const template = templates[type];
    if (!template) {
        logger.error(`\`${type}\` is not a valid template.`);
        logger.info(`valid templates are ${Object.keys(templates)}`);
        return;
    }
    if (!(await exists(template.filename))) {
        await writeConfigTemplate(template);
    }
    else {
        logger.error(`\`${template.filename}\` already exists in root dir`);
    }
}
export async function upgrade(version) {
    const url = version !== "latest"
        ? `https://deno.land/x/denon@${version}/denon.ts`
        : "https://deno.land/x/denon/denon.ts";
    logger.debug(`Checking if ${url} exists`);
    if ((await fetch(url)).status !== 200) {
        logger.critical(`Upgrade url ${url} does not exist`);
        Deno.exit(1);
    }
    logger.info(`Running \`deno install -qAfr --unstable ${url}\``);
    await Deno.run({
        cmd: ["deno", "install", "-qAfr", "--unstable", url],
        stdout: undefined,
    }).status();
    Deno.exit(0);
}
export async function printAvailableScripts(config) {
    if (Object.keys(config.scripts).length) {
        logger.info("available scripts:");
        const runner = new Runner(config);
        for (const name of Object.keys(config.scripts)) {
            const script = config.scripts[name];
            console.log();
            console.log(` - ${yellow(bold(name))}`);
            if (typeof script === "object" && !Array.isArray(script) && script.desc) {
                console.log(`   ${script.desc}`);
            }
            const commands = runner
                .build(name)
                .map((command) => command.cmd.join(" "))
                .join(bold(" && "));
            console.log(gray(`   $ ${commands}`));
        }
        console.log();
        console.log(`You can run scripts with \`${blue("denon")} ${yellow("<script>")}\``);
    }
    else {
        logger.error("It looks like you don't have any scripts...");
        const config = getConfigFilename();
        if (config) {
            logger.info(`You can add scripts to your \`${config}\` file. Check the docs.`);
        }
        else {
            logger.info(`You can create a config to add scripts to with \`${blue("denon")} ${yellow("--init")}${reset("`.")}`);
        }
    }
    const latest = await fetchLatestVersion();
    if (latest && latest !== VERSION) {
        logger.warning(`New version available (${latest}). Upgrade with \`${blue("denon")} ${yellow("--upgrade")}${reset("`.")}`);
    }
}
export async function fetchLatestVersion() {
    const cdn = "https://cdn.deno.land/";
    const url = `${cdn}denon/meta/versions.json`;
    const res = await fetch(url);
    if (res.status !== 200)
        return undefined;
    const data = await res.json();
    return data.latest;
}
export function printHelp() {
    setColorEnabled(true);
    console.log(`${blue("DENON")} - ${VERSION}
created by qu4k & eliassjogreen
Monitor any changes in your Deno application and automatically restart.

Usage:
    ${blue("denon")} ${yellow("<script name>")}     ${gray("-- eg: denon start")}
    ${blue("denon")} ${yellow("<command>")}         ${gray("-- eg: denon run helloworld.ts")}
    ${blue("denon")} [options]         ${gray("-- eg: denon --help")}

Options:
    -h --help               Show this screen.
    -v --version            Show version.
    -i --init               Create config file in current working dir.
    -u --upgrade <version>  Upgrade to latest version. (default: master)
    -c --config <file>      Use specific file as configuration.
`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cHM6Ly9kZW5vLmxhbmQveC9kZW5vbkAyLjQuOC9zcmMvY2xpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sRUFDTCxJQUFJLEVBQ0osSUFBSSxFQUNKLE1BQU0sRUFDTixLQUFLLEVBQ0wsSUFBSSxFQUNKLEdBQUcsRUFDSCxLQUFLLEVBQ0wsZUFBZSxFQUNmLE1BQU0sR0FDUCxNQUFNLFlBQVksQ0FBQztBQUVwQixPQUFPLEVBRUwsaUJBQWlCLEVBQ2pCLG1CQUFtQixHQUNwQixNQUFNLGFBQWEsQ0FBQztBQUNyQixPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBRXJDLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUMzQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBRXJDLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7QUFjbEMsTUFBTSxDQUFDLE1BQU0sV0FBVyxHQUFnQztJQUN0RCxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUU7SUFDaEIsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFO0lBQ2pCLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtDQUNoQixDQUFDO0FBS0YsTUFBTSxDQUFDLE1BQU0sbUJBQW1CLEdBRTVCO0lBQ0YsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQztDQUN0QyxDQUFDO0FBRUYsTUFBTSxDQUFDLEtBQUssVUFBVSxnQkFBZ0I7SUFFcEMsTUFBTSxXQUFXLEdBQUcsTUFBTSxLQUFLLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDbEQsSUFBSSxDQUFDLFdBQVcsSUFBSSxXQUFXLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUU7UUFDM0QsTUFBTSxDQUFDLFFBQVEs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