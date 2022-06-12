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
            stubString += '    p' + i.toString() + ' = int(input())\n    print("G", end="", file=sys.stderr)\n    print(p' + i.toString() + ', end="", file=sys.stderr)\n    print("H", end="", file=sys.stderr)\n';
        }
        else if (inputFormat[i] == 'a') {
            stubString += '    n' + i.toString() + ' = int(input())\n    print("G", end="", file=sys.stderr)\n    print(n' + i.toString() + ', end="", file=sys.stderr)\n    print("H", end="", file=sys.stderr)\n    p' + i.toString() + ' = []\n    for i in range(n' + i.toString() + '):\n        gh = int(input())\n        print("G", end="", file=sys.stderr)\n        print(gh, end="", file=sys.stderr)\n        print("H", end="", file=sys.stderr)\n        p' + i.toString() + '.append(gh)\n';
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
        cleanString += '    while True:\n        tryInput = input()\n        print("OK", end="", file=sys.stderr)\n        print(tryInput, end="", file=sys.stderr)\n        print("PL", end="", file=sys.stderr)\n        if (tryInput == "v10zg57ZIUF6vjZgSPaDY70TQff8wTHXgodX2otrDMEay0WlS36MjDhHH054uRrFxGHHSegvGcA7eaqB"):\n            break\n';
    }
    if (outputFormat.length > 0) {
        if (outputFormat[0] == 'n') {
            cleanString += '    qw = input()\n    print("Q", end="", file=sys.stderr)\n    print(qw, end="", file=sys.stderr)\n    print("W", end="", file=sys.stderr)\n    print(qw)\n';
        }
        else if (outputFormat[0] == 'a') {
            cleanString += '    n = int(input())\n    print("Q", end="", file=sys.stderr)\n    print(n, end="", file=sys.stderr)\n    print("W", end="", file=sys.stderr)\n    nums = []\n    for i in range(n):\n        qw = int(input())\n        print("Q", end="", file=sys.stderr)\n        print(qw, end="", file=sys.stderr)\n        print("W", end="", file=sys.stderr)\n        nums.append(qw)\n    nums.sort()\n    print(n)\n    for i in range(n):\n        print(nums[i])';
        }
        else if (outputFormat[0] == 'aa') {
            cleanString += '    n = int(input())\n    print("Q", end="", file=sys.stderr)\n    print(n, end="", file=sys.stderr)\n    print("W", end="", file=sys.stderr)\n    nns = []\n    nums = []\n    for i in range(n):\n        nn = int(input())\n        print("Q", end="", file=sys.stderr)\n        print(nn, end="", file=sys.stderr)\n        print("W", end="", file=sys.stderr)\n        nns = nns.copy()\n        nns = []\n        nns.append(nn)\n        nnums = []\n        for j in range(nn):\n            qw = int(input())\n            print("Q", end="", file=sys.stderr)\n            print(qw, end="", file=sys.stderr)\n            print("W", end="", file=sys.stderr)\n            nnums.append(qw)\n        nnums.sort()\n        nns.append(nnums)\n        nums.append(nns)\n    nums.sort(key = functools.cmp_to_key(compareNns))\n    print(n)\n    for i in range(n):\n        print(nums[i][0])\n        for j in range(len(nums[i][1])):\n            print(nums[i][1][j])\n';
        }
    }
    return cleanString;
}
function generateMakeReportString(i) {
    return '#!/bin/bash\n\n(cat stub.py) >> ../answer.py\n(cat stubCustomInput.py) >> ../answerCustomInput.py\n\ncontainerID=$(docker run -dit py-sandbox)\ndocker cp TestInputs/ ${containerID}:home/TestEnvironment/TestInputs/\ndocker cp TestOutputs/ ${containerID}:home/TestEnvironment/TestOutputs/\ndocker cp ../answer.py ${containerID}:home/TestEnvironment/answer.py\ndocker cp ../customInput.in ${containerID}:home/TestEnvironment/customInput.in\ndocker cp ../answerCustomInput.py ${containerID}:home/TestEnvironment/answerCustomInput.py\ndocker cp clean.py ${containerID}:home/TestEnvironment/clean.py\ndocker cp cleanOutput.py ${containerID}:home/TestEnvironment/cleanOutput.py\n\ndocker exec ${containerID} sh -c "cd home/TestEnvironment/ && timeout 10 ./makeReport.sh"\n\ndocker cp ${containerID}:home/TestEnvironment/report.txt ../reportFromPySandbox.txt\ndocker cp ${containerID}:home/TestEnvironment/standardOutput.txt ../standardOutputFromPySandbox.txt\ndocker cp ${containerID}:home/TestEnvironment/output.txt ../outputFromPySandbox.txt\n\ndocker kill ${containerID}\n\ndocker rm ${containerID}\n\n';
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
        questionsSelected.push(2);
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
                    output: actualOutputResults,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDSCxXQUFXLEVBQ1gsTUFBTSxFQUVOLE1BQU0sR0FFVCxNQUFNLGdDQUFnQyxDQUFDO0FBTXhDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSw2Q0FBNkMsQ0FBQztBQUNyRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sNkNBQTZDLENBQUM7QUFDckUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLDRDQUE0QyxDQUFBO0FBQ25FLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSx5Q0FBeUMsQ0FBQztBQUNwRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sNENBQTRDLENBQUE7QUFDbEUsTUFBTSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUM7SUFDdEIsSUFBSSxFQUFFLFFBQVE7SUFDZCxRQUFRLEVBQUUsUUFBUTtJQUNsQixRQUFRLEVBQUUsUUFBUTtJQUNsQixRQUFRLEVBQUUsV0FBVztJQUNyQixJQUFJLEVBQUUsSUFBSTtJQUNWLEdBQUcsRUFBRTtRQUNELE9BQU8sRUFBRSxLQUFLO1FBQ2QsT0FBTyxFQUFFLEtBQUs7S0FDakI7Q0FDSixDQUFDLENBQUM7QUFDSCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ2hDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUMsS0FBSyxFQUFFLEVBQUMsTUFBTSxFQUFFLEdBQUcsRUFBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFFLENBQUMsQ0FBQTtBQUN6RSxNQUFNLElBQUksR0FBYSxJQUFJLENBQUMsSUFBSSxDQUFBO0FBQ2hDLE1BQU0sR0FBRyxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7QUFDOUIsTUFBTSxNQUFNLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQWtDNUIsTUFBTSxvQkFBb0IsR0FBRyxDQUFDLENBQUM7QUFFL0IsSUFBSSxhQUFhLEdBQWUsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLENBQUM7QUFFeEQsSUFBSSxJQUFJLEdBQStCLEVBQUUsQ0FBQztBQUUxQyxJQUFJLFlBQVksR0FBK0IsRUFBRSxDQUFDO0FBRWxELElBQUksYUFBYSxHQUE4QyxFQUFFLENBQUM7QUFFbEUsSUFBSSxrQkFBa0IsR0FBc0IsRUFBRSxDQUFDO0FBQy9DLElBQUksa0JBQWtCLEdBQXNCLEVBQUUsQ0FBQztBQUMvQyxJQUFJLG1CQUFtQixHQUFzQixFQUFFLENBQUM7QUFDaEQsSUFBSSxtQkFBbUIsR0FBc0IsRUFBRSxDQUFDO0FBQ2hELElBQUksbUJBQW1CLEdBQXNCLEVBQUUsQ0FBQztBQUVoRCxJQUFJLE9BQU8sR0FBK0IsRUFBRSxDQUFDO0FBRTdDLE1BQU0sWUFBWSxHQUFXLEVBQUUsQ0FBQztBQUVoQyxTQUFTLG9CQUFvQjtJQUN6QixPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDLG9DQUFvQyxDQUFDO0FBQzFGLENBQUM7QUFFRCxTQUFTLHNCQUFzQixDQUFDLFlBQXNCLEVBQUUsTUFBZ0IsRUFBRSxDQUFTLEVBQUUsV0FBb0I7SUFDckcsSUFBSSxjQUFjLEdBQUcsRUFBRSxDQUFDO0lBQ3hCLElBQUksUUFBUSxHQUFHLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDMUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ1YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ1YsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQ2IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ1YsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQ2IsSUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFDO0lBQ3hCLElBQUksZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO0lBQzdCLElBQUksV0FBVyxFQUFFO1FBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3REFBd0QsQ0FBQyxDQUFDO0tBQUU7SUFDM0YsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUU7UUFDdEMsSUFBSSxXQUFXLEVBQUU7WUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7U0FBRTtRQUNuRyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLEVBQUU7WUFDbEIsSUFBSSxXQUFXLEVBQUU7Z0JBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDO2FBQUU7WUFDM0QsY0FBYyxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDckMsRUFBRSxDQUFDLENBQUM7U0FDUDthQUFNLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsRUFBRTtZQUN6QixJQUFJLFdBQVcsRUFBRTtnQkFDYixJQUFJLENBQUMsR0FBRyxJQUFJLEVBQUU7b0JBQ1YsSUFBSSxXQUFXLEVBQUU7d0JBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDO3FCQUFFO29CQUMzRCxjQUFjLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztvQkFDckMsRUFBRSxDQUFDLENBQUM7aUJBQ1A7cUJBQU07b0JBQ0gsSUFBSSxXQUFXLEVBQUU7d0JBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO3FCQUFFO29CQUM3RCxXQUFXLEdBQUcsS0FBSyxDQUFDO29CQUNwQixFQUFFLENBQUMsQ0FBQztvQkFDSixFQUFFLENBQUMsQ0FBQztpQkFDUDthQUNKO2lCQUFNO2dCQUNILElBQUksV0FBVyxFQUFFO29CQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztpQkFBRTtnQkFDN0QsY0FBYyxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7Z0JBQ3JDLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ04sSUFBSSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDN0IsV0FBVyxHQUFHLElBQUksQ0FBQzthQUN0QjtTQUNKO2FBQU0sSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxFQUFFO1lBQzFCLElBQUksV0FBVyxFQUFFO2dCQUNiLElBQUksQ0FBQyxHQUFHLElBQUksRUFBRTtvQkFDVixJQUFJLGdCQUFnQixFQUFFO3dCQUNsQixJQUFJLENBQUMsR0FBRyxJQUFJLEVBQUU7NEJBQ1YsSUFBSSxXQUFXLEVBQUU7Z0NBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDOzZCQUFFOzRCQUMzRCxjQUFjLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQzs0QkFDckMsRUFBRSxDQUFDLENBQUM7eUJBQ1A7NkJBQU07NEJBQ0gsSUFBSSxXQUFXLEVBQUU7Z0NBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUFHLEtBQUssQ0FBQyxDQUFDOzZCQUFFOzRCQUMvRCxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7NEJBQ3pCLEVBQUUsQ0FBQyxDQUFDOzRCQUNKLEVBQUUsQ0FBQyxDQUFDO3lCQUNQO3FCQUNKO3lCQUFNO3dCQUNILElBQUksV0FBVyxFQUFFOzRCQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQzt5QkFBRTt3QkFDN0QsY0FBYyxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7d0JBQ3JDLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ04sSUFBSSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDN0IsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO3FCQUMzQjtpQkFDSjtxQkFBTTtvQkFDSCxJQUFJLFdBQVcsRUFBRTt3QkFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsS0FBSyxDQUFDLENBQUM7cUJBQUU7b0JBQy9ELFdBQVcsR0FBRyxLQUFLLENBQUM7b0JBQ3BCLEVBQUUsQ0FBQyxDQUFDO29CQUNKLEVBQUUsQ0FBQyxDQUFDO2lCQUNQO2FBQ0o7aUJBQU07Z0JBQ0gsSUFBSSxXQUFXLEVBQUU7b0JBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDO2lCQUFFO2dCQUNqRSxjQUFjLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDckMsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDTixJQUFJLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM3QixXQUFXLEdBQUcsSUFBSSxDQUFDO2FBQ3RCO1NBQ0o7S0FDSjtJQUNELElBQUksV0FBVyxFQUFFO1FBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3REFBd0QsQ0FBQyxDQUFDO0tBQUU7SUFDM0YsSUFBSSxXQUFXLEVBQUU7UUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLHdEQUF3RCxDQUFDLENBQUM7S0FBRTtJQUMzRixJQUFJLFdBQVcsRUFBRTtRQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7S0FBRTtJQUNqRCxJQUFJLFdBQVcsRUFBRTtRQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0RBQXdELENBQUMsQ0FBQztLQUFFO0lBQzNGLE9BQU8sY0FBYyxDQUFDO0FBQzFCLENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLFdBQXFCLEVBQUUsWUFBc0IsRUFBRSxpQkFBeUIsRUFBRSxVQUFtQjtJQUNySCxJQUFJLFVBQVUsR0FBRyxnREFBZ0QsQ0FBQztJQUNsRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtRQUN6QyxJQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLEVBQUU7WUFDdkIsVUFBVSxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsdUVBQXVFLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUFHLHVFQUF1RSxDQUFDO1NBQzNNO2FBQU0sSUFBSSxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxFQUFFO1lBQzlCLFVBQVUsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUFHLHVFQUF1RSxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsR0FBRyw0RUFBNEUsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsNkJBQTZCLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUFHLGdMQUFnTCxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsR0FBRyxlQUFlLENBQUM7U0FDbGU7YUFBTSxJQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLEVBQUU7WUFDL0IsVUFBVSxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsd0JBQXdCLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUFHLDZCQUE2QixHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsR0FBRyxnQkFBZ0IsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsNkJBQTZCLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUFHLGtDQUFrQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsR0FBRyxvQkFBb0IsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsa0NBQWtDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUFHLFlBQVksR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsS0FBSyxDQUFDO1NBQ3RZO0tBQ0o7SUFDRCxVQUFVLElBQUksZUFBZSxHQUFHLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0lBQ3ZGLElBQUksV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDeEIsVUFBVSxJQUFJLElBQUksQ0FBQztLQUN0QjtJQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ3pDLFVBQVUsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFBO0tBQ3JDO0lBQ0QsVUFBVSxJQUFJLEtBQUssQ0FBQztJQUNwQixJQUFJLFVBQVUsRUFBRTtRQUNaLFVBQVUsSUFBSSxpR0FBaUcsQ0FBQTtRQUMvRyxJQUFJLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ3pCLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsRUFBRTtnQkFDeEIsVUFBVSxJQUFJLHFCQUFxQixDQUFDO2FBQ3ZDO2lCQUFNLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsRUFBRTtnQkFDL0IsVUFBVSxJQUFJLGtFQUFrRSxDQUFDO2FBQ3BGO2lCQUFNLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRTtnQkFDaEMsVUFBVSxJQUFJLG9IQUFvSCxDQUFDO2FBQ3RJO1NBQ0o7S0FDSjtJQUNELE9BQU8sVUFBVSxDQUFDO0FBQ3RCLENBQUM7QUFFRCxTQUFTLG1CQUFtQixDQUFDLFlBQXNCLEVBQUUsV0FBb0I7SUFDckUsSUFBSSxXQUFXLEdBQUcsRUFBRSxDQUFDO0lBQ3JCLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRTtRQUN6QixXQUFXLElBQUksNENBQTRDLENBQUM7S0FDL0Q7U0FBTTtRQUNILFdBQVcsSUFBSSwyVkFBMlYsQ0FBQztLQUM5VztJQUNELElBQUksV0FBVyxFQUFFO1FBQ2IsV0FBVyxJQUFJLDhUQUE4VCxDQUFDO0tBQ2pWO0lBQ0QsSUFBSSxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtRQUN6QixJQUFJLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLEVBQUU7WUFDeEIsV0FBVyxJQUFJLDZKQUE2SixDQUFDO1NBQ2hMO2FBQU0sSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxFQUFFO1lBQy9CLFdBQVcsSUFBSSwrYkFBK2IsQ0FBQztTQUNsZDthQUFNLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRTtZQUNoQyxXQUFXLElBQUksMDdCQUEwN0IsQ0FBQztTQUM3OEI7S0FDSjtJQUNELE9BQU8sV0FBVyxDQUFDO0FBQ3ZCLENBQUM7QUFFRCxTQUFTLHdCQUF3QixDQUFDLENBQVM7SUFFdkMsT0FBTyw0a0NBQTRrQyxDQUFDO0FBQ3hsQyxDQUFDO0FBRUQsS0FBSyxVQUFVLGFBQWE7SUFDeEIsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDdkIsTUFBTSxlQUFlLEdBQUcsTUFBTSxNQUFNLENBQUMsVUFBVSxDQUFDLGdDQUFnQyxDQUFDLENBQUM7SUFDbEYsSUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFXLENBQUMsQ0FBQztJQUNoRSxNQUFNLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUNuQixLQUFLLElBQUksQ0FBQyxHQUFXLENBQUMsRUFBRSxDQUFDLElBQUksWUFBWSxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQzVDLE1BQU0sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZCLE1BQU0sY0FBYyxHQUFHLE1BQU0sTUFBTSxDQUFDLFVBQVUsQ0FBQyx1RkFBdUYsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUN2SixJQUFJLGlCQUFpQixHQUFXLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFXLENBQUM7UUFDcEUsSUFBSSxpQkFBaUIsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBVyxDQUFDO1FBQzVELElBQUksU0FBUyxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFXLENBQUM7UUFDcEQsTUFBTSxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDbkIsSUFBSSxrQkFBa0IsR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdEQsSUFBSSxXQUFXLEdBQWEsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdELFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNwQixJQUFJLFlBQVksR0FBYSxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUQsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3JCLElBQUksWUFBWSxHQUFhLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbEQsS0FBSyxJQUFJLENBQUMsR0FBVyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFlBQVksRUFBRSxFQUFFLENBQUMsRUFBRTtZQUMzQyxNQUFNLFNBQVMsQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUFHLGNBQWMsQ0FBQyxDQUFDO1lBQzlELE1BQU0sU0FBUyxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsZUFBZSxDQUFDLENBQUM7WUFDL0QsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsa0JBQWtCLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsS0FBSyxFQUNsRyxzQkFBc0IsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBc0IsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUN4RjtRQUNELElBQUksbUJBQW1CLEdBQUcsQ0FBQyxHQUFHLFlBQVksQ0FBQztRQUMzQyxLQUFLLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsbUJBQW1CLEVBQUUsRUFBRSxDQUFDLEVBQUU7WUFDM0MsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsbUJBQW1CLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsTUFBTSxFQUNyRyxzQkFBc0IsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQ3JFO1FBQ0QsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsVUFBVSxFQUFFLGtCQUFrQixDQUFDLFdBQVcsRUFBRSxZQUFZLEVBQzNHLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDOUIsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcscUJBQXFCLEVBQUUsa0JBQWtCLENBQUMsV0FBVyxFQUFFLFlBQVksRUFDdEgsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUMvQixNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsR0FBRyxXQUFXLEVBQUUsbUJBQW1CLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDN0csTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsaUJBQWlCLEVBQUUsbUJBQW1CLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDcEgsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsZ0JBQWdCLEVBQUUsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDWCxHQUFHLEVBQUUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLGVBQWUsQ0FBQztZQUN0QyxHQUFHLEVBQUUsWUFBWSxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUU7U0FDbkMsQ0FBQyxDQUFDO0tBQ047QUFDTCxDQUFDO0FBRUQsYUFBYSxFQUFFLENBQUM7QUFFaEIsU0FBUyxLQUFLLENBQUMsSUFBWTtJQUN2QixPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQzdELENBQUM7QUFFRCxLQUFLLFVBQVUsZUFBZSxDQUFDLGVBQWdDO0lBQzNELE1BQU0sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3ZCLE1BQU0sZUFBZSxHQUFHLE1BQU0sTUFBTSxDQUFDLFVBQVUsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0lBQ2xGLElBQUksWUFBWSxHQUFHLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBVyxDQUFDLENBQUM7SUFDaEUsTUFBTSxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDbkIsSUFBSSxpQkFBaUIsR0FBYSxFQUFFLENBQUM7SUFDckMsSUFBSSxpQkFBaUIsR0FBYSxFQUFFLENBQUM7SUFDckMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFlBQVksRUFBRSxFQUFFLENBQUMsRUFBRTtRQUNuQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDNUI7SUFFRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsb0JBQW9CLEVBQUUsRUFBRSxDQUFDLEVBQUU7UUFDM0MsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsWUFBWSxDQUFDLENBQUM7UUFDakQsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUMvRjtJQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxvQkFBb0IsRUFBRSxFQUFFLENBQUMsRUFBRTtRQUUzQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDN0I7SUFDRCxJQUFJLG9CQUFvQixHQUEwQixFQUFFLENBQUM7SUFDckQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtRQUMvQyxJQUFJLGlCQUFpQixHQUFHLEVBQUUsQ0FBQztRQUMzQixTQUFTO1lBQ0wsSUFBSTtnQkFDQSxNQUFNLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDdkIsTUFBTSxjQUFjLEdBQUcsTUFBTSxNQUFNLENBQUMsVUFBVSxDQUFDLHVEQUF1RDtzQkFDaEcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDdkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUM3QyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNuQixPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUM1QixPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNuQixpQkFBaUIsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBVyxDQUFDO2dCQUN4RCxNQUFNLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDbkIsTUFBTTthQUNUO1lBQUMsT0FBTyxLQUFLLEVBQUU7Z0JBQ1osT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUN0QjtTQUNKO1FBQ0QsSUFBSSxrQkFBa0IsR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdEQsSUFBSSxXQUFXLEdBQWEsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdELFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNwQixJQUFJLFlBQVksR0FBYSxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUQsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3JCLElBQUksbUJBQW1CLEdBQXdCLEVBQUUsVUFBVSxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxDQUFDO1FBQzFJLG9CQUFvQixDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0tBQ2xEO0lBQ0QsYUFBYSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsR0FBRyxvQkFBb0IsQ0FBQztJQUMxRCxhQUFhLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLG9CQUFvQixDQUFDO0FBQ3ZFLENBQUM7QUFFRCxLQUFLLFVBQVUsVUFBVSxDQUFFLEtBQXdCLEVBQUUsZUFBZ0MsRUFBRSxLQUFhLEVBQUUsT0FBWTtJQUM5RyxLQUFLLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQzVCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ25DLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxlQUFlLENBQUMsR0FBRztlQUM1QixJQUFJLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssRUFBRTtZQUMxRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUM7WUFDNUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1lBQzVDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQy9CLFlBQVksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRXRDLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLEdBQUcsZUFBZSxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ3BGLE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLG9CQUFvQixFQUFFLEVBQUU7Z0JBQ2pELE1BQU0sRUFBRSxNQUFNO2dCQUNkLE9BQU8sRUFBRTtvQkFDTCxjQUFjLEVBQUUsa0JBQWtCO2lCQUNyQztnQkFDRCxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztvQkFDakIsR0FBRyxFQUFFLGVBQWUsQ0FBQyxHQUFHO29CQUN4QixHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUc7aUJBQ3BCLENBQUM7YUFDTCxDQUFDLENBQUM7WUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUc3QixPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRztnQkFDcEIsUUFBUSxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDO2dCQUNuQyxTQUFTLEVBQUUsZUFBZSxDQUFDLFNBQVM7Z0JBQ3BDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO2dCQUNwQyxpQkFBaUIsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUzthQUN4QyxDQUFDO1lBQ0YsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkIsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ1osZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ2pDLE9BQU8sSUFBSSxDQUFDO1NBQ2Y7S0FDSjtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2pCLENBQUM7QUFFRCxLQUFLLFVBQVUsbUJBQW1CLENBQUMsU0FBaUIsRUFBRSxlQUFnQyxFQUFFLFFBQWdCLEVBQUUsT0FBWTtJQUNsSCxNQUFNLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN2QixJQUFJLGVBQWUsQ0FBQyxHQUFHLElBQUksT0FBTyxFQUFFO1FBQ2hDLElBQUksZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUMxRCxNQUFNLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixNQUFNLGNBQWMsR0FBRyxNQUFNLE1BQU0sQ0FBQyxVQUFVLENBQUMsK0NBQStDO2NBQ3hGLFFBQVEsR0FBRyxHQUFHLENBQUMsQ0FBQztRQUN0QixJQUFJLGlCQUFpQixHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFXLENBQUM7UUFDNUQsTUFBTSxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDbkIsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUc7WUFDcEIsUUFBUSxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDO1lBQ25DLFNBQVMsRUFBRSxlQUFlLENBQUMsU0FBUztZQUNwQyxnQkFBZ0IsRUFBRSxnQkFBZ0I7WUFDbEMsaUJBQWlCLEVBQUUsaUJBQWlCO1NBQ3ZDLENBQUM7UUFDRixPQUFPLElBQUksQ0FBQztLQUNmO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDakIsQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLEtBQXdCLEVBQUUsR0FBVztJQUMxRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtRQUNuQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssR0FBRyxFQUFFO1lBQ3RCLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQ3RCO0tBQ0o7QUFDTCxDQUFDO0FBRUQsTUFBTSxJQUFJLEdBQVcsQ0FBQyxHQUFHLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQztBQUM5QyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7SUFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDM0IsQ0FBQyxDQUFDLENBQUM7QUFDSCxNQUFNO0tBQ0QsR0FBRyxDQUFDLGtCQUFrQixFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUU7SUFDakMsSUFBSTtRQUNBLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQztLQUN6QztJQUFDLE9BQU8sR0FBRyxFQUFFO1FBQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNwQjtBQUNMLENBQUMsQ0FBQztLQUNELElBQUksQ0FBQyx1QkFBdUIsRUFBRSxLQUFLLEVBQUUsT0FBMkIsRUFBRSxFQUFFO0lBQ2pFLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTtRQUMxQixPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUM7S0FDbkQ7SUFDRCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ3BDLElBQUksVUFBMkMsQ0FBQztJQUNoRCxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFO1FBQ3RCLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUM7S0FDakM7U0FBTSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFO1FBQzdCLFVBQVUsR0FBRyxFQUFFLENBQUM7UUFDaEIsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRTtZQUN6QyxVQUFVLENBQUMsR0FBdUIsQ0FBQyxHQUFHLEtBQUssQ0FBQztTQUMvQztLQUNKO1NBQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFdBQVcsRUFBRTtRQUNsQyxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDekMsVUFBVSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7S0FDaEM7SUFDRCxJQUFJLFVBQVUsRUFBRTtRQUNaLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxVQUFVLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDdkUsYUFBYSxHQUFHLFVBQXdCLENBQUM7UUFDekMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQztRQUNwQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxVQUFVLENBQUM7UUFDbkMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDO1FBQy9CLE9BQU87S0FDVjtJQUNELE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUNwRCxDQUFDLENBQUM7S0FDRCxJQUFJLENBQUMsZUFBZSxFQUFFLEtBQUssRUFBRSxPQUEyQixFQUFFLEVBQUU7SUFDekQsSUFBSSxHQUFHLEdBQUcsTUFBTSxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQyxJQUFJLENBQUMsR0FBRyxFQUFFO1FBQ04sR0FBRyxHQUFHLE1BQU0sTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZCLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztLQUNuQztJQUNELElBQUk7UUFDQSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUU7WUFDMUIsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1NBQ25EO1FBQ0QsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNwQyxJQUFJLElBQStCLENBQUM7UUFDcEMsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRTtZQUN0QixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDO1NBQzNCO1FBQ0QsSUFBSSxJQUFJLEVBQUU7WUFDTixPQUFPLENBQUMsTUFBTSxDQUNWLE9BQU8sSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEtBQUssUUFBUTttQkFDbkMsT0FBTyxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssS0FBSyxRQUFRO21CQUN6QyxPQUFPLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxLQUFLLFFBQVEsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDckUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQztZQUNwQyxNQUFNLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN2QixNQUFNLGNBQWMsR0FBRyxNQUFNLE1BQU0sQ0FBQyxVQUFVLENBQUMsNkNBQTZDO2tCQUN0RixJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQztZQUNuQyxJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDaEMsTUFBTSxXQUFXLEdBQUcsTUFBTSxNQUFNLENBQUMsVUFBVSxDQUFDLHVDQUF1QztzQkFDN0UsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEdBQUcsR0FBRyxDQUFDLENBQUM7Z0JBQ2hDLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO29CQUM3QixJQUFJLGFBQWEsR0FBRyxFQUFFLENBQUM7b0JBQ3ZCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUU7d0JBQ3pCLGFBQWEsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztxQkFDN0U7b0JBQ0QsSUFBSSxtQkFBbUIsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDO29CQUMvQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxHQUFHLG1CQUFtQixFQUFFLEVBQUUsQ0FBQyxFQUFFO3dCQUNoRCxhQUFhLEdBQUcsR0FBRyxHQUFHLGFBQWEsQ0FBQztxQkFDdkM7b0JBQ0QsSUFBSSxXQUFXLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQztvQkFDcEMsSUFBSSx3QkFBd0IsR0FBRyxJQUFJLFVBQVUsQ0FBQyxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFDL0UsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2hFLElBQUksdUJBQXVCLEdBQUcsRUFBRSxDQUFDO29CQUNqQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsd0JBQXdCLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFO3dCQUN0RCx1QkFBdUIsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7OEJBQ2xFLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztxQkFDbEQ7b0JBQ0QsSUFBSSw2QkFBNkIsR0FBRyx1QkFBdUIsQ0FBQyxNQUFNLENBQUM7b0JBQ25FLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsNkJBQTZCLEVBQUUsRUFBRSxDQUFDLEVBQUU7d0JBQzFELHVCQUF1QixHQUFHLEdBQUcsR0FBRyx1QkFBdUIsQ0FBQztxQkFDM0Q7b0JBQ0QsTUFBTSxNQUFNLENBQUMsVUFBVSxDQUNuQixxSkFBcUo7MEJBQ25KLFlBQVksR0FBRyxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssR0FBRyxNQUFNLEdBQUcsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEdBQUcsTUFBTTswQkFDM0UsS0FBSyxHQUFHLHVCQUF1QixHQUFHLE1BQU0sR0FBRyxLQUFLLEdBQUcsYUFBYSxHQUFHLDZDQUE2QyxDQUFDLENBQUM7b0JBQ3hILElBQUksR0FBRyxHQUFHLE1BQU0sTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUMzQixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7b0JBQ2hDLE1BQU0sT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUN0QyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7aUJBQ2hDO3FCQUFNO29CQUNILE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLEVBQUUsSUFBSSxFQUFFLDRCQUE0QixFQUFFLENBQUM7aUJBQ2xFO2FBQ0o7aUJBQU07Z0JBQ0gsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsRUFBRSxJQUFJLEVBQUUsK0JBQStCLEVBQUUsQ0FBQzthQUNyRTtZQUNELE1BQU0sTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ25CLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQztZQUMvQixPQUFPO1NBQ1Y7UUFDRCxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUM7S0FDbkQ7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNWLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDcEI7QUFDTCxDQUFDLENBQUM7S0FDRCxJQUFJLENBQUMsWUFBWSxFQUFFLEtBQUssRUFBRSxPQUEyQixFQUFFLEVBQUU7SUFDdEQsSUFBSTtRQUNBLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTtZQUMxQixPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUM7U0FDbkQ7UUFDRCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3BDLElBQUksSUFBK0IsQ0FBQztRQUNwQyxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFO1lBQ3RCLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUM7U0FDM0I7UUFDRCxJQUFJLElBQUksRUFBRTtZQUNOLE9BQU8sQ0FBQyxNQUFNLENBQ1YsT0FBTyxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssS0FBSyxRQUFRO21CQUNuQyxPQUFPLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxLQUFLLFFBQVEsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDckUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQztZQUNwQyxNQUFNLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN2QixNQUFNLGNBQWMsR0FBRyxNQUFNLE1BQU0sQ0FBQyxVQUFVLENBQUMsMkVBQTJFO2tCQUNwSCxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQztZQUNoQyxJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDaEMsTUFBTSxXQUFXLEdBQUcsTUFBTSxNQUFNLENBQUMsVUFBVSxDQUFDLHdFQUF3RTtzQkFDOUcsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEdBQUcsR0FBRyxDQUFDLENBQUM7Z0JBQ2hDLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO29CQUM3QixPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxFQUFFLElBQUksRUFBRSx3Q0FBd0MsRUFBRSxDQUFDO2lCQUM5RTtxQkFBTTtvQkFDSCxJQUFJLGFBQWEsR0FBRyxFQUFFLENBQUM7b0JBQ3ZCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBSSxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBZ0IsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUU7d0JBQ3BFLGFBQWEsSUFBSSxDQUFFLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFnQixDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7OEJBQ3JFLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztxQkFDaEU7b0JBQ0QsSUFBSSxXQUFXLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQztvQkFDcEMsSUFBSSx3QkFBd0IsR0FBRyxJQUFJLFVBQVUsQ0FBQyxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFDL0UsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2hFLElBQUksdUJBQXVCLEdBQUcsRUFBRSxDQUFDO29CQUNqQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsd0JBQXdCLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFO3dCQUN0RCx1QkFBdUIsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7OEJBQ2xFLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztxQkFDbEQ7b0JBQ0QsSUFBSSw2QkFBNkIsR0FBRyxFQUFFLENBQUM7b0JBQ3ZDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBSSxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBZ0IsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUU7d0JBQ3BFLDZCQUE2QixJQUFJLENBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQWdCLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzs4QkFDckYsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO3FCQUNoRTtvQkFDRCxJQUFJLHVCQUF1QixLQUFLLDZCQUE2QixFQUFFO3dCQUMzRCxJQUFJLFNBQVMsR0FBUzs0QkFDbEIsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFXLEVBQUU7NEJBQ2xELFFBQVEsRUFBRSxFQUFFLEtBQUssRUFBRSxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBVyxFQUFFOzRCQUNyRCxRQUFRLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO3lCQUMxQixDQUFBO3dCQUNELElBQUksR0FBRyxHQUFHLE1BQU0sTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUMzQixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7d0JBQ3JDLE1BQU0sT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO3dCQUN0QyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxTQUFTLENBQUM7cUJBQ3JDO3lCQUFNO3dCQUNILE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLENBQUM7cUJBQ3REO2lCQUNKO2FBQ0o7aUJBQU07Z0JBQ0gsSUFBSSxhQUFhLEdBQUcsRUFBRSxDQUFDO2dCQUN2QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQWdCLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFO29CQUN2RSxhQUFhLElBQUksQ0FBRSxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBZ0IsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDOzBCQUN4RSxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ25FO2dCQUNELElBQUksV0FBVyxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7Z0JBQ3BDLElBQUksd0JBQXdCLEdBQUcsSUFBSSxVQUFVLENBQUMsTUFBTSxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQy9FLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoRSxJQUFJLHVCQUF1QixHQUFHLEVBQUUsQ0FBQztnQkFDakMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLHdCQUF3QixDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtvQkFDdEQsdUJBQXVCLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDOzBCQUNsRSx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ2xEO2dCQUNELElBQUksNkJBQTZCLEdBQUcsRUFBRSxDQUFDO2dCQUN2QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQWdCLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFO29CQUN2RSw2QkFBNkIsSUFBSSxDQUFFLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFnQixDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7MEJBQ3hGLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDbkU7Z0JBQ0QsSUFBSSx1QkFBdUIsS0FBSyw2QkFBNkIsRUFBRTtvQkFDM0QsSUFBSSxTQUFTLEdBQVM7d0JBQ2xCLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBVyxFQUFFO3dCQUNyRCxRQUFRLEVBQUUsRUFBRSxLQUFLLEVBQUUsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQVcsRUFBRTt3QkFDeEQsUUFBUSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtxQkFDMUIsQ0FBQTtvQkFDRCxJQUFJLEdBQUcsR0FBRyxNQUFNLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDM0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO29CQUNyQyxNQUFNLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDdEMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsU0FBUyxDQUFDO2lCQUNyQztxQkFBTTtvQkFDSCxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxDQUFDO2lCQUN0RDthQUNKO1lBQ0QsTUFBTSxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDbkIsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDO1lBQy9CLE9BQU87U0FDVjtRQUNELE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUMsQ0FBQztLQUNuRDtJQUFDLE9BQU8sR0FBRyxFQUFFO1FBQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNwQjtBQUNMLENBQUMsQ0FBQztLQUNELEdBQUcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO0lBQ2hDLElBQUk7UUFDQSxJQUFJLEdBQUcsR0FBRyxNQUFNLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNDLElBQUksR0FBRyxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRTtZQUNoQyxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBYSxDQUFDLENBQUM7WUFDbkMsSUFBSSxRQUFRLEVBQUU7Z0JBQ1YsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3ZCLE1BQU0sY0FBYyxHQUFHLE1BQU0sTUFBTSxDQUFDLFVBQVUsQ0FBQyxzRkFBc0Y7c0JBQy9ILFFBQVEsR0FBRyxHQUFHLENBQUMsQ0FBQztnQkFDdEIsSUFBSSxTQUFTLEdBQVM7b0JBQ2xCLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBVyxFQUFFO29CQUNyRCxRQUFRLEVBQUUsRUFBRSxLQUFLLEVBQUUsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQVcsRUFBRTtvQkFDeEQsUUFBUSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtpQkFDMUIsQ0FBQTtnQkFDRCxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRztvQkFDcEIsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsT0FBTyxFQUFFLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFXO29CQUM1QyxTQUFTLEVBQUUsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQVc7b0JBQzlDLFNBQVMsRUFBRSxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBVztpQkFDakQsQ0FBQztnQkFDRixNQUFNLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQzthQUN0QjtTQUNKO0tBQ0o7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNWLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDcEI7QUFDTCxDQUFDLENBQUM7S0FDRCxHQUFHLENBQUMsZUFBZSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRTtJQUNwQyxJQUFJO1FBQ0EsSUFBSSxHQUFHLEdBQUcsTUFBTSxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQyxJQUFJLEdBQUcsSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLEVBQUU7WUFDaEMsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQWEsQ0FBQyxDQUFDO1lBQ25DLElBQUksZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFhLENBQVcsQ0FBQyxDQUFDO1lBQzlELElBQUksUUFBUSxJQUFJLGdCQUFnQixFQUFFO2dCQUM5QixNQUFNLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDdkIsTUFBTSxjQUFjLEdBQUcsTUFBTSxNQUFNLENBQUMsVUFBVSxDQUFDLCtDQUErQztzQkFDeEYsUUFBUSxHQUFHLEdBQUcsQ0FBQyxDQUFDO2dCQUN0QixNQUFNLHNCQUFzQixHQUFHLE1BQU0sTUFBTSxDQUFDLFVBQVUsQ0FBQywrQ0FBK0M7c0JBQ2hHLGdCQUFnQixHQUFHLEdBQUcsQ0FBQyxDQUFDO2dCQUM5QixNQUFNLFlBQVksR0FBcUI7b0JBQ25DLEdBQUcsRUFBRTt3QkFDRCxRQUFRLEVBQUUsUUFBUTt3QkFDbEIsU0FBUyxFQUFFLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFXO3dCQUM5QyxHQUFHLEVBQUUsR0FBRztxQkFDWDtvQkFDRCxRQUFRLEVBQUU7d0JBQ04sUUFBUSxFQUFFLGdCQUFnQjt3QkFDMUIsU0FBUyxFQUFFLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQVc7d0JBQ3RELEdBQUcsRUFBRSxFQUFFO3FCQUNWO2lCQUNKLENBQUM7Z0JBQ0YsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsWUFBWSxDQUFDO2dCQUNyQyxNQUFNLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQzthQUN0QjtTQUNKO0tBQ0o7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNWLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDcEI7QUFDTCxDQUFDLENBQUM7S0FDRCxHQUFHLENBQUMsZUFBZSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRTtJQUNwQyxJQUFJO1FBQ0EsSUFBSSxHQUFHLEdBQUcsTUFBTSxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQyxJQUFJLEdBQUcsSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLEVBQUU7WUFDaEMsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdkIsTUFBTSxjQUFjLEdBQUcsTUFBTSxNQUFNLENBQUMsVUFBVSxDQUFDLHNGQUFzRjtrQkFDL0gsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ25FLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDekUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNuQixNQUFNLFlBQVksR0FBa0I7Z0JBQ2hDLFFBQVEsRUFBRSxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBVztnQkFDN0Msa0JBQWtCLEVBQUUsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQVc7Z0JBQ3ZELG9CQUFvQixFQUFFLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFXO2FBQzVELENBQUM7WUFDRixPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxZQUFZLENBQUM7WUFDckMsTUFBTSxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDdEI7S0FDSjtJQUFDLE9BQU8sR0FBRyxFQUFFO1FBQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNwQjtBQUNMLENBQUMsQ0FBQztLQUNELEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7SUFDdkMsSUFBSTtRQUNBLElBQUksR0FBRyxHQUFHLE1BQU0sT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0MsSUFBSSxHQUFHLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFO1lBQ2hDLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFhLENBQUMsQ0FBQztZQUNuQyxJQUFJLFFBQVEsRUFBRTtnQkFDVixNQUFNLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDdkIsTUFBTSxjQUFjLEdBQUcsTUFBTSxNQUFNLENBQUMsVUFBVSxDQUFDLCtDQUErQztzQkFDeEYsUUFBUSxHQUFHLEdBQUcsQ0FBQyxDQUFDO2dCQUN0QixJQUFJLGVBQWUsR0FBb0I7b0JBQ25DLFNBQVMsRUFBRSxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBVztvQkFDOUMsR0FBRyxFQUFFLEdBQUc7aUJBQ1gsQ0FBQTtnQkFDRCxNQUFNLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDbkIsSUFBSSxNQUFNLEdBQXdCLENBQUMsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQUUsbUJBQW1CLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztnQkFDckgsSUFBSSxNQUFNLEdBQWEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDMUMsSUFBSSxjQUFjLEdBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxVQUFVLEdBQVksS0FBSyxDQUFDO2dCQUNoQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtvQkFDcEMsSUFBSSxVQUFVLEdBQUcsTUFBTSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLGVBQWUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLEVBQUU7d0JBQy9FLE1BQU07cUJBQ1Q7eUJBQU07d0JBQ0gsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRTs0QkFDeEMsSUFBSSxVQUFVLEdBQUcsTUFBTSxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsRUFBRTtnQ0FDbEYsTUFBTTs2QkFDVDt5QkFDSjt3QkFDRCxJQUFJLFVBQVUsRUFBRTs0QkFDWixNQUFNO3lCQUNUO3dCQUNELGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7cUJBQ25DO2lCQUNKO2dCQUNELElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxVQUFVLENBQUMsbUJBQW1CLEVBQUUsZUFBZSxFQUFFLEdBQUcsRUFBRSxPQUFPLENBQUMsRUFBRTtvQkFDaEYsT0FBTyxDQUFDLENBQUMsTUFBTSxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQyxFQUFFLEdBQUc7aUJBQ3JGO2FBQ0o7U0FDSjtLQUNKO0lBQUMsT0FBTyxHQUFHLEVBQUU7UUFDVixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3BCO0FBQ0wsQ0FBQyxDQUFDO0tBQ0QsR0FBRyxDQUFDLGFBQWEsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7SUFDbEMsSUFBSTtRQUNBLElBQUksR0FBRyxHQUFHLE1BQU0sT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0MsSUFBSSxHQUFHLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFO1lBQ2hDLE9BQU8sSUFBSSxDQUFDLEdBQWEsQ0FBQyxDQUFDO1lBQzNCLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLEVBQUUsSUFBSSxFQUFFLHlCQUF5QixFQUFFLENBQUM7U0FDL0Q7S0FDSjtJQUFDLE9BQU8sR0FBRyxFQUFFO1FBQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNwQjtBQUNMLENBQUMsQ0FBQztLQUNELElBQUksQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLE9BQTJCLEVBQUUsRUFBRTtJQVNwRCxJQUFJO1FBQ0EsSUFBSSxHQUFHLEdBQUcsTUFBTSxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQyxJQUFJLEdBQUcsSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLEVBQUU7WUFDaEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFO2dCQUMxQixPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUM7YUFDbkQ7WUFDRCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3BDLElBQUksSUFBeUMsQ0FBQztZQUM5QyxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFO2dCQUN0QixJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDO2FBQzNCO1lBQ0QsSUFBSSxJQUFJLEVBQUU7Z0JBQ04sT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLElBQUksRUFBRSxLQUFLLEtBQUssUUFBUSxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDbkUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLElBQUksRUFBRSxLQUFLLEtBQUssUUFBUSxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDbkUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ25CLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzVELE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQ0FBZ0MsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3ZFLElBQUksVUFBVSxHQUFhLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNsRCxJQUFJLGtCQUFrQixHQUFXLEVBQUUsQ0FBQztnQkFDcEMsSUFBSSxtQkFBbUIsR0FBd0IsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNyRixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsbUJBQW1CLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtvQkFDN0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDaEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDbkIsSUFBSSxtQkFBbUIsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxFQUFFO3dCQUMzQyxrQkFBa0IsSUFBSSxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDO3FCQUNuRTt5QkFBTSxJQUFJLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLEVBQUU7d0JBQ2xELElBQUkseUJBQXlCLEdBQWEsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUMvRixPQUFPLENBQUMsR0FBRyxDQUFDLDZFQUE2RSxDQUFDLENBQUM7d0JBQzNGLE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsQ0FBQzt3QkFDdkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2RUFBNkUsQ0FBQyxDQUFDO3dCQUMzRixrQkFBa0IsSUFBSSx5QkFBeUIsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDO3dCQUN6RSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcseUJBQXlCLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFOzRCQUN2RCxrQkFBa0IsSUFBSSxRQUFRLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsR0FBRyxJQUFJLENBQUM7eUJBQ2xGO3dCQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsNkVBQTZFLENBQUMsQ0FBQzt3QkFDM0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO3dCQUNoQyxPQUFPLENBQUMsR0FBRyxDQUFDLDZFQUE2RSxDQUFDLENBQUM7cUJBQzlGO3lCQUFNLElBQUksbUJBQW1CLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRTt3QkFDbkQsSUFBSSx5QkFBeUIsR0FBYSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQ25HLGtCQUFrQixJQUFJLHlCQUF5QixDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsR0FBRyxJQUFJLENBQUM7d0JBQ3pFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyx5QkFBeUIsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUU7NEJBQ3ZELElBQUksMEJBQTBCLEdBQWEsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzs0QkFDcEUsa0JBQWtCLElBQUksMEJBQTBCLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQTs0QkFDekUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLDBCQUEwQixDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtnQ0FDeEQsa0JBQWtCLElBQUksUUFBUSxDQUFDLDBCQUEwQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDOzZCQUNuRjt5QkFDSjtxQkFDSjtpQkFDSjtnQkFDRCxJQUFJLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO29CQUM3QyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNuQixPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNqRCxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO2lCQUN0QjtnQkFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNuQixNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsMEJBQTBCLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztnQkFDekUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbkIsTUFBTSxhQUFhLEdBQUcsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDO29CQUNqQyxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQztvQkFDeEIsR0FBRyxFQUFFLFlBQVksR0FBRyxtQkFBbUIsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFO29CQUM3RCxNQUFNLEVBQUUsT0FBTztpQkFDbEIsQ0FBQyxDQUFDO2dCQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ25CLE1BQU0sYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUM3QixPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNuQixJQUFJLFdBQVcsR0FBVyxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsbUNBQW1DLENBQUMsQ0FBQztnQkFDdkYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDekIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbkIsSUFBSSxxQkFBcUIsR0FBVyxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsMkNBQTJDLENBQUMsQ0FBQztnQkFDekcsSUFBSSxhQUFhLEdBQVcsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLG1DQUFtQyxDQUFDLENBQUM7Z0JBQ3pGLElBQUksa0JBQWtCLEdBQWEsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDN0QsSUFBSSxtQkFBbUIsR0FBVyxFQUFFLENBQUM7Z0JBQ3JDLElBQUksbUJBQW1CLENBQUMsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7b0JBQzdDLElBQUksbUJBQW1CLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsRUFBRTt3QkFDNUMsSUFBSSxrQkFBa0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFOzRCQUMvQixtQkFBbUIsSUFBSSxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQzt5QkFDaEQ7cUJBQ0o7eUJBQU0sSUFBSSxtQkFBbUIsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxFQUFFO3dCQUNuRCxJQUFJLENBQUMsR0FBVyxDQUFDLENBQUM7d0JBQ2xCLElBQUksa0JBQWtCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTs0QkFDL0IsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3lCQUN2Qzt3QkFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksa0JBQWtCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTs0QkFDeEMsbUJBQW1CLElBQUksR0FBRyxHQUFHLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO3lCQUN0RDt3QkFDRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFOzRCQUN4QixtQkFBbUIsSUFBSSxJQUFJLEdBQUcsa0JBQWtCLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO3lCQUMzRDt3QkFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7NEJBQ1AsbUJBQW1CLElBQUksR0FBRyxDQUFBO3lCQUM3QjtxQkFDSjt5QkFBTSxJQUFJLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLEVBQUU7d0JBQ3BELElBQUksQ0FBQyxHQUFXLENBQUMsQ0FBQzt3QkFDbEIsSUFBSSxFQUFFLEdBQVcsQ0FBQyxDQUFDO3dCQUNuQixJQUFJLENBQUMsR0FBVyxDQUFDLENBQUM7d0JBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQ25CLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQzt3QkFDaEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDbkIsSUFBSSxrQkFBa0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFOzRCQUMvQixDQUFDLEdBQUcsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt5QkFDekM7d0JBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFOzRCQUNQLG1CQUFtQixJQUFJLElBQUksQ0FBQzs0QkFDNUIsSUFBSSxrQkFBa0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dDQUMvQixFQUFFLEdBQUcsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzs2QkFDMUM7NEJBQ0QsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLGtCQUFrQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0NBQ3pDLG1CQUFtQixJQUFJLGtCQUFrQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7NkJBQ2xEOzRCQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUU7Z0NBQ3pCLG1CQUFtQixJQUFJLElBQUksR0FBRyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDOzZCQUN6RDs0QkFDRCxtQkFBbUIsSUFBSSxHQUFHLENBQUE7eUJBQzdCO3dCQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUU7NEJBQ3hCLG1CQUFtQixJQUFJLEtBQUssQ0FBQzs0QkFDN0IsRUFBRSxHQUFHLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7NEJBQ3ZDLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRTtnQ0FDUixtQkFBbUIsSUFBSSxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDOzZCQUNsRDs0QkFDRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFO2dDQUN6QixtQkFBbUIsSUFBSSxJQUFJLEdBQUcsa0JBQWtCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQzs2QkFDekQ7NEJBQ0QsbUJBQW1CLElBQUksR0FBRyxDQUFBO3lCQUM3Qjt3QkFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7NEJBQ1AsbUJBQW1CLElBQUksR0FBRyxDQUFBO3lCQUM3QjtxQkFDSjtpQkFDSjtnQkFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNuQixPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUM7Z0JBQ25DLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ25CLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQztnQkFDakMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbkIsV0FBVyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUM3QyxXQUFXLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUE7Z0JBQ3BFLElBQUksV0FBVyxHQUFrQixJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUNwRSxJQUFJLGVBQWUsR0FBb0I7b0JBQ25DLGVBQWUsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBYyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDO29CQUMvRCxjQUFjLEVBQUUscUJBQXFCO29CQUNyQyxNQUFNLEVBQUUsbUJBQW1CO2lCQUM5QixDQUFDO2dCQU1GLElBQUksQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUN6RixJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQy9CLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNwQixPQUFPLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDNUIsT0FBTyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3pCLE9BQU8sWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUNqQyxPQUFPLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDMUIsT0FBTyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQ2xDLElBQUksT0FBZSxFQUNmLFFBQWdCLEVBQ2hCLFNBQWlCLEVBQ2pCLG9CQUFvQixHQUFZLEtBQUssRUFDckMsaUJBQXlCLEVBQ3pCLGdCQUF3QixFQUN4QixpQkFBeUIsRUFDekIsNEJBQTRCLEdBQVksS0FBSyxDQUFDO29CQUNsRCxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBYSxDQUFDLENBQUM7b0JBQ25DLElBQUksUUFBUSxFQUFFO3dCQUNWLE1BQU0sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUN2QixNQUFNLGNBQWMsR0FBRyxNQUFNLE1BQU0sQ0FBQyxVQUFVLENBQUMsOEZBQThGOzhCQUN2SSxRQUFRLEdBQUcsR0FBRyxDQUFDLENBQUM7d0JBQ3RCLE9BQU8sR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBVyxDQUFDO3dCQUM5QyxRQUFRLEdBQUcsT0FBTyxHQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFZLENBQUM7d0JBQzNELFNBQVMsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBVyxDQUFDO3dCQUNoRCxvQkFBb0IsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBWSxDQUFDO3dCQUM1RCxNQUFNLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQzt3QkFDbkIsSUFBSSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsV0FBcUIsQ0FBQyxDQUFDO3dCQUNuRCxJQUFJLGdCQUFnQixFQUFFOzRCQUNsQixNQUFNLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQzs0QkFDdkIsTUFBTSxjQUFjLEdBQUcsTUFBTSxNQUFNLENBQUMsVUFBVSxDQUMxQyw4RkFBOEY7a0NBQzVGLGdCQUFnQixHQUFHLEdBQUcsQ0FBQyxDQUFDOzRCQUM5QixpQkFBaUIsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBVyxDQUFDOzRCQUN4RCxnQkFBZ0IsR0FBSSxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBWSxHQUFHLGlCQUFpQixDQUFDOzRCQUM3RSxpQkFBaUIsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBVyxDQUFDOzRCQUN4RCw0QkFBNEIsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBWSxDQUFDOzRCQUNwRSxNQUFNLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQzs0QkFDbkIsRUFBRSxPQUFPLENBQUM7NEJBQ1YsSUFBSSxrQkFBa0IsR0FBVyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQzs0QkFDdkcsU0FBUyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxDQUFDOzRCQUNoSSxFQUFFLGlCQUFpQixDQUFDOzRCQUNwQixpQkFBaUIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztrQ0FDbEksa0JBQWtCLENBQUMsQ0FBQzs0QkFDMUIsSUFBSSxRQUFRLEVBQUU7Z0NBQ1YsTUFBTSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7Z0NBQ3ZCLE1BQU0sTUFBTSxDQUFDLFVBQVUsQ0FBQyw4QkFBOEIsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFO3NDQUNyRSxpQkFBaUIsR0FBRyxTQUFTLENBQUMsUUFBUSxFQUFFLEdBQUcsOEJBQThCO3NDQUN6RSxDQUFDLG9CQUFvQixJQUFJLFNBQVMsSUFBSSxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsR0FBRyxtQkFBbUI7c0NBQzVFLFFBQVEsR0FBRyxHQUFHLENBQUMsQ0FBQztnQ0FDdEIsTUFBTSxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7NkJBQ3RCOzRCQUNELElBQUksZ0JBQWdCLEVBQUU7Z0NBQ2xCLE1BQU0sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dDQUN2QixNQUFNLE1BQU0sQ0FBQyxVQUFVLENBQUMsZ0NBQWdDLEdBQUcsaUJBQWlCLENBQUMsUUFBUSxFQUFFO3NDQUNqRixpQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsR0FBRyw4QkFBOEI7c0NBQ2pGLENBQUMsNEJBQTRCLElBQUksaUJBQWlCLElBQUksSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsbUJBQW1CO3NDQUM1RixnQkFBZ0IsR0FBRyxHQUFHLENBQUMsQ0FBQztnQ0FDOUIsTUFBTSxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7NkJBQ3RCO3lCQUNKO3FCQUNKO2lCQUNKO2dCQUNELE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLGVBQWUsQ0FBQzthQUMzQztTQUNKO0tBQ0o7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNWLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDcEI7QUFDTCxDQUFDLENBQUM7S0FDRCxHQUFHLENBQUMsdUJBQXVCLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO0lBQzVDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLEVBQUUsUUFBUSxFQUM5QixJQUFJLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyx3QkFBd0I7S0FDekQsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDO0FBQ1AsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztBQUN6QixHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO0FBQ2pDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO0lBQ3RCLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztXQUMxQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO1dBQzlDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUM7V0FDOUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQ25ELE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUM7S0FDdEM7SUFDRCxNQUFNLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDZixJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLGtCQUFrQjtRQUNyQyxLQUFLLEVBQUUsWUFBWTtLQUN0QixDQUFDLENBQUM7QUFDUCxDQUFDLENBQUMsQ0FBQztBQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDckMsTUFBTSxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gICAgQXBwbGljYXRpb24sXG4gICAgUm91dGVyLFxuICAgIFJvdXRlckNvbnRleHQsXG4gICAgU3RhdHVzLFxuICAgIHNlbmQsXG59IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC94L29hay9tb2QudHNcIjtcblxuaW1wb3J0IHsgTWF0Y2htYWtpbmdEYXRhIH0gZnJvbSBcIi4vcmVhY3QtYXBwL3NyYy9jb21wb25lbnRzL2NvbW1vbi9pbnRlcmZhY2VzL21hdGNobWFraW5nRGF0YS50c1wiO1xuaW1wb3J0IHsgUXVlc3Rpb25EYXRhIH0gZnJvbSBcIi4vcmVhY3QtYXBwL3NyYy9jb21wb25lbnRzL2NvbW1vbi9pbnRlcmZhY2VzL21hdGNobWFraW5nRGF0YS50c1wiO1xuaW1wb3J0IHsgVGVzdENhc2VzUGFzc2VkIH0gZnJvbSBcIi4vcmVhY3QtYXBwL3NyYy9jb21wb25lbnRzL2NvbW1vbi9pbnRlcmZhY2VzL21hdGNobWFraW5nRGF0YS50c1wiO1xuXG5pbXBvcnQgeyBDbGllbnQgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9wb3N0Z3Jlc0B2MC4xNS4wL21vZC50c1wiO1xuaW1wb3J0IHsgY3J5cHRvIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEzMi4wL2NyeXB0by9tb2QudHNcIjtcbmltcG9ydCB7IG5hbm9pZCB9IGZyb20gJ2h0dHBzOi8vZGVuby5sYW5kL3gvbmFub2lkQHYzLjAuMC9hc3luYy50cydcbmltcG9ydCB7IGVuc3VyZURpciB9IGZyb20gJ2h0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEzNi4wL2ZzL21vZC50cyc7XG5pbXBvcnQgeyBwYXJzZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4xNDMuMC9mbGFncy9tb2QudHNcIlxuY29uc3QgY2xpZW50ID0gbmV3IENsaWVudCh7XG4gICAgdXNlcjogXCJsaWNvZGVcIixcbiAgICBkYXRhYmFzZTogXCJsaWNvZGVcIixcbiAgICBwYXNzd29yZDogXCJlZG9jaWxcIixcbiAgICBob3N0bmFtZTogXCJsb2NhbGhvc3RcIixcbiAgICBwb3J0OiA1NDMyLFxuICAgIHRsczoge1xuICAgICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgICAgZW5mb3JjZTogZmFsc2UsXG4gICAgfSxcbn0pO1xuY29uc3QgZW52ID0gRGVuby5lbnYudG9PYmplY3QoKTtcbmNvbnN0IGFyZ3MgPSBwYXJzZShEZW5vLmFyZ3MsIHthbGlhczoge1wicHJvZFwiOiBcInBcIn0sIGJvb2xlYW46IFtcInByb2RcIl0sfSlcbmNvbnN0IHByb2QgOiBib29sZWFuID0gYXJncy5wcm9kXG5jb25zdCBhcHAgPSBuZXcgQXBwbGljYXRpb24oKTtcbmNvbnN0IHJvdXRlciA9IG5ldyBSb3V0ZXIoKTtcbi8vbGV0IGlpaUNvdW50ZXIgPSAwO1xuXG5pbnRlcmZhY2UgSGVsbG9Xb3JsZCB7XG4gICAgdGV4dDogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgVXNlciB7XG4gICAgZW1haWw6IHsgdmFsdWU6IHN0cmluZyB9O1xuICAgIHVzZXJuYW1lOiB7IHZhbHVlOiBzdHJpbmcgfTtcbiAgICBwYXNzd29yZDogeyB2YWx1ZTogc3RyaW5nIH07XG59XG5cbmludGVyZmFjZSBNYXRjaG1ha2luZ1VzZXIge1xuICAgIGVsb1JhdGluZzogbnVtYmVyO1xuICAgIHNpZDogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgQ29kZVN1Ym1pc3Npb24ge1xuICAgIHZhbHVlOiBzdHJpbmc7XG4gICAgaW5wdXQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFRlc3RSZXN1bHQge1xuICAgIHRlc3ROYW1lOiBzdHJpbmcsXG4gICAgcGFzc2VkOiBib29sZWFuXG59XG5cbmludGVyZmFjZSBRdWVzdGlvbkluZm9ybWF0aW9uIHtcbiAgICBxdWVzdGlvbklkOiBudW1iZXIsXG4gICAgaW5wdXRGb3JtYXQ6IHN0cmluZ1tdLFxuICAgIG91dHB1dEZvcm1hdDogc3RyaW5nW10sXG59XG5cbmNvbnN0IG51bVF1ZXN0aW9uc1Blck1hdGNoID0gMztcblxubGV0IGhlbGxvV29ybGRWYXI6IEhlbGxvV29ybGQgPSB7IHRleHQ6ICdIZWxsbyBXb3JsZCcgfTtcblxubGV0IHNpZHM6IHsgW25hbWU6IHN0cmluZ106IHN0cmluZyB9ID0ge307XG5cbmxldCBzaWRzUHJvZ3Jlc3M6IHsgW25hbWU6IHN0cmluZ106IG51bWJlciB9ID0ge307XG5cbmxldCBzaWRzUXVlc3Rpb25zOiB7IFtuYW1lOiBzdHJpbmddOiBRdWVzdGlvbkluZm9ybWF0aW9uW10gfSA9IHt9O1xuXG5sZXQgbWF0Y2htYWtpbmdRdWV1ZTI1OiBNYXRjaG1ha2luZ1VzZXJbXSA9IFtdO1xubGV0IG1hdGNobWFraW5nUXVldWU1MDogTWF0Y2htYWtpbmdVc2VyW10gPSBbXTtcbmxldCBtYXRjaG1ha2luZ1F1ZXVlMTAwOiBNYXRjaG1ha2luZ1VzZXJbXSA9IFtdO1xubGV0IG1hdGNobWFraW5nUXVldWUyMDA6IE1hdGNobWFraW5nVXNlcltdID0gW107XG5sZXQgbWF0Y2htYWtpbmdRdWV1ZTUwMDogTWF0Y2htYWtpbmdVc2VyW10gPSBbXTtcblxubGV0IG1hdGNoZXM6IHsgW25hbWU6IHN0cmluZ106IHN0cmluZyB9ID0ge307XG5cbmNvbnN0IG51bVRlc3RDYXNlczogbnVtYmVyID0gMTE7XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyUGFpckVuZFBvaW50KCkgOiBzdHJpbmcge1xuICAgIHJldHVybiBwcm9kID8gXCJodHRwczovL2xpY29kZS5pby9yZWdpc3RlclBhaXJcIiA6IFwiaHR0cDovL2xvY2FsaG9zdDo1MDAwL3JlZ2lzdGVyUGFpclwiO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZVRlc3RDYXNlU3RyaW5nKGFsbFRlc3RDYXNlczogc3RyaW5nW10sIGZvcm1hdDogc3RyaW5nW10sIGo6IG51bWJlciwgc2hvdWxkUHJpbnQ6IGJvb2xlYW4pIHtcbiAgICBsZXQgdGVzdENhc2VTdHJpbmcgPSAnJztcbiAgICBsZXQgdGVzdENhc2UgPSBhbGxUZXN0Q2FzZXNbal0uc3BsaXQoJzsnKTtcbiAgICBsZXQgayA9IDA7XG4gICAgbGV0IG0gPSAwO1xuICAgIGxldCBtTWF4ID0gMDtcbiAgICBsZXQgbiA9IDA7XG4gICAgbGV0IG5NYXggPSAwO1xuICAgIGxldCBpbnNpZGVBcnJheSA9IGZhbHNlO1xuICAgIGxldCBpbnNpZGVBcnJheUFycmF5ID0gZmFsc2U7XG4gICAgaWYgKHNob3VsZFByaW50KSB7IGNvbnNvbGUubG9nKFwiT1VUUFVUT1VUUFVUT1VUUFVUT1VUUFVUT1VUUFVUT1VUUFVUT1VUUFVUT1VUUFVUT1VUUFVUXCIpOyB9XG4gICAgZm9yIChsZXQgbCA9IDA7IGwgPCB0ZXN0Q2FzZS5sZW5ndGg7ICsrbCkge1xuICAgICAgICBpZiAoc2hvdWxkUHJpbnQpIHsgY29uc29sZS5sb2coXCJMXCIgKyBsLnRvU3RyaW5nKCkgKyBcIkxcIik7IGNvbnNvbGUubG9nKFwiTElcIiArIHRlc3RDYXNlW2xdICsgXCJMSVwiKTsgfVxuICAgICAgICBpZiAoZm9ybWF0W2tdID09ICduJykge1xuICAgICAgICAgICAgaWYgKHNob3VsZFByaW50KSB7IGNvbnNvbGUubG9nKFwiS1wiICsgay50b1N0cmluZygpICsgXCJLXCIpOyB9XG4gICAgICAgICAgICB0ZXN0Q2FzZVN0cmluZyArPSB0ZXN0Q2FzZVtsXSArICdcXG4nO1xuICAgICAgICAgICAgKytrO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdFtrXSA9PSAnYScpIHtcbiAgICAgICAgICAgIGlmIChpbnNpZGVBcnJheSkge1xuICAgICAgICAgICAgICAgIGlmIChtIDwgbU1heCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2hvdWxkUHJpbnQpIHsgY29uc29sZS5sb2coXCJNXCIgKyBtLnRvU3RyaW5nKCkgKyBcIk1cIik7IH1cbiAgICAgICAgICAgICAgICAgICAgdGVzdENhc2VTdHJpbmcgKz0gdGVzdENhc2VbbF0gKyAnXFxuJztcbiAgICAgICAgICAgICAgICAgICAgKyttO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzaG91bGRQcmludCkgeyBjb25zb2xlLmxvZyhcIktLXCIgKyBrLnRvU3RyaW5nKCkgKyBcIktLXCIpOyB9XG4gICAgICAgICAgICAgICAgICAgIGluc2lkZUFycmF5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICsraztcbiAgICAgICAgICAgICAgICAgICAgLS1sO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHNob3VsZFByaW50KSB7IGNvbnNvbGUubG9nKFwiTU1cIiArIG0udG9TdHJpbmcoKSArIFwiTU1cIik7IH1cbiAgICAgICAgICAgICAgICB0ZXN0Q2FzZVN0cmluZyArPSB0ZXN0Q2FzZVtsXSArICdcXG4nO1xuICAgICAgICAgICAgICAgIG0gPSAwO1xuICAgICAgICAgICAgICAgIG1NYXggPSBwYXJzZUludCh0ZXN0Q2FzZVtsXSk7XG4gICAgICAgICAgICAgICAgaW5zaWRlQXJyYXkgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdFtrXSA9PSAnYWEnKSB7XG4gICAgICAgICAgICBpZiAoaW5zaWRlQXJyYXkpIHtcbiAgICAgICAgICAgICAgICBpZiAobSA8IG1NYXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluc2lkZUFycmF5QXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuIDwgbk1heCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzaG91bGRQcmludCkgeyBjb25zb2xlLmxvZyhcIk5cIiArIG4udG9TdHJpbmcoKSArIFwiTlwiKTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlc3RDYXNlU3RyaW5nICs9IHRlc3RDYXNlW2xdICsgJ1xcbic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKytuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2hvdWxkUHJpbnQpIHsgY29uc29sZS5sb2coXCJNTU1cIiArIG0udG9TdHJpbmcoKSArIFwiTU1NXCIpOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zaWRlQXJyYXlBcnJheSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrbTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAtLWw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2hvdWxkUHJpbnQpIHsgY29uc29sZS5sb2coXCJOTlwiICsgbi50b1N0cmluZygpICsgXCJOTlwiKTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGVzdENhc2VTdHJpbmcgKz0gdGVzdENhc2VbbF0gKyAnXFxuJztcbiAgICAgICAgICAgICAgICAgICAgICAgIG4gPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgbk1heCA9IHBhcnNlSW50KHRlc3RDYXNlW2xdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc2lkZUFycmF5QXJyYXkgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNob3VsZFByaW50KSB7IGNvbnNvbGUubG9nKFwiS0tLXCIgKyBrLnRvU3RyaW5nKCkgKyBcIktLS1wiKTsgfVxuICAgICAgICAgICAgICAgICAgICBpbnNpZGVBcnJheSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICArK2s7XG4gICAgICAgICAgICAgICAgICAgIC0tbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChzaG91bGRQcmludCkgeyBjb25zb2xlLmxvZyhcIk1NTU1cIiArIG0udG9TdHJpbmcoKSArIFwiTU1NTVwiKTsgfVxuICAgICAgICAgICAgICAgIHRlc3RDYXNlU3RyaW5nICs9IHRlc3RDYXNlW2xdICsgJ1xcbic7XG4gICAgICAgICAgICAgICAgbSA9IDA7XG4gICAgICAgICAgICAgICAgbU1heCA9IHBhcnNlSW50KHRlc3RDYXNlW2xdKTtcbiAgICAgICAgICAgICAgICBpbnNpZGVBcnJheSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHNob3VsZFByaW50KSB7IGNvbnNvbGUubG9nKFwiRU5EUFVURU5EUFVURU5EUFVURU5EUFVURU5EUFVURU5EUFVURU5EUFVURU5EUFVURU5EUFVUXCIpOyB9XG4gICAgaWYgKHNob3VsZFByaW50KSB7IGNvbnNvbGUubG9nKFwiREVCUFVUREVCUFVUREVCUFVUREVCUFVUREVCUFVUREVCUFVUREVCUFVUREVCUFVUREVCUFVUXCIpOyB9XG4gICAgaWYgKHNob3VsZFByaW50KSB7IGNvbnNvbGUubG9nKHRlc3RDYXNlU3RyaW5nKTsgfVxuICAgIGlmIChzaG91bGRQcmludCkgeyBjb25zb2xlLmxvZyhcIkZJTlBVVEZJTlBVVEZJTlBVVEZJTlBVVEZJTlBVVEZJTlBVVEZJTlBVVEZJTlBVVEZJTlBVVFwiKTsgfVxuICAgIHJldHVybiB0ZXN0Q2FzZVN0cmluZztcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVTdHViU3RyaW5nKGlucHV0Rm9ybWF0OiBzdHJpbmdbXSwgb3V0cHV0Rm9ybWF0OiBzdHJpbmdbXSwgZnVuY3Rpb25TaWduYXR1cmU6IHN0cmluZywgbm9ybWFsU3R1YjogYm9vbGVhbikge1xuICAgIGxldCBzdHViU3RyaW5nID0gJ1xcblxcbmltcG9ydCBzeXNcXG5cXG5pZiBfX25hbWVfXyA9PSBcIl9fbWFpbl9fXCI6XFxuJztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0Rm9ybWF0Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChpbnB1dEZvcm1hdFtpXSA9PSAnbicpIHtcbiAgICAgICAgICAgIHN0dWJTdHJpbmcgKz0gJyAgICBwJyArIGkudG9TdHJpbmcoKSArICcgPSBpbnQoaW5wdXQoKSlcXG4gICAgcHJpbnQoXCJHXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgIHByaW50KHAnICsgaS50b1N0cmluZygpICsgJywgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgcHJpbnQoXCJIXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuJztcbiAgICAgICAgfSBlbHNlIGlmIChpbnB1dEZvcm1hdFtpXSA9PSAnYScpIHtcbiAgICAgICAgICAgIHN0dWJTdHJpbmcgKz0gJyAgICBuJyArIGkudG9TdHJpbmcoKSArICcgPSBpbnQoaW5wdXQoKSlcXG4gICAgcHJpbnQoXCJHXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgIHByaW50KG4nICsgaS50b1N0cmluZygpICsgJywgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgcHJpbnQoXCJIXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgIHAnICsgaS50b1N0cmluZygpICsgJyA9IFtdXFxuICAgIGZvciBpIGluIHJhbmdlKG4nICsgaS50b1N0cmluZygpICsgJyk6XFxuICAgICAgICBnaCA9IGludChpbnB1dCgpKVxcbiAgICAgICAgcHJpbnQoXCJHXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgICAgICBwcmludChnaCwgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgICAgIHByaW50KFwiSFwiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICAgICAgcCcgKyBpLnRvU3RyaW5nKCkgKyAnLmFwcGVuZChnaClcXG4nO1xuICAgICAgICB9IGVsc2UgaWYgKGlucHV0Rm9ybWF0W2ldID09ICdhYScpIHtcbiAgICAgICAgICAgIHN0dWJTdHJpbmcgKz0gJyAgICBuJyArIGkudG9TdHJpbmcoKSArICcgPSBpbnQoaW5wdXQoKSlcXG4gICAgcCcgKyBpLnRvU3RyaW5nKCkgKyAnID0gW11cXG4gICAgZm9yIGkgaW4gcmFuZ2UobicgKyBpLnRvU3RyaW5nKCkgKyAnKTpcXG4gICAgICAgIG5uJyArIGkudG9TdHJpbmcoKSArICcgPSBpbnQoaW5wdXQoKSlcXG4gICAgICAgIHBwJyArIGkudG9TdHJpbmcoKSArICcgPSBbXVxcbiAgICAgICAgZm9yIGogaW4gcmFuZ2Uobm4nICsgaS50b1N0cmluZygpICsgJyk6XFxuICAgICAgICAgICAgcHAnICsgaS50b1N0cmluZygpICsgJy5hcHBlbmQoaW50KGlucHV0KCkpKVxcbiAgICAgICAgcCcgKyBpLnRvU3RyaW5nKCkgKyAnLmFwcGVuZChwcCcgKyBpLnRvU3RyaW5nKCkgKyAnKVxcbic7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3R1YlN0cmluZyArPSAnICAgIHJlc3VsdCA9ICcgKyBmdW5jdGlvblNpZ25hdHVyZS5zcGxpdCgnKCcpWzBdLnNwbGl0KCdkZWYgJylbMV0gKyAnKCc7XG4gICAgaWYgKGlucHV0Rm9ybWF0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgc3R1YlN0cmluZyArPSAncDAnO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IGlucHV0Rm9ybWF0Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHN0dWJTdHJpbmcgKz0gJywgcCcgKyBpLnRvU3RyaW5nKClcbiAgICB9XG4gICAgc3R1YlN0cmluZyArPSAnKVxcbic7XG4gICAgaWYgKG5vcm1hbFN0dWIpIHtcbiAgICAgICAgc3R1YlN0cmluZyArPSAnICAgIHByaW50KFwidjEwemc1N1pJVUY2dmpaZ1NQYURZNzBUUWZmOHdUSFhnb2RYMm90ckRNRWF5MFdsUzM2TWpEaEhIMDU0dVJyRnhHSEhTZWd2R2NBN2VhcUJcIilcXG4nXG4gICAgICAgIGlmIChvdXRwdXRGb3JtYXQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgaWYgKG91dHB1dEZvcm1hdFswXSA9PSAnbicpIHtcbiAgICAgICAgICAgICAgICBzdHViU3RyaW5nICs9ICcgICAgcHJpbnQocmVzdWx0KVxcbic7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG91dHB1dEZvcm1hdFswXSA9PSAnYScpIHtcbiAgICAgICAgICAgICAgICBzdHViU3RyaW5nICs9ICcgICAgcHJpbnQobGVuKHJlc3VsdCkpXFxuICAgIGZvciByIGluIHJlc3VsdDpcXG4gICAgICAgIHByaW50KHIpXFxuJztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAob3V0cHV0Rm9ybWF0WzBdID09ICdhYScpIHtcbiAgICAgICAgICAgICAgICBzdHViU3RyaW5nICs9ICcgICAgcHJpbnQobGVuKHJlc3VsdCkpXFxuICAgIGZvciByIGluIHJlc3VsdDpcXG4gICAgICAgIHByaW50KGxlbihyKSlcXG4gICAgICAgIGZvciByciBpbiByOlxcbiAgICAgICAgICAgIHByaW50KHJyKVxcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHN0dWJTdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlQ2xlYW5TdHJpbmcob3V0cHV0Rm9ybWF0OiBzdHJpbmdbXSwgbm9ybWFsQ2xlYW46IGJvb2xlYW4pIHtcbiAgICBsZXQgY2xlYW5TdHJpbmcgPSAnJztcbiAgICBpZiAob3V0cHV0Rm9ybWF0WzBdICE9ICdhYScpIHtcbiAgICAgICAgY2xlYW5TdHJpbmcgKz0gJ2ltcG9ydCBzeXNcXG5cXG5pZiBfX25hbWVfXyA9PSBcIl9fbWFpbl9fXCI6XFxuJztcbiAgICB9IGVsc2Uge1xuICAgICAgICBjbGVhblN0cmluZyArPSAnaW1wb3J0IHN5c1xcbmltcG9ydCBmdW5jdG9vbHNcXG5cXG5kZWYgY29tcGFyZU5ucyh4LCB5KTpcXG4gICAgaWYgeFswXSA+IHlbMF06XFxuICAgICAgICByZXR1cm4gMVxcbiAgICBlbGlmIHhbMF0gPCB5WzBdOlxcbiAgICAgICAgcmV0dXJuIC0xXFxuICAgIGVsc2U6XFxuICAgICAgICBmb3IgaSBpbiByYW5nZSh4WzBdKTpcXG4gICAgICAgICAgICBpZiB4WzFdW2ldID4geVsxXVtpXTpcXG4gICAgICAgICAgICAgICAgcmV0dXJuIDFcXG4gICAgICAgICAgICBpZiB4WzFdW2ldIDwgeVsxXVtpXTpcXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xXFxuICAgIHJldHVybiAwXFxuXFxuaWYgX19uYW1lX18gPT0gXCJfX21haW5fX1wiOlxcbic7XG4gICAgfVxuICAgIGlmIChub3JtYWxDbGVhbikge1xuICAgICAgICBjbGVhblN0cmluZyArPSAnICAgIHdoaWxlIFRydWU6XFxuICAgICAgICB0cnlJbnB1dCA9IGlucHV0KClcXG4gICAgICAgIHByaW50KFwiT0tcIiwgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgICAgIHByaW50KHRyeUlucHV0LCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICAgICAgcHJpbnQoXCJQTFwiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICAgICAgaWYgKHRyeUlucHV0ID09IFwidjEwemc1N1pJVUY2dmpaZ1NQYURZNzBUUWZmOHdUSFhnb2RYMm90ckRNRWF5MFdsUzM2TWpEaEhIMDU0dVJyRnhHSEhTZWd2R2NBN2VhcUJcIik6XFxuICAgICAgICAgICAgYnJlYWtcXG4nO1xuICAgIH1cbiAgICBpZiAob3V0cHV0Rm9ybWF0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgaWYgKG91dHB1dEZvcm1hdFswXSA9PSAnbicpIHtcbiAgICAgICAgICAgIGNsZWFuU3RyaW5nICs9ICcgICAgcXcgPSBpbnB1dCgpXFxuICAgIHByaW50KFwiUVwiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICBwcmludChxdywgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgcHJpbnQoXCJXXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgIHByaW50KHF3KVxcbic7XG4gICAgICAgIH0gZWxzZSBpZiAob3V0cHV0Rm9ybWF0WzBdID09ICdhJykge1xuICAgICAgICAgICAgY2xlYW5TdHJpbmcgKz0gJyAgICBuID0gaW50KGlucHV0KCkpXFxuICAgIHByaW50KFwiUVwiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICBwcmludChuLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICBwcmludChcIldcIiwgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgbnVtcyA9IFtdXFxuICAgIGZvciBpIGluIHJhbmdlKG4pOlxcbiAgICAgICAgcXcgPSBpbnQoaW5wdXQoKSlcXG4gICAgICAgIHByaW50KFwiUVwiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICAgICAgcHJpbnQocXcsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgICAgICBwcmludChcIldcIiwgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgICAgIG51bXMuYXBwZW5kKHF3KVxcbiAgICBudW1zLnNvcnQoKVxcbiAgICBwcmludChuKVxcbiAgICBmb3IgaSBpbiByYW5nZShuKTpcXG4gICAgICAgIHByaW50KG51bXNbaV0pJztcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRGb3JtYXRbMF0gPT0gJ2FhJykge1xuICAgICAgICAgICAgY2xlYW5TdHJpbmcgKz0gJyAgICBuID0gaW50KGlucHV0KCkpXFxuICAgIHByaW50KFwiUVwiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICBwcmludChuLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICBwcmludChcIldcIiwgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgbm5zID0gW11cXG4gICAgbnVtcyA9IFtdXFxuICAgIGZvciBpIGluIHJhbmdlKG4pOlxcbiAgICAgICAgbm4gPSBpbnQoaW5wdXQoKSlcXG4gICAgICAgIHByaW50KFwiUVwiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICAgICAgcHJpbnQobm4sIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgICAgICBwcmludChcIldcIiwgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgICAgIG5ucyA9IG5ucy5jb3B5KClcXG4gICAgICAgIG5ucyA9IFtdXFxuICAgICAgICBubnMuYXBwZW5kKG5uKVxcbiAgICAgICAgbm51bXMgPSBbXVxcbiAgICAgICAgZm9yIGogaW4gcmFuZ2Uobm4pOlxcbiAgICAgICAgICAgIHF3ID0gaW50KGlucHV0KCkpXFxuICAgICAgICAgICAgcHJpbnQoXCJRXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgICAgICAgICAgcHJpbnQocXcsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgICAgICAgICAgcHJpbnQoXCJXXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgICAgICAgICAgbm51bXMuYXBwZW5kKHF3KVxcbiAgICAgICAgbm51bXMuc29ydCgpXFxuICAgICAgICBubnMuYXBwZW5kKG5udW1zKVxcbiAgICAgICAgbnVtcy5hcHBlbmQobm5zKVxcbiAgICBudW1zLnNvcnQoa2V5ID0gZnVuY3Rvb2xzLmNtcF90b19rZXkoY29tcGFyZU5ucykpXFxuICAgIHByaW50KG4pXFxuICAgIGZvciBpIGluIHJhbmdlKG4pOlxcbiAgICAgICAgcHJpbnQobnVtc1tpXVswXSlcXG4gICAgICAgIGZvciBqIGluIHJhbmdlKGxlbihudW1zW2ldWzFdKSk6XFxuICAgICAgICAgICAgcHJpbnQobnVtc1tpXVsxXVtqXSlcXG4nO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjbGVhblN0cmluZztcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVNYWtlUmVwb3J0U3RyaW5nKGk6IG51bWJlcikge1xuICAgIC8vcmV0dXJuICcjIS9iaW4vYmFzaFxcblxcbihjYXQgc3R1Yi5weSkgPj4gYW5zd2VyLnB5XFxuKGNhdCBzdHViQ3VzdG9tSW5wdXQucHkpID4+IGFuc3dlckN1c3RvbUlucHV0LnB5XFxuXFxuY29udGFpbmVySUQ9JChkb2NrZXIgcnVuIC1kaXQgcHktc2FuZGJveClcXG5kb2NrZXIgY3AgVGVzdElucHV0cy8gJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvVGVzdElucHV0cy9cXG5kb2NrZXIgY3AgVGVzdE91dHB1dHMvICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L1Rlc3RPdXRwdXRzL1xcbmRvY2tlciBjcCBhbnN3ZXIucHkgJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvYW5zd2VyLnB5XFxuZG9ja2VyIGNwIGN1c3RvbUlucHV0LmluICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L2N1c3RvbUlucHV0LmluXFxuZG9ja2VyIGNwIGFuc3dlckN1c3RvbUlucHV0LnB5ICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L2Fuc3dlckN1c3RvbUlucHV0LnB5XFxuZG9ja2VyIGNwIGNsZWFuLnB5ICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L2NsZWFuLnB5XFxuXFxuZG9ja2VyIGV4ZWMgJHtjb250YWluZXJJRH0gc2ggLWMgXCJjZCBob21lL1Rlc3RFbnZpcm9ubWVudC8gJiYgdGltZW91dCAxMCAuL21ha2VSZXBvcnQuc2hcIlxcblxcbmRvY2tlciBjcCAke2NvbnRhaW5lcklEfTpob21lL1Rlc3RFbnZpcm9ubWVudC9yZXBvcnQudHh0IHJlcG9ydEZyb21QeVNhbmRib3gudHh0XFxuZG9ja2VyIGNwICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L3N0YW5kYXJkT3V0cHV0LnR4dCBzdGFuZGFyZE91dHB1dEZyb21QeVNhbmRib3gudHh0XFxuZG9ja2VyIGNwICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L291dHB1dC50eHQgb3V0cHV0RnJvbVB5U2FuZGJveC50eHRcXG5cXG5kb2NrZXIga2lsbCAke2NvbnRhaW5lcklEfVxcblxcbmRvY2tlciBybSAke2NvbnRhaW5lcklEfVxcblxcbic7XG4gICAgcmV0dXJuICcjIS9iaW4vYmFzaFxcblxcbihjYXQgc3R1Yi5weSkgPj4gLi4vYW5zd2VyLnB5XFxuKGNhdCBzdHViQ3VzdG9tSW5wdXQucHkpID4+IC4uL2Fuc3dlckN1c3RvbUlucHV0LnB5XFxuXFxuY29udGFpbmVySUQ9JChkb2NrZXIgcnVuIC1kaXQgcHktc2FuZGJveClcXG5kb2NrZXIgY3AgVGVzdElucHV0cy8gJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvVGVzdElucHV0cy9cXG5kb2NrZXIgY3AgVGVzdE91dHB1dHMvICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L1Rlc3RPdXRwdXRzL1xcbmRvY2tlciBjcCAuLi9hbnN3ZXIucHkgJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvYW5zd2VyLnB5XFxuZG9ja2VyIGNwIC4uL2N1c3RvbUlucHV0LmluICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L2N1c3RvbUlucHV0LmluXFxuZG9ja2VyIGNwIC4uL2Fuc3dlckN1c3RvbUlucHV0LnB5ICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L2Fuc3dlckN1c3RvbUlucHV0LnB5XFxuZG9ja2VyIGNwIGNsZWFuLnB5ICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L2NsZWFuLnB5XFxuZG9ja2VyIGNwIGNsZWFuT3V0cHV0LnB5ICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L2NsZWFuT3V0cHV0LnB5XFxuXFxuZG9ja2VyIGV4ZWMgJHtjb250YWluZXJJRH0gc2ggLWMgXCJjZCBob21lL1Rlc3RFbnZpcm9ubWVudC8gJiYgdGltZW91dCAxMCAuL21ha2VSZXBvcnQuc2hcIlxcblxcbmRvY2tlciBjcCAke2NvbnRhaW5lcklEfTpob21lL1Rlc3RFbnZpcm9ubWVudC9yZXBvcnQudHh0IC4uL3JlcG9ydEZyb21QeVNhbmRib3gudHh0XFxuZG9ja2VyIGNwICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L3N0YW5kYXJkT3V0cHV0LnR4dCAuLi9zdGFuZGFyZE91dHB1dEZyb21QeVNhbmRib3gudHh0XFxuZG9ja2VyIGNwICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L291dHB1dC50eHQgLi4vb3V0cHV0RnJvbVB5U2FuZGJveC50eHRcXG5cXG5kb2NrZXIga2lsbCAke2NvbnRhaW5lcklEfVxcblxcbmRvY2tlciBybSAke2NvbnRhaW5lcklEfVxcblxcbic7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGxvYWRUZXN0Q2FzZXMoKSB7XG4gICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICBjb25zdCBxdWVzdGlvbnNSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBjb3VudCgqKSBmcm9tIHF1ZXN0aW9uc1wiKTtcbiAgICBsZXQgbnVtUXVlc3Rpb25zID0gTnVtYmVyKHF1ZXN0aW9uc1Jlc3VsdC5yb3dzWzBdWzBdIGFzIG51bWJlcik7XG4gICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDE7IGkgPD0gbnVtUXVlc3Rpb25zOyArK2kpIHtcbiAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBmdW5jdGlvbl9zaWduYXR1cmUsIGlucHV0X291dHB1dF9mb3JtYXQsIHRlc3RfY2FzZXMgZnJvbSBxdWVzdGlvbnMgd2hlcmUgaWQgPSBcIiArIGkudG9TdHJpbmcoKSk7XG4gICAgICAgIGxldCBmdW5jdGlvblNpZ25hdHVyZTogc3RyaW5nID0gc2VsZWN0ZWRSZXN1bHQucm93c1swXVswXSBhcyBzdHJpbmc7XG4gICAgICAgIGxldCBpbnB1dE91dHB1dEZvcm1hdCA9IHNlbGVjdGVkUmVzdWx0LnJvd3NbMF1bMV0gYXMgc3RyaW5nO1xuICAgICAgICBsZXQgdGVzdENhc2VzID0gc2VsZWN0ZWRSZXN1bHQucm93c1swXVsyXSBhcyBzdHJpbmc7XG4gICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgbGV0IGlucHV0T3V0cHV0Rm9ybWF0cyA9IGlucHV0T3V0cHV0Rm9ybWF0LnNwbGl0KCd8Jyk7XG4gICAgICAgIGxldCBpbnB1dEZvcm1hdDogc3RyaW5nW10gPSBpbnB1dE91dHB1dEZvcm1hdHNbMF0uc3BsaXQoJzsnKTtcbiAgICAgICAgaW5wdXRGb3JtYXQuc2hpZnQoKTtcbiAgICAgICAgbGV0IG91dHB1dEZvcm1hdDogc3RyaW5nW10gPSBpbnB1dE91dHB1dEZvcm1hdHNbMV0uc3BsaXQoJzsnKTtcbiAgICAgICAgb3V0cHV0Rm9ybWF0LnNoaWZ0KCk7XG4gICAgICAgIGxldCBhbGxUZXN0Q2FzZXM6IHN0cmluZ1tdID0gdGVzdENhc2VzLnNwbGl0KCd8Jyk7XG4gICAgICAgIGZvciAobGV0IGo6IG51bWJlciA9IDA7IGogPCBudW1UZXN0Q2FzZXM7ICsraikge1xuICAgICAgICAgICAgYXdhaXQgZW5zdXJlRGlyKFwiLi9zYW5kYm94L1wiICsgaS50b1N0cmluZygpICsgXCIvVGVzdElucHV0cy9cIik7XG4gICAgICAgICAgICBhd2FpdCBlbnN1cmVEaXIoXCIuL3NhbmRib3gvXCIgKyBpLnRvU3RyaW5nKCkgKyBcIi9UZXN0T3V0cHV0cy9cIik7XG4gICAgICAgICAgICBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoXCIuL3NhbmRib3gvXCIgKyBpLnRvU3RyaW5nKCkgKyBcIi9UZXN0SW5wdXRzL3Rlc3RcIiArIChqICsgMSkudG9TdHJpbmcoKSArIFwiLmluXCIsXG4gICAgICAgICAgICAgICAgZ2VuZXJhdGVUZXN0Q2FzZVN0cmluZyhhbGxUZXN0Q2FzZXMsIGlucHV0Rm9ybWF0LCBqLCAvKmkgPT0gMiAmJiBqID09IDAqL2ZhbHNlKSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHNlY29uZEhhbGZUaHJlc2hvbGQgPSAyICogbnVtVGVzdENhc2VzO1xuICAgICAgICBmb3IgKGxldCBqID0gMTE7IGogPCBzZWNvbmRIYWxmVGhyZXNob2xkOyArK2opIHtcbiAgICAgICAgICAgIGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZShcIi4vc2FuZGJveC9cIiArIGkudG9TdHJpbmcoKSArIFwiL1Rlc3RPdXRwdXRzL3Rlc3RcIiArIChqIC0gMTApLnRvU3RyaW5nKCkgKyBcIi5vdXRcIixcbiAgICAgICAgICAgICAgICBnZW5lcmF0ZVRlc3RDYXNlU3RyaW5nKGFsbFRlc3RDYXNlcywgb3V0cHV0Rm9ybWF0LCBqLCBmYWxzZSkpO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZShcIi4vc2FuZGJveC9cIiArIGkudG9TdHJpbmcoKSArIFwiL3N0dWIucHlcIiwgZ2VuZXJhdGVTdHViU3RyaW5nKGlucHV0Rm9ybWF0LCBvdXRwdXRGb3JtYXQsXG4gICAgICAgICAgICBmdW5jdGlvblNpZ25hdHVyZSwgdHJ1ZSkpO1xuICAgICAgICBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoXCIuL3NhbmRib3gvXCIgKyBpLnRvU3RyaW5nKCkgKyBcIi9zdHViQ3VzdG9tSW5wdXQucHlcIiwgZ2VuZXJhdGVTdHViU3RyaW5nKGlucHV0Rm9ybWF0LCBvdXRwdXRGb3JtYXQsXG4gICAgICAgICAgICBmdW5jdGlvblNpZ25hdHVyZSwgZmFsc2UpKTtcbiAgICAgICAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKFwiLi9zYW5kYm94L1wiICsgaS50b1N0cmluZygpICsgXCIvY2xlYW4ucHlcIiwgZ2VuZXJhdGVDbGVhblN0cmluZyhvdXRwdXRGb3JtYXQsIHRydWUpKTtcbiAgICAgICAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKFwiLi9zYW5kYm94L1wiICsgaS50b1N0cmluZygpICsgXCIvY2xlYW5PdXRwdXQucHlcIiwgZ2VuZXJhdGVDbGVhblN0cmluZyhvdXRwdXRGb3JtYXQsIGZhbHNlKSk7XG4gICAgICAgIGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZShcIi4vc2FuZGJveC9cIiArIGkudG9TdHJpbmcoKSArIFwiL21ha2VSZXBvcnQuc2hcIiwgZ2VuZXJhdGVNYWtlUmVwb3J0U3RyaW5nKGkpKTtcbiAgICAgICAgYXdhaXQgRGVuby5ydW4oe1xuICAgICAgICAgICAgY21kOiBbXCJjaG1vZFwiLCBcInUreFwiLCBcIm1ha2VSZXBvcnQuc2hcIl0sXG4gICAgICAgICAgICBjd2Q6IFwiLi9zYW5kYm94L1wiICsgaS50b1N0cmluZygpXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxubG9hZFRlc3RDYXNlcygpO1xuXG5mdW5jdGlvbiBkZWxheSh0aW1lOiBudW1iZXIpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHRpbWUpKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc2VsZWN0UXVlc3Rpb25zKG1hdGNobWFraW5nVXNlcjogTWF0Y2htYWtpbmdVc2VyKSB7XG4gICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICBjb25zdCBxdWVzdGlvbnNSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBjb3VudCgqKSBmcm9tIHF1ZXN0aW9uc1wiKTtcbiAgICBsZXQgbnVtUXVlc3Rpb25zID0gTnVtYmVyKHF1ZXN0aW9uc1Jlc3VsdC5yb3dzWzBdWzBdIGFzIG51bWJlcik7XG4gICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgIGxldCBxdWVzdGlvbnNTZWxlY3RlZDogbnVtYmVyW10gPSBbXTtcbiAgICBsZXQgcmFuZG9tUGVybXV0YXRpb246IG51bWJlcltdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1RdWVzdGlvbnM7ICsraSkge1xuICAgICAgICByYW5kb21QZXJtdXRhdGlvbltpXSA9IGk7XG4gICAgfVxuICAgIC8vIFBhcnRpYWwgRmlzaGVyLVlhdGVzIEFsZ29yaXRobSBmb3IgcmFuZG9tIHNlbGVjdGlvbiBvZiBxdWVzdGlvbnNcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVF1ZXN0aW9uc1Blck1hdGNoOyArK2kpIHtcbiAgICAgICAgbGV0IGogPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBudW1RdWVzdGlvbnMpO1xuICAgICAgICBbcmFuZG9tUGVybXV0YXRpb25baV0sIHJhbmRvbVBlcm11dGF0aW9uW2pdXSA9IFtyYW5kb21QZXJtdXRhdGlvbltqXSwgcmFuZG9tUGVybXV0YXRpb25baV1dO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVF1ZXN0aW9uc1Blck1hdGNoOyArK2kpIHtcbiAgICAgICAgLy9xdWVzdGlvbnNTZWxlY3RlZC5wdXNoKHJhbmRvbVBlcm11dGF0aW9uW2ldICsgMSk7XG4gICAgICAgIHF1ZXN0aW9uc1NlbGVjdGVkLnB1c2goMik7XG4gICAgfVxuICAgIGxldCBxdWVzdGlvbnNJbmZvcm1hdGlvbjogUXVlc3Rpb25JbmZvcm1hdGlvbltdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBxdWVzdGlvbnNTZWxlY3RlZC5sZW5ndGg7ICsraSkge1xuICAgICAgICBsZXQgaW5wdXRPdXRwdXRGb3JtYXQgPSAnJztcbiAgICAgICAgZm9yICg7Oykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlbGVjdGVkUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgaW5wdXRfb3V0cHV0X2Zvcm1hdCBmcm9tIHF1ZXN0aW9ucyB3aGVyZSBpZCA9IFwiXG4gICAgICAgICAgICAgICAgICAgICsgcXVlc3Rpb25zU2VsZWN0ZWRbaV0udG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSUlJcIik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocXVlc3Rpb25zU2VsZWN0ZWRbaV0udG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJRUVFcIik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coc2VsZWN0ZWRSZXN1bHQpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiV1dXXCIpO1xuICAgICAgICAgICAgICAgIGlucHV0T3V0cHV0Rm9ybWF0ID0gc2VsZWN0ZWRSZXN1bHQucm93c1swXVswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGlucHV0T3V0cHV0Rm9ybWF0cyA9IGlucHV0T3V0cHV0Rm9ybWF0LnNwbGl0KCd8Jyk7XG4gICAgICAgIGxldCBpbnB1dEZvcm1hdDogc3RyaW5nW10gPSBpbnB1dE91dHB1dEZvcm1hdHNbMF0uc3BsaXQoJzsnKTtcbiAgICAgICAgaW5wdXRGb3JtYXQuc2hpZnQoKTtcbiAgICAgICAgbGV0IG91dHB1dEZvcm1hdDogc3RyaW5nW10gPSBpbnB1dE91dHB1dEZvcm1hdHNbMV0uc3BsaXQoJzsnKTtcbiAgICAgICAgb3V0cHV0Rm9ybWF0LnNoaWZ0KCk7XG4gICAgICAgIGxldCBxdWVzdGlvbkluZm9ybWF0aW9uOiBRdWVzdGlvbkluZm9ybWF0aW9uID0geyBxdWVzdGlvbklkOiBxdWVzdGlvbnNTZWxlY3RlZFtpXSwgaW5wdXRGb3JtYXQ6IGlucHV0Rm9ybWF0LCBvdXRwdXRGb3JtYXQ6IG91dHB1dEZvcm1hdCB9O1xuICAgICAgICBxdWVzdGlvbnNJbmZvcm1hdGlvbi5wdXNoKHF1ZXN0aW9uSW5mb3JtYXRpb24pO1xuICAgIH1cbiAgICBzaWRzUXVlc3Rpb25zW21hdGNobWFraW5nVXNlci5zaWRdID0gcXVlc3Rpb25zSW5mb3JtYXRpb247XG4gICAgc2lkc1F1ZXN0aW9uc1ttYXRjaGVzW21hdGNobWFraW5nVXNlci5zaWRdXSA9IHF1ZXN0aW9uc0luZm9ybWF0aW9uO1xufVxuXG5hc3luYyBmdW5jdGlvbiBhZGRUb1F1ZXVlIChxdWV1ZTogTWF0Y2htYWtpbmdVc2VyW10sIG1hdGNobWFraW5nVXNlcjogTWF0Y2htYWtpbmdVc2VyLCByYW5nZTogbnVtYmVyLCBjb250ZXh0OiBhbnkpIHtcbiAgICBxdWV1ZS5wdXNoKG1hdGNobWFraW5nVXNlcik7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBxdWV1ZS5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAocXVldWVbaV0uc2lkICE9IG1hdGNobWFraW5nVXNlci5zaWRcbiAgICAgICAgICAgICAgICAmJiBNYXRoLmFicyhtYXRjaG1ha2luZ1VzZXIuZWxvUmF0aW5nIC0gcXVldWVbaV0uZWxvUmF0aW5nKSA8PSByYW5nZSkge1xuICAgICAgICAgICAgbWF0Y2hlc1txdWV1ZVtpXS5zaWRdID0gbWF0Y2htYWtpbmdVc2VyLnNpZDtcbiAgICAgICAgICAgIG1hdGNoZXNbbWF0Y2htYWtpbmdVc2VyLnNpZF0gPSBxdWV1ZVtpXS5zaWQ7XG4gICAgICAgICAgICBzaWRzUHJvZ3Jlc3NbcXVldWVbaV0uc2lkXSA9IDA7XG4gICAgICAgICAgICBzaWRzUHJvZ3Jlc3NbbWF0Y2htYWtpbmdVc2VyLnNpZF0gPSAwO1xuICAgICAgICAgICAgLy9jYW4gY2FsbCBnb1NlcnZlci9yZWdpc3RlclBhaXIgaGVyZVxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJhdHRlbXB0aW5nIHJlZ2lzdGVyIHBhaXIgXCIgKyBtYXRjaG1ha2luZ1VzZXIuc2lkICsgXCIsIFwiICsgcXVldWVbaV0uc2lkKVxuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChyZWdpc3RlclBhaXJFbmRQb2ludCgpLCB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICAgIElkMTogbWF0Y2htYWtpbmdVc2VyLnNpZCxcbiAgICAgICAgICAgICAgICAgICAgSWQyOiBxdWV1ZVtpXS5zaWQsXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICB9KTsgLy9UT0RPIC0gQ2hlY2sgcmVzcG9uc2UgXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZS5zdGF0dXMpO1xuICAgICAgICAgICAgLy9jYW4gcHJvYmFibHkgZWxpbWluYXRlIHRoaXMsIG1haW4gcHVycG9zZSBvZiB0aGlzIGFwaVxuICAgICAgICAgICAgLy9tZXRob2QgaXMgdG8gbWF0Y2ggdXNlcnMgYW5kIHJlZ2lzdGVyIHRoZW0gd2l0aCB0aGUgZ28gc2VydmVyXG4gICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7XG4gICAgICAgICAgICAgICAgdXNlcm5hbWU6IHNpZHNbbWF0Y2htYWtpbmdVc2VyLnNpZF0sXG4gICAgICAgICAgICAgICAgZWxvUmF0aW5nOiBtYXRjaG1ha2luZ1VzZXIuZWxvUmF0aW5nLFxuICAgICAgICAgICAgICAgIG9wcG9uZW50VXNlcm5hbWU6IHNpZHNbcXVldWVbaV0uc2lkXSxcbiAgICAgICAgICAgICAgICBvcHBvbmVudEVsb1JhdGluZzogcXVldWVbaV0uZWxvUmF0aW5nLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHF1ZXVlLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIHF1ZXVlLnBvcCgpO1xuICAgICAgICAgICAgc2VsZWN0UXVlc3Rpb25zKG1hdGNobWFraW5nVXNlcik7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNoZWNrSWZGb3VuZEluUXVldWUoZGVsYXlUaW1lOiBudW1iZXIsIG1hdGNobWFraW5nVXNlcjogTWF0Y2htYWtpbmdVc2VyLCB1c2VybmFtZTogc3RyaW5nLCBjb250ZXh0OiBhbnkpIHtcbiAgICBhd2FpdCBkZWxheShkZWxheVRpbWUpO1xuICAgIGlmIChtYXRjaG1ha2luZ1VzZXIuc2lkIGluIG1hdGNoZXMpIHtcbiAgICAgICAgbGV0IG9wcG9uZW50VXNlcm5hbWUgPSBzaWRzW21hdGNoZXNbbWF0Y2htYWtpbmdVc2VyLnNpZF1dO1xuICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IGVsb19yYXRpbmcgZnJvbSB1c2VycyB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICsgdXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgIGxldCBvcHBvbmVudEVsb1JhdGluZyA9IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMF0gYXMgbnVtYmVyO1xuICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHtcbiAgICAgICAgICAgIHVzZXJuYW1lOiBzaWRzW21hdGNobWFraW5nVXNlci5zaWRdLFxuICAgICAgICAgICAgZWxvUmF0aW5nOiBtYXRjaG1ha2luZ1VzZXIuZWxvUmF0aW5nLFxuICAgICAgICAgICAgb3Bwb25lbnRVc2VybmFtZTogb3Bwb25lbnRVc2VybmFtZSxcbiAgICAgICAgICAgIG9wcG9uZW50RWxvUmF0aW5nOiBvcHBvbmVudEVsb1JhdGluZyxcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRnJvbVF1ZXVlKHF1ZXVlOiBNYXRjaG1ha2luZ1VzZXJbXSwgc2lkOiBzdHJpbmcpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHF1ZXVlLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChxdWV1ZVtpXS5zaWQgPT09IHNpZCkge1xuICAgICAgICAgICAgcXVldWUuc3BsaWNlKGksIDEpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5jb25zdCBwb3J0OiBudW1iZXIgPSArZW52LkxJQ09ERV9QT1JUIHx8IDMwMDA7XG5hcHAuYWRkRXZlbnRMaXN0ZW5lcihcImVycm9yXCIsIChldnQpID0+IHtcbiAgICBjb25zb2xlLmxvZyhldnQuZXJyb3IpO1xufSk7XG5yb3V0ZXJcbiAgICAuZ2V0KFwiL2FwaS9oZWxsby13b3JsZFwiLCAoY29udGV4dCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0gaGVsbG9Xb3JsZFZhcjtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAucG9zdChcIi9hcGkvcG9zdC1oZWxsby13b3JsZFwiLCBhc3luYyAoY29udGV4dDogUm91dGVyQ29udGV4dDxhbnk+KSA9PiB7XG4gICAgICAgIGlmICghY29udGV4dC5yZXF1ZXN0Lmhhc0JvZHkpIHtcbiAgICAgICAgICAgIGNvbnRleHQudGhyb3coU3RhdHVzLkJhZFJlcXVlc3QsIFwiQmFkIFJlcXVlc3RcIik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYm9keSA9IGNvbnRleHQucmVxdWVzdC5ib2R5KCk7XG4gICAgICAgIGxldCBoZWxsb1dvcmxkOiBQYXJ0aWFsPEhlbGxvV29ybGQ+IHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAoYm9keS50eXBlID09PSBcImpzb25cIikge1xuICAgICAgICAgICAgaGVsbG9Xb3JsZCA9IGF3YWl0IGJvZHkudmFsdWU7XG4gICAgICAgIH0gZWxzZSBpZiAoYm9keS50eXBlID09PSBcImZvcm1cIikge1xuICAgICAgICAgICAgaGVsbG9Xb3JsZCA9IHt9O1xuICAgICAgICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgYXdhaXQgYm9keS52YWx1ZSkge1xuICAgICAgICAgICAgICAgIGhlbGxvV29ybGRba2V5IGFzIGtleW9mIEhlbGxvV29ybGRdID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoYm9keS50eXBlID09PSBcImZvcm0tZGF0YVwiKSB7XG4gICAgICAgICAgICBjb25zdCBmb3JtRGF0YSA9IGF3YWl0IGJvZHkudmFsdWUucmVhZCgpO1xuICAgICAgICAgICAgaGVsbG9Xb3JsZCA9IGZvcm1EYXRhLmZpZWxkcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoaGVsbG9Xb3JsZCkge1xuICAgICAgICAgICAgY29udGV4dC5hc3NlcnQodHlwZW9mIGhlbGxvV29ybGQudGV4dCA9PT0gXCJzdHJpbmdcIiwgU3RhdHVzLkJhZFJlcXVlc3QpO1xuICAgICAgICAgICAgaGVsbG9Xb3JsZFZhciA9IGhlbGxvV29ybGQgYXMgSGVsbG9Xb3JsZDtcbiAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2Uuc3RhdHVzID0gU3RhdHVzLk9LO1xuICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0gaGVsbG9Xb3JsZDtcbiAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UudHlwZSA9IFwianNvblwiO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRleHQudGhyb3coU3RhdHVzLkJhZFJlcXVlc3QsIFwiQmFkIFJlcXVlc3RcIik7XG4gICAgfSlcbiAgICAucG9zdChcIi9hcGkvcmVnaXN0ZXJcIiwgYXN5bmMgKGNvbnRleHQ6IFJvdXRlckNvbnRleHQ8YW55PikgPT4ge1xuICAgICAgICBsZXQgc2lkID0gYXdhaXQgY29udGV4dC5jb29raWVzLmdldCgnc2lkJyk7XG4gICAgICAgIGlmICghc2lkKSB7XG4gICAgICAgICAgICBzaWQgPSBhd2FpdCBuYW5vaWQoNDApO1xuICAgICAgICAgICAgY29udGV4dC5jb29raWVzLnNldCgnc2lkJywgc2lkKTtcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKCFjb250ZXh0LnJlcXVlc3QuaGFzQm9keSkge1xuICAgICAgICAgICAgICAgIGNvbnRleHQudGhyb3coU3RhdHVzLkJhZFJlcXVlc3QsIFwiQmFkIFJlcXVlc3RcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gY29udGV4dC5yZXF1ZXN0LmJvZHkoKTtcbiAgICAgICAgICAgIGxldCB1c2VyOiBQYXJ0aWFsPFVzZXI+IHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgaWYgKGJvZHkudHlwZSA9PT0gXCJqc29uXCIpIHtcbiAgICAgICAgICAgICAgICB1c2VyID0gYXdhaXQgYm9keS52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgY29udGV4dC5hc3NlcnQoXG4gICAgICAgICAgICAgICAgICAgIHR5cGVvZiB1c2VyPy5lbWFpbD8udmFsdWUgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIHVzZXI/LnVzZXJuYW1lPy52YWx1ZSA9PT0gXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgdXNlcj8ucGFzc3dvcmQ/LnZhbHVlID09PSBcInN0cmluZ1wiLCBTdGF0dXMuQmFkUmVxdWVzdCk7XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5zdGF0dXMgPSBTdGF0dXMuT0s7XG4gICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IHVzZXJuYW1lIGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICAgICAgICAgICsgdXNlcj8udXNlcm5hbWU/LnZhbHVlICsgXCInXCIpO1xuICAgICAgICAgICAgICAgIGlmICh1c2VybmFtZVJlc3VsdC5yb3dzLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZW1haWxSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBlbWFpbCBmcm9tIHVzZXJzIHdoZXJlIGVtYWlsPSdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKyB1c2VyPy5lbWFpbD8udmFsdWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbWFpbFJlc3VsdC5yb3dzLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzYWx0SGV4U3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDMyOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYWx0SGV4U3RyaW5nICs9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIE1hdGgucG93KDIsIDMyKSkudG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNhbHRIZXhTdHJpbmdMZW5ndGggPSBzYWx0SGV4U3RyaW5nLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMjU2IC0gc2FsdEhleFN0cmluZ0xlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2FsdEhleFN0cmluZyA9IFwiMFwiICsgc2FsdEhleFN0cmluZztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0ZXh0RW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGhhc2hlZFBhc3N3b3JkVWludDhBcnJheSA9IG5ldyBVaW50OEFycmF5KGF3YWl0IGNyeXB0by5zdWJ0bGUuZGlnZXN0KCdTSEEzLTUxMicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dEVuY29kZXIuZW5jb2RlKHVzZXI/LnBhc3N3b3JkPy52YWx1ZSArIHNhbHRIZXhTdHJpbmcpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgKz0gKGhhc2hlZFBhc3N3b3JkVWludDhBcnJheVtpXSA8IDE2ID8gXCIwXCIgOiBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIGhhc2hlZFBhc3N3b3JkVWludDhBcnJheVtpXS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmdMZW5ndGggPSBoYXNoZWRQYXNzd29yZEhleFN0cmluZy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEyOCAtIGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nTGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNoZWRQYXNzd29yZEhleFN0cmluZyA9IFwiMFwiICsgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImluc2VydCBpbnRvIHB1YmxpYy51c2VycyhlbWFpbCwgdXNlcm5hbWUsIGhhc2hlZF9wYXNzd29yZCwgc2FsdCwgbnVtX3dpbnMsIG51bV9sb3NzZXMsIGNyZWF0ZWRfYXQsIHVwZGF0ZWRfYXQsIGVsb19yYXRpbmcsIGhhc18yNDAwX3JhdGluZ19oaXN0b3J5KVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBcIiB2YWx1ZXMgKCdcIiArIHVzZXI/LmVtYWlsPy52YWx1ZSArIFwiJywgJ1wiICsgdXNlcj8udXNlcm5hbWU/LnZhbHVlICsgXCInLCAnXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiXFxcXHhcIiArIGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nICsgXCInLCAnXCIgKyBcIlxcXFx4XCIgKyBzYWx0SGV4U3RyaW5nICsgXCInLCAnMCcsICcwJywgbm93KCksIG5vdygpLCAnMTAwMCcsICdmYWxzZScpXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNpZCA9IGF3YWl0IG5hbm9pZCg0MCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaWRzW3NpZF0gPSB1c2VyLnVzZXJuYW1lLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY29udGV4dC5jb29raWVzLnNldCgnc2lkJywgc2lkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHVzZXI7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7IHRleHQ6ICdHaXZlbiBFbWFpbCBBbHJlYWR5IEV4aXN0cycgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHsgdGV4dDogJ0dpdmVuIFVzZXJuYW1lIEFscmVhZHkgRXhpc3RzJyB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS50eXBlID0gXCJqc29uXCI7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGV4dC50aHJvdyhTdGF0dXMuQmFkUmVxdWVzdCwgXCJCYWQgUmVxdWVzdFwiKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAucG9zdChcIi9hcGkvbG9naW5cIiwgYXN5bmMgKGNvbnRleHQ6IFJvdXRlckNvbnRleHQ8YW55PikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKCFjb250ZXh0LnJlcXVlc3QuaGFzQm9keSkge1xuICAgICAgICAgICAgICAgIGNvbnRleHQudGhyb3coU3RhdHVzLkJhZFJlcXVlc3QsIFwiQmFkIFJlcXVlc3RcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gY29udGV4dC5yZXF1ZXN0LmJvZHkoKTtcbiAgICAgICAgICAgIGxldCB1c2VyOiBQYXJ0aWFsPFVzZXI+IHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgaWYgKGJvZHkudHlwZSA9PT0gXCJqc29uXCIpIHtcbiAgICAgICAgICAgICAgICB1c2VyID0gYXdhaXQgYm9keS52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgY29udGV4dC5hc3NlcnQoXG4gICAgICAgICAgICAgICAgICAgIHR5cGVvZiB1c2VyPy5lbWFpbD8udmFsdWUgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIHVzZXI/LnBhc3N3b3JkPy52YWx1ZSA9PT0gXCJzdHJpbmdcIiwgU3RhdHVzLkJhZFJlcXVlc3QpO1xuICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2Uuc3RhdHVzID0gU3RhdHVzLk9LO1xuICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgdXNlcm5hbWVSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBlbWFpbCwgdXNlcm5hbWUsIGhhc2hlZF9wYXNzd29yZCwgc2FsdCBmcm9tIHVzZXJzIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgICAgICAgICArIHVzZXI/LmVtYWlsPy52YWx1ZSArIFwiJ1wiKTtcbiAgICAgICAgICAgICAgICBpZiAodXNlcm5hbWVSZXN1bHQucm93cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVtYWlsUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgZW1haWwsIHVzZXJuYW1lLCBoYXNoZWRfcGFzc3dvcmQsIHNhbHQgZnJvbSB1c2VycyB3aGVyZSBlbWFpbD0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgdXNlcj8uZW1haWw/LnZhbHVlICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZW1haWxSZXN1bHQucm93cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7IHRleHQ6ICdHaXZlbiBFbWFpbCBvciBVc2VybmFtZSBEb2VzIE5vdCBFeGlzdCcgfTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzYWx0SGV4U3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IChlbWFpbFJlc3VsdC5yb3dzWzBdWzNdIGFzIFVpbnQ4QXJyYXkpLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2FsdEhleFN0cmluZyArPSAoKGVtYWlsUmVzdWx0LnJvd3NbMF1bM10gYXMgVWludDhBcnJheSlbaV0gPCAxNiA/IFwiMFwiIDogXCJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAoZW1haWxSZXN1bHQucm93c1swXVszXSBhcyBVaW50OEFycmF5KVtpXS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdGV4dEVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXkgPSBuZXcgVWludDhBcnJheShhd2FpdCBjcnlwdG8uc3VidGxlLmRpZ2VzdCgnU0hBMy01MTInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRFbmNvZGVyLmVuY29kZSh1c2VyPy5wYXNzd29yZD8udmFsdWUgKyBzYWx0SGV4U3RyaW5nKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhhc2hlZFBhc3N3b3JkVWludDhBcnJheS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nICs9IChoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXlbaV0gPCAxNiA/IFwiMFwiIDogXCJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXlbaV0udG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNlcnZlckhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IChlbWFpbFJlc3VsdC5yb3dzWzBdWzJdIGFzIFVpbnQ4QXJyYXkpLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VydmVySGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgKz0gKChlbWFpbFJlc3VsdC5yb3dzWzBdWzJdIGFzIFVpbnQ4QXJyYXkpW2ldIDwgMTYgPyBcIjBcIiA6IFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgKGVtYWlsUmVzdWx0LnJvd3NbMF1bMl0gYXMgVWludDhBcnJheSlbaV0udG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nID09PSBzZXJ2ZXJIYXNoZWRQYXNzd29yZEhleFN0cmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmb3VuZFVzZXI6IFVzZXIgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtYWlsOiB7IHZhbHVlOiBlbWFpbFJlc3VsdC5yb3dzWzBdWzBdIGFzIHN0cmluZyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogeyB2YWx1ZTogZW1haWxSZXN1bHQucm93c1swXVsxXSBhcyBzdHJpbmcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHsgdmFsdWU6ICcnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzaWQgPSBhd2FpdCBuYW5vaWQoNDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpZHNbc2lkXSA9IGZvdW5kVXNlci51c2VybmFtZS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjb250ZXh0LmNvb2tpZXMuc2V0KCdzaWQnLCBzaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IGZvdW5kVXNlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0geyB0ZXh0OiAnV3JvbmcgUGFzc3dvcmQnIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsZXQgc2FsdEhleFN0cmluZyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8ICh1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzNdIGFzIFVpbnQ4QXJyYXkpLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzYWx0SGV4U3RyaW5nICs9ICgodXNlcm5hbWVSZXN1bHQucm93c1swXVszXSBhcyBVaW50OEFycmF5KVtpXSA8IDE2ID8gXCIwXCIgOiBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgKHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bM10gYXMgVWludDhBcnJheSlbaV0udG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGxldCB0ZXh0RW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgY3J5cHRvLnN1YnRsZS5kaWdlc3QoJ1NIQTMtNTEyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHRFbmNvZGVyLmVuY29kZSh1c2VyPy5wYXNzd29yZD8udmFsdWUgKyBzYWx0SGV4U3RyaW5nKSkpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXkubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nICs9IChoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXlbaV0gPCAxNiA/IFwiMFwiIDogXCJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArIGhhc2hlZFBhc3N3b3JkVWludDhBcnJheVtpXS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbGV0IHNlcnZlckhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgKHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMl0gYXMgVWludDhBcnJheSkubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZlckhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nICs9ICgodXNlcm5hbWVSZXN1bHQucm93c1swXVsyXSBhcyBVaW50OEFycmF5KVtpXSA8IDE2ID8gXCIwXCIgOiBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgKHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMl0gYXMgVWludDhBcnJheSlbaV0udG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChoYXNoZWRQYXNzd29yZEhleFN0cmluZyA9PT0gc2VydmVySGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmb3VuZFVzZXI6IFVzZXIgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW1haWw6IHsgdmFsdWU6IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMF0gYXMgc3RyaW5nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcm5hbWU6IHsgdmFsdWU6IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMV0gYXMgc3RyaW5nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHsgdmFsdWU6ICcnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc2lkID0gYXdhaXQgbmFub2lkKDQwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZHNbc2lkXSA9IGZvdW5kVXNlci51c2VybmFtZS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNvbnRleHQuY29va2llcy5zZXQoJ3NpZCcsIHNpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSBmb3VuZFVzZXI7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7IHRleHQ6ICdXcm9uZyBQYXNzd29yZCcgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS50eXBlID0gXCJqc29uXCI7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGV4dC50aHJvdyhTdGF0dXMuQmFkUmVxdWVzdCwgXCJCYWQgUmVxdWVzdFwiKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAuZ2V0KFwiL2FwaS91c2VyXCIsIGFzeW5jIChjb250ZXh0KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgc2lkID0gYXdhaXQgY29udGV4dC5jb29raWVzLmdldCgnc2lkJyk7XG4gICAgICAgICAgICBpZiAoc2lkICYmIHR5cGVvZiBzaWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgbGV0IHVzZXJuYW1lID0gc2lkc1tzaWQgYXMgc3RyaW5nXTtcbiAgICAgICAgICAgICAgICBpZiAodXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXNlcm5hbWVSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBlbWFpbCwgdXNlcm5hbWUsIG51bV93aW5zLCBudW1fbG9zc2VzLCBlbG9fcmF0aW5nIGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIHVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgZm91bmRVc2VyOiBVc2VyID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW1haWw6IHsgdmFsdWU6IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMF0gYXMgc3RyaW5nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogeyB2YWx1ZTogdXNlcm5hbWVSZXN1bHQucm93c1swXVsxXSBhcyBzdHJpbmcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiB7IHZhbHVlOiAnJyB9LFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXI6IGZvdW5kVXNlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bVdpbnM6IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMl0gYXMgbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgbnVtTG9zc2VzOiB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzNdIGFzIG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZzogdXNlcm5hbWVSZXN1bHQucm93c1swXVs0XSBhcyBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLmdldChcIi9hcGkvb3Bwb25lbnRcIiwgYXN5bmMgKGNvbnRleHQpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBzaWQgPSBhd2FpdCBjb250ZXh0LmNvb2tpZXMuZ2V0KCdzaWQnKTtcbiAgICAgICAgICAgIGlmIChzaWQgJiYgdHlwZW9mIHNpZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBsZXQgdXNlcm5hbWUgPSBzaWRzW3NpZCBhcyBzdHJpbmddO1xuICAgICAgICAgICAgICAgIGxldCBvcHBvbmVudFVzZXJuYW1lID0gc2lkc1ttYXRjaGVzW3NpZCBhcyBzdHJpbmddIGFzIHN0cmluZ107XG4gICAgICAgICAgICAgICAgaWYgKHVzZXJuYW1lICYmIG9wcG9uZW50VXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXNlcm5hbWVSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBlbG9fcmF0aW5nIGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIHVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvcHBvbmVudFVzZXJuYW1lUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgZWxvX3JhdGluZyBmcm9tIHVzZXJzIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKyBvcHBvbmVudFVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZUJvZHkgOiBNYXRjaG1ha2luZ0RhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB5b3U6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogdXNlcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxvUmF0aW5nOiB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzBdIGFzIG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWQ6IHNpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHBvbmVudDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJuYW1lOiBvcHBvbmVudFVzZXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZzogb3Bwb25lbnRVc2VybmFtZVJlc3VsdC5yb3dzWzBdWzBdIGFzIG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWQ6ICcnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSByZXNwb25zZUJvZHk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLmdldChcIi9hcGkvcXVlc3Rpb25cIiwgYXN5bmMgKGNvbnRleHQpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBzaWQgPSBhd2FpdCBjb250ZXh0LmNvb2tpZXMuZ2V0KCdzaWQnKTtcbiAgICAgICAgICAgIGlmIChzaWQgJiYgdHlwZW9mIHNpZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHF1ZXN0aW9uUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgcXVlc3Rpb24sIGZ1bmN0aW9uX3NpZ25hdHVyZSwgZGVmYXVsdF9jdXN0b21faW5wdXQgZnJvbSBxdWVzdGlvbnMgd2hlcmUgaWQgPSBcIlxuICAgICAgICAgICAgICAgICAgICArIHNpZHNRdWVzdGlvbnNbc2lkXVtzaWRzUHJvZ3Jlc3Nbc2lkXV0ucXVlc3Rpb25JZC50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlVVVVwiKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzaWRzUXVlc3Rpb25zW3NpZF1bc2lkc1Byb2dyZXNzW3NpZF1dLnF1ZXN0aW9uSWQudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJJSUlcIik7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VCb2R5IDogUXVlc3Rpb25EYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICBxdWVzdGlvbjogcXVlc3Rpb25SZXN1bHQucm93c1swXVswXSBhcyBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uX3NpZ25hdHVyZTogcXVlc3Rpb25SZXN1bHQucm93c1swXVsxXSBhcyBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHRfY3VzdG9tX2lucHV0OiBxdWVzdGlvblJlc3VsdC5yb3dzWzBdWzJdIGFzIHN0cmluZyxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHJlc3BvbnNlQm9keTtcbiAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLmdldChcIi9hcGkvbWF0Y2htYWtpbmdcIiwgYXN5bmMgKGNvbnRleHQpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBzaWQgPSBhd2FpdCBjb250ZXh0LmNvb2tpZXMuZ2V0KCdzaWQnKTtcbiAgICAgICAgICAgIGlmIChzaWQgJiYgdHlwZW9mIHNpZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBsZXQgdXNlcm5hbWUgPSBzaWRzW3NpZCBhcyBzdHJpbmddO1xuICAgICAgICAgICAgICAgIGlmICh1c2VybmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IGVsb19yYXRpbmcgZnJvbSB1c2VycyB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgdXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgIGxldCBtYXRjaG1ha2luZ1VzZXI6IE1hdGNobWFraW5nVXNlciA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZzogdXNlcm5hbWVSZXN1bHQucm93c1swXVswXSBhcyBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBzaWQ6IHNpZCxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBxdWV1ZXM6IE1hdGNobWFraW5nVXNlcltdW10gPSBbbWF0Y2htYWtpbmdRdWV1ZTI1LCBtYXRjaG1ha2luZ1F1ZXVlNTAsIG1hdGNobWFraW5nUXVldWUxMDAsIG1hdGNobWFraW5nUXVldWUyMDBdO1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmFuZ2VzOiBudW1iZXJbXSA9IFsyNSwgNTAsIDEwMCwgMjAwXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRlbGF5VGltZXNOdW1zOiBudW1iZXJbXSA9IFsxLCA1LCAxMCwgNjBdO1xuICAgICAgICAgICAgICAgICAgICBsZXQgZm91bmRNYXRjaDogYm9vbGVhbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHF1ZXVlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kTWF0Y2ggPSBhd2FpdCBhZGRUb1F1ZXVlKHF1ZXVlc1tpXSwgbWF0Y2htYWtpbmdVc2VyLCByYW5nZXNbaV0sIGNvbnRleHQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZGVsYXlUaW1lc051bXNbaV07ICsraikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmRNYXRjaCA9IGF3YWl0IGNoZWNrSWZGb3VuZEluUXVldWUoMTAwMCwgbWF0Y2htYWtpbmdVc2VyLCB1c2VybmFtZSwgY29udGV4dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZE1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVGcm9tUXVldWUocXVldWVzW2ldLCBzaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghZm91bmRNYXRjaCAmJiAhYWRkVG9RdWV1ZShtYXRjaG1ha2luZ1F1ZXVlNTAwLCBtYXRjaG1ha2luZ1VzZXIsIDUwMCwgY29udGV4dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlICghKGF3YWl0IGNoZWNrSWZGb3VuZEluUXVldWUoMTAwMCwgbWF0Y2htYWtpbmdVc2VyLCB1c2VybmFtZSwgY29udGV4dCkpKSB7IH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAuZ2V0KFwiL2FwaS9sb2dvdXRcIiwgYXN5bmMgKGNvbnRleHQpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBzaWQgPSBhd2FpdCBjb250ZXh0LmNvb2tpZXMuZ2V0KCdzaWQnKTtcbiAgICAgICAgICAgIGlmIChzaWQgJiYgdHlwZW9mIHNpZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgc2lkc1tzaWQgYXMgc3RyaW5nXTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7IHRleHQ6ICdTdWNjZXNzZnVsbHkgTG9nZ2VkIE91dCcgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAucG9zdChcIi9hcGkvcnVuXCIsIGFzeW5jIChjb250ZXh0OiBSb3V0ZXJDb250ZXh0PGFueT4pID0+IHtcbiAgICAgICAgLy8gY29udGV4dC5yZXNwb25zZS5zdGF0dXMgPSBTdGF0dXMuT0s7XG4gICAgICAgIC8vIGNvbnN0IGR1bWJ5UmVzdWx0OiBUZXN0Q2FzZXNQYXNzZWQgPSB7XG4gICAgICAgIC8vICAgICB0ZXN0Q2FzZXNQYXNzZWQ6IFt0cnVlLCB0cnVlLCB0cnVlLCB0cnVlLCB0cnVlLCB0cnVlLCB0cnVlLCB0cnVlLCB0cnVlLCB0cnVlLCB0cnVlXSxcbiAgICAgICAgLy8gICAgIHN0YW5kYXJkT3V0cHV0OiBcIlRlc3QgU3RhbmRhcmQgT3V0cHV0XCIsXG4gICAgICAgIC8vICAgICBvdXRwdXQ6IFwiVGVzdCBPdXRwdXRcIlxuICAgICAgICAvLyB9XG4gICAgICAgIC8vIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IGR1bWJ5UmVzdWx0XG4gICAgICAgIC8vIHJldHVyblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHNpZCA9IGF3YWl0IGNvbnRleHQuY29va2llcy5nZXQoJ3NpZCcpO1xuICAgICAgICAgICAgaWYgKHNpZCAmJiB0eXBlb2Ygc2lkID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGlmICghY29udGV4dC5yZXF1ZXN0Lmhhc0JvZHkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC50aHJvdyhTdGF0dXMuQmFkUmVxdWVzdCwgXCJCYWQgUmVxdWVzdFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgYm9keSA9IGNvbnRleHQucmVxdWVzdC5ib2R5KCk7XG4gICAgICAgICAgICAgICAgbGV0IGNvZGU6IFBhcnRpYWw8Q29kZVN1Ym1pc3Npb24+IHwgdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGlmIChib2R5LnR5cGUgPT09IFwianNvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvZGUgPSBhd2FpdCBib2R5LnZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoY29kZSkge1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmFzc2VydCh0eXBlb2YgY29kZT8udmFsdWUgPT09IFwic3RyaW5nXCIsIFN0YXR1cy5CYWRSZXF1ZXN0KTtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5hc3NlcnQodHlwZW9mIGNvZGU/LmlucHV0ID09PSBcInN0cmluZ1wiLCBTdGF0dXMuQmFkUmVxdWVzdCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2Uuc3RhdHVzID0gU3RhdHVzLk9LO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlpaWlwiKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coY29kZS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiWFhYXCIpO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoXCIuL3NhbmRib3gvYW5zd2VyLnB5XCIsIGNvZGUudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoXCIuL3NhbmRib3gvYW5zd2VyQ3VzdG9tSW5wdXQucHlcIiwgY29kZS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBpbnB1dExpbmVzOiBzdHJpbmdbXSA9IGNvZGUuaW5wdXQuc3BsaXQoJ1xcbicpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgY3VzdG9tSW5wdXRDb250ZW50OiBzdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgbGV0IHF1ZXN0aW9uSW5mb3JtYXRpb246IFF1ZXN0aW9uSW5mb3JtYXRpb24gPSBzaWRzUXVlc3Rpb25zW3NpZF1bc2lkc1Byb2dyZXNzW3NpZF1dO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHF1ZXN0aW9uSW5mb3JtYXRpb24uaW5wdXRGb3JtYXQubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiT09PXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocXVlc3Rpb25JbmZvcm1hdGlvbi5pbnB1dEZvcm1hdFtpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBQUFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChxdWVzdGlvbkluZm9ybWF0aW9uLmlucHV0Rm9ybWF0W2ldID09ICduJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbUlucHV0Q29udGVudCArPSBwYXJzZUludChpbnB1dExpbmVzW2ldKS50b1N0cmluZygpICsgJ1xcbic7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHF1ZXN0aW9uSW5mb3JtYXRpb24uaW5wdXRGb3JtYXRbaV0gPT0gJ2EnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGlucHV0Q29tbWFTZXBhcmF0ZWRWYWx1ZXM6IHN0cmluZ1tdID0gaW5wdXRMaW5lc1tpXS5zcGxpdCgnWycpWzFdLnNwbGl0KCddJylbMF0uc3BsaXQoJywnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhpbnB1dENvbW1hU2VwYXJhdGVkVmFsdWVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlNTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21JbnB1dENvbnRlbnQgKz0gaW5wdXRDb21tYVNlcGFyYXRlZFZhbHVlcy5sZW5ndGgudG9TdHJpbmcoKSArICdcXG4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRDb21tYVNlcGFyYXRlZFZhbHVlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21JbnB1dENvbnRlbnQgKz0gcGFyc2VJbnQoaW5wdXRDb21tYVNlcGFyYXRlZFZhbHVlc1tpXSkudG9TdHJpbmcoKSArICdcXG4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkNDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhjdXN0b21JbnB1dENvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChxdWVzdGlvbkluZm9ybWF0aW9uLmlucHV0Rm9ybWF0W2ldID09ICdhYScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaW5wdXRDb21tYVNlcGFyYXRlZFZhbHVlczogc3RyaW5nW10gPSBpbnB1dExpbmVzW2ldLnNwbGl0KCdbWycpWzFdLnNwbGl0KCddXScpWzBdLnNwbGl0KCddLFsnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21JbnB1dENvbnRlbnQgKz0gaW5wdXRDb21tYVNlcGFyYXRlZFZhbHVlcy5sZW5ndGgudG9TdHJpbmcoKSArICdcXG4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRDb21tYVNlcGFyYXRlZFZhbHVlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaW5wdXRDQ29tbWFTZXBhcmF0ZWRWYWx1ZXM6IHN0cmluZ1tdID0gaW5wdXRMaW5lc1tpXS5zcGxpdCgnLCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21JbnB1dENvbnRlbnQgKz0gaW5wdXRDQ29tbWFTZXBhcmF0ZWRWYWx1ZXMubGVuZ3RoLnRvU3RyaW5nKCkgKyAnXFxuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGlucHV0Q0NvbW1hU2VwYXJhdGVkVmFsdWVzLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21JbnB1dENvbnRlbnQgKz0gcGFyc2VJbnQoaW5wdXRDQ29tbWFTZXBhcmF0ZWRWYWx1ZXNbaV0pLnRvU3RyaW5nKCkgKyAnXFxuJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAocXVlc3Rpb25JbmZvcm1hdGlvbi5vdXRwdXRGb3JtYXQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJOTk5cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhxdWVzdGlvbkluZm9ybWF0aW9uLm91dHB1dEZvcm1hdFswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk1NTVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkFBQVwiKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKFwiLi9zYW5kYm94L2N1c3RvbUlucHV0LmluXCIsIGN1c3RvbUlucHV0Q29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUFCXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXBvcnRQcm9jZXNzID0gYXdhaXQgRGVuby5ydW4oe1xuICAgICAgICAgICAgICAgICAgICAgICAgY21kOiBbXCIuL21ha2VSZXBvcnQuc2hcIl0sXG4gICAgICAgICAgICAgICAgICAgICAgICBjd2Q6IFwiLi9zYW5kYm94L1wiICsgcXVlc3Rpb25JbmZvcm1hdGlvbi5xdWVzdGlvbklkLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGRvdXQ6IFwicGlwZWRcIlxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBQkJcIik7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHJlcG9ydFByb2Nlc3Mub3V0cHV0KCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQkJCXCIpO1xuICAgICAgICAgICAgICAgICAgICBsZXQganNvblJlc3VsdHM6IFN0cmluZyA9IGF3YWl0IERlbm8ucmVhZFRleHRGaWxlKFwiLi9zYW5kYm94L3JlcG9ydEZyb21QeVNhbmRib3gudHh0XCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIiEhIVwiKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coanNvblJlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkBAQFwiKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHN0YW5kYXJkT3V0cHV0UmVzdWx0czogc3RyaW5nID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUoXCIuL3NhbmRib3gvc3RhbmRhcmRPdXRwdXRGcm9tUHlTYW5kYm94LnR4dFwiKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG91dHB1dFJlc3VsdHM6IHN0cmluZyA9IGF3YWl0IERlbm8ucmVhZFRleHRGaWxlKFwiLi9zYW5kYm94L291dHB1dEZyb21QeVNhbmRib3gudHh0XCIpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgb3V0cHV0UmVzdWx0c1NwbGl0OiBzdHJpbmdbXSA9IG91dHB1dFJlc3VsdHMuc3BsaXQoJ1xcbicpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgYWN0dWFsT3V0cHV0UmVzdWx0czogc3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGlmIChxdWVzdGlvbkluZm9ybWF0aW9uLm91dHB1dEZvcm1hdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocXVlc3Rpb25JbmZvcm1hdGlvbi5vdXRwdXRGb3JtYXRbMF0gPT0gJ24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG91dHB1dFJlc3VsdHNTcGxpdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbE91dHB1dFJlc3VsdHMgKz0gb3V0cHV0UmVzdWx0c1NwbGl0WzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocXVlc3Rpb25JbmZvcm1hdGlvbi5vdXRwdXRGb3JtYXRbMF0gPT0gJ2EnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG46IG51bWJlciA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG91dHB1dFJlc3VsdHNTcGxpdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG4gPSBwYXJzZUludChvdXRwdXRSZXN1bHRzU3BsaXRbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobiA+IDAgJiYgb3V0cHV0UmVzdWx0c1NwbGl0Lmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsT3V0cHV0UmVzdWx0cyArPSAnWycgKyBvdXRwdXRSZXN1bHRzU3BsaXRbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbE91dHB1dFJlc3VsdHMgKz0gJywgJyArIG91dHB1dFJlc3VsdHNTcGxpdFtpICsgMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWxPdXRwdXRSZXN1bHRzICs9ICddJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocXVlc3Rpb25JbmZvcm1hdGlvbi5vdXRwdXRGb3JtYXRbMF0gPT0gJ2FhJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuOiBudW1iZXIgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBubjogbnVtYmVyID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgazogbnVtYmVyID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIiMjI1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhvdXRwdXRSZXN1bHRzU3BsaXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiJCQkXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvdXRwdXRSZXN1bHRzU3BsaXQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuID0gcGFyc2VJbnQob3V0cHV0UmVzdWx0c1NwbGl0W2srK10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobiA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsT3V0cHV0UmVzdWx0cyArPSAnW1snO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3V0cHV0UmVzdWx0c1NwbGl0Lmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5uID0gcGFyc2VJbnQob3V0cHV0UmVzdWx0c1NwbGl0W2srK10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChubiA+IDAgJiYgb3V0cHV0UmVzdWx0c1NwbGl0Lmxlbmd0aCA+IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbE91dHB1dFJlc3VsdHMgKz0gb3V0cHV0UmVzdWx0c1NwbGl0W2srK107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBubjsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWxPdXRwdXRSZXN1bHRzICs9ICcsICcgKyBvdXRwdXRSZXN1bHRzU3BsaXRbaysrXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWxPdXRwdXRSZXN1bHRzICs9ICddJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWxPdXRwdXRSZXN1bHRzICs9ICcsIFsnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBubiA9IHBhcnNlSW50KG91dHB1dFJlc3VsdHNTcGxpdFtrKytdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5uID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsT3V0cHV0UmVzdWx0cyArPSBvdXRwdXRSZXN1bHRzU3BsaXRbaysrXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMTsgaiA8IG5uOyArK2opIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbE91dHB1dFJlc3VsdHMgKz0gJywgJyArIG91dHB1dFJlc3VsdHNTcGxpdFtrKytdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbE91dHB1dFJlc3VsdHMgKz0gJ10nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWxPdXRwdXRSZXN1bHRzICs9ICddJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkNDQ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coc3RhbmRhcmRPdXRwdXRSZXN1bHRzKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJERERcIik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGFjdHVhbE91dHB1dFJlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkVFRVwiKTtcbiAgICAgICAgICAgICAgICAgICAganNvblJlc3VsdHMgPSBqc29uUmVzdWx0cy5yZXBsYWNlKC9cXHMvZywgXCJcIik7XG4gICAgICAgICAgICAgICAgICAgIGpzb25SZXN1bHRzID0ganNvblJlc3VsdHMuc3Vic3RyaW5nKDAsIGpzb25SZXN1bHRzLmxlbmd0aCAtIDIpICsgXCJdXCJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRlc3RSZXN1bHRzOiBUZXN0UmVzdWx0W10gID0gSlNPTi5wYXJzZShqc29uUmVzdWx0cy50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRlc3RDYXNlc1Bhc3NlZDogVGVzdENhc2VzUGFzc2VkID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVzdENhc2VzUGFzc2VkOiB0ZXN0UmVzdWx0cy5tYXAoKHRyOiBUZXN0UmVzdWx0KSA9PiB0ci5wYXNzZWQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhbmRhcmRPdXRwdXQ6IHN0YW5kYXJkT3V0cHV0UmVzdWx0cyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dDogYWN0dWFsT3V0cHV0UmVzdWx0cyxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLyppZiAoKytpaWlDb3VudGVyICUgMyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXN0Q2FzZXNQYXNzZWQudGVzdENhc2VzUGFzc2VkLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVzdENhc2VzUGFzc2VkLnRlc3RDYXNlc1Bhc3NlZFtpXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0qL1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRlc3RDYXNlc1Bhc3NlZC50ZXN0Q2FzZXNQYXNzZWQuc29tZShlbGVtZW50ID0+ICFlbGVtZW50KSAmJiArK3NpZHNQcm9ncmVzc1tzaWRdID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgb3Bwb25lbnRTaWQgPSBtYXRjaGVzW3NpZF07XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgbWF0Y2hlc1tzaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG1hdGNoZXNbb3Bwb25lbnRTaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHNpZHNQcm9ncmVzc1tzaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHNpZHNQcm9ncmVzc1tvcHBvbmVudFNpZF07XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgc2lkc1F1ZXN0aW9uc1tzaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHNpZHNRdWVzdGlvbnNbb3Bwb25lbnRTaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG51bVdpbnM6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1HYW1lczogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZzogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhczI0MDBSYXRpbmdIaXN0b3J5OiBib29sZWFuID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3Bwb25lbnROdW1Mb3NzZXM6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHBvbmVudE51bUdhbWVzOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3Bwb25lbnRFbG9SYXRpbmc6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHBvbmVudEhhczI0MDBSYXRpbmdIaXN0b3J5OiBib29sZWFuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdXNlcm5hbWUgPSBzaWRzW3NpZCBhcyBzdHJpbmddO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IG51bV93aW5zLCBudW1fbG9zc2VzLCBlbG9fcmF0aW5nLCBoYXNfMjQwMF9yYXRpbmdfaGlzdG9yeSBmcm9tIHVzZXJzIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIHVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bVdpbnMgPSB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzBdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1HYW1lcyA9IG51bVdpbnMgKyAodXNlcm5hbWVSZXN1bHQucm93c1swXVsxXSBhcyBudW1iZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZyA9IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMl0gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhczI0MDBSYXRpbmdIaXN0b3J5ID0gdXNlcm5hbWVSZXN1bHQucm93c1swXVszXSBhcyBib29sZWFuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgb3Bwb25lbnRVc2VybmFtZSA9IHNpZHNbb3Bwb25lbnRTaWQgYXMgc3RyaW5nXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3Bwb25lbnRVc2VybmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzZWxlY3QgbnVtX3dpbnMsIG51bV9sb3NzZXMsIGVsb19yYXRpbmcsIGhhc18yNDAwX3JhdGluZ19oaXN0b3J5IGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIG9wcG9uZW50VXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50TnVtTG9zc2VzID0gdXNlcm5hbWVSZXN1bHQucm93c1swXVsxXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50TnVtR2FtZXMgPSAodXNlcm5hbWVSZXN1bHQucm93c1swXVswXSBhcyBudW1iZXIpICsgb3Bwb25lbnROdW1Mb3NzZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50RWxvUmF0aW5nID0gdXNlcm5hbWVSZXN1bHQucm93c1swXVsyXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50SGFzMjQwMFJhdGluZ0hpc3RvcnkgPSB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzNdIGFzIGJvb2xlYW47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKytudW1XaW5zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZWxvUmF0aW5nVmFyaWF0aW9uOiBudW1iZXIgPSAxIC0gMS4wIC8gKDEgKyBNYXRoLnBvdygxMCwgKG9wcG9uZW50RWxvUmF0aW5nIC0gZWxvUmF0aW5nKSAvIDQwMC4wKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZyArPSBNYXRoLmZsb29yKChudW1HYW1lcyA8IDMwID8gKGVsb1JhdGluZyA8IDIzMDAgPyA0MCA6IDIwKSA6IChoYXMyNDAwUmF0aW5nSGlzdG9yeSA/IDEwIDogMjApKSAqIGVsb1JhdGluZ1ZhcmlhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrb3Bwb25lbnROdW1Mb3NzZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50RWxvUmF0aW5nIC09IE1hdGguY2VpbCgob3Bwb25lbnROdW1HYW1lcyA8IDMwID8gKG9wcG9uZW50RWxvUmF0aW5nIDwgMjMwMCA/IDQwIDogMjApIDogKG9wcG9uZW50SGFzMjQwMFJhdGluZ0hpc3RvcnkgPyAxMCA6IDIwKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogZWxvUmF0aW5nVmFyaWF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJ1cGRhdGUgdXNlcnMgc2V0IG51bV93aW5zID0gXCIgKyBudW1XaW5zLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiLCBlbG9fcmF0aW5nID0gXCIgKyBlbG9SYXRpbmcudG9TdHJpbmcoKSArIFwiLCBoYXNfMjQwMF9yYXRpbmdfaGlzdG9yeSA9IFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAoaGFzMjQwMFJhdGluZ0hpc3RvcnkgfHwgZWxvUmF0aW5nID49IDI0MDApLnRvU3RyaW5nKCkgKyBcIiB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIHVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHBvbmVudFVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJ1cGRhdGUgdXNlcnMgc2V0IG51bV9sb3NzZXMgPSBcIiArIG9wcG9uZW50TnVtTG9zc2VzLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiLCBlbG9fcmF0aW5nID0gXCIgKyBvcHBvbmVudEVsb1JhdGluZy50b1N0cmluZygpICsgXCIsIGhhc18yNDAwX3JhdGluZ19oaXN0b3J5ID0gXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIChvcHBvbmVudEhhczI0MDBSYXRpbmdIaXN0b3J5IHx8IG9wcG9uZW50RWxvUmF0aW5nID49IDI0MDApLnRvU3RyaW5nKCkgKyBcIiB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIG9wcG9uZW50VXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0gdGVzdENhc2VzUGFzc2VkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAuZ2V0KFwiL2FwaS93aWxkY2FyZEVuZHBvaW50XCIsIGFzeW5jIChjb250ZXh0KSA9PiB7XG4gICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHsgZW5kcG9pbnQ6IFxuICAgICAgICAgICAgcHJvZCA/IFwid3NzOi8vbGljb2RlLmlvL3dzXCIgOiBcIndzOi8vbG9jYWxob3N0OjUwMDAvd3NcIlxuICAgICAgICB9O1xuICAgIH0pO1xuYXBwLnVzZShyb3V0ZXIucm91dGVzKCkpO1xuYXBwLnVzZShyb3V0ZXIuYWxsb3dlZE1ldGhvZHMoKSk7XG5hcHAudXNlKGFzeW5jIChjb250ZXh0KSA9PiB7XG4gICAgaWYgKCFjb250ZXh0LnJlcXVlc3QudXJsLnBhdGhuYW1lLmVuZHNXaXRoKCcuanMnKVxuICAgICAgICAmJiAhY29udGV4dC5yZXF1ZXN0LnVybC5wYXRobmFtZS5lbmRzV2l0aCgnLnBuZycpXG4gICAgICAgICYmICFjb250ZXh0LnJlcXVlc3QudXJsLnBhdGhuYW1lLmVuZHNXaXRoKCcuaWNvJylcbiAgICAgICAgJiYgIWNvbnRleHQucmVxdWVzdC51cmwucGF0aG5hbWUuZW5kc1dpdGgoJy50eHQnKSlcdHtcbiAgICAgICAgY29udGV4dC5yZXF1ZXN0LnVybC5wYXRobmFtZSA9ICcvJztcbiAgICB9XG4gICAgYXdhaXQgY29udGV4dC5zZW5kKHtcbiAgICAgICAgcm9vdDogYCR7RGVuby5jd2QoKX0vcmVhY3QtYXBwL2J1aWxkYCxcbiAgICAgICAgaW5kZXg6IFwiaW5kZXguaHRtbFwiLFxuICAgIH0pO1xufSk7XG5jb25zb2xlLmxvZyhcIlJ1bm5pbmcgb24gcG9ydFwiLCBwb3J0KTtcbmF3YWl0IGFwcC5saXN0ZW4oeyBwb3J0IH0pO1xuIl19