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
                p.kill("SIGTERM");
                p.close();
            }
            else {
                logger.debug(`killing (unix) process with pid ${p.pid}`);
                p.kill("SIGTERM");
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
    onExit() {
        if (Deno.build.os !== "windows") {
            const signs = [
                "SIGHUP",
                "SIGINT",
                "SIGTERM",
                "SIGTSTP",
            ];
            signs.map((s) => {
                Deno.addSignalListener(s, () => {
                    this.killAll();
                    Deno.exit(0);
                });
            });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGFlbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cHM6Ly9kZW5vLmxhbmQveC9kZW5vbkAyLjUuMC9zcmMvZGFlbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFNakMsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQU1sQyxNQUFNLE9BQU8sTUFBTTtJQUNqQixNQUFNLENBQVE7SUFDZCxPQUFPLENBQVM7SUFDaEIsT0FBTyxDQUFzQjtJQUM3QixVQUFVLEdBQW9DLEVBQUUsQ0FBQztJQUVqRCxZQUFZLEtBQVksRUFBRSxNQUFjO1FBQ3RDLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUM5QixDQUFDO0lBR08sS0FBSyxDQUFDLE1BQU07UUFDbEIsTUFBTSxDQUFDLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1FBRTVDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFO1lBQ2xDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUNqQjtRQUVELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUVmLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3JCLENBQUM7SUFFTyxLQUFLLENBQUMsS0FBSztRQUNqQixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBS3hELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3hDLE1B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O2dCQUM5QyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUU7b0JBQ2pELE1BQU0sQ0FBQyxLQUFLLENBQ1YseURBQXlELENBQzFELENBQUM7b0JBQ0YsTUFBTTt3QkFDSixJQUFJLEVBQUUsUUFBUTt3QkFDZCxNQUFNLEVBQUUsTUFBTTtxQkFDZixDQUFDO29CQUNGLE1BQU0sSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2lCQUNyQjthQUNGO1NBQ0Y7UUFDRCxNQUFNO1lBQ0osSUFBSSxFQUFFLE1BQU07U0FDYixDQUFDO0lBQ0osQ0FBQztJQUVELENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQztRQUNwQixPQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUN4QixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMC0yMDIxIHRoZSBkZW5vc2F1cnMgdGVhbS4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB7IGxvZyB9IGZyb20gXCIuLi9kZXBzLnRzXCI7XG5cbmltcG9ydCB0eXBlIHsgRGVub24sIERlbm9uRXZlbnQgfSBmcm9tIFwiLi4vZGVub24udHNcIjtcbmltcG9ydCB0eXBlIHsgQ29tcGxldGVEZW5vbkNvbmZpZyB9IGZyb20gXCIuL2NvbmZpZy50c1wiO1xuaW1wb3J0IHR5cGUgeyBTY3JpcHRPcHRpb25zIH0gZnJvbSBcIi4vc2NyaXB0cy50c1wiO1xuXG5jb25zdCBsb2dnZXIgPSBsb2cuY3JlYXRlKFwiZGFlbVwiKTtcblxuLyoqIERhZW1vbiBpbnN0YW5jZS5cbiAqIFJldHVybmVkIGJ5IERlbm9uIGluc3RhbmNlIHdoZW5cbiAqIGBzdGFydChzY3JpcHQpYCBpcyBjYWxsZWQuIEl0IGNhbiBiZSB1c2VkIGluIGEgZm9yXG4gKiBsb29wIHRvIGxpc3RlbiB0byBEZW5vbkV2ZW50cy4gKi9cbmV4cG9ydCBjbGFzcyBEYWVtb24gaW1wbGVtZW50cyBBc3luY0l0ZXJhYmxlPERlbm9uRXZlbnQ+IHtcbiAgI2Rlbm9uOiBEZW5vbjtcbiAgI3NjcmlwdDogc3RyaW5nO1xuICAjY29uZmlnOiBDb21wbGV0ZURlbm9uQ29uZmlnO1xuICAjcHJvY2Vzc2VzOiB7IFtwaWQ6IG51bWJlcl06IERlbm8uUHJvY2VzcyB9ID0ge307XG5cbiAgY29uc3RydWN0b3IoZGVub246IERlbm9uLCBzY3JpcHQ6IHN0cmluZykge1xuICAgIHRoaXMuI2Rlbm9uID0gZGVub247XG4gICAgdGhpcy4jc2NyaXB0ID0gc2NyaXB0O1xuICAgIHRoaXMuI2NvbmZpZyA9IGRlbm9uLmNvbmZpZzsgLy8ganVzdCBhcyBhIHNob3J0Y3V0XG4gIH1cblxuICAvKiogUmVzdGFydCBjdXJyZW50IHByb2Nlc3MuICovXG4gIHByaXZhdGUgYXN5bmMgcmVsb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGxvZ2dlci5pbmZvKFwicmVzdGFydGluZyBkdWUgdG8gY2hhbmdlcy4uLlwiKTtcblxuICAgIGlmICh0aGlzLiNjb25maWcubG9nZ2VyLmZ1bGxzY3JlZW4pIHtcbiAgICAgIGNvbnNvbGUuY2xlYXIoKTtcbiAgICB9XG5cbiAgICB0aGlzLmtpbGxBbGwoKTtcblxuICAgIGF3YWl0IHRoaXMuc3RhcnQoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc3RhcnQoKTogUHJvbWlzZTxTY3JpcHRPcHRpb25zPiB7XG4gICAgY29uc3QgY29tbWFuZHMgPSB0aGlzLiNkZW5vbi5ydW5uZXIuYnVpbGQodGhpcy4jc2NyaXB0KTtcblxuICAgIC8vIFNlcXVlbnRpYWwgZXhlY3V0aW9uLCBvbmUgcHJvY2VzcyBhZnRlciBhbm90aGVyIGlzIGV4ZWN1dGVkLFxuICAgIC8vICpzZXF1ZW50aWFsbHkqLCB0aGUgbGFzdCBwcm9jZXNzIGlzIG5hbWVkIGBtYWluYCBhbmQgaXMgdGhlXG4gICAgLy8gb25lIHRoYXQgd2lsbCBhY3R1YWxseSBiZSBkZW1vbml6ZWQuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21tYW5kcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcGxvZyA9IGxvZy5jcmVhdGUoYCMke2l9YCk7XG4gICAgICBjb25zdCBjb21tYW5kID0gY29tbWFuZHNbaV07XG4gICAgICBjb25zdCBvcHRpb25zID0gY29tbWFuZC5vcHRpb25zO1xuICAgICAgY29uc3QgbGFzdCA9IGkgPT09IGNvbW1hbmRzLmxlbmd0aCAtIDE7XG5cbiAgICAgIGlmIChsYXN0KSB7XG4gICAgICAgIGlmIChvcHRpb25zLndhdGNoICYmIHRoaXMuI2NvbmZpZy53YXRjaGVyLm1hdGNoKSB7XG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSB0aGlzLiNjb25maWcud2F0Y2hlci5tYXRjaC5qb2luKFwiIFwiKTtcbiAgICAgICAgICBsb2dnZXIuaW5mbyhgd2F0Y2hpbmcgcGF0aChzKTogJHttYXRjaH1gKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy53YXRjaCAmJiB0aGlzLiNjb25maWcud2F0Y2hlci5leHRzKSB7XG4gICAgICAgICAgY29uc3QgZXh0cyA9IHRoaXMuI2NvbmZpZy53YXRjaGVyLmV4dHMuam9pbihcIixcIik7XG4gICAgICAgICAgbG9nZ2VyLmluZm8oYHdhdGNoaW5nIGV4dGVuc2lvbnM6ICR7ZXh0c31gKTtcbiAgICAgICAgfVxuICAgICAgICBwbG9nLndhcm5pbmcoYHN0YXJ0aW5nIFxcYCR7Y29tbWFuZC5jbWQuam9pbihcIiBcIil9XFxgYCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwbG9nLmluZm8oYHN0YXJ0aW5nIHNlcXVlbnRpYWwgXFxgJHtjb21tYW5kLmNtZC5qb2luKFwiIFwiKX1cXGBgKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcHJvY2VzcyA9IGNvbW1hbmQuZXhlKCk7XG4gICAgICBwbG9nLmRlYnVnKGBzdGFydGluZyBwcm9jZXNzIHdpdGggcGlkICR7cHJvY2Vzcy5waWR9YCk7XG5cbiAgICAgIGlmIChsYXN0KSB7XG4gICAgICAgIHRoaXMuI3Byb2Nlc3Nlc1twcm9jZXNzLnBpZF0gPSBwcm9jZXNzO1xuICAgICAgICB0aGlzLm1vbml0b3IocHJvY2VzcywgY29tbWFuZC5vcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIGNvbW1hbmQub3B0aW9ucztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IHByb2Nlc3Muc3RhdHVzKCk7XG4gICAgICAgIHByb2Nlc3MuY2xvc2UoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHt9O1xuICB9XG5cbiAgcHJpdmF0ZSBraWxsQWxsKCk6IHZvaWQge1xuICAgIGxvZ2dlci5kZWJ1ZyhcbiAgICAgIGBraWxsaW5nICR7T2JqZWN0LmtleXModGhpcy4jcHJvY2Vzc2VzKS5sZW5ndGh9IG9ycGhhbiBwcm9jZXNzW2VzXWAsXG4gICAgKTtcbiAgICAvLyBraWxsIGFsbCBwcm9jZXNzZXMgc3Bhd25lZFxuICAgIGNvbnN0IHBjb3B5ID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy4jcHJvY2Vzc2VzKTtcbiAgICB0aGlzLiNwcm9jZXNzZXMgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGlkIGluIHBjb3B5KSB7XG4gICAgICBjb25zdCBwID0gcGNvcHlbaWRdO1xuICAgICAgaWYgKERlbm8uYnVpbGQub3MgPT09IFwid2luZG93c1wiKSB7XG4gICAgICAgIGxvZ2dlci5kZWJ1ZyhgY2xvc2luZyAod2luZG93cykgcHJvY2VzcyB3aXRoIHBpZCAke3AucGlkfWApO1xuICAgICAgICBwLmtpbGwoXCJTSUdURVJNXCIpO1xuICAgICAgICBwLmNsb3NlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsb2dnZXIuZGVidWcoYGtpbGxpbmcgKHVuaXgpIHByb2Nlc3Mgd2l0aCBwaWQgJHtwLnBpZH1gKTtcbiAgICAgICAgcC5raWxsKFwiU0lHVEVSTVwiKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIG1vbml0b3IoXG4gICAgcHJvY2VzczogRGVuby5Qcm9jZXNzLFxuICAgIG9wdGlvbnM6IFNjcmlwdE9wdGlvbnMsXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGxvZ2dlci5kZWJ1ZyhgbW9uaXRvcmluZyBzdGF0dXMgb2YgcHJvY2VzcyB3aXRoIHBpZCAke3Byb2Nlc3MucGlkfWApO1xuICAgIGNvbnN0IHBpZCA9IHByb2Nlc3MucGlkO1xuICAgIGxldCBzOiBEZW5vLlByb2Nlc3NTdGF0dXMgfCB1bmRlZmluZWQ7XG4gICAgdHJ5IHtcbiAgICAgIHMgPSBhd2FpdCBwcm9jZXNzLnN0YXR1cygpO1xuICAgICAgcHJvY2Vzcy5jbG9zZSgpO1xuICAgICAgbG9nZ2VyLmRlYnVnKGBnb3Qgc3RhdHVzIG9mIHByb2Nlc3Mgd2l0aCBwaWQgJHtwcm9jZXNzLnBpZH1gKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIGxvZ2dlci5kZWJ1ZyhgZXJyb3IgZ2V0dGluZyBzdGF0dXMgb2YgcHJvY2VzcyB3aXRoIHBpZCAke3Byb2Nlc3MucGlkfWApO1xuICAgIH1cbiAgICBjb25zdCBwID0gdGhpcy4jcHJvY2Vzc2VzW3BpZF07XG4gICAgaWYgKHApIHtcbiAgICAgIGxvZ2dlci5kZWJ1ZyhgcHJvY2VzcyB3aXRoIHBpZCAke3Byb2Nlc3MucGlkfSBleGl0ZWQgb24gaXRzIG93bmApO1xuICAgICAgLy8gcHJvY2VzcyBleGl0ZWQgb24gaXRzIG93biwgc28gd2Ugc2hvdWxkIHdhaXQgYSByZWxvYWRcbiAgICAgIC8vIHJlbW92ZSBpdCBmcm9tIHByb2Nlc3NlcyBhcnJheSBhcyBpdCBpcyBhbHJlYWR5IGRlYWRcbiAgICAgIGRlbGV0ZSB0aGlzLiNwcm9jZXNzZXNbcGlkXTtcblxuICAgICAgaWYgKHMpIHtcbiAgICAgICAgLy8gbG9nZ2VyIHN0YXR1cyBzdGF0dXNcbiAgICAgICAgaWYgKHMuc3VjY2Vzcykge1xuICAgICAgICAgIGlmIChvcHRpb25zLndhdGNoKSB7XG4gICAgICAgICAgICBsb2dnZXIuaW5mbyhcImNsZWFuIGV4aXQgLSB3YWl0aW5nIGZvciBjaGFuZ2VzIGJlZm9yZSByZXN0YXJ0XCIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsb2dnZXIuaW5mbyhcImNsZWFuIGV4aXQgLSBkZW5vbiBpcyBleGl0aW5nIC4uLlwiKTtcbiAgICAgICAgICAgIERlbm8uZXhpdCgwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKG9wdGlvbnMud2F0Y2gpIHtcbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcihcbiAgICAgICAgICAgICAgXCJhcHAgY3Jhc2hlZCAtIHdhaXRpbmcgZm9yIGZpbGUgY2hhbmdlcyBiZWZvcmUgc3RhcnRpbmcgLi4uXCIsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoXCJhcHAgY3Jhc2hlZCAtIGRlbm9uIGlzIGV4aXRpbmcgLi4uXCIpO1xuICAgICAgICAgICAgRGVuby5leGl0KDEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBsb2dnZXIuZGVidWcoYHByb2Nlc3Mgd2l0aCBwaWQgJHtwcm9jZXNzLnBpZH0gd2FzIGtpbGxlZGApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb25FeGl0KCk6IHZvaWQge1xuICAgIGlmIChEZW5vLmJ1aWxkLm9zICE9PSBcIndpbmRvd3NcIikge1xuICAgICAgY29uc3Qgc2lnbnM6IERlbm8uU2lnbmFsW10gPSBbXG4gICAgICAgIFwiU0lHSFVQXCIsXG4gICAgICAgIFwiU0lHSU5UXCIsXG4gICAgICAgIFwiU0lHVEVSTVwiLFxuICAgICAgICBcIlNJR1RTVFBcIixcbiAgICAgIF07XG4gICAgICBzaWducy5tYXAoKHMpID0+IHtcbiAgICAgICAgRGVuby5hZGRTaWduYWxMaXN0ZW5lcihzLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5raWxsQWxsKCk7XG4gICAgICAgICAgRGVuby5leGl0KDApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jICppdGVyYXRlKCk6IEFzeW5jSXRlcmF0b3I8RGVub25FdmVudD4ge1xuICAgIHRoaXMub25FeGl0KCk7XG4gICAgeWllbGQge1xuICAgICAgdHlwZTogXCJzdGFydFwiLFxuICAgIH07XG4gICAgY29uc3Qgb3B0aW9ucyA9IGF3YWl0IHRoaXMuc3RhcnQoKTtcbiAgICBpZiAob3B0aW9ucy53YXRjaCkge1xuICAgICAgZm9yIGF3YWl0IChjb25zdCB3YXRjaEUgb2YgdGhpcy4jZGVub24ud2F0Y2hlcikge1xuICAgICAgICBpZiAod2F0Y2hFLnNvbWUoKF8pID0+IF8udHlwZS5pbmNsdWRlcyhcIm1vZGlmeVwiKSkpIHtcbiAgICAgICAgICBsb2dnZXIuZGVidWcoXG4gICAgICAgICAgICBgcmVsb2FkIGV2ZW50IGRldGVjdGVkLCBzdGFydGluZyB0aGUgcmVsb2FkIHByb2NlZHVyZS4uLmAsXG4gICAgICAgICAgKTtcbiAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICB0eXBlOiBcInJlbG9hZFwiLFxuICAgICAgICAgICAgY2hhbmdlOiB3YXRjaEUsXG4gICAgICAgICAgfTtcbiAgICAgICAgICBhd2FpdCB0aGlzLnJlbG9hZCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHlpZWxkIHtcbiAgICAgIHR5cGU6IFwiZXhpdFwiLFxuICAgIH07XG4gIH1cblxuICBbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCk6IEFzeW5jSXRlcmF0b3I8RGVub25FdmVudD4ge1xuICAgIHJldHVybiB0aGlzLml0ZXJhdGUoKTtcbiAgfVxufVxuIl19