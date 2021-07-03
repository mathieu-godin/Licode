import { deferred, delay, globToRegExp, log, relative, walk } from "../deps.ts";
const logger = log.create("path");
export class Watcher {
    #signal = deferred();
    #changes = {};
    #paths = [Deno.cwd()];
    #interval = 350;
    #exts = undefined;
    #match = undefined;
    #skip = undefined;
    #watch = this.denoWatch;
    #config;
    constructor(config = {}) {
        this.#config = config;
        this.reload();
    }
    reload() {
        this.#watch = this.#config.legacy ? this.legacyWatch : this.denoWatch;
        if (this.#config.paths) {
            this.#paths = this.#config.paths;
        }
        if (this.#config.interval) {
            this.#interval = this.#config.interval;
        }
        if (this.#config.exts) {
            this.#exts = this.#config.exts.map((_) => _.startsWith(".") ? _ : `.${_}`);
        }
        if (this.#config.match) {
            this.#match = this.#config.match.map((_) => globToRegExp(_));
        }
        if (this.#config.skip) {
            this.#skip = this.#config.skip.map((_) => globToRegExp(_));
        }
    }
    isWatched(path) {
        path = this.verifyPath(path);
        logger.debug(`trying to match ${path}`);
        if (this.#exts?.length && this.#exts?.every((ext) => !path.endsWith(ext))) {
            logger.debug(`path ${path} does not have right extension`);
            return false;
        }
        if (this.#skip?.length &&
            this.#skip?.some((skip) => path.match(skip))) {
            logger.debug(`path ${path} is skipped`);
            return false;
        }
        if (this.#match?.length && this.#match?.every((match) => !path.match(match))) {
            logger.debug(`path ${path} is not matched`);
            return false;
        }
        logger.debug(`path ${path} is matched`);
        return true;
    }
    reset() {
        this.#changes = {};
        this.#signal = deferred();
    }
    verifyPath(path) {
        for (const directory of this.#paths) {
            const rel = relative(directory, path);
            if (rel && !rel.startsWith("..")) {
                path = relative(directory, path);
            }
        }
        return path;
    }
    async *iterate() {
        this.#watch();
        while (true) {
            await this.#signal;
            yield Object.entries(this.#changes).map(([path, type]) => ({
                path,
                type,
            }));
            this.reset();
        }
    }
    [Symbol.asyncIterator]() {
        return this.iterate();
    }
    async denoWatch() {
        let timer = 0;
        const debounce = () => {
            clearTimeout(timer);
            timer = setTimeout(this.#signal.resolve, this.#interval);
        };
        const run = async () => {
            for await (const event of Deno.watchFs(this.#paths)) {
                const { kind, paths } = event;
                for (const path of paths) {
                    if (this.isWatched(path)) {
                        if (!this.#changes[path])
                            this.#changes[path] = [];
                        this.#changes[path].push(kind);
                        debounce();
                    }
                }
            }
        };
        run();
        while (true) {
            debounce();
            await delay(this.#interval);
        }
    }
    async legacyWatch() {
        let timer = 0;
        const debounce = () => {
            clearTimeout(timer);
            timer = setTimeout(this.#signal.resolve, this.#interval);
        };
        const walkPaths = async () => {
            const tree = {};
            for (const i in this.#paths) {
                const action = walk(this.#paths[i], {
                    maxDepth: Infinity,
                    includeDirs: false,
                    followSymlinks: false,
                    exts: this.#exts,
                    match: this.#match,
                    skip: this.#skip,
                });
                for await (const { path } of action) {
                    if (this.isWatched(path)) {
                        const stat = await Deno.stat(path);
                        tree[path] = stat.mtime;
                    }
                }
            }
            return tree;
        };
        let previous = await walkPaths();
        while (true) {
            const current = await walkPaths();
            for (const path in previous) {
                const pre = previous[path];
                const post = current[path];
                if (pre && !post) {
                    if (!this.#changes[path])
                        this.#changes[path] = [];
                    this.#changes[path].push("remove");
                }
                else if (pre && post && pre.getTime() !== post.getTime()) {
                    if (!this.#changes[path])
                        this.#changes[path] = [];
                    this.#changes[path].push("modify");
                }
            }
            for (const path in current) {
                if (!previous[path] && current[path]) {
                    if (!this.#changes[path])
                        this.#changes[path] = [];
                    this.#changes[path].push("create");
                }
            }
            previous = current;
            debounce();
            await delay(this.#interval);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZGVub25AMi40Ljgvc3JjL3dhdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBRWhGLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7QUFvQ2xDLE1BQU0sT0FBTyxPQUFPO0lBQ2xCLE9BQU8sR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUNyQixRQUFRLEdBQW9DLEVBQUUsQ0FBQztJQUMvQyxNQUFNLEdBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztJQUNoQyxTQUFTLEdBQUcsR0FBRyxDQUFDO0lBQ2hCLEtBQUssR0FBYyxTQUFTLENBQUM7SUFDN0IsTUFBTSxHQUFjLFNBQVMsQ0FBQztJQUM5QixLQUFLLEdBQWMsU0FBUyxDQUFDO0lBQzdCLE1BQU0sR0FBd0IsSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUM3QyxPQUFPLENBQWdCO0lBRXZCLFlBQVksU0FBd0IsRUFBRTtRQUNwQyxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztRQUN0QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDaEIsQ0FBQztJQUVELE1BQU07UUFDSixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ3RFLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUU7WUFDdEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztTQUNsQztRQUNE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