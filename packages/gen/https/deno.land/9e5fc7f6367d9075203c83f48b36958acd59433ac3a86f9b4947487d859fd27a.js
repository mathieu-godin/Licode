import { isRouterContext } from "../util.ts";
const FORWARDED_RE = /^(,[ \\t]*)*([!#$%&'*+.^_`|~0-9A-Za-z-]+=([!#$%&'*+.^_`|~0-9A-Za-z-]+|\"([\\t \\x21\\x23-\\x5B\\x5D-\\x7E\\x80-\\xFF]|\\\\[\\t \\x21-\\x7E\\x80-\\xFF])*\"))?(;([!#$%&'*+.^_`|~0-9A-Za-z-]+=([!#$%&'*+.^_`|~0-9A-Za-z-]+|\"([\\t \\x21\\x23-\\x5B\\x5D-\\x7E\\x80-\\xFF]|\\\\[\\t \\x21-\\x7E\\x80-\\xFF])*\"))?)*([ \\t]*,([ \\t]*([!#$%&'*+.^_`|~0-9A-Za-z-]+=([!#$%&'*+.^_`|~0-9A-Za-z-]+|\"([\\t \\x21\\x23-\\x5B\\x5D-\\x7E\\x80-\\xFF]|\\\\[\\t \\x21-\\x7E\\x80-\\xFF])*\"))?(;([!#$%&'*+.^_`|~0-9A-Za-z-]+=([!#$%&'*+.^_`|~0-9A-Za-z-]+|\"([\\t \\x21\\x23-\\x5B\\x5D-\\x7E\\x80-\\xFF]|\\\\[\\t \\x21-\\x7E\\x80-\\xFF])*\"))?)*)?)*$/g;
function createMatcher({ match }) {
    return function matches(ctx) {
        if (!match) {
            return true;
        }
        if (typeof match === "string") {
            return ctx.request.url.pathname.startsWith(match);
        }
        if (match instanceof RegExp) {
            return match.test(ctx.request.url.pathname);
        }
        return match(ctx);
    };
}
async function createRequest(target, ctx, { headers: optHeaders, map, proxyHeaders = true, request: reqFn }) {
    let path = ctx.request.url.pathname;
    let params;
    if (isRouterContext(ctx)) {
        params = ctx.params;
    }
    if (map && typeof map === "function") {
        path = map(path, params);
    }
    else if (map) {
        path = map[path] ?? path;
    }
    const url = new URL(String(target));
    if (url.pathname.endsWith("/") && path.startsWith("/")) {
        url.pathname = `${url.pathname}${path.slice(1)}`;
    }
    else if (!url.pathname.endsWith("/") && !path.startsWith("/")) {
        url.pathname = `${url.pathname}/${path}`;
    }
    else {
        url.pathname = `${url.pathname}${path}`;
    }
    url.search = ctx.request.url.search;
    const body = getBodyInit(ctx);
    const headers = new Headers(ctx.request.headers);
    if (optHeaders) {
        if (typeof optHeaders === "function") {
            optHeaders = await optHeaders(ctx);
        }
        for (const [key, value] of iterableHeaders(optHeaders)) {
            headers.set(key, value);
        }
    }
    if (proxyHeaders) {
        const maybeForwarded = headers.get("forwarded");
        const ip = ctx.request.ip.startsWith("[")
            ? `"${ctx.request.ip}"`
            : ctx.request.ip;
        const host = headers.get("host");
        if (maybeForwarded && FORWARDED_RE.test(maybeForwarded)) {
            let value = `for=${ip}`;
            if (host) {
                value += `;host=${host}`;
            }
            headers.append("forwarded", value);
        }
        else {
            headers.append("x-forwarded-for", ip);
            if (host) {
                headers.append("x-forwarded-host", host);
            }
        }
    }
    const init = {
        body,
        headers,
        method: ctx.request.method,
        redirect: "follow",
    };
    let request = new Request(url.toString(), init);
    if (reqFn) {
        request = await reqFn(request);
    }
    return request;
}
function getBodyInit(ctx) {
    if (!ctx.request.hasBody) {
        return null;
    }
    return ctx.request.body({ type: "stream" }).value;
}
function iterableHeaders(headers) {
    if (headers instanceof Headers) {
        return headers.entries();
    }
    else if (Array.isArray(headers)) {
        return headers.values();
    }
    else {
        return Object.entries(headers).values();
    }
}
async function processResponse(response, ctx, { contentType: contentTypeFn, response: resFn }) {
    if (resFn) {
        response = await resFn(response);
    }
    if (response.body) {
        ctx.response.body = response.body;
    }
    else {
        ctx.response.body = null;
    }
    ctx.response.status = response.status;
    for (const [key, value] of response.headers) {
        ctx.response.headers.append(key, value);
    }
    if (contentTypeFn) {
        const value = await contentTypeFn(response.url, ctx.response.headers.get("content-type") ?? undefined);
        if (value != null) {
            ctx.response.headers.set("content-type", value);
        }
    }
}
export function proxy(target, options = {}) {
    const matches = createMatcher(options);
    return async function proxy(ctx, next) {
        if (!matches(ctx)) {
            return next();
        }
        const request = await createRequest(target, ctx, options);
        const { fetch = globalThis.fetch } = options;
        const response = await fetch(request);
        await processResponse(response, ctx, options);
        return next();
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJveHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwcm94eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFVQSxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBd0U3QyxNQUFNLFlBQVksR0FDaEIsaW5CQUFpbkIsQ0FBQztBQUVwbkIsU0FBUyxhQUFhLENBQ3BCLEVBQUUsS0FBSyxFQUFzQjtJQUU3QixPQUFPLFNBQVMsT0FBTyxDQUFDLEdBQXdCO1FBQzlDLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDVixPQUFPLElBQUksQ0FBQztTQUNiO1FBQ0QsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7WUFDN0IsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ25EO1FBQ0QsSUFBSSxLQUFLLFlBQVksTUFBTSxFQUFFO1lBQzNCLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUM3QztRQUNELE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3BCLENBQUMsQ0FBQztBQUNKLENBQUM7QUFFRCxLQUFLLFVBQVUsYUFBYSxDQUMxQixNQUFvQixFQUNwQixHQUFxQyxFQUNyQyxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLFlBQVksR0FBRyxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFDM0M7SUFFcEIsSUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO0lBQ3BDLElBQUksTUFBcUIsQ0FBQztJQUMxQixJQUFJLGVBQWUsQ0FBTyxHQUFHLENBQUMsRUFBRTtRQUM5QixNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztLQUNyQjtJQUNELElBQUksR0FBRyxJQUFJLE9BQU8sR0FBRyxL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