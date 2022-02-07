import { assert, compile, pathParse, pathToRegexp, Status, } from "./deps.ts";
import { httpErrors } from "./httpError.ts";
import { compose } from "./middleware.ts";
import { decodeComponent } from "./util.ts";
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
                decodeURIComponent(pathname);
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
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicm91dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTZCQSxPQUFPLEVBQ0wsTUFBTSxFQUNOLE9BQU8sRUFHUCxTQUFTLEVBQ1QsWUFBWSxFQUNaLE1BQU0sR0FFUCxNQUFNLFdBQVcsQ0FBQztBQUNuQixPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDNUMsT0FBTyxFQUFFLE9BQU8sRUFBYyxNQUFNLGlCQUFpQixDQUFDO0FBRXRELE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxXQUFXLENBQUM7QUF1SjVDLFNBQVMsS0FBSyxDQUFDLEdBQVcsRUFBRSxTQUFzQixFQUFFLEVBQUUsT0FBb0I7SUFDeEUsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzlCLElBQUksT0FBTyxHQUFnQixFQUFFLENBQUM7SUFFOUIsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsRUFBRTtRQUNyRCxPQUFPLEdBQUcsTUFBTSxDQUFDO0tBQ2xCO1NBQU07UUFDTCxPQUFPLEdBQUcsTUFBTSxDQUFDO0tBQ2xCO0lBRUQsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNyQyxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFakMsSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRTtRQUM1QixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDNUMsSUFBSSxPQUFPLE9BQU8sQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUFFO1lBQ3JDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQztTQUM1QjthQUFNO1lBQ0ws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QUFFLENBQUMsSUFBSSxFQUFFLENBQzNELENBQUM7UUFHRixPQUFPLElBQXdCLENBQUM7SUFDbEMsQ0FBQztJQUdELENBQUMsTUFBTTtRQUNMLEtBQUssTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUMvQixNQUFNLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUN0QjtJQUNILENBQUM7SUFJRCxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUNoQixLQUFLLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDL0IsTUFBTSxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDdEI7SUFDSCxDQUFDO0lBSUQsTUFBTSxDQUFDLEdBQUcsQ0FDUixJQUFZLEVBQ1osTUFBb0IsRUFDcEIsT0FBb0I7UUFFcEIsT0FBTyxLQUFLLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRUQsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxPQUFtQztRQUNwRSxPQUFPLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLElBQzdCLE9BQU8sQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQzVELEVBQUUsQ0FBQztJQUNMLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQWRhcHRlZCBkaXJlY3RseSBmcm9tIEBrb2Evcm91dGVyIGF0XG4gKiBodHRwczovL2dpdGh1Yi5jb20va29hanMvcm91dGVyLyB3aGljaCBpcyBsaWNlbnNlZCBhczpcbiAqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgQWxleGFuZGVyIEMuIE1pbmdvaWFcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbmltcG9ydCB0eXBlIHsgU3RhdGUgfSBmcm9tIFwiLi9hcHBsaWNhdGlvbi50c1wiO1xuaW1wb3J0IHR5cGUgeyBDb250ZXh0IH0gZnJvbSBcIi4vY29udGV4dC50c1wiO1xuaW1wb3J0IHtcbiAgYXNzZXJ0LFxuICBjb21waWxlLFxuICBLZXksXG4gIFBhcnNlT3B0aW9ucyxcbiAgcGF0aFBhcnNlLFxuICBwYXRoVG9SZWdleHAsXG4gIFN0YXR1cyxcbiAgVG9rZW5zVG9SZWdleHBPcHRpb25zLFxufSBmcm9tIFwiLi9kZXBzLnRzXCI7XG5pbXBvcnQgeyBodHRwRXJyb3JzIH0gZnJvbSBcIi4vaHR0cEVycm9yLnRzXCI7XG5pbXBvcnQgeyBjb21wb3NlLCBNaWRkbGV3YXJlIH0gZnJvbSBcIi4vbWlkZGxld2FyZS50c1wiO1xuaW1wb3J0IHR5cGUgeyBIVFRQTWV0aG9kcywgUmVkaXJlY3RTdGF0dXMgfSBmcm9tIFwiLi90eXBlcy5kLnRzXCI7XG5pbXBvcnQgeyBkZWNvZGVDb21wb25lbnQgfSBmcm9tIFwiLi91dGlsLnRzXCI7XG5cbmludGVyZmFjZSBNYXRjaGVzIHtcbiAgcGF0aDogTGF5ZXJbXTtcbiAgcGF0aEFuZE1ldGhvZDogTGF5ZXJbXTtcbiAgcm91dGU6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUm91dGVyQWxsb3dlZE1ldGhvZHNPcHRpb25zIHtcbiAgLyoqIFVzZSB0aGUgdmFsdWUgcmV0dXJuZWQgZnJvbSB0aGlzIGZ1bmN0aW9uIGluc3RlYWQgb2YgYW4gSFRUUCBlcnJvclxuICAgKiBgTWV0aG9kTm90QWxsb3dlZGAuICovXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIG1ldGhvZE5vdEFsbG93ZWQ/KCk6IGFueTtcblxuICAvKiogVXNlIHRoZSB2YWx1ZSByZXR1cm5lZCBmcm9tIHRoaXMgZnVuY3Rpb24gaW5zdGVhZCBvZiBhbiBIVFRQIGVycm9yXG4gICAqIGBOb3RJbXBsZW1lbnRlZGAuICovXG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIG5vdEltcGxlbWVudGVkPygpOiBhbnk7XG5cbiAgLyoqIFdoZW4gZGVhbGluZyB3aXRoIGEgbm9uLWltcGxlbWVudGVkIG1ldGhvZCBvciBhIG1ldGhvZCBub3QgYWxsb3dlZCwgdGhyb3dcbiAgICogYW4gZXJyb3IgaW5zdGVhZCBvZiBzZXR0aW5nIHRoZSBzdGF0dXMgYW5kIGhlYWRlciBmb3IgdGhlIHJlc3BvbnNlLiAqL1xuICB0aHJvdz86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUm91dGU8XG4gIFAgZXh0ZW5kcyBSb3V0ZVBhcmFtcyA9IFJvdXRlUGFyYW1zLFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBTIGV4dGVuZHMgU3RhdGUgPSBSZWNvcmQ8c3RyaW5nLCBhbnk+LFxuPiB7XG4gIC8qKiBUaGUgSFRUUCBtZXRob2RzIHRoYXQgdGhpcyByb3V0ZSBoYW5kbGVzLiAqL1xuICBtZXRob2RzOiBIVFRQTWV0aG9kc1tdO1xuXG4gIC8qKiBUaGUgbWlkZGxld2FyZSB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGlzIHJvdXRlLiAqL1xuICBtaWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+W107XG5cbiAgLyoqIEFuIG9wdGlvbmFsIG5hbWUgZm9yIHRoZSByb3V0ZS4gKi9cbiAgbmFtZT86IHN0cmluZztcblxuICAvKiogT3B0aW9ucyB0aGF0IHdlcmUgdXNlZCB0byBjcmVhdGUgdGhlIHJvdXRlLiAqL1xuICBvcHRpb25zOiBMYXllck9wdGlvbnM7XG5cbiAgLyoqIFRoZSBwYXJhbWV0ZXJzIHRoYXQgYXJlIGlkZW50aWZpZWQgaW4gdGhlIHJvdXRlIHRoYXQgd2lsbCBiZSBwYXJzZWQgb3V0XG4gICAqIG9uIG1hdGNoZWQgcmVxdWVzdHMuICovXG4gIHBhcmFtTmFtZXM6IChrZXlvZiBQKVtdO1xuXG4gIC8qKiBUaGUgcGF0aCB0aGF0IHRoaXMgcm91dGUgbWFuYWdlcy4gKi9cbiAgcGF0aDogc3RyaW5nO1xuXG4gIC8qKiBUaGUgcmVndWxhciBleHByZXNzaW9uIHVzZWQgZm9yIG1hdGNoaW5nIGFuZCBwYXJzaW5nIHBhcmFtZXRlcnMgZm9yIHRoZVxuICAgKiByb3V0ZS4gKi9cbiAgcmVnZXhwOiBSZWdFeHA7XG59XG5cbi8qKiBUaGUgY29udGV4dCBwYXNzZWQgcm91dGVyIG1pZGRsZXdhcmUuICAqL1xuZXhwb3J0IGludGVyZmFjZSBSb3V0ZXJDb250ZXh0PFxuICBQIGV4dGVuZHMgUm91dGVQYXJhbXMgPSBSb3V0ZVBhcmFtcyxcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgUyBleHRlbmRzIFN0YXRlID0gUmVjb3JkPHN0cmluZywgYW55Pixcbj4gZXh0ZW5kcyBDb250ZXh0PFM+IHtcbiAgLyoqIFdoZW4gbWF0Y2hpbmcgdGhlIHJvdXRlLCBhbiBhcnJheSBvZiB0aGUgY2FwdHVyaW5nIGdyb3VwcyBmcm9tIHRoZSByZWd1bGFyXG4gICAqIGV4cHJlc3Npb24uICovXG4gIGNhcHR1cmVzOiBzdHJpbmdbXTtcblxuICAvKiogVGhlIHJvdXRlcyB0aGF0IHdlcmUgbWF0Y2hlZCBmb3IgdGhpcyByZXF1ZXN0LiAqL1xuICBtYXRjaGVkPzogTGF5ZXI8UCwgUz5bXTtcblxuICAvKiogQW55IHBhcmFtZXRlcnMgcGFyc2VkIGZyb20gdGhlIHJvdXRlIHdoZW4gbWF0Y2hlZC4gKi9cbiAgcGFyYW1zOiBQO1xuXG4gIC8qKiBBIHJlZmVyZW5jZSB0byB0aGUgcm91dGVyIGluc3RhbmNlLiAqL1xuICByb3V0ZXI6IFJvdXRlcjtcblxuICAvKiogSWYgdGhlIG1hdGNoZWQgcm91dGUgaGFzIGEgYG5hbWVgLCB0aGUgbWF0Y2hlZCByb3V0ZSBuYW1lIGlzIHByb3ZpZGVkXG4gICAqIGhlcmUuICovXG4gIHJvdXRlTmFtZT86IHN0cmluZztcblxuICAvKiogT3ZlcnJpZGVzIHRoZSBtYXRjaGVkIHBhdGggZm9yIGZ1dHVyZSByb3V0ZSBtaWRkbGV3YXJlLCB3aGVuIGFcbiAgICogYHJvdXRlclBhdGhgIG9wdGlvbiBpcyBub3QgZGVmaW5lZCBvbiB0aGUgYFJvdXRlcmAgb3B0aW9ucy4gKi9cbiAgcm91dGVyUGF0aD86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSb3V0ZXJNaWRkbGV3YXJlPFxuICBQIGV4dGVuZHMgUm91dGVQYXJhbXMgPSBSb3V0ZVBhcmFtcyxcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgUyBleHRlbmRzIFN0YXRlID0gUmVjb3JkPHN0cmluZywgYW55Pixcbj4ge1xuICAoY29udGV4dDogUm91dGVyQ29udGV4dDxQLCBTPiwgbmV4dDogKCkgPT4gUHJvbWlzZTx1bmtub3duPik6XG4gICAgfCBQcm9taXNlPHVua25vd24+XG4gICAgfCB1bmtub3duO1xuICAvKiogRm9yIHJvdXRlIHBhcmFtZXRlciBtaWRkbGV3YXJlLCB0aGUgYHBhcmFtYCBrZXkgZm9yIHRoaXMgcGFyYW1ldGVyIHdpbGxcbiAgICogYmUgc2V0LiAqL1xuICBwYXJhbT86IGtleW9mIFA7XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIHJvdXRlcj86IFJvdXRlcjxhbnksIGFueT47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUm91dGVyT3B0aW9ucyB7XG4gIC8qKiBPdmVycmlkZSB0aGUgZGVmYXVsdCBzZXQgb2YgbWV0aG9kcyBzdXBwb3J0ZWQgYnkgdGhlIHJvdXRlci4gKi9cbiAgbWV0aG9kcz86IEhUVFBNZXRob2RzW107XG5cbiAgLyoqIE9ubHkgaGFuZGxlIHJvdXRlcyB3aGVyZSB0aGUgcmVxdWVzdGVkIHBhdGggc3RhcnRzIHdpdGggdGhlIHByZWZpeC4gKi9cbiAgcHJlZml4Pzogc3RyaW5nO1xuXG4gIC8qKiBPdmVycmlkZSB0aGUgYHJlcXVlc3QudXJsLnBhdGhuYW1lYCB3aGVuIG1hdGNoaW5nIG1pZGRsZXdhcmUgdG8gcnVuLiAqL1xuICByb3V0ZXJQYXRoPzogc3RyaW5nO1xuXG4gIC8qKiBEZXRlcm1pbmVzIGlmIHJvdXRlcyBhcmUgbWF0Y2hlZCBpbiBhIGNhc2Ugc2Vuc2l0aXZlIHdheS4gIERlZmF1bHRzIHRvXG4gICAqIGBmYWxzZWAuICovXG4gIHNlbnNpdGl2ZT86IGJvb2xlYW47XG5cbiAgLyoqIERldGVybWluZXMgaWYgcm91dGVzIGFyZSBtYXRjaGVkIHN0cmljdGx5LCB3aGVyZSB0aGUgdHJhaWxpbmcgYC9gIGlzIG5vdFxuICAgKiBvcHRpb25hbC4gIERlZmF1bHRzIHRvIGBmYWxzZWAuICovXG4gIHN0cmljdD86IGJvb2xlYW47XG59XG5cbi8qKiBNaWRkbGV3YXJlIHRoYXQgd2lsbCBiZSBjYWxsZWQgYnkgdGhlIHJvdXRlciB3aGVuIGhhbmRsaW5nIGEgc3BlY2lmaWNcbiAqIHBhcmFtZXRlciwgd2hpY2ggdGhlIG1pZGRsZXdhcmUgd2lsbCBiZSBjYWxsZWQgd2hlbiBhIHJlcXVlc3QgbWF0Y2hlcyB0aGVcbiAqIHJvdXRlIHBhcmFtZXRlci4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUm91dGVyUGFyYW1NaWRkbGV3YXJlPFxuICBQIGV4dGVuZHMgUm91dGVQYXJhbXMgPSBSb3V0ZVBhcmFtcyxcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgUyBleHRlbmRzIFN0YXRlID0gUmVjb3JkPHN0cmluZywgYW55Pixcbj4ge1xuICAoXG4gICAgcGFyYW06IHN0cmluZyxcbiAgICBjb250ZXh0OiBSb3V0ZXJDb250ZXh0PFAsIFM+LFxuICAgIG5leHQ6ICgpID0+IFByb21pc2U8dW5rbm93bj4sXG4gICk6IFByb21pc2U8dW5rbm93bj4gfCB1bmtub3duO1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICByb3V0ZXI/OiBSb3V0ZXI8YW55LCBhbnk+O1xufVxuXG5leHBvcnQgdHlwZSBSb3V0ZVBhcmFtcyA9IFJlY29yZDxzdHJpbmcgfCBudW1iZXIsIHN0cmluZyB8IHVuZGVmaW5lZD47XG5cbnR5cGUgTGF5ZXJPcHRpb25zID0gVG9rZW5zVG9SZWdleHBPcHRpb25zICYgUGFyc2VPcHRpb25zICYge1xuICBpZ25vcmVDYXB0dXJlcz86IGJvb2xlYW47XG4gIG5hbWU/OiBzdHJpbmc7XG59O1xuXG50eXBlIFJlZ2lzdGVyT3B0aW9ucyA9IExheWVyT3B0aW9ucyAmIHtcbiAgaWdub3JlUHJlZml4PzogYm9vbGVhbjtcbn07XG5cbnR5cGUgVXJsT3B0aW9ucyA9IFRva2Vuc1RvUmVnZXhwT3B0aW9ucyAmIFBhcnNlT3B0aW9ucyAmIHtcbiAgLyoqIFdoZW4gZ2VuZXJhdGluZyBhIFVSTCBmcm9tIGEgcm91dGUsIGFkZCB0aGUgcXVlcnkgdG8gdGhlIFVSTC4gIElmIGFuXG4gICAqIG9iamVjdCAqL1xuICBxdWVyeT86IFVSTFNlYXJjaFBhcmFtcyB8IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gfCBzdHJpbmc7XG59O1xuXG4vKiogR2VuZXJhdGUgYSBVUkwgZnJvbSBhIHN0cmluZywgcG90ZW50aWFsbHkgcmVwbGFjZSByb3V0ZSBwYXJhbXMgd2l0aFxuICogdmFsdWVzLiAqL1xuZnVuY3Rpb24gdG9VcmwodXJsOiBzdHJpbmcsIHBhcmFtczogUm91dGVQYXJhbXMgPSB7fSwgb3B0aW9ucz86IFVybE9wdGlvbnMpIHtcbiAgY29uc3QgdG9rZW5zID0gcGF0aFBhcnNlKHVybCk7XG4gIGxldCByZXBsYWNlOiBSb3V0ZVBhcmFtcyA9IHt9O1xuXG4gIGlmICh0b2tlbnMuc29tZSgodG9rZW4pID0+IHR5cGVvZiB0b2tlbiA9PT0gXCJvYmplY3RcIikpIHtcbiAgICByZXBsYWNlID0gcGFyYW1zO1xuICB9IGVsc2Uge1xuICAgIG9wdGlvbnMgPSBwYXJhbXM7XG4gIH1cblxuICBjb25zdCB0b1BhdGggPSBjb21waWxlKHVybCwgb3B0aW9ucyk7XG4gIGNvbnN0IHJlcGxhY2VkID0gdG9QYXRoKHJlcGxhY2UpO1xuXG4gIGlmIChvcHRpb25zICYmIG9wdGlvbnMucXVlcnkpIHtcbiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcGxhY2VkLCBcImh0dHA6Ly9vYWtcIik7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zLnF1ZXJ5ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB1cmwuc2VhcmNoID0gb3B0aW9ucy5xdWVyeTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXJsLnNlYXJjaCA9IFN0cmluZyhcbiAgICAgICAgb3B0aW9ucy5xdWVyeSBpbnN0YW5jZW9mIFVSTFNlYXJjaFBhcmFtc1xuICAgICAgICAgID8gb3B0aW9ucy5xdWVyeVxuICAgICAgICAgIDogbmV3IFVSTFNlYXJjaFBhcmFtcyhvcHRpb25zLnF1ZXJ5KSxcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBgJHt1cmwucGF0aG5hbWV9JHt1cmwuc2VhcmNofSR7dXJsLmhhc2h9YDtcbiAgfVxuICByZXR1cm4gcmVwbGFjZWQ7XG59XG5cbmNsYXNzIExheWVyPFxuICBQIGV4dGVuZHMgUm91dGVQYXJhbXMgPSBSb3V0ZVBhcmFtcyxcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgUyBleHRlbmRzIFN0YXRlID0gUmVjb3JkPHN0cmluZywgYW55Pixcbj4ge1xuICAjb3B0czogTGF5ZXJPcHRpb25zO1xuICAjcGFyYW1OYW1lczogS2V5W10gPSBbXTtcbiAgI3JlZ2V4cDogUmVnRXhwO1xuXG4gIG1ldGhvZHM6IEhUVFBNZXRob2RzW107XG4gIG5hbWU/OiBzdHJpbmc7XG4gIHBhdGg6IHN0cmluZztcbiAgc3RhY2s6IFJvdXRlck1pZGRsZXdhcmU8UCwgUz5bXTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgbWV0aG9kczogSFRUUE1ldGhvZHNbXSxcbiAgICBtaWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+IHwgUm91dGVyTWlkZGxld2FyZTxQLCBTPltdLFxuICAgIHsgbmFtZSwgLi4ub3B0cyB9OiBMYXllck9wdGlvbnMgPSB7fSxcbiAgKSB7XG4gICAgdGhpcy4jb3B0cyA9IG9wdHM7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLm1ldGhvZHMgPSBbLi4ubWV0aG9kc107XG4gICAgaWYgKHRoaXMubWV0aG9kcy5pbmNsdWRlcyhcIkdFVFwiKSkge1xuICAgICAgdGhpcy5tZXRob2RzLnVuc2hpZnQoXCJIRUFEXCIpO1xuICAgIH1cbiAgICB0aGlzLnN0YWNrID0gQXJyYXkuaXNBcnJheShtaWRkbGV3YXJlKSA/IG1pZGRsZXdhcmUuc2xpY2UoKSA6IFttaWRkbGV3YXJlXTtcbiAgICB0aGlzLnBhdGggPSBwYXRoO1xuICAgIHRoaXMuI3JlZ2V4cCA9IHBhdGhUb1JlZ2V4cChwYXRoLCB0aGlzLiNwYXJhbU5hbWVzLCB0aGlzLiNvcHRzKTtcbiAgfVxuXG4gIGNsb25lKCk6IExheWVyPFAsIFM+IHtcbiAgICByZXR1cm4gbmV3IExheWVyKFxuICAgICAgdGhpcy5wYXRoLFxuICAgICAgdGhpcy5tZXRob2RzLFxuICAgICAgdGhpcy5zdGFjayxcbiAgICAgIHsgbmFtZTogdGhpcy5uYW1lLCAuLi50aGlzLiNvcHRzIH0sXG4gICAgKTtcbiAgfVxuXG4gIG1hdGNoKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiNyZWdleHAudGVzdChwYXRoKTtcbiAgfVxuXG4gIHBhcmFtcyhcbiAgICBjYXB0dXJlczogc3RyaW5nW10sXG4gICAgZXhpc3RpbmdQYXJhbXM6IFJvdXRlUGFyYW1zID0ge30sXG4gICk6IFJvdXRlUGFyYW1zIHtcbiAgICBjb25zdCBwYXJhbXMgPSBleGlzdGluZ1BhcmFtcztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNhcHR1cmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy4jcGFyYW1OYW1lc1tpXSkge1xuICAgICAgICBjb25zdCBjID0gY2FwdHVyZXNbaV07XG4gICAgICAgIHBhcmFtc1t0aGlzLiNwYXJhbU5hbWVzW2ldLm5hbWVdID0gYyA/IGRlY29kZUNvbXBvbmVudChjKSA6IGM7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwYXJhbXM7XG4gIH1cblxuICBjYXB0dXJlcyhwYXRoOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgaWYgKHRoaXMuI29wdHMuaWdub3JlQ2FwdHVyZXMpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgcmV0dXJuIHBhdGgubWF0Y2godGhpcy4jcmVnZXhwKT8uc2xpY2UoMSkgPz8gW107XG4gIH1cblxuICB1cmwoXG4gICAgcGFyYW1zOiBSb3V0ZVBhcmFtcyA9IHt9LFxuICAgIG9wdGlvbnM/OiBVcmxPcHRpb25zLFxuICApOiBzdHJpbmcge1xuICAgIGNvbnN0IHVybCA9IHRoaXMucGF0aC5yZXBsYWNlKC9cXChcXC5cXCpcXCkvZywgXCJcIik7XG4gICAgcmV0dXJuIHRvVXJsKHVybCwgcGFyYW1zLCBvcHRpb25zKTtcbiAgfVxuXG4gIHBhcmFtKFxuICAgIHBhcmFtOiBzdHJpbmcsXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBmbjogUm91dGVyUGFyYW1NaWRkbGV3YXJlPGFueSwgYW55PixcbiAgKSB7XG4gICAgY29uc3Qgc3RhY2sgPSB0aGlzLnN0YWNrO1xuICAgIGNvbnN0IHBhcmFtcyA9IHRoaXMuI3BhcmFtTmFtZXM7XG4gICAgY29uc3QgbWlkZGxld2FyZTogUm91dGVyTWlkZGxld2FyZSA9IGZ1bmN0aW9uIChcbiAgICAgIHRoaXM6IFJvdXRlcixcbiAgICAgIGN0eCxcbiAgICAgIG5leHQsXG4gICAgKTogUHJvbWlzZTx1bmtub3duPiB8IHVua25vd24ge1xuICAgICAgY29uc3QgcCA9IGN0eC5wYXJhbXNbcGFyYW1dO1xuICAgICAgYXNzZXJ0KHApO1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgcCwgY3R4LCBuZXh0KTtcbiAgICB9O1xuICAgIG1pZGRsZXdhcmUucGFyYW0gPSBwYXJhbTtcblxuICAgIGNvbnN0IG5hbWVzID0gcGFyYW1zLm1hcCgocCkgPT4gcC5uYW1lKTtcblxuICAgIGNvbnN0IHggPSBuYW1lcy5pbmRleE9mKHBhcmFtKTtcbiAgICBpZiAoeCA+PSAwKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0YWNrLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGZuID0gc3RhY2tbaV07XG4gICAgICAgIGlmICghZm4ucGFyYW0gfHwgbmFtZXMuaW5kZXhPZihmbi5wYXJhbSBhcyAoc3RyaW5nIHwgbnVtYmVyKSkgPiB4KSB7XG4gICAgICAgICAgc3RhY2suc3BsaWNlKGksIDAsIG1pZGRsZXdhcmUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0UHJlZml4KHByZWZpeDogc3RyaW5nKTogdGhpcyB7XG4gICAgaWYgKHRoaXMucGF0aCkge1xuICAgICAgdGhpcy5wYXRoID0gdGhpcy5wYXRoICE9PSBcIi9cIiB8fCB0aGlzLiNvcHRzLnN0cmljdCA9PT0gdHJ1ZVxuICAgICAgICA/IGAke3ByZWZpeH0ke3RoaXMucGF0aH1gXG4gICAgICAgIDogcHJlZml4O1xuICAgICAgdGhpcy4jcGFyYW1OYW1lcyA9IFtdO1xuICAgICAgdGhpcy4jcmVnZXhwID0gcGF0aFRvUmVnZXhwKHRoaXMucGF0aCwgdGhpcy4jcGFyYW1OYW1lcywgdGhpcy4jb3B0cyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgdG9KU09OKCk6IFJvdXRlPGFueSwgYW55PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1ldGhvZHM6IFsuLi50aGlzLm1ldGhvZHNdLFxuICAgICAgbWlkZGxld2FyZTogWy4uLnRoaXMuc3RhY2tdLFxuICAgICAgcGFyYW1OYW1lczogdGhpcy4jcGFyYW1OYW1lcy5tYXAoKGtleSkgPT4ga2V5Lm5hbWUpLFxuICAgICAgcGF0aDogdGhpcy5wYXRoLFxuICAgICAgcmVnZXhwOiB0aGlzLiNyZWdleHAsXG4gICAgICBvcHRpb25zOiB7IC4uLnRoaXMuI29wdHMgfSxcbiAgICB9O1xuICB9XG5cbiAgW1N5bWJvbC5mb3IoXCJEZW5vLmN1c3RvbUluc3BlY3RcIildKGluc3BlY3Q6ICh2YWx1ZTogdW5rbm93bikgPT4gc3RyaW5nKSB7XG4gICAgcmV0dXJuIGAke3RoaXMuY29uc3RydWN0b3IubmFtZX0gJHtcbiAgICAgIGluc3BlY3Qoe1xuICAgICAgICBtZXRob2RzOiB0aGlzLm1ldGhvZHMsXG4gICAgICAgIG1pZGRsZXdhcmU6IHRoaXMuc3RhY2ssXG4gICAgICAgIG9wdGlvbnM6IHRoaXMuI29wdHMsXG4gICAgICAgIHBhcmFtTmFtZXM6IHRoaXMuI3BhcmFtTmFtZXMubWFwKChrZXkpID0+IGtleS5uYW1lKSxcbiAgICAgICAgcGF0aDogdGhpcy5wYXRoLFxuICAgICAgICByZWdleHA6IHRoaXMuI3JlZ2V4cCxcbiAgICAgIH0pXG4gICAgfWA7XG4gIH1cbn1cblxuLyoqIEFuIGludGVyZmFjZSBmb3IgcmVnaXN0ZXJpbmcgbWlkZGxld2FyZSB0aGF0IHdpbGwgcnVuIHdoZW4gY2VydGFpbiBIVFRQXG4gKiBtZXRob2RzIGFuZCBwYXRocyBhcmUgcmVxdWVzdGVkLCBhcyB3ZWxsIGFzIHByb3ZpZGVzIGEgd2F5IHRvIHBhcmFtZXRlcml6ZVxuICogcGFydHMgb2YgdGhlIHJlcXVlc3RlZCBwYXRoLiAqL1xuZXhwb3J0IGNsYXNzIFJvdXRlcjxcbiAgUlAgZXh0ZW5kcyBSb3V0ZVBhcmFtcyA9IFJvdXRlUGFyYW1zLFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBSUyBleHRlbmRzIFN0YXRlID0gUmVjb3JkPHN0cmluZywgYW55Pixcbj4ge1xuICAjb3B0czogUm91dGVyT3B0aW9ucztcbiAgI21ldGhvZHM6IEhUVFBNZXRob2RzW107XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICNwYXJhbXM6IFJlY29yZDxzdHJpbmcsIFJvdXRlclBhcmFtTWlkZGxld2FyZTxhbnksIGFueT4+ID0ge307XG4gICNzdGFjazogTGF5ZXJbXSA9IFtdO1xuXG4gICNtYXRjaChwYXRoOiBzdHJpbmcsIG1ldGhvZDogSFRUUE1ldGhvZHMpOiBNYXRjaGVzIHtcbiAgICBjb25zdCBtYXRjaGVzOiBNYXRjaGVzID0ge1xuICAgICAgcGF0aDogW10sXG4gICAgICBwYXRoQW5kTWV0aG9kOiBbXSxcbiAgICAgIHJvdXRlOiBmYWxzZSxcbiAgICB9O1xuXG4gICAgZm9yIChjb25zdCByb3V0ZSBvZiB0aGlzLiNzdGFjaykge1xuICAgICAgaWYgKHJvdXRlLm1hdGNoKHBhdGgpKSB7XG4gICAgICAgIG1hdGNoZXMucGF0aC5wdXNoKHJvdXRlKTtcbiAgICAgICAgaWYgKHJvdXRlLm1ldGhvZHMubGVuZ3RoID09PSAwIHx8IHJvdXRlLm1ldGhvZHMuaW5jbHVkZXMobWV0aG9kKSkge1xuICAgICAgICAgIG1hdGNoZXMucGF0aEFuZE1ldGhvZC5wdXNoKHJvdXRlKTtcbiAgICAgICAgICBpZiAocm91dGUubWV0aG9kcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIG1hdGNoZXMucm91dGUgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgI3JlZ2lzdGVyKFxuICAgIHBhdGg6IHN0cmluZyB8IHN0cmluZ1tdLFxuICAgIG1pZGRsZXdhcmVzOiBSb3V0ZXJNaWRkbGV3YXJlW10sXG4gICAgbWV0aG9kczogSFRUUE1ldGhvZHNbXSxcbiAgICBvcHRpb25zOiBSZWdpc3Rlck9wdGlvbnMgPSB7fSxcbiAgKTogdm9pZCB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocGF0aCkpIHtcbiAgICAgIGZvciAoY29uc3QgcCBvZiBwYXRoKSB7XG4gICAgICAgIHRoaXMuI3JlZ2lzdGVyKHAsIG1pZGRsZXdhcmVzLCBtZXRob2RzLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgbGF5ZXJNaWRkbGV3YXJlczogUm91dGVyTWlkZGxld2FyZVtdID0gW107XG4gICAgZm9yIChjb25zdCBtaWRkbGV3YXJlIG9mIG1pZGRsZXdhcmVzKSB7XG4gICAgICBpZiAoIW1pZGRsZXdhcmUucm91dGVyKSB7XG4gICAgICAgIGxheWVyTWlkZGxld2FyZXMucHVzaChtaWRkbGV3YXJlKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChsYXllck1pZGRsZXdhcmVzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLiNhZGRMYXllcihwYXRoLCBsYXllck1pZGRsZXdhcmVzLCBtZXRob2RzLCBvcHRpb25zKTtcbiAgICAgICAgbGF5ZXJNaWRkbGV3YXJlcyA9IFtdO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByb3V0ZXIgPSBtaWRkbGV3YXJlLnJvdXRlci4jY2xvbmUoKTtcblxuICAgICAgZm9yIChjb25zdCBsYXllciBvZiByb3V0ZXIuI3N0YWNrKSB7XG4gICAgICAgIGlmICghb3B0aW9ucy5pZ25vcmVQcmVmaXgpIHtcbiAgICAgICAgICBsYXllci5zZXRQcmVmaXgocGF0aCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuI29wdHMucHJlZml4KSB7XG4gICAgICAgICAgbGF5ZXIuc2V0UHJlZml4KHRoaXMuI29wdHMucHJlZml4KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiNzdGFjay5wdXNoKGxheWVyKTtcbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCBbcGFyYW0sIG13XSBvZiBPYmplY3QuZW50cmllcyh0aGlzLiNwYXJhbXMpKSB7XG4gICAgICAgIHJvdXRlci5wYXJhbShwYXJhbSwgbXcpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChsYXllck1pZGRsZXdhcmVzLmxlbmd0aCkge1xuICAgICAgdGhpcy4jYWRkTGF5ZXIocGF0aCwgbGF5ZXJNaWRkbGV3YXJlcywgbWV0aG9kcywgb3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgI2FkZExheWVyKFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBtaWRkbGV3YXJlczogUm91dGVyTWlkZGxld2FyZVtdLFxuICAgIG1ldGhvZHM6IEhUVFBNZXRob2RzW10sXG4gICAgb3B0aW9uczogTGF5ZXJPcHRpb25zID0ge30sXG4gICkge1xuICAgIGNvbnN0IHtcbiAgICAgIGVuZCxcbiAgICAgIG5hbWUsXG4gICAgICBzZW5zaXRpdmUgPSB0aGlzLiNvcHRzLnNlbnNpdGl2ZSxcbiAgICAgIHN0cmljdCA9IHRoaXMuI29wdHMuc3RyaWN0LFxuICAgICAgaWdub3JlQ2FwdHVyZXMsXG4gICAgfSA9IG9wdGlvbnM7XG4gICAgY29uc3Qgcm91dGUgPSBuZXcgTGF5ZXIocGF0aCwgbWV0aG9kcywgbWlkZGxld2FyZXMsIHtcbiAgICAgIGVuZCxcbiAgICAgIG5hbWUsXG4gICAgICBzZW5zaXRpdmUsXG4gICAgICBzdHJpY3QsXG4gICAgICBpZ25vcmVDYXB0dXJlcyxcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLiNvcHRzLnByZWZpeCkge1xuICAgICAgcm91dGUuc2V0UHJlZml4KHRoaXMuI29wdHMucHJlZml4KTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IFtwYXJhbSwgbXddIG9mIE9iamVjdC5lbnRyaWVzKHRoaXMuI3BhcmFtcykpIHtcbiAgICAgIHJvdXRlLnBhcmFtKHBhcmFtLCBtdyk7XG4gICAgfVxuXG4gICAgdGhpcy4jc3RhY2sucHVzaChyb3V0ZSk7XG4gIH1cblxuICAjcm91dGUobmFtZTogc3RyaW5nKTogTGF5ZXIgfCB1bmRlZmluZWQge1xuICAgIGZvciAoY29uc3Qgcm91dGUgb2YgdGhpcy4jc3RhY2spIHtcbiAgICAgIGlmIChyb3V0ZS5uYW1lID09PSBuYW1lKSB7XG4gICAgICAgIHJldHVybiByb3V0ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAjdXNlVmVyYihcbiAgICBuYW1lT3JQYXRoOiBzdHJpbmcsXG4gICAgcGF0aE9yTWlkZGxld2FyZTogc3RyaW5nIHwgUm91dGVyTWlkZGxld2FyZSxcbiAgICBtaWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlW10sXG4gICAgbWV0aG9kczogSFRUUE1ldGhvZHNbXSxcbiAgKTogdm9pZCB7XG4gICAgbGV0IG5hbWU6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICBsZXQgcGF0aDogc3RyaW5nO1xuICAgIGlmICh0eXBlb2YgcGF0aE9yTWlkZGxld2FyZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgbmFtZSA9IG5hbWVPclBhdGg7XG4gICAgICBwYXRoID0gcGF0aE9yTWlkZGxld2FyZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGF0aCA9IG5hbWVPclBhdGg7XG4gICAgICBtaWRkbGV3YXJlLnVuc2hpZnQocGF0aE9yTWlkZGxld2FyZSk7XG4gICAgfVxuXG4gICAgdGhpcy4jcmVnaXN0ZXIocGF0aCwgbWlkZGxld2FyZSwgbWV0aG9kcywgeyBuYW1lIH0pO1xuICB9XG5cbiAgI2Nsb25lKCk6IFJvdXRlcjxSUCwgUlM+IHtcbiAgICBjb25zdCByb3V0ZXIgPSBuZXcgUm91dGVyPFJQLCBSUz4odGhpcy4jb3B0cyk7XG4gICAgcm91dGVyLiNtZXRob2RzID0gcm91dGVyLiNtZXRob2RzLnNsaWNlKCk7XG4gICAgcm91dGVyLiNwYXJhbXMgPSB7IC4uLnRoaXMuI3BhcmFtcyB9O1xuICAgIHJvdXRlci4jc3RhY2sgPSB0aGlzLiNzdGFjay5tYXAoKGxheWVyKSA9PiBsYXllci5jbG9uZSgpKTtcbiAgICByZXR1cm4gcm91dGVyO1xuICB9XG5cbiAgY29uc3RydWN0b3Iob3B0czogUm91dGVyT3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy4jb3B0cyA9IG9wdHM7XG4gICAgdGhpcy4jbWV0aG9kcyA9IG9wdHMubWV0aG9kcyA/PyBbXG4gICAgICBcIkRFTEVURVwiLFxuICAgICAgXCJHRVRcIixcbiAgICAgIFwiSEVBRFwiLFxuICAgICAgXCJPUFRJT05TXCIsXG4gICAgICBcIlBBVENIXCIsXG4gICAgICBcIlBPU1RcIixcbiAgICAgIFwiUFVUXCIsXG4gICAgXTtcbiAgfVxuXG4gIC8qKiBSZWdpc3RlciBuYW1lZCBtaWRkbGV3YXJlIGZvciB0aGUgc3BlY2lmaWVkIHJvdXRlcyB3aGVuIHRoZSBgREVMRVRFYCxcbiAgICogYEdFVGAsIGBQT1NUYCwgb3IgYFBVVGAgbWV0aG9kIGlzIHJlcXVlc3RlZC4gKi9cbiAgYWxsPFAgZXh0ZW5kcyBSb3V0ZVBhcmFtcyA9IFJQLCBTIGV4dGVuZHMgU3RhdGUgPSBSUz4oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBtaWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+LFxuICAgIC4uLm1pZGRsZXdhcmVzOiBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+W11cbiAgKTogUm91dGVyPFAgZXh0ZW5kcyBSUCA/IFAgOiAoUCAmIFJQKSwgUyBleHRlbmRzIFJTID8gUyA6IChTICYgUlMpPjtcbiAgLyoqIFJlZ2lzdGVyIG1pZGRsZXdhcmUgZm9yIHRoZSBzcGVjaWZpZWQgcm91dGVzIHdoZW4gdGhlIGBERUxFVEVgLFxuICAgKiBgR0VUYCwgYFBPU1RgLCBvciBgUFVUYCBtZXRob2QgaXMgcmVxdWVzdGVkLiAqL1xuICBhbGw8UCBleHRlbmRzIFJvdXRlUGFyYW1zID0gUlAsIFMgZXh0ZW5kcyBTdGF0ZSA9IFJTPihcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgbWlkZGxld2FyZTogUm91dGVyTWlkZGxld2FyZTxQLCBTPixcbiAgICAuLi5taWRkbGV3YXJlczogUm91dGVyTWlkZGxld2FyZTxQLCBTPltdXG4gICk6IFJvdXRlcjxQIGV4dGVuZHMgUlAgPyBQIDogKFAgJiBSUCksIFMgZXh0ZW5kcyBSUyA/IFMgOiAoUyAmIFJTKT47XG4gIGFsbDxQIGV4dGVuZHMgUm91dGVQYXJhbXMgPSBSUCwgUyBleHRlbmRzIFN0YXRlID0gUlM+KFxuICAgIG5hbWVPclBhdGg6IHN0cmluZyxcbiAgICBwYXRoT3JNaWRkbGV3YXJlOiBzdHJpbmcgfCBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+LFxuICAgIC4uLm1pZGRsZXdhcmU6IFJvdXRlck1pZGRsZXdhcmU8UCwgUz5bXVxuICApOiBSb3V0ZXI8UCBleHRlbmRzIFJQID8gUCA6IChQICYgUlApLCBTIGV4dGVuZHMgUlMgPyBTIDogKFMgJiBSUyk+IHtcbiAgICB0aGlzLiN1c2VWZXJiKFxuICAgICAgbmFtZU9yUGF0aCxcbiAgICAgIHBhdGhPck1pZGRsZXdhcmUgYXMgKHN0cmluZyB8IFJvdXRlck1pZGRsZXdhcmUpLFxuICAgICAgbWlkZGxld2FyZSBhcyBSb3V0ZXJNaWRkbGV3YXJlW10sXG4gICAgICBbXCJERUxFVEVcIiwgXCJHRVRcIiwgXCJQT1NUXCIsIFwiUFVUXCJdLFxuICAgICk7XG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICByZXR1cm4gdGhpcyBhcyBSb3V0ZXI8YW55LCBhbnk+O1xuICB9XG5cbiAgLyoqIE1pZGRsZXdhcmUgdGhhdCBoYW5kbGVzIHJlcXVlc3RzIGZvciBIVFRQIG1ldGhvZHMgcmVnaXN0ZXJlZCB3aXRoIHRoZVxuICAgKiByb3V0ZXIuICBJZiBub25lIG9mIHRoZSByb3V0ZXMgaGFuZGxlIGEgbWV0aG9kLCB0aGVuIFwibm90IGFsbG93ZWRcIiBsb2dpY1xuICAgKiB3aWxsIGJlIHVzZWQuICBJZiBhIG1ldGhvZCBpcyBzdXBwb3J0ZWQgYnkgc29tZSByb3V0ZXMsIGJ1dCBub3QgdGhlXG4gICAqIHBhcnRpY3VsYXIgbWF0Y2hlZCByb3V0ZXIsIHRoZW4gXCJub3QgaW1wbGVtZW50ZWRcIiB3aWxsIGJlIHJldHVybmVkLlxuICAgKlxuICAgKiBUaGUgbWlkZGxld2FyZSB3aWxsIGFsc28gYXV0b21hdGljYWxseSBoYW5kbGUgdGhlIGBPUFRJT05TYCBtZXRob2QsXG4gICAqIHJlc3BvbmRpbmcgd2l0aCBhIGAyMDAgT0tgIHdoZW4gdGhlIGBBbGxvd2VkYCBoZWFkZXIgc2VudCB0byB0aGUgYWxsb3dlZFxuICAgKiBtZXRob2RzIGZvciBhIGdpdmVuIHJvdXRlLlxuICAgKlxuICAgKiBCeSBkZWZhdWx0LCBhIFwibm90IGFsbG93ZWRcIiByZXF1ZXN0IHdpbGwgcmVzcG9uZCB3aXRoIGEgYDQwNSBOb3QgQWxsb3dlZGBcbiAgICogYW5kIGEgXCJub3QgaW1wbGVtZW50ZWRcIiB3aWxsIHJlc3BvbmQgd2l0aCBhIGA1MDEgTm90IEltcGxlbWVudGVkYC4gU2V0dGluZ1xuICAgKiB0aGUgb3B0aW9uIGAudGhyb3dgIHRvIGB0cnVlYCB3aWxsIGNhdXNlIHRoZSBtaWRkbGV3YXJlIHRvIHRocm93IGFuXG4gICAqIGBIVFRQRXJyb3JgIGluc3RlYWQgb2Ygc2V0dGluZyB0aGUgcmVzcG9uc2Ugc3RhdHVzLiAgVGhlIGVycm9yIGNhbiBiZVxuICAgKiBvdmVycmlkZGVuIGJ5IHByb3ZpZGluZyBhIGAubm90SW1wbGVtZW50ZWRgIG9yIGAubm90QWxsb3dlZGAgbWV0aG9kIGluIHRoZVxuICAgKiBvcHRpb25zLCBvZiB3aGljaCB0aGUgdmFsdWUgd2lsbCBiZSByZXR1cm5lZCB3aWxsIGJlIHRocm93biBpbnN0ZWFkIG9mIHRoZVxuICAgKiBIVFRQIGVycm9yLiAqL1xuICBhbGxvd2VkTWV0aG9kcyhcbiAgICBvcHRpb25zOiBSb3V0ZXJBbGxvd2VkTWV0aG9kc09wdGlvbnMgPSB7fSxcbiAgKTogTWlkZGxld2FyZSB7XG4gICAgY29uc3QgaW1wbGVtZW50ZWQgPSB0aGlzLiNtZXRob2RzO1xuXG4gICAgY29uc3QgYWxsb3dlZE1ldGhvZHM6IE1pZGRsZXdhcmUgPSBhc3luYyAoY29udGV4dCwgbmV4dCkgPT4ge1xuICAgICAgY29uc3QgY3R4ID0gY29udGV4dCBhcyBSb3V0ZXJDb250ZXh0O1xuICAgICAgYXdhaXQgbmV4dCgpO1xuICAgICAgaWYgKCFjdHgucmVzcG9uc2Uuc3RhdHVzIHx8IGN0eC5yZXNwb25zZS5zdGF0dXMgPT09IFN0YXR1cy5Ob3RGb3VuZCkge1xuICAgICAgICBhc3NlcnQoY3R4Lm1hdGNoZWQpO1xuICAgICAgICBjb25zdCBhbGxvd2VkID0gbmV3IFNldDxIVFRQTWV0aG9kcz4oKTtcbiAgICAgICAgZm9yIChjb25zdCByb3V0ZSBvZiBjdHgubWF0Y2hlZCkge1xuICAgICAgICAgIGZvciAoY29uc3QgbWV0aG9kIG9mIHJvdXRlLm1ldGhvZHMpIHtcbiAgICAgICAgICAgIGFsbG93ZWQuYWRkKG1ldGhvZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYWxsb3dlZFN0ciA9IFsuLi5hbGxvd2VkXS5qb2luKFwiLCBcIik7XG4gICAgICAgIGlmICghaW1wbGVtZW50ZWQuaW5jbHVkZXMoY3R4LnJlcXVlc3QubWV0aG9kKSkge1xuICAgICAgICAgIGlmIChvcHRpb25zLnRocm93KSB7XG4gICAgICAgICAgICB0aHJvdyBvcHRpb25zLm5vdEltcGxlbWVudGVkXG4gICAgICAgICAgICAgID8gb3B0aW9ucy5ub3RJbXBsZW1lbnRlZCgpXG4gICAgICAgICAgICAgIDogbmV3IGh0dHBFcnJvcnMuTm90SW1wbGVtZW50ZWQoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3R4LnJlc3BvbnNlLnN0YXR1cyA9IFN0YXR1cy5Ob3RJbXBsZW1lbnRlZDtcbiAgICAgICAgICAgIGN0eC5yZXNwb25zZS5oZWFkZXJzLnNldChcIkFsbG93ZWRcIiwgYWxsb3dlZFN0cik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGFsbG93ZWQuc2l6ZSkge1xuICAgICAgICAgIGlmIChjdHgucmVxdWVzdC5tZXRob2QgPT09IFwiT1BUSU9OU1wiKSB7XG4gICAgICAgICAgICBjdHgucmVzcG9uc2Uuc3RhdHVzID0gU3RhdHVzLk9LO1xuICAgICAgICAgICAgY3R4LnJlc3BvbnNlLmhlYWRlcnMuc2V0KFwiQWxsb3dlZFwiLCBhbGxvd2VkU3RyKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKCFhbGxvd2VkLmhhcyhjdHgucmVxdWVzdC5tZXRob2QpKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy50aHJvdykge1xuICAgICAgICAgICAgICB0aHJvdyBvcHRpb25zLm1ldGhvZE5vdEFsbG93ZWRcbiAgICAgICAgICAgICAgICA/IG9wdGlvbnMubWV0aG9kTm90QWxsb3dlZCgpXG4gICAgICAgICAgICAgICAgOiBuZXcgaHR0cEVycm9ycy5NZXRob2ROb3RBbGxvd2VkKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjdHgucmVzcG9uc2Uuc3RhdHVzID0gU3RhdHVzLk1ldGhvZE5vdEFsbG93ZWQ7XG4gICAgICAgICAgICAgIGN0eC5yZXNwb25zZS5oZWFkZXJzLnNldChcIkFsbG93ZWRcIiwgYWxsb3dlZFN0cik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBhbGxvd2VkTWV0aG9kcztcbiAgfVxuXG4gIC8qKiBSZWdpc3RlciBuYW1lZCBtaWRkbGV3YXJlIGZvciB0aGUgc3BlY2lmaWVkIHJvdXRlcyB3aGVuIHRoZSBgREVMRVRFYCxcbiAgICogIG1ldGhvZCBpcyByZXF1ZXN0ZWQuICovXG4gIGRlbGV0ZTxQIGV4dGVuZHMgUm91dGVQYXJhbXMgPSBSUCwgUyBleHRlbmRzIFN0YXRlID0gUlM+KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgbWlkZGxld2FyZTogUm91dGVyTWlkZGxld2FyZTxQLCBTPixcbiAgICAuLi5taWRkbGV3YXJlczogUm91dGVyTWlkZGxld2FyZTxQLCBTPltdXG4gICk6IFJvdXRlcjxQIGV4dGVuZHMgUlAgPyBQIDogKFAgJiBSUCksIFMgZXh0ZW5kcyBSUyA/IFMgOiAoUyAmIFJTKT47XG4gIC8qKiBSZWdpc3RlciBtaWRkbGV3YXJlIGZvciB0aGUgc3BlY2lmaWVkIHJvdXRlcyB3aGVuIHRoZSBgREVMRVRFYCxcbiAgICogbWV0aG9kIGlzIHJlcXVlc3RlZC4gKi9cbiAgZGVsZXRlPFAgZXh0ZW5kcyBSb3V0ZVBhcmFtcyA9IFJQLCBTIGV4dGVuZHMgU3RhdGUgPSBSUz4oXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIG1pZGRsZXdhcmU6IFJvdXRlck1pZGRsZXdhcmU8UCwgUz4sXG4gICAgLi4ubWlkZGxld2FyZXM6IFJvdXRlck1pZGRsZXdhcmU8UCwgUz5bXVxuICApOiBSb3V0ZXI8UCBleHRlbmRzIFJQID8gUCA6IChQICYgUlApLCBTIGV4dGVuZHMgUlMgPyBTIDogKFMgJiBSUyk+O1xuICBkZWxldGU8UCBleHRlbmRzIFJvdXRlUGFyYW1zID0gUlAsIFMgZXh0ZW5kcyBTdGF0ZSA9IFJTPihcbiAgICBuYW1lT3JQYXRoOiBzdHJpbmcsXG4gICAgcGF0aE9yTWlkZGxld2FyZTogc3RyaW5nIHwgUm91dGVyTWlkZGxld2FyZTxQLCBTPixcbiAgICAuLi5taWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+W11cbiAgKTogUm91dGVyPFAgZXh0ZW5kcyBSUCA/IFAgOiAoUCAmIFJQKSwgUyBleHRlbmRzIFJTID8gUyA6IChTICYgUlMpPiB7XG4gICAgdGhpcy4jdXNlVmVyYihcbiAgICAgIG5hbWVPclBhdGgsXG4gICAgICBwYXRoT3JNaWRkbGV3YXJlIGFzIChzdHJpbmcgfCBSb3V0ZXJNaWRkbGV3YXJlKSxcbiAgICAgIG1pZGRsZXdhcmUgYXMgUm91dGVyTWlkZGxld2FyZVtdLFxuICAgICAgW1wiREVMRVRFXCJdLFxuICAgICk7XG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICByZXR1cm4gdGhpcyBhcyBSb3V0ZXI8YW55LCBhbnk+O1xuICB9XG5cbiAgLyoqIEl0ZXJhdGUgb3ZlciB0aGUgcm91dGVzIGN1cnJlbnRseSBhZGRlZCB0byB0aGUgcm91dGVyLiAgVG8gYmUgY29tcGF0aWJsZVxuICAgKiB3aXRoIHRoZSBpdGVyYWJsZSBpbnRlcmZhY2VzLCBib3RoIHRoZSBrZXkgYW5kIHZhbHVlIGFyZSBzZXQgdG8gdGhlIHZhbHVlXG4gICAqIG9mIHRoZSByb3V0ZS4gKi9cbiAgKmVudHJpZXMoKTogSXRlcmFibGVJdGVyYXRvcjxbUm91dGUsIFJvdXRlXT4ge1xuICAgIGZvciAoY29uc3Qgcm91dGUgb2YgdGhpcy4jc3RhY2spIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gcm91dGUudG9KU09OKCk7XG4gICAgICB5aWVsZCBbdmFsdWUsIHZhbHVlXTtcbiAgICB9XG4gIH1cblxuICAvKiogSXRlcmF0ZSBvdmVyIHRoZSByb3V0ZXMgY3VycmVudGx5IGFkZGVkIHRvIHRoZSByb3V0ZXIsIGNhbGxpbmcgdGhlXG4gICAqIGBjYWxsYmFja2AgZnVuY3Rpb24gZm9yIGVhY2ggdmFsdWUuICovXG4gIGZvckVhY2goXG4gICAgY2FsbGJhY2s6ICh2YWx1ZTE6IFJvdXRlLCB2YWx1ZTI6IFJvdXRlLCByb3V0ZXI6IHRoaXMpID0+IHZvaWQsXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICB0aGlzQXJnOiBhbnkgPSBudWxsLFxuICApOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IHJvdXRlIG9mIHRoaXMuI3N0YWNrKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHJvdXRlLnRvSlNPTigpO1xuICAgICAgY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB2YWx1ZSwgdmFsdWUsIHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZWdpc3RlciBuYW1lZCBtaWRkbGV3YXJlIGZvciB0aGUgc3BlY2lmaWVkIHJvdXRlcyB3aGVuIHRoZSBgR0VUYCxcbiAgICogIG1ldGhvZCBpcyByZXF1ZXN0ZWQuICovXG4gIGdldDxQIGV4dGVuZHMgUm91dGVQYXJhbXMgPSBSUCwgUyBleHRlbmRzIFN0YXRlID0gUlM+KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgbWlkZGxld2FyZTogUm91dGVyTWlkZGxld2FyZTxQLCBTPixcbiAgICAuLi5taWRkbGV3YXJlczogUm91dGVyTWlkZGxld2FyZTxQLCBTPltdXG4gICk6IFJvdXRlcjxQIGV4dGVuZHMgUlAgPyBQIDogKFAgJiBSUCksIFMgZXh0ZW5kcyBSUyA/IFMgOiAoUyAmIFJTKT47XG4gIC8qKiBSZWdpc3RlciBtaWRkbGV3YXJlIGZvciB0aGUgc3BlY2lmaWVkIHJvdXRlcyB3aGVuIHRoZSBgR0VUYCxcbiAgICogbWV0aG9kIGlzIHJlcXVlc3RlZC4gKi9cbiAgZ2V0PFAgZXh0ZW5kcyBSb3V0ZVBhcmFtcyA9IFJQLCBTIGV4dGVuZHMgU3RhdGUgPSBSUz4oXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIG1pZGRsZXdhcmU6IFJvdXRlck1pZGRsZXdhcmU8UCwgUz4sXG4gICAgLi4ubWlkZGxld2FyZXM6IFJvdXRlck1pZGRsZXdhcmU8UCwgUz5bXVxuICApOiBSb3V0ZXI8UCBleHRlbmRzIFJQID8gUCA6IChQICYgUlApLCBTIGV4dGVuZHMgUlMgPyBTIDogKFMgJiBSUyk+O1xuICBnZXQ8UCBleHRlbmRzIFJvdXRlUGFyYW1zID0gUlAsIFMgZXh0ZW5kcyBTdGF0ZSA9IFJTPihcbiAgICBuYW1lT3JQYXRoOiBzdHJpbmcsXG4gICAgcGF0aE9yTWlkZGxld2FyZTogc3RyaW5nIHwgUm91dGVyTWlkZGxld2FyZTxQLCBTPixcbiAgICAuLi5taWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+W11cbiAgKTogUm91dGVyPFAgZXh0ZW5kcyBSUCA/IFAgOiAoUCAmIFJQKSwgUyBleHRlbmRzIFJTID8gUyA6IChTICYgUlMpPiB7XG4gICAgdGhpcy4jdXNlVmVyYihcbiAgICAgIG5hbWVPclBhdGgsXG4gICAgICBwYXRoT3JNaWRkbGV3YXJlIGFzIChzdHJpbmcgfCBSb3V0ZXJNaWRkbGV3YXJlKSxcbiAgICAgIG1pZGRsZXdhcmUgYXMgUm91dGVyTWlkZGxld2FyZVtdLFxuICAgICAgW1wiR0VUXCJdLFxuICAgICk7XG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICByZXR1cm4gdGhpcyBhcyBSb3V0ZXI8YW55LCBhbnk+O1xuICB9XG5cbiAgLyoqIFJlZ2lzdGVyIG5hbWVkIG1pZGRsZXdhcmUgZm9yIHRoZSBzcGVjaWZpZWQgcm91dGVzIHdoZW4gdGhlIGBIRUFEYCxcbiAgICogIG1ldGhvZCBpcyByZXF1ZXN0ZWQuICovXG4gIGhlYWQ8UCBleHRlbmRzIFJvdXRlUGFyYW1zID0gUlAsIFMgZXh0ZW5kcyBTdGF0ZSA9IFJTPihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIG1pZGRsZXdhcmU6IFJvdXRlck1pZGRsZXdhcmU8UCwgUz4sXG4gICAgLi4ubWlkZGxld2FyZXM6IFJvdXRlck1pZGRsZXdhcmU8UCwgUz5bXVxuICApOiBSb3V0ZXI8UCBleHRlbmRzIFJQID8gUCA6IChQICYgUlApLCBTIGV4dGVuZHMgUlMgPyBTIDogKFMgJiBSUyk+O1xuICAvKiogUmVnaXN0ZXIgbWlkZGxld2FyZSBmb3IgdGhlIHNwZWNpZmllZCByb3V0ZXMgd2hlbiB0aGUgYEhFQURgLFxuICAgKiBtZXRob2QgaXMgcmVxdWVzdGVkLiAqL1xuICBoZWFkPFAgZXh0ZW5kcyBSb3V0ZVBhcmFtcyA9IFJQLCBTIGV4dGVuZHMgU3RhdGUgPSBSUz4oXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIG1pZGRsZXdhcmU6IFJvdXRlck1pZGRsZXdhcmU8UCwgUz4sXG4gICAgLi4ubWlkZGxld2FyZXM6IFJvdXRlck1pZGRsZXdhcmU8UCwgUz5bXVxuICApOiBSb3V0ZXI8UCBleHRlbmRzIFJQID8gUCA6IChQICYgUlApLCBTIGV4dGVuZHMgUlMgPyBTIDogKFMgJiBSUyk+O1xuICBoZWFkPFAgZXh0ZW5kcyBSb3V0ZVBhcmFtcyA9IFJQLCBTIGV4dGVuZHMgU3RhdGUgPSBSUz4oXG4gICAgbmFtZU9yUGF0aDogc3RyaW5nLFxuICAgIHBhdGhPck1pZGRsZXdhcmU6IHN0cmluZyB8IFJvdXRlck1pZGRsZXdhcmU8UCwgUz4sXG4gICAgLi4ubWlkZGxld2FyZTogUm91dGVyTWlkZGxld2FyZTxQLCBTPltdXG4gICk6IFJvdXRlcjxQIGV4dGVuZHMgUlAgPyBQIDogKFAgJiBSUCksIFMgZXh0ZW5kcyBSUyA/IFMgOiAoUyAmIFJTKT4ge1xuICAgIHRoaXMuI3VzZVZlcmIoXG4gICAgICBuYW1lT3JQYXRoLFxuICAgICAgcGF0aE9yTWlkZGxld2FyZSBhcyAoc3RyaW5nIHwgUm91dGVyTWlkZGxld2FyZSksXG4gICAgICBtaWRkbGV3YXJlIGFzIFJvdXRlck1pZGRsZXdhcmVbXSxcbiAgICAgIFtcIkhFQURcIl0sXG4gICAgKTtcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIHJldHVybiB0aGlzIGFzIFJvdXRlcjxhbnksIGFueT47XG4gIH1cblxuICAvKiogSXRlcmF0ZSBvdmVyIHRoZSByb3V0ZXMgY3VycmVudGx5IGFkZGVkIHRvIHRoZSByb3V0ZXIuICBUbyBiZSBjb21wYXRpYmxlXG4gICAqIHdpdGggdGhlIGl0ZXJhYmxlIGludGVyZmFjZXMsIHRoZSBrZXkgaXMgc2V0IHRvIHRoZSB2YWx1ZSBvZiB0aGUgcm91dGUuICovXG4gICprZXlzKCk6IEl0ZXJhYmxlSXRlcmF0b3I8Um91dGU+IHtcbiAgICBmb3IgKGNvbnN0IHJvdXRlIG9mIHRoaXMuI3N0YWNrKSB7XG4gICAgICB5aWVsZCByb3V0ZS50b0pTT04oKTtcbiAgICB9XG4gIH1cblxuICAvKiogUmVnaXN0ZXIgbmFtZWQgbWlkZGxld2FyZSBmb3IgdGhlIHNwZWNpZmllZCByb3V0ZXMgd2hlbiB0aGUgYE9QVElPTlNgLFxuICAgKiBtZXRob2QgaXMgcmVxdWVzdGVkLiAqL1xuICBvcHRpb25zPFAgZXh0ZW5kcyBSb3V0ZVBhcmFtcyA9IFJQLCBTIGV4dGVuZHMgU3RhdGUgPSBSUz4oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBtaWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+LFxuICAgIC4uLm1pZGRsZXdhcmVzOiBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+W11cbiAgKTogUm91dGVyPFAgZXh0ZW5kcyBSUCA/IFAgOiAoUCAmIFJQKSwgUyBleHRlbmRzIFJTID8gUyA6IChTICYgUlMpPjtcbiAgLyoqIFJlZ2lzdGVyIG1pZGRsZXdhcmUgZm9yIHRoZSBzcGVjaWZpZWQgcm91dGVzIHdoZW4gdGhlIGBPUFRJT05TYCxcbiAgICogbWV0aG9kIGlzIHJlcXVlc3RlZC4gKi9cbiAgb3B0aW9uczxQIGV4dGVuZHMgUm91dGVQYXJhbXMgPSBSUCwgUyBleHRlbmRzIFN0YXRlID0gUlM+KFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBtaWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+LFxuICAgIC4uLm1pZGRsZXdhcmVzOiBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+W11cbiAgKTogUm91dGVyPFAgZXh0ZW5kcyBSUCA/IFAgOiAoUCAmIFJQKSwgUyBleHRlbmRzIFJTID8gUyA6IChTICYgUlMpPjtcbiAgb3B0aW9uczxQIGV4dGVuZHMgUm91dGVQYXJhbXMgPSBSUCwgUyBleHRlbmRzIFN0YXRlID0gUlM+KFxuICAgIG5hbWVPclBhdGg6IHN0cmluZyxcbiAgICBwYXRoT3JNaWRkbGV3YXJlOiBzdHJpbmcgfCBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+LFxuICAgIC4uLm1pZGRsZXdhcmU6IFJvdXRlck1pZGRsZXdhcmU8UCwgUz5bXVxuICApOiBSb3V0ZXI8UCBleHRlbmRzIFJQID8gUCA6IChQICYgUlApLCBTIGV4dGVuZHMgUlMgPyBTIDogKFMgJiBSUyk+IHtcbiAgICB0aGlzLiN1c2VWZXJiKFxuICAgICAgbmFtZU9yUGF0aCxcbiAgICAgIHBhdGhPck1pZGRsZXdhcmUgYXMgKHN0cmluZyB8IFJvdXRlck1pZGRsZXdhcmUpLFxuICAgICAgbWlkZGxld2FyZSBhcyBSb3V0ZXJNaWRkbGV3YXJlW10sXG4gICAgICBbXCJPUFRJT05TXCJdLFxuICAgICk7XG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICByZXR1cm4gdGhpcyBhcyBSb3V0ZXI8YW55LCBhbnk+O1xuICB9XG5cbiAgLyoqIFJlZ2lzdGVyIHBhcmFtIG1pZGRsZXdhcmUsIHdoaWNoIHdpbGwgYmUgY2FsbGVkIHdoZW4gdGhlIHBhcnRpY3VsYXIgcGFyYW1cbiAgICogaXMgcGFyc2VkIGZyb20gdGhlIHJvdXRlLiAqL1xuICBwYXJhbTxTIGV4dGVuZHMgU3RhdGUgPSBSUz4oXG4gICAgcGFyYW06IGtleW9mIFJQLFxuICAgIG1pZGRsZXdhcmU6IFJvdXRlclBhcmFtTWlkZGxld2FyZTxSUCwgUz4sXG4gICk6IFJvdXRlcjxSUCwgUz4ge1xuICAgIHRoaXMuI3BhcmFtc1twYXJhbSBhcyBzdHJpbmddID0gbWlkZGxld2FyZTtcbiAgICBmb3IgKGNvbnN0IHJvdXRlIG9mIHRoaXMuI3N0YWNrKSB7XG4gICAgICByb3V0ZS5wYXJhbShwYXJhbSBhcyBzdHJpbmcsIG1pZGRsZXdhcmUpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKiBSZWdpc3RlciBuYW1lZCBtaWRkbGV3YXJlIGZvciB0aGUgc3BlY2lmaWVkIHJvdXRlcyB3aGVuIHRoZSBgUEFUQ0hgLFxuICAgKiBtZXRob2QgaXMgcmVxdWVzdGVkLiAqL1xuICBwYXRjaDxQIGV4dGVuZHMgUm91dGVQYXJhbXMgPSBSUCwgUyBleHRlbmRzIFN0YXRlID0gUlM+KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgbWlkZGxld2FyZTogUm91dGVyTWlkZGxld2FyZTxQLCBTPixcbiAgICAuLi5taWRkbGV3YXJlczogUm91dGVyTWlkZGxld2FyZTxQLCBTPltdXG4gICk6IFJvdXRlcjxQIGV4dGVuZHMgUlAgPyBQIDogKFAgJiBSUCksIFMgZXh0ZW5kcyBSUyA/IFMgOiAoUyAmIFJTKT47XG4gIC8qKiBSZWdpc3RlciBtaWRkbGV3YXJlIGZvciB0aGUgc3BlY2lmaWVkIHJvdXRlcyB3aGVuIHRoZSBgUEFUQ0hgLFxuICAgKiBtZXRob2QgaXMgcmVxdWVzdGVkLiAqL1xuICBwYXRjaDxQIGV4dGVuZHMgUm91dGVQYXJhbXMgPSBSUCwgUyBleHRlbmRzIFN0YXRlID0gUlM+KFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBtaWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+LFxuICAgIC4uLm1pZGRsZXdhcmVzOiBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+W11cbiAgKTogUm91dGVyPFAgZXh0ZW5kcyBSUCA/IFAgOiAoUCAmIFJQKSwgUyBleHRlbmRzIFJTID8gUyA6IChTICYgUlMpPjtcbiAgcGF0Y2g8UCBleHRlbmRzIFJvdXRlUGFyYW1zID0gUlAsIFMgZXh0ZW5kcyBTdGF0ZSA9IFJTPihcbiAgICBuYW1lT3JQYXRoOiBzdHJpbmcsXG4gICAgcGF0aE9yTWlkZGxld2FyZTogc3RyaW5nIHwgUm91dGVyTWlkZGxld2FyZTxQLCBTPixcbiAgICAuLi5taWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+W11cbiAgKTogUm91dGVyPFAgZXh0ZW5kcyBSUCA/IFAgOiAoUCAmIFJQKSwgUyBleHRlbmRzIFJTID8gUyA6IChTICYgUlMpPiB7XG4gICAgdGhpcy4jdXNlVmVyYihcbiAgICAgIG5hbWVPclBhdGgsXG4gICAgICBwYXRoT3JNaWRkbGV3YXJlIGFzIChzdHJpbmcgfCBSb3V0ZXJNaWRkbGV3YXJlKSxcbiAgICAgIG1pZGRsZXdhcmUgYXMgUm91dGVyTWlkZGxld2FyZVtdLFxuICAgICAgW1wiUEFUQ0hcIl0sXG4gICAgKTtcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIHJldHVybiB0aGlzIGFzIFJvdXRlcjxhbnksIGFueT47XG4gIH1cblxuICAvKiogUmVnaXN0ZXIgbmFtZWQgbWlkZGxld2FyZSBmb3IgdGhlIHNwZWNpZmllZCByb3V0ZXMgd2hlbiB0aGUgYFBPU1RgLFxuICAgKiBtZXRob2QgaXMgcmVxdWVzdGVkLiAqL1xuICBwb3N0PFAgZXh0ZW5kcyBSb3V0ZVBhcmFtcyA9IFJQLCBTIGV4dGVuZHMgU3RhdGUgPSBSUz4oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBtaWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+LFxuICAgIC4uLm1pZGRsZXdhcmVzOiBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+W11cbiAgKTogUm91dGVyPFAgZXh0ZW5kcyBSUCA/IFAgOiAoUCAmIFJQKSwgUyBleHRlbmRzIFJTID8gUyA6IChTICYgUlMpPjtcbiAgLyoqIFJlZ2lzdGVyIG1pZGRsZXdhcmUgZm9yIHRoZSBzcGVjaWZpZWQgcm91dGVzIHdoZW4gdGhlIGBQT1NUYCxcbiAgICogbWV0aG9kIGlzIHJlcXVlc3RlZC4gKi9cbiAgcG9zdDxQIGV4dGVuZHMgUm91dGVQYXJhbXMgPSBSUCwgUyBleHRlbmRzIFN0YXRlID0gUlM+KFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBtaWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+LFxuICAgIC4uLm1pZGRsZXdhcmVzOiBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+W11cbiAgKTogUm91dGVyPFAgZXh0ZW5kcyBSUCA/IFAgOiAoUCAmIFJQKSwgUyBleHRlbmRzIFJTID8gUyA6IChTICYgUlMpPjtcbiAgcG9zdDxQIGV4dGVuZHMgUm91dGVQYXJhbXMgPSBSUCwgUyBleHRlbmRzIFN0YXRlID0gUlM+KFxuICAgIG5hbWVPclBhdGg6IHN0cmluZyxcbiAgICBwYXRoT3JNaWRkbGV3YXJlOiBzdHJpbmcgfCBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+LFxuICAgIC4uLm1pZGRsZXdhcmU6IFJvdXRlck1pZGRsZXdhcmU8UCwgUz5bXVxuICApOiBSb3V0ZXI8UCBleHRlbmRzIFJQID8gUCA6IChQICYgUlApLCBTIGV4dGVuZHMgUlMgPyBTIDogKFMgJiBSUyk+IHtcbiAgICB0aGlzLiN1c2VWZXJiKFxuICAgICAgbmFtZU9yUGF0aCxcbiAgICAgIHBhdGhPck1pZGRsZXdhcmUgYXMgKHN0cmluZyB8IFJvdXRlck1pZGRsZXdhcmUpLFxuICAgICAgbWlkZGxld2FyZSBhcyBSb3V0ZXJNaWRkbGV3YXJlW10sXG4gICAgICBbXCJQT1NUXCJdLFxuICAgICk7XG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICByZXR1cm4gdGhpcyBhcyBSb3V0ZXI8YW55LCBhbnk+O1xuICB9XG5cbiAgLyoqIFNldCB0aGUgcm91dGVyIHByZWZpeCBmb3IgdGhpcyByb3V0ZXIuICovXG4gIHByZWZpeChwcmVmaXg6IHN0cmluZyk6IHRoaXMge1xuICAgIHByZWZpeCA9IHByZWZpeC5yZXBsYWNlKC9cXC8kLywgXCJcIik7XG4gICAgdGhpcy4jb3B0cy5wcmVmaXggPSBwcmVmaXg7XG4gICAgZm9yIChjb25zdCByb3V0ZSBvZiB0aGlzLiNzdGFjaykge1xuICAgICAgcm91dGUuc2V0UHJlZml4KHByZWZpeCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqIFJlZ2lzdGVyIG5hbWVkIG1pZGRsZXdhcmUgZm9yIHRoZSBzcGVjaWZpZWQgcm91dGVzIHdoZW4gdGhlIGBQVVRgXG4gICAqIG1ldGhvZCBpcyByZXF1ZXN0ZWQuICovXG4gIHB1dDxQIGV4dGVuZHMgUm91dGVQYXJhbXMgPSBSUCwgUyBleHRlbmRzIFN0YXRlID0gUlM+KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgbWlkZGxld2FyZTogUm91dGVyTWlkZGxld2FyZTxQLCBTPixcbiAgICAuLi5taWRkbGV3YXJlczogUm91dGVyTWlkZGxld2FyZTxQLCBTPltdXG4gICk6IFJvdXRlcjxQIGV4dGVuZHMgUlAgPyBQIDogKFAgJiBSUCksIFMgZXh0ZW5kcyBSUyA/IFMgOiAoUyAmIFJTKT47XG4gIC8qKiBSZWdpc3RlciBtaWRkbGV3YXJlIGZvciB0aGUgc3BlY2lmaWVkIHJvdXRlcyB3aGVuIHRoZSBgUFVUYFxuICAgKiBtZXRob2QgaXMgcmVxdWVzdGVkLiAqL1xuICBwdXQ8UCBleHRlbmRzIFJvdXRlUGFyYW1zID0gUlAsIFMgZXh0ZW5kcyBTdGF0ZSA9IFJTPihcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgbWlkZGxld2FyZTogUm91dGVyTWlkZGxld2FyZTxQLCBTPixcbiAgICAuLi5taWRkbGV3YXJlczogUm91dGVyTWlkZGxld2FyZTxQLCBTPltdXG4gICk6IFJvdXRlcjxQIGV4dGVuZHMgUlAgPyBQIDogKFAgJiBSUCksIFMgZXh0ZW5kcyBSUyA/IFMgOiAoUyAmIFJTKT47XG4gIHB1dDxQIGV4dGVuZHMgUm91dGVQYXJhbXMgPSBSUCwgUyBleHRlbmRzIFN0YXRlID0gUlM+KFxuICAgIG5hbWVPclBhdGg6IHN0cmluZyxcbiAgICBwYXRoT3JNaWRkbGV3YXJlOiBzdHJpbmcgfCBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+LFxuICAgIC4uLm1pZGRsZXdhcmU6IFJvdXRlck1pZGRsZXdhcmU8UCwgUz5bXVxuICApOiBSb3V0ZXI8UCBleHRlbmRzIFJQID8gUCA6IChQICYgUlApLCBTIGV4dGVuZHMgUlMgPyBTIDogKFMgJiBSUyk+IHtcbiAgICB0aGlzLiN1c2VWZXJiKFxuICAgICAgbmFtZU9yUGF0aCxcbiAgICAgIHBhdGhPck1pZGRsZXdhcmUgYXMgKHN0cmluZyB8IFJvdXRlck1pZGRsZXdhcmUpLFxuICAgICAgbWlkZGxld2FyZSBhcyBSb3V0ZXJNaWRkbGV3YXJlW10sXG4gICAgICBbXCJQVVRcIl0sXG4gICAgKTtcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIHJldHVybiB0aGlzIGFzIFJvdXRlcjxhbnksIGFueT47XG4gIH1cblxuICAvKiogUmVnaXN0ZXIgYSBkaXJlY3Rpb24gbWlkZGxld2FyZSwgd2hlcmUgd2hlbiB0aGUgYHNvdXJjZWAgcGF0aCBpcyBtYXRjaGVkXG4gICAqIHRoZSByb3V0ZXIgd2lsbCByZWRpcmVjdCB0aGUgcmVxdWVzdCB0byB0aGUgYGRlc3RpbmF0aW9uYCBwYXRoLiAgQSBgc3RhdHVzYFxuICAgKiBvZiBgMzAyIEZvdW5kYCB3aWxsIGJlIHNldCBieSBkZWZhdWx0LlxuICAgKlxuICAgKiBUaGUgYHNvdXJjZWAgYW5kIGBkZXN0aW5hdGlvbmAgY2FuIGJlIG5hbWVkIHJvdXRlcy4gKi9cbiAgcmVkaXJlY3QoXG4gICAgc291cmNlOiBzdHJpbmcsXG4gICAgZGVzdGluYXRpb246IHN0cmluZyB8IFVSTCxcbiAgICBzdGF0dXM6IFJlZGlyZWN0U3RhdHVzID0gU3RhdHVzLkZvdW5kLFxuICApOiB0aGlzIHtcbiAgICBpZiAoc291cmNlWzBdICE9PSBcIi9cIikge1xuICAgICAgY29uc3QgcyA9IHRoaXMudXJsKHNvdXJjZSk7XG4gICAgICBpZiAoIXMpIHtcbiAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoYENvdWxkIG5vdCByZXNvbHZlIG5hbWVkIHJvdXRlOiBcIiR7c291cmNlfVwiYCk7XG4gICAgICB9XG4gICAgICBzb3VyY2UgPSBzO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGRlc3RpbmF0aW9uID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBpZiAoZGVzdGluYXRpb25bMF0gIT09IFwiL1wiKSB7XG4gICAgICAgIGNvbnN0IGQgPSB0aGlzLnVybChkZXN0aW5hdGlvbik7XG4gICAgICAgIGlmICghZCkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKGRlc3RpbmF0aW9uKTtcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uID0gdXJsO1xuICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoYENvdWxkIG5vdCByZXNvbHZlIG5hbWVkIHJvdXRlOiBcIiR7c291cmNlfVwiYCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlc3RpbmF0aW9uID0gZDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuYWxsKHNvdXJjZSwgYXN5bmMgKGN0eCwgbmV4dCkgPT4ge1xuICAgICAgYXdhaXQgbmV4dCgpO1xuICAgICAgY3R4LnJlc3BvbnNlLnJlZGlyZWN0KGRlc3RpbmF0aW9uKTtcbiAgICAgIGN0eC5yZXNwb25zZS5zdGF0dXMgPSBzdGF0dXM7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKiogUmV0dXJuIG1pZGRsZXdhcmUgdGhhdCB3aWxsIGRvIGFsbCB0aGUgcm91dGUgcHJvY2Vzc2luZyB0aGF0IHRoZSByb3V0ZXJcbiAgICogaGFzIGJlZW4gY29uZmlndXJlZCB0byBoYW5kbGUuICBUeXBpY2FsIHVzYWdlIHdvdWxkIGJlIHNvbWV0aGluZyBsaWtlIHRoaXM6XG4gICAqXG4gICAqIGBgYHRzXG4gICAqIGltcG9ydCB7IEFwcGxpY2F0aW9uLCBSb3V0ZXIgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9vYWsvbW9kLnRzXCI7XG4gICAqXG4gICAqIGNvbnN0IGFwcCA9IG5ldyBBcHBsaWNhdGlvbigpO1xuICAgKiBjb25zdCByb3V0ZXIgPSBuZXcgUm91dGVyKCk7XG4gICAqXG4gICAqIC8vIHJlZ2lzdGVyIHJvdXRlc1xuICAgKlxuICAgKiBhcHAudXNlKHJvdXRlci5yb3V0ZXMoKSk7XG4gICAqIGFwcC51c2Uocm91dGVyLmFsbG93ZWRNZXRob2RzKCkpO1xuICAgKiBhd2FpdCBhcHAubGlzdGVuKHsgcG9ydDogODAgfSk7XG4gICAqIGBgYFxuICAgKi9cbiAgcm91dGVzKCk6IE1pZGRsZXdhcmUge1xuICAgIGNvbnN0IGRpc3BhdGNoID0gKFxuICAgICAgY29udGV4dDogQ29udGV4dCxcbiAgICAgIG5leHQ6ICgpID0+IFByb21pc2U8dW5rbm93bj4sXG4gICAgKTogUHJvbWlzZTx1bmtub3duPiA9PiB7XG4gICAgICBjb25zdCBjdHggPSBjb250ZXh0IGFzIFJvdXRlckNvbnRleHQ7XG4gICAgICBsZXQgcGF0aG5hbWU6IHN0cmluZztcbiAgICAgIGxldCBtZXRob2Q6IEhUVFBNZXRob2RzO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgeyB1cmw6IHsgcGF0aG5hbWU6IHAgfSwgbWV0aG9kOiBtIH0gPSBjdHgucmVxdWVzdDtcbiAgICAgICAgcGF0aG5hbWUgPSBwO1xuICAgICAgICBtZXRob2QgPSBtO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZSk7XG4gICAgICB9XG4gICAgICBjb25zdCBwYXRoID0gdGhpcy4jb3B0cy5yb3V0ZXJQYXRoID8/IGN0eC5yb3V0ZXJQYXRoID8/XG4gICAgICAgIGRlY29kZVVSSUNvbXBvbmVudChwYXRobmFtZSk7XG4gICAgICBjb25zdCBtYXRjaGVzID0gdGhpcy4jbWF0Y2gocGF0aCwgbWV0aG9kKTtcblxuICAgICAgaWYgKGN0eC5tYXRjaGVkKSB7XG4gICAgICAgIGN0eC5tYXRjaGVkLnB1c2goLi4ubWF0Y2hlcy5wYXRoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGN0eC5tYXRjaGVkID0gWy4uLm1hdGNoZXMucGF0aF07XG4gICAgICB9XG5cbiAgICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgICBjdHgucm91dGVyID0gdGhpcyBhcyBSb3V0ZXI8YW55LCBhbnk+O1xuXG4gICAgICBpZiAoIW1hdGNoZXMucm91dGUpIHJldHVybiBuZXh0KCk7XG5cbiAgICAgIGNvbnN0IHsgcGF0aEFuZE1ldGhvZDogbWF0Y2hlZFJvdXRlcyB9ID0gbWF0Y2hlcztcblxuICAgICAgY29uc3QgY2hhaW4gPSBtYXRjaGVkUm91dGVzLnJlZHVjZShcbiAgICAgICAgKHByZXYsIHJvdXRlKSA9PiBbXG4gICAgICAgICAgLi4ucHJldixcbiAgICAgICAgICAoXG4gICAgICAgICAgICBjdHg6IFJvdXRlckNvbnRleHQsXG4gICAgICAgICAgICBuZXh0OiAoKSA9PiBQcm9taXNlPHVua25vd24+LFxuICAgICAgICAgICk6IFByb21pc2U8dW5rbm93bj4gPT4ge1xuICAgICAgICAgICAgY3R4LmNhcHR1cmVzID0gcm91dGUuY2FwdHVyZXMocGF0aCk7XG4gICAgICAgICAgICBjdHgucGFyYW1zID0gcm91dGUucGFyYW1zKGN0eC5jYXB0dXJlcywgY3R4LnBhcmFtcyk7XG4gICAgICAgICAgICBjdHgucm91dGVOYW1lID0gcm91dGUubmFtZTtcbiAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAuLi5yb3V0ZS5zdGFjayxcbiAgICAgICAgXSxcbiAgICAgICAgW10gYXMgUm91dGVyTWlkZGxld2FyZVtdLFxuICAgICAgKTtcbiAgICAgIHJldHVybiBjb21wb3NlKGNoYWluKShjdHgsIG5leHQpO1xuICAgIH07XG4gICAgZGlzcGF0Y2gucm91dGVyID0gdGhpcztcbiAgICByZXR1cm4gZGlzcGF0Y2g7XG4gIH1cblxuICAvKiogR2VuZXJhdGUgYSBVUkwgcGF0aG5hbWUgZm9yIGEgbmFtZWQgcm91dGUsIGludGVycG9sYXRpbmcgdGhlIG9wdGlvbmFsXG4gICAqIHBhcmFtcyBwcm92aWRlZC4gIEFsc28gYWNjZXB0cyBhbiBvcHRpb25hbCBzZXQgb2Ygb3B0aW9ucy4gKi9cbiAgdXJsPFAgZXh0ZW5kcyBSb3V0ZVBhcmFtcyA9IFJQPihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgcGFyYW1zPzogUCxcbiAgICBvcHRpb25zPzogVXJsT3B0aW9ucyxcbiAgKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCByb3V0ZSA9IHRoaXMuI3JvdXRlKG5hbWUpO1xuXG4gICAgaWYgKHJvdXRlKSB7XG4gICAgICByZXR1cm4gcm91dGUudXJsKHBhcmFtcywgb3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgLyoqIFJlZ2lzdGVyIG1pZGRsZXdhcmUgdG8gYmUgdXNlZCBvbiBldmVyeSBtYXRjaGVkIHJvdXRlLiAqL1xuICB1c2U8UCBleHRlbmRzIFJvdXRlUGFyYW1zID0gUlAsIFMgZXh0ZW5kcyBTdGF0ZSA9IFJTPihcbiAgICBtaWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+LFxuICAgIC4uLm1pZGRsZXdhcmVzOiBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+W11cbiAgKTogUm91dGVyPFAgZXh0ZW5kcyBSUCA/IFAgOiAoUCAmIFJQKSwgUyBleHRlbmRzIFJTID8gUyA6IChTICYgUlMpPjtcbiAgLyoqIFJlZ2lzdGVyIG1pZGRsZXdhcmUgdG8gYmUgdXNlZCBvbiBldmVyeSByb3V0ZSB0aGF0IG1hdGNoZXMgdGhlIHN1cHBsaWVkXG4gICAqIGBwYXRoYC4gKi9cbiAgdXNlPFAgZXh0ZW5kcyBSb3V0ZVBhcmFtcyA9IFJQLCBTIGV4dGVuZHMgU3RhdGUgPSBSUz4oXG4gICAgcGF0aDogc3RyaW5nIHwgc3RyaW5nW10sXG4gICAgbWlkZGxld2FyZTogUm91dGVyTWlkZGxld2FyZTxQLCBTPixcbiAgICAuLi5taWRkbGV3YXJlczogUm91dGVyTWlkZGxld2FyZTxQLCBTPltdXG4gICk6IFJvdXRlcjxQIGV4dGVuZHMgUlAgPyBQIDogKFAgJiBSUCksIFMgZXh0ZW5kcyBSUyA/IFMgOiAoUyAmIFJTKT47XG4gIHVzZTxQIGV4dGVuZHMgUm91dGVQYXJhbXMgPSBSUCwgUyBleHRlbmRzIFN0YXRlID0gUlM+KFxuICAgIHBhdGhPck1pZGRsZXdhcmU6IHN0cmluZyB8IHN0cmluZ1tdIHwgUm91dGVyTWlkZGxld2FyZTxQLCBTPixcbiAgICAuLi5taWRkbGV3YXJlOiBSb3V0ZXJNaWRkbGV3YXJlPFAsIFM+W11cbiAgKTogUm91dGVyPFAgZXh0ZW5kcyBSUCA/IFAgOiAoUCAmIFJQKSwgUyBleHRlbmRzIFJTID8gUyA6IChTICYgUlMpPiB7XG4gICAgbGV0IHBhdGg6IHN0cmluZyB8IHN0cmluZ1tdIHwgdW5kZWZpbmVkO1xuICAgIGlmIChcbiAgICAgIHR5cGVvZiBwYXRoT3JNaWRkbGV3YXJlID09PSBcInN0cmluZ1wiIHx8IEFycmF5LmlzQXJyYXkocGF0aE9yTWlkZGxld2FyZSlcbiAgICApIHtcbiAgICAgIHBhdGggPSBwYXRoT3JNaWRkbGV3YXJlO1xuICAgIH0gZWxzZSB7XG4gICAgICBtaWRkbGV3YXJlLnVuc2hpZnQocGF0aE9yTWlkZGxld2FyZSk7XG4gICAgfVxuXG4gICAgdGhpcy4jcmVnaXN0ZXIoXG4gICAgICBwYXRoID8/IFwiKC4qKVwiLFxuICAgICAgbWlkZGxld2FyZSBhcyBSb3V0ZXJNaWRkbGV3YXJlW10sXG4gICAgICBbXSxcbiAgICAgIHsgZW5kOiBmYWxzZSwgaWdub3JlQ2FwdHVyZXM6ICFwYXRoLCBpZ25vcmVQcmVmaXg6ICFwYXRoIH0sXG4gICAgKTtcblxuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgcmV0dXJuIHRoaXMgYXMgUm91dGVyPGFueSwgYW55PjtcbiAgfVxuXG4gIC8qKiBJdGVyYXRlIG92ZXIgdGhlIHJvdXRlcyBjdXJyZW50bHkgYWRkZWQgdG8gdGhlIHJvdXRlci4gKi9cbiAgKnZhbHVlcygpOiBJdGVyYWJsZUl0ZXJhdG9yPFJvdXRlPFJQLCBSUz4+IHtcbiAgICBmb3IgKGNvbnN0IHJvdXRlIG9mIHRoaXMuI3N0YWNrKSB7XG4gICAgICB5aWVsZCByb3V0ZS50b0pTT04oKTtcbiAgICB9XG4gIH1cblxuICAvKiogUHJvdmlkZSBhbiBpdGVyYXRvciBpbnRlcmZhY2UgdGhhdCBpdGVyYXRlcyBvdmVyIHRoZSByb3V0ZXMgcmVnaXN0ZXJlZFxuICAgKiB3aXRoIHRoZSByb3V0ZXIuICovXG4gICpbU3ltYm9sLml0ZXJhdG9yXSgpOiBJdGVyYWJsZUl0ZXJhdG9yPFJvdXRlPFJQLCBSUz4+IHtcbiAgICBmb3IgKGNvbnN0IHJvdXRlIG9mIHRoaXMuI3N0YWNrKSB7XG4gICAgICB5aWVsZCByb3V0ZS50b0pTT04oKTtcbiAgICB9XG4gIH1cblxuICAvKiogR2VuZXJhdGUgYSBVUkwgcGF0aG5hbWUgYmFzZWQgb24gdGhlIHByb3ZpZGVkIHBhdGgsIGludGVycG9sYXRpbmcgdGhlXG4gICAqIG9wdGlvbmFsIHBhcmFtcyBwcm92aWRlZC4gIEFsc28gYWNjZXB0cyBhbiBvcHRpb25hbCBzZXQgb2Ygb3B0aW9ucy4gKi9cbiAgc3RhdGljIHVybChcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgcGFyYW1zPzogUm91dGVQYXJhbXMsXG4gICAgb3B0aW9ucz86IFVybE9wdGlvbnMsXG4gICk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRvVXJsKHBhdGgsIHBhcmFtcywgb3B0aW9ucyk7XG4gIH1cblxuICBbU3ltYm9sLmZvcihcIkRlbm8uY3VzdG9tSW5zcGVjdFwiKV0oaW5zcGVjdDogKHZhbHVlOiB1bmtub3duKSA9PiBzdHJpbmcpIHtcbiAgICByZXR1cm4gYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfSAke1xuICAgICAgaW5zcGVjdCh7IFwiI3BhcmFtc1wiOiB0aGlzLiNwYXJhbXMsIFwiI3N0YWNrXCI6IHRoaXMuI3N0YWNrIH0pXG4gICAgfWA7XG4gIH1cbn1cbiJdfQ==