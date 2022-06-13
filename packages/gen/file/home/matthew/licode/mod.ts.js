import { Application, Router, Status, } from "https://deno.land/x/oak/mod.ts";
import { Client } from "https://deno.land/x/postgres@v0.15.0/mod.ts";
import { crypto } from "https://deno.land/std@0.132.0/crypto/mod.ts";
import { nanoid } from 'https://deno.land/x/nanoid@v3.0.0/async.ts';
import { ensureDir } from 'https://deno.land/std@0.136.0/fs/mod.ts';
import { parse } from "https://deno.land/std@0.143.0/flags/mod.ts";
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
const args = parse(Deno.args, { alias: { "prod": "p" }, boolean: ["prod"], });
const prod = args.prod;
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
function registerPairEndPoint() {
    return prod ? "https://licode.io/registerPair" : "http://localhost:5000/registerPair";
}
function generateTestCaseString(allTestCases, format, j, shouldPrint) {
    let testCaseString = '';
    let testCase = allTestCases[j].split(';');
    let k = 0;
    let m = 0;
    let mMax = 0;
    let n = 0;
    let nMax = 0;
    let insideArray = false;
    let insideArrayArray = false;
    if (shouldPrint) {
        console.log("OUTPUTOUTPUTOUTPUTOUTPUTOUTPUTOUTPUTOUTPUTOUTPUTOUTPUT");
    }
    for (let l = 0; l < testCase.length; ++l) {
        if (shouldPrint) {
            console.log("L" + l.toString() + "L");
            console.log("LI" + testCase[l] + "LI");
        }
        if (format[k] == 'n') {
            if (shouldPrint) {
                console.log("K" + k.toString() + "K");
            }
            testCaseString += testCase[l] + '\n';
            ++k;
        }
        else if (format[k] == 'a') {
            if (insideArray) {
                if (m < mMax) {
                    if (shouldPrint) {
                        console.log("M" + m.toString() + "M");
                    }
                    testCaseString += testCase[l] + '\n';
                    ++m;
                }
                else {
                    if (shouldPrint) {
                        console.log("KK" + k.toString() + "KK");
                    }
                    insideArray = false;
                    ++k;
                    --l;
                }
            }
            else {
                if (shouldPrint) {
                    console.log("MM" + m.toString() + "MM");
                }
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
                            if (shouldPrint) {
                                console.log("N" + n.toString() + "N");
                            }
                            testCaseString += testCase[l] + '\n';
                            ++n;
                        }
                        else {
                            if (shouldPrint) {
                                console.log("MMM" + m.toString() + "MMM");
                            }
                            insideArrayArray = false;
                            ++m;
                            --l;
                        }
                    }
                    else {
                        if (shouldPrint) {
                            console.log("NN" + n.toString() + "NN");
                        }
                        testCaseString += testCase[l] + '\n';
                        n = 0;
                        nMax = parseInt(testCase[l]);
                        insideArrayArray = true;
                    }
                }
                else {
                    if (shouldPrint) {
                        console.log("KKK" + k.toString() + "KKK");
                    }
                    insideArray = false;
                    ++k;
                    --l;
                }
            }
            else {
                if (shouldPrint) {
                    console.log("MMMM" + m.toString() + "MMMM");
                }
                testCaseString += testCase[l] + '\n';
                m = 0;
                mMax = parseInt(testCase[l]);
                insideArray = true;
            }
        }
    }
    if (shouldPrint) {
        console.log("ENDPUTENDPUTENDPUTENDPUTENDPUTENDPUTENDPUTENDPUTENDPUT");
    }
    if (shouldPrint) {
        console.log("DEBPUTDEBPUTDEBPUTDEBPUTDEBPUTDEBPUTDEBPUTDEBPUTDEBPUT");
    }
    if (shouldPrint) {
        console.log(testCaseString);
    }
    if (shouldPrint) {
        console.log("FINPUTFINPUTFINPUTFINPUTFINPUTFINPUTFINPUTFINPUTFINPUT");
    }
    return testCaseString;
}
function generateStubString(inputFormat, outputFormat, functionSignature, normalStub) {
    let stubString = '\n\nimport sys\n\nif __name__ == "__main__":\n';
    for (let i = 0; i < inputFormat.length; ++i) {
        if (inputFormat[i] == 'n') {
            stubString += '    p' + i.toString() + ' = int(input())\n';
        }
        else if (inputFormat[i] == 'a') {
            stubString += '    n' + i.toString() + ' = int(input())\n    p' + i.toString() + ' = []\n    for i in range(n' + i.toString() + '):\n        gh = int(input())\n        p' + i.toString() + '.append(gh)\n';
        }
        else if (inputFormat[i] == 'aa') {
            stubString += '    n' + i.toString() + ' = int(input())\n    p' + i.toString() + ' = []\n    for i in range(n' + i.toString() + '):\n        nn' + i.toString() + ' = int(input())\n        pp' + i.toString() + ' = []\n        for j in range(nn' + i.toString() + '):\n            pp' + i.toString() + '.append(int(input()))\n        p' + i.toString() + '.append(pp' + i.toString() + ')\n';
        }
    }
    stubString += '    result = ' + functionSignature.split('(')[0].split('def ')[1] + '(';
    if (inputFormat.length > 0) {
        stubString += 'p0';
    }
    for (let i = 1; i < inputFormat.length; ++i) {
        stubString += ', p' + i.toString();
    }
    stubString += ')\n';
    if (normalStub) {
        stubString += '    print("v10zg57ZIUF6vjZgSPaDY70TQff8wTHXgodX2otrDMEay0WlS36MjDhHH054uRrFxGHHSegvGcA7eaqB")\n';
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
    }
    return stubString;
}
function generateCleanString(outputFormat, normalClean) {
    let cleanString = '';
    if (outputFormat[0] != 'aa') {
        cleanString += 'import sys\n\nif __name__ == "__main__":\n';
    }
    else {
        cleanString += 'import sys\nimport functools\n\ndef compareNns(x, y):\n    if x[0] > y[0]:\n        return 1\n    elif x[0] < y[0]:\n        return -1\n    else:\n        for i in range(x[0]):\n            if x[1][i] > y[1][i]:\n                return 1\n            if x[1][i] < y[1][i]:\n                return -1\n    return 0\n\nif __name__ == "__main__":\n';
    }
    if (normalClean) {
        cleanString += '    while True:\n        tryInput = input()\n        if (tryInput == "v10zg57ZIUF6vjZgSPaDY70TQff8wTHXgodX2otrDMEay0WlS36MjDhHH054uRrFxGHHSegvGcA7eaqB"):\n            break\n';
    }
    if (outputFormat.length > 0) {
        if (outputFormat[0] == 'n') {
            cleanString += '    qw = input()\n    print(qw)\n';
        }
        else if (outputFormat[0] == 'a') {
            cleanString += '    n = int(input())\n    nums = []\n    for i in range(n):\n        qw = int(input())\n        nums.append(qw)\n    nums.sort()\n    print(n)\n    for i in range(n):\n        print(nums[i])';
        }
        else if (outputFormat[0] == 'aa') {
            cleanString += '    n = int(input())\n    nns = []\n    nums = []\n    for i in range(n):\n        nn = int(input())\n        nns = nns.copy()\n        nns = []\n        nns.append(nn)\n        nnums = []\n        for j in range(nn):\n            qw = int(input())\n            nnums.append(qw)\n        nnums.sort()\n        nns.append(nnums)\n        nums.append(nns)\n    nums.sort(key = functools.cmp_to_key(compareNns))\n    print(n)\n    for i in range(n):\n        print(nums[i][0])\n        for j in range(len(nums[i][1])):\n            print(nums[i][1][j])\n';
        }
    }
    return cleanString;
}
function generateMakeReportString(i) {
    return '#!/bin/bash\n\n(cat stub.py) >> ../answer.py\n(cat stubCustomInput.py) >> ../answerCustomInput.py\n\ncontainerID=$(docker run -dit py-sandbox)\ndocker cp TestInputs/ ${containerID}:home/TestEnvironment/TestInputs/\ndocker cp TestOutputs/ ${containerID}:home/TestEnvironment/TestOutputs/\ndocker cp ../answer.py ${containerID}:home/TestEnvironment/answer.py\ndocker cp ../customInput.in ${containerID}:home/TestEnvironment/customInput.in\ndocker cp ../answerCustomInput.py ${containerID}:home/TestEnvironment/answerCustomInput.py\ndocker cp clean.py ${containerID}:home/TestEnvironment/clean.py\ndocker cp cleanOutput.py ${containerID}:home/TestEnvironment/cleanOutput.py\n\ndocker exec ${containerID} sh -c "cd home/TestEnvironment/ && timeout 10 ./makeReport.sh"\n\ndocker cp ${containerID}:home/TestEnvironment/report.txt ../reportFromPySandbox.txt\ndocker cp ${containerID}:home/TestEnvironment/standardOutput.txt ../standardOutputFromPySandbox.txt\ndocker cp ${containerID}:home/TestEnvironment/standardError.txt ../standardErrorFromPySandbox.txt\ndocker cp ${containerID}:home/TestEnvironment/output.txt ../outputFromPySandbox.txt\n\ndocker kill ${containerID}\n\ndocker rm ${containerID}\n\n';
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
            await ensureDir("./sandbox/" + i.toString() + "/TestInputs/");
            await ensureDir("./sandbox/" + i.toString() + "/TestOutputs/");
            await Deno.writeTextFile("./sandbox/" + i.toString() + "/TestInputs/test" + (j + 1).toString() + ".in", generateTestCaseString(allTestCases, inputFormat, j, false));
        }
        let secondHalfThreshold = 2 * numTestCases;
        for (let j = 11; j < secondHalfThreshold; ++j) {
            await Deno.writeTextFile("./sandbox/" + i.toString() + "/TestOutputs/test" + (j - 10).toString() + ".out", generateTestCaseString(allTestCases, outputFormat, j, false));
        }
        await Deno.writeTextFile("./sandbox/" + i.toString() + "/stub.py", generateStubString(inputFormat, outputFormat, functionSignature, true));
        await Deno.writeTextFile("./sandbox/" + i.toString() + "/stubCustomInput.py", generateStubString(inputFormat, outputFormat, functionSignature, false));
        await Deno.writeTextFile("./sandbox/" + i.toString() + "/clean.py", generateCleanString(outputFormat, true));
        await Deno.writeTextFile("./sandbox/" + i.toString() + "/cleanOutput.py", generateCleanString(outputFormat, false));
        await Deno.writeTextFile("./sandbox/" + i.toString() + "/makeReport.sh", generateMakeReportString(i));
        await Deno.run({
            cmd: ["chmod", "u+x", "makeReport.sh"],
            cwd: "./sandbox/" + i.toString()
        });
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
    let questionsInformation = [];
    for (let i = 0; i < questionsSelected.length; ++i) {
        let inputOutputFormat = '';
        for (;;) {
            try {
                await client.connect();
                const selectedResult = await client.queryArray("select input_output_format from questions where id = "
                    + questionsSelected[i].toString());
                console.log("RRR");
                console.log(questionsSelected[i].toString());
                console.log("QQQ");
                console.log(selectedResult);
                console.log("WWW");
                inputOutputFormat = selectedResult.rows[0][0];
                await client.end();
                break;
            }
            catch (error) {
                console.log(error);
            }
        }
        let inputOutputFormats = inputOutputFormat.split('|');
        let inputFormat = inputOutputFormats[0].split(';');
        inputFormat.shift();
        let outputFormat = inputOutputFormats[1].split(';');
        outputFormat.shift();
        let questionInformation = { questionId: questionsSelected[i], inputFormat: inputFormat, outputFormat: outputFormat };
        questionsInformation.push(questionInformation);
    }
    sidsQuestions[matchmakingUser.sid] = questionsInformation;
    sidsQuestions[matches[matchmakingUser.sid]] = questionsInformation;
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
            const response = await fetch(registerPairEndPoint(), {
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
                + sidsQuestions[sid][sidsProgress[sid]].questionId.toString());
            console.log("UUU");
            console.log(sidsQuestions[sid][sidsProgress[sid]].questionId.toString());
            console.log("III");
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
                console.log("ZZZ");
                console.log(code.value);
                console.log("XXX");
                await Deno.writeTextFile("./sandbox/answer.py", code.value);
                await Deno.writeTextFile("./sandbox/answerCustomInput.py", code.value);
                let inputLines = code.input.split('\n');
                let customInputContent = '';
                let questionInformation = sidsQuestions[sid][sidsProgress[sid]];
                for (let i = 0; i < questionInformation.inputFormat.length; ++i) {
                    console.log("OOO");
                    console.log(questionInformation.inputFormat[i]);
                    console.log("PPP");
                    if (questionInformation.inputFormat[i] == 'n') {
                        customInputContent += parseInt(inputLines[i]).toString() + '\n';
                    }
                    else if (questionInformation.inputFormat[i] == 'a') {
                        let inputCommaSeparatedValues = inputLines[i].split('[')[1].split(']')[0].split(',');
                        console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
                        console.log(inputCommaSeparatedValues);
                        console.log("SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS");
                        customInputContent += inputCommaSeparatedValues.length.toString() + '\n';
                        for (let i = 0; i < inputCommaSeparatedValues.length; ++i) {
                            customInputContent += parseInt(inputCommaSeparatedValues[i]).toString() + '\n';
                        }
                        console.log("CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC");
                        console.log(customInputContent);
                        console.log("VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV");
                    }
                    else if (questionInformation.inputFormat[i] == 'aa') {
                        let inputCommaSeparatedValues = inputLines[i].split('[[')[1].split(']]')[0].split('],[');
                        customInputContent += inputCommaSeparatedValues.length.toString() + '\n';
                        for (let i = 0; i < inputCommaSeparatedValues.length; ++i) {
                            let inputCCommaSeparatedValues = inputLines[i].split(',');
                            customInputContent += inputCCommaSeparatedValues.length.toString() + '\n';
                            for (let j = 0; j < inputCCommaSeparatedValues.length; ++j) {
                                customInputContent += parseInt(inputCCommaSeparatedValues[i]).toString() + '\n';
                            }
                        }
                    }
                }
                if (questionInformation.outputFormat.length > 0) {
                    console.log("NNN");
                    console.log(questionInformation.outputFormat[0]);
                    console.log("MMM");
                }
                console.log("AAA");
                await Deno.writeTextFile("./sandbox/customInput.in", customInputContent);
                console.log("AAB");
                const reportProcess = await Deno.run({
                    cmd: ["./makeReport.sh"],
                    cwd: "./sandbox/" + questionInformation.questionId.toString(),
                    stdout: "piped"
                });
                console.log("ABB");
                await reportProcess.output();
                console.log("BBB");
                let jsonResults = await Deno.readTextFile("./sandbox/reportFromPySandbox.txt");
                console.log("!!!");
                console.log(jsonResults);
                console.log("@@@");
                let standardOutputResults = await Deno.readTextFile("./sandbox/standardOutputFromPySandbox.txt");
                let standardErrorResults = await Deno.readTextFile("./sandbox/standardErrorFromPySandbox.txt");
                console.log("STDERRSTDERRSTDERRSTDERRSTDERRSTDERRSTDERRSTDERRSTDERRSTDERR");
                console.log(standardErrorResults);
                console.log("RERERERERERERERERERERERERERERERERERERERERERERERERERERERERERE");
                let outputResults = await Deno.readTextFile("./sandbox/outputFromPySandbox.txt");
                let outputResultsSplit = outputResults.split('\n');
                let actualOutputResults = '';
                if (questionInformation.outputFormat.length > 0) {
                    if (questionInformation.outputFormat[0] == 'n') {
                        if (outputResultsSplit.length > 0) {
                            actualOutputResults += outputResultsSplit[0];
                        }
                    }
                    else if (questionInformation.outputFormat[0] == 'a') {
                        let n = 0;
                        if (outputResultsSplit.length > 0) {
                            n = parseInt(outputResultsSplit[0]);
                        }
                        if (n > 0 && outputResultsSplit.length > 1) {
                            actualOutputResults += '[' + outputResultsSplit[1];
                        }
                        for (let i = 1; i < n; ++i) {
                            actualOutputResults += ', ' + outputResultsSplit[i + 1];
                        }
                        if (n > 0) {
                            actualOutputResults += ']';
                        }
                    }
                    else if (questionInformation.outputFormat[0] == 'aa') {
                        let n = 0;
                        let nn = 0;
                        let k = 0;
                        console.log("###");
                        console.log(outputResultsSplit);
                        console.log("$$$");
                        if (outputResultsSplit.length > 0) {
                            n = parseInt(outputResultsSplit[k++]);
                        }
                        if (n > 0) {
                            actualOutputResults += '[[';
                            if (outputResultsSplit.length > 1) {
                                nn = parseInt(outputResultsSplit[k++]);
                            }
                            if (nn > 0 && outputResultsSplit.length > 2) {
                                actualOutputResults += outputResultsSplit[k++];
                            }
                            for (let i = 1; i < nn; ++i) {
                                actualOutputResults += ', ' + outputResultsSplit[k++];
                            }
                            actualOutputResults += ']';
                        }
                        for (let i = 1; i < n; ++i) {
                            actualOutputResults += ', [';
                            nn = parseInt(outputResultsSplit[k++]);
                            if (nn > 0) {
                                actualOutputResults += outputResultsSplit[k++];
                            }
                            for (let j = 1; j < nn; ++j) {
                                actualOutputResults += ', ' + outputResultsSplit[k++];
                            }
                            actualOutputResults += ']';
                        }
                        if (n > 0) {
                            actualOutputResults += ']';
                        }
                    }
                }
                console.log("CCC");
                console.log(standardOutputResults);
                console.log("DDD");
                console.log(actualOutputResults);
                console.log("EEE");
                jsonResults = jsonResults.replace(/\s/g, "");
                jsonResults = jsonResults.substring(0, jsonResults.length - 2) + "]";
                let testResults = JSON.parse(jsonResults.toString());
                let testCasesPassed = {
                    testCasesPassed: testResults.map((tr) => tr.passed),
                    standardOutput: standardOutputResults,
                    standardError: standardErrorResults,
                    output: actualOutputResults,
                };
                console.log("11111111111111111111111111");
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
                console.log("2222222222222222");
            }
        }
    }
    catch (err) {
        console.log(err);
    }
})
    .get("/api/wildcardEndpoint", async (context) => {
    context.response.body = { endpoint: prod ? "wss://licode.io/ws" : "ws://localhost:5000/ws"
    };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDSCxXQUFXLEVBQ1gsTUFBTSxFQUVOLE1BQU0sR0FFVCxNQUFNLGdDQUFnQyxDQUFDO0FBTXhDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSw2Q0FBNkMsQ0FBQztBQUNyRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sNkNBQTZDLENBQUM7QUFDckUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLDRDQUE0QyxDQUFBO0FBQ25FLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSx5Q0FBeUMsQ0FBQztBQUNwRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sNENBQTRDLENBQUE7QUFDbEUsTUFBTSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUM7SUFDdEIsSUFBSSxFQUFFLFFBQVE7SUFDZCxRQUFRLEVBQUUsUUFBUTtJQUNsQixRQUFRLEVBQUUsUUFBUTtJQUNsQixRQUFRLEVBQUUsV0FBVztJQUNyQixJQUFJLEVBQUUsSUFBSTtJQUNWLEdBQUcsRUFBRTtRQUNELE9BQU8sRUFBRSxLQUFLO1FBQ2QsT0FBTyxFQUFFLEtBQUs7S0FDakI7Q0FDSixDQUFDLENBQUM7QUFDSCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ2hDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUMsS0FBSyxFQUFFLEVBQUMsTUFBTSxFQUFFLEdBQUcsRUFBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFFLENBQUMsQ0FBQTtBQUN6RSxNQUFNLElBQUksR0FBYSxJQUFJLENBQUMsSUFBSSxDQUFBO0FBQ2hDLE1BQU0sR0FBRyxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7QUFDOUIsTUFBTSxNQUFNLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQWtD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QkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNyQyxNQUFNLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgICBBcHBsaWNhdGlvbixcbiAgICBSb3V0ZXIsXG4gICAgUm91dGVyQ29udGV4dCxcbiAgICBTdGF0dXMsXG4gICAgc2VuZCxcbn0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3gvb2FrL21vZC50c1wiO1xuXG5pbXBvcnQgeyBNYXRjaG1ha2luZ0RhdGEgfSBmcm9tIFwiLi9yZWFjdC1hcHAvc3JjL2NvbXBvbmVudHMvY29tbW9uL2ludGVyZmFjZXMvbWF0Y2htYWtpbmdEYXRhLnRzXCI7XG5pbXBvcnQgeyBRdWVzdGlvbkRhdGEgfSBmcm9tIFwiLi9yZWFjdC1hcHAvc3JjL2NvbXBvbmVudHMvY29tbW9uL2ludGVyZmFjZXMvbWF0Y2htYWtpbmdEYXRhLnRzXCI7XG5pbXBvcnQgeyBUZXN0Q2FzZXNQYXNzZWQgfSBmcm9tIFwiLi9yZWFjdC1hcHAvc3JjL2NvbXBvbmVudHMvY29tbW9uL2ludGVyZmFjZXMvbWF0Y2htYWtpbmdEYXRhLnRzXCI7XG5cbmltcG9ydCB7IENsaWVudCB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC94L3Bvc3RncmVzQHYwLjE1LjAvbW9kLnRzXCI7XG5pbXBvcnQgeyBjcnlwdG8gfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQDAuMTMyLjAvY3J5cHRvL21vZC50c1wiO1xuaW1wb3J0IHsgbmFub2lkIH0gZnJvbSAnaHR0cHM6Ly9kZW5vLmxhbmQveC9uYW5vaWRAdjMuMC4wL2FzeW5jLnRzJ1xuaW1wb3J0IHsgZW5zdXJlRGlyIH0gZnJvbSAnaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQDAuMTM2LjAvZnMvbW9kLnRzJztcbmltcG9ydCB7IHBhcnNlIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE0My4wL2ZsYWdzL21vZC50c1wiXG5jb25zdCBjbGllbnQgPSBuZXcgQ2xpZW50KHtcbiAgICB1c2VyOiBcImxpY29kZVwiLFxuICAgIGRhdGFiYXNlOiBcImxpY29kZVwiLFxuICAgIHBhc3N3b3JkOiBcImVkb2NpbFwiLFxuICAgIGhvc3RuYW1lOiBcImxvY2FsaG9zdFwiLFxuICAgIHBvcnQ6IDU0MzIsXG4gICAgdGxzOiB7XG4gICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICBlbmZvcmNlOiBmYWxzZSxcbiAgICB9LFxufSk7XG5jb25zdCBlbnYgPSBEZW5vLmVudi50b09iamVjdCgpO1xuY29uc3QgYXJncyA9IHBhcnNlKERlbm8uYXJncywge2FsaWFzOiB7XCJwcm9kXCI6IFwicFwifSwgYm9vbGVhbjogW1wicHJvZFwiXSx9KVxuY29uc3QgcHJvZCA6IGJvb2xlYW4gPSBhcmdzLnByb2RcbmNvbnN0IGFwcCA9IG5ldyBBcHBsaWNhdGlvbigpO1xuY29uc3Qgcm91dGVyID0gbmV3IFJvdXRlcigpO1xuLy9sZXQgaWlpQ291bnRlciA9IDA7XG5cbmludGVyZmFjZSBIZWxsb1dvcmxkIHtcbiAgICB0ZXh0OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBVc2VyIHtcbiAgICBlbWFpbDogeyB2YWx1ZTogc3RyaW5nIH07XG4gICAgdXNlcm5hbWU6IHsgdmFsdWU6IHN0cmluZyB9O1xuICAgIHBhc3N3b3JkOiB7IHZhbHVlOiBzdHJpbmcgfTtcbn1cblxuaW50ZXJmYWNlIE1hdGNobWFraW5nVXNlciB7XG4gICAgZWxvUmF0aW5nOiBudW1iZXI7XG4gICAgc2lkOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBDb2RlU3VibWlzc2lvbiB7XG4gICAgdmFsdWU6IHN0cmluZztcbiAgICBpbnB1dDogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgVGVzdFJlc3VsdCB7XG4gICAgdGVzdE5hbWU6IHN0cmluZyxcbiAgICBwYXNzZWQ6IGJvb2xlYW5cbn1cblxuaW50ZXJmYWNlIFF1ZXN0aW9uSW5mb3JtYXRpb24ge1xuICAgIHF1ZXN0aW9uSWQ6IG51bWJlcixcbiAgICBpbnB1dEZvcm1hdDogc3RyaW5nW10sXG4gICAgb3V0cHV0Rm9ybWF0OiBzdHJpbmdbXSxcbn1cblxuY29uc3QgbnVtUXVlc3Rpb25zUGVyTWF0Y2ggPSAzO1xuXG5sZXQgaGVsbG9Xb3JsZFZhcjogSGVsbG9Xb3JsZCA9IHsgdGV4dDogJ0hlbGxvIFdvcmxkJyB9O1xuXG5sZXQgc2lkczogeyBbbmFtZTogc3RyaW5nXTogc3RyaW5nIH0gPSB7fTtcblxubGV0IHNpZHNQcm9ncmVzczogeyBbbmFtZTogc3RyaW5nXTogbnVtYmVyIH0gPSB7fTtcblxubGV0IHNpZHNRdWVzdGlvbnM6IHsgW25hbWU6IHN0cmluZ106IFF1ZXN0aW9uSW5mb3JtYXRpb25bXSB9ID0ge307XG5cbmxldCBtYXRjaG1ha2luZ1F1ZXVlMjU6IE1hdGNobWFraW5nVXNlcltdID0gW107XG5sZXQgbWF0Y2htYWtpbmdRdWV1ZTUwOiBNYXRjaG1ha2luZ1VzZXJbXSA9IFtdO1xubGV0IG1hdGNobWFraW5nUXVldWUxMDA6IE1hdGNobWFraW5nVXNlcltdID0gW107XG5sZXQgbWF0Y2htYWtpbmdRdWV1ZTIwMDogTWF0Y2htYWtpbmdVc2VyW10gPSBbXTtcbmxldCBtYXRjaG1ha2luZ1F1ZXVlNTAwOiBNYXRjaG1ha2luZ1VzZXJbXSA9IFtdO1xuXG5sZXQgbWF0Y2hlczogeyBbbmFtZTogc3RyaW5nXTogc3RyaW5nIH0gPSB7fTtcblxuY29uc3QgbnVtVGVzdENhc2VzOiBudW1iZXIgPSAxMTtcblxuZnVuY3Rpb24gcmVnaXN0ZXJQYWlyRW5kUG9pbnQoKSA6IHN0cmluZyB7XG4gICAgcmV0dXJuIHByb2QgPyBcImh0dHBzOi8vbGljb2RlLmlvL3JlZ2lzdGVyUGFpclwiIDogXCJodHRwOi8vbG9jYWxob3N0OjUwMDAvcmVnaXN0ZXJQYWlyXCI7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlVGVzdENhc2VTdHJpbmcoYWxsVGVzdENhc2VzOiBzdHJpbmdbXSwgZm9ybWF0OiBzdHJpbmdbXSwgajogbnVtYmVyLCBzaG91bGRQcmludDogYm9vbGVhbikge1xuICAgIGxldCB0ZXN0Q2FzZVN0cmluZyA9ICcnO1xuICAgIGxldCB0ZXN0Q2FzZSA9IGFsbFRlc3RDYXNlc1tqXS5zcGxpdCgnOycpO1xuICAgIGxldCBrID0gMDtcbiAgICBsZXQgbSA9IDA7XG4gICAgbGV0IG1NYXggPSAwO1xuICAgIGxldCBuID0gMDtcbiAgICBsZXQgbk1heCA9IDA7XG4gICAgbGV0IGluc2lkZUFycmF5ID0gZmFsc2U7XG4gICAgbGV0IGluc2lkZUFycmF5QXJyYXkgPSBmYWxzZTtcbiAgICBpZiAoc2hvdWxkUHJpbnQpIHsgY29uc29sZS5sb2coXCJPVVRQVVRPVVRQVVRPVVRQVVRPVVRQVVRPVVRQVVRPVVRQVVRPVVRQVVRPVVRQVVRPVVRQVVRcIik7IH1cbiAgICBmb3IgKGxldCBsID0gMDsgbCA8IHRlc3RDYXNlLmxlbmd0aDsgKytsKSB7XG4gICAgICAgIGlmIChzaG91bGRQcmludCkgeyBjb25zb2xlLmxvZyhcIkxcIiArIGwudG9TdHJpbmcoKSArIFwiTFwiKTsgY29uc29sZS5sb2coXCJMSVwiICsgdGVzdENhc2VbbF0gKyBcIkxJXCIpOyB9XG4gICAgICAgIGlmIChmb3JtYXRba10gPT0gJ24nKSB7XG4gICAgICAgICAgICBpZiAoc2hvdWxkUHJpbnQpIHsgY29uc29sZS5sb2coXCJLXCIgKyBrLnRvU3RyaW5nKCkgKyBcIktcIik7IH1cbiAgICAgICAgICAgIHRlc3RDYXNlU3RyaW5nICs9IHRlc3RDYXNlW2xdICsgJ1xcbic7XG4gICAgICAgICAgICArK2s7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0W2tdID09ICdhJykge1xuICAgICAgICAgICAgaWYgKGluc2lkZUFycmF5KSB7XG4gICAgICAgICAgICAgICAgaWYgKG0gPCBtTWF4KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzaG91bGRQcmludCkgeyBjb25zb2xlLmxvZyhcIk1cIiArIG0udG9TdHJpbmcoKSArIFwiTVwiKTsgfVxuICAgICAgICAgICAgICAgICAgICB0ZXN0Q2FzZVN0cmluZyArPSB0ZXN0Q2FzZVtsXSArICdcXG4nO1xuICAgICAgICAgICAgICAgICAgICArK207XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNob3VsZFByaW50KSB7IGNvbnNvbGUubG9nKFwiS0tcIiArIGsudG9TdHJpbmcoKSArIFwiS0tcIik7IH1cbiAgICAgICAgICAgICAgICAgICAgaW5zaWRlQXJyYXkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgKytrO1xuICAgICAgICAgICAgICAgICAgICAtLWw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoc2hvdWxkUHJpbnQpIHsgY29uc29sZS5sb2coXCJNTVwiICsgbS50b1N0cmluZygpICsgXCJNTVwiKTsgfVxuICAgICAgICAgICAgICAgIHRlc3RDYXNlU3RyaW5nICs9IHRlc3RDYXNlW2xdICsgJ1xcbic7XG4gICAgICAgICAgICAgICAgbSA9IDA7XG4gICAgICAgICAgICAgICAgbU1heCA9IHBhcnNlSW50KHRlc3RDYXNlW2xdKTtcbiAgICAgICAgICAgICAgICBpbnNpZGVBcnJheSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybWF0W2tdID09ICdhYScpIHtcbiAgICAgICAgICAgIGlmIChpbnNpZGVBcnJheSkge1xuICAgICAgICAgICAgICAgIGlmIChtIDwgbU1heCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5zaWRlQXJyYXlBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG4gPCBuTWF4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNob3VsZFByaW50KSB7IGNvbnNvbGUubG9nKFwiTlwiICsgbi50b1N0cmluZygpICsgXCJOXCIpOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVzdENhc2VTdHJpbmcgKz0gdGVzdENhc2VbbF0gKyAnXFxuJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArK247XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzaG91bGRQcmludCkgeyBjb25zb2xlLmxvZyhcIk1NTVwiICsgbS50b1N0cmluZygpICsgXCJNTU1cIik7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnNpZGVBcnJheUFycmF5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyttO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0tbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzaG91bGRQcmludCkgeyBjb25zb2xlLmxvZyhcIk5OXCIgKyBuLnRvU3RyaW5nKCkgKyBcIk5OXCIpOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXN0Q2FzZVN0cmluZyArPSB0ZXN0Q2FzZVtsXSArICdcXG4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgbiA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBuTWF4ID0gcGFyc2VJbnQodGVzdENhc2VbbF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5zaWRlQXJyYXlBcnJheSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2hvdWxkUHJpbnQpIHsgY29uc29sZS5sb2coXCJLS0tcIiArIGsudG9TdHJpbmcoKSArIFwiS0tLXCIpOyB9XG4gICAgICAgICAgICAgICAgICAgIGluc2lkZUFycmF5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICsraztcbiAgICAgICAgICAgICAgICAgICAgLS1sO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHNob3VsZFByaW50KSB7IGNvbnNvbGUubG9nKFwiTU1NTVwiICsgbS50b1N0cmluZygpICsgXCJNTU1NXCIpOyB9XG4gICAgICAgICAgICAgICAgdGVzdENhc2VTdHJpbmcgKz0gdGVzdENhc2VbbF0gKyAnXFxuJztcbiAgICAgICAgICAgICAgICBtID0gMDtcbiAgICAgICAgICAgICAgICBtTWF4ID0gcGFyc2VJbnQodGVzdENhc2VbbF0pO1xuICAgICAgICAgICAgICAgIGluc2lkZUFycmF5ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoc2hvdWxkUHJpbnQpIHsgY29uc29sZS5sb2coXCJFTkRQVVRFTkRQVVRFTkRQVVRFTkRQVVRFTkRQVVRFTkRQVVRFTkRQVVRFTkRQVVRFTkRQVVRcIik7IH1cbiAgICBpZiAoc2hvdWxkUHJpbnQpIHsgY29uc29sZS5sb2coXCJERUJQVVRERUJQVVRERUJQVVRERUJQVVRERUJQVVRERUJQVVRERUJQVVRERUJQVVRERUJQVVRcIik7IH1cbiAgICBpZiAoc2hvdWxkUHJpbnQpIHsgY29uc29sZS5sb2codGVzdENhc2VTdHJpbmcpOyB9XG4gICAgaWYgKHNob3VsZFByaW50KSB7IGNvbnNvbGUubG9nKFwiRklOUFVURklOUFVURklOUFVURklOUFVURklOUFVURklOUFVURklOUFVURklOUFVURklOUFVUXCIpOyB9XG4gICAgcmV0dXJuIHRlc3RDYXNlU3RyaW5nO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZVN0dWJTdHJpbmcoaW5wdXRGb3JtYXQ6IHN0cmluZ1tdLCBvdXRwdXRGb3JtYXQ6IHN0cmluZ1tdLCBmdW5jdGlvblNpZ25hdHVyZTogc3RyaW5nLCBub3JtYWxTdHViOiBib29sZWFuKSB7XG4gICAgbGV0IHN0dWJTdHJpbmcgPSAnXFxuXFxuaW1wb3J0IHN5c1xcblxcbmlmIF9fbmFtZV9fID09IFwiX19tYWluX19cIjpcXG4nO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRGb3JtYXQubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKGlucHV0Rm9ybWF0W2ldID09ICduJykge1xuICAgICAgICAgICAgc3R1YlN0cmluZyArPSAnICAgIHAnICsgaS50b1N0cmluZygpICsgJyA9IGludChpbnB1dCgpKVxcbic7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5wdXRGb3JtYXRbaV0gPT0gJ2EnKSB7XG4gICAgICAgICAgICBzdHViU3RyaW5nICs9ICcgICAgbicgKyBpLnRvU3RyaW5nKCkgKyAnID0gaW50KGlucHV0KCkpXFxuICAgIHAnICsgaS50b1N0cmluZygpICsgJyA9IFtdXFxuICAgIGZvciBpIGluIHJhbmdlKG4nICsgaS50b1N0cmluZygpICsgJyk6XFxuICAgICAgICBnaCA9IGludChpbnB1dCgpKVxcbiAgICAgICAgcCcgKyBpLnRvU3RyaW5nKCkgKyAnLmFwcGVuZChnaClcXG4nO1xuICAgICAgICB9IGVsc2UgaWYgKGlucHV0Rm9ybWF0W2ldID09ICdhYScpIHtcbiAgICAgICAgICAgIHN0dWJTdHJpbmcgKz0gJyAgICBuJyArIGkudG9TdHJpbmcoKSArICcgPSBpbnQoaW5wdXQoKSlcXG4gICAgcCcgKyBpLnRvU3RyaW5nKCkgKyAnID0gW11cXG4gICAgZm9yIGkgaW4gcmFuZ2UobicgKyBpLnRvU3RyaW5nKCkgKyAnKTpcXG4gICAgICAgIG5uJyArIGkudG9TdHJpbmcoKSArICcgPSBpbnQoaW5wdXQoKSlcXG4gICAgICAgIHBwJyArIGkudG9TdHJpbmcoKSArICcgPSBbXVxcbiAgICAgICAgZm9yIGogaW4gcmFuZ2Uobm4nICsgaS50b1N0cmluZygpICsgJyk6XFxuICAgICAgICAgICAgcHAnICsgaS50b1N0cmluZygpICsgJy5hcHBlbmQoaW50KGlucHV0KCkpKVxcbiAgICAgICAgcCcgKyBpLnRvU3RyaW5nKCkgKyAnLmFwcGVuZChwcCcgKyBpLnRvU3RyaW5nKCkgKyAnKVxcbic7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3R1YlN0cmluZyArPSAnICAgIHJlc3VsdCA9ICcgKyBmdW5jdGlvblNpZ25hdHVyZS5zcGxpdCgnKCcpWzBdLnNwbGl0KCdkZWYgJylbMV0gKyAnKCc7XG4gICAgaWYgKGlucHV0Rm9ybWF0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgc3R1YlN0cmluZyArPSAncDAnO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IGlucHV0Rm9ybWF0Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHN0dWJTdHJpbmcgKz0gJywgcCcgKyBpLnRvU3RyaW5nKClcbiAgICB9XG4gICAgc3R1YlN0cmluZyArPSAnKVxcbic7XG4gICAgaWYgKG5vcm1hbFN0dWIpIHtcbiAgICAgICAgc3R1YlN0cmluZyArPSAnICAgIHByaW50KFwidjEwemc1N1pJVUY2dmpaZ1NQYURZNzBUUWZmOHdUSFhnb2RYMm90ckRNRWF5MFdsUzM2TWpEaEhIMDU0dVJyRnhHSEhTZWd2R2NBN2VhcUJcIilcXG4nXG4gICAgICAgIGlmIChvdXRwdXRGb3JtYXQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgaWYgKG91dHB1dEZvcm1hdFswXSA9PSAnbicpIHtcbiAgICAgICAgICAgICAgICBzdHViU3RyaW5nICs9ICcgICAgcHJpbnQocmVzdWx0KVxcbic7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG91dHB1dEZvcm1hdFswXSA9PSAnYScpIHtcbiAgICAgICAgICAgICAgICBzdHViU3RyaW5nICs9ICcgICAgcHJpbnQobGVuKHJlc3VsdCkpXFxuICAgIGZvciByIGluIHJlc3VsdDpcXG4gICAgICAgIHByaW50KHIpXFxuJztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAob3V0cHV0Rm9ybWF0WzBdID09ICdhYScpIHtcbiAgICAgICAgICAgICAgICBzdHViU3RyaW5nICs9ICcgICAgcHJpbnQobGVuKHJlc3VsdCkpXFxuICAgIGZvciByIGluIHJlc3VsdDpcXG4gICAgICAgIHByaW50KGxlbihyKSlcXG4gICAgICAgIGZvciByciBpbiByOlxcbiAgICAgICAgICAgIHByaW50KHJyKVxcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHN0dWJTdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlQ2xlYW5TdHJpbmcob3V0cHV0Rm9ybWF0OiBzdHJpbmdbXSwgbm9ybWFsQ2xlYW46IGJvb2xlYW4pIHtcbiAgICBsZXQgY2xlYW5TdHJpbmcgPSAnJztcbiAgICBpZiAob3V0cHV0Rm9ybWF0WzBdICE9ICdhYScpIHtcbiAgICAgICAgY2xlYW5TdHJpbmcgKz0gJ2ltcG9ydCBzeXNcXG5cXG5pZiBfX25hbWVfXyA9PSBcIl9fbWFpbl9fXCI6XFxuJztcbiAgICB9IGVsc2Uge1xuICAgICAgICBjbGVhblN0cmluZyArPSAnaW1wb3J0IHN5c1xcbmltcG9ydCBmdW5jdG9vbHNcXG5cXG5kZWYgY29tcGFyZU5ucyh4LCB5KTpcXG4gICAgaWYgeFswXSA+IHlbMF06XFxuICAgICAgICByZXR1cm4gMVxcbiAgICBlbGlmIHhbMF0gPCB5WzBdOlxcbiAgICAgICAgcmV0dXJuIC0xXFxuICAgIGVsc2U6XFxuICAgICAgICBmb3IgaSBpbiByYW5nZSh4WzBdKTpcXG4gICAgICAgICAgICBpZiB4WzFdW2ldID4geVsxXVtpXTpcXG4gICAgICAgICAgICAgICAgcmV0dXJuIDFcXG4gICAgICAgICAgICBpZiB4WzFdW2ldIDwgeVsxXVtpXTpcXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xXFxuICAgIHJldHVybiAwXFxuXFxuaWYgX19uYW1lX18gPT0gXCJfX21haW5fX1wiOlxcbic7XG4gICAgfVxuICAgIGlmIChub3JtYWxDbGVhbikge1xuICAgICAgICBjbGVhblN0cmluZyArPSAnICAgIHdoaWxlIFRydWU6XFxuICAgICAgICB0cnlJbnB1dCA9IGlucHV0KClcXG4gICAgICAgIGlmICh0cnlJbnB1dCA9PSBcInYxMHpnNTdaSVVGNnZqWmdTUGFEWTcwVFFmZjh3VEhYZ29kWDJvdHJETUVheTBXbFMzNk1qRGhISDA1NHVSckZ4R0hIU2VndkdjQTdlYXFCXCIpOlxcbiAgICAgICAgICAgIGJyZWFrXFxuJztcbiAgICB9XG4gICAgaWYgKG91dHB1dEZvcm1hdC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGlmIChvdXRwdXRGb3JtYXRbMF0gPT0gJ24nKSB7XG4gICAgICAgICAgICBjbGVhblN0cmluZyArPSAnICAgIHF3ID0gaW5wdXQoKVxcbiAgICBwcmludChxdylcXG4nO1xuICAgICAgICB9IGVsc2UgaWYgKG91dHB1dEZvcm1hdFswXSA9PSAnYScpIHtcbiAgICAgICAgICAgIGNsZWFuU3RyaW5nICs9ICcgICAgbiA9IGludChpbnB1dCgpKVxcbiAgICBudW1zID0gW11cXG4gICAgZm9yIGkgaW4gcmFuZ2Uobik6XFxuICAgICAgICBxdyA9IGludChpbnB1dCgpKVxcbiAgICAgICAgbnVtcy5hcHBlbmQocXcpXFxuICAgIG51bXMuc29ydCgpXFxuICAgIHByaW50KG4pXFxuICAgIGZvciBpIGluIHJhbmdlKG4pOlxcbiAgICAgICAgcHJpbnQobnVtc1tpXSknO1xuICAgICAgICB9IGVsc2UgaWYgKG91dHB1dEZvcm1hdFswXSA9PSAnYWEnKSB7XG4gICAgICAgICAgICBjbGVhblN0cmluZyArPSAnICAgIG4gPSBpbnQoaW5wdXQoKSlcXG4gICAgbm5zID0gW11cXG4gICAgbnVtcyA9IFtdXFxuICAgIGZvciBpIGluIHJhbmdlKG4pOlxcbiAgICAgICAgbm4gPSBpbnQoaW5wdXQoKSlcXG4gICAgICAgIG5ucyA9IG5ucy5jb3B5KClcXG4gICAgICAgIG5ucyA9IFtdXFxuICAgICAgICBubnMuYXBwZW5kKG5uKVxcbiAgICAgICAgbm51bXMgPSBbXVxcbiAgICAgICAgZm9yIGogaW4gcmFuZ2Uobm4pOlxcbiAgICAgICAgICAgIHF3ID0gaW50KGlucHV0KCkpXFxuICAgICAgICAgICAgbm51bXMuYXBwZW5kKHF3KVxcbiAgICAgICAgbm51bXMuc29ydCgpXFxuICAgICAgICBubnMuYXBwZW5kKG5udW1zKVxcbiAgICAgICAgbnVtcy5hcHBlbmQobm5zKVxcbiAgICBudW1zLnNvcnQoa2V5ID0gZnVuY3Rvb2xzLmNtcF90b19rZXkoY29tcGFyZU5ucykpXFxuICAgIHByaW50KG4pXFxuICAgIGZvciBpIGluIHJhbmdlKG4pOlxcbiAgICAgICAgcHJpbnQobnVtc1tpXVswXSlcXG4gICAgICAgIGZvciBqIGluIHJhbmdlKGxlbihudW1zW2ldWzFdKSk6XFxuICAgICAgICAgICAgcHJpbnQobnVtc1tpXVsxXVtqXSlcXG4nO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjbGVhblN0cmluZztcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVNYWtlUmVwb3J0U3RyaW5nKGk6IG51bWJlcikge1xuICAgIC8vcmV0dXJuICcjIS9iaW4vYmFzaFxcblxcbihjYXQgc3R1Yi5weSkgPj4gYW5zd2VyLnB5XFxuKGNhdCBzdHViQ3VzdG9tSW5wdXQucHkpID4+IGFuc3dlckN1c3RvbUlucHV0LnB5XFxuXFxuY29udGFpbmVySUQ9JChkb2NrZXIgcnVuIC1kaXQgcHktc2FuZGJveClcXG5kb2NrZXIgY3AgVGVzdElucHV0cy8gJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvVGVzdElucHV0cy9cXG5kb2NrZXIgY3AgVGVzdE91dHB1dHMvICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L1Rlc3RPdXRwdXRzL1xcbmRvY2tlciBjcCBhbnN3ZXIucHkgJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvYW5zd2VyLnB5XFxuZG9ja2VyIGNwIGN1c3RvbUlucHV0LmluICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L2N1c3RvbUlucHV0LmluXFxuZG9ja2VyIGNwIGFuc3dlckN1c3RvbUlucHV0LnB5ICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L2Fuc3dlckN1c3RvbUlucHV0LnB5XFxuZG9ja2VyIGNwIGNsZWFuLnB5ICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L2NsZWFuLnB5XFxuXFxuZG9ja2VyIGV4ZWMgJHtjb250YWluZXJJRH0gc2ggLWMgXCJjZCBob21lL1Rlc3RFbnZpcm9ubWVudC8gJiYgdGltZW91dCAxMCAuL21ha2VSZXBvcnQuc2hcIlxcblxcbmRvY2tlciBjcCAke2NvbnRhaW5lcklEfTpob21lL1Rlc3RFbnZpcm9ubWVudC9yZXBvcnQudHh0IHJlcG9ydEZyb21QeVNhbmRib3gudHh0XFxuZG9ja2VyIGNwICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L3N0YW5kYXJkT3V0cHV0LnR4dCBzdGFuZGFyZE91dHB1dEZyb21QeVNhbmRib3gudHh0XFxuZG9ja2VyIGNwICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L291dHB1dC50eHQgb3V0cHV0RnJvbVB5U2FuZGJveC50eHRcXG5cXG5kb2NrZXIga2lsbCAke2NvbnRhaW5lcklEfVxcblxcbmRvY2tlciBybSAke2NvbnRhaW5lcklEfVxcblxcbic7XG4gICAgcmV0dXJuICcjIS9iaW4vYmFzaFxcblxcbihjYXQgc3R1Yi5weSkgPj4gLi4vYW5zd2VyLnB5XFxuKGNhdCBzdHViQ3VzdG9tSW5wdXQucHkpID4+IC4uL2Fuc3dlckN1c3RvbUlucHV0LnB5XFxuXFxuY29udGFpbmVySUQ9JChkb2NrZXIgcnVuIC1kaXQgcHktc2FuZGJveClcXG5kb2NrZXIgY3AgVGVzdElucHV0cy8gJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvVGVzdElucHV0cy9cXG5kb2NrZXIgY3AgVGVzdE91dHB1dHMvICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L1Rlc3RPdXRwdXRzL1xcbmRvY2tlciBjcCAuLi9hbnN3ZXIucHkgJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvYW5zd2VyLnB5XFxuZG9ja2VyIGNwIC4uL2N1c3RvbUlucHV0LmluICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L2N1c3RvbUlucHV0LmluXFxuZG9ja2VyIGNwIC4uL2Fuc3dlckN1c3RvbUlucHV0LnB5ICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L2Fuc3dlckN1c3RvbUlucHV0LnB5XFxuZG9ja2VyIGNwIGNsZWFuLnB5ICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L2NsZWFuLnB5XFxuZG9ja2VyIGNwIGNsZWFuT3V0cHV0LnB5ICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L2NsZWFuT3V0cHV0LnB5XFxuXFxuZG9ja2VyIGV4ZWMgJHtjb250YWluZXJJRH0gc2ggLWMgXCJjZCBob21lL1Rlc3RFbnZpcm9ubWVudC8gJiYgdGltZW91dCAxMCAuL21ha2VSZXBvcnQuc2hcIlxcblxcbmRvY2tlciBjcCAke2NvbnRhaW5lcklEfTpob21lL1Rlc3RFbnZpcm9ubWVudC9yZXBvcnQudHh0IC4uL3JlcG9ydEZyb21QeVNhbmRib3gudHh0XFxuZG9ja2VyIGNwICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L3N0YW5kYXJkT3V0cHV0LnR4dCAuLi9zdGFuZGFyZE91dHB1dEZyb21QeVNhbmRib3gudHh0XFxuZG9ja2VyIGNwICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L3N0YW5kYXJkRXJyb3IudHh0IC4uL3N0YW5kYXJkRXJyb3JGcm9tUHlTYW5kYm94LnR4dFxcbmRvY2tlciBjcCAke2NvbnRhaW5lcklEfTpob21lL1Rlc3RFbnZpcm9ubWVudC9vdXRwdXQudHh0IC4uL291dHB1dEZyb21QeVNhbmRib3gudHh0XFxuXFxuZG9ja2VyIGtpbGwgJHtjb250YWluZXJJRH1cXG5cXG5kb2NrZXIgcm0gJHtjb250YWluZXJJRH1cXG5cXG4nO1xufVxuXG5hc3luYyBmdW5jdGlvbiBsb2FkVGVzdENhc2VzKCkge1xuICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgY29uc3QgcXVlc3Rpb25zUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgY291bnQoKikgZnJvbSBxdWVzdGlvbnNcIik7XG4gICAgbGV0IG51bVF1ZXN0aW9ucyA9IE51bWJlcihxdWVzdGlvbnNSZXN1bHQucm93c1swXVswXSBhcyBudW1iZXIpO1xuICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAxOyBpIDw9IG51bVF1ZXN0aW9uczsgKytpKSB7XG4gICAgICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgZnVuY3Rpb25fc2lnbmF0dXJlLCBpbnB1dF9vdXRwdXRfZm9ybWF0LCB0ZXN0X2Nhc2VzIGZyb20gcXVlc3Rpb25zIHdoZXJlIGlkID0gXCIgKyBpLnRvU3RyaW5nKCkpO1xuICAgICAgICBsZXQgZnVuY3Rpb25TaWduYXR1cmU6IHN0cmluZyA9IHNlbGVjdGVkUmVzdWx0LnJvd3NbMF1bMF0gYXMgc3RyaW5nO1xuICAgICAgICBsZXQgaW5wdXRPdXRwdXRGb3JtYXQgPSBzZWxlY3RlZFJlc3VsdC5yb3dzWzBdWzFdIGFzIHN0cmluZztcbiAgICAgICAgbGV0IHRlc3RDYXNlcyA9IHNlbGVjdGVkUmVzdWx0LnJvd3NbMF1bMl0gYXMgc3RyaW5nO1xuICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgIGxldCBpbnB1dE91dHB1dEZvcm1hdHMgPSBpbnB1dE91dHB1dEZvcm1hdC5zcGxpdCgnfCcpO1xuICAgICAgICBsZXQgaW5wdXRGb3JtYXQ6IHN0cmluZ1tdID0gaW5wdXRPdXRwdXRGb3JtYXRzWzBdLnNwbGl0KCc7Jyk7XG4gICAgICAgIGlucHV0Rm9ybWF0LnNoaWZ0KCk7XG4gICAgICAgIGxldCBvdXRwdXRGb3JtYXQ6IHN0cmluZ1tdID0gaW5wdXRPdXRwdXRGb3JtYXRzWzFdLnNwbGl0KCc7Jyk7XG4gICAgICAgIG91dHB1dEZvcm1hdC5zaGlmdCgpO1xuICAgICAgICBsZXQgYWxsVGVzdENhc2VzOiBzdHJpbmdbXSA9IHRlc3RDYXNlcy5zcGxpdCgnfCcpO1xuICAgICAgICBmb3IgKGxldCBqOiBudW1iZXIgPSAwOyBqIDwgbnVtVGVzdENhc2VzOyArK2opIHtcbiAgICAgICAgICAgIGF3YWl0IGVuc3VyZURpcihcIi4vc2FuZGJveC9cIiArIGkudG9TdHJpbmcoKSArIFwiL1Rlc3RJbnB1dHMvXCIpO1xuICAgICAgICAgICAgYXdhaXQgZW5zdXJlRGlyKFwiLi9zYW5kYm94L1wiICsgaS50b1N0cmluZygpICsgXCIvVGVzdE91dHB1dHMvXCIpO1xuICAgICAgICAgICAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKFwiLi9zYW5kYm94L1wiICsgaS50b1N0cmluZygpICsgXCIvVGVzdElucHV0cy90ZXN0XCIgKyAoaiArIDEpLnRvU3RyaW5nKCkgKyBcIi5pblwiLFxuICAgICAgICAgICAgICAgIGdlbmVyYXRlVGVzdENhc2VTdHJpbmcoYWxsVGVzdENhc2VzLCBpbnB1dEZvcm1hdCwgaiwgLyppID09IDIgJiYgaiA9PSAwKi9mYWxzZSkpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzZWNvbmRIYWxmVGhyZXNob2xkID0gMiAqIG51bVRlc3RDYXNlcztcbiAgICAgICAgZm9yIChsZXQgaiA9IDExOyBqIDwgc2Vjb25kSGFsZlRocmVzaG9sZDsgKytqKSB7XG4gICAgICAgICAgICBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoXCIuL3NhbmRib3gvXCIgKyBpLnRvU3RyaW5nKCkgKyBcIi9UZXN0T3V0cHV0cy90ZXN0XCIgKyAoaiAtIDEwKS50b1N0cmluZygpICsgXCIub3V0XCIsXG4gICAgICAgICAgICAgICAgZ2VuZXJhdGVUZXN0Q2FzZVN0cmluZyhhbGxUZXN0Q2FzZXMsIG91dHB1dEZvcm1hdCwgaiwgZmFsc2UpKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoXCIuL3NhbmRib3gvXCIgKyBpLnRvU3RyaW5nKCkgKyBcIi9zdHViLnB5XCIsIGdlbmVyYXRlU3R1YlN0cmluZyhpbnB1dEZvcm1hdCwgb3V0cHV0Rm9ybWF0LFxuICAgICAgICAgICAgZnVuY3Rpb25TaWduYXR1cmUsIHRydWUpKTtcbiAgICAgICAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKFwiLi9zYW5kYm94L1wiICsgaS50b1N0cmluZygpICsgXCIvc3R1YkN1c3RvbUlucHV0LnB5XCIsIGdlbmVyYXRlU3R1YlN0cmluZyhpbnB1dEZvcm1hdCwgb3V0cHV0Rm9ybWF0LFxuICAgICAgICAgICAgZnVuY3Rpb25TaWduYXR1cmUsIGZhbHNlKSk7XG4gICAgICAgIGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZShcIi4vc2FuZGJveC9cIiArIGkudG9TdHJpbmcoKSArIFwiL2NsZWFuLnB5XCIsIGdlbmVyYXRlQ2xlYW5TdHJpbmcob3V0cHV0Rm9ybWF0LCB0cnVlKSk7XG4gICAgICAgIGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZShcIi4vc2FuZGJveC9cIiArIGkudG9TdHJpbmcoKSArIFwiL2NsZWFuT3V0cHV0LnB5XCIsIGdlbmVyYXRlQ2xlYW5TdHJpbmcob3V0cHV0Rm9ybWF0LCBmYWxzZSkpO1xuICAgICAgICBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoXCIuL3NhbmRib3gvXCIgKyBpLnRvU3RyaW5nKCkgKyBcIi9tYWtlUmVwb3J0LnNoXCIsIGdlbmVyYXRlTWFrZVJlcG9ydFN0cmluZyhpKSk7XG4gICAgICAgIGF3YWl0IERlbm8ucnVuKHtcbiAgICAgICAgICAgIGNtZDogW1wiY2htb2RcIiwgXCJ1K3hcIiwgXCJtYWtlUmVwb3J0LnNoXCJdLFxuICAgICAgICAgICAgY3dkOiBcIi4vc2FuZGJveC9cIiArIGkudG9TdHJpbmcoKVxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmxvYWRUZXN0Q2FzZXMoKTtcblxuZnVuY3Rpb24gZGVsYXkodGltZTogbnVtYmVyKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCB0aW1lKSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNlbGVjdFF1ZXN0aW9ucyhtYXRjaG1ha2luZ1VzZXI6IE1hdGNobWFraW5nVXNlcikge1xuICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgY29uc3QgcXVlc3Rpb25zUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgY291bnQoKikgZnJvbSBxdWVzdGlvbnNcIik7XG4gICAgbGV0IG51bVF1ZXN0aW9ucyA9IE51bWJlcihxdWVzdGlvbnNSZXN1bHQucm93c1swXVswXSBhcyBudW1iZXIpO1xuICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICBsZXQgcXVlc3Rpb25zU2VsZWN0ZWQ6IG51bWJlcltdID0gW107XG4gICAgbGV0IHJhbmRvbVBlcm11dGF0aW9uOiBudW1iZXJbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtUXVlc3Rpb25zOyArK2kpIHtcbiAgICAgICAgcmFuZG9tUGVybXV0YXRpb25baV0gPSBpO1xuICAgIH1cbiAgICAvLyBQYXJ0aWFsIEZpc2hlci1ZYXRlcyBBbGdvcml0aG0gZm9yIHJhbmRvbSBzZWxlY3Rpb24gb2YgcXVlc3Rpb25zXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1RdWVzdGlvbnNQZXJNYXRjaDsgKytpKSB7XG4gICAgICAgIGxldCBqID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbnVtUXVlc3Rpb25zKTtcbiAgICAgICAgW3JhbmRvbVBlcm11dGF0aW9uW2ldLCByYW5kb21QZXJtdXRhdGlvbltqXV0gPSBbcmFuZG9tUGVybXV0YXRpb25bal0sIHJhbmRvbVBlcm11dGF0aW9uW2ldXTtcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1RdWVzdGlvbnNQZXJNYXRjaDsgKytpKSB7XG4gICAgICAgIHF1ZXN0aW9uc1NlbGVjdGVkLnB1c2gocmFuZG9tUGVybXV0YXRpb25baV0gKyAxKTtcbiAgICB9XG4gICAgbGV0IHF1ZXN0aW9uc0luZm9ybWF0aW9uOiBRdWVzdGlvbkluZm9ybWF0aW9uW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHF1ZXN0aW9uc1NlbGVjdGVkLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGxldCBpbnB1dE91dHB1dEZvcm1hdCA9ICcnO1xuICAgICAgICBmb3IgKDs7KSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2VsZWN0ZWRSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBpbnB1dF9vdXRwdXRfZm9ybWF0IGZyb20gcXVlc3Rpb25zIHdoZXJlIGlkID0gXCJcbiAgICAgICAgICAgICAgICAgICAgKyBxdWVzdGlvbnNTZWxlY3RlZFtpXS50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJSUlwiKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhxdWVzdGlvbnNTZWxlY3RlZFtpXS50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlFRUVwiKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzZWxlY3RlZFJlc3VsdCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJXV1dcIik7XG4gICAgICAgICAgICAgICAgaW5wdXRPdXRwdXRGb3JtYXQgPSBzZWxlY3RlZFJlc3VsdC5yb3dzWzBdWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgaW5wdXRPdXRwdXRGb3JtYXRzID0gaW5wdXRPdXRwdXRGb3JtYXQuc3BsaXQoJ3wnKTtcbiAgICAgICAgbGV0IGlucHV0Rm9ybWF0OiBzdHJpbmdbXSA9IGlucHV0T3V0cHV0Rm9ybWF0c1swXS5zcGxpdCgnOycpO1xuICAgICAgICBpbnB1dEZvcm1hdC5zaGlmdCgpO1xuICAgICAgICBsZXQgb3V0cHV0Rm9ybWF0OiBzdHJpbmdbXSA9IGlucHV0T3V0cHV0Rm9ybWF0c1sxXS5zcGxpdCgnOycpO1xuICAgICAgICBvdXRwdXRGb3JtYXQuc2hpZnQoKTtcbiAgICAgICAgbGV0IHF1ZXN0aW9uSW5mb3JtYXRpb246IFF1ZXN0aW9uSW5mb3JtYXRpb24gPSB7IHF1ZXN0aW9uSWQ6IHF1ZXN0aW9uc1NlbGVjdGVkW2ldLCBpbnB1dEZvcm1hdDogaW5wdXRGb3JtYXQsIG91dHB1dEZvcm1hdDogb3V0cHV0Rm9ybWF0IH07XG4gICAgICAgIHF1ZXN0aW9uc0luZm9ybWF0aW9uLnB1c2gocXVlc3Rpb25JbmZvcm1hdGlvbik7XG4gICAgfVxuICAgIHNpZHNRdWVzdGlvbnNbbWF0Y2htYWtpbmdVc2VyLnNpZF0gPSBxdWVzdGlvbnNJbmZvcm1hdGlvbjtcbiAgICBzaWRzUXVlc3Rpb25zW21hdGNoZXNbbWF0Y2htYWtpbmdVc2VyLnNpZF1dID0gcXVlc3Rpb25zSW5mb3JtYXRpb247XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGFkZFRvUXVldWUgKHF1ZXVlOiBNYXRjaG1ha2luZ1VzZXJbXSwgbWF0Y2htYWtpbmdVc2VyOiBNYXRjaG1ha2luZ1VzZXIsIHJhbmdlOiBudW1iZXIsIGNvbnRleHQ6IGFueSkge1xuICAgIHF1ZXVlLnB1c2gobWF0Y2htYWtpbmdVc2VyKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHF1ZXVlLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChxdWV1ZVtpXS5zaWQgIT0gbWF0Y2htYWtpbmdVc2VyLnNpZFxuICAgICAgICAgICAgICAgICYmIE1hdGguYWJzKG1hdGNobWFraW5nVXNlci5lbG9SYXRpbmcgLSBxdWV1ZVtpXS5lbG9SYXRpbmcpIDw9IHJhbmdlKSB7XG4gICAgICAgICAgICBtYXRjaGVzW3F1ZXVlW2ldLnNpZF0gPSBtYXRjaG1ha2luZ1VzZXIuc2lkO1xuICAgICAgICAgICAgbWF0Y2hlc1ttYXRjaG1ha2luZ1VzZXIuc2lkXSA9IHF1ZXVlW2ldLnNpZDtcbiAgICAgICAgICAgIHNpZHNQcm9ncmVzc1txdWV1ZVtpXS5zaWRdID0gMDtcbiAgICAgICAgICAgIHNpZHNQcm9ncmVzc1ttYXRjaG1ha2luZ1VzZXIuc2lkXSA9IDA7XG4gICAgICAgICAgICAvL2NhbiBjYWxsIGdvU2VydmVyL3JlZ2lzdGVyUGFpciBoZXJlXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImF0dGVtcHRpbmcgcmVnaXN0ZXIgcGFpciBcIiArIG1hdGNobWFraW5nVXNlci5zaWQgKyBcIiwgXCIgKyBxdWV1ZVtpXS5zaWQpXG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHJlZ2lzdGVyUGFpckVuZFBvaW50KCksIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAgICAgSWQxOiBtYXRjaG1ha2luZ1VzZXIuc2lkLFxuICAgICAgICAgICAgICAgICAgICBJZDI6IHF1ZXVlW2ldLnNpZCxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIH0pOyAvL1RPRE8gLSBDaGVjayByZXNwb25zZSBcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlLnN0YXR1cyk7XG4gICAgICAgICAgICAvL2NhbiBwcm9iYWJseSBlbGltaW5hdGUgdGhpcywgbWFpbiBwdXJwb3NlIG9mIHRoaXMgYXBpXG4gICAgICAgICAgICAvL21ldGhvZCBpcyB0byBtYXRjaCB1c2VycyBhbmQgcmVnaXN0ZXIgdGhlbSB3aXRoIHRoZSBnbyBzZXJ2ZXJcbiAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHtcbiAgICAgICAgICAgICAgICB1c2VybmFtZTogc2lkc1ttYXRjaG1ha2luZ1VzZXIuc2lkXSxcbiAgICAgICAgICAgICAgICBlbG9SYXRpbmc6IG1hdGNobWFraW5nVXNlci5lbG9SYXRpbmcsXG4gICAgICAgICAgICAgICAgb3Bwb25lbnRVc2VybmFtZTogc2lkc1txdWV1ZVtpXS5zaWRdLFxuICAgICAgICAgICAgICAgIG9wcG9uZW50RWxvUmF0aW5nOiBxdWV1ZVtpXS5lbG9SYXRpbmcsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcXVldWUuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgcXVldWUucG9wKCk7XG4gICAgICAgICAgICBzZWxlY3RRdWVzdGlvbnMobWF0Y2htYWtpbmdVc2VyKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY2hlY2tJZkZvdW5kSW5RdWV1ZShkZWxheVRpbWU6IG51bWJlciwgbWF0Y2htYWtpbmdVc2VyOiBNYXRjaG1ha2luZ1VzZXIsIHVzZXJuYW1lOiBzdHJpbmcsIGNvbnRleHQ6IGFueSkge1xuICAgIGF3YWl0IGRlbGF5KGRlbGF5VGltZSk7XG4gICAgaWYgKG1hdGNobWFraW5nVXNlci5zaWQgaW4gbWF0Y2hlcykge1xuICAgICAgICBsZXQgb3Bwb25lbnRVc2VybmFtZSA9IHNpZHNbbWF0Y2hlc1ttYXRjaG1ha2luZ1VzZXIuc2lkXV07XG4gICAgICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgICAgIGNvbnN0IHVzZXJuYW1lUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgZWxvX3JhdGluZyBmcm9tIHVzZXJzIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgKyB1c2VybmFtZSArIFwiJ1wiKTtcbiAgICAgICAgbGV0IG9wcG9uZW50RWxvUmF0aW5nID0gdXNlcm5hbWVSZXN1bHQucm93c1swXVswXSBhcyBudW1iZXI7XG4gICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0ge1xuICAgICAgICAgICAgdXNlcm5hbWU6IHNpZHNbbWF0Y2htYWtpbmdVc2VyLnNpZF0sXG4gICAgICAgICAgICBlbG9SYXRpbmc6IG1hdGNobWFraW5nVXNlci5lbG9SYXRpbmcsXG4gICAgICAgICAgICBvcHBvbmVudFVzZXJuYW1lOiBvcHBvbmVudFVzZXJuYW1lLFxuICAgICAgICAgICAgb3Bwb25lbnRFbG9SYXRpbmc6IG9wcG9uZW50RWxvUmF0aW5nLFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiByZW1vdmVGcm9tUXVldWUocXVldWU6IE1hdGNobWFraW5nVXNlcltdLCBzaWQ6IHN0cmluZykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcXVldWUubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKHF1ZXVlW2ldLnNpZCA9PT0gc2lkKSB7XG4gICAgICAgICAgICBxdWV1ZS5zcGxpY2UoaSwgMSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNvbnN0IHBvcnQ6IG51bWJlciA9ICtlbnYuTElDT0RFX1BPUlQgfHwgMzAwMDtcbmFwcC5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgKGV2dCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKGV2dC5lcnJvcik7XG59KTtcbnJvdXRlclxuICAgIC5nZXQoXCIvYXBpL2hlbGxvLXdvcmxkXCIsIChjb250ZXh0KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSBoZWxsb1dvcmxkVmFyO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH1cbiAgICB9KVxuICAgIC5wb3N0KFwiL2FwaS9wb3N0LWhlbGxvLXdvcmxkXCIsIGFzeW5jIChjb250ZXh0OiBSb3V0ZXJDb250ZXh0PGFueT4pID0+IHtcbiAgICAgICAgaWYgKCFjb250ZXh0LnJlcXVlc3QuaGFzQm9keSkge1xuICAgICAgICAgICAgY29udGV4dC50aHJvdyhTdGF0dXMuQmFkUmVxdWVzdCwgXCJCYWQgUmVxdWVzdFwiKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBib2R5ID0gY29udGV4dC5yZXF1ZXN0LmJvZHkoKTtcbiAgICAgICAgbGV0IGhlbGxvV29ybGQ6IFBhcnRpYWw8SGVsbG9Xb3JsZD4gfCB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChib2R5LnR5cGUgPT09IFwianNvblwiKSB7XG4gICAgICAgICAgICBoZWxsb1dvcmxkID0gYXdhaXQgYm9keS52YWx1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChib2R5LnR5cGUgPT09IFwiZm9ybVwiKSB7XG4gICAgICAgICAgICBoZWxsb1dvcmxkID0ge307XG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBhd2FpdCBib2R5LnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaGVsbG9Xb3JsZFtrZXkgYXMga2V5b2YgSGVsbG9Xb3JsZF0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChib2R5LnR5cGUgPT09IFwiZm9ybS1kYXRhXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IGZvcm1EYXRhID0gYXdhaXQgYm9keS52YWx1ZS5yZWFkKCk7XG4gICAgICAgICAgICBoZWxsb1dvcmxkID0gZm9ybURhdGEuZmllbGRzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChoZWxsb1dvcmxkKSB7XG4gICAgICAgICAgICBjb250ZXh0LmFzc2VydCh0eXBlb2YgaGVsbG9Xb3JsZC50ZXh0ID09PSBcInN0cmluZ1wiLCBTdGF0dXMuQmFkUmVxdWVzdCk7XG4gICAgICAgICAgICBoZWxsb1dvcmxkVmFyID0gaGVsbG9Xb3JsZCBhcyBIZWxsb1dvcmxkO1xuICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5zdGF0dXMgPSBTdGF0dXMuT0s7XG4gICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSBoZWxsb1dvcmxkO1xuICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS50eXBlID0gXCJqc29uXCI7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29udGV4dC50aHJvdyhTdGF0dXMuQmFkUmVxdWVzdCwgXCJCYWQgUmVxdWVzdFwiKTtcbiAgICB9KVxuICAgIC5wb3N0KFwiL2FwaS9yZWdpc3RlclwiLCBhc3luYyAoY29udGV4dDogUm91dGVyQ29udGV4dDxhbnk+KSA9PiB7XG4gICAgICAgIGxldCBzaWQgPSBhd2FpdCBjb250ZXh0LmNvb2tpZXMuZ2V0KCdzaWQnKTtcbiAgICAgICAgaWYgKCFzaWQpIHtcbiAgICAgICAgICAgIHNpZCA9IGF3YWl0IG5hbm9pZCg0MCk7XG4gICAgICAgICAgICBjb250ZXh0LmNvb2tpZXMuc2V0KCdzaWQnLCBzaWQpO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoIWNvbnRleHQucmVxdWVzdC5oYXNCb2R5KSB7XG4gICAgICAgICAgICAgICAgY29udGV4dC50aHJvdyhTdGF0dXMuQmFkUmVxdWVzdCwgXCJCYWQgUmVxdWVzdFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBjb250ZXh0LnJlcXVlc3QuYm9keSgpO1xuICAgICAgICAgICAgbGV0IHVzZXI6IFBhcnRpYWw8VXNlcj4gfCB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAoYm9keS50eXBlID09PSBcImpzb25cIikge1xuICAgICAgICAgICAgICAgIHVzZXIgPSBhd2FpdCBib2R5LnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0LmFzc2VydChcbiAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHVzZXI/LmVtYWlsPy52YWx1ZSA9PT0gXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgdXNlcj8udXNlcm5hbWU/LnZhbHVlID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgICAgICYmIHR5cGVvZiB1c2VyPy5wYXNzd29yZD8udmFsdWUgPT09IFwic3RyaW5nXCIsIFN0YXR1cy5CYWRSZXF1ZXN0KTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLnN0YXR1cyA9IFN0YXR1cy5PSztcbiAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVzZXJuYW1lUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgdXNlcm5hbWUgZnJvbSB1c2VycyB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgKyB1c2VyPy51c2VybmFtZT8udmFsdWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgaWYgKHVzZXJuYW1lUmVzdWx0LnJvd3MubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbWFpbFJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IGVtYWlsIGZyb20gdXNlcnMgd2hlcmUgZW1haWw9J1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIHVzZXI/LmVtYWlsPy52YWx1ZSArIFwiJ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVtYWlsUmVzdWx0LnJvd3MubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNhbHRIZXhTdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzI7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNhbHRIZXhTdHJpbmcgKz0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogTWF0aC5wb3coMiwgMzIpKS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc2FsdEhleFN0cmluZ0xlbmd0aCA9IHNhbHRIZXhTdHJpbmcubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAyNTYgLSBzYWx0SGV4U3RyaW5nTGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYWx0SGV4U3RyaW5nID0gXCIwXCIgKyBzYWx0SGV4U3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHRleHRFbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgY3J5cHRvLnN1YnRsZS5kaWdlc3QoJ1NIQTMtNTEyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0RW5jb2Rlci5lbmNvZGUodXNlcj8ucGFzc3dvcmQ/LnZhbHVlICsgc2FsdEhleFN0cmluZykpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBoYXNoZWRQYXNzd29yZEhleFN0cmluZyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXkubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNoZWRQYXNzd29yZEhleFN0cmluZyArPSAoaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5W2ldIDwgMTYgPyBcIjBcIiA6IFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5W2ldLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBoYXNoZWRQYXNzd29yZEhleFN0cmluZ0xlbmd0aCA9IGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTI4IC0gaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmdMZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nID0gXCIwXCIgKyBoYXNoZWRQYXNzd29yZEhleFN0cmluZztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaW5zZXJ0IGludG8gcHVibGljLnVzZXJzKGVtYWlsLCB1c2VybmFtZSwgaGFzaGVkX3Bhc3N3b3JkLCBzYWx0LCBudW1fd2lucywgbnVtX2xvc3NlcywgY3JlYXRlZF9hdCwgdXBkYXRlZF9hdCwgZWxvX3JhdGluZywgaGFzXzI0MDBfcmF0aW5nX2hpc3RvcnkpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiIHZhbHVlcyAoJ1wiICsgdXNlcj8uZW1haWw/LnZhbHVlICsgXCInLCAnXCIgKyB1c2VyPy51c2VybmFtZT8udmFsdWUgKyBcIicsICdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgXCJcXFxceFwiICsgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgKyBcIicsICdcIiArIFwiXFxcXHhcIiArIHNhbHRIZXhTdHJpbmcgKyBcIicsICcwJywgJzAnLCBub3coKSwgbm93KCksICcxMDAwJywgJ2ZhbHNlJylcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc2lkID0gYXdhaXQgbmFub2lkKDQwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZHNbc2lkXSA9IHVzZXIudXNlcm5hbWUudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjb250ZXh0LmNvb2tpZXMuc2V0KCdzaWQnLCBzaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0gdXNlcjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHsgdGV4dDogJ0dpdmVuIEVtYWlsIEFscmVhZHkgRXhpc3RzJyB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0geyB0ZXh0OiAnR2l2ZW4gVXNlcm5hbWUgQWxyZWFkeSBFeGlzdHMnIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLnR5cGUgPSBcImpzb25cIjtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250ZXh0LnRocm93KFN0YXR1cy5CYWRSZXF1ZXN0LCBcIkJhZCBSZXF1ZXN0XCIpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH1cbiAgICB9KVxuICAgIC5wb3N0KFwiL2FwaS9sb2dpblwiLCBhc3luYyAoY29udGV4dDogUm91dGVyQ29udGV4dDxhbnk+KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoIWNvbnRleHQucmVxdWVzdC5oYXNCb2R5KSB7XG4gICAgICAgICAgICAgICAgY29udGV4dC50aHJvdyhTdGF0dXMuQmFkUmVxdWVzdCwgXCJCYWQgUmVxdWVzdFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBjb250ZXh0LnJlcXVlc3QuYm9keSgpO1xuICAgICAgICAgICAgbGV0IHVzZXI6IFBhcnRpYWw8VXNlcj4gfCB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAoYm9keS50eXBlID09PSBcImpzb25cIikge1xuICAgICAgICAgICAgICAgIHVzZXIgPSBhd2FpdCBib2R5LnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0LmFzc2VydChcbiAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHVzZXI/LmVtYWlsPy52YWx1ZSA9PT0gXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgdXNlcj8ucGFzc3dvcmQ/LnZhbHVlID09PSBcInN0cmluZ1wiLCBTdGF0dXMuQmFkUmVxdWVzdCk7XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5zdGF0dXMgPSBTdGF0dXMuT0s7XG4gICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IGVtYWlsLCB1c2VybmFtZSwgaGFzaGVkX3Bhc3N3b3JkLCBzYWx0IGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICAgICAgICAgICsgdXNlcj8uZW1haWw/LnZhbHVlICsgXCInXCIpO1xuICAgICAgICAgICAgICAgIGlmICh1c2VybmFtZVJlc3VsdC5yb3dzLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZW1haWxSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBlbWFpbCwgdXNlcm5hbWUsIGhhc2hlZF9wYXNzd29yZCwgc2FsdCBmcm9tIHVzZXJzIHdoZXJlIGVtYWlsPSdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKyB1c2VyPy5lbWFpbD8udmFsdWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbWFpbFJlc3VsdC5yb3dzLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHsgdGV4dDogJ0dpdmVuIEVtYWlsIG9yIFVzZXJuYW1lIERvZXMgTm90IEV4aXN0JyB9O1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNhbHRIZXhTdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgKGVtYWlsUmVzdWx0LnJvd3NbMF1bM10gYXMgVWludDhBcnJheSkubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYWx0SGV4U3RyaW5nICs9ICgoZW1haWxSZXN1bHQucm93c1swXVszXSBhcyBVaW50OEFycmF5KVtpXSA8IDE2ID8gXCIwXCIgOiBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIChlbWFpbFJlc3VsdC5yb3dzWzBdWzNdIGFzIFVpbnQ4QXJyYXkpW2ldLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0ZXh0RW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGhhc2hlZFBhc3N3b3JkVWludDhBcnJheSA9IG5ldyBVaW50OEFycmF5KGF3YWl0IGNyeXB0by5zdWJ0bGUuZGlnZXN0KCdTSEEzLTUxMicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dEVuY29kZXIuZW5jb2RlKHVzZXI/LnBhc3N3b3JkPy52YWx1ZSArIHNhbHRIZXhTdHJpbmcpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgKz0gKGhhc2hlZFBhc3N3b3JkVWludDhBcnJheVtpXSA8IDE2ID8gXCIwXCIgOiBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIGhhc2hlZFBhc3N3b3JkVWludDhBcnJheVtpXS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc2VydmVySGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgKGVtYWlsUmVzdWx0LnJvd3NbMF1bMl0gYXMgVWludDhBcnJheSkubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXJ2ZXJIYXNoZWRQYXNzd29yZEhleFN0cmluZyArPSAoKGVtYWlsUmVzdWx0LnJvd3NbMF1bMl0gYXMgVWludDhBcnJheSlbaV0gPCAxNiA/IFwiMFwiIDogXCJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAoZW1haWxSZXN1bHQucm93c1swXVsyXSBhcyBVaW50OEFycmF5KVtpXS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgPT09IHNlcnZlckhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGZvdW5kVXNlcjogVXNlciA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW1haWw6IHsgdmFsdWU6IGVtYWlsUmVzdWx0LnJvd3NbMF1bMF0gYXMgc3RyaW5nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJuYW1lOiB7IHZhbHVlOiBlbWFpbFJlc3VsdC5yb3dzWzBdWzFdIGFzIHN0cmluZyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzd29yZDogeyB2YWx1ZTogJycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNpZCA9IGF3YWl0IG5hbm9pZCg0MCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2lkc1tzaWRdID0gZm91bmRVc2VyLnVzZXJuYW1lLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNvbnRleHQuY29va2llcy5zZXQoJ3NpZCcsIHNpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0gZm91bmRVc2VyO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7IHRleHQ6ICdXcm9uZyBQYXNzd29yZCcgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBzYWx0SGV4U3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgKHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bM10gYXMgVWludDhBcnJheSkubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhbHRIZXhTdHJpbmcgKz0gKCh1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzNdIGFzIFVpbnQ4QXJyYXkpW2ldIDwgMTYgPyBcIjBcIiA6IFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAodXNlcm5hbWVSZXN1bHQucm93c1swXVszXSBhcyBVaW50OEFycmF5KVtpXS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbGV0IHRleHRFbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXkgPSBuZXcgVWludDhBcnJheShhd2FpdCBjcnlwdG8uc3VidGxlLmRpZ2VzdCgnU0hBMy01MTInLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dEVuY29kZXIuZW5jb2RlKHVzZXI/LnBhc3N3b3JkPy52YWx1ZSArIHNhbHRIZXhTdHJpbmcpKSk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBoYXNoZWRQYXNzd29yZEhleFN0cmluZyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhhc2hlZFBhc3N3b3JkVWludDhBcnJheS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgKz0gKGhhc2hlZFBhc3N3b3JkVWludDhBcnJheVtpXSA8IDE2ID8gXCIwXCIgOiBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5W2ldLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBsZXQgc2VydmVySGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAodXNlcm5hbWVSZXN1bHQucm93c1swXVsyXSBhcyBVaW50OEFycmF5KS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VydmVySGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgKz0gKCh1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzJdIGFzIFVpbnQ4QXJyYXkpW2ldIDwgMTYgPyBcIjBcIiA6IFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAodXNlcm5hbWVSZXN1bHQucm93c1swXVsyXSBhcyBVaW50OEFycmF5KVtpXS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nID09PSBzZXJ2ZXJIYXNoZWRQYXNzd29yZEhleFN0cmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGZvdW5kVXNlcjogVXNlciA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbWFpbDogeyB2YWx1ZTogdXNlcm5hbWVSZXN1bHQucm93c1swXVswXSBhcyBzdHJpbmcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogeyB2YWx1ZTogdXNlcm5hbWVSZXN1bHQucm93c1swXVsxXSBhcyBzdHJpbmcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzd29yZDogeyB2YWx1ZTogJycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzaWQgPSBhd2FpdCBuYW5vaWQoNDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2lkc1tzaWRdID0gZm91bmRVc2VyLnVzZXJuYW1lLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY29udGV4dC5jb29raWVzLnNldCgnc2lkJywgc2lkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IGZvdW5kVXNlcjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHsgdGV4dDogJ1dyb25nIFBhc3N3b3JkJyB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLnR5cGUgPSBcImpzb25cIjtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250ZXh0LnRocm93KFN0YXR1cy5CYWRSZXF1ZXN0LCBcIkJhZCBSZXF1ZXN0XCIpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH1cbiAgICB9KVxuICAgIC5nZXQoXCIvYXBpL3VzZXJcIiwgYXN5bmMgKGNvbnRleHQpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBzaWQgPSBhd2FpdCBjb250ZXh0LmNvb2tpZXMuZ2V0KCdzaWQnKTtcbiAgICAgICAgICAgIGlmIChzaWQgJiYgdHlwZW9mIHNpZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBsZXQgdXNlcm5hbWUgPSBzaWRzW3NpZCBhcyBzdHJpbmddO1xuICAgICAgICAgICAgICAgIGlmICh1c2VybmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IGVtYWlsLCB1c2VybmFtZSwgbnVtX3dpbnMsIG51bV9sb3NzZXMsIGVsb19yYXRpbmcgZnJvbSB1c2VycyB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgdXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgIGxldCBmb3VuZFVzZXI6IFVzZXIgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbWFpbDogeyB2YWx1ZTogdXNlcm5hbWVSZXN1bHQucm93c1swXVswXSBhcyBzdHJpbmcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJuYW1lOiB7IHZhbHVlOiB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzFdIGFzIHN0cmluZyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHsgdmFsdWU6ICcnIH0sXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXNlcjogZm91bmRVc2VyLFxuICAgICAgICAgICAgICAgICAgICAgICAgbnVtV2luczogdXNlcm5hbWVSZXN1bHQucm93c1swXVsyXSBhcyBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBudW1Mb3NzZXM6IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bM10gYXMgbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxvUmF0aW5nOiB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzRdIGFzIG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAuZ2V0KFwiL2FwaS9vcHBvbmVudFwiLCBhc3luYyAoY29udGV4dCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHNpZCA9IGF3YWl0IGNvbnRleHQuY29va2llcy5nZXQoJ3NpZCcpO1xuICAgICAgICAgICAgaWYgKHNpZCAmJiB0eXBlb2Ygc2lkID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGxldCB1c2VybmFtZSA9IHNpZHNbc2lkIGFzIHN0cmluZ107XG4gICAgICAgICAgICAgICAgbGV0IG9wcG9uZW50VXNlcm5hbWUgPSBzaWRzW21hdGNoZXNbc2lkIGFzIHN0cmluZ10gYXMgc3RyaW5nXTtcbiAgICAgICAgICAgICAgICBpZiAodXNlcm5hbWUgJiYgb3Bwb25lbnRVc2VybmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IGVsb19yYXRpbmcgZnJvbSB1c2VycyB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgdXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9wcG9uZW50VXNlcm5hbWVSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBlbG9fcmF0aW5nIGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIG9wcG9uZW50VXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlQm9keSA6IE1hdGNobWFraW5nRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHlvdToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJuYW1lOiB1c2VybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbG9SYXRpbmc6IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMF0gYXMgbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpZDogc2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcm5hbWU6IG9wcG9uZW50VXNlcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxvUmF0aW5nOiBvcHBvbmVudFVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMF0gYXMgbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpZDogJydcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHJlc3BvbnNlQm9keTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAuZ2V0KFwiL2FwaS9xdWVzdGlvblwiLCBhc3luYyAoY29udGV4dCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHNpZCA9IGF3YWl0IGNvbnRleHQuY29va2llcy5nZXQoJ3NpZCcpO1xuICAgICAgICAgICAgaWYgKHNpZCAmJiB0eXBlb2Ygc2lkID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcXVlc3Rpb25SZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBxdWVzdGlvbiwgZnVuY3Rpb25fc2lnbmF0dXJlLCBkZWZhdWx0X2N1c3RvbV9pbnB1dCBmcm9tIHF1ZXN0aW9ucyB3aGVyZSBpZCA9IFwiXG4gICAgICAgICAgICAgICAgICAgICsgc2lkc1F1ZXN0aW9uc1tzaWRdW3NpZHNQcm9ncmVzc1tzaWRdXS5xdWVzdGlvbklkLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVVVVXCIpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHNpZHNRdWVzdGlvbnNbc2lkXVtzaWRzUHJvZ3Jlc3Nbc2lkXV0ucXVlc3Rpb25JZC50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIklJSVwiKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZUJvZHkgOiBRdWVzdGlvbkRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgIHF1ZXN0aW9uOiBxdWVzdGlvblJlc3VsdC5yb3dzWzBdWzBdIGFzIHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb25fc2lnbmF0dXJlOiBxdWVzdGlvblJlc3VsdC5yb3dzWzBdWzFdIGFzIHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdF9jdXN0b21faW5wdXQ6IHF1ZXN0aW9uUmVzdWx0LnJvd3NbMF1bMl0gYXMgc3RyaW5nLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0gcmVzcG9uc2VCb2R5O1xuICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAuZ2V0KFwiL2FwaS9tYXRjaG1ha2luZ1wiLCBhc3luYyAoY29udGV4dCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHNpZCA9IGF3YWl0IGNvbnRleHQuY29va2llcy5nZXQoJ3NpZCcpO1xuICAgICAgICAgICAgaWYgKHNpZCAmJiB0eXBlb2Ygc2lkID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGxldCB1c2VybmFtZSA9IHNpZHNbc2lkIGFzIHN0cmluZ107XG4gICAgICAgICAgICAgICAgaWYgKHVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHVzZXJuYW1lUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgZWxvX3JhdGluZyBmcm9tIHVzZXJzIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKyB1c2VybmFtZSArIFwiJ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1hdGNobWFraW5nVXNlcjogTWF0Y2htYWtpbmdVc2VyID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxvUmF0aW5nOiB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzBdIGFzIG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZDogc2lkLFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHF1ZXVlczogTWF0Y2htYWtpbmdVc2VyW11bXSA9IFttYXRjaG1ha2luZ1F1ZXVlMjUsIG1hdGNobWFraW5nUXVldWU1MCwgbWF0Y2htYWtpbmdRdWV1ZTEwMCwgbWF0Y2htYWtpbmdRdWV1ZTIwMF07XG4gICAgICAgICAgICAgICAgICAgIGxldCByYW5nZXM6IG51bWJlcltdID0gWzI1LCA1MCwgMTAwLCAyMDBdO1xuICAgICAgICAgICAgICAgICAgICBsZXQgZGVsYXlUaW1lc051bXM6IG51bWJlcltdID0gWzEsIDUsIDEwLCA2MF07XG4gICAgICAgICAgICAgICAgICAgIGxldCBmb3VuZE1hdGNoOiBib29sZWFuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcXVldWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmRNYXRjaCA9IGF3YWl0IGFkZFRvUXVldWUocXVldWVzW2ldLCBtYXRjaG1ha2luZ1VzZXIsIHJhbmdlc1tpXSwgY29udGV4dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBkZWxheVRpbWVzTnVtc1tpXTsgKytqKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZE1hdGNoID0gYXdhaXQgY2hlY2tJZkZvdW5kSW5RdWV1ZSgxMDAwLCBtYXRjaG1ha2luZ1VzZXIsIHVzZXJuYW1lLCBjb250ZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kTWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUZyb21RdWV1ZShxdWV1ZXNbaV0sIHNpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmb3VuZE1hdGNoICYmICFhZGRUb1F1ZXVlKG1hdGNobWFraW5nUXVldWU1MDAsIG1hdGNobWFraW5nVXNlciwgNTAwLCBjb250ZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKCEoYXdhaXQgY2hlY2tJZkZvdW5kSW5RdWV1ZSgxMDAwLCBtYXRjaG1ha2luZ1VzZXIsIHVzZXJuYW1lLCBjb250ZXh0KSkpIHsgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH1cbiAgICB9KVxuICAgIC5nZXQoXCIvYXBpL2xvZ291dFwiLCBhc3luYyAoY29udGV4dCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHNpZCA9IGF3YWl0IGNvbnRleHQuY29va2llcy5nZXQoJ3NpZCcpO1xuICAgICAgICAgICAgaWYgKHNpZCAmJiB0eXBlb2Ygc2lkID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBzaWRzW3NpZCBhcyBzdHJpbmddO1xuICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHsgdGV4dDogJ1N1Y2Nlc3NmdWxseSBMb2dnZWQgT3V0JyB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH1cbiAgICB9KVxuICAgIC5wb3N0KFwiL2FwaS9ydW5cIiwgYXN5bmMgKGNvbnRleHQ6IFJvdXRlckNvbnRleHQ8YW55PikgPT4ge1xuICAgICAgICAvLyBjb250ZXh0LnJlc3BvbnNlLnN0YXR1cyA9IFN0YXR1cy5PSztcbiAgICAgICAgLy8gY29uc3QgZHVtYnlSZXN1bHQ6IFRlc3RDYXNlc1Bhc3NlZCA9IHtcbiAgICAgICAgLy8gICAgIHRlc3RDYXNlc1Bhc3NlZDogW3RydWUsIHRydWUsIHRydWUsIHRydWUsIHRydWUsIHRydWUsIHRydWUsIHRydWUsIHRydWUsIHRydWUsIHRydWVdLFxuICAgICAgICAvLyAgICAgc3RhbmRhcmRPdXRwdXQ6IFwiVGVzdCBTdGFuZGFyZCBPdXRwdXRcIixcbiAgICAgICAgLy8gICAgIG91dHB1dDogXCJUZXN0IE91dHB1dFwiXG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gY29udGV4dC5yZXNwb25zZS5ib2R5ID0gZHVtYnlSZXN1bHRcbiAgICAgICAgLy8gcmV0dXJuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgc2lkID0gYXdhaXQgY29udGV4dC5jb29raWVzLmdldCgnc2lkJyk7XG4gICAgICAgICAgICBpZiAoc2lkICYmIHR5cGVvZiBzaWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjb250ZXh0LnJlcXVlc3QuaGFzQm9keSkge1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnRocm93KFN0YXR1cy5CYWRSZXF1ZXN0LCBcIkJhZCBSZXF1ZXN0XCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBib2R5ID0gY29udGV4dC5yZXF1ZXN0LmJvZHkoKTtcbiAgICAgICAgICAgICAgICBsZXQgY29kZTogUGFydGlhbDxDb2RlU3VibWlzc2lvbj4gfCB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgaWYgKGJvZHkudHlwZSA9PT0gXCJqc29uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29kZSA9IGF3YWl0IGJvZHkudmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQuYXNzZXJ0KHR5cGVvZiBjb2RlPy52YWx1ZSA9PT0gXCJzdHJpbmdcIiwgU3RhdHVzLkJhZFJlcXVlc3QpO1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmFzc2VydCh0eXBlb2YgY29kZT8uaW5wdXQgPT09IFwic3RyaW5nXCIsIFN0YXR1cy5CYWRSZXF1ZXN0KTtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5zdGF0dXMgPSBTdGF0dXMuT0s7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiWlpaXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhjb2RlLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJYWFhcIik7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZShcIi4vc2FuZGJveC9hbnN3ZXIucHlcIiwgY29kZS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZShcIi4vc2FuZGJveC9hbnN3ZXJDdXN0b21JbnB1dC5weVwiLCBjb2RlLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGlucHV0TGluZXM6IHN0cmluZ1tdID0gY29kZS5pbnB1dC5zcGxpdCgnXFxuJyk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBjdXN0b21JbnB1dENvbnRlbnQ6IHN0cmluZyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBsZXQgcXVlc3Rpb25JbmZvcm1hdGlvbjogUXVlc3Rpb25JbmZvcm1hdGlvbiA9IHNpZHNRdWVzdGlvbnNbc2lkXVtzaWRzUHJvZ3Jlc3Nbc2lkXV07XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcXVlc3Rpb25JbmZvcm1hdGlvbi5pbnB1dEZvcm1hdC5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJPT09cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhxdWVzdGlvbkluZm9ybWF0aW9uLmlucHV0Rm9ybWF0W2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUFBQXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXN0aW9uSW5mb3JtYXRpb24uaW5wdXRGb3JtYXRbaV0gPT0gJ24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9tSW5wdXRDb250ZW50ICs9IHBhcnNlSW50KGlucHV0TGluZXNbaV0pLnRvU3RyaW5nKCkgKyAnXFxuJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocXVlc3Rpb25JbmZvcm1hdGlvbi5pbnB1dEZvcm1hdFtpXSA9PSAnYScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaW5wdXRDb21tYVNlcGFyYXRlZFZhbHVlczogc3RyaW5nW10gPSBpbnB1dExpbmVzW2ldLnNwbGl0KCdbJylbMV0uc3BsaXQoJ10nKVswXS5zcGxpdCgnLCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGlucHV0Q29tbWFTZXBhcmF0ZWRWYWx1ZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbUlucHV0Q29udGVudCArPSBpbnB1dENvbW1hU2VwYXJhdGVkVmFsdWVzLmxlbmd0aC50b1N0cmluZygpICsgJ1xcbic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dENvbW1hU2VwYXJhdGVkVmFsdWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbUlucHV0Q29udGVudCArPSBwYXJzZUludChpbnB1dENvbW1hU2VwYXJhdGVkVmFsdWVzW2ldKS50b1N0cmluZygpICsgJ1xcbic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGN1c3RvbUlucHV0Q29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHF1ZXN0aW9uSW5mb3JtYXRpb24uaW5wdXRGb3JtYXRbaV0gPT0gJ2FhJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpbnB1dENvbW1hU2VwYXJhdGVkVmFsdWVzOiBzdHJpbmdbXSA9IGlucHV0TGluZXNbaV0uc3BsaXQoJ1tbJylbMV0uc3BsaXQoJ11dJylbMF0uc3BsaXQoJ10sWycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbUlucHV0Q29udGVudCArPSBpbnB1dENvbW1hU2VwYXJhdGVkVmFsdWVzLmxlbmd0aC50b1N0cmluZygpICsgJ1xcbic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dENvbW1hU2VwYXJhdGVkVmFsdWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpbnB1dENDb21tYVNlcGFyYXRlZFZhbHVlczogc3RyaW5nW10gPSBpbnB1dExpbmVzW2ldLnNwbGl0KCcsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbUlucHV0Q29udGVudCArPSBpbnB1dENDb21tYVNlcGFyYXRlZFZhbHVlcy5sZW5ndGgudG9TdHJpbmcoKSArICdcXG4nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgaW5wdXRDQ29tbWFTZXBhcmF0ZWRWYWx1ZXMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbUlucHV0Q29udGVudCArPSBwYXJzZUludChpbnB1dENDb21tYVNlcGFyYXRlZFZhbHVlc1tpXSkudG9TdHJpbmcoKSArICdcXG4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChxdWVzdGlvbkluZm9ybWF0aW9uLm91dHB1dEZvcm1hdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5OTlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHF1ZXN0aW9uSW5mb3JtYXRpb24ub3V0cHV0Rm9ybWF0WzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTU1NXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUFBXCIpO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoXCIuL3NhbmRib3gvY3VzdG9tSW5wdXQuaW5cIiwgY3VzdG9tSW5wdXRDb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBQUJcIik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcG9ydFByb2Nlc3MgPSBhd2FpdCBEZW5vLnJ1bih7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbWQ6IFtcIi4vbWFrZVJlcG9ydC5zaFwiXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN3ZDogXCIuL3NhbmRib3gvXCIgKyBxdWVzdGlvbkluZm9ybWF0aW9uLnF1ZXN0aW9uSWQudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ZG91dDogXCJwaXBlZFwiXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkFCQlwiKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgcmVwb3J0UHJvY2Vzcy5vdXRwdXQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJCQkJcIik7XG4gICAgICAgICAgICAgICAgICAgIGxldCBqc29uUmVzdWx0czogU3RyaW5nID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUoXCIuL3NhbmRib3gvcmVwb3J0RnJvbVB5U2FuZGJveC50eHRcIik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiISEhXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhqc29uUmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQEBAXCIpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgc3RhbmRhcmRPdXRwdXRSZXN1bHRzOiBzdHJpbmcgPSBhd2FpdCBEZW5vLnJlYWRUZXh0RmlsZShcIi4vc2FuZGJveC9zdGFuZGFyZE91dHB1dEZyb21QeVNhbmRib3gudHh0XCIpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgc3RhbmRhcmRFcnJvclJlc3VsdHM6IHN0cmluZyA9IGF3YWl0IERlbm8ucmVhZFRleHRGaWxlKFwiLi9zYW5kYm94L3N0YW5kYXJkRXJyb3JGcm9tUHlTYW5kYm94LnR4dFwiKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJTVERFUlJTVERFUlJTVERFUlJTVERFUlJTVERFUlJTVERFUlJTVERFUlJTVERFUlJTVERFUlJTVERFUlJcIik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHN0YW5kYXJkRXJyb3JSZXN1bHRzKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSRVJFUkVSRVJFUkVSRVJFUkVSRVJFUkVSRVJFUkVSRVJFUkVSRVJFUkVSRVJFUkVSRVJFUkVSRVJFUkVcIik7XG4gICAgICAgICAgICAgICAgICAgIGxldCBvdXRwdXRSZXN1bHRzOiBzdHJpbmcgPSBhd2FpdCBEZW5vLnJlYWRUZXh0RmlsZShcIi4vc2FuZGJveC9vdXRwdXRGcm9tUHlTYW5kYm94LnR4dFwiKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG91dHB1dFJlc3VsdHNTcGxpdDogc3RyaW5nW10gPSBvdXRwdXRSZXN1bHRzLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGFjdHVhbE91dHB1dFJlc3VsdHM6IHN0cmluZyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBpZiAocXVlc3Rpb25JbmZvcm1hdGlvbi5vdXRwdXRGb3JtYXQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXN0aW9uSW5mb3JtYXRpb24ub3V0cHV0Rm9ybWF0WzBdID09ICduJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvdXRwdXRSZXN1bHRzU3BsaXQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWxPdXRwdXRSZXN1bHRzICs9IG91dHB1dFJlc3VsdHNTcGxpdFswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHF1ZXN0aW9uSW5mb3JtYXRpb24ub3V0cHV0Rm9ybWF0WzBdID09ICdhJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuOiBudW1iZXIgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvdXRwdXRSZXN1bHRzU3BsaXQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuID0gcGFyc2VJbnQob3V0cHV0UmVzdWx0c1NwbGl0WzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG4gPiAwICYmIG91dHB1dFJlc3VsdHNTcGxpdC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbE91dHB1dFJlc3VsdHMgKz0gJ1snICsgb3V0cHV0UmVzdWx0c1NwbGl0WzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWxPdXRwdXRSZXN1bHRzICs9ICcsICcgKyBvdXRwdXRSZXN1bHRzU3BsaXRbaSArIDFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobiA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsT3V0cHV0UmVzdWx0cyArPSAnXSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHF1ZXN0aW9uSW5mb3JtYXRpb24ub3V0cHV0Rm9ybWF0WzBdID09ICdhYScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbjogbnVtYmVyID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbm46IG51bWJlciA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGs6IG51bWJlciA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCIjIyNcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cob3V0cHV0UmVzdWx0c1NwbGl0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIiQkJFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3V0cHV0UmVzdWx0c1NwbGl0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbiA9IHBhcnNlSW50KG91dHB1dFJlc3VsdHNTcGxpdFtrKytdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG4gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbE91dHB1dFJlc3VsdHMgKz0gJ1tbJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG91dHB1dFJlc3VsdHNTcGxpdC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBubiA9IHBhcnNlSW50KG91dHB1dFJlc3VsdHNTcGxpdFtrKytdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobm4gPiAwICYmIG91dHB1dFJlc3VsdHNTcGxpdC5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWxPdXRwdXRSZXN1bHRzICs9IG91dHB1dFJlc3VsdHNTcGxpdFtrKytdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgbm47ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsT3V0cHV0UmVzdWx0cyArPSAnLCAnICsgb3V0cHV0UmVzdWx0c1NwbGl0W2srK107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsT3V0cHV0UmVzdWx0cyArPSAnXSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsT3V0cHV0UmVzdWx0cyArPSAnLCBbJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm4gPSBwYXJzZUludChvdXRwdXRSZXN1bHRzU3BsaXRbaysrXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChubiA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbE91dHB1dFJlc3VsdHMgKz0gb3V0cHV0UmVzdWx0c1NwbGl0W2srK107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDE7IGogPCBubjsgKytqKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWxPdXRwdXRSZXN1bHRzICs9ICcsICcgKyBvdXRwdXRSZXN1bHRzU3BsaXRbaysrXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWxPdXRwdXRSZXN1bHRzICs9ICddJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobiA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsT3V0cHV0UmVzdWx0cyArPSAnXSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJDQ0NcIik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHN0YW5kYXJkT3V0cHV0UmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiREREXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhhY3R1YWxPdXRwdXRSZXN1bHRzKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJFRUVcIik7XG4gICAgICAgICAgICAgICAgICAgIGpzb25SZXN1bHRzID0ganNvblJlc3VsdHMucmVwbGFjZSgvXFxzL2csIFwiXCIpO1xuICAgICAgICAgICAgICAgICAgICBqc29uUmVzdWx0cyA9IGpzb25SZXN1bHRzLnN1YnN0cmluZygwLCBqc29uUmVzdWx0cy5sZW5ndGggLSAyKSArIFwiXVwiXG4gICAgICAgICAgICAgICAgICAgIGxldCB0ZXN0UmVzdWx0czogVGVzdFJlc3VsdFtdICA9IEpTT04ucGFyc2UoanNvblJlc3VsdHMudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgICAgIGxldCB0ZXN0Q2FzZXNQYXNzZWQ6IFRlc3RDYXNlc1Bhc3NlZCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlc3RDYXNlc1Bhc3NlZDogdGVzdFJlc3VsdHMubWFwKCh0cjogVGVzdFJlc3VsdCkgPT4gdHIucGFzc2VkKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YW5kYXJkT3V0cHV0OiBzdGFuZGFyZE91dHB1dFJlc3VsdHMsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFuZGFyZEVycm9yOiBzdGFuZGFyZEVycm9yUmVzdWx0cyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dDogYWN0dWFsT3V0cHV0UmVzdWx0cyxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCIxMTExMTExMTExMTExMTExMTExMTExMTExMVwiKTtcbiAgICAgICAgICAgICAgICAgICAgLyppZiAoKytpaWlDb3VudGVyICUgMyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXN0Q2FzZXNQYXNzZWQudGVzdENhc2VzUGFzc2VkLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVzdENhc2VzUGFzc2VkLnRlc3RDYXNlc1Bhc3NlZFtpXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0qL1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRlc3RDYXNlc1Bhc3NlZC50ZXN0Q2FzZXNQYXNzZWQuc29tZShlbGVtZW50ID0+ICFlbGVtZW50KSAmJiArK3NpZHNQcm9ncmVzc1tzaWRdID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgb3Bwb25lbnRTaWQgPSBtYXRjaGVzW3NpZF07XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgbWF0Y2hlc1tzaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG1hdGNoZXNbb3Bwb25lbnRTaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHNpZHNQcm9ncmVzc1tzaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHNpZHNQcm9ncmVzc1tvcHBvbmVudFNpZF07XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgc2lkc1F1ZXN0aW9uc1tzaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHNpZHNRdWVzdGlvbnNbb3Bwb25lbnRTaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG51bVdpbnM6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1HYW1lczogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZzogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhczI0MDBSYXRpbmdIaXN0b3J5OiBib29sZWFuID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3Bwb25lbnROdW1Mb3NzZXM6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHBvbmVudE51bUdhbWVzOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3Bwb25lbnRFbG9SYXRpbmc6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHBvbmVudEhhczI0MDBSYXRpbmdIaXN0b3J5OiBib29sZWFuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdXNlcm5hbWUgPSBzaWRzW3NpZCBhcyBzdHJpbmddO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IG51bV93aW5zLCBudW1fbG9zc2VzLCBlbG9fcmF0aW5nLCBoYXNfMjQwMF9yYXRpbmdfaGlzdG9yeSBmcm9tIHVzZXJzIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIHVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bVdpbnMgPSB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzBdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1HYW1lcyA9IG51bVdpbnMgKyAodXNlcm5hbWVSZXN1bHQucm93c1swXVsxXSBhcyBudW1iZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZyA9IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMl0gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhczI0MDBSYXRpbmdIaXN0b3J5ID0gdXNlcm5hbWVSZXN1bHQucm93c1swXVszXSBhcyBib29sZWFuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgb3Bwb25lbnRVc2VybmFtZSA9IHNpZHNbb3Bwb25lbnRTaWQgYXMgc3RyaW5nXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3Bwb25lbnRVc2VybmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzZWxlY3QgbnVtX3dpbnMsIG51bV9sb3NzZXMsIGVsb19yYXRpbmcsIGhhc18yNDAwX3JhdGluZ19oaXN0b3J5IGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIG9wcG9uZW50VXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50TnVtTG9zc2VzID0gdXNlcm5hbWVSZXN1bHQucm93c1swXVsxXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50TnVtR2FtZXMgPSAodXNlcm5hbWVSZXN1bHQucm93c1swXVswXSBhcyBudW1iZXIpICsgb3Bwb25lbnROdW1Mb3NzZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50RWxvUmF0aW5nID0gdXNlcm5hbWVSZXN1bHQucm93c1swXVsyXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50SGFzMjQwMFJhdGluZ0hpc3RvcnkgPSB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzNdIGFzIGJvb2xlYW47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKytudW1XaW5zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZWxvUmF0aW5nVmFyaWF0aW9uOiBudW1iZXIgPSAxIC0gMS4wIC8gKDEgKyBNYXRoLnBvdygxMCwgKG9wcG9uZW50RWxvUmF0aW5nIC0gZWxvUmF0aW5nKSAvIDQwMC4wKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZyArPSBNYXRoLmZsb29yKChudW1HYW1lcyA8IDMwID8gKGVsb1JhdGluZyA8IDIzMDAgPyA0MCA6IDIwKSA6IChoYXMyNDAwUmF0aW5nSGlzdG9yeSA/IDEwIDogMjApKSAqIGVsb1JhdGluZ1ZhcmlhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrb3Bwb25lbnROdW1Mb3NzZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50RWxvUmF0aW5nIC09IE1hdGguY2VpbCgob3Bwb25lbnROdW1HYW1lcyA8IDMwID8gKG9wcG9uZW50RWxvUmF0aW5nIDwgMjMwMCA/IDQwIDogMjApIDogKG9wcG9uZW50SGFzMjQwMFJhdGluZ0hpc3RvcnkgPyAxMCA6IDIwKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogZWxvUmF0aW5nVmFyaWF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJ1cGRhdGUgdXNlcnMgc2V0IG51bV93aW5zID0gXCIgKyBudW1XaW5zLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiLCBlbG9fcmF0aW5nID0gXCIgKyBlbG9SYXRpbmcudG9TdHJpbmcoKSArIFwiLCBoYXNfMjQwMF9yYXRpbmdfaGlzdG9yeSA9IFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAoaGFzMjQwMFJhdGluZ0hpc3RvcnkgfHwgZWxvUmF0aW5nID49IDI0MDApLnRvU3RyaW5nKCkgKyBcIiB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIHVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHBvbmVudFVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJ1cGRhdGUgdXNlcnMgc2V0IG51bV9sb3NzZXMgPSBcIiArIG9wcG9uZW50TnVtTG9zc2VzLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiLCBlbG9fcmF0aW5nID0gXCIgKyBvcHBvbmVudEVsb1JhdGluZy50b1N0cmluZygpICsgXCIsIGhhc18yNDAwX3JhdGluZ19oaXN0b3J5ID0gXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIChvcHBvbmVudEhhczI0MDBSYXRpbmdIaXN0b3J5IHx8IG9wcG9uZW50RWxvUmF0aW5nID49IDI0MDApLnRvU3RyaW5nKCkgKyBcIiB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIG9wcG9uZW50VXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0gdGVzdENhc2VzUGFzc2VkO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIjIyMjIyMjIyMjIyMjIyMjJcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH1cbiAgICB9KVxuICAgIC5nZXQoXCIvYXBpL3dpbGRjYXJkRW5kcG9pbnRcIiwgYXN5bmMgKGNvbnRleHQpID0+IHtcbiAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0geyBlbmRwb2ludDogXG4gICAgICAgICAgICBwcm9kID8gXCJ3c3M6Ly9saWNvZGUuaW8vd3NcIiA6IFwid3M6Ly9sb2NhbGhvc3Q6NTAwMC93c1wiXG4gICAgICAgIH07XG4gICAgfSk7XG5hcHAudXNlKHJvdXRlci5yb3V0ZXMoKSk7XG5hcHAudXNlKHJvdXRlci5hbGxvd2VkTWV0aG9kcygpKTtcbmFwcC51c2UoYXN5bmMgKGNvbnRleHQpID0+IHtcbiAgICBpZiAoIWNvbnRleHQucmVxdWVzdC51cmwucGF0aG5hbWUuZW5kc1dpdGgoJy5qcycpXG4gICAgICAgICYmICFjb250ZXh0LnJlcXVlc3QudXJsLnBhdGhuYW1lLmVuZHNXaXRoKCcucG5nJylcbiAgICAgICAgJiYgIWNvbnRleHQucmVxdWVzdC51cmwucGF0aG5hbWUuZW5kc1dpdGgoJy5pY28nKVxuICAgICAgICAmJiAhY29udGV4dC5yZXF1ZXN0LnVybC5wYXRobmFtZS5lbmRzV2l0aCgnLnR4dCcpKVx0e1xuICAgICAgICBjb250ZXh0LnJlcXVlc3QudXJsLnBhdGhuYW1lID0gJy8nO1xuICAgIH1cbiAgICBhd2FpdCBjb250ZXh0LnNlbmQoe1xuICAgICAgICByb290OiBgJHtEZW5vLmN3ZCgpfS9yZWFjdC1hcHAvYnVpbGRgLFxuICAgICAgICBpbmRleDogXCJpbmRleC5odG1sXCIsXG4gICAgfSk7XG59KTtcbmNvbnNvbGUubG9nKFwiUnVubmluZyBvbiBwb3J0XCIsIHBvcnQpO1xuYXdhaXQgYXBwLmxpc3Rlbih7IHBvcnQgfSk7XG4iXX0=