import {serve} from 'https://deno.land/std@0.97.0/http/server.ts';

import { home } from './controllers/indexcontroller.ts';
import { loginGET, loginPOST, signupGET, signupPOST } from './controllers/usercontroller.ts';
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
    route: '/user/login',
    handler: loginGET,
  },
  {
    method: HttpMethod.POST,
    route: '/user/login',
    handler: loginPOST,
  },
  {
    method: HttpMethod.GET,
    route: '/user/signup',
    handler: signupGET,
  },
  {
    method: HttpMethod.POST,
    route: '/user/signup',
    handler: signupPOST,
  },
];

for await (const req of s) {
  matchRequestToRouteHandler(routes, req);
}