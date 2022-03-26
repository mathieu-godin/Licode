import {
    Application,
    Router,
    RouterContext,
    Status,
    send,
} from "https://deno.land/x/oak/mod.ts";
const env = Deno.env.toObject();
const app = new Application();
const router = new Router();

interface HelloWorld {
    text: string;
}

interface User {
    email: { value: string };
    username: { value: string };
    password: { value: string };
}

let helloWorldVar: HelloWorld = { text: 'Hello World' };

let userVar: User;

const port: number = +env.LICODE_PORT || 3000;
app.addEventListener("error", (evt) => {
    console.log(evt.error);
});
router
    .get("/api/hello-world", (context) => {
        try {
        context.response.body = helloWorldVar;
        } catch (err) {
            console.log(err);
        }
    })
    .post("/api/post-hello-world", async (context: RouterContext<"/api/post-hello-world">) => {
        if (!context.request.hasBody) {
            context.throw(Status.BadRequest, "Bad Request");
        }
        const body = context.request.body();
        let helloWorld: Partial<HelloWorld> | undefined;
        if (body.type === "json") {
            helloWorld = await body.value;
        } else if (body.type === "form") {
            helloWorld = {};
            for (const [key, value] of await body.value) {
                helloWorld[key as keyof HelloWorld] = value;
            }
        } else if (body.type === "form-data") {
            const formData = await body.value.read();
            helloWorld = formData.fields;
        }
        if (helloWorld) {
            context.assert(typeof helloWorld.text === "string", Status.BadRequest);
            helloWorldVar = helloWorld as HelloWorld;
            context.response.status = Status.OK;
            context.response.body = helloWorld;
            context.response.type = "json";
            return;
        }
        context.throw(Status.BadRequest, "Bad Request");
    })
    .post("/api/register", async (context: RouterContext<"/api/register">) => {
        if (!context.request.hasBody) {
            context.throw(Status.BadRequest, "Bad Request");
        }
        const body = context.request.body();
        let user: Partial<User> | undefined;
        if (body.type === "json") {
            user = await body.value;
        }
        if (user) {
            context.assert(
                typeof user?.email?.value === "string"
                && typeof user?.username?.value === "string"
                && typeof user?.password?.value === "string", Status.BadRequest);
            userVar = user as User;
            context.response.status = Status.OK;
            context.response.body = user;
            context.response.type = "json";
            return;
        }
        context.throw(Status.BadRequest, "Bad Request");
    })
    .post("/api/login", async (context: RouterContext<"/api/login">) => {
        if (!context.request.hasBody) {
            context.throw(Status.BadRequest, "Bad Request");
        }
        const body = context.request.body();
        let user: Partial<User> | undefined;
        if (body.type === "json") {
            user = await body.value;
        }
        if (user) {
            context.assert(
                typeof user?.email?.value === "string"
                && typeof user?.username?.value === "string"
                && typeof user?.password?.value === "string", Status.BadRequest);
            context.response.status = Status.OK;
            if (user?.email?.value === userVar?.username?.value
                || user?.email?.value === userVar?.email?.value) {
                if (user?.password?.value === userVar?.password?.value) {
                    context.response.body = user;
                } else {
                    context.response.body = { text: 'Wrong Password' };
                }
            } else {
                context.response.body = { text: 'Given Email or Username Does Not Exist' };
            }
            context.response.type = "json";
            return;
        }
        context.throw(Status.BadRequest, "Bad Request");
    });
app.use(router.routes());
app.use(router.allowedMethods());
app.use(async (context) => {
    if (!context.request.url.pathname.endsWith('.js')
        && !context.request.url.pathname.endsWith('.png')
        && !context.request.url.pathname.endsWith('.ico')) {
        context.request.url.pathname = '/';
    }
    await context.send({
        root: `${Deno.cwd()}/react-app/build`,
        index: "index.html",
    });
});
console.log("Running on port", port);
await app.listen({ port });
