import { log } from "../deps.ts";
const logger = log.create("daem");
export class Daemon {
    #denon;
    #script;
    #config;
    #processes = {};
    constructor(denon, script) {
        this.#denon = denon;
        this.#script = script;
        this.#config = denon.config;
    }
    async reload() {
        logger.info("restarting due to changes...");
        if (this.#config.logger.fullscreen) {
            console.clear();
        }
        this.killAll();
        await this.start();
    }
    async start() {
        const commands = this.#denon.runner.build(this.#script);
        for (let i = 0; i < commands.length; i++) {
            const plog = log.create(`#${i}`);
            const command = commands[i];
            const options = command.options;
            const last = i === commands.length - 1;
            if (last) {
                if (options.watch && this.#config.watcher.match) {
                    const match = this.#config.watcher.match.join(" ");
                    logger.info(`watching path(s): ${match}`);
                }
                if (options.watch && this.#config.watcher.exts) {
                    const exts = this.#config.watcher.exts.join(",");
                    logger.info(`watching extensions: ${exts}`);
                }
                plog.warning(`starting \`${command.cmd.join(" ")}\``);
            }
            else {
                plog.info(`starting sequential \`${command.cmd.join(" ")}\``);
            }
            const process = command.exe();
            plog.debug(`starting process with pid ${process.pid}`);
            if (last) {
                this.#processes[process.pid] = process;
                this.monitor(process, command.options);
                return command.options;
            }
            else {
                await process.status();
                process.close();
            }
        }
        return {};
    }
    killAll() {
        logger.debug(`killing ${Object.keys(this.#processes).length} orphan process[es]`);
        const pcopy = Object.assign({}, this.#processes);
        this.#processes = {};
        for (const id in pcopy) {
            const p = pcopy[id];
            if (Deno.build.os === "windows") {
                logger.debug(`closing (windows) process with pid ${p.pid}`);
                p.kill(9);
                p.close();
            }
            else {
                logger.debug(`killing (unix) process with pid ${p.pid}`);
                p.kill(9);
            }
        }
    }
    async monitor(process, options) {
        logger.debug(`monitoring status of process with pid ${process.pid}`);
        const pid = process.pid;
        let s;
        try {
            s = await process.status();
            process.close();
            logger.debug(`got status of process with pid ${process.pid}`);
        }
        catch {
            logger.debug(`error getting status of process with pid ${process.pid}`);
        }
        const p = this.#processes[pid];
        if (p) {
            logger.debug(`process with pid ${process.pid} exited on its own`);
            delete this.#processes[pid];
            if (s) {
                if (s.success) {
                    if (options.watch) {
                        logger.info("clean exit - waiting for changes before restart");
                    }
                    else {
                        logger.info("clean exit - denon is exiting ...");
                        Deno.exit(0);
                    }
                }
                else {
                    if (options.watch) {
                        logger.error("app crashed - waiting for file changes before starting ...");
                    }
                    else {
                        logger.error("app crashed - denon is exiting ...");
                        Deno.exit(1);
                    }
                }
            }
        }
        else {
            logger.debug(`process with pid ${process.pid} was killed`);
        }
    }
    async onExit() {
        if (Deno.build.os !== "windows") {
            const signs = [
                Deno.Signal.SIGHUP,
                Deno.Signal.SIGINT,
                Deno.Signal.SIGTERM,
                Deno.Signal.SIGTSTP,
            ];
            await Promise.all(signs.map((s) => {
                (async () => {
                    await Deno.signal(s);
                    this.killAll();
                    Deno.exit(0);
                })();
            }));
        }
    }
    async *iterate() {
        this.onExit();
        yield {
            type: "start",
        };
        const options = await this.start();
        if (options.watch) {
            for await (const watchE of this.#denon.watcher) {
                if (watchE.some((_) => _.type.includes("modify"))) {
                    logger.debug(`reload event detected, starting the reload procedure...`);
                    yield {
                        type: "reload",
                        change: watchE,
                    };
                    await this.reload();
                }
            }
        }
        yield {
            type: "exit",
        };
    }
    [Symbol.asyncIterator]() {
        return this.iterate();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGFlbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cHM6Ly9kZW5vLmxhbmQveC9kZW5vbkAyLjQuOC9zcmMvZGFlbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFNakMsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQU1sQyxNQUFNLE9BQU8sTUFBTTtJQUNqQixNQUFNLENBQVE7SUFDZCxPQUFPLENBQVM7SUFDaEIsT0FBTyxDQUFzQjtJQUM3QixVQUFVLEdBQW9DLEVBQUUsQ0FBQztJQUVqRCxZQUFZLEtBQVksRUFBRSxNQUFjO1FBQ3RDLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUM5QixDQUFDO0lBR08sS0FBSyxDQUFDLE1BQU07UUFDbEIsTUFBTSxDQUFDLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1FBRTVDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFO1lBQ2xDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUNqQjtRQUVELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUVmLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3JCLENBQUM7SUFFTyxLQUFLLENBQUMsS0FBSztRQUNqQixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBS3hELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3hDLE1B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