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
const numTestCases = 11;
function generateTestCaseString(allTestCases, format, j) {
    let testCaseString = '';
    let testCase = allTestCases[j].split(';');
    let k = 0;
    let m = 0;
    let mMax = 0;
    let n = 0;
    let nMax = 0;
    let insideArray = false;
    let insideArrayArray = false;
    for (let l = 0; l < testCase.length; ++l) {
        if (format[k] == 'n') {
            testCaseString += testCase[l] + '\n';
            ++k;
        }
        else if (format[k] == 'a') {
            if (insideArray) {
                if (m < mMax) {
                    testCaseString += testCase[l] + '\n';
                    ++m;
                }
                else {
                    insideArray = false;
                    ++k;
                }
            }
            else {
                testCaseString += testCase[l] + '\n';
                m = 0;
                mMax = parseInt(testCase[l]);
                insideArray = true;
            }
        }
        else if (format[k] == 'aa') {
            if (insideArray) {
                if (m < mMax) {
                    if (insideArrayArray) {
                        if (n < nMax) {
                            testCaseString += testCase[l] + '\n';
                            ++n;
                        }
                        else {
                            insideArrayArray = false;
                            ++m;
                        }
                    }
                    else {
                        testCaseString += testCase[l] + '\n';
                        n = 0;
                        nMax = parseInt(testCase[l]);
                        insideArrayArray = true;
                    }
                }
                else {
                    insideArray = false;
                    ++k;
                }
            }
            else {
                testCaseString += testCase[l] + '\n';
                m = 0;
                mMax = parseInt(testCase[l]);
                insideArray = true;
            }
        }
    }
    return testCaseString;
}
function generateStubString(inputFormat, outputFormat, functionSignature) {
    let stubString = '\n\nif __name__ == "__main__":\n';
    for (let i = 0; i < inputFormat.length; ++i) {
        if (inputFormat[i] == 'n') {
            stubString += '    p' + i.toString() + ' = int(input())\n';
        }
        else if (inputFormat[i] == 'a') {
            stubString += '    n' + i.toString() + ' = int(input())\n    p' + i.toString() + ' = []\n    for i in range(n' + i.toString() + '):\n        nums.append(int(input()))\n';
        }
        else if (inputFormat[i] == 'aa') {
            stubString += '    n' + i.toString() + ' = int(input())\n    p' + i.toString() + ' = []\n    for i in range(n' + i.toString() + '):\n        nn' + i.toString() + ' = int(input())\n        pp' + i.toString() + ' = []\n        for j in range(nn' + i.toString() + '):\n            pp' + i.toString() + '.append(int(input()))\n        p' + i.toString() + '.append(pp' + i.toString() + ')\n';
        }
    }
    stubString += '    result = ' + functionSignature.split('(')[0] + '(';
    if (inputFormat.length > 0) {
        stubString += 'p0';
    }
    for (let i = 1; i < inputFormat.length; ++i) {
        stubString += ', p' + i.toString();
    }
    stubString += ')\n    print("v10zg57ZIUF6vjZgSPaDY70TQff8wTHXgodX2otrDMEay0WlS36MjDhHH054uRrFxGHHSegvGcA7eaqB")\n';
    if (outputFormat.length > 0) {
        if (outputFormat[0] == 'n') {
            stubString += '    print(result)\n';
        }
        else if (outputFormat[0] == 'a') {
            stubString += '    print(len(result))\n    for r in result:\n        print(r)\n';
        }
        else if (outputFormat[0] == 'aa') {
            stubString += '    print(len(result))\n    for r in result:\n        print(len(r))\n        for rr in r:\n            print(rr)\n';
        }
    }
    return stubString;
}
function generateCleanString(outputFormat) {
    let cleanString = '\n\nif __name__ == "__main__":\n    while True:\n        tryInput = input()\n        if (tryInput == "v10zg57ZIUF6vjZgSPaDY70TQff8wTHXgodX2otrDMEay0WlS36MjDhHH054uRrFxGHHSegvGcA7eaqB"):\n            break\n';
    if (outputFormat.length > 0) {
        if (outputFormat[0] == 'n') {
            cleanString += '    print(input())\n';
        }
        else if (outputFormat[0] == 'a') {
            cleanString += '    n = int(input())\n    nums = []\n    for i in range(n):\n        nums.append(int(input()))\n    nums.sort()\n    print(n)\n    for i in range(n):\n        print(nums[i])';
        }
        else if (outputFormat[0] == 'aa') {
            cleanString += '    n = int(input())\n    nns = []\n    nums = []\n    for i in range(n):\n        nn = int(input())\n        nns.append(nn)\n        nnums = []\n        for j in range(nn):\n            nnums.append(int(input()))\n        nnums.sort()\n        nums.append(nnums)\n    nums.sort()\n    print(n)\n    for i in range(n):\n        print(nns[i])\n        for j in range(nns[i]):\n            print(nums[i][j])\n';
        }
    }
    return cleanString;
}
async function loadTestCases() {
    await client.connect();
    const questionsResult = await client.queryArray("select count(*) from questions");
    let numQuestions = Number(questionsResult.rows[0][0]);
    await client.end();
    for (let i = 1; i <= numQuestions; ++i) {
        await client.connect();
        const selectedResult = await client.queryArray("select function_signature, input_output_format, test_cases from questions where id = " + i.toString());
        let functionSignature = selectedResult.rows[0][0];
        let inputOutputFormat = selectedResult.rows[0][1];
        let testCases = selectedResult.rows[0][2];
        await client.end();
        let inputOutputFormats = inputOutputFormat.split('|');
        let inputFormat = inputOutputFormats[0].split(';');
        inputFormat.shift();
        let outputFormat = inputOutputFormats[1].split(';');
        outputFormat.shift();
        let allTestCases = testCases.split('|');
        for (let j = 0; j < numTestCases; ++j) {
            await Deno.writeTextFile("./sandbox/" + i.toString() + "/TestInputs/test" + (j + 1).toString() + ".in", generateTestCaseString(allTestCases, inputFormat, j));
        }
        let secondHalfThreshold = 2 * numTestCases;
        for (let j = 11; j < secondHalfThreshold; ++j) {
            await Deno.writeTextFile("./sandbox/" + i.toString() + "/TestOutputs/test" + (j - 10).toString() + ".out", generateTestCaseString(allTestCases, outputFormat, j));
        }
        await Deno.writeTextFile("./sandbox/" + i.toString() + "/stub.py", generateStubString(inputFormat, outputFormat, functionSignature));
        await Deno.writeTextFile("./sandbox/" + i.toString() + "/clean.py", generateCleanString(outputFormat));
    }
}
loadTestCases();
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
                    delete sidsQuestions[sid];
                    delete sidsQuestions[opponentSid];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDSCxXQUFXLEVBQ1gsTUFBTSxFQUVOLE1BQU0sR0FFVCxNQUFNLGdDQUFnQyxDQUFDO0FBTXhDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSw2Q0FBNkMsQ0FBQztBQUNyRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sNkNBQTZDLENBQUM7QUFDckUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLDRDQUE0QyxDQUFBO0FBQ25FLE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDO0lBQ3RCLElBQUksRUFBRSxRQUFRO0lBQ2QsUUFBUSxFQUFFLFFBQVE7SUFDbEIsUUFBUSxFQUFFLFFBQVE7SUFDbEIsUUFBUSxFQUFFLFdBQVc7SUFDckIsSUFBSSxFQUFFLElBQUk7SUFDVixHQUFHLEVBQUU7UUFDRCxPQUFPLEVBQUUsS0FBSztRQUNkLE9BQU8sRUFBRSxLQUFLO0tBQ2pCO0NBQ0osQ0FBQyxDQUFDO0FBQ0gsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNoQyxNQUFNLEdBQUcsR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFDO0FBQzlCLE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7QUEyQjVCLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxDQUFDO0FBRS9CLElBQUksYUFBYSxHQUFlLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxDQUFDO0FBRXhELElBQUksSUFBSSxHQUErQixFQUFFLENBQUM7QUFFMUMsSUFBSSxZQUFZLEdBQStCLEVBQUUsQ0FBQztBQUVsRCxJQUFJLGFBQWEsR0FBaUMsRUFBRSxDQUFDO0FBRXJELElBQUksa0JBQWtCLEdBQXNCLEVBQUUsQ0FBQztBQUMvQyxJQUFJLGtCQUFrQixHQUFzQixFQUFFLENBQUM7QUFDL0MsSUFBSSxtQkFBbUIs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QyxLQUFLLENBQUM7V0FDMUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztXQUM5QyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO1dBQzlDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRTtRQUNuRCxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDO0tBQ3RDO0lBQ0QsTUFBTSxPQUFPLENBQUMsSUFBSSxDQUFDO1FBQ2YsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxrQkFBa0I7UUFDckMsS0FBSyxFQUFFLFlBQVk7S0FDdEIsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFDLENBQUM7QUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3JDLE1BQU0sR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICAgIEFwcGxpY2F0aW9uLFxuICAgIFJvdXRlcixcbiAgICBSb3V0ZXJDb250ZXh0LFxuICAgIFN0YXR1cyxcbiAgICBzZW5kLFxufSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9vYWsvbW9kLnRzXCI7XG5cbmltcG9ydCB7IE1hdGNobWFraW5nRGF0YSB9IGZyb20gXCIuL3JlYWN0LWFwcC9zcmMvY29tcG9uZW50cy9jb21tb24vaW50ZXJmYWNlcy9tYXRjaG1ha2luZ0RhdGEudHNcIjtcbmltcG9ydCB7IFF1ZXN0aW9uRGF0YSB9IGZyb20gXCIuL3JlYWN0LWFwcC9zcmMvY29tcG9uZW50cy9jb21tb24vaW50ZXJmYWNlcy9tYXRjaG1ha2luZ0RhdGEudHNcIjtcbmltcG9ydCB7IFRlc3RDYXNlc1Bhc3NlZCB9IGZyb20gXCIuL3JlYWN0LWFwcC9zcmMvY29tcG9uZW50cy9jb21tb24vaW50ZXJmYWNlcy9tYXRjaG1ha2luZ0RhdGEudHNcIjtcblxuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3gvcG9zdGdyZXNAdjAuMTUuMC9tb2QudHNcIjtcbmltcG9ydCB7IGNyeXB0byB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4xMzIuMC9jcnlwdG8vbW9kLnRzXCI7XG5pbXBvcnQgeyBuYW5vaWQgfSBmcm9tICdodHRwczovL2Rlbm8ubGFuZC94L25hbm9pZEB2My4wLjAvYXN5bmMudHMnXG5jb25zdCBjbGllbnQgPSBuZXcgQ2xpZW50KHtcbiAgICB1c2VyOiBcImxpY29kZVwiLFxuICAgIGRhdGFiYXNlOiBcImxpY29kZVwiLFxuICAgIHBhc3N3b3JkOiBcImVkb2NpbFwiLFxuICAgIGhvc3RuYW1lOiBcImxvY2FsaG9zdFwiLFxuICAgIHBvcnQ6IDU0MzIsXG4gICAgdGxzOiB7XG4gICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICBlbmZvcmNlOiBmYWxzZSxcbiAgICB9LFxufSk7XG5jb25zdCBlbnYgPSBEZW5vLmVudi50b09iamVjdCgpO1xuY29uc3QgYXBwID0gbmV3IEFwcGxpY2F0aW9uKCk7XG5jb25zdCByb3V0ZXIgPSBuZXcgUm91dGVyKCk7XG5cbmludGVyZmFjZSBIZWxsb1dvcmxkIHtcbiAgICB0ZXh0OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBVc2VyIHtcbiAgICBlbWFpbDogeyB2YWx1ZTogc3RyaW5nIH07XG4gICAgdXNlcm5hbWU6IHsgdmFsdWU6IHN0cmluZyB9O1xuICAgIHBhc3N3b3JkOiB7IHZhbHVlOiBzdHJpbmcgfTtcbn1cblxuaW50ZXJmYWNlIE1hdGNobWFraW5nVXNlciB7XG4gICAgZWxvUmF0aW5nOiBudW1iZXI7XG4gICAgc2lkOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBDb2RlU3VibWlzc2lvbiB7XG4gICAgdmFsdWU6IHN0cmluZztcbiAgICBpbnB1dDogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgVGVzdFJlc3VsdCB7XG4gICAgdGVzdE5hbWU6IHN0cmluZyxcbiAgICBwYXNzZWQ6IGJvb2xlYW5cbn1cblxuY29uc3QgbnVtUXVlc3Rpb25zUGVyTWF0Y2ggPSAzO1xuXG5sZXQgaGVsbG9Xb3JsZFZhcjogSGVsbG9Xb3JsZCA9IHsgdGV4dDogJ0hlbGxvIFdvcmxkJyB9O1xuXG5sZXQgc2lkczogeyBbbmFtZTogc3RyaW5nXTogc3RyaW5nIH0gPSB7fTtcblxubGV0IHNpZHNQcm9ncmVzczogeyBbbmFtZTogc3RyaW5nXTogbnVtYmVyIH0gPSB7fTtcblxubGV0IHNpZHNRdWVzdGlvbnM6IHsgW25hbWU6IHN0cmluZ106IG51bWJlcltdIH0gPSB7fTtcblxubGV0IG1hdGNobWFraW5nUXVldWUyNTogTWF0Y2htYWtpbmdVc2VyW10gPSBbXTtcbmxldCBtYXRjaG1ha2luZ1F1ZXVlNTA6IE1hdGNobWFraW5nVXNlcltdID0gW107XG5sZXQgbWF0Y2htYWtpbmdRdWV1ZTEwMDogTWF0Y2htYWtpbmdVc2VyW10gPSBbXTtcbmxldCBtYXRjaG1ha2luZ1F1ZXVlMjAwOiBNYXRjaG1ha2luZ1VzZXJbXSA9IFtdO1xubGV0IG1hdGNobWFraW5nUXVldWU1MDA6IE1hdGNobWFraW5nVXNlcltdID0gW107XG5cbmxldCBtYXRjaGVzOiB7IFtuYW1lOiBzdHJpbmddOiBzdHJpbmcgfSA9IHt9O1xuXG5jb25zdCBudW1UZXN0Q2FzZXM6IG51bWJlciA9IDExO1xuXG5mdW5jdGlvbiBnZW5lcmF0ZVRlc3RDYXNlU3RyaW5nKGFsbFRlc3RDYXNlczogc3RyaW5nW10sIGZvcm1hdDogc3RyaW5nW10sIGo6IG51bWJlcikge1xuICAgIGxldCB0ZXN0Q2FzZVN0cmluZyA9ICcnO1xuICAgIGxldCB0ZXN0Q2FzZSA9IGFsbFRlc3RDYXNlc1tqXS5zcGxpdCgnOycpO1xuICAgIGxldCBrID0gMDtcbiAgICBsZXQgbSA9IDA7XG4gICAgbGV0IG1NYXggPSAwO1xuICAgIGxldCBuID0gMDtcbiAgICBsZXQgbk1heCA9IDA7XG4gICAgbGV0IGluc2lkZUFycmF5ID0gZmFsc2U7XG4gICAgbGV0IGluc2lkZUFycmF5QXJyYXkgPSBmYWxzZTtcbiAgICBmb3IgKGxldCBsID0gMDsgbCA8IHRlc3RDYXNlLmxlbmd0aDsgKytsKSB7XG4gICAgICAgIGlmIChmb3JtYXRba10gPT0gJ24nKSB7XG4gICAgICAgICAgICB0ZXN0Q2FzZVN0cmluZyArPSB0ZXN0Q2FzZVtsXSArICdcXG4nO1xuICAgICAgICAgICAgKytrO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdFtrXSA9PSAnYScpIHtcbiAgICAgICAgICAgIGlmIChpbnNpZGVBcnJheSkge1xuICAgICAgICAgICAgICAgIGlmIChtIDwgbU1heCkge1xuICAgICAgICAgICAgICAgICAgICB0ZXN0Q2FzZVN0cmluZyArPSB0ZXN0Q2FzZVtsXSArICdcXG4nO1xuICAgICAgICAgICAgICAgICAgICArK207XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW5zaWRlQXJyYXkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgKytrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGVzdENhc2VTdHJpbmcgKz0gdGVzdENhc2VbbF0gKyAnXFxuJztcbiAgICAgICAgICAgICAgICBtID0gMDtcbiAgICAgICAgICAgICAgICBtTWF4ID0gcGFyc2VJbnQodGVzdENhc2VbbF0pO1xuICAgICAgICAgICAgICAgIGluc2lkZUFycmF5ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChmb3JtYXRba10gPT0gJ2FhJykge1xuICAgICAgICAgICAgaWYgKGluc2lkZUFycmF5KSB7XG4gICAgICAgICAgICAgICAgaWYgKG0gPCBtTWF4KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnNpZGVBcnJheUFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobiA8IG5NYXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXN0Q2FzZVN0cmluZyArPSB0ZXN0Q2FzZVtsXSArICdcXG4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zaWRlQXJyYXlBcnJheSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrbTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlc3RDYXNlU3RyaW5nICs9IHRlc3RDYXNlW2xdICsgJ1xcbic7XG4gICAgICAgICAgICAgICAgICAgICAgICBuID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5NYXggPSBwYXJzZUludCh0ZXN0Q2FzZVtsXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnNpZGVBcnJheUFycmF5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGluc2lkZUFycmF5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICsraztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRlc3RDYXNlU3RyaW5nICs9IHRlc3RDYXNlW2xdICsgJ1xcbic7XG4gICAgICAgICAgICAgICAgbSA9IDA7XG4gICAgICAgICAgICAgICAgbU1heCA9IHBhcnNlSW50KHRlc3RDYXNlW2xdKTtcbiAgICAgICAgICAgICAgICBpbnNpZGVBcnJheSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRlc3RDYXNlU3RyaW5nO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZVN0dWJTdHJpbmcoaW5wdXRGb3JtYXQ6IHN0cmluZ1tdLCBvdXRwdXRGb3JtYXQ6IHN0cmluZ1tdLCBmdW5jdGlvblNpZ25hdHVyZTogc3RyaW5nKSB7XG4gICAgbGV0IHN0dWJTdHJpbmcgPSAnXFxuXFxuaWYgX19uYW1lX18gPT0gXCJfX21haW5fX1wiOlxcbic7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dEZvcm1hdC5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAoaW5wdXRGb3JtYXRbaV0gPT0gJ24nKSB7XG4gICAgICAgICAgICBzdHViU3RyaW5nICs9ICcgICAgcCcgKyBpLnRvU3RyaW5nKCkgKyAnID0gaW50KGlucHV0KCkpXFxuJztcbiAgICAgICAgfSBlbHNlIGlmIChpbnB1dEZvcm1hdFtpXSA9PSAnYScpIHtcbiAgICAgICAgICAgIHN0dWJTdHJpbmcgKz0gJyAgICBuJyArIGkudG9TdHJpbmcoKSArICcgPSBpbnQoaW5wdXQoKSlcXG4gICAgcCcgKyBpLnRvU3RyaW5nKCkgKyAnID0gW11cXG4gICAgZm9yIGkgaW4gcmFuZ2UobicgKyBpLnRvU3RyaW5nKCkgKyAnKTpcXG4gICAgICAgIG51bXMuYXBwZW5kKGludChpbnB1dCgpKSlcXG4nO1xuICAgICAgICB9IGVsc2UgaWYgKGlucHV0Rm9ybWF0W2ldID09ICdhYScpIHtcbiAgICAgICAgICAgIHN0dWJTdHJpbmcgKz0gJyAgICBuJyArIGkudG9TdHJpbmcoKSArICcgPSBpbnQoaW5wdXQoKSlcXG4gICAgcCcgKyBpLnRvU3RyaW5nKCkgKyAnID0gW11cXG4gICAgZm9yIGkgaW4gcmFuZ2UobicgKyBpLnRvU3RyaW5nKCkgKyAnKTpcXG4gICAgICAgIG5uJyArIGkudG9TdHJpbmcoKSArICcgPSBpbnQoaW5wdXQoKSlcXG4gICAgICAgIHBwJyArIGkudG9TdHJpbmcoKSArICcgPSBbXVxcbiAgICAgICAgZm9yIGogaW4gcmFuZ2Uobm4nICsgaS50b1N0cmluZygpICsgJyk6XFxuICAgICAgICAgICAgcHAnICsgaS50b1N0cmluZygpICsgJy5hcHBlbmQoaW50KGlucHV0KCkpKVxcbiAgICAgICAgcCcgKyBpLnRvU3RyaW5nKCkgKyAnLmFwcGVuZChwcCcgKyBpLnRvU3RyaW5nKCkgKyAnKVxcbic7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3R1YlN0cmluZyArPSAnICAgIHJlc3VsdCA9ICcgKyBmdW5jdGlvblNpZ25hdHVyZS5zcGxpdCgnKCcpWzBdICsgJygnO1xuICAgIGlmIChpbnB1dEZvcm1hdC5sZW5ndGggPiAwKSB7XG4gICAgICAgIHN0dWJTdHJpbmcgKz0gJ3AwJztcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBpbnB1dEZvcm1hdC5sZW5ndGg7ICsraSkge1xuICAgICAgICBzdHViU3RyaW5nICs9ICcsIHAnICsgaS50b1N0cmluZygpXG4gICAgfVxuICAgIHN0dWJTdHJpbmcgKz0gJylcXG4gICAgcHJpbnQoXCJ2MTB6ZzU3WklVRjZ2alpnU1BhRFk3MFRRZmY4d1RIWGdvZFgyb3RyRE1FYXkwV2xTMzZNakRoSEgwNTR1UnJGeEdISFNlZ3ZHY0E3ZWFxQlwiKVxcbidcbiAgICBpZiAob3V0cHV0Rm9ybWF0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgaWYgKG91dHB1dEZvcm1hdFswXSA9PSAnbicpIHtcbiAgICAgICAgICAgIHN0dWJTdHJpbmcgKz0gJyAgICBwcmludChyZXN1bHQpXFxuJztcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRGb3JtYXRbMF0gPT0gJ2EnKSB7XG4gICAgICAgICAgICBzdHViU3RyaW5nICs9ICcgICAgcHJpbnQobGVuKHJlc3VsdCkpXFxuICAgIGZvciByIGluIHJlc3VsdDpcXG4gICAgICAgIHByaW50KHIpXFxuJztcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRGb3JtYXRbMF0gPT0gJ2FhJykge1xuICAgICAgICAgICAgc3R1YlN0cmluZyArPSAnICAgIHByaW50KGxlbihyZXN1bHQpKVxcbiAgICBmb3IgciBpbiByZXN1bHQ6XFxuICAgICAgICBwcmludChsZW4ocikpXFxuICAgICAgICBmb3IgcnIgaW4gcjpcXG4gICAgICAgICAgICBwcmludChycilcXG4nO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdHViU3RyaW5nO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUNsZWFuU3RyaW5nKG91dHB1dEZvcm1hdDogc3RyaW5nW10pIHtcbiAgICBsZXQgY2xlYW5TdHJpbmcgPSAnXFxuXFxuaWYgX19uYW1lX18gPT0gXCJfX21haW5fX1wiOlxcbiAgICB3aGlsZSBUcnVlOlxcbiAgICAgICAgdHJ5SW5wdXQgPSBpbnB1dCgpXFxuICAgICAgICBpZiAodHJ5SW5wdXQgPT0gXCJ2MTB6ZzU3WklVRjZ2alpnU1BhRFk3MFRRZmY4d1RIWGdvZFgyb3RyRE1FYXkwV2xTMzZNakRoSEgwNTR1UnJGeEdISFNlZ3ZHY0E3ZWFxQlwiKTpcXG4gICAgICAgICAgICBicmVha1xcbic7XG4gICAgaWYgKG91dHB1dEZvcm1hdC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGlmIChvdXRwdXRGb3JtYXRbMF0gPT0gJ24nKSB7XG4gICAgICAgICAgICBjbGVhblN0cmluZyArPSAnICAgIHByaW50KGlucHV0KCkpXFxuJztcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRGb3JtYXRbMF0gPT0gJ2EnKSB7XG4gICAgICAgICAgICBjbGVhblN0cmluZyArPSAnICAgIG4gPSBpbnQoaW5wdXQoKSlcXG4gICAgbnVtcyA9IFtdXFxuICAgIGZvciBpIGluIHJhbmdlKG4pOlxcbiAgICAgICAgbnVtcy5hcHBlbmQoaW50KGlucHV0KCkpKVxcbiAgICBudW1zLnNvcnQoKVxcbiAgICBwcmludChuKVxcbiAgICBmb3IgaSBpbiByYW5nZShuKTpcXG4gICAgICAgIHByaW50KG51bXNbaV0pJztcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRGb3JtYXRbMF0gPT0gJ2FhJykge1xuICAgICAgICAgICAgY2xlYW5TdHJpbmcgKz0gJyAgICBuID0gaW50KGlucHV0KCkpXFxuICAgIG5ucyA9IFtdXFxuICAgIG51bXMgPSBbXVxcbiAgICBmb3IgaSBpbiByYW5nZShuKTpcXG4gICAgICAgIG5uID0gaW50KGlucHV0KCkpXFxuICAgICAgICBubnMuYXBwZW5kKG5uKVxcbiAgICAgICAgbm51bXMgPSBbXVxcbiAgICAgICAgZm9yIGogaW4gcmFuZ2Uobm4pOlxcbiAgICAgICAgICAgIG5udW1zLmFwcGVuZChpbnQoaW5wdXQoKSkpXFxuICAgICAgICBubnVtcy5zb3J0KClcXG4gICAgICAgIG51bXMuYXBwZW5kKG5udW1zKVxcbiAgICBudW1zLnNvcnQoKVxcbiAgICBwcmludChuKVxcbiAgICBmb3IgaSBpbiByYW5nZShuKTpcXG4gICAgICAgIHByaW50KG5uc1tpXSlcXG4gICAgICAgIGZvciBqIGluIHJhbmdlKG5uc1tpXSk6XFxuICAgICAgICAgICAgcHJpbnQobnVtc1tpXVtqXSlcXG4nO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjbGVhblN0cmluZztcbn1cblxuYXN5bmMgZnVuY3Rpb24gbG9hZFRlc3RDYXNlcygpIHtcbiAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgIGNvbnN0IHF1ZXN0aW9uc1Jlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IGNvdW50KCopIGZyb20gcXVlc3Rpb25zXCIpO1xuICAgIGxldCBudW1RdWVzdGlvbnMgPSBOdW1iZXIocXVlc3Rpb25zUmVzdWx0LnJvd3NbMF1bMF0gYXMgbnVtYmVyKTtcbiAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnVtUXVlc3Rpb25zOyArK2kpIHtcbiAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBmdW5jdGlvbl9zaWduYXR1cmUsIGlucHV0X291dHB1dF9mb3JtYXQsIHRlc3RfY2FzZXMgZnJvbSBxdWVzdGlvbnMgd2hlcmUgaWQgPSBcIiArIGkudG9TdHJpbmcoKSk7XG4gICAgICAgIGxldCBmdW5jdGlvblNpZ25hdHVyZTogc3RyaW5nID0gc2VsZWN0ZWRSZXN1bHQucm93c1swXVswXSBhcyBzdHJpbmc7XG4gICAgICAgIGxldCBpbnB1dE91dHB1dEZvcm1hdCA9IHNlbGVjdGVkUmVzdWx0LnJvd3NbMF1bMV0gYXMgc3RyaW5nO1xuICAgICAgICBsZXQgdGVzdENhc2VzID0gc2VsZWN0ZWRSZXN1bHQucm93c1swXVsyXSBhcyBzdHJpbmc7XG4gICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgbGV0IGlucHV0T3V0cHV0Rm9ybWF0cyA9IGlucHV0T3V0cHV0Rm9ybWF0LnNwbGl0KCd8Jyk7XG4gICAgICAgIGxldCBpbnB1dEZvcm1hdDogc3RyaW5nW10gPSBpbnB1dE91dHB1dEZvcm1hdHNbMF0uc3BsaXQoJzsnKTtcbiAgICAgICAgaW5wdXRGb3JtYXQuc2hpZnQoKTtcbiAgICAgICAgbGV0IG91dHB1dEZvcm1hdDogc3RyaW5nW10gPSBpbnB1dE91dHB1dEZvcm1hdHNbMV0uc3BsaXQoJzsnKTtcbiAgICAgICAgb3V0cHV0Rm9ybWF0LnNoaWZ0KCk7XG4gICAgICAgIGxldCBhbGxUZXN0Q2FzZXM6IHN0cmluZ1tdID0gdGVzdENhc2VzLnNwbGl0KCd8Jyk7XG4gICAgICAgIGZvciAobGV0IGo6IG51bWJlciA9IDA7IGogPCBudW1UZXN0Q2FzZXM7ICsraikge1xuICAgICAgICAgICAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKFwiLi9zYW5kYm94L1wiICsgaS50b1N0cmluZygpICsgXCIvVGVzdElucHV0cy90ZXN0XCIgKyAoaiArIDEpLnRvU3RyaW5nKCkgKyBcIi5pblwiLFxuICAgICAgICAgICAgICAgIGdlbmVyYXRlVGVzdENhc2VTdHJpbmcoYWxsVGVzdENhc2VzLCBpbnB1dEZvcm1hdCwgaikpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzZWNvbmRIYWxmVGhyZXNob2xkID0gMiAqIG51bVRlc3RDYXNlcztcbiAgICAgICAgZm9yIChsZXQgaiA9IDExOyBqIDwgc2Vjb25kSGFsZlRocmVzaG9sZDsgKytqKSB7XG4gICAgICAgICAgICBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoXCIuL3NhbmRib3gvXCIgKyBpLnRvU3RyaW5nKCkgKyBcIi9UZXN0T3V0cHV0cy90ZXN0XCIgKyAoaiAtIDEwKS50b1N0cmluZygpICsgXCIub3V0XCIsXG4gICAgICAgICAgICAgICAgZ2VuZXJhdGVUZXN0Q2FzZVN0cmluZyhhbGxUZXN0Q2FzZXMsIG91dHB1dEZvcm1hdCwgaikpO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZShcIi4vc2FuZGJveC9cIiArIGkudG9TdHJpbmcoKSArIFwiL3N0dWIucHlcIiwgZ2VuZXJhdGVTdHViU3RyaW5nKGlucHV0Rm9ybWF0LCBvdXRwdXRGb3JtYXQsIGZ1bmN0aW9uU2lnbmF0dXJlKSk7XG4gICAgICAgIGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZShcIi4vc2FuZGJveC9cIiArIGkudG9TdHJpbmcoKSArIFwiL2NsZWFuLnB5XCIsIGdlbmVyYXRlQ2xlYW5TdHJpbmcob3V0cHV0Rm9ybWF0KSk7XG4gICAgfVxufVxuXG5sb2FkVGVzdENhc2VzKCk7XG5cbmZ1bmN0aW9uIGRlbGF5KHRpbWU6IG51bWJlcikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgdGltZSkpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBzZWxlY3RRdWVzdGlvbnMobWF0Y2htYWtpbmdVc2VyOiBNYXRjaG1ha2luZ1VzZXIpIHtcbiAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgIGNvbnN0IHF1ZXN0aW9uc1Jlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IGNvdW50KCopIGZyb20gcXVlc3Rpb25zXCIpO1xuICAgIGxldCBudW1RdWVzdGlvbnMgPSBOdW1iZXIocXVlc3Rpb25zUmVzdWx0LnJvd3NbMF1bMF0gYXMgbnVtYmVyKTtcbiAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgbGV0IHF1ZXN0aW9uc1NlbGVjdGVkOiBudW1iZXJbXSA9IFtdO1xuICAgIGxldCByYW5kb21QZXJtdXRhdGlvbjogbnVtYmVyW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVF1ZXN0aW9uczsgKytpKSB7XG4gICAgICAgIHJhbmRvbVBlcm11dGF0aW9uW2ldID0gaTtcbiAgICB9XG4gICAgLy8gUGFydGlhbCBGaXNoZXItWWF0ZXMgQWxnb3JpdGhtIGZvciByYW5kb20gc2VsZWN0aW9uIG9mIHF1ZXN0aW9uc1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtUXVlc3Rpb25zUGVyTWF0Y2g7ICsraSkge1xuICAgICAgICBsZXQgaiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG51bVF1ZXN0aW9ucyk7XG4gICAgICAgIFtyYW5kb21QZXJtdXRhdGlvbltpXSwgcmFuZG9tUGVybXV0YXRpb25bal1dID0gW3JhbmRvbVBlcm11dGF0aW9uW2pdLCByYW5kb21QZXJtdXRhdGlvbltpXV07XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtUXVlc3Rpb25zUGVyTWF0Y2g7ICsraSkge1xuICAgICAgICBxdWVzdGlvbnNTZWxlY3RlZC5wdXNoKHJhbmRvbVBlcm11dGF0aW9uW2ldICsgMSk7XG4gICAgfVxuICAgIHNpZHNRdWVzdGlvbnNbbWF0Y2htYWtpbmdVc2VyLnNpZF0gPSBxdWVzdGlvbnNTZWxlY3RlZDtcbiAgICBzaWRzUXVlc3Rpb25zW21hdGNoZXNbbWF0Y2htYWtpbmdVc2VyLnNpZF1dID0gcXVlc3Rpb25zU2VsZWN0ZWQ7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGFkZFRvUXVldWUgKHF1ZXVlOiBNYXRjaG1ha2luZ1VzZXJbXSwgbWF0Y2htYWtpbmdVc2VyOiBNYXRjaG1ha2luZ1VzZXIsIHJhbmdlOiBudW1iZXIsIGNvbnRleHQ6IGFueSkge1xuICAgIHF1ZXVlLnB1c2gobWF0Y2htYWtpbmdVc2VyKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHF1ZXVlLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChxdWV1ZVtpXS5zaWQgIT0gbWF0Y2htYWtpbmdVc2VyLnNpZFxuICAgICAgICAgICAgICAgICYmIE1hdGguYWJzKG1hdGNobWFraW5nVXNlci5lbG9SYXRpbmcgLSBxdWV1ZVtpXS5lbG9SYXRpbmcpIDw9IHJhbmdlKSB7XG4gICAgICAgICAgICBtYXRjaGVzW3F1ZXVlW2ldLnNpZF0gPSBtYXRjaG1ha2luZ1VzZXIuc2lkO1xuICAgICAgICAgICAgbWF0Y2hlc1ttYXRjaG1ha2luZ1VzZXIuc2lkXSA9IHF1ZXVlW2ldLnNpZDtcbiAgICAgICAgICAgIHNpZHNQcm9ncmVzc1txdWV1ZVtpXS5zaWRdID0gMDtcbiAgICAgICAgICAgIHNpZHNQcm9ncmVzc1ttYXRjaG1ha2luZ1VzZXIuc2lkXSA9IDA7XG4gICAgICAgICAgICAvL2NhbiBjYWxsIGdvU2VydmVyL3JlZ2lzdGVyUGFpciBoZXJlXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImF0dGVtcHRpbmcgcmVnaXN0ZXIgcGFpciBcIiArIG1hdGNobWFraW5nVXNlci5zaWQgKyBcIiwgXCIgKyBxdWV1ZVtpXS5zaWQpXG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKFwiaHR0cDovL2xvY2FsaG9zdDo1MDAwL3JlZ2lzdGVyUGFpclwiLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICAgIElkMTogbWF0Y2htYWtpbmdVc2VyLnNpZCxcbiAgICAgICAgICAgICAgICAgICAgSWQyOiBxdWV1ZVtpXS5zaWQsXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICB9KTsgLy9UT0RPIC0gQ2hlY2sgcmVzcG9uc2UgXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZS5zdGF0dXMpO1xuICAgICAgICAgICAgLy9jYW4gcHJvYmFibHkgZWxpbWluYXRlIHRoaXMsIG1haW4gcHVycG9zZSBvZiB0aGlzIGFwaVxuICAgICAgICAgICAgLy9tZXRob2QgaXMgdG8gbWF0Y2ggdXNlcnMgYW5kIHJlZ2lzdGVyIHRoZW0gd2l0aCB0aGUgZ28gc2VydmVyXG4gICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7XG4gICAgICAgICAgICAgICAgdXNlcm5hbWU6IHNpZHNbbWF0Y2htYWtpbmdVc2VyLnNpZF0sXG4gICAgICAgICAgICAgICAgZWxvUmF0aW5nOiBtYXRjaG1ha2luZ1VzZXIuZWxvUmF0aW5nLFxuICAgICAgICAgICAgICAgIG9wcG9uZW50VXNlcm5hbWU6IHNpZHNbcXVldWVbaV0uc2lkXSxcbiAgICAgICAgICAgICAgICBvcHBvbmVudEVsb1JhdGluZzogcXVldWVbaV0uZWxvUmF0aW5nLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHF1ZXVlLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIHF1ZXVlLnBvcCgpO1xuICAgICAgICAgICAgc2VsZWN0UXVlc3Rpb25zKG1hdGNobWFraW5nVXNlcik7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNoZWNrSWZGb3VuZEluUXVldWUoZGVsYXlUaW1lOiBudW1iZXIsIG1hdGNobWFraW5nVXNlcjogTWF0Y2htYWtpbmdVc2VyLCB1c2VybmFtZTogc3RyaW5nLCBjb250ZXh0OiBhbnkpIHtcbiAgICBhd2FpdCBkZWxheShkZWxheVRpbWUpO1xuICAgIGlmIChtYXRjaG1ha2luZ1VzZXIuc2lkIGluIG1hdGNoZXMpIHtcbiAgICAgICAgbGV0IG9wcG9uZW50VXNlcm5hbWUgPSBzaWRzW21hdGNoZXNbbWF0Y2htYWtpbmdVc2VyLnNpZF1dO1xuICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IGVsb19yYXRpbmcgZnJvbSB1c2VycyB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICsgdXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgIGxldCBvcHBvbmVudEVsb1JhdGluZyA9IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMF0gYXMgbnVtYmVyO1xuICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHtcbiAgICAgICAgICAgIHVzZXJuYW1lOiBzaWRzW21hdGNobWFraW5nVXNlci5zaWRdLFxuICAgICAgICAgICAgZWxvUmF0aW5nOiBtYXRjaG1ha2luZ1VzZXIuZWxvUmF0aW5nLFxuICAgICAgICAgICAgb3Bwb25lbnRVc2VybmFtZTogb3Bwb25lbnRVc2VybmFtZSxcbiAgICAgICAgICAgIG9wcG9uZW50RWxvUmF0aW5nOiBvcHBvbmVudEVsb1JhdGluZyxcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRnJvbVF1ZXVlKHF1ZXVlOiBNYXRjaG1ha2luZ1VzZXJbXSwgc2lkOiBzdHJpbmcpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHF1ZXVlLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChxdWV1ZVtpXS5zaWQgPT09IHNpZCkge1xuICAgICAgICAgICAgcXVldWUuc3BsaWNlKGksIDEpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5jb25zdCBwb3J0OiBudW1iZXIgPSArZW52LkxJQ09ERV9QT1JUIHx8IDMwMDA7XG5hcHAuYWRkRXZlbnRMaXN0ZW5lcihcImVycm9yXCIsIChldnQpID0+IHtcbiAgICBjb25zb2xlLmxvZyhldnQuZXJyb3IpO1xufSk7XG5yb3V0ZXJcbiAgICAuZ2V0KFwiL2FwaS9oZWxsby13b3JsZFwiLCAoY29udGV4dCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0gaGVsbG9Xb3JsZFZhcjtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAucG9zdChcIi9hcGkvcG9zdC1oZWxsby13b3JsZFwiLCBhc3luYyAoY29udGV4dDogUm91dGVyQ29udGV4dDxhbnk+KSA9PiB7XG4gICAgICAgIGlmICghY29udGV4dC5yZXF1ZXN0Lmhhc0JvZHkpIHtcbiAgICAgICAgICAgIGNvbnRleHQudGhyb3coU3RhdHVzLkJhZFJlcXVlc3QsIFwiQmFkIFJlcXVlc3RcIik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYm9keSA9IGNvbnRleHQucmVxdWVzdC5ib2R5KCk7XG4gICAgICAgIGxldCBoZWxsb1dvcmxkOiBQYXJ0aWFsPEhlbGxvV29ybGQ+IHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAoYm9keS50eXBlID09PSBcImpzb25cIikge1xuICAgICAgICAgICAgaGVsbG9Xb3JsZCA9IGF3YWl0IGJvZHkudmFsdWU7XG4gICAgICAgIH0gZWxzZSBpZiAoYm9keS50eXBlID09PSBcImZvcm1cIikge1xuICAgICAgICAgICAgaGVsbG9Xb3JsZCA9IHt9O1xuICAgICAgICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgYXdhaXQgYm9keS52YWx1ZSkge1xuICAgICAgICAgICAgICAgIGhlbGxvV29ybGRba2V5IGFzIGtleW9mIEhlbGxvV29ybGRdID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoYm9keS50eXBlID09PSBcImZvcm0tZGF0YVwiKSB7XG4gICAgICAgICAgICBjb25zdCBmb3JtRGF0YSA9IGF3YWl0IGJvZHkudmFsdWUucmVhZCgpO1xuICAgICAgICAgICAgaGVsbG9Xb3JsZCA9IGZvcm1EYXRhLmZpZWxkcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoaGVsbG9Xb3JsZCkge1xuICAgICAgICAgICAgY29udGV4dC5hc3NlcnQodHlwZW9mIGhlbGxvV29ybGQudGV4dCA9PT0gXCJzdHJpbmdcIiwgU3RhdHVzLkJhZFJlcXVlc3QpO1xuICAgICAgICAgICAgaGVsbG9Xb3JsZFZhciA9IGhlbGxvV29ybGQgYXMgSGVsbG9Xb3JsZDtcbiAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2Uuc3RhdHVzID0gU3RhdHVzLk9LO1xuICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0gaGVsbG9Xb3JsZDtcbiAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UudHlwZSA9IFwianNvblwiO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRleHQudGhyb3coU3RhdHVzLkJhZFJlcXVlc3QsIFwiQmFkIFJlcXVlc3RcIik7XG4gICAgfSlcbiAgICAucG9zdChcIi9hcGkvcmVnaXN0ZXJcIiwgYXN5bmMgKGNvbnRleHQ6IFJvdXRlckNvbnRleHQ8YW55PikgPT4ge1xuICAgICAgICBsZXQgc2lkID0gYXdhaXQgY29udGV4dC5jb29raWVzLmdldCgnc2lkJyk7XG4gICAgICAgIGlmICghc2lkKSB7XG4gICAgICAgICAgICBzaWQgPSBhd2FpdCBuYW5vaWQoNDApO1xuICAgICAgICAgICAgY29udGV4dC5jb29raWVzLnNldCgnc2lkJywgc2lkKTtcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKCFjb250ZXh0LnJlcXVlc3QuaGFzQm9keSkge1xuICAgICAgICAgICAgICAgIGNvbnRleHQudGhyb3coU3RhdHVzLkJhZFJlcXVlc3QsIFwiQmFkIFJlcXVlc3RcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gY29udGV4dC5yZXF1ZXN0LmJvZHkoKTtcbiAgICAgICAgICAgIGxldCB1c2VyOiBQYXJ0aWFsPFVzZXI+IHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgaWYgKGJvZHkudHlwZSA9PT0gXCJqc29uXCIpIHtcbiAgICAgICAgICAgICAgICB1c2VyID0gYXdhaXQgYm9keS52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgY29udGV4dC5hc3NlcnQoXG4gICAgICAgICAgICAgICAgICAgIHR5cGVvZiB1c2VyPy5lbWFpbD8udmFsdWUgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIHVzZXI/LnVzZXJuYW1lPy52YWx1ZSA9PT0gXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgdXNlcj8ucGFzc3dvcmQ/LnZhbHVlID09PSBcInN0cmluZ1wiLCBTdGF0dXMuQmFkUmVxdWVzdCk7XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5zdGF0dXMgPSBTdGF0dXMuT0s7XG4gICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IHVzZXJuYW1lIGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICAgICAgICAgICsgdXNlcj8udXNlcm5hbWU/LnZhbHVlICsgXCInXCIpO1xuICAgICAgICAgICAgICAgIGlmICh1c2VybmFtZVJlc3VsdC5yb3dzLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZW1haWxSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBlbWFpbCBmcm9tIHVzZXJzIHdoZXJlIGVtYWlsPSdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKyB1c2VyPy5lbWFpbD8udmFsdWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbWFpbFJlc3VsdC5yb3dzLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzYWx0SGV4U3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDMyOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYWx0SGV4U3RyaW5nICs9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIE1hdGgucG93KDIsIDMyKSkudG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNhbHRIZXhTdHJpbmdMZW5ndGggPSBzYWx0SGV4U3RyaW5nLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMjU2IC0gc2FsdEhleFN0cmluZ0xlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2FsdEhleFN0cmluZyA9IFwiMFwiICsgc2FsdEhleFN0cmluZztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0ZXh0RW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGhhc2hlZFBhc3N3b3JkVWludDhBcnJheSA9IG5ldyBVaW50OEFycmF5KGF3YWl0IGNyeXB0by5zdWJ0bGUuZGlnZXN0KCdTSEEzLTUxMicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dEVuY29kZXIuZW5jb2RlKHVzZXI/LnBhc3N3b3JkPy52YWx1ZSArIHNhbHRIZXhTdHJpbmcpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgKz0gKGhhc2hlZFBhc3N3b3JkVWludDhBcnJheVtpXSA8IDE2ID8gXCIwXCIgOiBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIGhhc2hlZFBhc3N3b3JkVWludDhBcnJheVtpXS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmdMZW5ndGggPSBoYXNoZWRQYXNzd29yZEhleFN0cmluZy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEyOCAtIGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nTGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNoZWRQYXNzd29yZEhleFN0cmluZyA9IFwiMFwiICsgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImluc2VydCBpbnRvIHB1YmxpYy51c2VycyhlbWFpbCwgdXNlcm5hbWUsIGhhc2hlZF9wYXNzd29yZCwgc2FsdCwgbnVtX3dpbnMsIG51bV9sb3NzZXMsIGNyZWF0ZWRfYXQsIHVwZGF0ZWRfYXQsIGVsb19yYXRpbmcsIGhhc18yNDAwX3JhdGluZ19oaXN0b3J5KVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBcIiB2YWx1ZXMgKCdcIiArIHVzZXI/LmVtYWlsPy52YWx1ZSArIFwiJywgJ1wiICsgdXNlcj8udXNlcm5hbWU/LnZhbHVlICsgXCInLCAnXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiXFxcXHhcIiArIGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nICsgXCInLCAnXCIgKyBcIlxcXFx4XCIgKyBzYWx0SGV4U3RyaW5nICsgXCInLCAnMCcsICcwJywgbm93KCksIG5vdygpLCAnMTAwMCcsICdmYWxzZScpXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNpZCA9IGF3YWl0IG5hbm9pZCg0MCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaWRzW3NpZF0gPSB1c2VyLnVzZXJuYW1lLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY29udGV4dC5jb29raWVzLnNldCgnc2lkJywgc2lkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHVzZXI7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7IHRleHQ6ICdHaXZlbiBFbWFpbCBBbHJlYWR5IEV4aXN0cycgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHsgdGV4dDogJ0dpdmVuIFVzZXJuYW1lIEFscmVhZHkgRXhpc3RzJyB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS50eXBlID0gXCJqc29uXCI7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGV4dC50aHJvdyhTdGF0dXMuQmFkUmVxdWVzdCwgXCJCYWQgUmVxdWVzdFwiKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAucG9zdChcIi9hcGkvbG9naW5cIiwgYXN5bmMgKGNvbnRleHQ6IFJvdXRlckNvbnRleHQ8YW55PikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKCFjb250ZXh0LnJlcXVlc3QuaGFzQm9keSkge1xuICAgICAgICAgICAgICAgIGNvbnRleHQudGhyb3coU3RhdHVzLkJhZFJlcXVlc3QsIFwiQmFkIFJlcXVlc3RcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gY29udGV4dC5yZXF1ZXN0LmJvZHkoKTtcbiAgICAgICAgICAgIGxldCB1c2VyOiBQYXJ0aWFsPFVzZXI+IHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgaWYgKGJvZHkudHlwZSA9PT0gXCJqc29uXCIpIHtcbiAgICAgICAgICAgICAgICB1c2VyID0gYXdhaXQgYm9keS52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgY29udGV4dC5hc3NlcnQoXG4gICAgICAgICAgICAgICAgICAgIHR5cGVvZiB1c2VyPy5lbWFpbD8udmFsdWUgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIHVzZXI/LnBhc3N3b3JkPy52YWx1ZSA9PT0gXCJzdHJpbmdcIiwgU3RhdHVzLkJhZFJlcXVlc3QpO1xuICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2Uuc3RhdHVzID0gU3RhdHVzLk9LO1xuICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgdXNlcm5hbWVSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBlbWFpbCwgdXNlcm5hbWUsIGhhc2hlZF9wYXNzd29yZCwgc2FsdCBmcm9tIHVzZXJzIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgICAgICAgICArIHVzZXI/LmVtYWlsPy52YWx1ZSArIFwiJ1wiKTtcbiAgICAgICAgICAgICAgICBpZiAodXNlcm5hbWVSZXN1bHQucm93cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVtYWlsUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgZW1haWwsIHVzZXJuYW1lLCBoYXNoZWRfcGFzc3dvcmQsIHNhbHQgZnJvbSB1c2VycyB3aGVyZSBlbWFpbD0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgdXNlcj8uZW1haWw/LnZhbHVlICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZW1haWxSZXN1bHQucm93cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7IHRleHQ6ICdHaXZlbiBFbWFpbCBvciBVc2VybmFtZSBEb2VzIE5vdCBFeGlzdCcgfTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzYWx0SGV4U3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IChlbWFpbFJlc3VsdC5yb3dzWzBdWzNdIGFzIFVpbnQ4QXJyYXkpLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2FsdEhleFN0cmluZyArPSAoKGVtYWlsUmVzdWx0LnJvd3NbMF1bM10gYXMgVWludDhBcnJheSlbaV0gPCAxNiA/IFwiMFwiIDogXCJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAoZW1haWxSZXN1bHQucm93c1swXVszXSBhcyBVaW50OEFycmF5KVtpXS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdGV4dEVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXkgPSBuZXcgVWludDhBcnJheShhd2FpdCBjcnlwdG8uc3VidGxlLmRpZ2VzdCgnU0hBMy01MTInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRFbmNvZGVyLmVuY29kZSh1c2VyPy5wYXNzd29yZD8udmFsdWUgKyBzYWx0SGV4U3RyaW5nKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhhc2hlZFBhc3N3b3JkVWludDhBcnJheS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nICs9IChoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXlbaV0gPCAxNiA/IFwiMFwiIDogXCJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXlbaV0udG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNlcnZlckhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IChlbWFpbFJlc3VsdC5yb3dzWzBdWzJdIGFzIFVpbnQ4QXJyYXkpLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VydmVySGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgKz0gKChlbWFpbFJlc3VsdC5yb3dzWzBdWzJdIGFzIFVpbnQ4QXJyYXkpW2ldIDwgMTYgPyBcIjBcIiA6IFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgKGVtYWlsUmVzdWx0LnJvd3NbMF1bMl0gYXMgVWludDhBcnJheSlbaV0udG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nID09PSBzZXJ2ZXJIYXNoZWRQYXNzd29yZEhleFN0cmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmb3VuZFVzZXI6IFVzZXIgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtYWlsOiB7IHZhbHVlOiBlbWFpbFJlc3VsdC5yb3dzWzBdWzBdIGFzIHN0cmluZyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogeyB2YWx1ZTogZW1haWxSZXN1bHQucm93c1swXVsxXSBhcyBzdHJpbmcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHsgdmFsdWU6ICcnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzaWQgPSBhd2FpdCBuYW5vaWQoNDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpZHNbc2lkXSA9IGZvdW5kVXNlci51c2VybmFtZS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjb250ZXh0LmNvb2tpZXMuc2V0KCdzaWQnLCBzaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IGZvdW5kVXNlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0geyB0ZXh0OiAnV3JvbmcgUGFzc3dvcmQnIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsZXQgc2FsdEhleFN0cmluZyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8ICh1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzNdIGFzIFVpbnQ4QXJyYXkpLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzYWx0SGV4U3RyaW5nICs9ICgodXNlcm5hbWVSZXN1bHQucm93c1swXVszXSBhcyBVaW50OEFycmF5KVtpXSA8IDE2ID8gXCIwXCIgOiBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgKHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bM10gYXMgVWludDhBcnJheSlbaV0udG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGxldCB0ZXh0RW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgY3J5cHRvLnN1YnRsZS5kaWdlc3QoJ1NIQTMtNTEyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHRFbmNvZGVyLmVuY29kZSh1c2VyPy5wYXNzd29yZD8udmFsdWUgKyBzYWx0SGV4U3RyaW5nKSkpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXkubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nICs9IChoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXlbaV0gPCAxNiA/IFwiMFwiIDogXCJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArIGhhc2hlZFBhc3N3b3JkVWludDhBcnJheVtpXS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbGV0IHNlcnZlckhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgKHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMl0gYXMgVWludDhBcnJheSkubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZlckhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nICs9ICgodXNlcm5hbWVSZXN1bHQucm93c1swXVsyXSBhcyBVaW50OEFycmF5KVtpXSA8IDE2ID8gXCIwXCIgOiBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgKHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMl0gYXMgVWludDhBcnJheSlbaV0udG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChoYXNoZWRQYXNzd29yZEhleFN0cmluZyA9PT0gc2VydmVySGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmb3VuZFVzZXI6IFVzZXIgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW1haWw6IHsgdmFsdWU6IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMF0gYXMgc3RyaW5nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcm5hbWU6IHsgdmFsdWU6IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMV0gYXMgc3RyaW5nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHsgdmFsdWU6ICcnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc2lkID0gYXdhaXQgbmFub2lkKDQwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZHNbc2lkXSA9IGZvdW5kVXNlci51c2VybmFtZS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNvbnRleHQuY29va2llcy5zZXQoJ3NpZCcsIHNpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSBmb3VuZFVzZXI7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7IHRleHQ6ICdXcm9uZyBQYXNzd29yZCcgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS50eXBlID0gXCJqc29uXCI7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGV4dC50aHJvdyhTdGF0dXMuQmFkUmVxdWVzdCwgXCJCYWQgUmVxdWVzdFwiKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAuZ2V0KFwiL2FwaS91c2VyXCIsIGFzeW5jIChjb250ZXh0KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgc2lkID0gYXdhaXQgY29udGV4dC5jb29raWVzLmdldCgnc2lkJyk7XG4gICAgICAgICAgICBpZiAoc2lkICYmIHR5cGVvZiBzaWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgbGV0IHVzZXJuYW1lID0gc2lkc1tzaWQgYXMgc3RyaW5nXTtcbiAgICAgICAgICAgICAgICBpZiAodXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXNlcm5hbWVSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBlbWFpbCwgdXNlcm5hbWUsIG51bV93aW5zLCBudW1fbG9zc2VzLCBlbG9fcmF0aW5nIGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIHVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgZm91bmRVc2VyOiBVc2VyID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW1haWw6IHsgdmFsdWU6IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMF0gYXMgc3RyaW5nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogeyB2YWx1ZTogdXNlcm5hbWVSZXN1bHQucm93c1swXVsxXSBhcyBzdHJpbmcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiB7IHZhbHVlOiAnJyB9LFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXI6IGZvdW5kVXNlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bVdpbnM6IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMl0gYXMgbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgbnVtTG9zc2VzOiB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzNdIGFzIG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZzogdXNlcm5hbWVSZXN1bHQucm93c1swXVs0XSBhcyBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLmdldChcIi9hcGkvb3Bwb25lbnRcIiwgYXN5bmMgKGNvbnRleHQpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBzaWQgPSBhd2FpdCBjb250ZXh0LmNvb2tpZXMuZ2V0KCdzaWQnKTtcbiAgICAgICAgICAgIGlmIChzaWQgJiYgdHlwZW9mIHNpZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBsZXQgdXNlcm5hbWUgPSBzaWRzW3NpZCBhcyBzdHJpbmddO1xuICAgICAgICAgICAgICAgIGxldCBvcHBvbmVudFVzZXJuYW1lID0gc2lkc1ttYXRjaGVzW3NpZCBhcyBzdHJpbmddIGFzIHN0cmluZ107XG4gICAgICAgICAgICAgICAgaWYgKHVzZXJuYW1lICYmIG9wcG9uZW50VXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXNlcm5hbWVSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBlbG9fcmF0aW5nIGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIHVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvcHBvbmVudFVzZXJuYW1lUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgZWxvX3JhdGluZyBmcm9tIHVzZXJzIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKyBvcHBvbmVudFVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZUJvZHkgOiBNYXRjaG1ha2luZ0RhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB5b3U6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogdXNlcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxvUmF0aW5nOiB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzBdIGFzIG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWQ6IHNpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHBvbmVudDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJuYW1lOiBvcHBvbmVudFVzZXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZzogb3Bwb25lbnRVc2VybmFtZVJlc3VsdC5yb3dzWzBdWzBdIGFzIG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWQ6ICcnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSByZXNwb25zZUJvZHk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLmdldChcIi9hcGkvcXVlc3Rpb25cIiwgYXN5bmMgKGNvbnRleHQpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBzaWQgPSBhd2FpdCBjb250ZXh0LmNvb2tpZXMuZ2V0KCdzaWQnKTtcbiAgICAgICAgICAgIGlmIChzaWQgJiYgdHlwZW9mIHNpZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHF1ZXN0aW9uUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgcXVlc3Rpb24sIGZ1bmN0aW9uX3NpZ25hdHVyZSwgZGVmYXVsdF9jdXN0b21faW5wdXQgZnJvbSBxdWVzdGlvbnMgd2hlcmUgaWQgPSBcIlxuICAgICAgICAgICAgICAgICAgICArIHNpZHNRdWVzdGlvbnNbc2lkXVtzaWRzUHJvZ3Jlc3Nbc2lkXV0udG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VCb2R5IDogUXVlc3Rpb25EYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICBxdWVzdGlvbjogcXVlc3Rpb25SZXN1bHQucm93c1swXVswXSBhcyBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uX3NpZ25hdHVyZTogcXVlc3Rpb25SZXN1bHQucm93c1swXVsxXSBhcyBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHRfY3VzdG9tX2lucHV0OiBxdWVzdGlvblJlc3VsdC5yb3dzWzBdWzJdIGFzIHN0cmluZyxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHJlc3BvbnNlQm9keTtcbiAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLmdldChcIi9hcGkvbWF0Y2htYWtpbmdcIiwgYXN5bmMgKGNvbnRleHQpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBzaWQgPSBhd2FpdCBjb250ZXh0LmNvb2tpZXMuZ2V0KCdzaWQnKTtcbiAgICAgICAgICAgIGlmIChzaWQgJiYgdHlwZW9mIHNpZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBsZXQgdXNlcm5hbWUgPSBzaWRzW3NpZCBhcyBzdHJpbmddO1xuICAgICAgICAgICAgICAgIGlmICh1c2VybmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IGVsb19yYXRpbmcgZnJvbSB1c2VycyB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgdXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgIGxldCBtYXRjaG1ha2luZ1VzZXI6IE1hdGNobWFraW5nVXNlciA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZzogdXNlcm5hbWVSZXN1bHQucm93c1swXVswXSBhcyBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBzaWQ6IHNpZCxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBxdWV1ZXM6IE1hdGNobWFraW5nVXNlcltdW10gPSBbbWF0Y2htYWtpbmdRdWV1ZTI1LCBtYXRjaG1ha2luZ1F1ZXVlNTAsIG1hdGNobWFraW5nUXVldWUxMDAsIG1hdGNobWFraW5nUXVldWUyMDBdO1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmFuZ2VzOiBudW1iZXJbXSA9IFsyNSwgNTAsIDEwMCwgMjAwXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRlbGF5VGltZXNOdW1zOiBudW1iZXJbXSA9IFsxLCA1LCAxMCwgNjBdO1xuICAgICAgICAgICAgICAgICAgICBsZXQgZm91bmRNYXRjaDogYm9vbGVhbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHF1ZXVlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kTWF0Y2ggPSBhd2FpdCBhZGRUb1F1ZXVlKHF1ZXVlc1tpXSwgbWF0Y2htYWtpbmdVc2VyLCByYW5nZXNbaV0sIGNvbnRleHQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZGVsYXlUaW1lc051bXNbaV07ICsraikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmRNYXRjaCA9IGF3YWl0IGNoZWNrSWZGb3VuZEluUXVldWUoMTAwMCwgbWF0Y2htYWtpbmdVc2VyLCB1c2VybmFtZSwgY29udGV4dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZE1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVGcm9tUXVldWUocXVldWVzW2ldLCBzaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghZm91bmRNYXRjaCAmJiAhYWRkVG9RdWV1ZShtYXRjaG1ha2luZ1F1ZXVlNTAwLCBtYXRjaG1ha2luZ1VzZXIsIDUwMCwgY29udGV4dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlICghKGF3YWl0IGNoZWNrSWZGb3VuZEluUXVldWUoMTAwMCwgbWF0Y2htYWtpbmdVc2VyLCB1c2VybmFtZSwgY29udGV4dCkpKSB7IH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAuZ2V0KFwiL2FwaS9sb2dvdXRcIiwgYXN5bmMgKGNvbnRleHQpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBzaWQgPSBhd2FpdCBjb250ZXh0LmNvb2tpZXMuZ2V0KCdzaWQnKTtcbiAgICAgICAgICAgIGlmIChzaWQgJiYgdHlwZW9mIHNpZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgc2lkc1tzaWQgYXMgc3RyaW5nXTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7IHRleHQ6ICdTdWNjZXNzZnVsbHkgTG9nZ2VkIE91dCcgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAucG9zdChcIi9hcGkvcnVuXCIsIGFzeW5jIChjb250ZXh0OiBSb3V0ZXJDb250ZXh0PGFueT4pID0+IHtcbiAgICAgICAgLy8gY29udGV4dC5yZXNwb25zZS5zdGF0dXMgPSBTdGF0dXMuT0s7XG4gICAgICAgIC8vIGNvbnN0IGR1bWJ5UmVzdWx0OiBUZXN0Q2FzZXNQYXNzZWQgPSB7XG4gICAgICAgIC8vICAgICB0ZXN0Q2FzZXNQYXNzZWQ6IFt0cnVlLCB0cnVlLCB0cnVlLCB0cnVlLCB0cnVlLCB0cnVlLCB0cnVlLCB0cnVlLCB0cnVlLCB0cnVlLCB0cnVlXSxcbiAgICAgICAgLy8gICAgIHN0YW5kYXJkT3V0cHV0OiBcIlRlc3QgU3RhbmRhcmQgT3V0cHV0XCIsXG4gICAgICAgIC8vICAgICBvdXRwdXQ6IFwiVGVzdCBPdXRwdXRcIlxuICAgICAgICAvLyB9XG4gICAgICAgIC8vIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IGR1bWJ5UmVzdWx0XG4gICAgICAgIC8vIHJldHVyblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHNpZCA9IGF3YWl0IGNvbnRleHQuY29va2llcy5nZXQoJ3NpZCcpO1xuICAgICAgICAgICAgaWYgKHNpZCAmJiB0eXBlb2Ygc2lkID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGlmICghY29udGV4dC5yZXF1ZXN0Lmhhc0JvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC50aHJvdyhTdGF0dXMuQmFkUmVxdWVzdCwgXCJCYWQgUmVxdWVzdFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgYm9keSA9IGNvbnRleHQucmVxdWVzdC5ib2R5KCk7XG4gICAgICAgICAgICAgICAgbGV0IGNvZGU6IFBhcnRpYWw8Q29kZVN1Ym1pc3Npb24+IHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGlmIChib2R5LnR5cGUgPT09IFwianNvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvZGUgPSBhd2FpdCBib2R5LnZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoY29kZSkge1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmFzc2VydCh0eXBlb2YgY29kZT8udmFsdWUgPT09IFwic3RyaW5nXCIsIFN0YXR1cy5CYWRSZXF1ZXN0KTtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5hc3NlcnQodHlwZW9mIGNvZGU/LmlucHV0ID09PSBcInN0cmluZ1wiLCBTdGF0dXMuQmFkUmVxdWVzdCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2Uuc3RhdHVzID0gU3RhdHVzLk9LO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoXCIuL3NhbmRib3gvYW5zd2VyLnB5XCIsIGNvZGUudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoXCIuL3NhbmRib3gvYW5zd2VyQ3VzdG9tSW5wdXQucHlcIiwgY29kZS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBpbnB1dExpbmVzOiBzdHJpbmdbXSA9IGNvZGUuaW5wdXQuc3BsaXQoJ1xcbicpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgY3VzdG9tSW5wdXRDb250ZW50OiBzdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgY3VzdG9tSW5wdXRDb250ZW50ICs9IHBhcnNlSW50KGlucHV0TGluZXNbMV0pLnRvU3RyaW5nKCkgKyAnXFxuJztcbiAgICAgICAgICAgICAgICAgICAgbGV0IGlucHV0Q29tbWFTZXBhcmF0ZWRWYWx1ZXM6IHN0cmluZ1tdID0gaW5wdXRMaW5lc1swXS5zcGxpdCgnWycpWzFdLnNwbGl0KCddJylbMF0uc3BsaXQoJywnKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dENvbW1hU2VwYXJhdGVkVmFsdWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21JbnB1dENvbnRlbnQgKz0gcGFyc2VJbnQoaW5wdXRDb21tYVNlcGFyYXRlZFZhbHVlc1tpXSkudG9TdHJpbmcoKSArICdcXG4nO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZShcIi4vc2FuZGJveC9jdXN0b21JbnB1dC5pblwiLCBjdXN0b21JbnB1dENvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXBvcnRQcm9jZXNzID0gRGVuby5ydW4oe1xuICAgICAgICAgICAgICAgICAgICAgICAgY21kOiBbXCIuL21ha2VSZXBvcnQuc2hcIl0sXG4gICAgICAgICAgICAgICAgICAgICAgICBjd2Q6IFwiLi9zYW5kYm94XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGRvdXQ6IFwicGlwZWRcIlxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgcmVwb3J0UHJvY2Vzcy5vdXRwdXQoKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGpzb25SZXN1bHRzOiBTdHJpbmcgPSBhd2FpdCBEZW5vLnJlYWRUZXh0RmlsZShcIi4vc2FuZGJveC9yZXBvcnRGcm9tUHlTYW5kYm94LnR4dFwiKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHN0YW5kYXJkT3V0cHV0UmVzdWx0czogc3RyaW5nID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUoXCIuL3NhbmRib3gvc3RhbmRhcmRPdXRwdXRGcm9tUHlTYW5kYm94LnR4dFwiKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG91dHB1dFJlc3VsdHM6IHN0cmluZyA9IGF3YWl0IERlbm8ucmVhZFRleHRGaWxlKFwiLi9zYW5kYm94L291dHB1dEZyb21QeVNhbmRib3gudHh0XCIpO1xuICAgICAgICAgICAgICAgICAgICBqc29uUmVzdWx0cyA9IGpzb25SZXN1bHRzLnJlcGxhY2UoL1xccy9nLCBcIlwiKTtcbiAgICAgICAgICAgICAgICAgICAganNvblJlc3VsdHMgPSBqc29uUmVzdWx0cy5zdWJzdHJpbmcoMCwganNvblJlc3VsdHMubGVuZ3RoIC0gMikgKyBcIl1cIlxuICAgICAgICAgICAgICAgICAgICBsZXQgdGVzdFJlc3VsdHM6IFRlc3RSZXN1bHRbXSAgPSBKU09OLnBhcnNlKGpzb25SZXN1bHRzLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgdGVzdENhc2VzUGFzc2VkOiBUZXN0Q2FzZXNQYXNzZWQgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXN0Q2FzZXNQYXNzZWQ6IHRlc3RSZXN1bHRzLm1hcCgodHI6IFRlc3RSZXN1bHQpID0+IHRyLnBhc3NlZCksXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFuZGFyZE91dHB1dDogc3RhbmRhcmRPdXRwdXRSZXN1bHRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0OiBvdXRwdXRSZXN1bHRzLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRlc3RDYXNlc1Bhc3NlZC50ZXN0Q2FzZXNQYXNzZWQuc29tZShlbGVtZW50ID0+ICFlbGVtZW50KSAmJiArK3NpZHNQcm9ncmVzc1tzaWRdID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgb3Bwb25lbnRTaWQgPSBtYXRjaGVzW3NpZF07XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgbWF0Y2hlc1tzaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG1hdGNoZXNbb3Bwb25lbnRTaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHNpZHNQcm9ncmVzc1tzaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHNpZHNQcm9ncmVzc1tvcHBvbmVudFNpZF07XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgc2lkc1F1ZXN0aW9uc1tzaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHNpZHNRdWVzdGlvbnNbb3Bwb25lbnRTaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG51bVdpbnM6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1HYW1lczogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZzogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhczI0MDBSYXRpbmdIaXN0b3J5OiBib29sZWFuID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3Bwb25lbnROdW1Mb3NzZXM6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHBvbmVudE51bUdhbWVzOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3Bwb25lbnRFbG9SYXRpbmc6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHBvbmVudEhhczI0MDBSYXRpbmdIaXN0b3J5OiBib29sZWFuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdXNlcm5hbWUgPSBzaWRzW3NpZCBhcyBzdHJpbmddO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IG51bV93aW5zLCBudW1fbG9zc2VzLCBlbG9fcmF0aW5nLCBoYXNfMjQwMF9yYXRpbmdfaGlzdG9yeSBmcm9tIHVzZXJzIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIHVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bVdpbnMgPSB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzBdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1HYW1lcyA9IG51bVdpbnMgKyAodXNlcm5hbWVSZXN1bHQucm93c1swXVsxXSBhcyBudW1iZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZyA9IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMl0gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhczI0MDBSYXRpbmdIaXN0b3J5ID0gdXNlcm5hbWVSZXN1bHQucm93c1swXVszXSBhcyBib29sZWFuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgb3Bwb25lbnRVc2VybmFtZSA9IHNpZHNbb3Bwb25lbnRTaWQgYXMgc3RyaW5nXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3Bwb25lbnRVc2VybmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzZWxlY3QgbnVtX3dpbnMsIG51bV9sb3NzZXMsIGVsb19yYXRpbmcsIGhhc18yNDAwX3JhdGluZ19oaXN0b3J5IGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIG9wcG9uZW50VXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50TnVtTG9zc2VzID0gdXNlcm5hbWVSZXN1bHQucm93c1swXVsxXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50TnVtR2FtZXMgPSAodXNlcm5hbWVSZXN1bHQucm93c1swXVswXSBhcyBudW1iZXIpICsgb3Bwb25lbnROdW1Mb3NzZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50RWxvUmF0aW5nID0gdXNlcm5hbWVSZXN1bHQucm93c1swXVsyXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50SGFzMjQwMFJhdGluZ0hpc3RvcnkgPSB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzNdIGFzIGJvb2xlYW47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKytudW1XaW5zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZWxvUmF0aW5nVmFyaWF0aW9uOiBudW1iZXIgPSAxIC0gMS4wIC8gKDEgKyBNYXRoLnBvdygxMCwgKG9wcG9uZW50RWxvUmF0aW5nIC0gZWxvUmF0aW5nKSAvIDQwMC4wKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZyArPSBNYXRoLmZsb29yKChudW1HYW1lcyA8IDMwID8gKGVsb1JhdGluZyA8IDIzMDAgPyA0MCA6IDIwKSA6IChoYXMyNDAwUmF0aW5nSGlzdG9yeSA/IDEwIDogMjApKSAqIGVsb1JhdGluZ1ZhcmlhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrb3Bwb25lbnROdW1Mb3NzZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50RWxvUmF0aW5nIC09IE1hdGguY2VpbCgob3Bwb25lbnROdW1HYW1lcyA8IDMwID8gKG9wcG9uZW50RWxvUmF0aW5nIDwgMjMwMCA/IDQwIDogMjApIDogKG9wcG9uZW50SGFzMjQwMFJhdGluZ0hpc3RvcnkgPyAxMCA6IDIwKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogZWxvUmF0aW5nVmFyaWF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJ1cGRhdGUgdXNlcnMgc2V0IG51bV93aW5zID0gXCIgKyBudW1XaW5zLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiLCBlbG9fcmF0aW5nID0gXCIgKyBlbG9SYXRpbmcudG9TdHJpbmcoKSArIFwiLCBoYXNfMjQwMF9yYXRpbmdfaGlzdG9yeSA9IFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAoaGFzMjQwMFJhdGluZ0hpc3RvcnkgfHwgZWxvUmF0aW5nID49IDI0MDApLnRvU3RyaW5nKCkgKyBcIiB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIHVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHBvbmVudFVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJ1cGRhdGUgdXNlcnMgc2V0IG51bV9sb3NzZXMgPSBcIiArIG9wcG9uZW50TnVtTG9zc2VzLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiLCBlbG9fcmF0aW5nID0gXCIgKyBvcHBvbmVudEVsb1JhdGluZy50b1N0cmluZygpICsgXCIsIGhhc18yNDAwX3JhdGluZ19oaXN0b3J5ID0gXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIChvcHBvbmVudEhhczI0MDBSYXRpbmdIaXN0b3J5IHx8IG9wcG9uZW50RWxvUmF0aW5nID49IDI0MDApLnRvU3RyaW5nKCkgKyBcIiB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIG9wcG9uZW50VXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0gdGVzdENhc2VzUGFzc2VkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSk7XG5hcHAudXNlKHJvdXRlci5yb3V0ZXMoKSk7XG5hcHAudXNlKHJvdXRlci5hbGxvd2VkTWV0aG9kcygpKTtcbmFwcC51c2UoYXN5bmMgKGNvbnRleHQpID0+IHtcbiAgICBpZiAoIWNvbnRleHQucmVxdWVzdC51cmwucGF0aG5hbWUuZW5kc1dpdGgoJy5qcycpXG4gICAgICAgICYmICFjb250ZXh0LnJlcXVlc3QudXJsLnBhdGhuYW1lLmVuZHNXaXRoKCcucG5nJylcbiAgICAgICAgJiYgIWNvbnRleHQucmVxdWVzdC51cmwucGF0aG5hbWUuZW5kc1dpdGgoJy5pY28nKVxuICAgICAgICAmJiAhY29udGV4dC5yZXF1ZXN0LnVybC5wYXRobmFtZS5lbmRzV2l0aCgnLnR4dCcpKVx0e1xuICAgICAgICBjb250ZXh0LnJlcXVlc3QudXJsLnBhdGhuYW1lID0gJy8nO1xuICAgIH1cbiAgICBhd2FpdCBjb250ZXh0LnNlbmQoe1xuICAgICAgICByb290OiBgJHtEZW5vLmN3ZCgpfS9yZWFjdC1hcHAvYnVpbGRgLFxuICAgICAgICBpbmRleDogXCJpbmRleC5odG1sXCIsXG4gICAgfSk7XG59KTtcbmNvbnNvbGUubG9nKFwiUnVubmluZyBvbiBwb3J0XCIsIHBvcnQpO1xuYXdhaXQgYXBwLmxpc3Rlbih7IHBvcnQgfSk7XG4iXX0=