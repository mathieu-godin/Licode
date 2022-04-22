import { Application, Router, Status, } from "https://deno.land/x/oak/mod.ts";
import { Client } from "https://deno.land/x/postgres@v0.15.0/mod.ts";
import { crypto } from "https://deno.land/std@0.132.0/crypto/mod.ts";
import { nanoid } from 'https://deno.land/x/nanoid@v3.0.0/async.ts';
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
let helloWorldVar = { text: 'Hello World' };
let sids = {};
let matchmakingQueue25 = [];
let matchmakingQueue50 = [];
let matchmakingQueue100 = [];
let matchmakingQueue200 = [];
let matchmakingQueue500 = [];
let matches = {};
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}
const port = +env.LICODE_PORT || 3000;
app.addEventListener("error", (evt) => {
    console.log(evt.error);
});
router
    .get("/api/hello-world", (context) => {
    try {
        context.response.body = helloWorldVar;
    }
    catch (err) {
        console.log(err);
    }
})
    .post("/api/post-hello-world", async (context) => {
    if (!context.request.hasBody) {
        context.throw(Status.BadRequest, "Bad Request");
    }
    const body = context.request.body();
    let helloWorld;
    if (body.type === "json") {
        helloWorld = await body.value;
    }
    else if (body.type === "form") {
        helloWorld = {};
        for (const [key, value] of await body.value) {
            helloWorld[key] = value;
        }
    }
    else if (body.type === "form-data") {
        const formData = await body.value.read();
        helloWorld = formData.fields;
    }
    if (helloWorld) {
        context.assert(typeof helloWorld.text === "string", Status.BadRequest);
        helloWorldVar = helloWorld;
        context.response.status = Status.OK;
        context.response.body = helloWorld;
        context.response.type = "json";
        return;
    }
    context.throw(Status.BadRequest, "Bad Request");
})
    .post("/api/register", async (context) => {
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
        let user;
        if (body.type === "json") {
            user = await body.value;
        }
        if (user) {
            context.assert(typeof user?.email?.value === "string"
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
                    let hashedPasswordUint8Array = new Uint8Array(await crypto.subtle.digest('SHA3-512', textEncoder.encode(user?.password?.value + saltHexString)));
                    let hashedPasswordHexString = '';
                    for (let i = 0; i < hashedPasswordUint8Array.length; ++i) {
                        hashedPasswordHexString += (hashedPasswordUint8Array[i] < 16 ? "0" : "")
                            + hashedPasswordUint8Array[i].toString(16);
                    }
                    let hashedPasswordHexStringLength = hashedPasswordHexString.length;
                    for (let i = 0; i < 128 - hashedPasswordHexStringLength; ++i) {
                        hashedPasswordHexString = "0" + hashedPasswordHexString;
                    }
                    await client.queryArray("insert into public.users(email, username, hashed_password, salt, num_wins, num_losses, created_at, updated_at, elo_rating, has_2400_rating_history)"
                        + " values ('" + user?.email?.value + "', '" + user?.username?.value + "', '"
                        + "\\x" + hashedPasswordHexString + "', '" + "\\x" + saltHexString + "', '0', '0', now(), now(), '1000', 'false')");
                    let sid = await nanoid(40);
                    sids[sid] = user.username.value;
                    await context.cookies.set('sid', sid);
                    context.response.body = user;
                }
                else {
                    context.response.body = { text: 'Given Email Already Exists' };
                }
            }
            else {
                context.response.body = { text: 'Given Username Already Exists' };
            }
            await client.end();
            context.response.type = "json";
            return;
        }
        context.throw(Status.BadRequest, "Bad Request");
    }
    catch (err) {
        console.log(err);
    }
})
    .post("/api/login", async (context) => {
    try {
        if (!context.request.hasBody) {
            context.throw(Status.BadRequest, "Bad Request");
        }
        const body = context.request.body();
        let user;
        if (body.type === "json") {
            user = await body.value;
        }
        if (user) {
            context.assert(typeof user?.email?.value === "string"
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
                }
                else {
                    let saltHexString = '';
                    for (let i = 0; i < emailResult.rows[0][3].length; ++i) {
                        saltHexString += (emailResult.rows[0][3][i] < 16 ? "0" : "")
                            + emailResult.rows[0][3][i].toString(16);
                    }
                    let textEncoder = new TextEncoder();
                    let hashedPasswordUint8Array = new Uint8Array(await crypto.subtle.digest('SHA3-512', textEncoder.encode(user?.password?.value + saltHexString)));
                    let hashedPasswordHexString = '';
                    for (let i = 0; i < hashedPasswordUint8Array.length; ++i) {
                        hashedPasswordHexString += (hashedPasswordUint8Array[i] < 16 ? "0" : "")
                            + hashedPasswordUint8Array[i].toString(16);
                    }
                    let serverHashedPasswordHexString = '';
                    for (let i = 0; i < emailResult.rows[0][2].length; ++i) {
                        serverHashedPasswordHexString += (emailResult.rows[0][2][i] < 16 ? "0" : "")
                            + emailResult.rows[0][2][i].toString(16);
                    }
                    if (hashedPasswordHexString === serverHashedPasswordHexString) {
                        let foundUser = {
                            email: { value: emailResult.rows[0][0] },
                            username: { value: emailResult.rows[0][1] },
                            password: { value: '' },
                        };
                        let sid = await nanoid(40);
                        sids[sid] = foundUser.username.value;
                        await context.cookies.set('sid', sid);
                        context.response.body = foundUser;
                    }
                    else {
                        context.response.body = { text: 'Wrong Password' };
                    }
                }
            }
            else {
                let saltHexString = '';
                for (let i = 0; i < usernameResult.rows[0][3].length; ++i) {
                    saltHexString += (usernameResult.rows[0][3][i] < 16 ? "0" : "")
                        + usernameResult.rows[0][3][i].toString(16);
                }
                let textEncoder = new TextEncoder();
                let hashedPasswordUint8Array = new Uint8Array(await crypto.subtle.digest('SHA3-512', textEncoder.encode(user?.password?.value + saltHexString)));
                let hashedPasswordHexString = '';
                for (let i = 0; i < hashedPasswordUint8Array.length; ++i) {
                    hashedPasswordHexString += (hashedPasswordUint8Array[i] < 16 ? "0" : "")
                        + hashedPasswordUint8Array[i].toString(16);
                }
                let serverHashedPasswordHexString = '';
                for (let i = 0; i < usernameResult.rows[0][2].length; ++i) {
                    serverHashedPasswordHexString += (usernameResult.rows[0][2][i] < 16 ? "0" : "")
                        + usernameResult.rows[0][2][i].toString(16);
                }
                if (hashedPasswordHexString === serverHashedPasswordHexString) {
                    let foundUser = {
                        email: { value: usernameResult.rows[0][0] },
                        username: { value: usernameResult.rows[0][1] },
                        password: { value: '' },
                    };
                    let sid = await nanoid(40);
                    sids[sid] = foundUser.username.value;
                    await context.cookies.set('sid', sid);
                    context.response.body = foundUser;
                }
                else {
                    context.response.body = { text: 'Wrong Password' };
                }
            }
            await client.end();
            context.response.type = "json";
            return;
        }
        context.throw(Status.BadRequest, "Bad Request");
    }
    catch (err) {
        console.log(err);
    }
})
    .get("/api/user", async (context) => {
    try {
        let sid = await context.cookies.get('sid');
        if (sid && typeof sid === 'string') {
            let username = sids[sid];
            if (username) {
                await client.connect();
                const usernameResult = await client.queryArray("select email, username, num_wins, num_losses, elo_rating from users where username='"
                    + username + "'");
                let foundUser = {
                    email: { value: usernameResult.rows[0][0] },
                    username: { value: usernameResult.rows[0][1] },
                    password: { value: '' },
                };
                context.response.body = {
                    user: foundUser,
                    numWins: usernameResult.rows[0][2],
                    numLosses: usernameResult.rows[0][3],
                    eloRating: usernameResult.rows[0][4],
                };
                await client.end();
            }
        }
    }
    catch (err) {
        console.log(err);
    }
})
    .get("/api/opponent", async (context) => {
    try {
        let sid = await context.cookies.get('sid');
        if (sid && typeof sid === 'string') {
            let username = sids[sid];
            let opponentUsername = sids[matches[sid]];
            if (username && opponentUsername) {
                await client.connect();
                const usernameResult = await client.queryArray("select elo_rating from users where username='"
                    + username + "'");
                const opponentUsernameResult = await client.queryArray("select elo_rating from users where username='"
                    + opponentUsername + "'");
                const responseBody = {
                    you: {
                        username: username,
                        eloRating: usernameResult.rows[0][0],
                        sid: sid,
                    },
                    opponent: {
                        username: opponentUsername,
                        eloRating: opponentUsernameResult.rows[0][0],
                        sid: ''
                    },
                };
                context.response.body = responseBody;
                await client.end();
            }
        }
    }
    catch (err) {
        console.log(err);
    }
})
    .get("/api/matchmaking", async (context) => {
    try {
        let sid = await context.cookies.get('sid');
        if (sid && typeof sid === 'string') {
            let username = sids[sid];
            if (username) {
                await client.connect();
                const usernameResult = await client.queryArray("select elo_rating from users where username='"
                    + username + "'");
                let matchmakingUser = {
                    eloRating: usernameResult.rows[0][0],
                    sid: sid,
                };
                await client.end();
                let foundMatch = false;
                matchmakingQueue25.push(matchmakingUser);
                for (let i = 0; i < matchmakingQueue25.length; ++i) {
                    if (matchmakingQueue25[i].sid != matchmakingUser.sid
                        && Math.abs(matchmakingUser.eloRating - matchmakingQueue25[i].eloRating) <= 25) {
                        matches[matchmakingQueue25[i].sid] = sid;
                        matches[sid] = matchmakingQueue25[i].sid;
                        console.log("attempting register pair " + sid + ", " + matchmakingQueue25[i].sid);
                        const response = await fetch("http://localhost:8080/registerPair", {
                            method: "POST",
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                Id1: sid,
                                Id2: matchmakingQueue25[i].sid,
                            }),
                        });
                        console.log(response.status);
                        context.response.body = {
                            username: sids[sid],
                            eloRating: matchmakingUser.eloRating,
                            opponentUsername: sids[matchmakingQueue25[i].sid],
                            opponentEloRating: matchmakingQueue25[i].eloRating,
                        };
                        matchmakingQueue25.splice(i, 1);
                        matchmakingQueue25.pop();
                        foundMatch = true;
                        break;
                    }
                }
                while (!foundMatch) {
                    await delay(1000);
                    if (sid in matches) {
                        let opponentUsername = sids[matches[sid]];
                        await client.connect();
                        const usernameResult = await client.queryArray("select elo_rating from users where username='"
                            + username + "'");
                        let opponentEloRating = usernameResult.rows[0][0];
                        await client.end();
                        context.response.body = {
                            username: sids[sid],
                            eloRating: matchmakingUser.eloRating,
                            opponentUsername: opponentUsername,
                            opponentEloRating: opponentEloRating,
                        };
                        foundMatch = true;
                    }
                }
            }
        }
    }
    catch (err) {
        console.log(err);
    }
})
    .get("/api/logout", async (context) => {
    try {
        let sid = await context.cookies.get('sid');
        if (sid && typeof sid === 'string') {
            delete sids[sid];
            context.response.body = { text: 'Successfully Logged Out' };
        }
    }
    catch (err) {
        console.log(err);
    }
})
    .post("/api/run", async (context) => {
    try {
        if (!context.request.hasBody) {
            context.throw(Status.BadRequest, "Bad Request");
        }
        const body = context.request.body();
        let code;
        if (body.type === "json") {
            code = await body.value;
        }
        if (code) {
            context.assert(typeof code?.value === "string", Status.BadRequest);
            context.assert(typeof code?.input === "string", Status.BadRequest);
            context.response.status = Status.OK;
            await Deno.writeTextFile("./sandbox/answer.py", code.value);
            await Deno.writeTextFile("./sandbox/answerCustomInput.py", code.value);
            let inputLines = code.input.split('\n');
            let customInputContent = '';
            customInputContent += parseInt(inputLines[1]).toString() + '\n';
            let inputCommaSeparatedValues = inputLines[0].split('[')[1].split(']')[0].split(',');
            for (let i = 0; i < inputCommaSeparatedValues.length; ++i) {
                customInputContent += parseInt(inputCommaSeparatedValues[i]).toString() + '\n';
            }
            await Deno.writeTextFile("./sandbox/customInput.in", customInputContent);
            const reportProcess = Deno.run({
                cmd: ["./makeReport.sh"],
                cwd: "./sandbox",
                stdout: "piped"
            });
            await reportProcess.output();
            let jsonResults = await Deno.readTextFile("./sandbox/reportFromPySandbox.txt");
            let standardOutputResults = await Deno.readTextFile("./sandbox/standardOutputFromPySandbox.txt");
            let outputResults = await Deno.readTextFile("./sandbox/outputFromPySandbox.txt");
            jsonResults = jsonResults.replace(/\s/g, "");
            jsonResults = jsonResults.substring(0, jsonResults.length - 2) + "]";
            let testResults = JSON.parse(jsonResults.toString());
            let testCasesPassed = {
                testCasesPassed: testResults.map((tr) => tr.passed),
                standardOutput: standardOutputResults,
                output: outputResults,
            };
            context.response.body = testCasesPassed;
        }
    }
    catch (err) {
        console.log(err);
    }
});
app.use(router.routes());
app.use(router.allowedMethods());
app.use(async (context) => {
    if (!context.request.url.pathname.endsWith('.js')
        && !context.request.url.pathname.endsWith('.png')
        && !context.request.url.pathname.endsWith('.ico')
        && !context.request.url.pathname.endsWith('.txt')) {
        context.request.url.pathname = '/';
    }
    await context.send({
        root: `${Deno.cwd()}/react-app/build`,
        index: "index.html",
    });
});
console.log("Running on port", port);
await app.listen({ port });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDSCxXQUFXLEVBQ1gsTUFBTSxFQUVOLE1BQU0sR0FFVCxNQUFNLGdDQUFnQyxDQUFDO0FBSXhDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSw2Q0FBNkMsQ0FBQztBQUNyRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sNkNBQTZDLENBQUM7QUFDckUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLDRDQUE0QyxDQUFBO0FBQ25FLE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDO0lBQ3RCLElBQUksRUFBRSxRQUFRO0lBQ2QsUUFBUSxFQUFFLFFBQVE7SUFDbEIsUUFBUSxFQUFFLFFBQVE7SUFDbEIsUUFBUSxFQUFFLFdBQVc7SUFDckIsSUFBSSxFQUFFLElBQUk7SUFDVixHQUFHLEVBQUU7UUFDRCxPQUFPLEVBQUUsS0FBSztRQUNkLE9BQU8sRUFBRSxLQUFLO0tBQ2pCO0NBQ0osQ0FBQyxDQUFDO0FBQ0gsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNoQyxNQUFNLEdBQUcsR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFDO0FBQzlCLE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7QUFpQzVCLElBQUksYUFBYSxHQUFlLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxDQUFDO0FBRXhELElBQUksSUFBSSxHQUErQixFQUFFLENBQUM7QUFFMUMsSUFBSSxrQkFBa0IsR0FBc0IsRUFBRSxDQUFDO0FBQy9DLElBQUksa0JBQWtCLEdBQXNCLEVBQUUsQ0FBQztBQUMvQyxJQUFJLG1CQUFtQixHQUFzQixFQUFFLENBQUM7QUFDaEQsSUFBSSxtQkFBbUIsR0FBc0IsRUFBRSxDQUFDO0FBQ2hELElBQUksbUJBQW1CLEdBQXNCLEVBQUUsQ0FBQztBQUVoRCxJQUFJLE9B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LFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRTtRQUNuRCxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDO0tBQ3RDO0lBQ0QsTUFBTSxPQUFPLENBQUMsSUFBSSxDQUFDO1FBQ2YsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxrQkFBa0I7UUFDckMsS0FBSyxFQUFFLFlBQVk7S0FDdEIsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFDLENBQUM7QUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3JDLE1BQU0sR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICAgIEFwcGxpY2F0aW9uLFxuICAgIFJvdXRlcixcbiAgICBSb3V0ZXJDb250ZXh0LFxuICAgIFN0YXR1cyxcbiAgICBzZW5kLFxufSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9vYWsvbW9kLnRzXCI7XG5cbmltcG9ydCB7IE1hdGNobWFraW5nRGF0YSB9IGZyb20gXCIuL3JlYWN0LWFwcC9zcmMvY29tcG9uZW50cy9jb21tb24vaW50ZXJmYWNlcy9tYXRjaG1ha2luZ0RhdGEudHNcIlxuXG5pbXBvcnQgeyBDbGllbnQgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9wb3N0Z3Jlc0B2MC4xNS4wL21vZC50c1wiO1xuaW1wb3J0IHsgY3J5cHRvIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEzMi4wL2NyeXB0by9tb2QudHNcIjtcbmltcG9ydCB7IG5hbm9pZCB9IGZyb20gJ2h0dHBzOi8vZGVuby5sYW5kL3gvbmFub2lkQHYzLjAuMC9hc3luYy50cydcbmNvbnN0IGNsaWVudCA9IG5ldyBDbGllbnQoe1xuICAgIHVzZXI6IFwibGljb2RlXCIsXG4gICAgZGF0YWJhc2U6IFwibGljb2RlXCIsXG4gICAgcGFzc3dvcmQ6IFwiZWRvY2lsXCIsXG4gICAgaG9zdG5hbWU6IFwibG9jYWxob3N0XCIsXG4gICAgcG9ydDogNTQzMixcbiAgICB0bHM6IHtcbiAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgIGVuZm9yY2U6IGZhbHNlLFxuICAgIH0sXG59KTtcbmNvbnN0IGVudiA9IERlbm8uZW52LnRvT2JqZWN0KCk7XG5jb25zdCBhcHAgPSBuZXcgQXBwbGljYXRpb24oKTtcbmNvbnN0IHJvdXRlciA9IG5ldyBSb3V0ZXIoKTtcblxuaW50ZXJmYWNlIEhlbGxvV29ybGQge1xuICAgIHRleHQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFVzZXIge1xuICAgIGVtYWlsOiB7IHZhbHVlOiBzdHJpbmcgfTtcbiAgICB1c2VybmFtZTogeyB2YWx1ZTogc3RyaW5nIH07XG4gICAgcGFzc3dvcmQ6IHsgdmFsdWU6IHN0cmluZyB9O1xufVxuXG5pbnRlcmZhY2UgTWF0Y2htYWtpbmdVc2VyIHtcbiAgICBlbG9SYXRpbmc6IG51bWJlcjtcbiAgICBzaWQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIENvZGVTdWJtaXNzaW9uIHtcbiAgICB2YWx1ZTogc3RyaW5nO1xuICAgIGlucHV0OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBUZXN0Q2FzZXNQYXNzZWQge1xuICAgIHRlc3RDYXNlc1Bhc3NlZDogYm9vbGVhbltdO1xuICAgIHN0YW5kYXJkT3V0cHV0OiBzdHJpbmc7XG4gICAgb3V0cHV0OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBUZXN0UmVzdWx0IHtcbiAgICB0ZXN0TmFtZTogc3RyaW5nLFxuICAgIHBhc3NlZDogYm9vbGVhblxufVxuXG5sZXQgaGVsbG9Xb3JsZFZhcjogSGVsbG9Xb3JsZCA9IHsgdGV4dDogJ0hlbGxvIFdvcmxkJyB9O1xuXG5sZXQgc2lkczogeyBbbmFtZTogc3RyaW5nXTogc3RyaW5nIH0gPSB7fTtcblxubGV0IG1hdGNobWFraW5nUXVldWUyNTogTWF0Y2htYWtpbmdVc2VyW10gPSBbXTtcbmxldCBtYXRjaG1ha2luZ1F1ZXVlNTA6IE1hdGNobWFraW5nVXNlcltdID0gW107XG5sZXQgbWF0Y2htYWtpbmdRdWV1ZTEwMDogTWF0Y2htYWtpbmdVc2VyW10gPSBbXTtcbmxldCBtYXRjaG1ha2luZ1F1ZXVlMjAwOiBNYXRjaG1ha2luZ1VzZXJbXSA9IFtdO1xubGV0IG1hdGNobWFraW5nUXVldWU1MDA6IE1hdGNobWFraW5nVXNlcltdID0gW107XG5cbmxldCBtYXRjaGVzOiB7IFtuYW1lOiBzdHJpbmddOiBzdHJpbmcgfSA9IHt9O1xuXG5mdW5jdGlvbiBkZWxheSh0aW1lOiBudW1iZXIpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHRpbWUpKTtcbn1cblxuY29uc3QgcG9ydDogbnVtYmVyID0gK2Vudi5MSUNPREVfUE9SVCB8fCAzMDAwO1xuYXBwLmFkZEV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLCAoZXZ0KSA9PiB7XG4gICAgY29uc29sZS5sb2coZXZ0LmVycm9yKTtcbn0pO1xucm91dGVyXG4gICAgLmdldChcIi9hcGkvaGVsbG8td29ybGRcIiwgKGNvbnRleHQpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0gaGVsbG9Xb3JsZFZhcjtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAucG9zdChcIi9hcGkvcG9zdC1oZWxsby13b3JsZFwiLCBhc3luYyAoY29udGV4dDogUm91dGVyQ29udGV4dDxhbnk+KSA9PiB7XG4gICAgICAgIGlmICghY29udGV4dC5yZXF1ZXN0Lmhhc0JvZHkpIHtcbiAgICAgICAgICAgIGNvbnRleHQudGhyb3coU3RhdHVzLkJhZFJlcXVlc3QsIFwiQmFkIFJlcXVlc3RcIik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYm9keSA9IGNvbnRleHQucmVxdWVzdC5ib2R5KCk7XG4gICAgICAgIGxldCBoZWxsb1dvcmxkOiBQYXJ0aWFsPEhlbGxvV29ybGQ+IHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAoYm9keS50eXBlID09PSBcImpzb25cIikge1xuICAgICAgICAgICAgaGVsbG9Xb3JsZCA9IGF3YWl0IGJvZHkudmFsdWU7XG4gICAgICAgIH0gZWxzZSBpZiAoYm9keS50eXBlID09PSBcImZvcm1cIikge1xuICAgICAgICAgICAgaGVsbG9Xb3JsZCA9IHt9O1xuICAgICAgICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgYXdhaXQgYm9keS52YWx1ZSkge1xuICAgICAgICAgICAgICAgIGhlbGxvV29ybGRba2V5IGFzIGtleW9mIEhlbGxvV29ybGRdID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoYm9keS50eXBlID09PSBcImZvcm0tZGF0YVwiKSB7XG4gICAgICAgICAgICBjb25zdCBmb3JtRGF0YSA9IGF3YWl0IGJvZHkudmFsdWUucmVhZCgpO1xuICAgICAgICAgICAgaGVsbG9Xb3JsZCA9IGZvcm1EYXRhLmZpZWxkcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoaGVsbG9Xb3JsZCkge1xuICAgICAgICAgICAgY29udGV4dC5hc3NlcnQodHlwZW9mIGhlbGxvV29ybGQudGV4dCA9PT0gXCJzdHJpbmdcIiwgU3RhdHVzLkJhZFJlcXVlc3QpO1xuICAgICAgICAgICAgaGVsbG9Xb3JsZFZhciA9IGhlbGxvV29ybGQgYXMgSGVsbG9Xb3JsZDtcbiAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2Uuc3RhdHVzID0gU3RhdHVzLk9LO1xuICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0gaGVsbG9Xb3JsZDtcbiAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UudHlwZSA9IFwianNvblwiO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRleHQudGhyb3coU3RhdHVzLkJhZFJlcXVlc3QsIFwiQmFkIFJlcXVlc3RcIik7XG4gICAgfSlcbiAgICAucG9zdChcIi9hcGkvcmVnaXN0ZXJcIiwgYXN5bmMgKGNvbnRleHQ6IFJvdXRlckNvbnRleHQ8YW55PikgPT4ge1xuICAgICAgICBsZXQgc2lkID0gYXdhaXQgY29udGV4dC5jb29raWVzLmdldCgnc2lkJyk7XG4gICAgICAgIGlmICghc2lkKSB7XG4gICAgICAgICAgICBzaWQgPSBhd2FpdCBuYW5vaWQoNDApO1xuICAgICAgICAgICAgY29udGV4dC5jb29raWVzLnNldCgnc2lkJywgc2lkKTtcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKCFjb250ZXh0LnJlcXVlc3QuaGFzQm9keSkge1xuICAgICAgICAgICAgICAgIGNvbnRleHQudGhyb3coU3RhdHVzLkJhZFJlcXVlc3QsIFwiQmFkIFJlcXVlc3RcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gY29udGV4dC5yZXF1ZXN0LmJvZHkoKTtcbiAgICAgICAgICAgIGxldCB1c2VyOiBQYXJ0aWFsPFVzZXI+IHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgaWYgKGJvZHkudHlwZSA9PT0gXCJqc29uXCIpIHtcbiAgICAgICAgICAgICAgICB1c2VyID0gYXdhaXQgYm9keS52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgY29udGV4dC5hc3NlcnQoXG4gICAgICAgICAgICAgICAgICAgIHR5cGVvZiB1c2VyPy5lbWFpbD8udmFsdWUgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIHVzZXI/LnVzZXJuYW1lPy52YWx1ZSA9PT0gXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgdXNlcj8ucGFzc3dvcmQ/LnZhbHVlID09PSBcInN0cmluZ1wiLCBTdGF0dXMuQmFkUmVxdWVzdCk7XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5zdGF0dXMgPSBTdGF0dXMuT0s7XG4gICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IHVzZXJuYW1lIGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICAgICAgICAgICsgdXNlcj8udXNlcm5hbWU/LnZhbHVlICsgXCInXCIpO1xuICAgICAgICAgICAgICAgIGlmICh1c2VybmFtZVJlc3VsdC5yb3dzLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZW1haWxSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBlbWFpbCBmcm9tIHVzZXJzIHdoZXJlIGVtYWlsPSdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKyB1c2VyPy5lbWFpbD8udmFsdWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbWFpbFJlc3VsdC5yb3dzLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzYWx0SGV4U3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDMyOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYWx0SGV4U3RyaW5nICs9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIE1hdGgucG93KDIsIDMyKSkudG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNhbHRIZXhTdHJpbmdMZW5ndGggPSBzYWx0SGV4U3RyaW5nLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMjU2IC0gc2FsdEhleFN0cmluZ0xlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2FsdEhleFN0cmluZyA9IFwiMFwiICsgc2FsdEhleFN0cmluZztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0ZXh0RW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGhhc2hlZFBhc3N3b3JkVWludDhBcnJheSA9IG5ldyBVaW50OEFycmF5KGF3YWl0IGNyeXB0by5zdWJ0bGUuZGlnZXN0KCdTSEEzLTUxMicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dEVuY29kZXIuZW5jb2RlKHVzZXI/LnBhc3N3b3JkPy52YWx1ZSArIHNhbHRIZXhTdHJpbmcpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgKz0gKGhhc2hlZFBhc3N3b3JkVWludDhBcnJheVtpXSA8IDE2ID8gXCIwXCIgOiBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIGhhc2hlZFBhc3N3b3JkVWludDhBcnJheVtpXS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmdMZW5ndGggPSBoYXNoZWRQYXNzd29yZEhleFN0cmluZy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEyOCAtIGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nTGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNoZWRQYXNzd29yZEhleFN0cmluZyA9IFwiMFwiICsgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImluc2VydCBpbnRvIHB1YmxpYy51c2VycyhlbWFpbCwgdXNlcm5hbWUsIGhhc2hlZF9wYXNzd29yZCwgc2FsdCwgbnVtX3dpbnMsIG51bV9sb3NzZXMsIGNyZWF0ZWRfYXQsIHVwZGF0ZWRfYXQsIGVsb19yYXRpbmcsIGhhc18yNDAwX3JhdGluZ19oaXN0b3J5KVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBcIiB2YWx1ZXMgKCdcIiArIHVzZXI/LmVtYWlsPy52YWx1ZSArIFwiJywgJ1wiICsgdXNlcj8udXNlcm5hbWU/LnZhbHVlICsgXCInLCAnXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiXFxcXHhcIiArIGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nICsgXCInLCAnXCIgKyBcIlxcXFx4XCIgKyBzYWx0SGV4U3RyaW5nICsgXCInLCAnMCcsICcwJywgbm93KCksIG5vdygpLCAnMTAwMCcsICdmYWxzZScpXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNpZCA9IGF3YWl0IG5hbm9pZCg0MCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaWRzW3NpZF0gPSB1c2VyLnVzZXJuYW1lLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY29udGV4dC5jb29raWVzLnNldCgnc2lkJywgc2lkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHVzZXI7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7IHRleHQ6ICdHaXZlbiBFbWFpbCBBbHJlYWR5IEV4aXN0cycgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHsgdGV4dDogJ0dpdmVuIFVzZXJuYW1lIEFscmVhZHkgRXhpc3RzJyB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS50eXBlID0gXCJqc29uXCI7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGV4dC50aHJvdyhTdGF0dXMuQmFkUmVxdWVzdCwgXCJCYWQgUmVxdWVzdFwiKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAucG9zdChcIi9hcGkvbG9naW5cIiwgYXN5bmMgKGNvbnRleHQ6IFJvdXRlckNvbnRleHQ8YW55PikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKCFjb250ZXh0LnJlcXVlc3QuaGFzQm9keSkge1xuICAgICAgICAgICAgICAgIGNvbnRleHQudGhyb3coU3RhdHVzLkJhZFJlcXVlc3QsIFwiQmFkIFJlcXVlc3RcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gY29udGV4dC5yZXF1ZXN0LmJvZHkoKTtcbiAgICAgICAgICAgIGxldCB1c2VyOiBQYXJ0aWFsPFVzZXI+IHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgaWYgKGJvZHkudHlwZSA9PT0gXCJqc29uXCIpIHtcbiAgICAgICAgICAgICAgICB1c2VyID0gYXdhaXQgYm9keS52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgY29udGV4dC5hc3NlcnQoXG4gICAgICAgICAgICAgICAgICAgIHR5cGVvZiB1c2VyPy5lbWFpbD8udmFsdWUgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIHVzZXI/LnBhc3N3b3JkPy52YWx1ZSA9PT0gXCJzdHJpbmdcIiwgU3RhdHVzLkJhZFJlcXVlc3QpO1xuICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2Uuc3RhdHVzID0gU3RhdHVzLk9LO1xuICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgdXNlcm5hbWVSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBlbWFpbCwgdXNlcm5hbWUsIGhhc2hlZF9wYXNzd29yZCwgc2FsdCBmcm9tIHVzZXJzIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgICAgICAgICArIHVzZXI/LmVtYWlsPy52YWx1ZSArIFwiJ1wiKTtcbiAgICAgICAgICAgICAgICBpZiAodXNlcm5hbWVSZXN1bHQucm93cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVtYWlsUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgZW1haWwsIHVzZXJuYW1lLCBoYXNoZWRfcGFzc3dvcmQsIHNhbHQgZnJvbSB1c2VycyB3aGVyZSBlbWFpbD0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgdXNlcj8uZW1haWw/LnZhbHVlICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZW1haWxSZXN1bHQucm93cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7IHRleHQ6ICdHaXZlbiBFbWFpbCBvciBVc2VybmFtZSBEb2VzIE5vdCBFeGlzdCcgfTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzYWx0SGV4U3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IChlbWFpbFJlc3VsdC5yb3dzWzBdWzNdIGFzIFVpbnQ4QXJyYXkpLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2FsdEhleFN0cmluZyArPSAoKGVtYWlsUmVzdWx0LnJvd3NbMF1bM10gYXMgVWludDhBcnJheSlbaV0gPCAxNiA/IFwiMFwiIDogXCJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAoZW1haWxSZXN1bHQucm93c1swXVszXSBhcyBVaW50OEFycmF5KVtpXS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdGV4dEVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXkgPSBuZXcgVWludDhBcnJheShhd2FpdCBjcnlwdG8uc3VidGxlLmRpZ2VzdCgnU0hBMy01MTInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRFbmNvZGVyLmVuY29kZSh1c2VyPy5wYXNzd29yZD8udmFsdWUgKyBzYWx0SGV4U3RyaW5nKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhhc2hlZFBhc3N3b3JkVWludDhBcnJheS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nICs9IChoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXlbaV0gPCAxNiA/IFwiMFwiIDogXCJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXlbaV0udG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNlcnZlckhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IChlbWFpbFJlc3VsdC5yb3dzWzBdWzJdIGFzIFVpbnQ4QXJyYXkpLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VydmVySGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgKz0gKChlbWFpbFJlc3VsdC5yb3dzWzBdWzJdIGFzIFVpbnQ4QXJyYXkpW2ldIDwgMTYgPyBcIjBcIiA6IFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgKGVtYWlsUmVzdWx0LnJvd3NbMF1bMl0gYXMgVWludDhBcnJheSlbaV0udG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nID09PSBzZXJ2ZXJIYXNoZWRQYXNzd29yZEhleFN0cmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmb3VuZFVzZXI6IFVzZXIgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtYWlsOiB7IHZhbHVlOiBlbWFpbFJlc3VsdC5yb3dzWzBdWzBdIGFzIHN0cmluZyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogeyB2YWx1ZTogZW1haWxSZXN1bHQucm93c1swXVsxXSBhcyBzdHJpbmcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHsgdmFsdWU6ICcnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzaWQgPSBhd2FpdCBuYW5vaWQoNDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpZHNbc2lkXSA9IGZvdW5kVXNlci51c2VybmFtZS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjb250ZXh0LmNvb2tpZXMuc2V0KCdzaWQnLCBzaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IGZvdW5kVXNlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0geyB0ZXh0OiAnV3JvbmcgUGFzc3dvcmQnIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsZXQgc2FsdEhleFN0cmluZyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8ICh1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzNdIGFzIFVpbnQ4QXJyYXkpLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzYWx0SGV4U3RyaW5nICs9ICgodXNlcm5hbWVSZXN1bHQucm93c1swXVszXSBhcyBVaW50OEFycmF5KVtpXSA8IDE2ID8gXCIwXCIgOiBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgKHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bM10gYXMgVWludDhBcnJheSlbaV0udG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGxldCB0ZXh0RW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgY3J5cHRvLnN1YnRsZS5kaWdlc3QoJ1NIQTMtNTEyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHRFbmNvZGVyLmVuY29kZSh1c2VyPy5wYXNzd29yZD8udmFsdWUgKyBzYWx0SGV4U3RyaW5nKSkpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXkubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nICs9IChoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXlbaV0gPCAxNiA/IFwiMFwiIDogXCJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArIGhhc2hlZFBhc3N3b3JkVWludDhBcnJheVtpXS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbGV0IHNlcnZlckhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgKHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMl0gYXMgVWludDhBcnJheSkubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZlckhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nICs9ICgodXNlcm5hbWVSZXN1bHQucm93c1swXVsyXSBhcyBVaW50OEFycmF5KVtpXSA8IDE2ID8gXCIwXCIgOiBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgKHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMl0gYXMgVWludDhBcnJheSlbaV0udG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChoYXNoZWRQYXNzd29yZEhleFN0cmluZyA9PT0gc2VydmVySGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmb3VuZFVzZXI6IFVzZXIgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW1haWw6IHsgdmFsdWU6IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMF0gYXMgc3RyaW5nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcm5hbWU6IHsgdmFsdWU6IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMV0gYXMgc3RyaW5nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHsgdmFsdWU6ICcnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc2lkID0gYXdhaXQgbmFub2lkKDQwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZHNbc2lkXSA9IGZvdW5kVXNlci51c2VybmFtZS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNvbnRleHQuY29va2llcy5zZXQoJ3NpZCcsIHNpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSBmb3VuZFVzZXI7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7IHRleHQ6ICdXcm9uZyBQYXNzd29yZCcgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS50eXBlID0gXCJqc29uXCI7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGV4dC50aHJvdyhTdGF0dXMuQmFkUmVxdWVzdCwgXCJCYWQgUmVxdWVzdFwiKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAuZ2V0KFwiL2FwaS91c2VyXCIsIGFzeW5jIChjb250ZXh0KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgc2lkID0gYXdhaXQgY29udGV4dC5jb29raWVzLmdldCgnc2lkJyk7XG4gICAgICAgICAgICBpZiAoc2lkICYmIHR5cGVvZiBzaWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgbGV0IHVzZXJuYW1lID0gc2lkc1tzaWQgYXMgc3RyaW5nXTtcbiAgICAgICAgICAgICAgICBpZiAodXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXNlcm5hbWVSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBlbWFpbCwgdXNlcm5hbWUsIG51bV93aW5zLCBudW1fbG9zc2VzLCBlbG9fcmF0aW5nIGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIHVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgZm91bmRVc2VyOiBVc2VyID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW1haWw6IHsgdmFsdWU6IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMF0gYXMgc3RyaW5nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogeyB2YWx1ZTogdXNlcm5hbWVSZXN1bHQucm93c1swXVsxXSBhcyBzdHJpbmcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiB7IHZhbHVlOiAnJyB9LFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXI6IGZvdW5kVXNlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bVdpbnM6IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMl0gYXMgbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgbnVtTG9zc2VzOiB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzNdIGFzIG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZzogdXNlcm5hbWVSZXN1bHQucm93c1swXVs0XSBhcyBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLmdldChcIi9hcGkvb3Bwb25lbnRcIiwgYXN5bmMgKGNvbnRleHQpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBzaWQgPSBhd2FpdCBjb250ZXh0LmNvb2tpZXMuZ2V0KCdzaWQnKTtcbiAgICAgICAgICAgIGlmIChzaWQgJiYgdHlwZW9mIHNpZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBsZXQgdXNlcm5hbWUgPSBzaWRzW3NpZCBhcyBzdHJpbmddO1xuICAgICAgICAgICAgICAgIGxldCBvcHBvbmVudFVzZXJuYW1lID0gc2lkc1ttYXRjaGVzW3NpZCBhcyBzdHJpbmddIGFzIHN0cmluZ107XG4gICAgICAgICAgICAgICAgaWYgKHVzZXJuYW1lICYmIG9wcG9uZW50VXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXNlcm5hbWVSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBlbG9fcmF0aW5nIGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIHVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvcHBvbmVudFVzZXJuYW1lUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgZWxvX3JhdGluZyBmcm9tIHVzZXJzIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKyBvcHBvbmVudFVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZUJvZHkgOiBNYXRjaG1ha2luZ0RhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB5b3U6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogdXNlcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxvUmF0aW5nOiB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzBdIGFzIG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWQ6IHNpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHBvbmVudDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJuYW1lOiBvcHBvbmVudFVzZXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZzogb3Bwb25lbnRVc2VybmFtZVJlc3VsdC5yb3dzWzBdWzBdIGFzIG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWQ6ICcnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSByZXNwb25zZUJvZHk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLmdldChcIi9hcGkvbWF0Y2htYWtpbmdcIiwgYXN5bmMgKGNvbnRleHQpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBzaWQgPSBhd2FpdCBjb250ZXh0LmNvb2tpZXMuZ2V0KCdzaWQnKTtcbiAgICAgICAgICAgIGlmIChzaWQgJiYgdHlwZW9mIHNpZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBsZXQgdXNlcm5hbWUgPSBzaWRzW3NpZCBhcyBzdHJpbmddO1xuICAgICAgICAgICAgICAgIGlmICh1c2VybmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IGVsb19yYXRpbmcgZnJvbSB1c2VycyB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgdXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgIGxldCBtYXRjaG1ha2luZ1VzZXI6IE1hdGNobWFraW5nVXNlciA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZzogdXNlcm5hbWVSZXN1bHQucm93c1swXVswXSBhcyBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBzaWQ6IHNpZCxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBmb3VuZE1hdGNoOiBib29sZWFuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIG1hdGNobWFraW5nUXVldWUyNS5wdXNoKG1hdGNobWFraW5nVXNlcik7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF0Y2htYWtpbmdRdWV1ZTI1Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2htYWtpbmdRdWV1ZTI1W2ldLnNpZCAhPSBtYXRjaG1ha2luZ1VzZXIuc2lkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIE1hdGguYWJzKG1hdGNobWFraW5nVXNlci5lbG9SYXRpbmcgLSBtYXRjaG1ha2luZ1F1ZXVlMjVbaV0uZWxvUmF0aW5nKSA8PSAyNSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZXNbbWF0Y2htYWtpbmdRdWV1ZTI1W2ldLnNpZF0gPSBzaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hlc1tzaWRdID0gbWF0Y2htYWtpbmdRdWV1ZTI1W2ldLnNpZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NhbiBjYWxsIGdvU2VydmVyL3JlZ2lzdGVyUGFpciBoZXJlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJhdHRlbXB0aW5nIHJlZ2lzdGVyIHBhaXIgXCIgKyBzaWQgKyBcIiwgXCIgKyBtYXRjaG1ha2luZ1F1ZXVlMjVbaV0uc2lkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goXCJodHRwOi8vbG9jYWxob3N0OjgwODAvcmVnaXN0ZXJQYWlyXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSWQxOiBzaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJZDI6IG1hdGNobWFraW5nUXVldWUyNVtpXS5zaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pOyAvL1RPRE8gLSBDaGVjayByZXNwb25zZSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZS5zdGF0dXMpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jYW4gcHJvYmFibHkgZWxpbWluYXRlIHRoaXMsIG1haW4gcHVycG9zZSBvZiB0aGlzIGFwaVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vbWV0aG9kIGlzIHRvIG1hdGNoIHVzZXJzIGFuZCByZWdpc3RlciB0aGVtIHdpdGggdGhlIGdvIHNlcnZlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcm5hbWU6IHNpZHNbc2lkXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxvUmF0aW5nOiBtYXRjaG1ha2luZ1VzZXIuZWxvUmF0aW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHBvbmVudFVzZXJuYW1lOiBzaWRzW21hdGNobWFraW5nUXVldWUyNVtpXS5zaWRdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHBvbmVudEVsb1JhdGluZzogbWF0Y2htYWtpbmdRdWV1ZTI1W2ldLmVsb1JhdGluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNobWFraW5nUXVldWUyNS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2htYWtpbmdRdWV1ZTI1LnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kTWF0Y2ggPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICghZm91bmRNYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgZGVsYXkoMTAwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2lkIGluIG1hdGNoZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgb3Bwb25lbnRVc2VybmFtZSA9IHNpZHNbbWF0Y2hlc1tzaWRdXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHVzZXJuYW1lUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgZWxvX3JhdGluZyBmcm9tIHVzZXJzIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIHVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBvcHBvbmVudEVsb1JhdGluZyA9IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMF0gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJuYW1lOiBzaWRzW3NpZF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZzogbWF0Y2htYWtpbmdVc2VyLmVsb1JhdGluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3Bwb25lbnRVc2VybmFtZTogb3Bwb25lbnRVc2VybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3Bwb25lbnRFbG9SYXRpbmc6IG9wcG9uZW50RWxvUmF0aW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmRNYXRjaCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLmdldChcIi9hcGkvbG9nb3V0XCIsIGFzeW5jIChjb250ZXh0KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgc2lkID0gYXdhaXQgY29udGV4dC5jb29raWVzLmdldCgnc2lkJyk7XG4gICAgICAgICAgICBpZiAoc2lkICYmIHR5cGVvZiBzaWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHNpZHNbc2lkIGFzIHN0cmluZ107XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0geyB0ZXh0OiAnU3VjY2Vzc2Z1bGx5IExvZ2dlZCBPdXQnIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLnBvc3QoXCIvYXBpL3J1blwiLCBhc3luYyAoY29udGV4dDogUm91dGVyQ29udGV4dDxhbnk+KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoIWNvbnRleHQucmVxdWVzdC5oYXNCb2R5KSB7XG4gICAgICAgICAgICAgICAgY29udGV4dC50aHJvdyhTdGF0dXMuQmFkUmVxdWVzdCwgXCJCYWQgUmVxdWVzdFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBjb250ZXh0LnJlcXVlc3QuYm9keSgpO1xuICAgICAgICAgICAgbGV0IGNvZGU6IFBhcnRpYWw8Q29kZVN1Ym1pc3Npb24+IHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgaWYgKGJvZHkudHlwZSA9PT0gXCJqc29uXCIpIHtcbiAgICAgICAgICAgICAgICBjb2RlID0gYXdhaXQgYm9keS52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjb2RlKSB7XG4gICAgICAgICAgICAgICAgY29udGV4dC5hc3NlcnQodHlwZW9mIGNvZGU/LnZhbHVlID09PSBcInN0cmluZ1wiLCBTdGF0dXMuQmFkUmVxdWVzdCk7XG4gICAgICAgICAgICAgICAgY29udGV4dC5hc3NlcnQodHlwZW9mIGNvZGU/LmlucHV0ID09PSBcInN0cmluZ1wiLCBTdGF0dXMuQmFkUmVxdWVzdCk7XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5zdGF0dXMgPSBTdGF0dXMuT0s7XG4gICAgICAgICAgICAgICAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKFwiLi9zYW5kYm94L2Fuc3dlci5weVwiLCBjb2RlLnZhbHVlKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoXCIuL3NhbmRib3gvYW5zd2VyQ3VzdG9tSW5wdXQucHlcIiwgY29kZS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgbGV0IGlucHV0TGluZXM6IHN0cmluZ1tdID0gY29kZS5pbnB1dC5zcGxpdCgnXFxuJyk7XG4gICAgICAgICAgICAgICAgbGV0IGN1c3RvbUlucHV0Q29udGVudDogc3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgY3VzdG9tSW5wdXRDb250ZW50ICs9IHBhcnNlSW50KGlucHV0TGluZXNbMV0pLnRvU3RyaW5nKCkgKyAnXFxuJztcbiAgICAgICAgICAgICAgICBsZXQgaW5wdXRDb21tYVNlcGFyYXRlZFZhbHVlczogc3RyaW5nW10gPSBpbnB1dExpbmVzWzBdLnNwbGl0KCdbJylbMV0uc3BsaXQoJ10nKVswXS5zcGxpdCgnLCcpO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRDb21tYVNlcGFyYXRlZFZhbHVlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICBjdXN0b21JbnB1dENvbnRlbnQgKz0gcGFyc2VJbnQoaW5wdXRDb21tYVNlcGFyYXRlZFZhbHVlc1tpXSkudG9TdHJpbmcoKSArICdcXG4nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoXCIuL3NhbmRib3gvY3VzdG9tSW5wdXQuaW5cIiwgY3VzdG9tSW5wdXRDb250ZW50KTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXBvcnRQcm9jZXNzID0gRGVuby5ydW4oe1xuICAgICAgICAgICAgICAgICAgICBjbWQ6IFtcIi4vbWFrZVJlcG9ydC5zaFwiXSxcbiAgICAgICAgICAgICAgICAgICAgY3dkOiBcIi4vc2FuZGJveFwiLFxuICAgICAgICAgICAgICAgICAgICBzdGRvdXQ6IFwicGlwZWRcIlxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGF3YWl0IHJlcG9ydFByb2Nlc3Mub3V0cHV0KCk7XG4gICAgICAgICAgICAgICAgbGV0IGpzb25SZXN1bHRzOiBTdHJpbmcgPSBhd2FpdCBEZW5vLnJlYWRUZXh0RmlsZShcIi4vc2FuZGJveC9yZXBvcnRGcm9tUHlTYW5kYm94LnR4dFwiKTtcbiAgICAgICAgICAgICAgICBsZXQgc3RhbmRhcmRPdXRwdXRSZXN1bHRzOiBzdHJpbmcgPSBhd2FpdCBEZW5vLnJlYWRUZXh0RmlsZShcIi4vc2FuZGJveC9zdGFuZGFyZE91dHB1dEZyb21QeVNhbmRib3gudHh0XCIpO1xuICAgICAgICAgICAgICAgIGxldCBvdXRwdXRSZXN1bHRzOiBzdHJpbmcgPSBhd2FpdCBEZW5vLnJlYWRUZXh0RmlsZShcIi4vc2FuZGJveC9vdXRwdXRGcm9tUHlTYW5kYm94LnR4dFwiKTtcbiAgICAgICAgICAgICAgICBqc29uUmVzdWx0cyA9IGpzb25SZXN1bHRzLnJlcGxhY2UoL1xccy9nLCBcIlwiKTtcbiAgICAgICAgICAgICAgICBqc29uUmVzdWx0cyA9IGpzb25SZXN1bHRzLnN1YnN0cmluZygwLCBqc29uUmVzdWx0cy5sZW5ndGggLSAyKSArIFwiXVwiXG4gICAgICAgICAgICAgICAgbGV0IHRlc3RSZXN1bHRzOiBUZXN0UmVzdWx0W10gID0gSlNPTi5wYXJzZShqc29uUmVzdWx0cy50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICBsZXQgdGVzdENhc2VzUGFzc2VkOiBUZXN0Q2FzZXNQYXNzZWQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHRlc3RDYXNlc1Bhc3NlZDogdGVzdFJlc3VsdHMubWFwKCh0cjogVGVzdFJlc3VsdCkgPT4gdHIucGFzc2VkKSxcbiAgICAgICAgICAgICAgICAgICAgc3RhbmRhcmRPdXRwdXQ6IHN0YW5kYXJkT3V0cHV0UmVzdWx0cyxcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0OiBvdXRwdXRSZXN1bHRzLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0gdGVzdENhc2VzUGFzc2VkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH1cbiAgICB9KTtcbmFwcC51c2Uocm91dGVyLnJvdXRlcygpKTtcbmFwcC51c2Uocm91dGVyLmFsbG93ZWRNZXRob2RzKCkpO1xuYXBwLnVzZShhc3luYyAoY29udGV4dCkgPT4ge1xuICAgIGlmICghY29udGV4dC5yZXF1ZXN0LnVybC5wYXRobmFtZS5lbmRzV2l0aCgnLmpzJylcbiAgICAgICAgJiYgIWNvbnRleHQucmVxdWVzdC51cmwucGF0aG5hbWUuZW5kc1dpdGgoJy5wbmcnKVxuICAgICAgICAmJiAhY29udGV4dC5yZXF1ZXN0LnVybC5wYXRobmFtZS5lbmRzV2l0aCgnLmljbycpXG4gICAgICAgICYmICFjb250ZXh0LnJlcXVlc3QudXJsLnBhdGhuYW1lLmVuZHNXaXRoKCcudHh0JykpXHR7XG4gICAgICAgIGNvbnRleHQucmVxdWVzdC51cmwucGF0aG5hbWUgPSAnLyc7XG4gICAgfVxuICAgIGF3YWl0IGNvbnRleHQuc2VuZCh7XG4gICAgICAgIHJvb3Q6IGAke0Rlbm8uY3dkKCl9L3JlYWN0LWFwcC9idWlsZGAsXG4gICAgICAgIGluZGV4OiBcImluZGV4Lmh0bWxcIixcbiAgICB9KTtcbn0pO1xuY29uc29sZS5sb2coXCJSdW5uaW5nIG9uIHBvcnRcIiwgcG9ydCk7XG5hd2FpdCBhcHAubGlzdGVuKHsgcG9ydCB9KTtcbiJdfQ==