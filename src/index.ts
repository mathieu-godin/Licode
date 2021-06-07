import {ServerRequest} from 'https://deno.land/std@0.97.0/http/server.ts';
import {Status} from 'https://deno.land/std@0.97.0/http/http_status.ts';

export const home: (req: ServerRequest) => void = 
    (req) => req.respond({status: Status.OK, body: 'Welcome to LiCode'});