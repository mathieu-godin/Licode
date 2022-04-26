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
const numQuestionsPerMatch = 3;
let helloWorldVar = { text: 'Hello World' };
let sids = {};
let sidsProgress = {};
let sidsQuestions = {};
let matchmakingQueue25 = [];
let matchmakingQueue50 = [];
let matchmakingQueue100 = [];
let matchmakingQueue200 = [];
let matchmakingQueue500 = [];
let matches = {};
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}
async function selectQuestions(matchmakingUser) {
    await client.connect();
    const questionsResult = await client.queryArray("select count(*) from questions");
    let numQuestions = Number(questionsResult.rows[0][0]);
    await client.end();
    let questionsSelected = [];
    let randomPermutation = [];
    for (let i = 0; i < numQuestions; ++i) {
        randomPermutation[i] = i;
    }
    for (let i = 0; i < numQuestionsPerMatch; ++i) {
        let j = Math.floor(Math.random() * numQuestions);
        [randomPermutation[i], randomPermutation[j]] = [randomPermutation[j], randomPermutation[i]];
    }
    for (let i = 0; i < numQuestionsPerMatch; ++i) {
        questionsSelected.push(randomPermutation[i] + 1);
    }
    sidsQuestions[matchmakingUser.sid] = questionsSelected;
    sidsQuestions[matches[matchmakingUser.sid]] = questionsSelected;
}
async function addToQueue(queue, matchmakingUser, range, context) {
    queue.push(matchmakingUser);
    for (let i = 0; i < queue.length; ++i) {
        if (queue[i].sid != matchmakingUser.sid
            && Math.abs(matchmakingUser.eloRating - queue[i].eloRating) <= range) {
            matches[queue[i].sid] = matchmakingUser.sid;
            matches[matchmakingUser.sid] = queue[i].sid;
            sidsProgress[queue[i].sid] = 0;
            sidsProgress[matchmakingUser.sid] = 0;
            console.log("attempting register pair " + matchmakingUser.sid + ", " + queue[i].sid);
            const response = await fetch("http://localhost:5000/registerPair", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Id1: matchmakingUser.sid,
                    Id2: queue[i].sid,
                }),
            });
            console.log(response.status);
            context.response.body = {
                username: sids[matchmakingUser.sid],
                eloRating: matchmakingUser.eloRating,
                opponentUsername: sids[queue[i].sid],
                opponentEloRating: queue[i].eloRating,
            };
            queue.splice(i, 1);
            queue.pop();
            selectQuestions(matchmakingUser);
            return true;
        }
    }
    return false;
}
async function checkIfFoundInQueue(delayTime, matchmakingUser, username, context) {
    await delay(delayTime);
    if (matchmakingUser.sid in matches) {
        let opponentUsername = sids[matches[matchmakingUser.sid]];
        await client.connect();
        const usernameResult = await client.queryArray("select elo_rating from users where username='"
            + username + "'");
        let opponentEloRating = usernameResult.rows[0][0];
        await client.end();
        context.response.body = {
            username: sids[matchmakingUser.sid],
            eloRating: matchmakingUser.eloRating,
            opponentUsername: opponentUsername,
            opponentEloRating: opponentEloRating,
        };
        return true;
    }
    return false;
}
function removeFromQueue(queue, sid) {
    for (let i = 0; i < queue.length; ++i) {
        if (queue[i].sid === sid) {
            queue.splice(i, 1);
        }
    }
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
    .get("/api/question", async (context) => {
    try {
        let sid = await context.cookies.get('sid');
        if (sid && typeof sid === 'string') {
            await client.connect();
            const questionResult = await client.queryArray("select question, function_signature, default_custom_input from questions where id = "
                + sidsQuestions[sid][sidsProgress[sid]].toString());
            const responseBody = {
                question: questionResult.rows[0][0],
                function_signature: questionResult.rows[0][1],
                default_custom_input: questionResult.rows[0][2],
            };
            context.response.body = responseBody;
            await client.end();
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
                let queues = [matchmakingQueue25, matchmakingQueue50, matchmakingQueue100, matchmakingQueue200];
                let ranges = [25, 50, 100, 200];
                let delayTimesNums = [1, 5, 10, 60];
                let foundMatch = false;
                for (let i = 0; i < queues.length; ++i) {
                    if (foundMatch = await addToQueue(queues[i], matchmakingUser, ranges[i], context)) {
                        break;
                    }
                    else {
                        for (let j = 0; j < delayTimesNums[i]; ++j) {
                            if (foundMatch = await checkIfFoundInQueue(1000, matchmakingUser, username, context)) {
                                break;
                            }
                        }
                        if (foundMatch) {
                            break;
                        }
                        removeFromQueue(queues[i], sid);
                    }
                }
                if (!foundMatch && !addToQueue(matchmakingQueue500, matchmakingUser, 500, context)) {
                    while (!(await checkIfFoundInQueue(1000, matchmakingUser, username, context))) { }
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
        let sid = await context.cookies.get('sid');
        if (sid && typeof sid === 'string') {
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
                if (!testCasesPassed.testCasesPassed.some(element => !element) && ++sidsProgress[sid] === 3) {
                    let opponentSid = matches[sid];
                    delete matches[sid];
                    delete matches[opponentSid];
                    delete sidsProgress[sid];
                    delete sidsProgress[opponentSid];
                    let numWins, numGames, eloRating, has2400RatingHistory = false, opponentNumLosses, opponentNumGames, opponentEloRating, opponentHas2400RatingHistory = false;
                    let username = sids[sid];
                    if (username) {
                        await client.connect();
                        const usernameResult = await client.queryArray("select num_wins, num_losses, elo_rating, has_2400_rating_history from users where username='"
                            + username + "'");
                        numWins = usernameResult.rows[0][0];
                        numGames = numWins + usernameResult.rows[0][1];
                        eloRating = usernameResult.rows[0][2];
                        has2400RatingHistory = usernameResult.rows[0][3];
                        await client.end();
                        let opponentUsername = sids[opponentSid];
                        if (opponentUsername) {
                            await client.connect();
                            const usernameResult = await client.queryArray("select num_wins, num_losses, elo_rating, has_2400_rating_history from users where username='"
                                + opponentUsername + "'");
                            opponentNumLosses = usernameResult.rows[0][1];
                            opponentNumGames = usernameResult.rows[0][0] + opponentNumLosses;
                            opponentEloRating = usernameResult.rows[0][2];
                            opponentHas2400RatingHistory = usernameResult.rows[0][3];
                            await client.end();
                            ++numWins;
                            let eloRatingVariation = 1 - 1.0 / (1 + Math.pow(10, (opponentEloRating - eloRating) / 400.0));
                            eloRating += Math.floor((numGames < 30 ? (eloRating < 2300 ? 40 : 20) : (has2400RatingHistory ? 10 : 20)) * eloRatingVariation);
                            ++opponentNumLosses;
                            opponentEloRating -= Math.ceil((opponentNumGames < 30 ? (opponentEloRating < 2300 ? 40 : 20) : (opponentHas2400RatingHistory ? 10 : 20))
                                * eloRatingVariation);
                            if (username) {
                                await client.connect();
                                await client.queryArray("update users set num_wins = " + numWins.toString()
                                    + ", elo_rating = " + eloRating.toString() + ", has_2400_rating_history = "
                                    + (has2400RatingHistory || eloRating >= 2400).toString() + " where username='"
                                    + username + "'");
                                await client.end();
                            }
                            if (opponentUsername) {
                                await client.connect();
                                await client.queryArray("update users set num_losses = " + opponentNumLosses.toString()
                                    + ", elo_rating = " + opponentEloRating.toString() + ", has_2400_rating_history = "
                                    + (opponentHas2400RatingHistory || opponentEloRating >= 2400).toString() + " where username='"
                                    + opponentUsername + "'");
                                await client.end();
                            }
                        }
                    }
                }
                context.response.body = testCasesPassed;
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDSCxXQUFXLEVBQ1gsTUFBTSxFQUVOLE1BQU0sR0FFVCxNQUFNLGdDQUFnQyxDQUFDO0FBTXhDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSw2Q0FBNkMsQ0FBQztBQUNyRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sNkNBQTZDLENBQUM7QUFDckUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLDRDQUE0QyxDQUFBO0FBQ25FLE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDO0lBQ3RCLElBQUksRUFBRSxRQUFRO0lBQ2QsUUFBUSxFQUFFLFFBQVE7SUFDbEIsUUFBUSxFQUFFLFFBQVE7SUFDbEIsUUFBUSxFQUFFLFdBQVc7SUFDckIsSUFBSSxFQUFFLElBQUk7SUFDVixHQUFHLEVBQUU7UUFDRCxPQUFPLEVBQUUsS0FBSztRQUNkLE9BQU8sRUFBRSxLQUFLO0tBQ2pCO0NBQ0osQ0FBQyxDQUFDO0FBQ0gsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNoQyxNQUFNLEdBQUcsR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFDO0FBQzlCLE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7QUEyQjVCLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxDQUFDO0FBRS9CLElBQUksYUFBYSxHQUFlLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxDQUFDO0FBRXhELElBQUksSUFBSSxHQUErQixFQUFFLENBQUM7QUFFMUMsSUFBSSxZQUFZLEdBQStCLEVBQUUsQ0FBQztBQUVsRCxJQUFJLGFBQWEsR0FBaUMsRUFBRSxDQUFDO0FBRXJELElBQUksa0JBQWtCLEdBQXNCLEVBQUUsQ0FBQztBQUMvQyxJQUFJLGtCQUFrQixHQUFzQixFQUFFLENBQUM7QUFDL0MsSUFBSSxtQkFBbUIs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LFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRTtRQUNuRCxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDO0tBQ3RDO0lBQ0QsTUFBTSxPQUFPLENBQUMsSUFBSSxDQUFDO1FBQ2YsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxrQkFBa0I7UUFDckMsS0FBSyxFQUFFLFlBQVk7S0FDdEIsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFDLENBQUM7QUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3JDLE1BQU0sR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICAgIEFwcGxpY2F0aW9uLFxuICAgIFJvdXRlcixcbiAgICBSb3V0ZXJDb250ZXh0LFxuICAgIFN0YXR1cyxcbiAgICBzZW5kLFxufSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9vYWsvbW9kLnRzXCI7XG5cbmltcG9ydCB7IE1hdGNobWFraW5nRGF0YSB9IGZyb20gXCIuL3JlYWN0LWFwcC9zcmMvY29tcG9uZW50cy9jb21tb24vaW50ZXJmYWNlcy9tYXRjaG1ha2luZ0RhdGEudHNcIjtcbmltcG9ydCB7IFF1ZXN0aW9uRGF0YSB9IGZyb20gXCIuL3JlYWN0LWFwcC9zcmMvY29tcG9uZW50cy9jb21tb24vaW50ZXJmYWNlcy9tYXRjaG1ha2luZ0RhdGEudHNcIjtcbmltcG9ydCB7IFRlc3RDYXNlc1Bhc3NlZCB9IGZyb20gXCIuL3JlYWN0LWFwcC9zcmMvY29tcG9uZW50cy9jb21tb24vaW50ZXJmYWNlcy9tYXRjaG1ha2luZ0RhdGEudHNcIjtcblxuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3gvcG9zdGdyZXNAdjAuMTUuMC9tb2QudHNcIjtcbmltcG9ydCB7IGNyeXB0byB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4xMzIuMC9jcnlwdG8vbW9kLnRzXCI7XG5pbXBvcnQgeyBuYW5vaWQgfSBmcm9tICdodHRwczovL2Rlbm8ubGFuZC94L25hbm9pZEB2My4wLjAvYXN5bmMudHMnXG5jb25zdCBjbGllbnQgPSBuZXcgQ2xpZW50KHtcbiAgICB1c2VyOiBcImxpY29kZVwiLFxuICAgIGRhdGFiYXNlOiBcImxpY29kZVwiLFxuICAgIHBhc3N3b3JkOiBcImVkb2NpbFwiLFxuICAgIGhvc3RuYW1lOiBcImxvY2FsaG9zdFwiLFxuICAgIHBvcnQ6IDU0MzIsXG4gICAgdGxzOiB7XG4gICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICBlbmZvcmNlOiBmYWxzZSxcbiAgICB9LFxufSk7XG5jb25zdCBlbnYgPSBEZW5vLmVudi50b09iamVjdCgpO1xuY29uc3QgYXBwID0gbmV3IEFwcGxpY2F0aW9uKCk7XG5jb25zdCByb3V0ZXIgPSBuZXcgUm91dGVyKCk7XG5cbmludGVyZmFjZSBIZWxsb1dvcmxkIHtcbiAgICB0ZXh0OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBVc2VyIHtcbiAgICBlbWFpbDogeyB2YWx1ZTogc3RyaW5nIH07XG4gICAgdXNlcm5hbWU6IHsgdmFsdWU6IHN0cmluZyB9O1xuICAgIHBhc3N3b3JkOiB7IHZhbHVlOiBzdHJpbmcgfTtcbn1cblxuaW50ZXJmYWNlIE1hdGNobWFraW5nVXNlciB7XG4gICAgZWxvUmF0aW5nOiBudW1iZXI7XG4gICAgc2lkOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBDb2RlU3VibWlzc2lvbiB7XG4gICAgdmFsdWU6IHN0cmluZztcbiAgICBpbnB1dDogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgVGVzdFJlc3VsdCB7XG4gICAgdGVzdE5hbWU6IHN0cmluZyxcbiAgICBwYXNzZWQ6IGJvb2xlYW5cbn1cblxuY29uc3QgbnVtUXVlc3Rpb25zUGVyTWF0Y2ggPSAzO1xuXG5sZXQgaGVsbG9Xb3JsZFZhcjogSGVsbG9Xb3JsZCA9IHsgdGV4dDogJ0hlbGxvIFdvcmxkJyB9O1xuXG5sZXQgc2lkczogeyBbbmFtZTogc3RyaW5nXTogc3RyaW5nIH0gPSB7fTtcblxubGV0IHNpZHNQcm9ncmVzczogeyBbbmFtZTogc3RyaW5nXTogbnVtYmVyIH0gPSB7fTtcblxubGV0IHNpZHNRdWVzdGlvbnM6IHsgW25hbWU6IHN0cmluZ106IG51bWJlcltdIH0gPSB7fTtcblxubGV0IG1hdGNobWFraW5nUXVldWUyNTogTWF0Y2htYWtpbmdVc2VyW10gPSBbXTtcbmxldCBtYXRjaG1ha2luZ1F1ZXVlNTA6IE1hdGNobWFraW5nVXNlcltdID0gW107XG5sZXQgbWF0Y2htYWtpbmdRdWV1ZTEwMDogTWF0Y2htYWtpbmdVc2VyW10gPSBbXTtcbmxldCBtYXRjaG1ha2luZ1F1ZXVlMjAwOiBNYXRjaG1ha2luZ1VzZXJbXSA9IFtdO1xubGV0IG1hdGNobWFraW5nUXVldWU1MDA6IE1hdGNobWFraW5nVXNlcltdID0gW107XG5cbmxldCBtYXRjaGVzOiB7IFtuYW1lOiBzdHJpbmddOiBzdHJpbmcgfSA9IHt9O1xuXG5mdW5jdGlvbiBkZWxheSh0aW1lOiBudW1iZXIpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHRpbWUpKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc2VsZWN0UXVlc3Rpb25zKG1hdGNobWFraW5nVXNlcjogTWF0Y2htYWtpbmdVc2VyKSB7XG4gICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICBjb25zdCBxdWVzdGlvbnNSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBjb3VudCgqKSBmcm9tIHF1ZXN0aW9uc1wiKTtcbiAgICBsZXQgbnVtUXVlc3Rpb25zID0gTnVtYmVyKHF1ZXN0aW9uc1Jlc3VsdC5yb3dzWzBdWzBdIGFzIG51bWJlcik7XG4gICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgIGxldCBxdWVzdGlvbnNTZWxlY3RlZDogbnVtYmVyW10gPSBbXTtcbiAgICBsZXQgcmFuZG9tUGVybXV0YXRpb246IG51bWJlcltdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1RdWVzdGlvbnM7ICsraSkge1xuICAgICAgICByYW5kb21QZXJtdXRhdGlvbltpXSA9IGk7XG4gICAgfVxuICAgIC8vIFBhcnRpYWwgRmlzaGVyLVlhdGVzIEFsZ29yaXRobSBmb3IgcmFuZG9tIHNlbGVjdGlvbiBvZiBxdWVzdGlvbnNcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVF1ZXN0aW9uc1Blck1hdGNoOyArK2kpIHtcbiAgICAgICAgbGV0IGogPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBudW1RdWVzdGlvbnMpO1xuICAgICAgICBbcmFuZG9tUGVybXV0YXRpb25baV0sIHJhbmRvbVBlcm11dGF0aW9uW2pdXSA9IFtyYW5kb21QZXJtdXRhdGlvbltqXSwgcmFuZG9tUGVybXV0YXRpb25baV1dO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVF1ZXN0aW9uc1Blck1hdGNoOyArK2kpIHtcbiAgICAgICAgcXVlc3Rpb25zU2VsZWN0ZWQucHVzaChyYW5kb21QZXJtdXRhdGlvbltpXSArIDEpO1xuICAgIH1cbiAgICBzaWRzUXVlc3Rpb25zW21hdGNobWFraW5nVXNlci5zaWRdID0gcXVlc3Rpb25zU2VsZWN0ZWQ7XG4gICAgc2lkc1F1ZXN0aW9uc1ttYXRjaGVzW21hdGNobWFraW5nVXNlci5zaWRdXSA9IHF1ZXN0aW9uc1NlbGVjdGVkO1xufVxuXG5hc3luYyBmdW5jdGlvbiBhZGRUb1F1ZXVlIChxdWV1ZTogTWF0Y2htYWtpbmdVc2VyW10sIG1hdGNobWFraW5nVXNlcjogTWF0Y2htYWtpbmdVc2VyLCByYW5nZTogbnVtYmVyLCBjb250ZXh0OiBhbnkpIHtcbiAgICBxdWV1ZS5wdXNoKG1hdGNobWFraW5nVXNlcik7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBxdWV1ZS5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAocXVldWVbaV0uc2lkICE9IG1hdGNobWFraW5nVXNlci5zaWRcbiAgICAgICAgICAgICAgICAmJiBNYXRoLmFicyhtYXRjaG1ha2luZ1VzZXIuZWxvUmF0aW5nIC0gcXVldWVbaV0uZWxvUmF0aW5nKSA8PSByYW5nZSkge1xuICAgICAgICAgICAgbWF0Y2hlc1txdWV1ZVtpXS5zaWRdID0gbWF0Y2htYWtpbmdVc2VyLnNpZDtcbiAgICAgICAgICAgIG1hdGNoZXNbbWF0Y2htYWtpbmdVc2VyLnNpZF0gPSBxdWV1ZVtpXS5zaWQ7XG4gICAgICAgICAgICBzaWRzUHJvZ3Jlc3NbcXVldWVbaV0uc2lkXSA9IDA7XG4gICAgICAgICAgICBzaWRzUHJvZ3Jlc3NbbWF0Y2htYWtpbmdVc2VyLnNpZF0gPSAwO1xuICAgICAgICAgICAgLy9jYW4gY2FsbCBnb1NlcnZlci9yZWdpc3RlclBhaXIgaGVyZVxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJhdHRlbXB0aW5nIHJlZ2lzdGVyIHBhaXIgXCIgKyBtYXRjaG1ha2luZ1VzZXIuc2lkICsgXCIsIFwiICsgcXVldWVbaV0uc2lkKVxuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChcImh0dHA6Ly9sb2NhbGhvc3Q6NTAwMC9yZWdpc3RlclBhaXJcIiwge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICAgICBJZDE6IG1hdGNobWFraW5nVXNlci5zaWQsXG4gICAgICAgICAgICAgICAgICAgIElkMjogcXVldWVbaV0uc2lkLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgfSk7IC8vVE9ETyAtIENoZWNrIHJlc3BvbnNlIFxuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2Uuc3RhdHVzKTtcbiAgICAgICAgICAgIC8vY2FuIHByb2JhYmx5IGVsaW1pbmF0ZSB0aGlzLCBtYWluIHB1cnBvc2Ugb2YgdGhpcyBhcGlcbiAgICAgICAgICAgIC8vbWV0aG9kIGlzIHRvIG1hdGNoIHVzZXJzIGFuZCByZWdpc3RlciB0aGVtIHdpdGggdGhlIGdvIHNlcnZlclxuICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0ge1xuICAgICAgICAgICAgICAgIHVzZXJuYW1lOiBzaWRzW21hdGNobWFraW5nVXNlci5zaWRdLFxuICAgICAgICAgICAgICAgIGVsb1JhdGluZzogbWF0Y2htYWtpbmdVc2VyLmVsb1JhdGluZyxcbiAgICAgICAgICAgICAgICBvcHBvbmVudFVzZXJuYW1lOiBzaWRzW3F1ZXVlW2ldLnNpZF0sXG4gICAgICAgICAgICAgICAgb3Bwb25lbnRFbG9SYXRpbmc6IHF1ZXVlW2ldLmVsb1JhdGluZyxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBxdWV1ZS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICBxdWV1ZS5wb3AoKTtcbiAgICAgICAgICAgIHNlbGVjdFF1ZXN0aW9ucyhtYXRjaG1ha2luZ1VzZXIpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5hc3luYyBmdW5jdGlvbiBjaGVja0lmRm91bmRJblF1ZXVlKGRlbGF5VGltZTogbnVtYmVyLCBtYXRjaG1ha2luZ1VzZXI6IE1hdGNobWFraW5nVXNlciwgdXNlcm5hbWU6IHN0cmluZywgY29udGV4dDogYW55KSB7XG4gICAgYXdhaXQgZGVsYXkoZGVsYXlUaW1lKTtcbiAgICBpZiAobWF0Y2htYWtpbmdVc2VyLnNpZCBpbiBtYXRjaGVzKSB7XG4gICAgICAgIGxldCBvcHBvbmVudFVzZXJuYW1lID0gc2lkc1ttYXRjaGVzW21hdGNobWFraW5nVXNlci5zaWRdXTtcbiAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgY29uc3QgdXNlcm5hbWVSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBlbG9fcmF0aW5nIGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICArIHVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICBsZXQgb3Bwb25lbnRFbG9SYXRpbmcgPSB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzBdIGFzIG51bWJlcjtcbiAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7XG4gICAgICAgICAgICB1c2VybmFtZTogc2lkc1ttYXRjaG1ha2luZ1VzZXIuc2lkXSxcbiAgICAgICAgICAgIGVsb1JhdGluZzogbWF0Y2htYWtpbmdVc2VyLmVsb1JhdGluZyxcbiAgICAgICAgICAgIG9wcG9uZW50VXNlcm5hbWU6IG9wcG9uZW50VXNlcm5hbWUsXG4gICAgICAgICAgICBvcHBvbmVudEVsb1JhdGluZzogb3Bwb25lbnRFbG9SYXRpbmcsXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUZyb21RdWV1ZShxdWV1ZTogTWF0Y2htYWtpbmdVc2VyW10sIHNpZDogc3RyaW5nKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBxdWV1ZS5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAocXVldWVbaV0uc2lkID09PSBzaWQpIHtcbiAgICAgICAgICAgIHF1ZXVlLnNwbGljZShpLCAxKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuY29uc3QgcG9ydDogbnVtYmVyID0gK2Vudi5MSUNPREVfUE9SVCB8fCAzMDAwO1xuYXBwLmFkZEV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLCAoZXZ0KSA9PiB7XG4gICAgY29uc29sZS5sb2coZXZ0LmVycm9yKTtcbn0pO1xucm91dGVyXG4gICAgLmdldChcIi9hcGkvaGVsbG8td29ybGRcIiwgKGNvbnRleHQpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IGhlbGxvV29ybGRWYXI7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLnBvc3QoXCIvYXBpL3Bvc3QtaGVsbG8td29ybGRcIiwgYXN5bmMgKGNvbnRleHQ6IFJvdXRlckNvbnRleHQ8YW55PikgPT4ge1xuICAgICAgICBpZiAoIWNvbnRleHQucmVxdWVzdC5oYXNCb2R5KSB7XG4gICAgICAgICAgICBjb250ZXh0LnRocm93KFN0YXR1cy5CYWRSZXF1ZXN0LCBcIkJhZCBSZXF1ZXN0XCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJvZHkgPSBjb250ZXh0LnJlcXVlc3QuYm9keSgpO1xuICAgICAgICBsZXQgaGVsbG9Xb3JsZDogUGFydGlhbDxIZWxsb1dvcmxkPiB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGJvZHkudHlwZSA9PT0gXCJqc29uXCIpIHtcbiAgICAgICAgICAgIGhlbGxvV29ybGQgPSBhd2FpdCBib2R5LnZhbHVlO1xuICAgICAgICB9IGVsc2UgaWYgKGJvZHkudHlwZSA9PT0gXCJmb3JtXCIpIHtcbiAgICAgICAgICAgIGhlbGxvV29ybGQgPSB7fTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIGF3YWl0IGJvZHkudmFsdWUpIHtcbiAgICAgICAgICAgICAgICBoZWxsb1dvcmxkW2tleSBhcyBrZXlvZiBIZWxsb1dvcmxkXSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGJvZHkudHlwZSA9PT0gXCJmb3JtLWRhdGFcIikge1xuICAgICAgICAgICAgY29uc3QgZm9ybURhdGEgPSBhd2FpdCBib2R5LnZhbHVlLnJlYWQoKTtcbiAgICAgICAgICAgIGhlbGxvV29ybGQgPSBmb3JtRGF0YS5maWVsZHM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhlbGxvV29ybGQpIHtcbiAgICAgICAgICAgIGNvbnRleHQuYXNzZXJ0KHR5cGVvZiBoZWxsb1dvcmxkLnRleHQgPT09IFwic3RyaW5nXCIsIFN0YXR1cy5CYWRSZXF1ZXN0KTtcbiAgICAgICAgICAgIGhlbGxvV29ybGRWYXIgPSBoZWxsb1dvcmxkIGFzIEhlbGxvV29ybGQ7XG4gICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLnN0YXR1cyA9IFN0YXR1cy5PSztcbiAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IGhlbGxvV29ybGQ7XG4gICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLnR5cGUgPSBcImpzb25cIjtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb250ZXh0LnRocm93KFN0YXR1cy5CYWRSZXF1ZXN0LCBcIkJhZCBSZXF1ZXN0XCIpO1xuICAgIH0pXG4gICAgLnBvc3QoXCIvYXBpL3JlZ2lzdGVyXCIsIGFzeW5jIChjb250ZXh0OiBSb3V0ZXJDb250ZXh0PGFueT4pID0+IHtcbiAgICAgICAgbGV0IHNpZCA9IGF3YWl0IGNvbnRleHQuY29va2llcy5nZXQoJ3NpZCcpO1xuICAgICAgICBpZiAoIXNpZCkge1xuICAgICAgICAgICAgc2lkID0gYXdhaXQgbmFub2lkKDQwKTtcbiAgICAgICAgICAgIGNvbnRleHQuY29va2llcy5zZXQoJ3NpZCcsIHNpZCk7XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICghY29udGV4dC5yZXF1ZXN0Lmhhc0JvZHkpIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnRocm93KFN0YXR1cy5CYWRSZXF1ZXN0LCBcIkJhZCBSZXF1ZXN0XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgYm9keSA9IGNvbnRleHQucmVxdWVzdC5ib2R5KCk7XG4gICAgICAgICAgICBsZXQgdXNlcjogUGFydGlhbDxVc2VyPiB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmIChib2R5LnR5cGUgPT09IFwianNvblwiKSB7XG4gICAgICAgICAgICAgICAgdXNlciA9IGF3YWl0IGJvZHkudmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgIGNvbnRleHQuYXNzZXJ0KFxuICAgICAgICAgICAgICAgICAgICB0eXBlb2YgdXNlcj8uZW1haWw/LnZhbHVlID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgICAgICYmIHR5cGVvZiB1c2VyPy51c2VybmFtZT8udmFsdWUgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIHVzZXI/LnBhc3N3b3JkPy52YWx1ZSA9PT0gXCJzdHJpbmdcIiwgU3RhdHVzLkJhZFJlcXVlc3QpO1xuICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2Uuc3RhdHVzID0gU3RhdHVzLk9LO1xuICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgdXNlcm5hbWVSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCB1c2VybmFtZSBmcm9tIHVzZXJzIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgICAgICAgICArIHVzZXI/LnVzZXJuYW1lPy52YWx1ZSArIFwiJ1wiKTtcbiAgICAgICAgICAgICAgICBpZiAodXNlcm5hbWVSZXN1bHQucm93cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVtYWlsUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgZW1haWwgZnJvbSB1c2VycyB3aGVyZSBlbWFpbD0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgdXNlcj8uZW1haWw/LnZhbHVlICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZW1haWxSZXN1bHQucm93cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc2FsdEhleFN0cmluZyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzMjsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2FsdEhleFN0cmluZyArPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBNYXRoLnBvdygyLCAzMikpLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzYWx0SGV4U3RyaW5nTGVuZ3RoID0gc2FsdEhleFN0cmluZy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDI1NiAtIHNhbHRIZXhTdHJpbmdMZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNhbHRIZXhTdHJpbmcgPSBcIjBcIiArIHNhbHRIZXhTdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdGV4dEVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXkgPSBuZXcgVWludDhBcnJheShhd2FpdCBjcnlwdG8uc3VidGxlLmRpZ2VzdCgnU0hBMy01MTInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRFbmNvZGVyLmVuY29kZSh1c2VyPy5wYXNzd29yZD8udmFsdWUgKyBzYWx0SGV4U3RyaW5nKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhhc2hlZFBhc3N3b3JkVWludDhBcnJheS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nICs9IChoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXlbaV0gPCAxNiA/IFwiMFwiIDogXCJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXlbaV0udG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nTGVuZ3RoID0gaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMjggLSBoYXNoZWRQYXNzd29yZEhleFN0cmluZ0xlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgPSBcIjBcIiArIGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpbnNlcnQgaW50byBwdWJsaWMudXNlcnMoZW1haWwsIHVzZXJuYW1lLCBoYXNoZWRfcGFzc3dvcmQsIHNhbHQsIG51bV93aW5zLCBudW1fbG9zc2VzLCBjcmVhdGVkX2F0LCB1cGRhdGVkX2F0LCBlbG9fcmF0aW5nLCBoYXNfMjQwMF9yYXRpbmdfaGlzdG9yeSlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgXCIgdmFsdWVzICgnXCIgKyB1c2VyPy5lbWFpbD8udmFsdWUgKyBcIicsICdcIiArIHVzZXI/LnVzZXJuYW1lPy52YWx1ZSArIFwiJywgJ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBcIlxcXFx4XCIgKyBoYXNoZWRQYXNzd29yZEhleFN0cmluZyArIFwiJywgJ1wiICsgXCJcXFxceFwiICsgc2FsdEhleFN0cmluZyArIFwiJywgJzAnLCAnMCcsIG5vdygpLCBub3coKSwgJzEwMDAnLCAnZmFsc2UnKVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzaWQgPSBhd2FpdCBuYW5vaWQoNDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2lkc1tzaWRdID0gdXNlci51c2VybmFtZS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNvbnRleHQuY29va2llcy5zZXQoJ3NpZCcsIHNpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB1c2VyO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0geyB0ZXh0OiAnR2l2ZW4gRW1haWwgQWxyZWFkeSBFeGlzdHMnIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7IHRleHQ6ICdHaXZlbiBVc2VybmFtZSBBbHJlYWR5IEV4aXN0cycgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UudHlwZSA9IFwianNvblwiO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRleHQudGhyb3coU3RhdHVzLkJhZFJlcXVlc3QsIFwiQmFkIFJlcXVlc3RcIik7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLnBvc3QoXCIvYXBpL2xvZ2luXCIsIGFzeW5jIChjb250ZXh0OiBSb3V0ZXJDb250ZXh0PGFueT4pID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICghY29udGV4dC5yZXF1ZXN0Lmhhc0JvZHkpIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnRocm93KFN0YXR1cy5CYWRSZXF1ZXN0LCBcIkJhZCBSZXF1ZXN0XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgYm9keSA9IGNvbnRleHQucmVxdWVzdC5ib2R5KCk7XG4gICAgICAgICAgICBsZXQgdXNlcjogUGFydGlhbDxVc2VyPiB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmIChib2R5LnR5cGUgPT09IFwianNvblwiKSB7XG4gICAgICAgICAgICAgICAgdXNlciA9IGF3YWl0IGJvZHkudmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgIGNvbnRleHQuYXNzZXJ0KFxuICAgICAgICAgICAgICAgICAgICB0eXBlb2YgdXNlcj8uZW1haWw/LnZhbHVlID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgICAgICYmIHR5cGVvZiB1c2VyPy5wYXNzd29yZD8udmFsdWUgPT09IFwic3RyaW5nXCIsIFN0YXR1cy5CYWRSZXF1ZXN0KTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLnN0YXR1cyA9IFN0YXR1cy5PSztcbiAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVzZXJuYW1lUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgZW1haWwsIHVzZXJuYW1lLCBoYXNoZWRfcGFzc3dvcmQsIHNhbHQgZnJvbSB1c2VycyB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgKyB1c2VyPy5lbWFpbD8udmFsdWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgaWYgKHVzZXJuYW1lUmVzdWx0LnJvd3MubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbWFpbFJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IGVtYWlsLCB1c2VybmFtZSwgaGFzaGVkX3Bhc3N3b3JkLCBzYWx0IGZyb20gdXNlcnMgd2hlcmUgZW1haWw9J1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIHVzZXI/LmVtYWlsPy52YWx1ZSArIFwiJ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVtYWlsUmVzdWx0LnJvd3MubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0geyB0ZXh0OiAnR2l2ZW4gRW1haWwgb3IgVXNlcm5hbWUgRG9lcyBOb3QgRXhpc3QnIH07XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc2FsdEhleFN0cmluZyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAoZW1haWxSZXN1bHQucm93c1swXVszXSBhcyBVaW50OEFycmF5KS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNhbHRIZXhTdHJpbmcgKz0gKChlbWFpbFJlc3VsdC5yb3dzWzBdWzNdIGFzIFVpbnQ4QXJyYXkpW2ldIDwgMTYgPyBcIjBcIiA6IFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgKGVtYWlsUmVzdWx0LnJvd3NbMF1bM10gYXMgVWludDhBcnJheSlbaV0udG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHRleHRFbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgY3J5cHRvLnN1YnRsZS5kaWdlc3QoJ1NIQTMtNTEyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0RW5jb2Rlci5lbmNvZGUodXNlcj8ucGFzc3dvcmQ/LnZhbHVlICsgc2FsdEhleFN0cmluZykpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBoYXNoZWRQYXNzd29yZEhleFN0cmluZyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXkubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNoZWRQYXNzd29yZEhleFN0cmluZyArPSAoaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5W2ldIDwgMTYgPyBcIjBcIiA6IFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5W2ldLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzZXJ2ZXJIYXNoZWRQYXNzd29yZEhleFN0cmluZyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAoZW1haWxSZXN1bHQucm93c1swXVsyXSBhcyBVaW50OEFycmF5KS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZlckhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nICs9ICgoZW1haWxSZXN1bHQucm93c1swXVsyXSBhcyBVaW50OEFycmF5KVtpXSA8IDE2ID8gXCIwXCIgOiBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIChlbWFpbFJlc3VsdC5yb3dzWzBdWzJdIGFzIFVpbnQ4QXJyYXkpW2ldLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYXNoZWRQYXNzd29yZEhleFN0cmluZyA9PT0gc2VydmVySGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZm91bmRVc2VyOiBVc2VyID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbWFpbDogeyB2YWx1ZTogZW1haWxSZXN1bHQucm93c1swXVswXSBhcyBzdHJpbmcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcm5hbWU6IHsgdmFsdWU6IGVtYWlsUmVzdWx0LnJvd3NbMF1bMV0gYXMgc3RyaW5nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiB7IHZhbHVlOiAnJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgc2lkID0gYXdhaXQgbmFub2lkKDQwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWRzW3NpZF0gPSBmb3VuZFVzZXIudXNlcm5hbWUudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY29udGV4dC5jb29raWVzLnNldCgnc2lkJywgc2lkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSBmb3VuZFVzZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHsgdGV4dDogJ1dyb25nIFBhc3N3b3JkJyB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNhbHRIZXhTdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAodXNlcm5hbWVSZXN1bHQucm93c1swXVszXSBhcyBVaW50OEFycmF5KS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2FsdEhleFN0cmluZyArPSAoKHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bM10gYXMgVWludDhBcnJheSlbaV0gPCAxNiA/IFwiMFwiIDogXCJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArICh1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzNdIGFzIFVpbnQ4QXJyYXkpW2ldLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBsZXQgdGV4dEVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGhhc2hlZFBhc3N3b3JkVWludDhBcnJheSA9IG5ldyBVaW50OEFycmF5KGF3YWl0IGNyeXB0by5zdWJ0bGUuZGlnZXN0KCdTSEEzLTUxMicsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0RW5jb2Rlci5lbmNvZGUodXNlcj8ucGFzc3dvcmQ/LnZhbHVlICsgc2FsdEhleFN0cmluZykpKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYXNoZWRQYXNzd29yZEhleFN0cmluZyArPSAoaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5W2ldIDwgMTYgPyBcIjBcIiA6IFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXlbaV0udG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGxldCBzZXJ2ZXJIYXNoZWRQYXNzd29yZEhleFN0cmluZyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8ICh1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzJdIGFzIFVpbnQ4QXJyYXkpLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJ2ZXJIYXNoZWRQYXNzd29yZEhleFN0cmluZyArPSAoKHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMl0gYXMgVWludDhBcnJheSlbaV0gPCAxNiA/IFwiMFwiIDogXCJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArICh1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzJdIGFzIFVpbnQ4QXJyYXkpW2ldLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgPT09IHNlcnZlckhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZm91bmRVc2VyOiBVc2VyID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtYWlsOiB7IHZhbHVlOiB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzBdIGFzIHN0cmluZyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJuYW1lOiB7IHZhbHVlOiB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzFdIGFzIHN0cmluZyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiB7IHZhbHVlOiAnJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNpZCA9IGF3YWl0IG5hbm9pZCg0MCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaWRzW3NpZF0gPSBmb3VuZFVzZXIudXNlcm5hbWUudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjb250ZXh0LmNvb2tpZXMuc2V0KCdzaWQnLCBzaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0gZm91bmRVc2VyO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0geyB0ZXh0OiAnV3JvbmcgUGFzc3dvcmQnIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UudHlwZSA9IFwianNvblwiO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRleHQudGhyb3coU3RhdHVzLkJhZFJlcXVlc3QsIFwiQmFkIFJlcXVlc3RcIik7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLmdldChcIi9hcGkvdXNlclwiLCBhc3luYyAoY29udGV4dCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHNpZCA9IGF3YWl0IGNvbnRleHQuY29va2llcy5nZXQoJ3NpZCcpO1xuICAgICAgICAgICAgaWYgKHNpZCAmJiB0eXBlb2Ygc2lkID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGxldCB1c2VybmFtZSA9IHNpZHNbc2lkIGFzIHN0cmluZ107XG4gICAgICAgICAgICAgICAgaWYgKHVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHVzZXJuYW1lUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgZW1haWwsIHVzZXJuYW1lLCBudW1fd2lucywgbnVtX2xvc3NlcywgZWxvX3JhdGluZyBmcm9tIHVzZXJzIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKyB1c2VybmFtZSArIFwiJ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZvdW5kVXNlcjogVXNlciA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVtYWlsOiB7IHZhbHVlOiB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzBdIGFzIHN0cmluZyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlcm5hbWU6IHsgdmFsdWU6IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMV0gYXMgc3RyaW5nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXNzd29yZDogeyB2YWx1ZTogJycgfSxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyOiBmb3VuZFVzZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBudW1XaW5zOiB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzJdIGFzIG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bUxvc3NlczogdXNlcm5hbWVSZXN1bHQucm93c1swXVszXSBhcyBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbG9SYXRpbmc6IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bNF0gYXMgbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH1cbiAgICB9KVxuICAgIC5nZXQoXCIvYXBpL29wcG9uZW50XCIsIGFzeW5jIChjb250ZXh0KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgc2lkID0gYXdhaXQgY29udGV4dC5jb29raWVzLmdldCgnc2lkJyk7XG4gICAgICAgICAgICBpZiAoc2lkICYmIHR5cGVvZiBzaWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgbGV0IHVzZXJuYW1lID0gc2lkc1tzaWQgYXMgc3RyaW5nXTtcbiAgICAgICAgICAgICAgICBsZXQgb3Bwb25lbnRVc2VybmFtZSA9IHNpZHNbbWF0Y2hlc1tzaWQgYXMgc3RyaW5nXSBhcyBzdHJpbmddO1xuICAgICAgICAgICAgICAgIGlmICh1c2VybmFtZSAmJiBvcHBvbmVudFVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHVzZXJuYW1lUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgZWxvX3JhdGluZyBmcm9tIHVzZXJzIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKyB1c2VybmFtZSArIFwiJ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3Bwb25lbnRVc2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IGVsb19yYXRpbmcgZnJvbSB1c2VycyB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgb3Bwb25lbnRVc2VybmFtZSArIFwiJ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VCb2R5IDogTWF0Y2htYWtpbmdEYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgeW91OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcm5hbWU6IHVzZXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZzogdXNlcm5hbWVSZXN1bHQucm93c1swXVswXSBhcyBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2lkOiBzaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgb3Bwb25lbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogb3Bwb25lbnRVc2VybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbG9SYXRpbmc6IG9wcG9uZW50VXNlcm5hbWVSZXN1bHQucm93c1swXVswXSBhcyBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2lkOiAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0gcmVzcG9uc2VCb2R5O1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH1cbiAgICB9KVxuICAgIC5nZXQoXCIvYXBpL3F1ZXN0aW9uXCIsIGFzeW5jIChjb250ZXh0KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgc2lkID0gYXdhaXQgY29udGV4dC5jb29raWVzLmdldCgnc2lkJyk7XG4gICAgICAgICAgICBpZiAoc2lkICYmIHR5cGVvZiBzaWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBxdWVzdGlvblJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IHF1ZXN0aW9uLCBmdW5jdGlvbl9zaWduYXR1cmUsIGRlZmF1bHRfY3VzdG9tX2lucHV0IGZyb20gcXVlc3Rpb25zIHdoZXJlIGlkID0gXCJcbiAgICAgICAgICAgICAgICAgICAgKyBzaWRzUXVlc3Rpb25zW3NpZF1bc2lkc1Byb2dyZXNzW3NpZF1dLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlQm9keSA6IFF1ZXN0aW9uRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgcXVlc3Rpb246IHF1ZXN0aW9uUmVzdWx0LnJvd3NbMF1bMF0gYXMgc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbl9zaWduYXR1cmU6IHF1ZXN0aW9uUmVzdWx0LnJvd3NbMF1bMV0gYXMgc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0X2N1c3RvbV9pbnB1dDogcXVlc3Rpb25SZXN1bHQucm93c1swXVsyXSBhcyBzdHJpbmcsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSByZXNwb25zZUJvZHk7XG4gICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH1cbiAgICB9KVxuICAgIC5nZXQoXCIvYXBpL21hdGNobWFraW5nXCIsIGFzeW5jIChjb250ZXh0KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgc2lkID0gYXdhaXQgY29udGV4dC5jb29raWVzLmdldCgnc2lkJyk7XG4gICAgICAgICAgICBpZiAoc2lkICYmIHR5cGVvZiBzaWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgbGV0IHVzZXJuYW1lID0gc2lkc1tzaWQgYXMgc3RyaW5nXTtcbiAgICAgICAgICAgICAgICBpZiAodXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXNlcm5hbWVSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBlbG9fcmF0aW5nIGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIHVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgbWF0Y2htYWtpbmdVc2VyOiBNYXRjaG1ha2luZ1VzZXIgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbG9SYXRpbmc6IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMF0gYXMgbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2lkOiBzaWQsXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgcXVldWVzOiBNYXRjaG1ha2luZ1VzZXJbXVtdID0gW21hdGNobWFraW5nUXVldWUyNSwgbWF0Y2htYWtpbmdRdWV1ZTUwLCBtYXRjaG1ha2luZ1F1ZXVlMTAwLCBtYXRjaG1ha2luZ1F1ZXVlMjAwXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJhbmdlczogbnVtYmVyW10gPSBbMjUsIDUwLCAxMDAsIDIwMF07XG4gICAgICAgICAgICAgICAgICAgIGxldCBkZWxheVRpbWVzTnVtczogbnVtYmVyW10gPSBbMSwgNSwgMTAsIDYwXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZvdW5kTWF0Y2g6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBxdWV1ZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZE1hdGNoID0gYXdhaXQgYWRkVG9RdWV1ZShxdWV1ZXNbaV0sIG1hdGNobWFraW5nVXNlciwgcmFuZ2VzW2ldLCBjb250ZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGRlbGF5VGltZXNOdW1zW2ldOyArK2opIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kTWF0Y2ggPSBhd2FpdCBjaGVja0lmRm91bmRJblF1ZXVlKDEwMDAsIG1hdGNobWFraW5nVXNlciwgdXNlcm5hbWUsIGNvbnRleHQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmRNYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlRnJvbVF1ZXVlKHF1ZXVlc1tpXSwgc2lkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWZvdW5kTWF0Y2ggJiYgIWFkZFRvUXVldWUobWF0Y2htYWtpbmdRdWV1ZTUwMCwgbWF0Y2htYWtpbmdVc2VyLCA1MDAsIGNvbnRleHQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoIShhd2FpdCBjaGVja0lmRm91bmRJblF1ZXVlKDEwMDAsIG1hdGNobWFraW5nVXNlciwgdXNlcm5hbWUsIGNvbnRleHQpKSkgeyB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLmdldChcIi9hcGkvbG9nb3V0XCIsIGFzeW5jIChjb250ZXh0KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgc2lkID0gYXdhaXQgY29udGV4dC5jb29raWVzLmdldCgnc2lkJyk7XG4gICAgICAgICAgICBpZiAoc2lkICYmIHR5cGVvZiBzaWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHNpZHNbc2lkIGFzIHN0cmluZ107XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0geyB0ZXh0OiAnU3VjY2Vzc2Z1bGx5IExvZ2dlZCBPdXQnIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLnBvc3QoXCIvYXBpL3J1blwiLCBhc3luYyAoY29udGV4dDogUm91dGVyQ29udGV4dDxhbnk+KSA9PiB7XG4gICAgICAgIC8vIGNvbnRleHQucmVzcG9uc2Uuc3RhdHVzID0gU3RhdHVzLk9LO1xuICAgICAgICAvLyBjb25zdCBkdW1ieVJlc3VsdDogVGVzdENhc2VzUGFzc2VkID0ge1xuICAgICAgICAvLyAgICAgdGVzdENhc2VzUGFzc2VkOiBbdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZV0sXG4gICAgICAgIC8vICAgICBzdGFuZGFyZE91dHB1dDogXCJUZXN0IFN0YW5kYXJkIE91dHB1dFwiLFxuICAgICAgICAvLyAgICAgb3V0cHV0OiBcIlRlc3QgT3V0cHV0XCJcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSBkdW1ieVJlc3VsdFxuICAgICAgICAvLyByZXR1cm5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBzaWQgPSBhd2FpdCBjb250ZXh0LmNvb2tpZXMuZ2V0KCdzaWQnKTtcbiAgICAgICAgICAgIGlmIChzaWQgJiYgdHlwZW9mIHNpZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRleHQucmVxdWVzdC5oYXNCb2R5KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQudGhyb3coU3RhdHVzLkJhZFJlcXVlc3QsIFwiQmFkIFJlcXVlc3RcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBjb250ZXh0LnJlcXVlc3QuYm9keSgpO1xuICAgICAgICAgICAgICAgIGxldCBjb2RlOiBQYXJ0aWFsPENvZGVTdWJtaXNzaW9uPiB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBpZiAoYm9keS50eXBlID09PSBcImpzb25cIikge1xuICAgICAgICAgICAgICAgICAgICBjb2RlID0gYXdhaXQgYm9keS52YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5hc3NlcnQodHlwZW9mIGNvZGU/LnZhbHVlID09PSBcInN0cmluZ1wiLCBTdGF0dXMuQmFkUmVxdWVzdCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQuYXNzZXJ0KHR5cGVvZiBjb2RlPy5pbnB1dCA9PT0gXCJzdHJpbmdcIiwgU3RhdHVzLkJhZFJlcXVlc3QpO1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLnN0YXR1cyA9IFN0YXR1cy5PSztcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKFwiLi9zYW5kYm94L2Fuc3dlci5weVwiLCBjb2RlLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKFwiLi9zYW5kYm94L2Fuc3dlckN1c3RvbUlucHV0LnB5XCIsIGNvZGUudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgaW5wdXRMaW5lczogc3RyaW5nW10gPSBjb2RlLmlucHV0LnNwbGl0KCdcXG4nKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGN1c3RvbUlucHV0Q29udGVudDogc3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbUlucHV0Q29udGVudCArPSBwYXJzZUludChpbnB1dExpbmVzWzFdKS50b1N0cmluZygpICsgJ1xcbic7XG4gICAgICAgICAgICAgICAgICAgIGxldCBpbnB1dENvbW1hU2VwYXJhdGVkVmFsdWVzOiBzdHJpbmdbXSA9IGlucHV0TGluZXNbMF0uc3BsaXQoJ1snKVsxXS5zcGxpdCgnXScpWzBdLnNwbGl0KCcsJyk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRDb21tYVNlcGFyYXRlZFZhbHVlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9tSW5wdXRDb250ZW50ICs9IHBhcnNlSW50KGlucHV0Q29tbWFTZXBhcmF0ZWRWYWx1ZXNbaV0pLnRvU3RyaW5nKCkgKyAnXFxuJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoXCIuL3NhbmRib3gvY3VzdG9tSW5wdXQuaW5cIiwgY3VzdG9tSW5wdXRDb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVwb3J0UHJvY2VzcyA9IERlbm8ucnVuKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNtZDogW1wiLi9tYWtlUmVwb3J0LnNoXCJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3dkOiBcIi4vc2FuZGJveFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3Rkb3V0OiBcInBpcGVkXCJcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHJlcG9ydFByb2Nlc3Mub3V0cHV0KCk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBqc29uUmVzdWx0czogU3RyaW5nID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUoXCIuL3NhbmRib3gvcmVwb3J0RnJvbVB5U2FuZGJveC50eHRcIik7XG4gICAgICAgICAgICAgICAgICAgIGxldCBzdGFuZGFyZE91dHB1dFJlc3VsdHM6IHN0cmluZyA9IGF3YWl0IERlbm8ucmVhZFRleHRGaWxlKFwiLi9zYW5kYm94L3N0YW5kYXJkT3V0cHV0RnJvbVB5U2FuZGJveC50eHRcIik7XG4gICAgICAgICAgICAgICAgICAgIGxldCBvdXRwdXRSZXN1bHRzOiBzdHJpbmcgPSBhd2FpdCBEZW5vLnJlYWRUZXh0RmlsZShcIi4vc2FuZGJveC9vdXRwdXRGcm9tUHlTYW5kYm94LnR4dFwiKTtcbiAgICAgICAgICAgICAgICAgICAganNvblJlc3VsdHMgPSBqc29uUmVzdWx0cy5yZXBsYWNlKC9cXHMvZywgXCJcIik7XG4gICAgICAgICAgICAgICAgICAgIGpzb25SZXN1bHRzID0ganNvblJlc3VsdHMuc3Vic3RyaW5nKDAsIGpzb25SZXN1bHRzLmxlbmd0aCAtIDIpICsgXCJdXCJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRlc3RSZXN1bHRzOiBUZXN0UmVzdWx0W10gID0gSlNPTi5wYXJzZShqc29uUmVzdWx0cy50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRlc3RDYXNlc1Bhc3NlZDogVGVzdENhc2VzUGFzc2VkID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVzdENhc2VzUGFzc2VkOiB0ZXN0UmVzdWx0cy5tYXAoKHRyOiBUZXN0UmVzdWx0KSA9PiB0ci5wYXNzZWQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhbmRhcmRPdXRwdXQ6IHN0YW5kYXJkT3V0cHV0UmVzdWx0cyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dDogb3V0cHV0UmVzdWx0cyxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0ZXN0Q2FzZXNQYXNzZWQudGVzdENhc2VzUGFzc2VkLnNvbWUoZWxlbWVudCA9PiAhZWxlbWVudCkgJiYgKytzaWRzUHJvZ3Jlc3Nbc2lkXSA9PT0gMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG9wcG9uZW50U2lkID0gbWF0Y2hlc1tzaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG1hdGNoZXNbc2lkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBtYXRjaGVzW29wcG9uZW50U2lkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBzaWRzUHJvZ3Jlc3Nbc2lkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBzaWRzUHJvZ3Jlc3Nbb3Bwb25lbnRTaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG51bVdpbnM6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1HYW1lczogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZzogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhczI0MDBSYXRpbmdIaXN0b3J5OiBib29sZWFuID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3Bwb25lbnROdW1Mb3NzZXM6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHBvbmVudE51bUdhbWVzOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3Bwb25lbnRFbG9SYXRpbmc6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHBvbmVudEhhczI0MDBSYXRpbmdIaXN0b3J5OiBib29sZWFuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdXNlcm5hbWUgPSBzaWRzW3NpZCBhcyBzdHJpbmddO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IG51bV93aW5zLCBudW1fbG9zc2VzLCBlbG9fcmF0aW5nLCBoYXNfMjQwMF9yYXRpbmdfaGlzdG9yeSBmcm9tIHVzZXJzIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIHVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bVdpbnMgPSB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzBdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1HYW1lcyA9IG51bVdpbnMgKyAodXNlcm5hbWVSZXN1bHQucm93c1swXVsxXSBhcyBudW1iZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZyA9IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMl0gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhczI0MDBSYXRpbmdIaXN0b3J5ID0gdXNlcm5hbWVSZXN1bHQucm93c1swXVszXSBhcyBib29sZWFuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgb3Bwb25lbnRVc2VybmFtZSA9IHNpZHNbb3Bwb25lbnRTaWQgYXMgc3RyaW5nXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3Bwb25lbnRVc2VybmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzZWxlY3QgbnVtX3dpbnMsIG51bV9sb3NzZXMsIGVsb19yYXRpbmcsIGhhc18yNDAwX3JhdGluZ19oaXN0b3J5IGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIG9wcG9uZW50VXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50TnVtTG9zc2VzID0gdXNlcm5hbWVSZXN1bHQucm93c1swXVsxXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50TnVtR2FtZXMgPSAodXNlcm5hbWVSZXN1bHQucm93c1swXVswXSBhcyBudW1iZXIpICsgb3Bwb25lbnROdW1Mb3NzZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50RWxvUmF0aW5nID0gdXNlcm5hbWVSZXN1bHQucm93c1swXVsyXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50SGFzMjQwMFJhdGluZ0hpc3RvcnkgPSB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzNdIGFzIGJvb2xlYW47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKytudW1XaW5zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZWxvUmF0aW5nVmFyaWF0aW9uOiBudW1iZXIgPSAxIC0gMS4wIC8gKDEgKyBNYXRoLnBvdygxMCwgKG9wcG9uZW50RWxvUmF0aW5nIC0gZWxvUmF0aW5nKSAvIDQwMC4wKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZyArPSBNYXRoLmZsb29yKChudW1HYW1lcyA8IDMwID8gKGVsb1JhdGluZyA8IDIzMDAgPyA0MCA6IDIwKSA6IChoYXMyNDAwUmF0aW5nSGlzdG9yeSA/IDEwIDogMjApKSAqIGVsb1JhdGluZ1ZhcmlhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrb3Bwb25lbnROdW1Mb3NzZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50RWxvUmF0aW5nIC09IE1hdGguY2VpbCgob3Bwb25lbnROdW1HYW1lcyA8IDMwID8gKG9wcG9uZW50RWxvUmF0aW5nIDwgMjMwMCA/IDQwIDogMjApIDogKG9wcG9uZW50SGFzMjQwMFJhdGluZ0hpc3RvcnkgPyAxMCA6IDIwKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogZWxvUmF0aW5nVmFyaWF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJ1cGRhdGUgdXNlcnMgc2V0IG51bV93aW5zID0gXCIgKyBudW1XaW5zLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiLCBlbG9fcmF0aW5nID0gXCIgKyBlbG9SYXRpbmcudG9TdHJpbmcoKSArIFwiLCBoYXNfMjQwMF9yYXRpbmdfaGlzdG9yeSA9IFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAoaGFzMjQwMFJhdGluZ0hpc3RvcnkgfHwgZWxvUmF0aW5nID49IDI0MDApLnRvU3RyaW5nKCkgKyBcIiB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIHVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHBvbmVudFVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJ1cGRhdGUgdXNlcnMgc2V0IG51bV9sb3NzZXMgPSBcIiArIG9wcG9uZW50TnVtTG9zc2VzLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiLCBlbG9fcmF0aW5nID0gXCIgKyBvcHBvbmVudEVsb1JhdGluZy50b1N0cmluZygpICsgXCIsIGhhc18yNDAwX3JhdGluZ19oaXN0b3J5ID0gXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIChvcHBvbmVudEhhczI0MDBSYXRpbmdIaXN0b3J5IHx8IG9wcG9uZW50RWxvUmF0aW5nID49IDI0MDApLnRvU3RyaW5nKCkgKyBcIiB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIG9wcG9uZW50VXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0gdGVzdENhc2VzUGFzc2VkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSk7XG5hcHAudXNlKHJvdXRlci5yb3V0ZXMoKSk7XG5hcHAudXNlKHJvdXRlci5hbGxvd2VkTWV0aG9kcygpKTtcbmFwcC51c2UoYXN5bmMgKGNvbnRleHQpID0+IHtcbiAgICBpZiAoIWNvbnRleHQucmVxdWVzdC51cmwucGF0aG5hbWUuZW5kc1dpdGgoJy5qcycpXG4gICAgICAgICYmICFjb250ZXh0LnJlcXVlc3QudXJsLnBhdGhuYW1lLmVuZHNXaXRoKCcucG5nJylcbiAgICAgICAgJiYgIWNvbnRleHQucmVxdWVzdC51cmwucGF0aG5hbWUuZW5kc1dpdGgoJy5pY28nKVxuICAgICAgICAmJiAhY29udGV4dC5yZXF1ZXN0LnVybC5wYXRobmFtZS5lbmRzV2l0aCgnLnR4dCcpKVx0e1xuICAgICAgICBjb250ZXh0LnJlcXVlc3QudXJsLnBhdGhuYW1lID0gJy8nO1xuICAgIH1cbiAgICBhd2FpdCBjb250ZXh0LnNlbmQoe1xuICAgICAgICByb290OiBgJHtEZW5vLmN3ZCgpfS9yZWFjdC1hcHAvYnVpbGRgLFxuICAgICAgICBpbmRleDogXCJpbmRleC5odG1sXCIsXG4gICAgfSk7XG59KTtcbmNvbnNvbGUubG9nKFwiUnVubmluZyBvbiBwb3J0XCIsIHBvcnQpO1xuYXdhaXQgYXBwLmxpc3Rlbih7IHBvcnQgfSk7XG4iXX0=