import { Application, Router, send } from 'https://deno.land/x/oak/mod.ts';
const env = Deno.env.toObject();
const app = new Application();
const router = new Router();

/*router.get('/', (ctx) => {
    ctx.response.body = 'Hello World'
});*/

const port: number = +env.LICODE_PORT || 3000;
app.addEventListener("error", (evt) => {
    // Will log the thrown error to the console.
    console.log(evt.error);
  });
app.use(async (context) => {
    await send(context, context.request.url.pathname, {
        root: `${Deno.cwd()}/react-app/build`,
        index: "index.html",
    });
});
//app.use(router.routes());
app.use(router.allowedMethods());
console.log('Running on port', port);
await app.listen({ port });