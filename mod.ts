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
