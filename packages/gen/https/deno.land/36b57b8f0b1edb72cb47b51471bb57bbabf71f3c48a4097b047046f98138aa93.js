import { Status } from "./deps.ts";
import { createHttpError } from "./httpError.ts";
export function createMockApp(state = {}) {
    const app = {
        state,
        use() {
            return app;
        },
        [Symbol.for("Deno.customInspect")]() {
            return `MockApplication {}`;
        },
    };
    return app;
}
export const mockContextState = {
    encodingsAccepted: "identity",
};
export function createMockContext({ app, ip = "127.0.0.1", method = "GET", params, path = "/", state, } = {}) {
    if (!app) {
        app = createMockApp(state);
    }
    let body;
    let status = Status.OK;
    const headers = new Headers();
    const resources = [];
    return {
        app,
        params,
        request: {
            acceptsEncodings() {
                return mockContextState.encodingsAccepted;
            },
            headers: new Headers(),
            ip,
            method,
            path,
            search: undefined,
            searchParams: new URLSearchParams(),
            url: new URL(path, "http://localhost/"),
        },
        response: {
            get status() {
                return status;
            },
            set status(value) {
                status = value;
            },
            get body() {
                return body;
            },
            set body(value) {
                body = value;
            },
            addResource(rid) {
                resources.push(rid);
            },
            destroy() {
                body = undefined;
                for (const rid of resources) {
                    Deno.close(rid);
                }
            },
            redirect(url) {
                headers.set("Location", encodeURI(String(url)));
            },
            headers,
            toDomResponse() {
                return Promise.resolve(new Response(body, { status, headers }));
            },
            toServerResponse() {
                return Promise.resolve({
                    status,
                    body,
                    headers,
                });
            },
        },
        state: Object.assign({}, app.state),
        assert(condition, errorStatus = 500, message, props) {
            if (condition) {
                return;
            }
            const err = createHttpError(errorStatus, message);
            if (props) {
                Object.assign(err, props);
            }
            throw err;
        },
        throw(errorStatus, message, props) {
            const err = createHttpError(errorStatus, message);
            if (props) {
                Object.assign(err, props);
            }
            throw err;
        },
        [Symbol.for("Deno.customInspect")]() {
            return `MockContext {}`;
        },
    };
}
export function createMockNext() {
    return async function next() { };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRlc3RpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBUUEsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUNuQyxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFLakQsTUFBTSxVQUFVLGFBQWEsQ0FHM0IsUUFBUSxFQUFPO0lBRWYsTUFBTSxHQUFHLEdBQUc7UUFDVixLQUFLO1FBQ0wsR0FBRztZQUNELE9BQU8sR0FBRyxDQUFDO1FBQ2IsQ0FBQztRQUNELENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQ2hDLE9BQU8sb0JBQW9CLENBQUM7UUFDOUIsQ0FBQztLQUNLLENBQUM7SUFDVCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFnQkQsTUFBTSxDQUFDLE1BQU0sZ0JBQWdCLEdBQUc7SUFHOUIsaUJBQWlCLEVBQUUsVUFBVTtDQUM5QixDQUFDO0FBR0YsTUFBTSxVQUFVLGlCQUFpQixDQUkvQixFQUNFLEdBQUcsRUFDSCxFQUFFLEdBQUcsV0FBVyxFQUNoQixNQUFNLEdBQUcsS0FBSyxFQUNkLE1BQU0sRUFDTixJQUFJLEdBQUcsR0FBRyxFQUNWLEtBQUssTUFDaUIsRUFBRTtJQUUxQixJQUFJLENBQUMsR0FBRyxFQUFFO1FBQ1IsR0FBRyxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUM1QjtJQUNELElBQUksSUFBUyxDQUFDO0lBQ2QsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQztJQUN2QixNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0lBQzlCLE1BQU0sU0FBUyxHQUFhLEVBQUUsQ0FBQztJQUMvQixPQUFRO1FBQ04sR0FBRztRQUNILE1BQU07UUFDTixPQUFPLEVBQUU7WUFDUCxnQkFBZ0I7Z0JBQ2QsT0FBTyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FB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