import {ServerRequest, Response} from 'https://deno.land/std@0.97.0/http/server.ts';
import {Status} from 'https://deno.land/std@0.97.0/http/http_status.ts';
import {readAll} from 'https://deno.land/std@0.97.0/io/util.ts';
import {jsonResponse} from '../lib/quickResponses.ts';

export const loginGET: (req: ServerRequest) => Promise<void> = 
    (req) => jsonResponse(req, Status.OK, {});

export const loginPOST: (req: ServerRequest) => Promise<void> = 
    async (req) => {
        const bodyJson = JSON.parse(new TextDecoder()
            .decode(await readAll(req.body))) as {userNameOrEmail: string, password: string};

        return jsonResponse(req, Status.OK, {
            userNameOrEmail: bodyJson.userNameOrEmail,
            password: bodyJson.password
        });
    };

export const signupGET: (req: ServerRequest) => Promise<void> = 
    (req) => jsonResponse(req, Status.OK, {});

export const signupPOST: (req: ServerRequest) => Promise<void> = 
    async (req) => {
        const bodyJson = JSON.parse(new TextDecoder()
            .decode(await readAll(req.body))) as {userName: string, email: string, password: string, repeatedPassword: string};

        return jsonResponse(req, Status.OK, {
            userName: bodyJson.userName,
            email: bodyJson.email,
            password: bodyJson.password,
            repeatedPassword: bodyJson.repeatedPassword
        });
    };