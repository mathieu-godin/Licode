import { compile, pathParse, pathToRegexp, Status, } from "./deps.ts";
import { httpErrors } from "./httpError.ts";
import { compose } from "./middleware.ts";
import { assert, decodeComponent } from "./util.ts";
function toUrl(url, params = {}, options) {
    const tokens = pathParse(url);
    let replace = {};
    if (tokens.some((token) => typeof token === "object")) {
        replace = params;
    }
    else {
        options = params;
    }
    const toPath = compile(url, options);
    const replaced = toPath(replace);
    if (options && options.query) {
        const url = new URL(replaced, "http://oak");
        if (typeof options.query === "string") {
            url.search = options.query;
        }
        else {
            url.search = String(options.query instanceof URLSearchParams
                ? options.query
                : new URLSearchParams(options.query));
        }
        return `${url.pathname}${url.search}${url.hash}`;
    }
    return replaced;
}
class Layer {
    #opts;
    #paramNames = [];
    #regexp;
    methods;
    name;
    path;
    stack;
    constructor(path, methods, middleware, { name, ...opts } = {}) {
        this.#opts = opts;
        this.name = name;
        this.methods = [...methods];
        if (this.methods.includes("GET")) {
            this.methods.unshift("HEAD");
        }
        this.stack = Array.isArray(middleware) ? middleware.slice() : [middleware];
        this.path = path;
        this.#regexp = pathToRegexp(path, this.#paramNames, this.#opts);
    }
    clone() {
        return new Layer(this.path, this.methods, this.stack, { name: this.name, ...this.#opts });
    }
    match(path) {
        return this.#regexp.test(path);
    }
    params(captures, existingParams = {}) {
        const params = existingParams;
        for (let i = 0; i < captures.length; i++) {
            if (this.#paramNames[i]) {
                const c = captures[i];
                params[this.#paramNames[i].name] = c ? decodeComponent(c) : c;
            }
        }
        return params;
    }
    captures(path) {
        if (this.#opts.ignoreCaptures) {
            return [];
        }
        return path.match(this.#regexp)?.slice(1) ?? [];
    }
    url(params = {}, options) {
        const url = this.path.replace(/\(\.\*\)/g, "");
        return toUrl(url, params, options);
    }
    param(param, fn) {
        const stack = this.stack;
        const params = this.#paramNames;
        const middleware = function (ctx, next) {
            const p = ctx.params[param];
            assert(p);
            return fn.call(this, p, ctx, next);
        };
        middleware.param = param;
        const names = params.map((p) => p.name);
        const x = names.indexOf(param);
        if (x >= 0) {
            for (let i = 0; i < stack.length; i++) {
                const fn = stack[i];
                if (!fn.param || names.indexOf(fn.param) > x) {
                    stack.splice(i, 0, middleware);
                    break;
                }
            }
        }
        return this;
    }
    setPrefix(prefix) {
        if (this.path) {
            this.path = this.path !== "/" || this.#opts.strict === true
                ? `${prefix}${this.path}`
                : prefix;
            this.#paramNames = [];
            this.#regexp = pathToRegexp(this.path, this.#paramNames, this.#opts);
        }
        return this;
    }
    toJSON() {
        return {
            methods: [...this.methods],
            middleware: [...this.stack],
            paramNames: this.#paramNames.map((key) => key.name),
            path: this.path,
            regexp: this.#regexp,
            options: { ...this.#opts },
        };
    }
    [Symbol.for("Deno.customInspect")](inspect) {
        return `${this.constructor.name} ${inspect({
            methods: this.methods,
            middleware: this.stack,
            options: this.#opts,
            paramNames: this.#paramNames.map((key) => key.name),
            path: this.path,
            regexp: this.#regexp,
        })}`;
    }
    [Symbol.for("nodejs.util.inspect.custom")](depth, options, inspect) {
        if (depth < 0) {
            return options.stylize(`[${this.constructor.name}]`, "special");
        }
        const newOptions = Object.assign({}, options, {
            depth: options.depth === null ? null : options.depth - 1,
        });
        return `${options.stylize(this.constructor.name, "special")} ${inspect({
            methods: this.methods,
            middleware: this.stack,
            options: this.#opts,
            paramNames: this.#paramNames.map((key) => key.name),
            path: this.path,
            regexp: this.#regexp,
        }, newOptions)}`;
    }
}
export class Router {
    #opts;
    #methods;
    #params = {};
    #stack = [];
    #match(path, method) {
        const matches = {
            path: [],
            pathAndMethod: [],
            route: false,
        };
        for (const route of this.#stack) {
            if (route.match(path)) {
                matches.path.push(route);
                if (route.methods.length === 0 || route.methods.includes(method)) {
                    matches.pathAndMethod.push(route);
                    if (route.methods.length) {
                        matches.route = true;
                    }
                }
            }
        }
        return matches;
    }
    #register(path, middlewares, methods, options = {}) {
        if (Array.isArray(path)) {
            for (const p of path) {
                this.#register(p, middlewares, methods, options);
            }
            return;
        }
        let layerMiddlewares = [];
        for (const middleware of middlewares) {
            if (!middleware.router) {
                layerMiddlewares.push(middleware);
                continue;
            }
            if (layerMiddlewares.length) {
                this.#addLayer(path, layerMiddlewares, methods, options);
                layerMiddlewares = [];
            }
            const router = middleware.router.#clone();
            for (const layer of router.#stack) {
                if (!options.ignorePrefix) {
                    layer.setPrefix(path);
                }
                if (this.#opts.prefix) {
                    layer.setPrefix(this.#opts.prefix);
                }
                this.#stack.push(layer);
            }
            for (const [param, mw] of Object.entries(this.#params)) {
                router.param(param, mw);
            }
        }
        if (layerMiddlewares.length) {
            this.#addLayer(path, layerMiddlewares, methods, options);
        }
    }
    #addLayer(path, middlewares, methods, options = {}) {
        const { end, name, sensitive = this.#opts.sensitive, strict = this.#opts.strict, ignoreCaptures, } = options;
        const route = new Layer(path, methods, middlewares, {
            end,
            name,
            sensitive,
            strict,
            ignoreCaptures,
        });
        if (this.#opts.prefix) {
            route.setPrefix(this.#opts.prefix);
        }
        for (const [param, mw] of Object.entries(this.#params)) {
            route.param(param, mw);
        }
        this.#stack.push(route);
    }
    #route(name) {
        for (const route of this.#stack) {
            if (route.name === name) {
                return route;
            }
        }
    }
    #useVerb(nameOrPath, pathOrMiddleware, middleware, methods) {
        let name = undefined;
        let path;
        if (typeof pathOrMiddleware === "string") {
            name = nameOrPath;
            path = pathOrMiddleware;
        }
        else {
            path = nameOrPath;
            middleware.unshift(pathOrMiddleware);
        }
        this.#register(path, middleware, methods, { name });
    }
    #clone() {
        const router = new Router(this.#opts);
        router.#methods = router.#methods.slice();
        router.#params = { ...this.#params };
        router.#stack = this.#stack.map((layer) => layer.clone());
        return router;
    }
    constructor(opts = {}) {
        this.#opts = opts;
        this.#methods = opts.methods ?? [
            "DELETE",
            "GET",
            "HEAD",
            "OPTIONS",
            "PATCH",
            "POST",
            "PUT",
        ];
    }
    all(nameOrPath, pathOrMiddleware, ...middleware) {
        this.#useVerb(nameOrPath, pathOrMiddleware, middleware, ["DELETE", "GET", "POST", "PUT"]);
        return this;
    }
    allowedMethods(options = {}) {
        const implemented = this.#methods;
        const allowedMethods = async (context, next) => {
            const ctx = context;
            await next();
            if (!ctx.response.status || ctx.response.status === Status.NotFound) {
                assert(ctx.matched);
                const allowed = new Set();
                for (const route of ctx.matched) {
                    for (const method of route.methods) {
                        allowed.add(method);
                    }
                }
                const allowedStr = [...allowed].join(", ");
                if (!implemented.includes(ctx.request.method)) {
                    if (options.throw) {
                        throw options.notImplemented
                            ? options.notImplemented()
                            : new httpErrors.NotImplemented();
                    }
                    else {
                        ctx.response.status = Status.NotImplemented;
                        ctx.response.headers.set("Allowed", allowedStr);
                    }
                }
                else if (allowed.size) {
                    if (ctx.request.method === "OPTIONS") {
                        ctx.response.status = Status.OK;
                        ctx.response.headers.set("Allowed", allowedStr);
                    }
                    else if (!allowed.has(ctx.request.method)) {
                        if (options.throw) {
                            throw options.methodNotAllowed
                                ? options.methodNotAllowed()
                                : new httpErrors.MethodNotAllowed();
                        }
                        else {
                            ctx.response.status = Status.MethodNotAllowed;
                            ctx.response.headers.set("Allowed", allowedStr);
                        }
                    }
                }
            }
        };
        return allowedMethods;
    }
    delete(nameOrPath, pathOrMiddleware, ...middleware) {
        this.#useVerb(nameOrPath, pathOrMiddleware, middleware, ["DELETE"]);
        return this;
    }
    *entries() {
        for (const route of this.#stack) {
            const value = route.toJSON();
            yield [value, value];
        }
    }
    forEach(callback, thisArg = null) {
        for (const route of this.#stack) {
            const value = route.toJSON();
            callback.call(thisArg, value, value, this);
        }
    }
    get(nameOrPath, pathOrMiddleware, ...middleware) {
        this.#useVerb(nameOrPath, pathOrMiddleware, middleware, ["GET"]);
        return this;
    }
    head(nameOrPath, pathOrMiddleware, ...middleware) {
        this.#useVerb(nameOrPath, pathOrMiddleware, middleware, ["HEAD"]);
        return this;
    }
    *keys() {
        for (const route of this.#stack) {
            yield route.toJSON();
        }
    }
    options(nameOrPath, pathOrMiddleware, ...middleware) {
        this.#useVerb(nameOrPath, pathOrMiddleware, middleware, ["OPTIONS"]);
        return this;
    }
    param(param, middleware) {
        this.#params[param] = middleware;
        for (const route of this.#stack) {
            route.param(param, middleware);
        }
        return this;
    }
    patch(nameOrPath, pathOrMiddleware, ...middleware) {
        this.#useVerb(nameOrPath, pathOrMiddleware, middleware, ["PATCH"]);
        return this;
    }
    post(nameOrPath, pathOrMiddleware, ...middleware) {
        this.#useVerb(nameOrPath, pathOrMiddleware, middleware, ["POST"]);
        return this;
    }
    prefix(prefix) {
        prefix = prefix.replace(/\/$/, "");
        this.#opts.prefix = prefix;
        for (const route of this.#stack) {
            route.setPrefix(prefix);
        }
        return this;
    }
    put(nameOrPath, pathOrMiddleware, ...middleware) {
        this.#useVerb(nameOrPath, pathOrMiddleware, middleware, ["PUT"]);
        return this;
    }
    redirect(source, destination, status = Status.Found) {
        if (source[0] !== "/") {
            const s = this.url(source);
            if (!s) {
                throw new RangeError(`Could not resolve named route: "${source}"`);
            }
            source = s;
        }
        if (typeof destination === "string") {
            if (destination[0] !== "/") {
                const d = this.url(destination);
                if (!d) {
                    try {
                        const url = new URL(destination);
                        destination = url;
                    }
                    catch {
                        throw new RangeError(`Could not resolve named route: "${source}"`);
                    }
                }
                else {
                    destination = d;
                }
            }
        }
        this.all(source, async (ctx, next) => {
            await next();
            ctx.response.redirect(destination);
            ctx.response.status = status;
        });
        return this;
    }
    routes() {
        const dispatch = (context, next) => {
            const ctx = context;
            let pathname;
            let method;
            try {
                const { url: { pathname: p }, method: m } = ctx.request;
                pathname = p;
                method = m;
            }
            catch (e) {
                return Promise.reject(e);
            }
            const path = this.#opts.routerPath ?? ctx.routerPath ??
                decodeURI(pathname);
            const matches = this.#match(path, method);
            if (ctx.matched) {
                ctx.matched.push(...matches.path);
            }
            else {
                ctx.matched = [...matches.path];
            }
            ctx.router = this;
            if (!matches.route)
                return next();
            const { pathAndMethod: matchedRoutes } = matches;
            const chain = matchedRoutes.reduce((prev, route) => [
                ...prev,
                (ctx, next) => {
                    ctx.captures = route.captures(path);
                    ctx.params = route.params(ctx.captures, ctx.params);
                    ctx.routeName = route.name;
                    return next();
                },
                ...route.stack,
            ], []);
            return compose(chain)(ctx, next);
        };
        dispatch.router = this;
        return dispatch;
    }
    url(name, params, options) {
        const route = this.#route(name);
        if (route) {
            return route.url(params, options);
        }
    }
    use(pathOrMiddleware, ...middleware) {
        let path;
        if (typeof pathOrMiddleware === "string" || Array.isArray(pathOrMiddleware)) {
            path = pathOrMiddleware;
        }
        else {
            middleware.unshift(pathOrMiddleware);
        }
        this.#register(path ?? "(.*)", middleware, [], { end: false, ignoreCaptures: !path, ignorePrefix: !path });
        return this;
    }
    *values() {
        for (const route of this.#stack) {
            yield route.toJSON();
        }
    }
    *[Symbol.iterator]() {
        for (const route of this.#stack) {
            yield route.toJSON();
        }
    }
    static url(path, params, options) {
        return toUrl(path, params, options);
    }
    [Symbol.for("Deno.customInspect")](inspect) {
        return `${this.constructor.name} ${inspect({ "#params": this.#params, "#stack": this.#stack })}`;
    }
    [Symbol.for("nodejs.util.inspect.custom")](depth, options, inspect) {
        if (depth < 0) {
            return options.stylize(`[${this.constructor.name}]`, "special");
        }
        const newOptions = Object.assign({}, options, {
            depth: options.depth === null ? null : options.depth - 1,
        });
        return `${options.stylize(this.constructor.name, "special")} ${inspect({ "#params": this.#params, "#stack": this.#stack }, newOptions)}`;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicm91dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTZCQSxPQUFPLEVBQ0wsT0FBTyxFQUdQLFNBQVMsRUFDVCxZQUFZLEVBQ1osTUFBTSxHQUVQLE1BQU0sV0FBVyxDQUFDO0FBQ25CLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUM1QyxPQUFPLEVBQUUsT0FBTyxFQUFjLE1BQU0saUJBQWlCLENBQUM7QUFFdEQsT0FBTyxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFtTHBELFNBQVMsS0FBSyxDQUNaLEdBQVcsRUFDWCxTQUFTLEVBQW9CLEVBQzdCLE9BQW9CO0lBRXBCLE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5QixJQUFJLE9BQU8sR0FBRyxFQUFvQixDQUFDO0lBRW5DLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsT0FBTyxLQUFLLEtBQUssUUFBUSxDQUFDLEVBQUU7UUFDckQsT0FBTyxHQUFHLE1BQU0sQ0FBQztLQUNsQjtTQUFNO1FBQ0wsT0FBTyxHQUFHLE1BQU0sQ0FBQztLQUNsQjtJQUVELE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDckMsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRWpDLElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUU7UUFDNUIsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQzVDLElBQUksT0FBTyxPQUFPLENBQUMsS0FBSyxLQUFLLFFBQVEsRUFBRTtZQUNyQyxHQUFHLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7U0FDNUI7YUFBTTtZQUNM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QyxJQUFJLEVBQUUsU0FBUyxDQUFDLElBQ3pELE9BQU8sQ0FDTCxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQ2xELFVBQVUsQ0FFZCxFQUFFLENBQUM7SUFDTCxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEFkYXB0ZWQgZGlyZWN0bHkgZnJvbSBAa29hL3JvdXRlciBhdFxuICogaHR0cHM6Ly9naXRodWIuY29tL2tvYWpzL3JvdXRlci8gd2hpY2ggaXMgbGljZW5zZWQgYXM6XG4gKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEFsZXhhbmRlciBDLiBNaW5nb2lhXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7IFN0YXRlIH0gZnJvbSBcIi4vYXBwbGljYXRpb24udHNcIjtcbmltcG9ydCB0eXBlIHsgQ29udGV4dCB9IGZyb20gXCIuL2NvbnRleHQudHNcIjtcbmltcG9ydCB7XG4gIGNvbXBpbGUsXG4gIEtleSxcbiAgUGFyc2VPcHRpb25zLFxuICBwYXRoUGFyc2UsXG4gIHBhdGhUb1JlZ2V4cCxcbiAgU3RhdHVzLFxuICBUb2tlbnNUb1JlZ2V4cE9wdGlvbnMsXG59IGZyb20gXCIuL2RlcHMudHNcIjtcbmltcG9ydCB7IGh0dHBFcnJvcnMgfSBmcm9tIFwiLi9odHRwRXJyb3IudHNcIjtcbmltcG9ydCB7IGNvbXBvc2UsIE1pZGRsZXdhcmUgfSBmcm9tIFwiLi9taWRkbGV3YXJlLnRzXCI7XG5pbXBvcnQgdHlwZSB7IEhUVFBNZXRob2RzLCBSZWRpcmVjdFN0YXR1cyB9IGZyb20gXCIuL3R5cGVzLmQudHNcIjtcbmltcG9ydCB7IGFzc2VydCwgZGVjb2RlQ29tcG9uZW50IH0gZnJvbSBcIi4vdXRpbC50c1wiO1xuXG5pbnRlcmZhY2UgTWF0Y2hlczxSIGV4dGVuZHMgc3RyaW5nPiB7XG4gIHBhdGg6IExheWVyPFI+W107XG4gIHBhdGhBbmRNZXRob2Q6IExheWVyPFI+W107XG4gIHJvdXRlOiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJvdXRlckFsbG93ZWRNZXRob2RzT3B0aW9ucyB7XG4gIC8qKiBVc2UgdGhlIHZhbHVlIHJldHVybmVkIGZyb20gdGhpcyBmdW5jdGlvbiBpbnN0ZWFkIG9mIGFuIEhUVFAgZXJyb3JcbiAgICogYE1ldGhvZE5vdEFsbG93ZWRgLiAqL1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBtZXRob2ROb3RBbGxvd2VkPygpOiBhbnk7XG5cbiAgLyoqIFVzZSB0aGUgdmFsdWUgcmV0dXJuZWQgZnJvbSB0aGlzIGZ1bmN0aW9uIGluc3RlYWQgb2YgYW4gSFRUUCBlcnJvclxuICAgKiBgTm90SW1wbGVtZW50ZWRgLiAqL1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBub3RJbXBsZW1lbnRlZD8oKTogYW55O1xuXG4gIC8qKiBXaGVuIGRlYWxpbmcgd2l0aCBhIG5vbi1pbXBsZW1lbnRlZCBtZXRob2Qgb3IgYSBtZXRob2Qgbm90IGFsbG93ZWQsIHRocm93XG4gICAqIGFuIGVycm9yIGluc3RlYWQgb2Ygc2V0dGluZyB0aGUgc3RhdHVzIGFuZCBoZWFkZXIgZm9yIHRoZSByZXNwb25zZS4gKi9cbiAgdGhyb3c/OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJvdXRlPFxuICBSIGV4dGVuZHMgc3RyaW5nLFxuICBQIGV4dGVuZHMgUm91dGVQYXJhbXM8Uj4gPSBSb3V0ZVBhcmFtczxSPixcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgUyBleHRlbmRzIFN0YXRlID0gUmVjb3JkPHN0cmluZywgYW55Pixcbj4ge1xuICAvKiogVGhlIEhUVFAgbWV0aG9kcyB0aGF0IHRoaXMgcm91dGUgaGFuZGxlcy4gKi9cbiAgbWV0aG9kczogSFRUUE1ldGhvZHNbXTtcblxuICAvKiogVGhlIG1pZGRsZXdhcmUgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhpcyByb3V0ZS4gKi9cbiAgbWlkZGxld2FyZTogUm91dGVyTWlkZGxld2FyZTxSLCBQLCBTPltdO1xuXG4gIC8qKiBBbiBvcHRpb25hbCBuYW1lIGZvciB0aGUgcm91dGUuICovXG4gIG5hbWU/OiBzdHJpbmc7XG5cbiAgLyoqIE9wdGlvbnMgdGhhdCB3ZXJlIHVzZWQgdG8gY3JlYXRlIHRoZSByb3V0ZS4gKi9cbiAgb3B0aW9uczogTGF5ZXJPcHRpb25zO1xuXG4gIC8qKiBUaGUgcGFyYW1ldGVycyB0aGF0IGFyZSBpZGVudGlmaWVkIGluIHRoZSByb3V0ZSB0aGF0IHdpbGwgYmUgcGFyc2VkIG91dFxuICAgKiBvbiBtYXRjaGVkIHJlcXVlc3RzLiAqL1xuICBwYXJhbU5hbWVzOiAoa2V5b2YgUClbXTtcblxuICAvKiogVGhlIHBhdGggdGhhdCB0aGlzIHJvdXRlIG1hbmFnZXMuICovXG4gIHBhdGg6IHN0cmluZztcblxuICAvKiogVGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIGZvciBtYXRjaGluZyBhbmQgcGFyc2luZyBwYXJhbWV0ZXJzIGZvciB0aGVcbiAgICogcm91dGUuICovXG4gIHJlZ2V4cDogUmVnRXhwO1xufVxuXG4vKiogVGhlIGNvbnRleHQgcGFzc2VkIHJvdXRlciBtaWRkbGV3YXJlLiAgKi9cbmV4cG9ydCBpbnRlcmZhY2UgUm91dGVyQ29udGV4dDxcbiAgUiBleHRlbmRzIHN0cmluZyxcbiAgUCBleHRlbmRzIFJvdXRlUGFyYW1zPFI+ID0gUm91dGVQYXJhbXM8Uj4sXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIFMgZXh0ZW5kcyBTdGF0ZSA9IFJlY29yZDxzdHJpbmcsIGFueT4sXG4+IGV4dGVuZHMgQ29udGV4dDxTPiB7XG4gIC8qKiBXaGVuIG1hdGNoaW5nIHRoZSByb3V0ZSwgYW4gYXJyYXkgb2YgdGhlIGNhcHR1cmluZyBncm91cHMgZnJvbSB0aGUgcmVndWxhclxuICAgKiBleHByZXNzaW9uLiAqL1xuICBjYXB0dXJlczogc3RyaW5nW107XG5cbiAgLyoqIFRoZSByb3V0ZXMgdGhhdCB3ZXJlIG1hdGNoZWQgZm9yIHRoaXMgcmVxdWVzdC4gKi9cbiAgbWF0Y2hlZD86IExheWVyPFIsIFAsIFM+W107XG5cbiAgLyoqIEFueSBwYXJhbWV0ZXJzIHBhcnNlZCBmcm9tIHRoZSByb3V0ZSB3aGVuIG1hdGNoZWQuICovXG4gIHBhcmFtczogUDtcblxuICAvKiogQSByZWZlcmVuY2UgdG8gdGhlIHJvdXRlciBpbnN0YW5jZS4gKi9cbiAgcm91dGVyOiBSb3V0ZXI7XG5cbiAgLyoqIElmIHRoZSBtYXRjaGVkIHJvdXRlIGhhcyBhIGBuYW1lYCwgdGhlIG1hdGNoZWQgcm91dGUgbmFtZSBpcyBwcm92aWRlZFxuICAgKiBoZXJlLiAqL1xuICByb3V0ZU5hbWU/OiBzdHJpbmc7XG5cbiAgLyoqIE92ZXJyaWRlcyB0aGUgbWF0Y2hlZCBwYXRoIGZvciBmdXR1cmUgcm91dGUgbWlkZGxld2FyZSwgd2hlbiBhXG4gICAqIGByb3V0ZXJQYXRoYCBvcHRpb24gaXMgbm90IGRlZmluZWQgb24gdGhlIGBSb3V0ZXJgIG9wdGlvbnMuICovXG4gIHJvdXRlclBhdGg/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUm91dGVyTWlkZGxld2FyZTxcbiAgUiBleHRlbmRzIHN0cmluZyxcbiAgUCBleHRlbmRzIFJvdXRlUGFyYW1zPFI+ID0gUm91dGVQYXJhbXM8Uj4sXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIFMgZXh0ZW5kcyBTdGF0ZSA9IFJlY29yZDxzdHJpbmcsIGFueT4sXG4+IHtcbiAgKGNvbnRleHQ6IFJvdXRlckNvbnRleHQ8UiwgUCwgUz4sIG5leHQ6ICgpID0+IFByb21pc2U8dW5rbm93bj4pOlxuICAgIHwgUHJvbWlzZTx1bmtub3duPlxuICAgIHwgdW5rbm93bjtcbiAgLyoqIEZvciByb3V0ZSBwYXJhbWV0ZXIgbWlkZGxld2FyZSwgdGhlIGBwYXJhbWAga2V5IGZvciB0aGlzIHBhcmFtZXRlciB3aWxsXG4gICAqIGJlIHNldC4gKi9cbiAgcGFyYW0/OiBrZXlvZiBQO1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICByb3V0ZXI/OiBSb3V0ZXI8YW55Pjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSb3V0ZXJPcHRpb25zIHtcbiAgLyoqIE92ZXJyaWRlIHRoZSBkZWZhdWx0IHNldCBvZiBtZXRob2RzIHN1cHBvcnRlZCBieSB0aGUgcm91dGVyLiAqL1xuICBtZXRob2RzPzogSFRUUE1ldGhvZHNbXTtcblxuICAvKiogT25seSBoYW5kbGUgcm91dGVzIHdoZXJlIHRoZSByZXF1ZXN0ZWQgcGF0aCBzdGFydHMgd2l0aCB0aGUgcHJlZml4LiAqL1xuICBwcmVmaXg/OiBzdHJpbmc7XG5cbiAgLyoqIE92ZXJyaWRlIHRoZSBgcmVxdWVzdC51cmwucGF0aG5hbWVgIHdoZW4gbWF0Y2hpbmcgbWlkZGxld2FyZSB0byBydW4uICovXG4gIHJvdXRlclBhdGg/OiBzdHJpbmc7XG5cbiAgLyoqIERldGVybWluZXMgaWYgcm91dGVzIGFyZSBtYXRjaGVkIGluIGEgY2FzZSBzZW5zaXRpdmUgd2F5LiAgRGVmYXVsdHMgdG9cbiAgICogYGZhbHNlYC4gKi9cbiAgc2Vuc2l0aXZlPzogYm9vbGVhbjtcblxuICAvKiogRGV0ZXJtaW5lcyBpZiByb3V0ZXMgYXJlIG1hdGNoZWQgc3RyaWN0bHksIHdoZXJlIHRoZSB0cmFpbGluZyBgL2AgaXMgbm90XG4gICAqIG9wdGlvbmFsLiAgRGVmYXVsdHMgdG8gYGZhbHNlYC4gKi9cbiAgc3RyaWN0PzogYm9vbGVhbjtcbn1cblxuLyoqIE1pZGRsZXdhcmUgdGhhdCB3aWxsIGJlIGNhbGxlZCBieSB0aGUgcm91dGVyIHdoZW4gaGFuZGxpbmcgYSBzcGVjaWZpY1xuICogcGFyYW1ldGVyLCB3aGljaCB0aGUgbWlkZGxld2FyZSB3aWxsIGJlIGNhbGxlZCB3aGVuIGEgcmVxdWVzdCBtYXRjaGVzIHRoZVxuICogcm91dGUgcGFyYW1ldGVyLiAqL1xuZXhwb3J0IGludGVyZmFjZSBSb3V0ZXJQYXJhbU1pZGRsZXdhcmU8XG4gIFIgZXh0ZW5kcyBzdHJpbmcsXG4gIFAgZXh0ZW5kcyBSb3V0ZVBhcmFtczxSPiA9IFJvdXRlUGFyYW1zPFI+LFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBTIGV4dGVuZHMgU3RhdGUgPSBSZWNvcmQ8c3RyaW5nLCBhbnk+LFxuPiB7XG4gIChcbiAgICBwYXJhbTogc3RyaW5nLFxuICAgIGNvbnRleHQ6IFJvdXRlckNvbnRleHQ8UiwgUCwgUz4sXG4gICAgbmV4dDogKCkgPT4gUHJvbWlzZTx1bmtub3duPixcbiAgKTogUHJvbWlzZTx1bmtub3duPiB8IHVua25vd247XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIHJvdXRlcj86IFJvdXRlcjxhbnk+O1xufVxuXG5pbnRlcmZhY2UgUGFyYW1zRGljdGlvbmFyeSB7XG4gIFtrZXk6IHN0cmluZ106IHN0cmluZztcbn1cblxudHlwZSBSZW1vdmVUYWlsPFMgZXh0ZW5kcyBzdHJpbmcsIFRhaWwgZXh0ZW5kcyBzdHJpbmc+ID0gUyBleHRlbmRzXG4gIGAke2luZmVyIFB9JHtUYWlsfWAgPyBQIDogUztcblxudHlwZSBHZXRSb3V0ZVBhcmFtczxTIGV4dGVuZHMgc3RyaW5nPiA9IFJlbW92ZVRhaWw8XG4gIFJlbW92ZVRhaWw8UmVtb3ZlVGFpbDxTLCBgLyR7c3RyaW5nfWA+LCBgLSR7c3RyaW5nfWA+LFxuICBgLiR7c3RyaW5nfWBcbj47XG5cbmV4cG9ydCB0eXBlIFJvdXRlUGFyYW1zPFJvdXRlIGV4dGVuZHMgc3RyaW5nPiA9IHN0cmluZyBleHRlbmRzIFJvdXRlXG4gID8gUGFyYW1zRGljdGlvbmFyeVxuICA6IFJvdXRlIGV4dGVuZHMgYCR7c3RyaW5nfSgke3N0cmluZ31gID8gUGFyYW1zRGljdGlvbmFyeVxuICA6IFJvdXRlIGV4dGVuZHMgYCR7c3RyaW5nfToke2luZmVyIFJlc3R9YCA/IFxuICAgICYgKFxuICAgICAgR2V0Um91dGVQYXJhbXM8UmVzdD4gZXh0ZW5kcyBuZXZlciA/IFBhcmFtc0RpY3Rpb25hcnlcbiAgICAgICAgOiBHZXRSb3V0ZVBhcmFtczxSZXN0PiBleHRlbmRzIGAke2luZmVyIFBhcmFtTmFtZX0/YFxuICAgICAgICAgID8geyBbUCBpbiBQYXJhbU5hbWVdPzogc3RyaW5nIH1cbiAgICAgICAgOiB7IFtQIGluIEdldFJvdXRlUGFyYW1zPFJlc3Q+XTogc3RyaW5nIH1cbiAgICApXG4gICAgJiAoUmVzdCBleHRlbmRzIGAke0dldFJvdXRlUGFyYW1zPFJlc3Q+fSR7aW5mZXIgTmV4dH1gID8gUm91dGVQYXJhbXM8TmV4dD5cbiAgICAgIDogdW5rbm93bilcbiAgOiBSZWNvcmQ8c3RyaW5nIHwgbnVtYmVyLCBzdHJpbmcgfCB1bmRlZmluZWQ+O1xuXG50eXBlIExheWVyT3B0aW9ucyA9IFRva2Vuc1RvUmVnZXhwT3B0aW9ucyAmIFBhcnNlT3B0aW9ucyAmIHtcbiAgaWdub3JlQ2FwdHVyZXM/OiBib29sZWFuO1xuICBuYW1lPzogc3RyaW5nO1xufTtcblxudHlwZSBSZWdpc3Rlck9wdGlvbnMgPSBMYXllck9wdGlvbnMgJiB7XG4gIGlnbm9yZVByZWZpeD86IGJvb2xlYW47XG59O1xuXG50eXBlIFVybE9wdGlvbnMgPSBUb2tlbnNUb1JlZ2V4cE9wdGlvbnMgJiBQYXJzZU9wdGlvbnMgJiB7XG4gIC8qKiBXaGVuIGdlbmVyYXRpbmcgYSBVUkwgZnJvbSBhIHJvdXRlLCBhZGQgdGhlIHF1ZXJ5IHRvIHRoZSBVUkwuICBJZiBhblxuICAgKiBvYmplY3QgKi9cbiAgcXVlcnk/OiBVUkxTZWFyY2hQYXJhbXMgfCBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHwgc3RyaW5nO1xufTtcblxuLyoqIEdlbmVyYXRlIGEgVVJMIGZyb20gYSBzdHJpbmcsIHBvdGVudGlhbGx5IHJlcGxhY2Ugcm91dGUgcGFyYW1zIHdpdGhcbiAqIHZhbHVlcy4gKi9cbmZ1bmN0aW9uIHRvVXJsPFIgZXh0ZW5kcyBzdHJpbmc+KFxuICB1cmw6IHN0cmluZyxcbiAgcGFyYW1zID0ge30gYXMgUm91dGVQYXJhbXM8Uj4sXG4gIG9wdGlvbnM/OiBVcmxPcHRpb25zLFxuKSB7XG4gIGNvbnN0IHRva2VucyA9IHBhdGhQYXJzZSh1cmwpO1xuICBsZXQgcmVwbGFjZSA9IHt9IGFzIFJvdXRlUGFyYW1zPFI+O1xuXG4gIGlmICh0b2tlbnMuc29tZSgodG9rZW4pID0+IHR5cGVvZiB0b2tlbiA9PT0gXCJvYmplY3RcIikpIHtcbiAgICByZXBsYWNlID0gcGFyYW1zO1xuICB9IGVsc2Uge1xuICAgIG9wdGlvbnMgPSBwYXJhbXM7XG4gIH1cblxuICBjb25zdCB0b1BhdGggPSBjb21waWxlKHVybCwgb3B0aW9ucyk7XG4gIGNvbnN0IHJlcGxhY2VkID0gdG9QYXRoKHJlcGxhY2UpO1xuXG4gIGlmIChvcHRpb25zICYmIG9wdGlvbnMucXVlcnkpIHtcbiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcGxhY2VkLCBcImh0dHA6Ly9vYWtcIik7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zLnF1ZXJ5ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB1cmwuc2VhcmNoID0gb3B0aW9ucy5xdWVyeTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXJsLnNlYXJjaCA9IFN0cmluZyhcbiAgICAgICAgb3B0aW9ucy5xdWVyeSBpbnN0YW5jZW9mIFVSTFNlYXJjaFBhcmFtc1xuICAgICAgICAgID8gb3B0aW9ucy5xdWVyeVxuICAgICAgICAgIDogbmV3IFVSTFNlYXJjaFBhcmFtcyhvcHRpb25zLnF1ZXJ5KSxcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBgJHt1cmwucGF0aG5hbWV9JHt1cmwuc2VhcmNofSR7dXJsLmhhc2h9YDtcbiAgfVxuICByZXR1cm4gcmVwbGFjZWQ7XG59XG5cbmNsYXNzIExheWVyPFxuICBSIGV4dGVuZHMgc3RyaW5nLFxuICBQIGV4dGVuZHMgUm91dGVQYXJhbXM8Uj4gPSBSb3V0ZVBhcmFtczxSPixcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgUyBleHRlbmRzIFN0YXRlID0gUmVjb3JkPHN0cmluZywgYW55Pixcbj4ge1xuICAjb3B0czogTGF5ZXJPcHRpb25zO1xuICAjcGFyYW1OYW1lczogS2V5W10gPSBbXTtcbiAgI3JlZ2V4cDogUmVnRXhwO1xuXG4gIG1ldGhvZHM6IEhUVFBNZXRob2RzW107XG4gIG5hbWU/OiBzdHJpbmc7XG4gIHBhdGg6IHN0cmluZztcbiAgc3RhY2s6IFJvdXRlck1pZGRsZXdhcmU8UiwgUCwgUz5bXTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgbWV0aG9kczogSFRUUE1ldGhvZHNbXSxcbiAgICBtaWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPFIsIFAsIFM+IHwgUm91dGVyTWlkZGxld2FyZTxSLCBQLCBTPltdLFxuICAgIHsgbmFtZSwgLi4ub3B0cyB9OiBMYXllck9wdGlvbnMgPSB7fSxcbiAgKSB7XG4gICAgdGhpcy4jb3B0cyA9IG9wdHM7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm1ldGhvZHMgPSBbLi4ubWV0aG9kc107XG4gICAgaWYgKHRoaXMubWV0aG9kcy5pbmNsdWRlcyhcIkdFVFwiKSkge1xuICAgICAgdGhpcy5tZXRob2RzLnVuc2hpZnQoXCJIRUFEXCIpO1xuICAgIH1cbiAgICB0aGlzLnN0YWNrID0gQXJyYXkuaXNBcnJheShtaWRkbGV3YXJlKSA/IG1pZGRsZXdhcmUuc2xpY2UoKSA6IFttaWRkbGV3YXJlXTtcbiAgICB0aGlzLnBhdGggPSBwYXRoO1xuICAgIHRoaXMuI3JlZ2V4cCA9IHBhdGhUb1JlZ2V4cChwYXRoLCB0aGlzLiNwYXJhbU5hbWVzLCB0aGlzLiNvcHRzKTtcbiAgfVxuXG4gIGNsb25lKCk6IExheWVyPFIsIFAsIFM+IHtcbiAgICByZXR1cm4gbmV3IExheWVyKFxuICAgICAgdGhpcy5wYXRoLFxuICAgICAgdGhpcy5tZXRob2RzLFxuICAgICAgdGhpcy5zdGFjayxcbiAgICAgIHsgbmFtZTogdGhpcy5uYW1lLCAuLi50aGlzLiNvcHRzIH0sXG4gICAgKTtcbiAgfVxuXG4gIG1hdGNoKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiNyZWdleHAudGVzdChwYXRoKTtcbiAgfVxuXG4gIHBhcmFtcyhcbiAgICBjYXB0dXJlczogc3RyaW5nW10sXG4gICAgZXhpc3RpbmdQYXJhbXMgPSB7fSBhcyBSb3V0ZVBhcmFtczxSPixcbiAgKTogUm91dGVQYXJhbXM8Uj4ge1xuICAgIGNvbnN0IHBhcmFtcyA9IGV4aXN0aW5nUGFyYW1zO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2FwdHVyZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLiNwYXJhbU5hbWVzW2ldKSB7XG4gICAgICAgIGNvbnN0IGMgPSBjYXB0dXJlc1tpXTtcbiAgICAgICAgcGFyYW1zW3RoaXMuI3BhcmFtTmFtZXNbaV0ubmFtZV0gPSBjID8gZGVjb2RlQ29tcG9uZW50KGMpIDogYztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHBhcmFtcztcbiAgfVxuXG4gIGNhcHR1cmVzKHBhdGg6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBpZiAodGhpcy4jb3B0cy5pZ25vcmVDYXB0dXJlcykge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICByZXR1cm4gcGF0aC5tYXRjaCh0aGlzLiNyZWdleHApPy5zbGljZSgxKSA/PyBbXTtcbiAgfVxuXG4gIHVybChcbiAgICBwYXJhbXMgPSB7fSBhcyBSb3V0ZVBhcmFtczxSPixcbiAgICBvcHRpb25zPzogVXJsT3B0aW9ucyxcbiAgKTogc3RyaW5nIHtcbiAgICBjb25zdCB1cmwgPSB0aGlzLnBhdGgucmVwbGFjZSgvXFwoXFwuXFwqXFwpL2csIFwiXCIpO1xuICAgIHJldHVybiB0b1VybCh1cmwsIHBhcmFtcywgb3B0aW9ucyk7XG4gIH1cblxuICBwYXJhbShcbiAgICBwYXJhbTogc3RyaW5nLFxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgZm46IFJvdXRlclBhcmFtTWlkZGxld2FyZTxhbnksIGFueSwgYW55PixcbiAgKSB7XG4gICAgY29uc3Qgc3RhY2sgPSB0aGlzLnN0YWNrO1xuICAgIGNvbnN0IHBhcmFtcyA9IHRoaXMuI3BhcmFtTmFtZXM7XG4gICAgY29uc3QgbWlkZGxld2FyZTogUm91dGVyTWlkZGxld2FyZTxSPiA9IGZ1bmN0aW9uIChcbiAgICAgIHRoaXM6IFJvdXRlcixcbiAgICAgIGN0eCxcbiAgICAgIG5leHQsXG4gICAgKTogUHJvbWlzZTx1bmtub3duPiB8IHVua25vd24ge1xuICAgICAgY29uc3QgcCA9IGN0eC5wYXJhbXNbcGFyYW1dO1xuICAgICAgYXNzZXJ0KHApO1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgcCwgY3R4LCBuZXh0KTtcbiAgICB9O1xuICAgIG1pZGRsZXdhcmUucGFyYW0gPSBwYXJhbTtcblxuICAgIGNvbnN0IG5hbWVzID0gcGFyYW1zLm1hcCgocCkgPT4gcC5uYW1lKTtcblxuICAgIGNvbnN0IHggPSBuYW1lcy5pbmRleE9mKHBhcmFtKTtcbiAgICBpZiAoeCA+PSAwKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0YWNrLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGZuID0gc3RhY2tbaV07XG4gICAgICAgIGlmICghZm4ucGFyYW0gfHwgbmFtZXMuaW5kZXhPZihmbi5wYXJhbSBhcyAoc3RyaW5nIHwgbnVtYmVyKSkgPiB4KSB7XG4gICAgICAgICAgc3RhY2suc3BsaWNlKGksIDAsIG1pZGRsZXdhcmUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0UHJlZml4KHByZWZpeDogc3RyaW5nKTogdGhpcyB7XG4gICAgaWYgKHRoaXMucGF0aCkge1xuICAgICAgdGhpcy5wYXRoID0gdGhpcy5wYXRoICE9PSBcIi9cIiB8fCB0aGlzLiNvcHRzLnN0cmljdCA9PT0gdHJ1ZVxuICAgICAgICA/IGAke3ByZWZpeH0ke3RoaXMucGF0aH1gXG4gICAgICAgIDogcHJlZml4O1xuICAgICAgdGhpcy4jcGFyYW1OYW1lcyA9IFtdO1xuICAgICAgdGhpcy4jcmVnZXhwID0gcGF0aFRvUmVnZXhwKHRoaXMucGF0aCwgdGhpcy4jcGFyYW1OYW1lcywgdGhpcy4jb3B0cyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgdG9KU09OKCk6IFJvdXRlPGFueSwgYW55LCBhbnk+IHtcbiAgICByZXR1cm4ge1xuICAgICAgbWV0aG9kczogWy4uLnRoaXMubWV0aG9kc10sXG4gICAgICBtaWRkbGV3YXJlOiBbLi4udGhpcy5zdGFja10sXG4gICAgICBwYXJhbU5hbWVzOiB0aGlzLiNwYXJhbU5hbWVzLm1hcCgoa2V5KSA9PiBrZXkubmFtZSksXG4gICAgICBwYXRoOiB0aGlzLnBhdGgsXG4gICAgICByZWdleHA6IHRoaXMuI3JlZ2V4cCxcbiAgICAgIG9wdGlvbnM6IHsgLi4udGhpcy4jb3B0cyB9LFxuICAgIH07XG4gIH1cblxuICBbU3ltYm9sLmZvcihcIkRlbm8uY3VzdG9tSW5zcGVjdFwiKV0oaW5zcGVjdDogKHZhbHVlOiB1bmtub3duKSA9PiBzdHJpbmcpIHtcbiAgICByZXR1cm4gYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSAke1xuICAgICAgaW5zcGVjdCh7XG4gICAgICAgIG1ldGhvZHM6IHRoaXMubWV0aG9kcyxcbiAgICAgICAgbWlkZGxld2FyZTogdGhpcy5zdGFjayxcbiAgICAgICAgb3B0aW9uczogdGhpcy4jb3B0cyxcbiAgICAgICAgcGFyYW1OYW1lczogdGhpcy4jcGFyYW1OYW1lcy5tYXAoKGtleSkgPT4ga2V5Lm5hbWUpLFxuICAgICAgICBwYXRoOiB0aGlzLnBhdGgsXG4gICAgICAgIHJlZ2V4cDogdGhpcy4jcmVnZXhwLFxuICAgICAgfSlcbiAgICB9YDtcbiAgfVxuXG4gIFtTeW1ib2wuZm9yKFwibm9kZWpzLnV0aWwuaW5zcGVjdC5jdXN0b21cIildKFxuICAgIGRlcHRoOiBudW1iZXIsXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBvcHRpb25zOiBhbnksXG4gICAgaW5zcGVjdDogKHZhbHVlOiB1bmtub3duLCBvcHRpb25zPzogdW5rbm93bikgPT4gc3RyaW5nLFxuICApIHtcbiAgICBpZiAoZGVwdGggPCAwKSB7XG4gICAgICByZXR1cm4gb3B0aW9ucy5zdHlsaXplKGBbJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9XWAsIFwic3BlY2lhbFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBuZXdPcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywge1xuICAgICAgZGVwdGg6IG9wdGlvbnMuZGVwdGggPT09IG51bGwgPyBudWxsIDogb3B0aW9ucy5kZXB0aCAtIDEsXG4gICAgfSk7XG4gICAgcmV0dXJuIGAke29wdGlvbnMuc3R5bGl6ZSh0aGlzLmNvbnN0cnVjdG9yLm5hbWUsIFwic3BlY2lhbFwiKX0gJHtcbiAgICAgIGluc3BlY3QoXG4gICAgICAgIHtcbiAgICAgICAgICBtZXRob2RzOiB0aGlzLm1ldGhvZHMsXG4gICAgICAgICAgbWlkZGxld2FyZTogdGhpcy5zdGFjayxcbiAgICAgICAgICBvcHRpb25zOiB0aGlzLiNvcHRzLFxuICAgICAgICAgIHBhcmFtTmFtZXM6IHRoaXMuI3BhcmFtTmFtZXMubWFwKChrZXkpID0+IGtleS5uYW1lKSxcbiAgICAgICAgICBwYXRoOiB0aGlzLnBhdGgsXG4gICAgICAgICAgcmVnZXhwOiB0aGlzLiNyZWdleHAsXG4gICAgICAgIH0sXG4gICAgICAgIG5ld09wdGlvbnMsXG4gICAgICApXG4gICAgfWA7XG4gIH1cbn1cblxuLyoqIEFuIGludGVyZmFjZSBmb3IgcmVnaXN0ZXJpbmcgbWlkZGxld2FyZSB0aGF0IHdpbGwgcnVuIHdoZW4gY2VydGFpbiBIVFRQXG4gKiBtZXRob2RzIGFuZCBwYXRocyBhcmUgcmVxdWVzdGVkLCBhcyB3ZWxsIGFzIHByb3ZpZGVzIGEgd2F5IHRvIHBhcmFtZXRlcml6ZVxuICogcGFydHMgb2YgdGhlIHJlcXVlc3RlZCBwYXRoLlxuICpcbiAqICMjIyBCYXNpYyBleGFtcGxlXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IEFwcGxpY2F0aW9uLCBSb3V0ZXIgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9vYWsvbW9kLnRzXCI7XG4gKlxuICogY29uc3Qgcm91dGVyID0gbmV3IFJvdXRlcigpO1xuICogcm91dGVyLmdldChcIi9cIiwgKGN0eCwgbmV4dCkgPT4ge1xuICogICAvLyBoYW5kbGUgdGhlIEdFVCBlbmRwb2ludCBoZXJlXG4gKiB9KTtcbiAqIHJvdXRlci5hbGwoXCIvaXRlbS86aXRlbVwiLCAoY3R4LCBuZXh0KSA9PiB7XG4gKiAgIC8vIGNhbGxlZCBmb3IgYWxsIEhUVFAgdmVyYnMvcmVxdWVzdHNcbiAqICAgY3R4LnBhcmFtcy5pdGVtOyAvLyBjb250YWlucyB0aGUgdmFsdWUgb2YgYDppdGVtYCBmcm9tIHRoZSBwYXJzZWQgVVJMXG4gKiB9KTtcbiAqXG4gKiBjb25zdCBhcHAgPSBuZXcgQXBwbGljYXRpb24oKTtcbiAqIGFwcC51c2Uocm91dGVyLnJvdXRlcygpKTtcbiAqIGFwcC51c2Uocm91dGVyLmFsbG93ZWRNZXRob2RzKCkpO1xuICpcbiAqIGFwcC5saXN0ZW4oeyBwb3J0OiA4MDgwIH0pO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBSb3V0ZXI8XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIFJTIGV4dGVuZHMgU3RhdGUgPSBSZWNvcmQ8c3RyaW5nLCBhbnk+LFxuPiB7XG4gICNvcHRzOiBSb3V0ZXJPcHRpb25zO1xuICAjbWV0aG9kczogSFRUUE1ldGhvZHNbXTtcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgI3BhcmFtczogUmVjb3JkPHN0cmluZywgUm91dGVyUGFyYW1NaWRkbGV3YXJlPGFueSwgYW55LCBhbnk+PiA9IHt9O1xuICAjc3RhY2s6IExheWVyPHN0cmluZz5bXSA9IFtdO1xuXG4gICNtYXRjaChwYXRoOiBzdHJpbmcsIG1ldGhvZDogSFRUUE1ldGhvZHMpOiBNYXRjaGVzPHN0cmluZz4ge1xuICAgIGNvbnN0IG1hdGNoZXM6IE1hdGNoZXM8c3RyaW5nPiA9IHtcbiAgICAgIHBhdGg6IFtdLFxuICAgICAgcGF0aEFuZE1ldGhvZDogW10sXG4gICAgICByb3V0ZTogZmFsc2UsXG4gICAgfTtcblxuICAgIGZvciAoY29uc3Qgcm91dGUgb2YgdGhpcy4jc3RhY2spIHtcbiAgICAgIGlmIChyb3V0ZS5tYXRjaChwYXRoKSkge1xuICAgICAgICBtYXRjaGVzLnBhdGgucHVzaChyb3V0ZSk7XG4gICAgICAgIGlmIChyb3V0ZS5tZXRob2RzLmxlbmd0aCA9PT0gMCB8fCByb3V0ZS5tZXRob2RzLmluY2x1ZGVzKG1ldGhvZCkpIHtcbiAgICAgICAgICBtYXRjaGVzLnBhdGhBbmRNZXRob2QucHVzaChyb3V0ZSk7XG4gICAgICAgICAgaWYgKHJvdXRlLm1ldGhvZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBtYXRjaGVzLnJvdXRlID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbWF0Y2hlcztcbiAgfVxuXG4gICNyZWdpc3RlcihcbiAgICBwYXRoOiBzdHJpbmcgfCBzdHJpbmdbXSxcbiAgICBtaWRkbGV3YXJlczogUm91dGVyTWlkZGxld2FyZTxzdHJpbmc+W10sXG4gICAgbWV0aG9kczogSFRUUE1ldGhvZHNbXSxcbiAgICBvcHRpb25zOiBSZWdpc3Rlck9wdGlvbnMgPSB7fSxcbiAgKTogdm9pZCB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocGF0aCkpIHtcbiAgICAgIGZvciAoY29uc3QgcCBvZiBwYXRoKSB7XG4gICAgICAgIHRoaXMuI3JlZ2lzdGVyKHAsIG1pZGRsZXdhcmVzLCBtZXRob2RzLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgbGF5ZXJNaWRkbGV3YXJlczogUm91dGVyTWlkZGxld2FyZTxzdHJpbmc+W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IG1pZGRsZXdhcmUgb2YgbWlkZGxld2FyZXMpIHtcbiAgICAgIGlmICghbWlkZGxld2FyZS5yb3V0ZXIpIHtcbiAgICAgICAgbGF5ZXJNaWRkbGV3YXJlcy5wdXNoKG1pZGRsZXdhcmUpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGxheWVyTWlkZGxld2FyZXMubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuI2FkZExheWVyKHBhdGgsIGxheWVyTWlkZGxld2FyZXMsIG1ldGhvZHMsIG9wdGlvbnMpO1xuICAgICAgICBsYXllck1pZGRsZXdhcmVzID0gW107XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJvdXRlciA9IG1pZGRsZXdhcmUucm91dGVyLiNjbG9uZSgpO1xuXG4gICAgICBmb3IgKGNvbnN0IGxheWVyIG9mIHJvdXRlci4jc3RhY2spIHtcbiAgICAgICAgaWYgKCFvcHRpb25zLmlnbm9yZVByZWZpeCkge1xuICAgICAgICAgIGxheWVyLnNldFByZWZpeChwYXRoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy4jb3B0cy5wcmVmaXgpIHtcbiAgICAgICAgICBsYXllci5zZXRQcmVmaXgodGhpcy4jb3B0cy5wcmVmaXgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuI3N0YWNrLnB1c2gobGF5ZXIpO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IFtwYXJhbSwgbXddIG9mIE9iamVjdC5lbnRyaWVzKHRoaXMuI3BhcmFtcykpIHtcbiAgICAgICAgcm91dGVyLnBhcmFtKHBhcmFtLCBtdyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGxheWVyTWlkZGxld2FyZXMubGVuZ3RoKSB7XG4gICAgICB0aGlzLiNhZGRMYXllcihwYXRoLCBsYXllck1pZGRsZXdhcmVzLCBtZXRob2RzLCBvcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICAjYWRkTGF5ZXIoXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIG1pZGRsZXdhcmVzOiBSb3V0ZXJNaWRkbGV3YXJlPHN0cmluZz5bXSxcbiAgICBtZXRob2RzOiBIVFRQTWV0aG9kc1tdLFxuICAgIG9wdGlvbnM6IExheWVyT3B0aW9ucyA9IHt9LFxuICApIHtcbiAgICBjb25zdCB7XG4gICAgICBlbmQsXG4gICAgICBuYW1lLFxuICAgICAgc2Vuc2l0aXZlID0gdGhpcy4jb3B0cy5zZW5zaXRpdmUsXG4gICAgICBzdHJpY3QgPSB0aGlzLiNvcHRzLnN0cmljdCxcbiAgICAgIGlnbm9yZUNhcHR1cmVzLFxuICAgIH0gPSBvcHRpb25zO1xuICAgIGNvbnN0IHJvdXRlID0gbmV3IExheWVyKHBhdGgsIG1ldGhvZHMsIG1pZGRsZXdhcmVzLCB7XG4gICAgICBlbmQsXG4gICAgICBuYW1lLFxuICAgICAgc2Vuc2l0aXZlLFxuICAgICAgc3RyaWN0LFxuICAgICAgaWdub3JlQ2FwdHVyZXMsXG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy4jb3B0cy5wcmVmaXgpIHtcbiAgICAgIHJvdXRlLnNldFByZWZpeCh0aGlzLiNvcHRzLnByZWZpeCk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBbcGFyYW0sIG13XSBvZiBPYmplY3QuZW50cmllcyh0aGlzLiNwYXJhbXMpKSB7XG4gICAgICByb3V0ZS5wYXJhbShwYXJhbSwgbXcpO1xuICAgIH1cblxuICAgIHRoaXMuI3N0YWNrLnB1c2gocm91dGUpO1xuICB9XG5cbiAgI3JvdXRlKG5hbWU6IHN0cmluZyk6IExheWVyPHN0cmluZz4gfCB1bmRlZmluZWQge1xuICAgIGZvciAoY29uc3Qgcm91dGUgb2YgdGhpcy4jc3RhY2spIHtcbiAgICAgIGlmIChyb3V0ZS5uYW1lID09PSBuYW1lKSB7XG4gICAgICAgIHJldHVybiByb3V0ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAjdXNlVmVyYihcbiAgICBuYW1lT3JQYXRoOiBzdHJpbmcsXG4gICAgcGF0aE9yTWlkZGxld2FyZTogc3RyaW5nIHwgUm91dGVyTWlkZGxld2FyZTxzdHJpbmc+LFxuICAgIG1pZGRsZXdhcmU6IFJvdXRlck1pZGRsZXdhcmU8c3RyaW5nPltdLFxuICAgIG1ldGhvZHM6IEhUVFBNZXRob2RzW10sXG4gICk6IHZvaWQge1xuICAgIGxldCBuYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgbGV0IHBhdGg6IHN0cmluZztcbiAgICBpZiAodHlwZW9mIHBhdGhPck1pZGRsZXdhcmUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIG5hbWUgPSBuYW1lT3JQYXRoO1xuICAgICAgcGF0aCA9IHBhdGhPck1pZGRsZXdhcmU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhdGggPSBuYW1lT3JQYXRoO1xuICAgICAgbWlkZGxld2FyZS51bnNoaWZ0KHBhdGhPck1pZGRsZXdhcmUpO1xuICAgIH1cblxuICAgIHRoaXMuI3JlZ2lzdGVyKHBhdGgsIG1pZGRsZXdhcmUsIG1ldGhvZHMsIHsgbmFtZSB9KTtcbiAgfVxuXG4gICNjbG9uZSgpOiBSb3V0ZXI8UlM+IHtcbiAgICBjb25zdCByb3V0ZXIgPSBuZXcgUm91dGVyPFJTPih0aGlzLiNvcHRzKTtcbiAgICByb3V0ZXIuI21ldGhvZHMgPSByb3V0ZXIuI21ldGhvZHMuc2xpY2UoKTtcbiAgICByb3V0ZXIuI3BhcmFtcyA9IHsgLi4udGhpcy4jcGFyYW1zIH07XG4gICAgcm91dGVyLiNzdGFjayA9IHRoaXMuI3N0YWNrLm1hcCgobGF5ZXIpID0+IGxheWVyLmNsb25lKCkpO1xuICAgIHJldHVybiByb3V0ZXI7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihvcHRzOiBSb3V0ZXJPcHRpb25zID0ge30pIHtcbiAgICB0aGlzLiNvcHRzID0gb3B0cztcbiAgICB0aGlzLiNtZXRob2RzID0gb3B0cy5tZXRob2RzID8/IFtcbiAgICAgIFwiREVMRVRFXCIsXG4gICAgICBcIkdFVFwiLFxuICAgICAgXCJIRUFEXCIsXG4gICAgICBcIk9QVElPTlNcIixcbiAgICAgIFwiUEFUQ0hcIixcbiAgICAgIFwiUE9TVFwiLFxuICAgICAgXCJQVVRcIixcbiAgICBdO1xuICB9XG5cbiAgLyoqIFJlZ2lzdGVyIG5hbWVkIG1pZGRsZXdhcmUgZm9yIHRoZSBzcGVjaWZpZWQgcm91dGVzIHdoZW4gdGhlIGBERUxFVEVgLFxuICAgKiBgR0VUYCwgYFBPU1RgLCBvciBgUFVUYCBtZXRob2QgaXMgcmVxdWVzdGVkLiAqL1xuICBhbGw8XG4gICAgUiBleHRlbmRzIHN0cmluZyxcbiAgICBQIGV4dGVuZHMgUm91dGVQYXJhbXM8Uj4gPSBSb3V0ZVBhcmFtczxSPixcbiAgICBTIGV4dGVuZHMgU3RhdGUgPSBSUyxcbiAgPihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgcGF0aDogUixcbiAgICBtaWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPFIsIFAsIFM+LFxuICAgIC4uLm1pZGRsZXdhcmVzOiBSb3V0ZXJNaWRkbGV3YXJlPFIsIFAsIFM+W11cbiAgKTogUm91dGVyPFMgZXh0ZW5kcyBSUyA/IFMgOiAoUyAmIFJTKT47XG4gIC8qKiBSZWdpc3RlciBtaWRkbGV3YXJlIGZvciB0aGUgc3BlY2lmaWVkIHJvdXRlcyB3aGVuIHRoZSBgREVMRVRFYCxcbiAgICogYEdFVGAsIGBQT1NUYCwgb3IgYFBVVGAgbWV0aG9kIGlzIHJlcXVlc3RlZC4gKi9cbiAgYWxsPFxuICAgIFIgZXh0ZW5kcyBzdHJpbmcsXG4gICAgUCBleHRlbmRzIFJvdXRlUGFyYW1zPFI+ID0gUm91dGVQYXJhbXM8Uj4sXG4gICAgUyBleHRlbmRzIFN0YXRlID0gUlMsXG4gID4oXG4gICAgcGF0aDogUixcbiAgICBtaWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPFIsIFAsIFM+LFxuICAgIC4uLm1pZGRsZXdhcmVzOiBSb3V0ZXJNaWRkbGV3YXJlPFIsIFAsIFM+W11cbiAgKTogUm91dGVyPFMgZXh0ZW5kcyBSUyA/IFMgOiAoUyAmIFJTKT47XG4gIGFsbDxcbiAgICBQIGV4dGVuZHMgUm91dGVQYXJhbXM8c3RyaW5nPiA9IFJvdXRlUGFyYW1zPHN0cmluZz4sXG4gICAgUyBleHRlbmRzIFN0YXRlID0gUlMsXG4gID4oXG4gICAgbmFtZU9yUGF0aDogc3RyaW5nLFxuICAgIHBhdGhPck1pZGRsZXdhcmU6IHN0cmluZyB8IFJvdXRlck1pZGRsZXdhcmU8c3RyaW5nLCBQLCBTPixcbiAgICAuLi5taWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPHN0cmluZywgUz5bXVxuICApOiBSb3V0ZXI8UyBleHRlbmRzIFJTID8gUyA6IChTICYgUlMpPiB7XG4gICAgdGhpcy4jdXNlVmVyYihcbiAgICAgIG5hbWVPclBhdGgsXG4gICAgICBwYXRoT3JNaWRkbGV3YXJlIGFzIChzdHJpbmcgfCBSb3V0ZXJNaWRkbGV3YXJlPHN0cmluZz4pLFxuICAgICAgbWlkZGxld2FyZSBhcyBSb3V0ZXJNaWRkbGV3YXJlPHN0cmluZz5bXSxcbiAgICAgIFtcIkRFTEVURVwiLCBcIkdFVFwiLCBcIlBPU1RcIiwgXCJQVVRcIl0sXG4gICAgKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBNaWRkbGV3YXJlIHRoYXQgaGFuZGxlcyByZXF1ZXN0cyBmb3IgSFRUUCBtZXRob2RzIHJlZ2lzdGVyZWQgd2l0aCB0aGVcbiAgICogcm91dGVyLiAgSWYgbm9uZSBvZiB0aGUgcm91dGVzIGhhbmRsZSBhIG1ldGhvZCwgdGhlbiBcIm5vdCBhbGxvd2VkXCIgbG9naWNcbiAgICogd2lsbCBiZSB1c2VkLiAgSWYgYSBtZXRob2QgaXMgc3VwcG9ydGVkIGJ5IHNvbWUgcm91dGVzLCBidXQgbm90IHRoZVxuICAgKiBwYXJ0aWN1bGFyIG1hdGNoZWQgcm91dGVyLCB0aGVuIFwibm90IGltcGxlbWVudGVkXCIgd2lsbCBiZSByZXR1cm5lZC5cbiAgICpcbiAgICogVGhlIG1pZGRsZXdhcmUgd2lsbCBhbHNvIGF1dG9tYXRpY2FsbHkgaGFuZGxlIHRoZSBgT1BUSU9OU2AgbWV0aG9kLFxuICAgKiByZXNwb25kaW5nIHdpdGggYSBgMjAwIE9LYCB3aGVuIHRoZSBgQWxsb3dlZGAgaGVhZGVyIHNlbnQgdG8gdGhlIGFsbG93ZWRcbiAgICogbWV0aG9kcyBmb3IgYSBnaXZlbiByb3V0ZS5cbiAgICpcbiAgICogQnkgZGVmYXVsdCwgYSBcIm5vdCBhbGxvd2VkXCIgcmVxdWVzdCB3aWxsIHJlc3BvbmQgd2l0aCBhIGA0MDUgTm90IEFsbG93ZWRgXG4gICAqIGFuZCBhIFwibm90IGltcGxlbWVudGVkXCIgd2lsbCByZXNwb25kIHdpdGggYSBgNTAxIE5vdCBJbXBsZW1lbnRlZGAuIFNldHRpbmdcbiAgICogdGhlIG9wdGlvbiBgLnRocm93YCB0byBgdHJ1ZWAgd2lsbCBjYXVzZSB0aGUgbWlkZGxld2FyZSB0byB0aHJvdyBhblxuICAgKiBgSFRUUEVycm9yYCBpbnN0ZWFkIG9mIHNldHRpbmcgdGhlIHJlc3BvbnNlIHN0YXR1cy4gIFRoZSBlcnJvciBjYW4gYmVcbiAgICogb3ZlcnJpZGRlbiBieSBwcm92aWRpbmcgYSBgLm5vdEltcGxlbWVudGVkYCBvciBgLm5vdEFsbG93ZWRgIG1ldGhvZCBpbiB0aGVcbiAgICogb3B0aW9ucywgb2Ygd2hpY2ggdGhlIHZhbHVlIHdpbGwgYmUgcmV0dXJuZWQgd2lsbCBiZSB0aHJvd24gaW5zdGVhZCBvZiB0aGVcbiAgICogSFRUUCBlcnJvci4gKi9cbiAgYWxsb3dlZE1ldGhvZHMoXG4gICAgb3B0aW9uczogUm91dGVyQWxsb3dlZE1ldGhvZHNPcHRpb25zID0ge30sXG4gICk6IE1pZGRsZXdhcmUge1xuICAgIGNvbnN0IGltcGxlbWVudGVkID0gdGhpcy4jbWV0aG9kcztcblxuICAgIGNvbnN0IGFsbG93ZWRNZXRob2RzOiBNaWRkbGV3YXJlID0gYXN5bmMgKGNvbnRleHQsIG5leHQpID0+IHtcbiAgICAgIGNvbnN0IGN0eCA9IGNvbnRleHQgYXMgUm91dGVyQ29udGV4dDxzdHJpbmc+O1xuICAgICAgYXdhaXQgbmV4dCgpO1xuICAgICAgaWYgKCFjdHgucmVzcG9uc2Uuc3RhdHVzIHx8IGN0eC5yZXNwb25zZS5zdGF0dXMgPT09IFN0YXR1cy5Ob3RGb3VuZCkge1xuICAgICAgICBhc3NlcnQoY3R4Lm1hdGNoZWQpO1xuICAgICAgICBjb25zdCBhbGxvd2VkID0gbmV3IFNldDxIVFRQTWV0aG9kcz4oKTtcbiAgICAgICAgZm9yIChjb25zdCByb3V0ZSBvZiBjdHgubWF0Y2hlZCkge1xuICAgICAgICAgIGZvciAoY29uc3QgbWV0aG9kIG9mIHJvdXRlLm1ldGhvZHMpIHtcbiAgICAgICAgICAgIGFsbG93ZWQuYWRkKG1ldGhvZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYWxsb3dlZFN0ciA9IFsuLi5hbGxvd2VkXS5qb2luKFwiLCBcIik7XG4gICAgICAgIGlmICghaW1wbGVtZW50ZWQuaW5jbHVkZXMoY3R4LnJlcXVlc3QubWV0aG9kKSkge1xuICAgICAgICAgIGlmIChvcHRpb25zLnRocm93KSB7XG4gICAgICAgICAgICB0aHJvdyBvcHRpb25zLm5vdEltcGxlbWVudGVkXG4gICAgICAgICAgICAgID8gb3B0aW9ucy5ub3RJbXBsZW1lbnRlZCgpXG4gICAgICAgICAgICAgIDogbmV3IGh0dHBFcnJvcnMuTm90SW1wbGVtZW50ZWQoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3R4LnJlc3BvbnNlLnN0YXR1cyA9IFN0YXR1cy5Ob3RJbXBsZW1lbnRlZDtcbiAgICAgICAgICAgIGN0eC5yZXNwb25zZS5oZWFkZXJzLnNldChcIkFsbG93ZWRcIiwgYWxsb3dlZFN0cik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGFsbG93ZWQuc2l6ZSkge1xuICAgICAgICAgIGlmIChjdHgucmVxdWVzdC5tZXRob2QgPT09IFwiT1BUSU9OU1wiKSB7XG4gICAgICAgICAgICBjdHgucmVzcG9uc2Uuc3RhdHVzID0gU3RhdHVzLk9LO1xuICAgICAgICAgICAgY3R4LnJlc3BvbnNlLmhlYWRlcnMuc2V0KFwiQWxsb3dlZFwiLCBhbGxvd2VkU3RyKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKCFhbGxvd2VkLmhhcyhjdHgucmVxdWVzdC5tZXRob2QpKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy50aHJvdykge1xuICAgICAgICAgICAgICB0aHJvdyBvcHRpb25zLm1ldGhvZE5vdEFsbG93ZWRcbiAgICAgICAgICAgICAgICA/IG9wdGlvbnMubWV0aG9kTm90QWxsb3dlZCgpXG4gICAgICAgICAgICAgICAgOiBuZXcgaHR0cEVycm9ycy5NZXRob2ROb3RBbGxvd2VkKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjdHgucmVzcG9uc2Uuc3RhdHVzID0gU3RhdHVzLk1ldGhvZE5vdEFsbG93ZWQ7XG4gICAgICAgICAgICAgIGN0eC5yZXNwb25zZS5oZWFkZXJzLnNldChcIkFsbG93ZWRcIiwgYWxsb3dlZFN0cik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBhbGxvd2VkTWV0aG9kcztcbiAgfVxuXG4gIC8qKiBSZWdpc3RlciBuYW1lZCBtaWRkbGV3YXJlIGZvciB0aGUgc3BlY2lmaWVkIHJvdXRlcyB3aGVuIHRoZSBgREVMRVRFYCxcbiAgICogIG1ldGhvZCBpcyByZXF1ZXN0ZWQuICovXG4gIGRlbGV0ZTxcbiAgICBSIGV4dGVuZHMgc3RyaW5nLFxuICAgIFAgZXh0ZW5kcyBSb3V0ZVBhcmFtczxSPiA9IFJvdXRlUGFyYW1zPFI+LFxuICAgIFMgZXh0ZW5kcyBTdGF0ZSA9IFJTLFxuICA+KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBwYXRoOiBSLFxuICAgIG1pZGRsZXdhcmU6IFJvdXRlck1pZGRsZXdhcmU8UiwgUCwgUz4sXG4gICAgLi4ubWlkZGxld2FyZXM6IFJvdXRlck1pZGRsZXdhcmU8UiwgUCwgUz5bXVxuICApOiBSb3V0ZXI8UyBleHRlbmRzIFJTID8gUyA6IChTICYgUlMpPjtcbiAgLyoqIFJlZ2lzdGVyIG1pZGRsZXdhcmUgZm9yIHRoZSBzcGVjaWZpZWQgcm91dGVzIHdoZW4gdGhlIGBERUxFVEVgLFxuICAgKiBtZXRob2QgaXMgcmVxdWVzdGVkLiAqL1xuICBkZWxldGU8XG4gICAgUiBleHRlbmRzIHN0cmluZyxcbiAgICBQIGV4dGVuZHMgUm91dGVQYXJhbXM8Uj4gPSBSb3V0ZVBhcmFtczxSPixcbiAgICBTIGV4dGVuZHMgU3RhdGUgPSBSUyxcbiAgPihcbiAgICBwYXRoOiBSLFxuICAgIG1pZGRsZXdhcmU6IFJvdXRlck1pZGRsZXdhcmU8UiwgUCwgUz4sXG4gICAgLi4ubWlkZGxld2FyZXM6IFJvdXRlck1pZGRsZXdhcmU8UiwgUCwgUz5bXVxuICApOiBSb3V0ZXI8UyBleHRlbmRzIFJTID8gUyA6IChTICYgUlMpPjtcbiAgZGVsZXRlPFxuICAgIFAgZXh0ZW5kcyBSb3V0ZVBhcmFtczxzdHJpbmc+ID0gUm91dGVQYXJhbXM8c3RyaW5nPixcbiAgICBTIGV4dGVuZHMgU3RhdGUgPSBSUyxcbiAgPihcbiAgICBuYW1lT3JQYXRoOiBzdHJpbmcsXG4gICAgcGF0aE9yTWlkZGxld2FyZTogc3RyaW5nIHwgUm91dGVyTWlkZGxld2FyZTxzdHJpbmcsIFAsIFM+LFxuICAgIC4uLm1pZGRsZXdhcmU6IFJvdXRlck1pZGRsZXdhcmU8c3RyaW5nLCBQLCBTPltdXG4gICk6IFJvdXRlcjxTIGV4dGVuZHMgUlMgPyBTIDogKFMgJiBSUyk+IHtcbiAgICB0aGlzLiN1c2VWZXJiKFxuICAgICAgbmFtZU9yUGF0aCxcbiAgICAgIHBhdGhPck1pZGRsZXdhcmUgYXMgKHN0cmluZyB8IFJvdXRlck1pZGRsZXdhcmU8c3RyaW5nPiksXG4gICAgICBtaWRkbGV3YXJlIGFzIFJvdXRlck1pZGRsZXdhcmU8c3RyaW5nPltdLFxuICAgICAgW1wiREVMRVRFXCJdLFxuICAgICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogSXRlcmF0ZSBvdmVyIHRoZSByb3V0ZXMgY3VycmVudGx5IGFkZGVkIHRvIHRoZSByb3V0ZXIuICBUbyBiZSBjb21wYXRpYmxlXG4gICAqIHdpdGggdGhlIGl0ZXJhYmxlIGludGVyZmFjZXMsIGJvdGggdGhlIGtleSBhbmQgdmFsdWUgYXJlIHNldCB0byB0aGUgdmFsdWVcbiAgICogb2YgdGhlIHJvdXRlLiAqL1xuICAqZW50cmllcygpOiBJdGVyYWJsZUl0ZXJhdG9yPFtSb3V0ZTxzdHJpbmc+LCBSb3V0ZTxzdHJpbmc+XT4ge1xuICAgIGZvciAoY29uc3Qgcm91dGUgb2YgdGhpcy4jc3RhY2spIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gcm91dGUudG9KU09OKCk7XG4gICAgICB5aWVsZCBbdmFsdWUsIHZhbHVlXTtcbiAgICB9XG4gIH1cblxuICAvKiogSXRlcmF0ZSBvdmVyIHRoZSByb3V0ZXMgY3VycmVudGx5IGFkZGVkIHRvIHRoZSByb3V0ZXIsIGNhbGxpbmcgdGhlXG4gICAqIGBjYWxsYmFja2AgZnVuY3Rpb24gZm9yIGVhY2ggdmFsdWUuICovXG4gIGZvckVhY2goXG4gICAgY2FsbGJhY2s6IChcbiAgICAgIHZhbHVlMTogUm91dGU8c3RyaW5nPixcbiAgICAgIHZhbHVlMjogUm91dGU8c3RyaW5nPixcbiAgICAgIHJvdXRlcjogdGhpcyxcbiAgICApID0+IHZvaWQsXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICB0aGlzQXJnOiBhbnkgPSBudWxsLFxuICApOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IHJvdXRlIG9mIHRoaXMuI3N0YWNrKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHJvdXRlLnRvSlNPTigpO1xuICAgICAgY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB2YWx1ZSwgdmFsdWUsIHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZWdpc3RlciBuYW1lZCBtaWRkbGV3YXJlIGZvciB0aGUgc3BlY2lmaWVkIHJvdXRlcyB3aGVuIHRoZSBgR0VUYCxcbiAgICogIG1ldGhvZCBpcyByZXF1ZXN0ZWQuICovXG4gIGdldDxcbiAgICBSIGV4dGVuZHMgc3RyaW5nLFxuICAgIFAgZXh0ZW5kcyBSb3V0ZVBhcmFtczxSPiA9IFJvdXRlUGFyYW1zPFI+LFxuICAgIFMgZXh0ZW5kcyBTdGF0ZSA9IFJTLFxuICA+KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBwYXRoOiBSLFxuICAgIG1pZGRsZXdhcmU6IFJvdXRlck1pZGRsZXdhcmU8UiwgUCwgUz4sXG4gICAgLi4ubWlkZGxld2FyZXM6IFJvdXRlck1pZGRsZXdhcmU8UiwgUCwgUz5bXVxuICApOiBSb3V0ZXI8UyBleHRlbmRzIFJTID8gUyA6IChTICYgUlMpPjtcbiAgLyoqIFJlZ2lzdGVyIG1pZGRsZXdhcmUgZm9yIHRoZSBzcGVjaWZpZWQgcm91dGVzIHdoZW4gdGhlIGBHRVRgLFxuICAgKiBtZXRob2QgaXMgcmVxdWVzdGVkLiAqL1xuICBnZXQ8XG4gICAgUiBleHRlbmRzIHN0cmluZyxcbiAgICBQIGV4dGVuZHMgUm91dGVQYXJhbXM8Uj4gPSBSb3V0ZVBhcmFtczxSPixcbiAgICBTIGV4dGVuZHMgU3RhdGUgPSBSUyxcbiAgPihcbiAgICBwYXRoOiBSLFxuICAgIG1pZGRsZXdhcmU6IFJvdXRlck1pZGRsZXdhcmU8UiwgUCwgUz4sXG4gICAgLi4ubWlkZGxld2FyZXM6IFJvdXRlck1pZGRsZXdhcmU8UiwgUCwgUz5bXVxuICApOiBSb3V0ZXI8UyBleHRlbmRzIFJTID8gUyA6IChTICYgUlMpPjtcbiAgZ2V0PFxuICAgIFAgZXh0ZW5kcyBSb3V0ZVBhcmFtczxzdHJpbmc+ID0gUm91dGVQYXJhbXM8c3RyaW5nPixcbiAgICBTIGV4dGVuZHMgU3RhdGUgPSBSUyxcbiAgPihcbiAgICBuYW1lT3JQYXRoOiBzdHJpbmcsXG4gICAgcGF0aE9yTWlkZGxld2FyZTogc3RyaW5nIHwgUm91dGVyTWlkZGxld2FyZTxzdHJpbmcsIFAsIFM+LFxuICAgIC4uLm1pZGRsZXdhcmU6IFJvdXRlck1pZGRsZXdhcmU8c3RyaW5nLCBQLCBTPltdXG4gICk6IFJvdXRlcjxTIGV4dGVuZHMgUlMgPyBTIDogKFMgJiBSUyk+IHtcbiAgICB0aGlzLiN1c2VWZXJiKFxuICAgICAgbmFtZU9yUGF0aCxcbiAgICAgIHBhdGhPck1pZGRsZXdhcmUgYXMgKHN0cmluZyB8IFJvdXRlck1pZGRsZXdhcmU8c3RyaW5nPiksXG4gICAgICBtaWRkbGV3YXJlIGFzIFJvdXRlck1pZGRsZXdhcmU8c3RyaW5nPltdLFxuICAgICAgW1wiR0VUXCJdLFxuICAgICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogUmVnaXN0ZXIgbmFtZWQgbWlkZGxld2FyZSBmb3IgdGhlIHNwZWNpZmllZCByb3V0ZXMgd2hlbiB0aGUgYEhFQURgLFxuICAgKiAgbWV0aG9kIGlzIHJlcXVlc3RlZC4gKi9cbiAgaGVhZDxcbiAgICBSIGV4dGVuZHMgc3RyaW5nLFxuICAgIFAgZXh0ZW5kcyBSb3V0ZVBhcmFtczxSPiA9IFJvdXRlUGFyYW1zPFI+LFxuICAgIFMgZXh0ZW5kcyBTdGF0ZSA9IFJTLFxuICA+KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBwYXRoOiBSLFxuICAgIG1pZGRsZXdhcmU6IFJvdXRlck1pZGRsZXdhcmU8UiwgUCwgUz4sXG4gICAgLi4ubWlkZGxld2FyZXM6IFJvdXRlck1pZGRsZXdhcmU8UiwgUCwgUz5bXVxuICApOiBSb3V0ZXI8UyBleHRlbmRzIFJTID8gUyA6IChTICYgUlMpPjtcbiAgLyoqIFJlZ2lzdGVyIG1pZGRsZXdhcmUgZm9yIHRoZSBzcGVjaWZpZWQgcm91dGVzIHdoZW4gdGhlIGBIRUFEYCxcbiAgICogbWV0aG9kIGlzIHJlcXVlc3RlZC4gKi9cbiAgaGVhZDxcbiAgICBSIGV4dGVuZHMgc3RyaW5nLFxuICAgIFAgZXh0ZW5kcyBSb3V0ZVBhcmFtczxSPiA9IFJvdXRlUGFyYW1zPFI+LFxuICAgIFMgZXh0ZW5kcyBTdGF0ZSA9IFJTLFxuICA+KFxuICAgIHBhdGg6IFIsXG4gICAgbWlkZGxld2FyZTogUm91dGVyTWlkZGxld2FyZTxSLCBQLCBTPixcbiAgICAuLi5taWRkbGV3YXJlczogUm91dGVyTWlkZGxld2FyZTxSLCBQLCBTPltdXG4gICk6IFJvdXRlcjxTIGV4dGVuZHMgUlMgPyBTIDogKFMgJiBSUyk+O1xuICBoZWFkPFxuICAgIFAgZXh0ZW5kcyBSb3V0ZVBhcmFtczxzdHJpbmc+ID0gUm91dGVQYXJhbXM8c3RyaW5nPixcbiAgICBTIGV4dGVuZHMgU3RhdGUgPSBSUyxcbiAgPihcbiAgICBuYW1lT3JQYXRoOiBzdHJpbmcsXG4gICAgcGF0aE9yTWlkZGxld2FyZTogc3RyaW5nIHwgUm91dGVyTWlkZGxld2FyZTxzdHJpbmcsIFAsIFM+LFxuICAgIC4uLm1pZGRsZXdhcmU6IFJvdXRlck1pZGRsZXdhcmU8c3RyaW5nLCBQLCBTPltdXG4gICk6IFJvdXRlcjxTIGV4dGVuZHMgUlMgPyBTIDogKFMgJiBSUyk+IHtcbiAgICB0aGlzLiN1c2VWZXJiKFxuICAgICAgbmFtZU9yUGF0aCxcbiAgICAgIHBhdGhPck1pZGRsZXdhcmUgYXMgKHN0cmluZyB8IFJvdXRlck1pZGRsZXdhcmU8c3RyaW5nPiksXG4gICAgICBtaWRkbGV3YXJlIGFzIFJvdXRlck1pZGRsZXdhcmU8c3RyaW5nPltdLFxuICAgICAgW1wiSEVBRFwiXSxcbiAgICApO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIEl0ZXJhdGUgb3ZlciB0aGUgcm91dGVzIGN1cnJlbnRseSBhZGRlZCB0byB0aGUgcm91dGVyLiAgVG8gYmUgY29tcGF0aWJsZVxuICAgKiB3aXRoIHRoZSBpdGVyYWJsZSBpbnRlcmZhY2VzLCB0aGUga2V5IGlzIHNldCB0byB0aGUgdmFsdWUgb2YgdGhlIHJvdXRlLiAqL1xuICAqa2V5cygpOiBJdGVyYWJsZUl0ZXJhdG9yPFJvdXRlPHN0cmluZz4+IHtcbiAgICBmb3IgKGNvbnN0IHJvdXRlIG9mIHRoaXMuI3N0YWNrKSB7XG4gICAgICB5aWVsZCByb3V0ZS50b0pTT04oKTtcbiAgICB9XG4gIH1cblxuICAvKiogUmVnaXN0ZXIgbmFtZWQgbWlkZGxld2FyZSBmb3IgdGhlIHNwZWNpZmllZCByb3V0ZXMgd2hlbiB0aGUgYE9QVElPTlNgLFxuICAgKiBtZXRob2QgaXMgcmVxdWVzdGVkLiAqL1xuICBvcHRpb25zPFxuICAgIFIgZXh0ZW5kcyBzdHJpbmcsXG4gICAgUCBleHRlbmRzIFJvdXRlUGFyYW1zPFI+ID0gUm91dGVQYXJhbXM8Uj4sXG4gICAgUyBleHRlbmRzIFN0YXRlID0gUlMsXG4gID4oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHBhdGg6IFIsXG4gICAgbWlkZGxld2FyZTogUm91dGVyTWlkZGxld2FyZTxSLCBQLCBTPixcbiAgICAuLi5taWRkbGV3YXJlczogUm91dGVyTWlkZGxld2FyZTxSLCBQLCBTPltdXG4gICk6IFJvdXRlcjxTIGV4dGVuZHMgUlMgPyBTIDogKFMgJiBSUyk+O1xuICAvKiogUmVnaXN0ZXIgbWlkZGxld2FyZSBmb3IgdGhlIHNwZWNpZmllZCByb3V0ZXMgd2hlbiB0aGUgYE9QVElPTlNgLFxuICAgKiBtZXRob2QgaXMgcmVxdWVzdGVkLiAqL1xuICBvcHRpb25zPFxuICAgIFIgZXh0ZW5kcyBzdHJpbmcsXG4gICAgUCBleHRlbmRzIFJvdXRlUGFyYW1zPFI+ID0gUm91dGVQYXJhbXM8Uj4sXG4gICAgUyBleHRlbmRzIFN0YXRlID0gUlMsXG4gID4oXG4gICAgcGF0aDogUixcbiAgICBtaWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPFIsIFAsIFM+LFxuICAgIC4uLm1pZGRsZXdhcmVzOiBSb3V0ZXJNaWRkbGV3YXJlPFIsIFAsIFM+W11cbiAgKTogUm91dGVyPFMgZXh0ZW5kcyBSUyA/IFMgOiAoUyAmIFJTKT47XG4gIG9wdGlvbnM8XG4gICAgUCBleHRlbmRzIFJvdXRlUGFyYW1zPHN0cmluZz4gPSBSb3V0ZVBhcmFtczxzdHJpbmc+LFxuICAgIFMgZXh0ZW5kcyBTdGF0ZSA9IFJTLFxuICA+KFxuICAgIG5hbWVPclBhdGg6IHN0cmluZyxcbiAgICBwYXRoT3JNaWRkbGV3YXJlOiBzdHJpbmcgfCBSb3V0ZXJNaWRkbGV3YXJlPHN0cmluZywgUCwgUz4sXG4gICAgLi4ubWlkZGxld2FyZTogUm91dGVyTWlkZGxld2FyZTxzdHJpbmcsIFAsIFM+W11cbiAgKTogUm91dGVyPFMgZXh0ZW5kcyBSUyA/IFMgOiAoUyAmIFJTKT4ge1xuICAgIHRoaXMuI3VzZVZlcmIoXG4gICAgICBuYW1lT3JQYXRoLFxuICAgICAgcGF0aE9yTWlkZGxld2FyZSBhcyAoc3RyaW5nIHwgUm91dGVyTWlkZGxld2FyZTxzdHJpbmc+KSxcbiAgICAgIG1pZGRsZXdhcmUgYXMgUm91dGVyTWlkZGxld2FyZTxzdHJpbmc+W10sXG4gICAgICBbXCJPUFRJT05TXCJdLFxuICAgICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogUmVnaXN0ZXIgcGFyYW0gbWlkZGxld2FyZSwgd2hpY2ggd2lsbCBiZSBjYWxsZWQgd2hlbiB0aGUgcGFydGljdWxhciBwYXJhbVxuICAgKiBpcyBwYXJzZWQgZnJvbSB0aGUgcm91dGUuICovXG4gIHBhcmFtPFIgZXh0ZW5kcyBzdHJpbmcsIFMgZXh0ZW5kcyBTdGF0ZSA9IFJTPihcbiAgICBwYXJhbToga2V5b2YgUm91dGVQYXJhbXM8Uj4sXG4gICAgbWlkZGxld2FyZTogUm91dGVyUGFyYW1NaWRkbGV3YXJlPFIsIFJvdXRlUGFyYW1zPFI+LCBTPixcbiAgKTogUm91dGVyPFM+IHtcbiAgICB0aGlzLiNwYXJhbXNbcGFyYW0gYXMgc3RyaW5nXSA9IG1pZGRsZXdhcmU7XG4gICAgZm9yIChjb25zdCByb3V0ZSBvZiB0aGlzLiNzdGFjaykge1xuICAgICAgcm91dGUucGFyYW0ocGFyYW0gYXMgc3RyaW5nLCBtaWRkbGV3YXJlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogUmVnaXN0ZXIgbmFtZWQgbWlkZGxld2FyZSBmb3IgdGhlIHNwZWNpZmllZCByb3V0ZXMgd2hlbiB0aGUgYFBBVENIYCxcbiAgICogbWV0aG9kIGlzIHJlcXVlc3RlZC4gKi9cbiAgcGF0Y2g8XG4gICAgUiBleHRlbmRzIHN0cmluZyxcbiAgICBQIGV4dGVuZHMgUm91dGVQYXJhbXM8Uj4gPSBSb3V0ZVBhcmFtczxSPixcbiAgICBTIGV4dGVuZHMgU3RhdGUgPSBSUyxcbiAgPihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgcGF0aDogUixcbiAgICBtaWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPFIsIFAsIFM+LFxuICAgIC4uLm1pZGRsZXdhcmVzOiBSb3V0ZXJNaWRkbGV3YXJlPFIsIFAsIFM+W11cbiAgKTogUm91dGVyPFMgZXh0ZW5kcyBSUyA/IFMgOiAoUyAmIFJTKT47XG4gIC8qKiBSZWdpc3RlciBtaWRkbGV3YXJlIGZvciB0aGUgc3BlY2lmaWVkIHJvdXRlcyB3aGVuIHRoZSBgUEFUQ0hgLFxuICAgKiBtZXRob2QgaXMgcmVxdWVzdGVkLiAqL1xuICBwYXRjaDxcbiAgICBSIGV4dGVuZHMgc3RyaW5nLFxuICAgIFAgZXh0ZW5kcyBSb3V0ZVBhcmFtczxSPiA9IFJvdXRlUGFyYW1zPFI+LFxuICAgIFMgZXh0ZW5kcyBTdGF0ZSA9IFJTLFxuICA+KFxuICAgIHBhdGg6IFIsXG4gICAgbWlkZGxld2FyZTogUm91dGVyTWlkZGxld2FyZTxSLCBQLCBTPixcbiAgICAuLi5taWRkbGV3YXJlczogUm91dGVyTWlkZGxld2FyZTxSLCBQLCBTPltdXG4gICk6IFJvdXRlcjxTIGV4dGVuZHMgUlMgPyBTIDogKFMgJiBSUyk+O1xuICBwYXRjaDxcbiAgICBQIGV4dGVuZHMgUm91dGVQYXJhbXM8c3RyaW5nPiA9IFJvdXRlUGFyYW1zPHN0cmluZz4sXG4gICAgUyBleHRlbmRzIFN0YXRlID0gUlMsXG4gID4oXG4gICAgbmFtZU9yUGF0aDogc3RyaW5nLFxuICAgIHBhdGhPck1pZGRsZXdhcmU6IHN0cmluZyB8IFJvdXRlck1pZGRsZXdhcmU8c3RyaW5nLCBQLCBTPixcbiAgICAuLi5taWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPHN0cmluZywgUz5bXVxuICApOiBSb3V0ZXI8UyBleHRlbmRzIFJTID8gUyA6IChTICYgUlMpPiB7XG4gICAgdGhpcy4jdXNlVmVyYihcbiAgICAgIG5hbWVPclBhdGgsXG4gICAgICBwYXRoT3JNaWRkbGV3YXJlIGFzIChzdHJpbmcgfCBSb3V0ZXJNaWRkbGV3YXJlPHN0cmluZz4pLFxuICAgICAgbWlkZGxld2FyZSBhcyBSb3V0ZXJNaWRkbGV3YXJlPHN0cmluZz5bXSxcbiAgICAgIFtcIlBBVENIXCJdLFxuICAgICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogUmVnaXN0ZXIgbmFtZWQgbWlkZGxld2FyZSBmb3IgdGhlIHNwZWNpZmllZCByb3V0ZXMgd2hlbiB0aGUgYFBPU1RgLFxuICAgKiBtZXRob2QgaXMgcmVxdWVzdGVkLiAqL1xuICBwb3N0PFxuICAgIFIgZXh0ZW5kcyBzdHJpbmcsXG4gICAgUCBleHRlbmRzIFJvdXRlUGFyYW1zPFI+ID0gUm91dGVQYXJhbXM8Uj4sXG4gICAgUyBleHRlbmRzIFN0YXRlID0gUlMsXG4gID4oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHBhdGg6IFIsXG4gICAgbWlkZGxld2FyZTogUm91dGVyTWlkZGxld2FyZTxSLCBQLCBTPixcbiAgICAuLi5taWRkbGV3YXJlczogUm91dGVyTWlkZGxld2FyZTxSLCBQLCBTPltdXG4gICk6IFJvdXRlcjxTIGV4dGVuZHMgUlMgPyBTIDogKFMgJiBSUyk+O1xuICAvKiogUmVnaXN0ZXIgbWlkZGxld2FyZSBmb3IgdGhlIHNwZWNpZmllZCByb3V0ZXMgd2hlbiB0aGUgYFBPU1RgLFxuICAgKiBtZXRob2QgaXMgcmVxdWVzdGVkLiAqL1xuICBwb3N0PFxuICAgIFIgZXh0ZW5kcyBzdHJpbmcsXG4gICAgUCBleHRlbmRzIFJvdXRlUGFyYW1zPFI+ID0gUm91dGVQYXJhbXM8Uj4sXG4gICAgUyBleHRlbmRzIFN0YXRlID0gUlMsXG4gID4oXG4gICAgcGF0aDogUixcbiAgICBtaWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPFIsIFAsIFM+LFxuICAgIC4uLm1pZGRsZXdhcmVzOiBSb3V0ZXJNaWRkbGV3YXJlPFIsIFAsIFM+W11cbiAgKTogUm91dGVyPFMgZXh0ZW5kcyBSUyA/IFMgOiAoUyAmIFJTKT47XG4gIHBvc3Q8XG4gICAgUCBleHRlbmRzIFJvdXRlUGFyYW1zPHN0cmluZz4gPSBSb3V0ZVBhcmFtczxzdHJpbmc+LFxuICAgIFMgZXh0ZW5kcyBTdGF0ZSA9IFJTLFxuICA+KFxuICAgIG5hbWVPclBhdGg6IHN0cmluZyxcbiAgICBwYXRoT3JNaWRkbGV3YXJlOiBzdHJpbmcgfCBSb3V0ZXJNaWRkbGV3YXJlPHN0cmluZywgUCwgUz4sXG4gICAgLi4ubWlkZGxld2FyZTogUm91dGVyTWlkZGxld2FyZTxzdHJpbmcsIFAsIFM+W11cbiAgKTogUm91dGVyPFMgZXh0ZW5kcyBSUyA/IFMgOiAoUyAmIFJTKT4ge1xuICAgIHRoaXMuI3VzZVZlcmIoXG4gICAgICBuYW1lT3JQYXRoLFxuICAgICAgcGF0aE9yTWlkZGxld2FyZSBhcyAoc3RyaW5nIHwgUm91dGVyTWlkZGxld2FyZTxzdHJpbmc+KSxcbiAgICAgIG1pZGRsZXdhcmUgYXMgUm91dGVyTWlkZGxld2FyZTxzdHJpbmc+W10sXG4gICAgICBbXCJQT1NUXCJdLFxuICAgICk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogU2V0IHRoZSByb3V0ZXIgcHJlZml4IGZvciB0aGlzIHJvdXRlci4gKi9cbiAgcHJlZml4KHByZWZpeDogc3RyaW5nKTogdGhpcyB7XG4gICAgcHJlZml4ID0gcHJlZml4LnJlcGxhY2UoL1xcLyQvLCBcIlwiKTtcbiAgICB0aGlzLiNvcHRzLnByZWZpeCA9IHByZWZpeDtcbiAgICBmb3IgKGNvbnN0IHJvdXRlIG9mIHRoaXMuI3N0YWNrKSB7XG4gICAgICByb3V0ZS5zZXRQcmVmaXgocHJlZml4KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogUmVnaXN0ZXIgbmFtZWQgbWlkZGxld2FyZSBmb3IgdGhlIHNwZWNpZmllZCByb3V0ZXMgd2hlbiB0aGUgYFBVVGBcbiAgICogbWV0aG9kIGlzIHJlcXVlc3RlZC4gKi9cbiAgcHV0PFxuICAgIFIgZXh0ZW5kcyBzdHJpbmcsXG4gICAgUCBleHRlbmRzIFJvdXRlUGFyYW1zPFI+ID0gUm91dGVQYXJhbXM8Uj4sXG4gICAgUyBleHRlbmRzIFN0YXRlID0gUlMsXG4gID4oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHBhdGg6IFIsXG4gICAgbWlkZGxld2FyZTogUm91dGVyTWlkZGxld2FyZTxSLCBQLCBTPixcbiAgICAuLi5taWRkbGV3YXJlczogUm91dGVyTWlkZGxld2FyZTxSLCBQLCBTPltdXG4gICk6IFJvdXRlcjxTIGV4dGVuZHMgUlMgPyBTIDogKFMgJiBSUyk+O1xuICAvKiogUmVnaXN0ZXIgbWlkZGxld2FyZSBmb3IgdGhlIHNwZWNpZmllZCByb3V0ZXMgd2hlbiB0aGUgYFBVVGBcbiAgICogbWV0aG9kIGlzIHJlcXVlc3RlZC4gKi9cbiAgcHV0PFxuICAgIFIgZXh0ZW5kcyBzdHJpbmcsXG4gICAgUCBleHRlbmRzIFJvdXRlUGFyYW1zPFI+ID0gUm91dGVQYXJhbXM8Uj4sXG4gICAgUyBleHRlbmRzIFN0YXRlID0gUlMsXG4gID4oXG4gICAgcGF0aDogUixcbiAgICBtaWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPFIsIFAsIFM+LFxuICAgIC4uLm1pZGRsZXdhcmVzOiBSb3V0ZXJNaWRkbGV3YXJlPFIsIFAsIFM+W11cbiAgKTogUm91dGVyPFMgZXh0ZW5kcyBSUyA/IFMgOiAoUyAmIFJTKT47XG4gIHB1dDxcbiAgICBQIGV4dGVuZHMgUm91dGVQYXJhbXM8c3RyaW5nPiA9IFJvdXRlUGFyYW1zPHN0cmluZz4sXG4gICAgUyBleHRlbmRzIFN0YXRlID0gUlMsXG4gID4oXG4gICAgbmFtZU9yUGF0aDogc3RyaW5nLFxuICAgIHBhdGhPck1pZGRsZXdhcmU6IHN0cmluZyB8IFJvdXRlck1pZGRsZXdhcmU8c3RyaW5nLCBQLCBTPixcbiAgICAuLi5taWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPHN0cmluZywgUCwgUz5bXVxuICApOiBSb3V0ZXI8UyBleHRlbmRzIFJTID8gUyA6IChTICYgUlMpPiB7XG4gICAgdGhpcy4jdXNlVmVyYihcbiAgICAgIG5hbWVPclBhdGgsXG4gICAgICBwYXRoT3JNaWRkbGV3YXJlIGFzIChzdHJpbmcgfCBSb3V0ZXJNaWRkbGV3YXJlPHN0cmluZz4pLFxuICAgICAgbWlkZGxld2FyZSBhcyBSb3V0ZXJNaWRkbGV3YXJlPHN0cmluZz5bXSxcbiAgICAgIFtcIlBVVFwiXSxcbiAgICApO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFJlZ2lzdGVyIGEgZGlyZWN0aW9uIG1pZGRsZXdhcmUsIHdoZXJlIHdoZW4gdGhlIGBzb3VyY2VgIHBhdGggaXMgbWF0Y2hlZFxuICAgKiB0aGUgcm91dGVyIHdpbGwgcmVkaXJlY3QgdGhlIHJlcXVlc3QgdG8gdGhlIGBkZXN0aW5hdGlvbmAgcGF0aC4gIEEgYHN0YXR1c2BcbiAgICogb2YgYDMwMiBGb3VuZGAgd2lsbCBiZSBzZXQgYnkgZGVmYXVsdC5cbiAgICpcbiAgICogVGhlIGBzb3VyY2VgIGFuZCBgZGVzdGluYXRpb25gIGNhbiBiZSBuYW1lZCByb3V0ZXMuICovXG4gIHJlZGlyZWN0KFxuICAgIHNvdXJjZTogc3RyaW5nLFxuICAgIGRlc3RpbmF0aW9uOiBzdHJpbmcgfCBVUkwsXG4gICAgc3RhdHVzOiBSZWRpcmVjdFN0YXR1cyA9IFN0YXR1cy5Gb3VuZCxcbiAgKTogdGhpcyB7XG4gICAgaWYgKHNvdXJjZVswXSAhPT0gXCIvXCIpIHtcbiAgICAgIGNvbnN0IHMgPSB0aGlzLnVybChzb3VyY2UpO1xuICAgICAgaWYgKCFzKSB7XG4gICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKGBDb3VsZCBub3QgcmVzb2x2ZSBuYW1lZCByb3V0ZTogXCIke3NvdXJjZX1cImApO1xuICAgICAgfVxuICAgICAgc291cmNlID0gcztcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBkZXN0aW5hdGlvbiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgaWYgKGRlc3RpbmF0aW9uWzBdICE9PSBcIi9cIikge1xuICAgICAgICBjb25zdCBkID0gdGhpcy51cmwoZGVzdGluYXRpb24pO1xuICAgICAgICBpZiAoIWQpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChkZXN0aW5hdGlvbik7XG4gICAgICAgICAgICBkZXN0aW5hdGlvbiA9IHVybDtcbiAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKGBDb3VsZCBub3QgcmVzb2x2ZSBuYW1lZCByb3V0ZTogXCIke3NvdXJjZX1cImApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZXN0aW5hdGlvbiA9IGQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmFsbChzb3VyY2UsIGFzeW5jIChjdHgsIG5leHQpID0+IHtcbiAgICAgIGF3YWl0IG5leHQoKTtcbiAgICAgIGN0eC5yZXNwb25zZS5yZWRpcmVjdChkZXN0aW5hdGlvbik7XG4gICAgICBjdHgucmVzcG9uc2Uuc3RhdHVzID0gc3RhdHVzO1xuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFJldHVybiBtaWRkbGV3YXJlIHRoYXQgd2lsbCBkbyBhbGwgdGhlIHJvdXRlIHByb2Nlc3NpbmcgdGhhdCB0aGUgcm91dGVyXG4gICAqIGhhcyBiZWVuIGNvbmZpZ3VyZWQgdG8gaGFuZGxlLiAgVHlwaWNhbCB1c2FnZSB3b3VsZCBiZSBzb21ldGhpbmcgbGlrZSB0aGlzOlxuICAgKlxuICAgKiBgYGB0c1xuICAgKiBpbXBvcnQgeyBBcHBsaWNhdGlvbiwgUm91dGVyIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3gvb2FrL21vZC50c1wiO1xuICAgKlxuICAgKiBjb25zdCBhcHAgPSBuZXcgQXBwbGljYXRpb24oKTtcbiAgICogY29uc3Qgcm91dGVyID0gbmV3IFJvdXRlcigpO1xuICAgKlxuICAgKiAvLyByZWdpc3RlciByb3V0ZXNcbiAgICpcbiAgICogYXBwLnVzZShyb3V0ZXIucm91dGVzKCkpO1xuICAgKiBhcHAudXNlKHJvdXRlci5hbGxvd2VkTWV0aG9kcygpKTtcbiAgICogYXdhaXQgYXBwLmxpc3Rlbih7IHBvcnQ6IDgwIH0pO1xuICAgKiBgYGBcbiAgICovXG4gIHJvdXRlcygpOiBNaWRkbGV3YXJlIHtcbiAgICBjb25zdCBkaXNwYXRjaCA9IChcbiAgICAgIGNvbnRleHQ6IENvbnRleHQsXG4gICAgICBuZXh0OiAoKSA9PiBQcm9taXNlPHVua25vd24+LFxuICAgICk6IFByb21pc2U8dW5rbm93bj4gPT4ge1xuICAgICAgY29uc3QgY3R4ID0gY29udGV4dCBhcyBSb3V0ZXJDb250ZXh0PHN0cmluZz47XG4gICAgICBsZXQgcGF0aG5hbWU6IHN0cmluZztcbiAgICAgIGxldCBtZXRob2Q6IEhUVFBNZXRob2RzO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgeyB1cmw6IHsgcGF0aG5hbWU6IHAgfSwgbWV0aG9kOiBtIH0gPSBjdHgucmVxdWVzdDtcbiAgICAgICAgcGF0aG5hbWUgPSBwO1xuICAgICAgICBtZXRob2QgPSBtO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZSk7XG4gICAgICB9XG4gICAgICBjb25zdCBwYXRoID0gdGhpcy4jb3B0cy5yb3V0ZXJQYXRoID8/IGN0eC5yb3V0ZXJQYXRoID8/XG4gICAgICAgIGRlY29kZVVSSShwYXRobmFtZSk7XG4gICAgICBjb25zdCBtYXRjaGVzID0gdGhpcy4jbWF0Y2gocGF0aCwgbWV0aG9kKTtcblxuICAgICAgaWYgKGN0eC5tYXRjaGVkKSB7XG4gICAgICAgIGN0eC5tYXRjaGVkLnB1c2goLi4ubWF0Y2hlcy5wYXRoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGN0eC5tYXRjaGVkID0gWy4uLm1hdGNoZXMucGF0aF07XG4gICAgICB9XG5cbiAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICBjdHgucm91dGVyID0gdGhpcyBhcyBSb3V0ZXI8YW55PjtcblxuICAgICAgaWYgKCFtYXRjaGVzLnJvdXRlKSByZXR1cm4gbmV4dCgpO1xuXG4gICAgICBjb25zdCB7IHBhdGhBbmRNZXRob2Q6IG1hdGNoZWRSb3V0ZXMgfSA9IG1hdGNoZXM7XG5cbiAgICAgIGNvbnN0IGNoYWluID0gbWF0Y2hlZFJvdXRlcy5yZWR1Y2UoXG4gICAgICAgIChwcmV2LCByb3V0ZSkgPT4gW1xuICAgICAgICAgIC4uLnByZXYsXG4gICAgICAgICAgKGN0eCwgbmV4dCkgPT4ge1xuICAgICAgICAgICAgY3R4LmNhcHR1cmVzID0gcm91dGUuY2FwdHVyZXMocGF0aCk7XG4gICAgICAgICAgICBjdHgucGFyYW1zID0gcm91dGUucGFyYW1zKGN0eC5jYXB0dXJlcywgY3R4LnBhcmFtcyk7XG4gICAgICAgICAgICBjdHgucm91dGVOYW1lID0gcm91dGUubmFtZTtcbiAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAuLi5yb3V0ZS5zdGFjayxcbiAgICAgICAgXSxcbiAgICAgICAgW10gYXMgUm91dGVyTWlkZGxld2FyZTxzdHJpbmc+W10sXG4gICAgICApO1xuICAgICAgcmV0dXJuIGNvbXBvc2UoY2hhaW4pKGN0eCwgbmV4dCk7XG4gICAgfTtcbiAgICBkaXNwYXRjaC5yb3V0ZXIgPSB0aGlzO1xuICAgIHJldHVybiBkaXNwYXRjaDtcbiAgfVxuXG4gIC8qKiBHZW5lcmF0ZSBhIFVSTCBwYXRobmFtZSBmb3IgYSBuYW1lZCByb3V0ZSwgaW50ZXJwb2xhdGluZyB0aGUgb3B0aW9uYWxcbiAgICogcGFyYW1zIHByb3ZpZGVkLiAgQWxzbyBhY2NlcHRzIGFuIG9wdGlvbmFsIHNldCBvZiBvcHRpb25zLiAqL1xuICB1cmw8UCBleHRlbmRzIFJvdXRlUGFyYW1zPHN0cmluZz4gPSBSb3V0ZVBhcmFtczxzdHJpbmc+PihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgcGFyYW1zPzogUCxcbiAgICBvcHRpb25zPzogVXJsT3B0aW9ucyxcbiAgKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCByb3V0ZSA9IHRoaXMuI3JvdXRlKG5hbWUpO1xuXG4gICAgaWYgKHJvdXRlKSB7XG4gICAgICByZXR1cm4gcm91dGUudXJsKHBhcmFtcywgb3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFJlZ2lzdGVyIG1pZGRsZXdhcmUgdG8gYmUgdXNlZCBvbiBldmVyeSBtYXRjaGVkIHJvdXRlLiAqL1xuICB1c2U8XG4gICAgUCBleHRlbmRzIFJvdXRlUGFyYW1zPHN0cmluZz4gPSBSb3V0ZVBhcmFtczxzdHJpbmc+LFxuICAgIFMgZXh0ZW5kcyBTdGF0ZSA9IFJTLFxuICA+KFxuICAgIG1pZGRsZXdhcmU6IFJvdXRlck1pZGRsZXdhcmU8c3RyaW5nLCBQLCBTPixcbiAgICAuLi5taWRkbGV3YXJlczogUm91dGVyTWlkZGxld2FyZTxzdHJpbmcsIFAsIFM+W11cbiAgKTogUm91dGVyPFMgZXh0ZW5kcyBSUyA/IFMgOiAoUyAmIFJTKT47XG4gIC8qKiBSZWdpc3RlciBtaWRkbGV3YXJlIHRvIGJlIHVzZWQgb24gZXZlcnkgcm91dGUgdGhhdCBtYXRjaGVzIHRoZSBzdXBwbGllZFxuICAgKiBgcGF0aGAuICovXG4gIHVzZTxcbiAgICBSIGV4dGVuZHMgc3RyaW5nLFxuICAgIFAgZXh0ZW5kcyBSb3V0ZVBhcmFtczxSPiA9IFJvdXRlUGFyYW1zPFI+LFxuICAgIFMgZXh0ZW5kcyBTdGF0ZSA9IFJTLFxuICA+KFxuICAgIHBhdGg6IFIsXG4gICAgbWlkZGxld2FyZTogUm91dGVyTWlkZGxld2FyZTxSLCBQLCBTPixcbiAgICAuLi5taWRkbGV3YXJlczogUm91dGVyTWlkZGxld2FyZTxSLCBQLCBTPltdXG4gICk6IFJvdXRlcjxTIGV4dGVuZHMgUlMgPyBTIDogKFMgJiBSUyk+O1xuICB1c2U8XG4gICAgUCBleHRlbmRzIFJvdXRlUGFyYW1zPHN0cmluZz4gPSBSb3V0ZVBhcmFtczxzdHJpbmc+LFxuICAgIFMgZXh0ZW5kcyBTdGF0ZSA9IFJTLFxuICA+KFxuICAgIHBhdGg6IHN0cmluZ1tdLFxuICAgIG1pZGRsZXdhcmU6IFJvdXRlck1pZGRsZXdhcmU8c3RyaW5nLCBQLCBTPixcbiAgICAuLi5taWRkbGV3YXJlczogUm91dGVyTWlkZGxld2FyZTxzdHJpbmcsIFAsIFM+W11cbiAgKTogUm91dGVyPFMgZXh0ZW5kcyBSUyA/IFMgOiAoUyAmIFJTKT47XG4gIHVzZTxcbiAgICBQIGV4dGVuZHMgUm91dGVQYXJhbXM8c3RyaW5nPiA9IFJvdXRlUGFyYW1zPHN0cmluZz4sXG4gICAgUyBleHRlbmRzIFN0YXRlID0gUlMsXG4gID4oXG4gICAgcGF0aE9yTWlkZGxld2FyZTogc3RyaW5nIHwgc3RyaW5nW10gfCBSb3V0ZXJNaWRkbGV3YXJlPHN0cmluZywgUCwgUz4sXG4gICAgLi4ubWlkZGxld2FyZTogUm91dGVyTWlkZGxld2FyZTxzdHJpbmcsIFAsIFM+W11cbiAgKTogUm91dGVyPFMgZXh0ZW5kcyBSUyA/IFMgOiAoUyAmIFJTKT4ge1xuICAgIGxldCBwYXRoOiBzdHJpbmcgfCBzdHJpbmdbXSB8IHVuZGVmaW5lZDtcbiAgICBpZiAoXG4gICAgICB0eXBlb2YgcGF0aE9yTWlkZGxld2FyZSA9PT0gXCJzdHJpbmdcIiB8fCBBcnJheS5pc0FycmF5KHBhdGhPck1pZGRsZXdhcmUpXG4gICAgKSB7XG4gICAgICBwYXRoID0gcGF0aE9yTWlkZGxld2FyZTtcbiAgICB9IGVsc2Uge1xuICAgICAgbWlkZGxld2FyZS51bnNoaWZ0KHBhdGhPck1pZGRsZXdhcmUpO1xuICAgIH1cblxuICAgIHRoaXMuI3JlZ2lzdGVyKFxuICAgICAgcGF0aCA/PyBcIiguKilcIixcbiAgICAgIG1pZGRsZXdhcmUgYXMgUm91dGVyTWlkZGxld2FyZTxzdHJpbmc+W10sXG4gICAgICBbXSxcbiAgICAgIHsgZW5kOiBmYWxzZSwgaWdub3JlQ2FwdHVyZXM6ICFwYXRoLCBpZ25vcmVQcmVmaXg6ICFwYXRoIH0sXG4gICAgKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIEl0ZXJhdGUgb3ZlciB0aGUgcm91dGVzIGN1cnJlbnRseSBhZGRlZCB0byB0aGUgcm91dGVyLiAqL1xuICAqdmFsdWVzKCk6IEl0ZXJhYmxlSXRlcmF0b3I8Um91dGU8c3RyaW5nLCBSb3V0ZVBhcmFtczxzdHJpbmc+LCBSUz4+IHtcbiAgICBmb3IgKGNvbnN0IHJvdXRlIG9mIHRoaXMuI3N0YWNrKSB7XG4gICAgICB5aWVsZCByb3V0ZS50b0pTT04oKTtcbiAgICB9XG4gIH1cblxuICAvKiogUHJvdmlkZSBhbiBpdGVyYXRvciBpbnRlcmZhY2UgdGhhdCBpdGVyYXRlcyBvdmVyIHRoZSByb3V0ZXMgcmVnaXN0ZXJlZFxuICAgKiB3aXRoIHRoZSByb3V0ZXIuICovXG4gICpbU3ltYm9sLml0ZXJhdG9yXSgpOiBJdGVyYWJsZUl0ZXJhdG9yPFxuICAgIFJvdXRlPHN0cmluZywgUm91dGVQYXJhbXM8c3RyaW5nPiwgUlM+XG4gID4ge1xuICAgIGZvciAoY29uc3Qgcm91dGUgb2YgdGhpcy4jc3RhY2spIHtcbiAgICAgIHlpZWxkIHJvdXRlLnRvSlNPTigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBHZW5lcmF0ZSBhIFVSTCBwYXRobmFtZSBiYXNlZCBvbiB0aGUgcHJvdmlkZWQgcGF0aCwgaW50ZXJwb2xhdGluZyB0aGVcbiAgICogb3B0aW9uYWwgcGFyYW1zIHByb3ZpZGVkLiAgQWxzbyBhY2NlcHRzIGFuIG9wdGlvbmFsIHNldCBvZiBvcHRpb25zLiAqL1xuICBzdGF0aWMgdXJsPFIgZXh0ZW5kcyBzdHJpbmc+KFxuICAgIHBhdGg6IFIsXG4gICAgcGFyYW1zPzogUm91dGVQYXJhbXM8Uj4sXG4gICAgb3B0aW9ucz86IFVybE9wdGlvbnMsXG4gICk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRvVXJsKHBhdGgsIHBhcmFtcywgb3B0aW9ucyk7XG4gIH1cblxuICBbU3ltYm9sLmZvcihcIkRlbm8uY3VzdG9tSW5zcGVjdFwiKV0oaW5zcGVjdDogKHZhbHVlOiB1bmtub3duKSA9PiBzdHJpbmcpIHtcbiAgICByZXR1cm4gYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSAke1xuICAgICAgaW5zcGVjdCh7IFwiI3BhcmFtc1wiOiB0aGlzLiNwYXJhbXMsIFwiI3N0YWNrXCI6IHRoaXMuI3N0YWNrIH0pXG4gICAgfWA7XG4gIH1cblxuICBbU3ltYm9sLmZvcihcIm5vZGVqcy51dGlsLmluc3BlY3QuY3VzdG9tXCIpXShcbiAgICBkZXB0aDogbnVtYmVyLFxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgb3B0aW9uczogYW55LFxuICAgIGluc3BlY3Q6ICh2YWx1ZTogdW5rbm93biwgb3B0aW9ucz86IHVua25vd24pID0+IHN0cmluZyxcbiAgKSB7XG4gICAgaWYgKGRlcHRoIDwgMCkge1xuICAgICAgcmV0dXJuIG9wdGlvbnMuc3R5bGl6ZShgWyR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfV1gLCBcInNwZWNpYWxcIik7XG4gICAgfVxuXG4gICAgY29uc3QgbmV3T3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMsIHtcbiAgICAgIGRlcHRoOiBvcHRpb25zLmRlcHRoID09PSBudWxsID8gbnVsbCA6IG9wdGlvbnMuZGVwdGggLSAxLFxuICAgIH0pO1xuICAgIHJldHVybiBgJHtvcHRpb25zLnN0eWxpemUodGhpcy5jb25zdHJ1Y3Rvci5uYW1lLCBcInNwZWNpYWxcIil9ICR7XG4gICAgICBpbnNwZWN0KFxuICAgICAgICB7IFwiI3BhcmFtc1wiOiB0aGlzLiNwYXJhbXMsIFwiI3N0YWNrXCI6IHRoaXMuI3N0YWNrIH0sXG4gICAgICAgIG5ld09wdGlvbnMsXG4gICAgICApXG4gICAgfWA7XG4gIH1cbn1cbiJdfQ==