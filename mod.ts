import {
    Application,
    Router,
    RouterContext,
    Status,
    send,
} from "https://deno.land/x/oak/mod.ts";
import { Client } from "https://deno.land/x/postgres@v0.15.0/mod.ts";
import { crypto } from "https://deno.land/std@0.132.0/crypto/mod.ts";
import { nanoid } from 'https://deno.land/x/nanoid@v3.0.0/async.ts'
const client = new Client({
    user: "licode",
    database: "licode",
    password: "edocil",
    hostname: "localhost",
    port: 5432,
    tls: {
        enabled: false,
        enforce: false,
    },
});
const env = Deno.env.toObject();
const app = new Application();
const router = new Router();

interface HelloWorld {
    text: string;
}

interface User {
    email: { value: string };
    username: { value: string };
    password: { value: string };
}

interface CodeSubmission {
    value: string;
}

interface TestCasesPassed {
    testCasesPassed: boolean[];
}

interface TestResult {
    testName: string,
    passed: boolean
}

let helloWorldVar: HelloWorld = { text: 'Hello World' };

let sids: { [name: string]: string } = {};

const port: number = +env.LICODE_PORT || 3000;
app.addEventListener("error", (evt) => {
    console.log(evt.error);
});
router
    .get("/api/hello-world", (context) => {
        try {
        context.response.body = helloWorldVar;
        } catch (err) {
            console.log(err);
        }
    })
    .post("/api/post-hello-world", async (context: RouterContext<any>) => {
        if (!context.request.hasBody) {
            context.throw(Status.BadRequest, "Bad Request");
        }
        const body = context.request.body();
        let helloWorld: Partial<HelloWorld> | undefined;
        if (body.type === "json") {
            helloWorld = await body.value;
        } else if (body.type === "form") {
            helloWorld = {};
            for (const [key, value] of await body.value) {
                helloWorld[key as keyof HelloWorld] = value;
            }
        } else if (body.type === "form-data") {
            const formData = await body.value.read();
            helloWorld = formData.fields;
        }
        if (helloWorld) {
            context.assert(typeof helloWorld.text === "string", Status.BadRequest);
            helloWorldVar = helloWorld as HelloWorld;
            context.response.status = Status.OK;
            context.response.body = helloWorld;
            context.response.type = "json";
            return;
        }
        context.throw(Status.BadRequest, "Bad Request");
    })
    .post("/api/register", async (context: RouterContext<any>) => {
        let sid = await context.cookies.get('sid');
        if (!sid) {
            sid = await nanoid(40);
            context.cookies.set('sid', sid);
        }
        try {
            if (!context.request.hasBody) {
                context.throw(Status.BadRequest, "Bad Request");
            }
            const body = context.request.body();
            let user: Partial<User> | undefined;
            if (body.type === "json") {
                user = await body.value;
            }
            if (user) {
                context.assert(
                    typeof user?.email?.value === "string"
                    && typeof user?.username?.value === "string"
                    && typeof user?.password?.value === "string", Status.BadRequest);
                context.response.status = Status.OK;
                await client.connect();
                const usernameResult = await client.queryArray("select username from users where username='"
                    + user?.username?.value + "'");
                if (usernameResult.rows.length < 1) {
                    const emailResult = await client.queryArray("select email from users where email='"
                        + user?.email?.value + "'");
                    if (emailResult.rows.length < 1) {
                        let saltHexString = '';
                        for (let i = 0; i < 32; ++i) {
                            saltHexString += Math.floor(Math.random() * Math.pow(2, 32)).toString(16);
                        }
                        let saltHexStringLength = saltHexString.length;
                        for (let i = 0; i < 256 - saltHexStringLength; ++i) {
                            saltHexString = "0" + saltHexString;
                        }
                        let textEncoder = new TextEncoder();
                        let hashedPasswordUint8Array = new Uint8Array(await crypto.subtle.digest('SHA3-512',
                            textEncoder.encode(user?.password?.value + saltHexString)));
                        let hashedPasswordHexString = '';
                        for (let i = 0; i < hashedPasswordUint8Array.length; ++i) {
                            hashedPasswordHexString += (hashedPasswordUint8Array[i] < 16 ? "0" : "")
                                + hashedPasswordUint8Array[i].toString(16);
                        }
                        let hashedPasswordHexStringLength = hashedPasswordHexString.length;
                        for (let i = 0; i < 128 - hashedPasswordHexStringLength; ++i) {
                            hashedPasswordHexString = "0" + hashedPasswordHexString;
                        }
                        await client.queryArray(
                            "insert into public.users(email, username, hashed_password, salt, num_wins, num_losses, created_at, updated_at)"
                            + " values ('" + user?.email?.value + "', '" + user?.username?.value + "', '"
                            + "\\x" + hashedPasswordHexString + "', '" + "\\x" + saltHexString + "', '0', '0', now(), now())");
                        let sid = await nanoid(40);
                        sids[sid] = user.username.value;
                        await context.cookies.set('sid', sid);
                        context.response.body = user;
                    } else {
                        context.response.body = { text: 'Given Email Already Exists' };
                    }
                } else {
                    context.response.body = { text: 'Given Username Already Exists' };
                }
                await client.end();
                context.response.type = "json";
                return;
            }
            context.throw(Status.BadRequest, "Bad Request");
        } catch (err) {
            console.log(err);
        }
    })
    .post("/api/login", async (context: RouterContext<any>) => {
        try {
            if (!context.request.hasBody) {
                context.throw(Status.BadRequest, "Bad Request");
            }
            const body = context.request.body();
            let user: Partial<User> | undefined;
            if (body.type === "json") {
                user = await body.value;
            }
            if (user) {
                context.assert(
                    typeof user?.email?.value === "string"
                    && typeof user?.password?.value === "string", Status.BadRequest);
                context.response.status = Status.OK;
                await client.connect();
                const usernameResult = await client.queryArray("select email, username, hashed_password, salt from users where username='"
                    + user?.email?.value + "'");
                if (usernameResult.rows.length < 1) {
                    const emailResult = await client.queryArray("select email, username, hashed_password, salt from users where email='"
                        + user?.email?.value + "'");
                    if (emailResult.rows.length < 1) {
                        context.response.body = { text: 'Given Email or Username Does Not Exist' };
                    } else {
                        let saltHexString = '';
                        for (let i = 0; i < (emailResult.rows[0][3] as Uint8Array).length; ++i) {
                            saltHexString += ((emailResult.rows[0][3] as Uint8Array)[i] < 16 ? "0" : "")
                                + (emailResult.rows[0][3] as Uint8Array)[i].toString(16);
                        }
                        let textEncoder = new TextEncoder();
                        let hashedPasswordUint8Array = new Uint8Array(await crypto.subtle.digest('SHA3-512',
                            textEncoder.encode(user?.password?.value + saltHexString)));
                        let hashedPasswordHexString = '';
                        for (let i = 0; i < hashedPasswordUint8Array.length; ++i) {
                            hashedPasswordHexString += (hashedPasswordUint8Array[i] < 16 ? "0" : "")
                                + hashedPasswordUint8Array[i].toString(16);
                        }
                        let serverHashedPasswordHexString = '';
                        for (let i = 0; i < (emailResult.rows[0][2] as Uint8Array).length; ++i) {
                            serverHashedPasswordHexString += ((emailResult.rows[0][2] as Uint8Array)[i] < 16 ? "0" : "")
                                + (emailResult.rows[0][2] as Uint8Array)[i].toString(16);
                        }
                        if (hashedPasswordHexString === serverHashedPasswordHexString) {
                            let foundUser: User = {
                                email: { value: emailResult.rows[0][0] as string },
                                username: { value: emailResult.rows[0][1] as string },
                                password: { value: '' },
                            }
                            let sid = await nanoid(40);
                            sids[sid] = foundUser.username.value;
                            await context.cookies.set('sid', sid);
                            context.response.body = foundUser;
                        } else {
                            context.response.body = { text: 'Wrong Password' };
                        }
                    }
                } else {
                    let saltHexString = '';
                    for (let i = 0; i < (usernameResult.rows[0][3] as Uint8Array).length; ++i) {
                        saltHexString += ((usernameResult.rows[0][3] as Uint8Array)[i] < 16 ? "0" : "")
                            + (usernameResult.rows[0][3] as Uint8Array)[i].toString(16);
                    }
                    let textEncoder = new TextEncoder();
                    let hashedPasswordUint8Array = new Uint8Array(await crypto.subtle.digest('SHA3-512',
                        textEncoder.encode(user?.password?.value + saltHexString)));
                    let hashedPasswordHexString = '';
                    for (let i = 0; i < hashedPasswordUint8Array.length; ++i) {
                        hashedPasswordHexString += (hashedPasswordUint8Array[i] < 16 ? "0" : "")
                            + hashedPasswordUint8Array[i].toString(16);
                    }
                    let serverHashedPasswordHexString = '';
                    for (let i = 0; i < (usernameResult.rows[0][2] as Uint8Array).length; ++i) {
                        serverHashedPasswordHexString += ((usernameResult.rows[0][2] as Uint8Array)[i] < 16 ? "0" : "")
                            + (usernameResult.rows[0][2] as Uint8Array)[i].toString(16);
                    }
                    if (hashedPasswordHexString === serverHashedPasswordHexString) {
                        let foundUser: User = {
                            email: { value: usernameResult.rows[0][0] as string },
                            username: { value: usernameResult.rows[0][1] as string },
                            password: { value: '' },
                        }
                        let sid = await nanoid(40);
                        sids[sid] = foundUser.username.value;
                        await context.cookies.set('sid', sid);
                        context.response.body = foundUser;
                    } else {
                        context.response.body = { text: 'Wrong Password' };
                    }
                }
                await client.end();
                if (1 > 2) {
                    context.response.body = { text: 'Given Email or Username Does Not Exist' };
                }
                context.response.type = "json";
                return;
            }
            context.throw(Status.BadRequest, "Bad Request");
        } catch (err) {
            console.log(err);
        }
    })
    .get("/api/user", async (context) => {
        try {
            let sid = await context.cookies.get('sid');
            if (sid && typeof sid === 'string') {
                let username = sids[sid as string];
                if (username) {
                    await client.connect();
                    const usernameResult = await client.queryArray("select email, username, num_wins, num_losses from users where username='"
                        + username + "'");
                    let foundUser: User = {
                        email: { value: usernameResult.rows[0][0] as string },
                        username: { value: usernameResult.rows[0][1] as string },
                        password: { value: '' },
                    }
                    context.response.body = {
                        user: foundUser,
                        numWins: usernameResult.rows[0][2] as number,
                        numLosses: usernameResult.rows[0][3] as number,
                    };
                    await client.end();
                }
            }
        } catch (err) {
            console.log(err);
        }
    })
    .get("/api/logout", async (context) => {
        try {
            let sid = await context.cookies.get('sid');
            if (sid && typeof sid === 'string') {
                delete sids[sid as string];
                context.response.body = { text: 'Successfully Logged Out' };
            }
        } catch (err) {
            console.log(err);
        }
    })
    .post("/api/run", async (context: RouterContext<any>) => {
        try {
            if (!context.request.hasBody) {
                context.throw(Status.BadRequest, "Bad Request");
            }
            const body = context.request.body();
            let code: Partial<CodeSubmission> | undefined;
            if (body.type === "json") {
                code = await body.value;
            }
            if (code) {
                context.assert(typeof code?.value === "string", Status.BadRequest);
                console.log(code.value);
                context.response.status = Status.OK;
                // let testCasesPassed: TestCasesPassed = {
                //     testCasesPassed: [true, true, true, true, true, true, true, false, false, false, false],
                // }
                // const dylib = Deno.dlopen("./sandbox/report_creator.so", {
                //     "createReport": {parameters: [], result: "i32"}
                // });
                //console.log(dylib)
                await Deno.writeTextFile("./sandbox/answer.py", code.value);
                //const res: number = dylib.symbols.createReport();
                const reportProcess = Deno.run({
                    cmd: ["./makeReport.sh"],
                    cwd: "./sandbox",
                    stdout: "piped"
                });
                await reportProcess.output();
                let jsonResults: String = await Deno.readTextFile("./sandbox/reportFromPySandbox.txt");
                jsonResults = jsonResults.replace(/\s/g, "");
                jsonResults = jsonResults.substring(0, jsonResults.length - 2) + "]"
                let testResults: TestResult[]  = JSON.parse(jsonResults.toString());
                let testCasesPassed: TestCasesPassed = {
                    testCasesPassed: testResults.map((tr: TestResult) => tr.passed)
                };
                context.response.body = testCasesPassed;
                //dylib.close();
            }
        } catch (err) {
            console.log(err);
        }
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
