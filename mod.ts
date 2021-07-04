import { Application, Router } from 'https://deno.land/x/oak/mod.ts';
const env = Deno.env.toObject();
const app = new Application();
const router = new Router();

router.get('/', (ctx) => {
    ctx.response.body = 'Hello World';
});

const port: number = +env.LICODE_PORT || 3000;
app.use(router.routes());
app.use(router.allowedMethods());
console.log('Running on port', port);
await app.listen({ port });