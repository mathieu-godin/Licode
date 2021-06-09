import {ServerRequest, Response} from 'https://deno.land/std@0.97.0/http/server.ts';
import {Status} from 'https://deno.land/std@0.97.0/http/http_status.ts';

export const jsonResponse: (req: ServerRequest, status: Status, jsonObj: object) => Promise<void> =
    (req, status, jsonObj) => {
        const retJson = JSON.stringify(jsonObj);
        var headers = new Headers();
        headers.append("content-type", "application/json; charset=UTF-8");
        return req.respond({
            status: status,
            headers: headers,
            body: retJson
        });
    };