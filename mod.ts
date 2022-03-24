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

interface User {
    id: number;
    email: string;
    username: string;
    password: string;
}

const port: number = +env.LICODE_PORT || 3000;
app.addEventListener("error", (evt) => {
    console.log(evt.error);
});
router.get("/api/hello-world", (context) => {
    context.response.body = "Hello World";
});
router.post("/api/users", async (context: RouterContext) => {
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
            user.email &&
                typeof user.email === "string" &&
                user.username &&
                typeof user.username === "string" &&
                user.password &&
                typeof user.password === "string",
            Status.BadRequest
        );
        // Save the book in the DB
        context.response.status = Status.OK;
        context.response.body = user;
        context.response.type = "json";
        return;
    }
    context.throw(Status.BadRequest, "Bad Request");
});
app.use(router.routes());
app.use(router.allowedMethods());
app.use(async (context) => {
    await send(context, "/", {
        root: `${Deno.cwd()}/react-app/build`,
        index: "index.html",
    });
});
console.log("Running on port", port);
await app.listen({ port });
