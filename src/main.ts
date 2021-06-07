import {serve} from 'https://deno.land/std@0.97.0/http/server.ts';

import { home } from './controllers/indexcontroller.ts';
import { login, signup } from './controllers/usercontroller.ts';
import { Route, HttpMethod, matchRequestToRouteHandler } from './lib/server.ts';


const HOST = "0.0.0.0";
const PORT = 8080;

const s = serve({hostname: HOST, port: PORT});
console.log(`Server running on ${HOST}:${PORT}`);

const routes: Route[] = [
  {
    method: HttpMethod.GET,
    route: '/',
    handler: home,
  },
  {
    method: HttpMethod.GET,
    route: '/login/:id',
    handler: login,
  },
  {
    method: HttpMethod.GET,
    route: '/signup/:id',
    handler: signup,
  },
];

for await (const req of s) {
  matchRequestToRouteHandler(routes, req);
}