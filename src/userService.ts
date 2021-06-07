import {ServerRequest} from 'https://deno.land/std@0.97.0/http/server.ts';
import {Status} from 'https://deno.land/std@0.97.0/http/http_status.ts';

export const login: (req: ServerRequest, id: any) => void = 
    (req, id) => req.respond({status: Status.OK, body: `User ${id} logged in.`});

export const signup: (req: ServerRequest, id: any) => void = 
    (req, id) => req.respond({status: Status.OK, body: `Please enter your information below. *required`});