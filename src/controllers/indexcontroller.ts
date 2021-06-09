import {ServerRequest} from 'https://deno.land/std@0.97.0/http/server.ts';
import {Status} from 'https://deno.land/std@0.97.0/http/http_status.ts';
import {jsonResponse} from '../lib/quickResponses.ts';

export const home: (req: ServerRequest) => Promise<void> = 
    (req) => jsonResponse(req, Status.OK, {});