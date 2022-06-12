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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDSCxXQUFXLEVBQ1gsTUFBTSxFQUVOLE1BQU0sR0FFVCxNQUFNLGdDQUFnQyxDQUFDO0FBTXhDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSw2Q0FBNkMsQ0FBQztBQUNyRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sNkNBQTZDLENBQUM7QUFDckUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLDRDQUE0QyxDQUFBO0FBQ25FLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSx5Q0FBeUMsQ0FBQztBQUNwRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sNENBQTRDLENBQUE7QUFDbEUsTUFBTSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUM7SUFDdEIsSUFBSSxFQUFFLFFBQVE7SUFDZCxRQUFRLEVBQUUsUUFBUTtJQUNsQixRQUFRLEVBQUUsUUFBUTtJQUNsQixRQUFRLEVBQUUsV0FBVztJQUNyQixJQUFJLEVBQUUsSUFBSTtJQUNWLEdBQUcsRUFBRTtRQUNELE9BQU8sRUFBRSxLQUFLO1FBQ2QsT0FBTyxFQUFFLEtBQUs7S0FDakI7Q0FDSixDQUFDLENBQUM7QUFDSCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ2hDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUMsS0FBSyxFQUFFLEVBQUMsTUFBTSxFQUFFLEdBQUcsRUFBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFFLENBQUMsQ0FBQTtBQUN6RSxNQUFNLElBQUksR0FBYSxJQUFJLENBQUMsSUFBSSxDQUFBO0FBQ2hDLE1BQU0sR0FBRyxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7QUFDOUIsTUFBTSxNQUFNLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQWtD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b3V0ZXJDb250ZXh0LFxuICAgIFN0YXR1cyxcbiAgICBzZW5kLFxufSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9vYWsvbW9kLnRzXCI7XG5cbmltcG9ydCB7IE1hdGNobWFraW5nRGF0YSB9IGZyb20gXCIuL3JlYWN0LWFwcC9zcmMvY29tcG9uZW50cy9jb21tb24vaW50ZXJmYWNlcy9tYXRjaG1ha2luZ0RhdGEudHNcIjtcbmltcG9ydCB7IFF1ZXN0aW9uRGF0YSB9IGZyb20gXCIuL3JlYWN0LWFwcC9zcmMvY29tcG9uZW50cy9jb21tb24vaW50ZXJmYWNlcy9tYXRjaG1ha2luZ0RhdGEudHNcIjtcbmltcG9ydCB7IFRlc3RDYXNlc1Bhc3NlZCB9IGZyb20gXCIuL3JlYWN0LWFwcC9zcmMvY29tcG9uZW50cy9jb21tb24vaW50ZXJmYWNlcy9tYXRjaG1ha2luZ0RhdGEudHNcIjtcblxuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3gvcG9zdGdyZXNAdjAuMTUuMC9tb2QudHNcIjtcbmltcG9ydCB7IGNyeXB0byB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4xMzIuMC9jcnlwdG8vbW9kLnRzXCI7XG5pbXBvcnQgeyBuYW5vaWQgfSBmcm9tICdodHRwczovL2Rlbm8ubGFuZC94L25hbm9pZEB2My4wLjAvYXN5bmMudHMnXG5pbXBvcnQgeyBlbnN1cmVEaXIgfSBmcm9tICdodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4xMzYuMC9mcy9tb2QudHMnO1xuaW1wb3J0IHsgcGFyc2UgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQDAuMTQzLjAvZmxhZ3MvbW9kLnRzXCJcbmNvbnN0IGNsaWVudCA9IG5ldyBDbGllbnQoe1xuICAgIHVzZXI6IFwibGljb2RlXCIsXG4gICAgZGF0YWJhc2U6IFwibGljb2RlXCIsXG4gICAgcGFzc3dvcmQ6IFwiZWRvY2lsXCIsXG4gICAgaG9zdG5hbWU6IFwibG9jYWxob3N0XCIsXG4gICAgcG9ydDogNTQzMixcbiAgICB0bHM6IHtcbiAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgIGVuZm9yY2U6IGZhbHNlLFxuICAgIH0sXG59KTtcbmNvbnN0IGVudiA9IERlbm8uZW52LnRvT2JqZWN0KCk7XG5jb25zdCBhcmdzID0gcGFyc2UoRGVuby5hcmdzLCB7YWxpYXM6IHtcInByb2RcIjogXCJwXCJ9LCBib29sZWFuOiBbXCJwcm9kXCJdLH0pXG5jb25zdCBwcm9kIDogYm9vbGVhbiA9IGFyZ3MucHJvZFxuY29uc3QgYXBwID0gbmV3IEFwcGxpY2F0aW9uKCk7XG5jb25zdCByb3V0ZXIgPSBuZXcgUm91dGVyKCk7XG4vL2xldCBpaWlDb3VudGVyID0gMDtcblxuaW50ZXJmYWNlIEhlbGxvV29ybGQge1xuICAgIHRleHQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFVzZXIge1xuICAgIGVtYWlsOiB7IHZhbHVlOiBzdHJpbmcgfTtcbiAgICB1c2VybmFtZTogeyB2YWx1ZTogc3RyaW5nIH07XG4gICAgcGFzc3dvcmQ6IHsgdmFsdWU6IHN0cmluZyB9O1xufVxuXG5pbnRlcmZhY2UgTWF0Y2htYWtpbmdVc2VyIHtcbiAgICBlbG9SYXRpbmc6IG51bWJlcjtcbiAgICBzaWQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIENvZGVTdWJtaXNzaW9uIHtcbiAgICB2YWx1ZTogc3RyaW5nO1xuICAgIGlucHV0OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBUZXN0UmVzdWx0IHtcbiAgICB0ZXN0TmFtZTogc3RyaW5nLFxuICAgIHBhc3NlZDogYm9vbGVhblxufVxuXG5pbnRlcmZhY2UgUXVlc3Rpb25JbmZvcm1hdGlvbiB7XG4gICAgcXVlc3Rpb25JZDogbnVtYmVyLFxuICAgIGlucHV0Rm9ybWF0OiBzdHJpbmdbXSxcbiAgICBvdXRwdXRGb3JtYXQ6IHN0cmluZ1tdLFxufVxuXG5jb25zdCBudW1RdWVzdGlvbnNQZXJNYXRjaCA9IDM7XG5cbmxldCBoZWxsb1dvcmxkVmFyOiBIZWxsb1dvcmxkID0geyB0ZXh0OiAnSGVsbG8gV29ybGQnIH07XG5cbmxldCBzaWRzOiB7IFtuYW1lOiBzdHJpbmddOiBzdHJpbmcgfSA9IHt9O1xuXG5sZXQgc2lkc1Byb2dyZXNzOiB7IFtuYW1lOiBzdHJpbmddOiBudW1iZXIgfSA9IHt9O1xuXG5sZXQgc2lkc1F1ZXN0aW9uczogeyBbbmFtZTogc3RyaW5nXTogUXVlc3Rpb25JbmZvcm1hdGlvbltdIH0gPSB7fTtcblxubGV0IG1hdGNobWFraW5nUXVldWUyNTogTWF0Y2htYWtpbmdVc2VyW10gPSBbXTtcbmxldCBtYXRjaG1ha2luZ1F1ZXVlNTA6IE1hdGNobWFraW5nVXNlcltdID0gW107XG5sZXQgbWF0Y2htYWtpbmdRdWV1ZTEwMDogTWF0Y2htYWtpbmdVc2VyW10gPSBbXTtcbmxldCBtYXRjaG1ha2luZ1F1ZXVlMjAwOiBNYXRjaG1ha2luZ1VzZXJbXSA9IFtdO1xubGV0IG1hdGNobWFraW5nUXVldWU1MDA6IE1hdGNobWFraW5nVXNlcltdID0gW107XG5cbmxldCBtYXRjaGVzOiB7IFtuYW1lOiBzdHJpbmddOiBzdHJpbmcgfSA9IHt9O1xuXG5jb25zdCBudW1UZXN0Q2FzZXM6IG51bWJlciA9IDExO1xuXG5mdW5jdGlvbiByZWdpc3RlclBhaXJFbmRQb2ludCgpIDogc3RyaW5nIHtcbiAgICByZXR1cm4gcHJvZCA/IFwiaHR0cHM6Ly9saWNvZGUuaW8vcmVnaXN0ZXJQYWlyXCIgOiBcImh0dHA6Ly9sb2NhbGhvc3Q6NTAwMC9yZWdpc3RlclBhaXJcIjtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVUZXN0Q2FzZVN0cmluZyhhbGxUZXN0Q2FzZXM6IHN0cmluZ1tdLCBmb3JtYXQ6IHN0cmluZ1tdLCBqOiBudW1iZXIsIHNob3VsZFByaW50OiBib29sZWFuKSB7XG4gICAgbGV0IHRlc3RDYXNlU3RyaW5nID0gJyc7XG4gICAgbGV0IHRlc3RDYXNlID0gYWxsVGVzdENhc2VzW2pdLnNwbGl0KCc7Jyk7XG4gICAgbGV0IGsgPSAwO1xuICAgIGxldCBtID0gMDtcbiAgICBsZXQgbU1heCA9IDA7XG4gICAgbGV0IG4gPSAwO1xuICAgIGxldCBuTWF4ID0gMDtcbiAgICBsZXQgaW5zaWRlQXJyYXkgPSBmYWxzZTtcbiAgICBsZXQgaW5zaWRlQXJyYXlBcnJheSA9IGZhbHNlO1xuICAgIGlmIChzaG91bGRQcmludCkgeyBjb25zb2xlLmxvZyhcIk9VVFBVVE9VVFBVVE9VVFBVVE9VVFBVVE9VVFBVVE9VVFBVVE9VVFBVVE9VVFBVVE9VVFBVVFwiKTsgfVxuICAgIGZvciAobGV0IGwgPSAwOyBsIDwgdGVzdENhc2UubGVuZ3RoOyArK2wpIHtcbiAgICAgICAgaWYgKHNob3VsZFByaW50KSB7IGNvbnNvbGUubG9nKFwiTFwiICsgbC50b1N0cmluZygpICsgXCJMXCIpOyBjb25zb2xlLmxvZyhcIkxJXCIgKyB0ZXN0Q2FzZVtsXSArIFwiTElcIik7IH1cbiAgICAgICAgaWYgKGZvcm1hdFtrXSA9PSAnbicpIHtcbiAgICAgICAgICAgIGlmIChzaG91bGRQcmludCkgeyBjb25zb2xlLmxvZyhcIktcIiArIGsudG9TdHJpbmcoKSArIFwiS1wiKTsgfVxuICAgICAgICAgICAgdGVzdENhc2VTdHJpbmcgKz0gdGVzdENhc2VbbF0gKyAnXFxuJztcbiAgICAgICAgICAgICsraztcbiAgICAgICAgfSBlbHNlIGlmIChmb3JtYXRba10gPT0gJ2EnKSB7XG4gICAgICAgICAgICBpZiAoaW5zaWRlQXJyYXkpIHtcbiAgICAgICAgICAgICAgICBpZiAobSA8IG1NYXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNob3VsZFByaW50KSB7IGNvbnNvbGUubG9nKFwiTVwiICsgbS50b1N0cmluZygpICsgXCJNXCIpOyB9XG4gICAgICAgICAgICAgICAgICAgIHRlc3RDYXNlU3RyaW5nICs9IHRlc3RDYXNlW2xdICsgJ1xcbic7XG4gICAgICAgICAgICAgICAgICAgICsrbTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2hvdWxkUHJpbnQpIHsgY29uc29sZS5sb2coXCJLS1wiICsgay50b1N0cmluZygpICsgXCJLS1wiKTsgfVxuICAgICAgICAgICAgICAgICAgICBpbnNpZGVBcnJheSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICArK2s7XG4gICAgICAgICAgICAgICAgICAgIC0tbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChzaG91bGRQcmludCkgeyBjb25zb2xlLmxvZyhcIk1NXCIgKyBtLnRvU3RyaW5nKCkgKyBcIk1NXCIpOyB9XG4gICAgICAgICAgICAgICAgdGVzdENhc2VTdHJpbmcgKz0gdGVzdENhc2VbbF0gKyAnXFxuJztcbiAgICAgICAgICAgICAgICBtID0gMDtcbiAgICAgICAgICAgICAgICBtTWF4ID0gcGFyc2VJbnQodGVzdENhc2VbbF0pO1xuICAgICAgICAgICAgICAgIGluc2lkZUFycmF5ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChmb3JtYXRba10gPT0gJ2FhJykge1xuICAgICAgICAgICAgaWYgKGluc2lkZUFycmF5KSB7XG4gICAgICAgICAgICAgICAgaWYgKG0gPCBtTWF4KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnNpZGVBcnJheUFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobiA8IG5NYXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2hvdWxkUHJpbnQpIHsgY29uc29sZS5sb2coXCJOXCIgKyBuLnRvU3RyaW5nKCkgKyBcIk5cIik7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXN0Q2FzZVN0cmluZyArPSB0ZXN0Q2FzZVtsXSArICdcXG4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNob3VsZFByaW50KSB7IGNvbnNvbGUubG9nKFwiTU1NXCIgKyBtLnRvU3RyaW5nKCkgKyBcIk1NTVwiKTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc2lkZUFycmF5QXJyYXkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArK207XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLS1sO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNob3VsZFByaW50KSB7IGNvbnNvbGUubG9nKFwiTk5cIiArIG4udG9TdHJpbmcoKSArIFwiTk5cIik7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRlc3RDYXNlU3RyaW5nICs9IHRlc3RDYXNlW2xdICsgJ1xcbic7XG4gICAgICAgICAgICAgICAgICAgICAgICBuID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5NYXggPSBwYXJzZUludCh0ZXN0Q2FzZVtsXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnNpZGVBcnJheUFycmF5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzaG91bGRQcmludCkgeyBjb25zb2xlLmxvZyhcIktLS1wiICsgay50b1N0cmluZygpICsgXCJLS0tcIik7IH1cbiAgICAgICAgICAgICAgICAgICAgaW5zaWRlQXJyYXkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgKytrO1xuICAgICAgICAgICAgICAgICAgICAtLWw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoc2hvdWxkUHJpbnQpIHsgY29uc29sZS5sb2coXCJNTU1NXCIgKyBtLnRvU3RyaW5nKCkgKyBcIk1NTU1cIik7IH1cbiAgICAgICAgICAgICAgICB0ZXN0Q2FzZVN0cmluZyArPSB0ZXN0Q2FzZVtsXSArICdcXG4nO1xuICAgICAgICAgICAgICAgIG0gPSAwO1xuICAgICAgICAgICAgICAgIG1NYXggPSBwYXJzZUludCh0ZXN0Q2FzZVtsXSk7XG4gICAgICAgICAgICAgICAgaW5zaWRlQXJyYXkgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChzaG91bGRQcmludCkgeyBjb25zb2xlLmxvZyhcIkVORFBVVEVORFBVVEVORFBVVEVORFBVVEVORFBVVEVORFBVVEVORFBVVEVORFBVVEVORFBVVFwiKTsgfVxuICAgIGlmIChzaG91bGRQcmludCkgeyBjb25zb2xlLmxvZyhcIkRFQlBVVERFQlBVVERFQlBVVERFQlBVVERFQlBVVERFQlBVVERFQlBVVERFQlBVVERFQlBVVFwiKTsgfVxuICAgIGlmIChzaG91bGRQcmludCkgeyBjb25zb2xlLmxvZyh0ZXN0Q2FzZVN0cmluZyk7IH1cbiAgICBpZiAoc2hvdWxkUHJpbnQpIHsgY29uc29sZS5sb2coXCJGSU5QVVRGSU5QVVRGSU5QVVRGSU5QVVRGSU5QVVRGSU5QVVRGSU5QVVRGSU5QVVRGSU5QVVRcIik7IH1cbiAgICByZXR1cm4gdGVzdENhc2VTdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlU3R1YlN0cmluZyhpbnB1dEZvcm1hdDogc3RyaW5nW10sIG91dHB1dEZvcm1hdDogc3RyaW5nW10sIGZ1bmN0aW9uU2lnbmF0dXJlOiBzdHJpbmcsIG5vcm1hbFN0dWI6IGJvb2xlYW4pIHtcbiAgICBsZXQgc3R1YlN0cmluZyA9ICdcXG5cXG5pbXBvcnQgc3lzXFxuXFxuaWYgX19uYW1lX18gPT0gXCJfX21haW5fX1wiOlxcbic7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dEZvcm1hdC5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAoaW5wdXRGb3JtYXRbaV0gPT0gJ24nKSB7XG4gICAgICAgICAgICBzdHViU3RyaW5nICs9ICcgICAgcCcgKyBpLnRvU3RyaW5nKCkgKyAnID0gaW50KGlucHV0KCkpXFxuICAgIHByaW50KFwiR1wiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICBwcmludChwJyArIGkudG9TdHJpbmcoKSArICcsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgIHByaW50KFwiSFwiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbic7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5wdXRGb3JtYXRbaV0gPT0gJ2EnKSB7XG4gICAgICAgICAgICBzdHViU3RyaW5nICs9ICcgICAgbicgKyBpLnRvU3RyaW5nKCkgKyAnID0gaW50KGlucHV0KCkpXFxuICAgIHByaW50KFwiR1wiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICBwcmludChuJyArIGkudG9TdHJpbmcoKSArICcsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgIHByaW50KFwiSFwiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICBwJyArIGkudG9TdHJpbmcoKSArICcgPSBbXVxcbiAgICBmb3IgaSBpbiByYW5nZShuJyArIGkudG9TdHJpbmcoKSArICcpOlxcbiAgICAgICAgZ2ggPSBpbnQoaW5wdXQoKSlcXG4gICAgICAgIHByaW50KFwiR1wiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICAgICAgcHJpbnQoZ2gsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgICAgICBwcmludChcIkhcIiwgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgICAgIHAnICsgaS50b1N0cmluZygpICsgJy5hcHBlbmQoZ2gpXFxuJztcbiAgICAgICAgfSBlbHNlIGlmIChpbnB1dEZvcm1hdFtpXSA9PSAnYWEnKSB7XG4gICAgICAgICAgICBzdHViU3RyaW5nICs9ICcgICAgbicgKyBpLnRvU3RyaW5nKCkgKyAnID0gaW50KGlucHV0KCkpXFxuICAgIHAnICsgaS50b1N0cmluZygpICsgJyA9IFtdXFxuICAgIGZvciBpIGluIHJhbmdlKG4nICsgaS50b1N0cmluZygpICsgJyk6XFxuICAgICAgICBubicgKyBpLnRvU3RyaW5nKCkgKyAnID0gaW50KGlucHV0KCkpXFxuICAgICAgICBwcCcgKyBpLnRvU3RyaW5nKCkgKyAnID0gW11cXG4gICAgICAgIGZvciBqIGluIHJhbmdlKG5uJyArIGkudG9TdHJpbmcoKSArICcpOlxcbiAgICAgICAgICAgIHBwJyArIGkudG9TdHJpbmcoKSArICcuYXBwZW5kKGludChpbnB1dCgpKSlcXG4gICAgICAgIHAnICsgaS50b1N0cmluZygpICsgJy5hcHBlbmQocHAnICsgaS50b1N0cmluZygpICsgJylcXG4nO1xuICAgICAgICB9XG4gICAgfVxuICAgIHN0dWJTdHJpbmcgKz0gJyAgICByZXN1bHQgPSAnICsgZnVuY3Rpb25TaWduYXR1cmUuc3BsaXQoJygnKVswXS5zcGxpdCgnZGVmICcpWzFdICsgJygnO1xuICAgIGlmIChpbnB1dEZvcm1hdC5sZW5ndGggPiAwKSB7XG4gICAgICAgIHN0dWJTdHJpbmcgKz0gJ3AwJztcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBpbnB1dEZvcm1hdC5sZW5ndGg7ICsraSkge1xuICAgICAgICBzdHViU3RyaW5nICs9ICcsIHAnICsgaS50b1N0cmluZygpXG4gICAgfVxuICAgIHN0dWJTdHJpbmcgKz0gJylcXG4nO1xuICAgIGlmIChub3JtYWxTdHViKSB7XG4gICAgICAgIHN0dWJTdHJpbmcgKz0gJyAgICBwcmludChcInYxMHpnNTdaSVVGNnZqWmdTUGFEWTcwVFFmZjh3VEhYZ29kWDJvdHJETUVheTBXbFMzNk1qRGhISDA1NHVSckZ4R0hIU2VndkdjQTdlYXFCXCIpXFxuJ1xuICAgICAgICBpZiAob3V0cHV0Rm9ybWF0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGlmIChvdXRwdXRGb3JtYXRbMF0gPT0gJ24nKSB7XG4gICAgICAgICAgICAgICAgc3R1YlN0cmluZyArPSAnICAgIHByaW50KHJlc3VsdClcXG4nO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRGb3JtYXRbMF0gPT0gJ2EnKSB7XG4gICAgICAgICAgICAgICAgc3R1YlN0cmluZyArPSAnICAgIHByaW50KGxlbihyZXN1bHQpKVxcbiAgICBmb3IgciBpbiByZXN1bHQ6XFxuICAgICAgICBwcmludChyKVxcbic7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG91dHB1dEZvcm1hdFswXSA9PSAnYWEnKSB7XG4gICAgICAgICAgICAgICAgc3R1YlN0cmluZyArPSAnICAgIHByaW50KGxlbihyZXN1bHQpKVxcbiAgICBmb3IgciBpbiByZXN1bHQ6XFxuICAgICAgICBwcmludChsZW4ocikpXFxuICAgICAgICBmb3IgcnIgaW4gcjpcXG4gICAgICAgICAgICBwcmludChycilcXG4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdHViU3RyaW5nO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUNsZWFuU3RyaW5nKG91dHB1dEZvcm1hdDogc3RyaW5nW10sIG5vcm1hbENsZWFuOiBib29sZWFuKSB7XG4gICAgbGV0IGNsZWFuU3RyaW5nID0gJyc7XG4gICAgaWYgKG91dHB1dEZvcm1hdFswXSAhPSAnYWEnKSB7XG4gICAgICAgIGNsZWFuU3RyaW5nICs9ICdpbXBvcnQgc3lzXFxuXFxuaWYgX19uYW1lX18gPT0gXCJfX21haW5fX1wiOlxcbic7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY2xlYW5TdHJpbmcgKz0gJ2ltcG9ydCBzeXNcXG5pbXBvcnQgZnVuY3Rvb2xzXFxuXFxuZGVmIGNvbXBhcmVObnMoeCwgeSk6XFxuICAgIGlmIHhbMF0gPiB5WzBdOlxcbiAgICAgICAgcmV0dXJuIDFcXG4gICAgZWxpZiB4WzBdIDwgeVswXTpcXG4gICAgICAgIHJldHVybiAtMVxcbiAgICBlbHNlOlxcbiAgICAgICAgZm9yIGkgaW4gcmFuZ2UoeFswXSk6XFxuICAgICAgICAgICAgaWYgeFsxXVtpXSA+IHlbMV1baV06XFxuICAgICAgICAgICAgICAgIHJldHVybiAxXFxuICAgICAgICAgICAgaWYgeFsxXVtpXSA8IHlbMV1baV06XFxuICAgICAgICAgICAgICAgIHJldHVybiAtMVxcbiAgICByZXR1cm4gMFxcblxcbmlmIF9fbmFtZV9fID09IFwiX19tYWluX19cIjpcXG4nO1xuICAgIH1cbiAgICBpZiAobm9ybWFsQ2xlYW4pIHtcbiAgICAgICAgY2xlYW5TdHJpbmcgKz0gJyAgICB3aGlsZSBUcnVlOlxcbiAgICAgICAgdHJ5SW5wdXQgPSBpbnB1dCgpXFxuICAgICAgICBwcmludChcIk9LXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgICAgICBwcmludCh0cnlJbnB1dCwgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgICAgIHByaW50KFwiUExcIiwgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgICAgIGlmICh0cnlJbnB1dCA9PSBcInYxMHpnNTdaSVVGNnZqWmdTUGFEWTcwVFFmZjh3VEhYZ29kWDJvdHJETUVheTBXbFMzNk1qRGhISDA1NHVSckZ4R0hIU2VndkdjQTdlYXFCXCIpOlxcbiAgICAgICAgICAgIGJyZWFrXFxuJztcbiAgICB9XG4gICAgaWYgKG91dHB1dEZvcm1hdC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGlmIChvdXRwdXRGb3JtYXRbMF0gPT0gJ24nKSB7XG4gICAgICAgICAgICBjbGVhblN0cmluZyArPSAnICAgIHF3ID0gaW5wdXQoKVxcbiAgICBwcmludChcIlFcIiwgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgcHJpbnQocXcsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgIHByaW50KFwiV1wiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICBwcmludChxdylcXG4nO1xuICAgICAgICB9IGVsc2UgaWYgKG91dHB1dEZvcm1hdFswXSA9PSAnYScpIHtcbiAgICAgICAgICAgIGNsZWFuU3RyaW5nICs9ICcgICAgbiA9IGludChpbnB1dCgpKVxcbiAgICBwcmludChcIlFcIiwgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgcHJpbnQobiwgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgcHJpbnQoXCJXXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgIG51bXMgPSBbXVxcbiAgICBmb3IgaSBpbiByYW5nZShuKTpcXG4gICAgICAgIHF3ID0gaW50KGlucHV0KCkpXFxuICAgICAgICBwcmludChcIlFcIiwgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgICAgIHByaW50KHF3LCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICAgICAgcHJpbnQoXCJXXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgICAgICBudW1zLmFwcGVuZChxdylcXG4gICAgbnVtcy5zb3J0KClcXG4gICAgcHJpbnQobilcXG4gICAgZm9yIGkgaW4gcmFuZ2Uobik6XFxuICAgICAgICBwcmludChudW1zW2ldKSc7XG4gICAgICAgIH0gZWxzZSBpZiAob3V0cHV0Rm9ybWF0WzBdID09ICdhYScpIHtcbiAgICAgICAgICAgIGNsZWFuU3RyaW5nICs9ICcgICAgbiA9IGludChpbnB1dCgpKVxcbiAgICBwcmludChcIlFcIiwgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgcHJpbnQobiwgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgcHJpbnQoXCJXXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgIG5ucyA9IFtdXFxuICAgIG51bXMgPSBbXVxcbiAgICBmb3IgaSBpbiByYW5nZShuKTpcXG4gICAgICAgIG5uID0gaW50KGlucHV0KCkpXFxuICAgICAgICBwcmludChcIlFcIiwgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgICAgIHByaW50KG5uLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICAgICAgcHJpbnQoXCJXXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgICAgICBubnMgPSBubnMuY29weSgpXFxuICAgICAgICBubnMgPSBbXVxcbiAgICAgICAgbm5zLmFwcGVuZChubilcXG4gICAgICAgIG5udW1zID0gW11cXG4gICAgICAgIGZvciBqIGluIHJhbmdlKG5uKTpcXG4gICAgICAgICAgICBxdyA9IGludChpbnB1dCgpKVxcbiAgICAgICAgICAgIHByaW50KFwiUVwiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICAgICAgICAgIHByaW50KHF3LCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICAgICAgICAgIHByaW50KFwiV1wiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICAgICAgICAgIG5udW1zLmFwcGVuZChxdylcXG4gICAgICAgIG5udW1zLnNvcnQoKVxcbiAgICAgICAgbm5zLmFwcGVuZChubnVtcylcXG4gICAgICAgIG51bXMuYXBwZW5kKG5ucylcXG4gICAgbnVtcy5zb3J0KGtleSA9IGZ1bmN0b29scy5jbXBfdG9fa2V5KGNvbXBhcmVObnMpKVxcbiAgICBwcmludChuKVxcbiAgICBmb3IgaSBpbiByYW5nZShuKTpcXG4gICAgICAgIHByaW50KG51bXNbaV1bMF0pXFxuICAgICAgICBmb3IgaiBpbiByYW5nZShsZW4obnVtc1tpXVsxXSkpOlxcbiAgICAgICAgICAgIHByaW50KG51bXNbaV1bMV1bal0pXFxuJztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2xlYW5TdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlTWFrZVJlcG9ydFN0cmluZyhpOiBudW1iZXIpIHtcbiAgICAvL3JldHVybiAnIyEvYmluL2Jhc2hcXG5cXG4oY2F0IHN0dWIucHkpID4+IGFuc3dlci5weVxcbihjYXQgc3R1YkN1c3RvbUlucHV0LnB5KSA+PiBhbnN3ZXJDdXN0b21JbnB1dC5weVxcblxcbmNvbnRhaW5lcklEPSQoZG9ja2VyIHJ1biAtZGl0IHB5LXNhbmRib3gpXFxuZG9ja2VyIGNwIFRlc3RJbnB1dHMvICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L1Rlc3RJbnB1dHMvXFxuZG9ja2VyIGNwIFRlc3RPdXRwdXRzLyAke2NvbnRhaW5lcklEfTpob21lL1Rlc3RFbnZpcm9ubWVudC9UZXN0T3V0cHV0cy9cXG5kb2NrZXIgY3AgYW5zd2VyLnB5ICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L2Fuc3dlci5weVxcbmRvY2tlciBjcCBjdXN0b21JbnB1dC5pbiAke2NvbnRhaW5lcklEfTpob21lL1Rlc3RFbnZpcm9ubWVudC9jdXN0b21JbnB1dC5pblxcbmRvY2tlciBjcCBhbnN3ZXJDdXN0b21JbnB1dC5weSAke2NvbnRhaW5lcklEfTpob21lL1Rlc3RFbnZpcm9ubWVudC9hbnN3ZXJDdXN0b21JbnB1dC5weVxcbmRvY2tlciBjcCBjbGVhbi5weSAke2NvbnRhaW5lcklEfTpob21lL1Rlc3RFbnZpcm9ubWVudC9jbGVhbi5weVxcblxcbmRvY2tlciBleGVjICR7Y29udGFpbmVySUR9IHNoIC1jIFwiY2QgaG9tZS9UZXN0RW52aXJvbm1lbnQvICYmIHRpbWVvdXQgMTAgLi9tYWtlUmVwb3J0LnNoXCJcXG5cXG5kb2NrZXIgY3AgJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvcmVwb3J0LnR4dCByZXBvcnRGcm9tUHlTYW5kYm94LnR4dFxcbmRvY2tlciBjcCAke2NvbnRhaW5lcklEfTpob21lL1Rlc3RFbnZpcm9ubWVudC9zdGFuZGFyZE91dHB1dC50eHQgc3RhbmRhcmRPdXRwdXRGcm9tUHlTYW5kYm94LnR4dFxcbmRvY2tlciBjcCAke2NvbnRhaW5lcklEfTpob21lL1Rlc3RFbnZpcm9ubWVudC9vdXRwdXQudHh0IG91dHB1dEZyb21QeVNhbmRib3gudHh0XFxuXFxuZG9ja2VyIGtpbGwgJHtjb250YWluZXJJRH1cXG5cXG5kb2NrZXIgcm0gJHtjb250YWluZXJJRH1cXG5cXG4nO1xuICAgIHJldHVybiAnIyEvYmluL2Jhc2hcXG5cXG4oY2F0IHN0dWIucHkpID4+IC4uL2Fuc3dlci5weVxcbihjYXQgc3R1YkN1c3RvbUlucHV0LnB5KSA+PiAuLi9hbnN3ZXJDdXN0b21JbnB1dC5weVxcblxcbmNvbnRhaW5lcklEPSQoZG9ja2VyIHJ1biAtZGl0IHB5LXNhbmRib3gpXFxuZG9ja2VyIGNwIFRlc3RJbnB1dHMvICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L1Rlc3RJbnB1dHMvXFxuZG9ja2VyIGNwIFRlc3RPdXRwdXRzLyAke2NvbnRhaW5lcklEfTpob21lL1Rlc3RFbnZpcm9ubWVudC9UZXN0T3V0cHV0cy9cXG5kb2NrZXIgY3AgLi4vYW5zd2VyLnB5ICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L2Fuc3dlci5weVxcbmRvY2tlciBjcCAuLi9jdXN0b21JbnB1dC5pbiAke2NvbnRhaW5lcklEfTpob21lL1Rlc3RFbnZpcm9ubWVudC9jdXN0b21JbnB1dC5pblxcbmRvY2tlciBjcCAuLi9hbnN3ZXJDdXN0b21JbnB1dC5weSAke2NvbnRhaW5lcklEfTpob21lL1Rlc3RFbnZpcm9ubWVudC9hbnN3ZXJDdXN0b21JbnB1dC5weVxcbmRvY2tlciBjcCBjbGVhbi5weSAke2NvbnRhaW5lcklEfTpob21lL1Rlc3RFbnZpcm9ubWVudC9jbGVhbi5weVxcbmRvY2tlciBjcCBjbGVhbk91dHB1dC5weSAke2NvbnRhaW5lcklEfTpob21lL1Rlc3RFbnZpcm9ubWVudC9jbGVhbk91dHB1dC5weVxcblxcbmRvY2tlciBleGVjICR7Y29udGFpbmVySUR9IHNoIC1jIFwiY2QgaG9tZS9UZXN0RW52aXJvbm1lbnQvICYmIHRpbWVvdXQgMTAgLi9tYWtlUmVwb3J0LnNoXCJcXG5cXG5kb2NrZXIgY3AgJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvcmVwb3J0LnR4dCAuLi9yZXBvcnRGcm9tUHlTYW5kYm94LnR4dFxcbmRvY2tlciBjcCAke2NvbnRhaW5lcklEfTpob21lL1Rlc3RFbnZpcm9ubWVudC9zdGFuZGFyZE91dHB1dC50eHQgLi4vc3RhbmRhcmRPdXRwdXRGcm9tUHlTYW5kYm94LnR4dFxcbmRvY2tlciBjcCAke2NvbnRhaW5lcklEfTpob21lL1Rlc3RFbnZpcm9ubWVudC9vdXRwdXQudHh0IC4uL291dHB1dEZyb21QeVNhbmRib3gudHh0XFxuXFxuZG9ja2VyIGtpbGwgJHtjb250YWluZXJJRH1cXG5cXG5kb2NrZXIgcm0gJHtjb250YWluZXJJRH1cXG5cXG4nO1xufVxuXG5hc3luYyBmdW5jdGlvbiBsb2FkVGVzdENhc2VzKCkge1xuICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgY29uc3QgcXVlc3Rpb25zUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgY291bnQoKikgZnJvbSBxdWVzdGlvbnNcIik7XG4gICAgbGV0IG51bVF1ZXN0aW9ucyA9IE51bWJlcihxdWVzdGlvbnNSZXN1bHQucm93c1swXVswXSBhcyBudW1iZXIpO1xuICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAxOyBpIDw9IG51bVF1ZXN0aW9uczsgKytpKSB7XG4gICAgICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgZnVuY3Rpb25fc2lnbmF0dXJlLCBpbnB1dF9vdXRwdXRfZm9ybWF0LCB0ZXN0X2Nhc2VzIGZyb20gcXVlc3Rpb25zIHdoZXJlIGlkID0gXCIgKyBpLnRvU3RyaW5nKCkpO1xuICAgICAgICBsZXQgZnVuY3Rpb25TaWduYXR1cmU6IHN0cmluZyA9IHNlbGVjdGVkUmVzdWx0LnJvd3NbMF1bMF0gYXMgc3RyaW5nO1xuICAgICAgICBsZXQgaW5wdXRPdXRwdXRGb3JtYXQgPSBzZWxlY3RlZFJlc3VsdC5yb3dzWzBdWzFdIGFzIHN0cmluZztcbiAgICAgICAgbGV0IHRlc3RDYXNlcyA9IHNlbGVjdGVkUmVzdWx0LnJvd3NbMF1bMl0gYXMgc3RyaW5nO1xuICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgIGxldCBpbnB1dE91dHB1dEZvcm1hdHMgPSBpbnB1dE91dHB1dEZvcm1hdC5zcGxpdCgnfCcpO1xuICAgICAgICBsZXQgaW5wdXRGb3JtYXQ6IHN0cmluZ1tdID0gaW5wdXRPdXRwdXRGb3JtYXRzWzBdLnNwbGl0KCc7Jyk7XG4gICAgICAgIGlucHV0Rm9ybWF0LnNoaWZ0KCk7XG4gICAgICAgIGxldCBvdXRwdXRGb3JtYXQ6IHN0cmluZ1tdID0gaW5wdXRPdXRwdXRGb3JtYXRzWzFdLnNwbGl0KCc7Jyk7XG4gICAgICAgIG91dHB1dEZvcm1hdC5zaGlmdCgpO1xuICAgICAgICBsZXQgYWxsVGVzdENhc2VzOiBzdHJpbmdbXSA9IHRlc3RDYXNlcy5zcGxpdCgnfCcpO1xuICAgICAgICBmb3IgKGxldCBqOiBudW1iZXIgPSAwOyBqIDwgbnVtVGVzdENhc2VzOyArK2opIHtcbiAgICAgICAgICAgIGF3YWl0IGVuc3VyZURpcihcIi4vc2FuZGJveC9cIiArIGkudG9TdHJpbmcoKSArIFwiL1Rlc3RJbnB1dHMvXCIpO1xuICAgICAgICAgICAgYXdhaXQgZW5zdXJlRGlyKFwiLi9zYW5kYm94L1wiICsgaS50b1N0cmluZygpICsgXCIvVGVzdE91dHB1dHMvXCIpO1xuICAgICAgICAgICAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKFwiLi9zYW5kYm94L1wiICsgaS50b1N0cmluZygpICsgXCIvVGVzdElucHV0cy90ZXN0XCIgKyAoaiArIDEpLnRvU3RyaW5nKCkgKyBcIi5pblwiLFxuICAgICAgICAgICAgICAgIGdlbmVyYXRlVGVzdENhc2VTdHJpbmcoYWxsVGVzdENhc2VzLCBpbnB1dEZvcm1hdCwgaiwgLyppID09IDIgJiYgaiA9PSAwKi9mYWxzZSkpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzZWNvbmRIYWxmVGhyZXNob2xkID0gMiAqIG51bVRlc3RDYXNlcztcbiAgICAgICAgZm9yIChsZXQgaiA9IDExOyBqIDwgc2Vjb25kSGFsZlRocmVzaG9sZDsgKytqKSB7XG4gICAgICAgICAgICBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoXCIuL3NhbmRib3gvXCIgKyBpLnRvU3RyaW5nKCkgKyBcIi9UZXN0T3V0cHV0cy90ZXN0XCIgKyAoaiAtIDEwKS50b1N0cmluZygpICsgXCIub3V0XCIsXG4gICAgICAgICAgICAgICAgZ2VuZXJhdGVUZXN0Q2FzZVN0cmluZyhhbGxUZXN0Q2FzZXMsIG91dHB1dEZvcm1hdCwgaiwgZmFsc2UpKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoXCIuL3NhbmRib3gvXCIgKyBpLnRvU3RyaW5nKCkgKyBcIi9zdHViLnB5XCIsIGdlbmVyYXRlU3R1YlN0cmluZyhpbnB1dEZvcm1hdCwgb3V0cHV0Rm9ybWF0LFxuICAgICAgICAgICAgZnVuY3Rpb25TaWduYXR1cmUsIHRydWUpKTtcbiAgICAgICAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKFwiLi9zYW5kYm94L1wiICsgaS50b1N0cmluZygpICsgXCIvc3R1YkN1c3RvbUlucHV0LnB5XCIsIGdlbmVyYXRlU3R1YlN0cmluZyhpbnB1dEZvcm1hdCwgb3V0cHV0Rm9ybWF0LFxuICAgICAgICAgICAgZnVuY3Rpb25TaWduYXR1cmUsIGZhbHNlKSk7XG4gICAgICAgIGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZShcIi4vc2FuZGJveC9cIiArIGkudG9TdHJpbmcoKSArIFwiL2NsZWFuLnB5XCIsIGdlbmVyYXRlQ2xlYW5TdHJpbmcob3V0cHV0Rm9ybWF0LCB0cnVlKSk7XG4gICAgICAgIGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZShcIi4vc2FuZGJveC9cIiArIGkudG9TdHJpbmcoKSArIFwiL2NsZWFuT3V0cHV0LnB5XCIsIGdlbmVyYXRlQ2xlYW5TdHJpbmcob3V0cHV0Rm9ybWF0LCBmYWxzZSkpO1xuICAgICAgICBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoXCIuL3NhbmRib3gvXCIgKyBpLnRvU3RyaW5nKCkgKyBcIi9tYWtlUmVwb3J0LnNoXCIsIGdlbmVyYXRlTWFrZVJlcG9ydFN0cmluZyhpKSk7XG4gICAgICAgIGF3YWl0IERlbm8ucnVuKHtcbiAgICAgICAgICAgIGNtZDogW1wiY2htb2RcIiwgXCJ1K3hcIiwgXCJtYWtlUmVwb3J0LnNoXCJdLFxuICAgICAgICAgICAgY3dkOiBcIi4vc2FuZGJveC9cIiArIGkudG9TdHJpbmcoKVxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmxvYWRUZXN0Q2FzZXMoKTtcblxuZnVuY3Rpb24gZGVsYXkodGltZTogbnVtYmVyKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCB0aW1lKSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNlbGVjdFF1ZXN0aW9ucyhtYXRjaG1ha2luZ1VzZXI6IE1hdGNobWFraW5nVXNlcikge1xuICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgY29uc3QgcXVlc3Rpb25zUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgY291bnQoKikgZnJvbSBxdWVzdGlvbnNcIik7XG4gICAgbGV0IG51bVF1ZXN0aW9ucyA9IE51bWJlcihxdWVzdGlvbnNSZXN1bHQucm93c1swXVswXSBhcyBudW1iZXIpO1xuICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICBsZXQgcXVlc3Rpb25zU2VsZWN0ZWQ6IG51bWJlcltdID0gW107XG4gICAgbGV0IHJhbmRvbVBlcm11dGF0aW9uOiBudW1iZXJbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtUXVlc3Rpb25zOyArK2kpIHtcbiAgICAgICAgcmFuZG9tUGVybXV0YXRpb25baV0gPSBpO1xuICAgIH1cbiAgICAvLyBQYXJ0aWFsIEZpc2hlci1ZYXRlcyBBbGdvcml0aG0gZm9yIHJhbmRvbSBzZWxlY3Rpb24gb2YgcXVlc3Rpb25zXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1RdWVzdGlvbnNQZXJNYXRjaDsgKytpKSB7XG4gICAgICAgIGxldCBqID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbnVtUXVlc3Rpb25zKTtcbiAgICAgICAgW3JhbmRvbVBlcm11dGF0aW9uW2ldLCByYW5kb21QZXJtdXRhdGlvbltqXV0gPSBbcmFuZG9tUGVybXV0YXRpb25bal0sIHJhbmRvbVBlcm11dGF0aW9uW2ldXTtcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1RdWVzdGlvbnNQZXJNYXRjaDsgKytpKSB7XG4gICAgICAgIHF1ZXN0aW9uc1NlbGVjdGVkLnB1c2gocmFuZG9tUGVybXV0YXRpb25baV0gKyAxKTtcbiAgICB9XG4gICAgbGV0IHF1ZXN0aW9uc0luZm9ybWF0aW9uOiBRdWVzdGlvbkluZm9ybWF0aW9uW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHF1ZXN0aW9uc1NlbGVjdGVkLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGxldCBpbnB1dE91dHB1dEZvcm1hdCA9ICcnO1xuICAgICAgICBmb3IgKDs7KSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2VsZWN0ZWRSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBpbnB1dF9vdXRwdXRfZm9ybWF0IGZyb20gcXVlc3Rpb25zIHdoZXJlIGlkID0gXCJcbiAgICAgICAgICAgICAgICAgICAgKyBxdWVzdGlvbnNTZWxlY3RlZFtpXS50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJSUlwiKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhxdWVzdGlvbnNTZWxlY3RlZFtpXS50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlFRUVwiKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzZWxlY3RlZFJlc3VsdCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJXV1dcIik7XG4gICAgICAgICAgICAgICAgaW5wdXRPdXRwdXRGb3JtYXQgPSBzZWxlY3RlZFJlc3VsdC5yb3dzWzBdWzBdIGFzIHN0cmluZztcbiAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgaW5wdXRPdXRwdXRGb3JtYXRzID0gaW5wdXRPdXRwdXRGb3JtYXQuc3BsaXQoJ3wnKTtcbiAgICAgICAgbGV0IGlucHV0Rm9ybWF0OiBzdHJpbmdbXSA9IGlucHV0T3V0cHV0Rm9ybWF0c1swXS5zcGxpdCgnOycpO1xuICAgICAgICBpbnB1dEZvcm1hdC5zaGlmdCgpO1xuICAgICAgICBsZXQgb3V0cHV0Rm9ybWF0OiBzdHJpbmdbXSA9IGlucHV0T3V0cHV0Rm9ybWF0c1sxXS5zcGxpdCgnOycpO1xuICAgICAgICBvdXRwdXRGb3JtYXQuc2hpZnQoKTtcbiAgICAgICAgbGV0IHF1ZXN0aW9uSW5mb3JtYXRpb246IFF1ZXN0aW9uSW5mb3JtYXRpb24gPSB7IHF1ZXN0aW9uSWQ6IHF1ZXN0aW9uc1NlbGVjdGVkW2ldLCBpbnB1dEZvcm1hdDogaW5wdXRGb3JtYXQsIG91dHB1dEZvcm1hdDogb3V0cHV0Rm9ybWF0IH07XG4gICAgICAgIHF1ZXN0aW9uc0luZm9ybWF0aW9uLnB1c2gocXVlc3Rpb25JbmZvcm1hdGlvbik7XG4gICAgfVxuICAgIHNpZHNRdWVzdGlvbnNbbWF0Y2htYWtpbmdVc2VyLnNpZF0gPSBxdWVzdGlvbnNJbmZvcm1hdGlvbjtcbiAgICBzaWRzUXVlc3Rpb25zW21hdGNoZXNbbWF0Y2htYWtpbmdVc2VyLnNpZF1dID0gcXVlc3Rpb25zSW5mb3JtYXRpb247XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGFkZFRvUXVldWUgKHF1ZXVlOiBNYXRjaG1ha2luZ1VzZXJbXSwgbWF0Y2htYWtpbmdVc2VyOiBNYXRjaG1ha2luZ1VzZXIsIHJhbmdlOiBudW1iZXIsIGNvbnRleHQ6IGFueSkge1xuICAgIHF1ZXVlLnB1c2gobWF0Y2htYWtpbmdVc2VyKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHF1ZXVlLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChxdWV1ZVtpXS5zaWQgIT0gbWF0Y2htYWtpbmdVc2VyLnNpZFxuICAgICAgICAgICAgICAgICYmIE1hdGguYWJzKG1hdGNobWFraW5nVXNlci5lbG9SYXRpbmcgLSBxdWV1ZVtpXS5lbG9SYXRpbmcpIDw9IHJhbmdlKSB7XG4gICAgICAgICAgICBtYXRjaGVzW3F1ZXVlW2ldLnNpZF0gPSBtYXRjaG1ha2luZ1VzZXIuc2lkO1xuICAgICAgICAgICAgbWF0Y2hlc1ttYXRjaG1ha2luZ1VzZXIuc2lkXSA9IHF1ZXVlW2ldLnNpZDtcbiAgICAgICAgICAgIHNpZHNQcm9ncmVzc1txdWV1ZVtpXS5zaWRdID0gMDtcbiAgICAgICAgICAgIHNpZHNQcm9ncmVzc1ttYXRjaG1ha2luZ1VzZXIuc2lkXSA9IDA7XG4gICAgICAgICAgICAvL2NhbiBjYWxsIGdvU2VydmVyL3JlZ2lzdGVyUGFpciBoZXJlXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImF0dGVtcHRpbmcgcmVnaXN0ZXIgcGFpciBcIiArIG1hdGNobWFraW5nVXNlci5zaWQgKyBcIiwgXCIgKyBxdWV1ZVtpXS5zaWQpXG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHJlZ2lzdGVyUGFpckVuZFBvaW50KCksIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAgICAgSWQxOiBtYXRjaG1ha2luZ1VzZXIuc2lkLFxuICAgICAgICAgICAgICAgICAgICBJZDI6IHF1ZXVlW2ldLnNpZCxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIH0pOyAvL1RPRE8gLSBDaGVjayByZXNwb25zZSBcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlLnN0YXR1cyk7XG4gICAgICAgICAgICAvL2NhbiBwcm9iYWJseSBlbGltaW5hdGUgdGhpcywgbWFpbiBwdXJwb3NlIG9mIHRoaXMgYXBpXG4gICAgICAgICAgICAvL21ldGhvZCBpcyB0byBtYXRjaCB1c2VycyBhbmQgcmVnaXN0ZXIgdGhlbSB3aXRoIHRoZSBnbyBzZXJ2ZXJcbiAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHtcbiAgICAgICAgICAgICAgICB1c2VybmFtZTogc2lkc1ttYXRjaG1ha2luZ1VzZXIuc2lkXSxcbiAgICAgICAgICAgICAgICBlbG9SYXRpbmc6IG1hdGNobWFraW5nVXNlci5lbG9SYXRpbmcsXG4gICAgICAgICAgICAgICAgb3Bwb25lbnRVc2VybmFtZTogc2lkc1txdWV1ZVtpXS5zaWRdLFxuICAgICAgICAgICAgICAgIG9wcG9uZW50RWxvUmF0aW5nOiBxdWV1ZVtpXS5lbG9SYXRpbmcsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcXVldWUuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgcXVldWUucG9wKCk7XG4gICAgICAgICAgICBzZWxlY3RRdWVzdGlvbnMobWF0Y2htYWtpbmdVc2VyKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY2hlY2tJZkZvdW5kSW5RdWV1ZShkZWxheVRpbWU6IG51bWJlciwgbWF0Y2htYWtpbmdVc2VyOiBNYXRjaG1ha2luZ1VzZXIsIHVzZXJuYW1lOiBzdHJpbmcsIGNvbnRleHQ6IGFueSkge1xuICAgIGF3YWl0IGRlbGF5KGRlbGF5VGltZSk7XG4gICAgaWYgKG1hdGNobWFraW5nVXNlci5zaWQgaW4gbWF0Y2hlcykge1xuICAgICAgICBsZXQgb3Bwb25lbnRVc2VybmFtZSA9IHNpZHNbbWF0Y2hlc1ttYXRjaG1ha2luZ1VzZXIuc2lkXV07XG4gICAgICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgICAgIGNvbnN0IHVzZXJuYW1lUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgZWxvX3JhdGluZyBmcm9tIHVzZXJzIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgKyB1c2VybmFtZSArIFwiJ1wiKTtcbiAgICAgICAgbGV0IG9wcG9uZW50RWxvUmF0aW5nID0gdXNlcm5hbWVSZXN1bHQucm93c1swXVswXSBhcyBudW1iZXI7XG4gICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0ge1xuICAgICAgICAgICAgdXNlcm5hbWU6IHNpZHNbbWF0Y2htYWtpbmdVc2VyLnNpZF0sXG4gICAgICAgICAgICBlbG9SYXRpbmc6IG1hdGNobWFraW5nVXNlci5lbG9SYXRpbmcsXG4gICAgICAgICAgICBvcHBvbmVudFVzZXJuYW1lOiBvcHBvbmVudFVzZXJuYW1lLFxuICAgICAgICAgICAgb3Bwb25lbnRFbG9SYXRpbmc6IG9wcG9uZW50RWxvUmF0aW5nLFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiByZW1vdmVGcm9tUXVldWUocXVldWU6IE1hdGNobWFraW5nVXNlcltdLCBzaWQ6IHN0cmluZykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcXVldWUubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKHF1ZXVlW2ldLnNpZCA9PT0gc2lkKSB7XG4gICAgICAgICAgICBxdWV1ZS5zcGxpY2UoaSwgMSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNvbnN0IHBvcnQ6IG51bWJlciA9ICtlbnYuTElDT0RFX1BPUlQgfHwgMzAwMDtcbmFwcC5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgKGV2dCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKGV2dC5lcnJvcik7XG59KTtcbnJvdXRlclxuICAgIC5nZXQoXCIvYXBpL2hlbGxvLXdvcmxkXCIsIChjb250ZXh0KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSBoZWxsb1dvcmxkVmFyO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH1cbiAgICB9KVxuICAgIC5wb3N0KFwiL2FwaS9wb3N0LWhlbGxvLXdvcmxkXCIsIGFzeW5jIChjb250ZXh0OiBSb3V0ZXJDb250ZXh0PGFueT4pID0+IHtcbiAgICAgICAgaWYgKCFjb250ZXh0LnJlcXVlc3QuaGFzQm9keSkge1xuICAgICAgICAgICAgY29udGV4dC50aHJvdyhTdGF0dXMuQmFkUmVxdWVzdCwgXCJCYWQgUmVxdWVzdFwiKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBib2R5ID0gY29udGV4dC5yZXF1ZXN0LmJvZHkoKTtcbiAgICAgICAgbGV0IGhlbGxvV29ybGQ6IFBhcnRpYWw8SGVsbG9Xb3JsZD4gfCB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChib2R5LnR5cGUgPT09IFwianNvblwiKSB7XG4gICAgICAgICAgICBoZWxsb1dvcmxkID0gYXdhaXQgYm9keS52YWx1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChib2R5LnR5cGUgPT09IFwiZm9ybVwiKSB7XG4gICAgICAgICAgICBoZWxsb1dvcmxkID0ge307XG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBhd2FpdCBib2R5LnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaGVsbG9Xb3JsZFtrZXkgYXMga2V5b2YgSGVsbG9Xb3JsZF0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChib2R5LnR5cGUgPT09IFwiZm9ybS1kYXRhXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IGZvcm1EYXRhID0gYXdhaXQgYm9keS52YWx1ZS5yZWFkKCk7XG4gICAgICAgICAgICBoZWxsb1dvcmxkID0gZm9ybURhdGEuZmllbGRzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChoZWxsb1dvcmxkKSB7XG4gICAgICAgICAgICBjb250ZXh0LmFzc2VydCh0eXBlb2YgaGVsbG9Xb3JsZC50ZXh0ID09PSBcInN0cmluZ1wiLCBTdGF0dXMuQmFkUmVxdWVzdCk7XG4gICAgICAgICAgICBoZWxsb1dvcmxkVmFyID0gaGVsbG9Xb3JsZCBhcyBIZWxsb1dvcmxkO1xuICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5zdGF0dXMgPSBTdGF0dXMuT0s7XG4gICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSBoZWxsb1dvcmxkO1xuICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS50eXBlID0gXCJqc29uXCI7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29udGV4dC50aHJvdyhTdGF0dXMuQmFkUmVxdWVzdCwgXCJCYWQgUmVxdWVzdFwiKTtcbiAgICB9KVxuICAgIC5wb3N0KFwiL2FwaS9yZWdpc3RlclwiLCBhc3luYyAoY29udGV4dDogUm91dGVyQ29udGV4dDxhbnk+KSA9PiB7XG4gICAgICAgIGxldCBzaWQgPSBhd2FpdCBjb250ZXh0LmNvb2tpZXMuZ2V0KCdzaWQnKTtcbiAgICAgICAgaWYgKCFzaWQpIHtcbiAgICAgICAgICAgIHNpZCA9IGF3YWl0IG5hbm9pZCg0MCk7XG4gICAgICAgICAgICBjb250ZXh0LmNvb2tpZXMuc2V0KCdzaWQnLCBzaWQpO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoIWNvbnRleHQucmVxdWVzdC5oYXNCb2R5KSB7XG4gICAgICAgICAgICAgICAgY29udGV4dC50aHJvdyhTdGF0dXMuQmFkUmVxdWVzdCwgXCJCYWQgUmVxdWVzdFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBjb250ZXh0LnJlcXVlc3QuYm9keSgpO1xuICAgICAgICAgICAgbGV0IHVzZXI6IFBhcnRpYWw8VXNlcj4gfCB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAoYm9keS50eXBlID09PSBcImpzb25cIikge1xuICAgICAgICAgICAgICAgIHVzZXIgPSBhd2FpdCBib2R5LnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0LmFzc2VydChcbiAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHVzZXI/LmVtYWlsPy52YWx1ZSA9PT0gXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgdXNlcj8udXNlcm5hbWU/LnZhbHVlID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgICAgICYmIHR5cGVvZiB1c2VyPy5wYXNzd29yZD8udmFsdWUgPT09IFwic3RyaW5nXCIsIFN0YXR1cy5CYWRSZXF1ZXN0KTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLnN0YXR1cyA9IFN0YXR1cy5PSztcbiAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVzZXJuYW1lUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgdXNlcm5hbWUgZnJvbSB1c2VycyB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgKyB1c2VyPy51c2VybmFtZT8udmFsdWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgaWYgKHVzZXJuYW1lUmVzdWx0LnJvd3MubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbWFpbFJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IGVtYWlsIGZyb20gdXNlcnMgd2hlcmUgZW1haWw9J1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIHVzZXI/LmVtYWlsPy52YWx1ZSArIFwiJ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVtYWlsUmVzdWx0LnJvd3MubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNhbHRIZXhTdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzI7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNhbHRIZXhTdHJpbmcgKz0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogTWF0aC5wb3coMiwgMzIpKS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc2FsdEhleFN0cmluZ0xlbmd0aCA9IHNhbHRIZXhTdHJpbmcubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAyNTYgLSBzYWx0SGV4U3RyaW5nTGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYWx0SGV4U3RyaW5nID0gXCIwXCIgKyBzYWx0SGV4U3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHRleHRFbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgY3J5cHRvLnN1YnRsZS5kaWdlc3QoJ1NIQTMtNTEyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0RW5jb2Rlci5lbmNvZGUodXNlcj8ucGFzc3dvcmQ/LnZhbHVlICsgc2FsdEhleFN0cmluZykpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBoYXNoZWRQYXNzd29yZEhleFN0cmluZyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXkubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNoZWRQYXNzd29yZEhleFN0cmluZyArPSAoaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5W2ldIDwgMTYgPyBcIjBcIiA6IFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5W2ldLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBoYXNoZWRQYXNzd29yZEhleFN0cmluZ0xlbmd0aCA9IGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTI4IC0gaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmdMZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nID0gXCIwXCIgKyBoYXNoZWRQYXNzd29yZEhleFN0cmluZztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaW5zZXJ0IGludG8gcHVibGljLnVzZXJzKGVtYWlsLCB1c2VybmFtZSwgaGFzaGVkX3Bhc3N3b3JkLCBzYWx0LCBudW1fd2lucywgbnVtX2xvc3NlcywgY3JlYXRlZF9hdCwgdXBkYXRlZF9hdCwgZWxvX3JhdGluZywgaGFzXzI0MDBfcmF0aW5nX2hpc3RvcnkpXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiIHZhbHVlcyAoJ1wiICsgdXNlcj8uZW1haWw/LnZhbHVlICsgXCInLCAnXCIgKyB1c2VyPy51c2VybmFtZT8udmFsdWUgKyBcIicsICdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgXCJcXFxceFwiICsgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgKyBcIicsICdcIiArIFwiXFxcXHhcIiArIHNhbHRIZXhTdHJpbmcgKyBcIicsICcwJywgJzAnLCBub3coKSwgbm93KCksICcxMDAwJywgJ2ZhbHNlJylcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc2lkID0gYXdhaXQgbmFub2lkKDQwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZHNbc2lkXSA9IHVzZXIudXNlcm5hbWUudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjb250ZXh0LmNvb2tpZXMuc2V0KCdzaWQnLCBzaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0gdXNlcjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHsgdGV4dDogJ0dpdmVuIEVtYWlsIEFscmVhZHkgRXhpc3RzJyB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0geyB0ZXh0OiAnR2l2ZW4gVXNlcm5hbWUgQWxyZWFkeSBFeGlzdHMnIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLnR5cGUgPSBcImpzb25cIjtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250ZXh0LnRocm93KFN0YXR1cy5CYWRSZXF1ZXN0LCBcIkJhZCBSZXF1ZXN0XCIpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH1cbiAgICB9KVxuICAgIC5wb3N0KFwiL2FwaS9sb2dpblwiLCBhc3luYyAoY29udGV4dDogUm91dGVyQ29udGV4dDxhbnk+KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoIWNvbnRleHQucmVxdWVzdC5oYXNCb2R5KSB7XG4gICAgICAgICAgICAgICAgY29udGV4dC50aHJvdyhTdGF0dXMuQmFkUmVxdWVzdCwgXCJCYWQgUmVxdWVzdFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBjb250ZXh0LnJlcXVlc3QuYm9keSgpO1xuICAgICAgICAgICAgbGV0IHVzZXI6IFBhcnRpYWw8VXNlcj4gfCB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAoYm9keS50eXBlID09PSBcImpzb25cIikge1xuICAgICAgICAgICAgICAgIHVzZXIgPSBhd2FpdCBib2R5LnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0LmFzc2VydChcbiAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHVzZXI/LmVtYWlsPy52YWx1ZSA9PT0gXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgdXNlcj8ucGFzc3dvcmQ/LnZhbHVlID09PSBcInN0cmluZ1wiLCBTdGF0dXMuQmFkUmVxdWVzdCk7XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5zdGF0dXMgPSBTdGF0dXMuT0s7XG4gICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IGVtYWlsLCB1c2VybmFtZSwgaGFzaGVkX3Bhc3N3b3JkLCBzYWx0IGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICAgICAgICAgICsgdXNlcj8uZW1haWw/LnZhbHVlICsgXCInXCIpO1xuICAgICAgICAgICAgICAgIGlmICh1c2VybmFtZVJlc3VsdC5yb3dzLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZW1haWxSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBlbWFpbCwgdXNlcm5hbWUsIGhhc2hlZF9wYXNzd29yZCwgc2FsdCBmcm9tIHVzZXJzIHdoZXJlIGVtYWlsPSdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKyB1c2VyPy5lbWFpbD8udmFsdWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbWFpbFJlc3VsdC5yb3dzLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHsgdGV4dDogJ0dpdmVuIEVtYWlsIG9yIFVzZXJuYW1lIERvZXMgTm90IEV4aXN0JyB9O1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNhbHRIZXhTdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgKGVtYWlsUmVzdWx0LnJvd3NbMF1bM10gYXMgVWludDhBcnJheSkubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYWx0SGV4U3RyaW5nICs9ICgoZW1haWxSZXN1bHQucm93c1swXVszXSBhcyBVaW50OEFycmF5KVtpXSA8IDE2ID8gXCIwXCIgOiBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIChlbWFpbFJlc3VsdC5yb3dzWzBdWzNdIGFzIFVpbnQ4QXJyYXkpW2ldLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0ZXh0RW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGhhc2hlZFBhc3N3b3JkVWludDhBcnJheSA9IG5ldyBVaW50OEFycmF5KGF3YWl0IGNyeXB0by5zdWJ0bGUuZGlnZXN0KCdTSEEzLTUxMicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dEVuY29kZXIuZW5jb2RlKHVzZXI/LnBhc3N3b3JkPy52YWx1ZSArIHNhbHRIZXhTdHJpbmcpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgKz0gKGhhc2hlZFBhc3N3b3JkVWludDhBcnJheVtpXSA8IDE2ID8gXCIwXCIgOiBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIGhhc2hlZFBhc3N3b3JkVWludDhBcnJheVtpXS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc2VydmVySGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgKGVtYWlsUmVzdWx0LnJvd3NbMF1bMl0gYXMgVWludDhBcnJheSkubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXJ2ZXJIYXNoZWRQYXNzd29yZEhleFN0cmluZyArPSAoKGVtYWlsUmVzdWx0LnJvd3NbMF1bMl0gYXMgVWludDhBcnJheSlbaV0gPCAxNiA/IFwiMFwiIDogXCJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAoZW1haWxSZXN1bHQucm93c1swXVsyXSBhcyBVaW50OEFycmF5KVtpXS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgPT09IHNlcnZlckhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGZvdW5kVXNlcjogVXNlciA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW1haWw6IHsgdmFsdWU6IGVtYWlsUmVzdWx0LnJvd3NbMF1bMF0gYXMgc3RyaW5nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJuYW1lOiB7IHZhbHVlOiBlbWFpbFJlc3VsdC5yb3dzWzBdWzFdIGFzIHN0cmluZyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzd29yZDogeyB2YWx1ZTogJycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNpZCA9IGF3YWl0IG5hbm9pZCg0MCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2lkc1tzaWRdID0gZm91bmRVc2VyLnVzZXJuYW1lLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNvbnRleHQuY29va2llcy5zZXQoJ3NpZCcsIHNpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0gZm91bmRVc2VyO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7IHRleHQ6ICdXcm9uZyBQYXNzd29yZCcgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBzYWx0SGV4U3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgKHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bM10gYXMgVWludDhBcnJheSkubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhbHRIZXhTdHJpbmcgKz0gKCh1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzNdIGFzIFVpbnQ4QXJyYXkpW2ldIDwgMTYgPyBcIjBcIiA6IFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAodXNlcm5hbWVSZXN1bHQucm93c1swXVszXSBhcyBVaW50OEFycmF5KVtpXS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbGV0IHRleHRFbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXkgPSBuZXcgVWludDhBcnJheShhd2FpdCBjcnlwdG8uc3VidGxlLmRpZ2VzdCgnU0hBMy01MTInLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dEVuY29kZXIuZW5jb2RlKHVzZXI/LnBhc3N3b3JkPy52YWx1ZSArIHNhbHRIZXhTdHJpbmcpKSk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBoYXNoZWRQYXNzd29yZEhleFN0cmluZyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhhc2hlZFBhc3N3b3JkVWludDhBcnJheS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgKz0gKGhhc2hlZFBhc3N3b3JkVWludDhBcnJheVtpXSA8IDE2ID8gXCIwXCIgOiBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5W2ldLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBsZXQgc2VydmVySGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAodXNlcm5hbWVSZXN1bHQucm93c1swXVsyXSBhcyBVaW50OEFycmF5KS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VydmVySGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgKz0gKCh1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzJdIGFzIFVpbnQ4QXJyYXkpW2ldIDwgMTYgPyBcIjBcIiA6IFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAodXNlcm5hbWVSZXN1bHQucm93c1swXVsyXSBhcyBVaW50OEFycmF5KVtpXS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nID09PSBzZXJ2ZXJIYXNoZWRQYXNzd29yZEhleFN0cmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGZvdW5kVXNlcjogVXNlciA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbWFpbDogeyB2YWx1ZTogdXNlcm5hbWVSZXN1bHQucm93c1swXVswXSBhcyBzdHJpbmcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogeyB2YWx1ZTogdXNlcm5hbWVSZXN1bHQucm93c1swXVsxXSBhcyBzdHJpbmcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzd29yZDogeyB2YWx1ZTogJycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzaWQgPSBhd2FpdCBuYW5vaWQoNDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2lkc1tzaWRdID0gZm91bmRVc2VyLnVzZXJuYW1lLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY29udGV4dC5jb29raWVzLnNldCgnc2lkJywgc2lkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IGZvdW5kVXNlcjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHsgdGV4dDogJ1dyb25nIFBhc3N3b3JkJyB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLnR5cGUgPSBcImpzb25cIjtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250ZXh0LnRocm93KFN0YXR1cy5CYWRSZXF1ZXN0LCBcIkJhZCBSZXF1ZXN0XCIpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH1cbiAgICB9KVxuICAgIC5nZXQoXCIvYXBpL3VzZXJcIiwgYXN5bmMgKGNvbnRleHQpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBzaWQgPSBhd2FpdCBjb250ZXh0LmNvb2tpZXMuZ2V0KCdzaWQnKTtcbiAgICAgICAgICAgIGlmIChzaWQgJiYgdHlwZW9mIHNpZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBsZXQgdXNlcm5hbWUgPSBzaWRzW3NpZCBhcyBzdHJpbmddO1xuICAgICAgICAgICAgICAgIGlmICh1c2VybmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IGVtYWlsLCB1c2VybmFtZSwgbnVtX3dpbnMsIG51bV9sb3NzZXMsIGVsb19yYXRpbmcgZnJvbSB1c2VycyB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgdXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgIGxldCBmb3VuZFVzZXI6IFVzZXIgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbWFpbDogeyB2YWx1ZTogdXNlcm5hbWVSZXN1bHQucm93c1swXVswXSBhcyBzdHJpbmcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJuYW1lOiB7IHZhbHVlOiB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzFdIGFzIHN0cmluZyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHsgdmFsdWU6ICcnIH0sXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXNlcjogZm91bmRVc2VyLFxuICAgICAgICAgICAgICAgICAgICAgICAgbnVtV2luczogdXNlcm5hbWVSZXN1bHQucm93c1swXVsyXSBhcyBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBudW1Mb3NzZXM6IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bM10gYXMgbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgZWxvUmF0aW5nOiB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzRdIGFzIG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAuZ2V0KFwiL2FwaS9vcHBvbmVudFwiLCBhc3luYyAoY29udGV4dCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHNpZCA9IGF3YWl0IGNvbnRleHQuY29va2llcy5nZXQoJ3NpZCcpO1xuICAgICAgICAgICAgaWYgKHNpZCAmJiB0eXBlb2Ygc2lkID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGxldCB1c2VybmFtZSA9IHNpZHNbc2lkIGFzIHN0cmluZ107XG4gICAgICAgICAgICAgICAgbGV0IG9wcG9uZW50VXNlcm5hbWUgPSBzaWRzW21hdGNoZXNbc2lkIGFzIHN0cmluZ10gYXMgc3RyaW5nXTtcbiAgICAgICAgICAgICAgICBpZiAodXNlcm5hbWUgJiYgb3Bwb25lbnRVc2VybmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IGVsb19yYXRpbmcgZnJvbSB1c2VycyB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgdXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9wcG9uZW50VXNlcm5hbWVSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBlbG9fcmF0aW5nIGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIG9wcG9uZW50VXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlQm9keSA6IE1hdGNobWFraW5nRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHlvdToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJuYW1lOiB1c2VybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbG9SYXRpbmc6IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMF0gYXMgbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpZDogc2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcm5hbWU6IG9wcG9uZW50VXNlcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxvUmF0aW5nOiBvcHBvbmVudFVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMF0gYXMgbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpZDogJydcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHJlc3BvbnNlQm9keTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAuZ2V0KFwiL2FwaS9xdWVzdGlvblwiLCBhc3luYyAoY29udGV4dCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHNpZCA9IGF3YWl0IGNvbnRleHQuY29va2llcy5nZXQoJ3NpZCcpO1xuICAgICAgICAgICAgaWYgKHNpZCAmJiB0eXBlb2Ygc2lkID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcXVlc3Rpb25SZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBxdWVzdGlvbiwgZnVuY3Rpb25fc2lnbmF0dXJlLCBkZWZhdWx0X2N1c3RvbV9pbnB1dCBmcm9tIHF1ZXN0aW9ucyB3aGVyZSBpZCA9IFwiXG4gICAgICAgICAgICAgICAgICAgICsgc2lkc1F1ZXN0aW9uc1tzaWRdW3NpZHNQcm9ncmVzc1tzaWRdXS5xdWVzdGlvbklkLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVVVVXCIpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHNpZHNRdWVzdGlvbnNbc2lkXVtzaWRzUHJvZ3Jlc3Nbc2lkXV0ucXVlc3Rpb25JZC50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIklJSVwiKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZUJvZHkgOiBRdWVzdGlvbkRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgIHF1ZXN0aW9uOiBxdWVzdGlvblJlc3VsdC5yb3dzWzBdWzBdIGFzIHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb25fc2lnbmF0dXJlOiBxdWVzdGlvblJlc3VsdC5yb3dzWzBdWzFdIGFzIHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdF9jdXN0b21faW5wdXQ6IHF1ZXN0aW9uUmVzdWx0LnJvd3NbMF1bMl0gYXMgc3RyaW5nLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0gcmVzcG9uc2VCb2R5O1xuICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAuZ2V0KFwiL2FwaS9tYXRjaG1ha2luZ1wiLCBhc3luYyAoY29udGV4dCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHNpZCA9IGF3YWl0IGNvbnRleHQuY29va2llcy5nZXQoJ3NpZCcpO1xuICAgICAgICAgICAgaWYgKHNpZCAmJiB0eXBlb2Ygc2lkID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGxldCB1c2VybmFtZSA9IHNpZHNbc2lkIGFzIHN0cmluZ107XG4gICAgICAgICAgICAgICAgaWYgKHVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHVzZXJuYW1lUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgZWxvX3JhdGluZyBmcm9tIHVzZXJzIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKyB1c2VybmFtZSArIFwiJ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1hdGNobWFraW5nVXNlcjogTWF0Y2htYWtpbmdVc2VyID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxvUmF0aW5nOiB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzBdIGFzIG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZDogc2lkLFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHF1ZXVlczogTWF0Y2htYWtpbmdVc2VyW11bXSA9IFttYXRjaG1ha2luZ1F1ZXVlMjUsIG1hdGNobWFraW5nUXVldWU1MCwgbWF0Y2htYWtpbmdRdWV1ZTEwMCwgbWF0Y2htYWtpbmdRdWV1ZTIwMF07XG4gICAgICAgICAgICAgICAgICAgIGxldCByYW5nZXM6IG51bWJlcltdID0gWzI1LCA1MCwgMTAwLCAyMDBdO1xuICAgICAgICAgICAgICAgICAgICBsZXQgZGVsYXlUaW1lc051bXM6IG51bWJlcltdID0gWzEsIDUsIDEwLCA2MF07XG4gICAgICAgICAgICAgICAgICAgIGxldCBmb3VuZE1hdGNoOiBib29sZWFuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcXVldWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmRNYXRjaCA9IGF3YWl0IGFkZFRvUXVldWUocXVldWVzW2ldLCBtYXRjaG1ha2luZ1VzZXIsIHJhbmdlc1tpXSwgY29udGV4dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBkZWxheVRpbWVzTnVtc1tpXTsgKytqKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZE1hdGNoID0gYXdhaXQgY2hlY2tJZkZvdW5kSW5RdWV1ZSgxMDAwLCBtYXRjaG1ha2luZ1VzZXIsIHVzZXJuYW1lLCBjb250ZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kTWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUZyb21RdWV1ZShxdWV1ZXNbaV0sIHNpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmb3VuZE1hdGNoICYmICFhZGRUb1F1ZXVlKG1hdGNobWFraW5nUXVldWU1MDAsIG1hdGNobWFraW5nVXNlciwgNTAwLCBjb250ZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKCEoYXdhaXQgY2hlY2tJZkZvdW5kSW5RdWV1ZSgxMDAwLCBtYXRjaG1ha2luZ1VzZXIsIHVzZXJuYW1lLCBjb250ZXh0KSkpIHsgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH1cbiAgICB9KVxuICAgIC5nZXQoXCIvYXBpL2xvZ291dFwiLCBhc3luYyAoY29udGV4dCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHNpZCA9IGF3YWl0IGNvbnRleHQuY29va2llcy5nZXQoJ3NpZCcpO1xuICAgICAgICAgICAgaWYgKHNpZCAmJiB0eXBlb2Ygc2lkID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBzaWRzW3NpZCBhcyBzdHJpbmddO1xuICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHsgdGV4dDogJ1N1Y2Nlc3NmdWxseSBMb2dnZWQgT3V0JyB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH1cbiAgICB9KVxuICAgIC5wb3N0KFwiL2FwaS9ydW5cIiwgYXN5bmMgKGNvbnRleHQ6IFJvdXRlckNvbnRleHQ8YW55PikgPT4ge1xuICAgICAgICAvLyBjb250ZXh0LnJlc3BvbnNlLnN0YXR1cyA9IFN0YXR1cy5PSztcbiAgICAgICAgLy8gY29uc3QgZHVtYnlSZXN1bHQ6IFRlc3RDYXNlc1Bhc3NlZCA9IHtcbiAgICAgICAgLy8gICAgIHRlc3RDYXNlc1Bhc3NlZDogW3RydWUsIHRydWUsIHRydWUsIHRydWUsIHRydWUsIHRydWUsIHRydWUsIHRydWUsIHRydWUsIHRydWUsIHRydWVdLFxuICAgICAgICAvLyAgICAgc3RhbmRhcmRPdXRwdXQ6IFwiVGVzdCBTdGFuZGFyZCBPdXRwdXRcIixcbiAgICAgICAgLy8gICAgIG91dHB1dDogXCJUZXN0IE91dHB1dFwiXG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gY29udGV4dC5yZXNwb25zZS5ib2R5ID0gZHVtYnlSZXN1bHRcbiAgICAgICAgLy8gcmV0dXJuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgc2lkID0gYXdhaXQgY29udGV4dC5jb29raWVzLmdldCgnc2lkJyk7XG4gICAgICAgICAgICBpZiAoc2lkICYmIHR5cGVvZiBzaWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjb250ZXh0LnJlcXVlc3QuaGFzQm9keSkge1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnRocm93KFN0YXR1cy5CYWRSZXF1ZXN0LCBcIkJhZCBSZXF1ZXN0XCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBib2R5ID0gY29udGV4dC5yZXF1ZXN0LmJvZHkoKTtcbiAgICAgICAgICAgICAgICBsZXQgY29kZTogUGFydGlhbDxDb2RlU3VibWlzc2lvbj4gfCB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgaWYgKGJvZHkudHlwZSA9PT0gXCJqc29uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29kZSA9IGF3YWl0IGJvZHkudmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChjb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQuYXNzZXJ0KHR5cGVvZiBjb2RlPy52YWx1ZSA9PT0gXCJzdHJpbmdcIiwgU3RhdHVzLkJhZFJlcXVlc3QpO1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmFzc2VydCh0eXBlb2YgY29kZT8uaW5wdXQgPT09IFwic3RyaW5nXCIsIFN0YXR1cy5CYWRSZXF1ZXN0KTtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5zdGF0dXMgPSBTdGF0dXMuT0s7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiWlpaXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhjb2RlLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJYWFhcIik7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZShcIi4vc2FuZGJveC9hbnN3ZXIucHlcIiwgY29kZS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZShcIi4vc2FuZGJveC9hbnN3ZXJDdXN0b21JbnB1dC5weVwiLCBjb2RlLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGlucHV0TGluZXM6IHN0cmluZ1tdID0gY29kZS5pbnB1dC5zcGxpdCgnXFxuJyk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBjdXN0b21JbnB1dENvbnRlbnQ6IHN0cmluZyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBsZXQgcXVlc3Rpb25JbmZvcm1hdGlvbjogUXVlc3Rpb25JbmZvcm1hdGlvbiA9IHNpZHNRdWVzdGlvbnNbc2lkXVtzaWRzUHJvZ3Jlc3Nbc2lkXV07XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcXVlc3Rpb25JbmZvcm1hdGlvbi5pbnB1dEZvcm1hdC5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJPT09cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhxdWVzdGlvbkluZm9ybWF0aW9uLmlucHV0Rm9ybWF0W2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUFBQXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXN0aW9uSW5mb3JtYXRpb24uaW5wdXRGb3JtYXRbaV0gPT0gJ24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9tSW5wdXRDb250ZW50ICs9IHBhcnNlSW50KGlucHV0TGluZXNbaV0pLnRvU3RyaW5nKCkgKyAnXFxuJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocXVlc3Rpb25JbmZvcm1hdGlvbi5pbnB1dEZvcm1hdFtpXSA9PSAnYScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaW5wdXRDb21tYVNlcGFyYXRlZFZhbHVlczogc3RyaW5nW10gPSBpbnB1dExpbmVzW2ldLnNwbGl0KCdbJylbMV0uc3BsaXQoJ10nKVswXS5zcGxpdCgnLCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGlucHV0Q29tbWFTZXBhcmF0ZWRWYWx1ZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbUlucHV0Q29udGVudCArPSBpbnB1dENvbW1hU2VwYXJhdGVkVmFsdWVzLmxlbmd0aC50b1N0cmluZygpICsgJ1xcbic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dENvbW1hU2VwYXJhdGVkVmFsdWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbUlucHV0Q29udGVudCArPSBwYXJzZUludChpbnB1dENvbW1hU2VwYXJhdGVkVmFsdWVzW2ldKS50b1N0cmluZygpICsgJ1xcbic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGN1c3RvbUlucHV0Q29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZWVlZcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHF1ZXN0aW9uSW5mb3JtYXRpb24uaW5wdXRGb3JtYXRbaV0gPT0gJ2FhJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpbnB1dENvbW1hU2VwYXJhdGVkVmFsdWVzOiBzdHJpbmdbXSA9IGlucHV0TGluZXNbaV0uc3BsaXQoJ1tbJylbMV0uc3BsaXQoJ11dJylbMF0uc3BsaXQoJ10sWycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbUlucHV0Q29udGVudCArPSBpbnB1dENvbW1hU2VwYXJhdGVkVmFsdWVzLmxlbmd0aC50b1N0cmluZygpICsgJ1xcbic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dENvbW1hU2VwYXJhdGVkVmFsdWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpbnB1dENDb21tYVNlcGFyYXRlZFZhbHVlczogc3RyaW5nW10gPSBpbnB1dExpbmVzW2ldLnNwbGl0KCcsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbUlucHV0Q29udGVudCArPSBpbnB1dENDb21tYVNlcGFyYXRlZFZhbHVlcy5sZW5ndGgudG9TdHJpbmcoKSArICdcXG4nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgaW5wdXRDQ29tbWFTZXBhcmF0ZWRWYWx1ZXMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbUlucHV0Q29udGVudCArPSBwYXJzZUludChpbnB1dENDb21tYVNlcGFyYXRlZFZhbHVlc1tpXSkudG9TdHJpbmcoKSArICdcXG4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChxdWVzdGlvbkluZm9ybWF0aW9uLm91dHB1dEZvcm1hdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5OTlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHF1ZXN0aW9uSW5mb3JtYXRpb24ub3V0cHV0Rm9ybWF0WzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTU1NXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUFBXCIpO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoXCIuL3NhbmRib3gvY3VzdG9tSW5wdXQuaW5cIiwgY3VzdG9tSW5wdXRDb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBQUJcIik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcG9ydFByb2Nlc3MgPSBhd2FpdCBEZW5vLnJ1bih7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbWQ6IFtcIi4vbWFrZVJlcG9ydC5zaFwiXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN3ZDogXCIuL3NhbmRib3gvXCIgKyBxdWVzdGlvbkluZm9ybWF0aW9uLnF1ZXN0aW9uSWQudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ZG91dDogXCJwaXBlZFwiXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkFCQlwiKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgcmVwb3J0UHJvY2Vzcy5vdXRwdXQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJCQkJcIik7XG4gICAgICAgICAgICAgICAgICAgIGxldCBqc29uUmVzdWx0czogU3RyaW5nID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUoXCIuL3NhbmRib3gvcmVwb3J0RnJvbVB5U2FuZGJveC50eHRcIik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiISEhXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhqc29uUmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQEBAXCIpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgc3RhbmRhcmRPdXRwdXRSZXN1bHRzOiBzdHJpbmcgPSBhd2FpdCBEZW5vLnJlYWRUZXh0RmlsZShcIi4vc2FuZGJveC9zdGFuZGFyZE91dHB1dEZyb21QeVNhbmRib3gudHh0XCIpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgb3V0cHV0UmVzdWx0czogc3RyaW5nID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUoXCIuL3NhbmRib3gvb3V0cHV0RnJvbVB5U2FuZGJveC50eHRcIik7XG4gICAgICAgICAgICAgICAgICAgIGxldCBvdXRwdXRSZXN1bHRzU3BsaXQ6IHN0cmluZ1tdID0gb3V0cHV0UmVzdWx0cy5zcGxpdCgnXFxuJyk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBhY3R1YWxPdXRwdXRSZXN1bHRzOiBzdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXN0aW9uSW5mb3JtYXRpb24ub3V0cHV0Rm9ybWF0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChxdWVzdGlvbkluZm9ybWF0aW9uLm91dHB1dEZvcm1hdFswXSA9PSAnbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3V0cHV0UmVzdWx0c1NwbGl0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsT3V0cHV0UmVzdWx0cyArPSBvdXRwdXRSZXN1bHRzU3BsaXRbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChxdWVzdGlvbkluZm9ybWF0aW9uLm91dHB1dEZvcm1hdFswXSA9PSAnYScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbjogbnVtYmVyID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3V0cHV0UmVzdWx0c1NwbGl0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbiA9IHBhcnNlSW50KG91dHB1dFJlc3VsdHNTcGxpdFswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuID4gMCAmJiBvdXRwdXRSZXN1bHRzU3BsaXQubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWxPdXRwdXRSZXN1bHRzICs9ICdbJyArIG91dHB1dFJlc3VsdHNTcGxpdFsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsT3V0cHV0UmVzdWx0cyArPSAnLCAnICsgb3V0cHV0UmVzdWx0c1NwbGl0W2kgKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG4gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbE91dHB1dFJlc3VsdHMgKz0gJ10nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChxdWVzdGlvbkluZm9ybWF0aW9uLm91dHB1dEZvcm1hdFswXSA9PSAnYWEnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG46IG51bWJlciA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5uOiBudW1iZXIgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBrOiBudW1iZXIgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiIyMjXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKG91dHB1dFJlc3VsdHNTcGxpdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCIkJCRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG91dHB1dFJlc3VsdHNTcGxpdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG4gPSBwYXJzZUludChvdXRwdXRSZXN1bHRzU3BsaXRbaysrXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWxPdXRwdXRSZXN1bHRzICs9ICdbWyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvdXRwdXRSZXN1bHRzU3BsaXQubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm4gPSBwYXJzZUludChvdXRwdXRSZXN1bHRzU3BsaXRbaysrXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5uID4gMCAmJiBvdXRwdXRSZXN1bHRzU3BsaXQubGVuZ3RoID4gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsT3V0cHV0UmVzdWx0cyArPSBvdXRwdXRSZXN1bHRzU3BsaXRbaysrXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IG5uOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbE91dHB1dFJlc3VsdHMgKz0gJywgJyArIG91dHB1dFJlc3VsdHNTcGxpdFtrKytdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbE91dHB1dFJlc3VsdHMgKz0gJ10nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbE91dHB1dFJlc3VsdHMgKz0gJywgWyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5uID0gcGFyc2VJbnQob3V0cHV0UmVzdWx0c1NwbGl0W2srK10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobm4gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWxPdXRwdXRSZXN1bHRzICs9IG91dHB1dFJlc3VsdHNTcGxpdFtrKytdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAxOyBqIDwgbm47ICsraikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsT3V0cHV0UmVzdWx0cyArPSAnLCAnICsgb3V0cHV0UmVzdWx0c1NwbGl0W2srK107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsT3V0cHV0UmVzdWx0cyArPSAnXSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG4gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbE91dHB1dFJlc3VsdHMgKz0gJ10nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ0NDXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzdGFuZGFyZE91dHB1dFJlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRERFwiKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYWN0dWFsT3V0cHV0UmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRUVFXCIpO1xuICAgICAgICAgICAgICAgICAgICBqc29uUmVzdWx0cyA9IGpzb25SZXN1bHRzLnJlcGxhY2UoL1xccy9nLCBcIlwiKTtcbiAgICAgICAgICAgICAgICAgICAganNvblJlc3VsdHMgPSBqc29uUmVzdWx0cy5zdWJzdHJpbmcoMCwganNvblJlc3VsdHMubGVuZ3RoIC0gMikgKyBcIl1cIlxuICAgICAgICAgICAgICAgICAgICBsZXQgdGVzdFJlc3VsdHM6IFRlc3RSZXN1bHRbXSAgPSBKU09OLnBhcnNlKGpzb25SZXN1bHRzLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgdGVzdENhc2VzUGFzc2VkOiBUZXN0Q2FzZXNQYXNzZWQgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXN0Q2FzZXNQYXNzZWQ6IHRlc3RSZXN1bHRzLm1hcCgodHI6IFRlc3RSZXN1bHQpID0+IHRyLnBhc3NlZCksXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFuZGFyZE91dHB1dDogc3RhbmRhcmRPdXRwdXRSZXN1bHRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0OiBhY3R1YWxPdXRwdXRSZXN1bHRzLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIjExMTExMTExMTExMTExMTExMTExMTExMTExXCIpO1xuICAgICAgICAgICAgICAgICAgICAvKmlmICgrK2lpaUNvdW50ZXIgJSAzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRlc3RDYXNlc1Bhc3NlZC50ZXN0Q2FzZXNQYXNzZWQubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXN0Q2FzZXNQYXNzZWQudGVzdENhc2VzUGFzc2VkW2ldID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSovXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGVzdENhc2VzUGFzc2VkLnRlc3RDYXNlc1Bhc3NlZC5zb21lKGVsZW1lbnQgPT4gIWVsZW1lbnQpICYmICsrc2lkc1Byb2dyZXNzW3NpZF0gPT09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBvcHBvbmVudFNpZCA9IG1hdGNoZXNbc2lkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBtYXRjaGVzW3NpZF07XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgbWF0Y2hlc1tvcHBvbmVudFNpZF07XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgc2lkc1Byb2dyZXNzW3NpZF07XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgc2lkc1Byb2dyZXNzW29wcG9uZW50U2lkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBzaWRzUXVlc3Rpb25zW3NpZF07XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgc2lkc1F1ZXN0aW9uc1tvcHBvbmVudFNpZF07XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbnVtV2luczogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bUdhbWVzOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxvUmF0aW5nOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzMjQwMFJhdGluZ0hpc3Rvcnk6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHBvbmVudE51bUxvc3NlczogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50TnVtR2FtZXM6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHBvbmVudEVsb1JhdGluZzogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50SGFzMjQwMFJhdGluZ0hpc3Rvcnk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB1c2VybmFtZSA9IHNpZHNbc2lkIGFzIHN0cmluZ107XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHVzZXJuYW1lUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgbnVtX3dpbnMsIG51bV9sb3NzZXMsIGVsb19yYXRpbmcsIGhhc18yNDAwX3JhdGluZ19oaXN0b3J5IGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgdXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtV2lucyA9IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMF0gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bUdhbWVzID0gbnVtV2lucyArICh1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzFdIGFzIG51bWJlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxvUmF0aW5nID0gdXNlcm5hbWVSZXN1bHQucm93c1swXVsyXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzMjQwMFJhdGluZ0hpc3RvcnkgPSB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzNdIGFzIGJvb2xlYW47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBvcHBvbmVudFVzZXJuYW1lID0gc2lkc1tvcHBvbmVudFNpZCBhcyBzdHJpbmddO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHBvbmVudFVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHVzZXJuYW1lUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInNlbGVjdCBudW1fd2lucywgbnVtX2xvc3NlcywgZWxvX3JhdGluZywgaGFzXzI0MDBfcmF0aW5nX2hpc3RvcnkgZnJvbSB1c2VycyB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgb3Bwb25lbnRVc2VybmFtZSArIFwiJ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3Bwb25lbnROdW1Mb3NzZXMgPSB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzFdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3Bwb25lbnROdW1HYW1lcyA9ICh1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzBdIGFzIG51bWJlcikgKyBvcHBvbmVudE51bUxvc3NlcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3Bwb25lbnRFbG9SYXRpbmcgPSB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzJdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3Bwb25lbnRIYXMyNDAwUmF0aW5nSGlzdG9yeSA9IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bM10gYXMgYm9vbGVhbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArK251bVdpbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbG9SYXRpbmdWYXJpYXRpb246IG51bWJlciA9IDEgLSAxLjAgLyAoMSArIE1hdGgucG93KDEwLCAob3Bwb25lbnRFbG9SYXRpbmcgLSBlbG9SYXRpbmcpIC8gNDAwLjApKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxvUmF0aW5nICs9IE1hdGguZmxvb3IoKG51bUdhbWVzIDwgMzAgPyAoZWxvUmF0aW5nIDwgMjMwMCA/IDQwIDogMjApIDogKGhhczI0MDBSYXRpbmdIaXN0b3J5ID8gMTAgOiAyMCkpICogZWxvUmF0aW5nVmFyaWF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKytvcHBvbmVudE51bUxvc3NlcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3Bwb25lbnRFbG9SYXRpbmcgLT0gTWF0aC5jZWlsKChvcHBvbmVudE51bUdhbWVzIDwgMzAgPyAob3Bwb25lbnRFbG9SYXRpbmcgPCAyMzAwID8gNDAgOiAyMCkgOiAob3Bwb25lbnRIYXMyNDAwUmF0aW5nSGlzdG9yeSA/IDEwIDogMjApKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBlbG9SYXRpbmdWYXJpYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInVwZGF0ZSB1c2VycyBzZXQgbnVtX3dpbnMgPSBcIiArIG51bVdpbnMudG9TdHJpbmcoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgXCIsIGVsb19yYXRpbmcgPSBcIiArIGVsb1JhdGluZy50b1N0cmluZygpICsgXCIsIGhhc18yNDAwX3JhdGluZ19oaXN0b3J5ID0gXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIChoYXMyNDAwUmF0aW5nSGlzdG9yeSB8fCBlbG9SYXRpbmcgPj0gMjQwMCkudG9TdHJpbmcoKSArIFwiIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgdXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wcG9uZW50VXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInVwZGF0ZSB1c2VycyBzZXQgbnVtX2xvc3NlcyA9IFwiICsgb3Bwb25lbnROdW1Mb3NzZXMudG9TdHJpbmcoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgXCIsIGVsb19yYXRpbmcgPSBcIiArIG9wcG9uZW50RWxvUmF0aW5nLnRvU3RyaW5nKCkgKyBcIiwgaGFzXzI0MDBfcmF0aW5nX2hpc3RvcnkgPSBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgKG9wcG9uZW50SGFzMjQwMFJhdGluZ0hpc3RvcnkgfHwgb3Bwb25lbnRFbG9SYXRpbmcgPj0gMjQwMCkudG9TdHJpbmcoKSArIFwiIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgb3Bwb25lbnRVc2VybmFtZSArIFwiJ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB0ZXN0Q2FzZXNQYXNzZWQ7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiMjIyMjIyMjIyMjIyMjIyMlwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLmdldChcIi9hcGkvd2lsZGNhcmRFbmRwb2ludFwiLCBhc3luYyAoY29udGV4dCkgPT4ge1xuICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7IGVuZHBvaW50OiBcbiAgICAgICAgICAgIHByb2QgPyBcIndzczovL2xpY29kZS5pby93c1wiIDogXCJ3czovL2xvY2FsaG9zdDo1MDAwL3dzXCJcbiAgICAgICAgfTtcbiAgICB9KTtcbmFwcC51c2Uocm91dGVyLnJvdXRlcygpKTtcbmFwcC51c2Uocm91dGVyLmFsbG93ZWRNZXRob2RzKCkpO1xuYXBwLnVzZShhc3luYyAoY29udGV4dCkgPT4ge1xuICAgIGlmICghY29udGV4dC5yZXF1ZXN0LnVybC5wYXRobmFtZS5lbmRzV2l0aCgnLmpzJylcbiAgICAgICAgJiYgIWNvbnRleHQucmVxdWVzdC51cmwucGF0aG5hbWUuZW5kc1dpdGgoJy5wbmcnKVxuICAgICAgICAmJiAhY29udGV4dC5yZXF1ZXN0LnVybC5wYXRobmFtZS5lbmRzV2l0aCgnLmljbycpXG4gICAgICAgICYmICFjb250ZXh0LnJlcXVlc3QudXJsLnBhdGhuYW1lLmVuZHNXaXRoKCcudHh0JykpXHR7XG4gICAgICAgIGNvbnRleHQucmVxdWVzdC51cmwucGF0aG5hbWUgPSAnLyc7XG4gICAgfVxuICAgIGF3YWl0IGNvbnRleHQuc2VuZCh7XG4gICAgICAgIHJvb3Q6IGAke0Rlbm8uY3dkKCl9L3JlYWN0LWFwcC9idWlsZGAsXG4gICAgICAgIGluZGV4OiBcImluZGV4Lmh0bWxcIixcbiAgICB9KTtcbn0pO1xuY29uc29sZS5sb2coXCJSdW5uaW5nIG9uIHBvcnRcIiwgcG9ydCk7XG5hd2FpdCBhcHAubGlzdGVuKHsgcG9ydCB9KTtcbiJdfQ==