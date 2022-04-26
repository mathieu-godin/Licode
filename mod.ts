import {
    Application,
    Router,
    RouterContext,
    Status,
    send,
} from "https://deno.land/x/oak/mod.ts";

import { MatchmakingData } from "./react-app/src/components/common/interfaces/matchmakingData.ts";
import { QuestionData } from "./react-app/src/components/common/interfaces/matchmakingData.ts";
import { TestCasesPassed } from "./react-app/src/components/common/interfaces/matchmakingData.ts";

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

interface MatchmakingUser {
    eloRating: number;
    sid: string;
}

interface CodeSubmission {
    value: string;
    input: string;
}

interface TestResult {
    testName: string,
    passed: boolean
}

const numQuestionsPerMatch = 3;

let helloWorldVar: HelloWorld = { text: 'Hello World' };

let sids: { [name: string]: string } = {};

let sidsProgress: { [name: string]: number } = {};

let sidsQuestions: { [name: string]: number[] } = {};

let matchmakingQueue25: MatchmakingUser[] = [];
let matchmakingQueue50: MatchmakingUser[] = [];
let matchmakingQueue100: MatchmakingUser[] = [];
let matchmakingQueue200: MatchmakingUser[] = [];
let matchmakingQueue500: MatchmakingUser[] = [];

let matches: { [name: string]: string } = {};

function delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function selectQuestions(matchmakingUser: MatchmakingUser) {
    await client.connect();
    const questionsResult = await client.queryArray("select count(*) from questions");
    let numQuestions = Number(questionsResult.rows[0][0] as number);
    await client.end();
    let questionsSelected: number[] = [];
    let randomPermutation: number[] = [];
    for (let i = 0; i < numQuestions; ++i) {
        randomPermutation[i] = i;
    }
    // Partial Fisher-Yates Algorithm for random selection of questions
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

async function addToQueue (queue: MatchmakingUser[], matchmakingUser: MatchmakingUser, range: number, context: any) {
    queue.push(matchmakingUser);
    for (let i = 0; i < queue.length; ++i) {
        if (queue[i].sid != matchmakingUser.sid
                && Math.abs(matchmakingUser.eloRating - queue[i].eloRating) <= range) {
            matches[queue[i].sid] = matchmakingUser.sid;
            matches[matchmakingUser.sid] = queue[i].sid;
            sidsProgress[queue[i].sid] = 0;
            sidsProgress[matchmakingUser.sid] = 0;
            //can call goServer/registerPair here
            console.log("attempting register pair " + matchmakingUser.sid + ", " + queue[i].sid)
            const response = await fetch("http://localhost:5000/registerPair", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Id1: matchmakingUser.sid,
                    Id2: queue[i].sid,
                }),
            }); //TODO - Check response 
            console.log(response.status);
            //can probably eliminate this, main purpose of this api
            //method is to match users and register them with the go server
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

async function checkIfFoundInQueue(delayTime: number, matchmakingUser: MatchmakingUser, username: string, context: any) {
    await delay(delayTime);
    if (matchmakingUser.sid in matches) {
        let opponentUsername = sids[matches[matchmakingUser.sid]];
        await client.connect();
        const usernameResult = await client.queryArray("select elo_rating from users where username='"
            + username + "'");
        let opponentEloRating = usernameResult.rows[0][0] as number;
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

function removeFromQueue(queue: MatchmakingUser[], sid: string) {
    for (let i = 0; i < queue.length; ++i) {
        if (queue[i].sid === sid) {
            queue.splice(i, 1);
        }
    }
}

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
                            "insert into public.users(email, username, hashed_password, salt, num_wins, num_losses, created_at, updated_at, elo_rating, has_2400_rating_history)"
                            + " values ('" + user?.email?.value + "', '" + user?.username?.value + "', '"
                            + "\\x" + hashedPasswordHexString + "', '" + "\\x" + saltHexString + "', '0', '0', now(), now(), '1000', 'false')");
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
                    const usernameResult = await client.queryArray("select email, username, num_wins, num_losses, elo_rating from users where username='"
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
                        eloRating: usernameResult.rows[0][4] as number,
                    };
                    await client.end();
                }
            }
        } catch (err) {
            console.log(err);
        }
    })
    .get("/api/opponent", async (context) => {
        try {
            let sid = await context.cookies.get('sid');
            if (sid && typeof sid === 'string') {
                let username = sids[sid as string];
                let opponentUsername = sids[matches[sid as string] as string];
                if (username && opponentUsername) {
                    await client.connect();
                    const usernameResult = await client.queryArray("select elo_rating from users where username='"
                        + username + "'");
                    const opponentUsernameResult = await client.queryArray("select elo_rating from users where username='"
                        + opponentUsername + "'");
                    const responseBody : MatchmakingData = {
                        you: {
                            username: username,
                            eloRating: usernameResult.rows[0][0] as number,
                            sid: sid,
                        },
                        opponent: {
                            username: opponentUsername,
                            eloRating: opponentUsernameResult.rows[0][0] as number,
                            sid: ''
                        },
                    };
                    context.response.body = responseBody;
                    await client.end();
                }
            }
        } catch (err) {
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
                const responseBody : QuestionData = {
                    question: questionResult.rows[0][0] as string,
                    function_signature: questionResult.rows[0][1] as string,
                    default_custom_input: questionResult.rows[0][2] as string,
                };
                context.response.body = responseBody;
                await client.end();
            }
        } catch (err) {
            console.log(err);
        }
    })
    .get("/api/matchmaking", async (context) => {
        try {
            let sid = await context.cookies.get('sid');
            if (sid && typeof sid === 'string') {
                let username = sids[sid as string];
                if (username) {
                    await client.connect();
                    const usernameResult = await client.queryArray("select elo_rating from users where username='"
                        + username + "'");
                    let matchmakingUser: MatchmakingUser = {
                        eloRating: usernameResult.rows[0][0] as number,
                        sid: sid,
                    }
                    await client.end();
                    let queues: MatchmakingUser[][] = [matchmakingQueue25, matchmakingQueue50, matchmakingQueue100, matchmakingQueue200];
                    let ranges: number[] = [25, 50, 100, 200];
                    let delayTimesNums: number[] = [1, 5, 10, 60];
                    let foundMatch: boolean = false;
                    for (let i = 0; i < queues.length; ++i) {
                        if (foundMatch = await addToQueue(queues[i], matchmakingUser, ranges[i], context)) {
                            break;
                        } else {
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
        // context.response.status = Status.OK;
        // const dumbyResult: TestCasesPassed = {
        //     testCasesPassed: [true, true, true, true, true, true, true, true, true, true, true],
        //     standardOutput: "Test Standard Output",
        //     output: "Test Output"
        // }
        // context.response.body = dumbyResult
        // return
        try {
            let sid = await context.cookies.get('sid');
            if (sid && typeof sid === 'string') {
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
                    context.assert(typeof code?.input === "string", Status.BadRequest);
                    context.response.status = Status.OK;
                    await Deno.writeTextFile("./sandbox/answer.py", code.value);
                    await Deno.writeTextFile("./sandbox/answerCustomInput.py", code.value);
                    let inputLines: string[] = code.input.split('\n');
                    let customInputContent: string = '';
                    customInputContent += parseInt(inputLines[1]).toString() + '\n';
                    let inputCommaSeparatedValues: string[] = inputLines[0].split('[')[1].split(']')[0].split(',');
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
                    let jsonResults: String = await Deno.readTextFile("./sandbox/reportFromPySandbox.txt");
                    let standardOutputResults: string = await Deno.readTextFile("./sandbox/standardOutputFromPySandbox.txt");
                    let outputResults: string = await Deno.readTextFile("./sandbox/outputFromPySandbox.txt");
                    jsonResults = jsonResults.replace(/\s/g, "");
                    jsonResults = jsonResults.substring(0, jsonResults.length - 2) + "]"
                    let testResults: TestResult[]  = JSON.parse(jsonResults.toString());
                    let testCasesPassed: TestCasesPassed = {
                        testCasesPassed: testResults.map((tr: TestResult) => tr.passed),
                        standardOutput: standardOutputResults,
                        output: outputResults,
                    };
                    if (!testCasesPassed.testCasesPassed.some(element => !element) && ++sidsProgress[sid] === 3) {
                        let opponentSid = matches[sid];
                        delete matches[sid];
                        delete matches[opponentSid];
                        delete sidsProgress[sid];
                        delete sidsProgress[opponentSid];
                        let numWins: number,
                            numGames: number,
                            eloRating: number,
                            has2400RatingHistory: boolean = false,
                            opponentNumLosses: number,
                            opponentNumGames: number,
                            opponentEloRating: number,
                            opponentHas2400RatingHistory: boolean = false;
                        let username = sids[sid as string];
                        if (username) {
                            await client.connect();
                            const usernameResult = await client.queryArray("select num_wins, num_losses, elo_rating, has_2400_rating_history from users where username='"
                                + username + "'");
                            numWins = usernameResult.rows[0][0] as number;
                            numGames = numWins + (usernameResult.rows[0][1] as number);
                            eloRating = usernameResult.rows[0][2] as number;
                            has2400RatingHistory = usernameResult.rows[0][3] as boolean;
                            await client.end();
                            let opponentUsername = sids[opponentSid as string];
                            if (opponentUsername) {
                                await client.connect();
                                const usernameResult = await client.queryArray(
                                    "select num_wins, num_losses, elo_rating, has_2400_rating_history from users where username='"
                                    + opponentUsername + "'");
                                opponentNumLosses = usernameResult.rows[0][1] as number;
                                opponentNumGames = (usernameResult.rows[0][0] as number) + opponentNumLosses;
                                opponentEloRating = usernameResult.rows[0][2] as number;
                                opponentHas2400RatingHistory = usernameResult.rows[0][3] as boolean;
                                await client.end();
                                ++numWins;
                                let eloRatingVariation: number = 1 - 1.0 / (1 + Math.pow(10, (opponentEloRating - eloRating) / 400.0));
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
        } catch (err) {
            console.log(err);
        }
    });
app.use(router.routes());
app.use(router.allowedMethods());
app.use(async (context) => {
    if (!context.request.url.pathname.endsWith('.js')
        && !context.request.url.pathname.endsWith('.png')
        && !context.request.url.pathname.endsWith('.ico')
        && !context.request.url.pathname.endsWith('.txt'))	{
        context.request.url.pathname = '/';
    }
    await context.send({
        root: `${Deno.cwd()}/react-app/build`,
        index: "index.html",
    });
});
console.log("Running on port", port);
await app.listen({ port });
