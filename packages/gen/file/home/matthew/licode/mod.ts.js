import { Application, Router, Status, } from "https://deno.land/x/oak/mod.ts";
import { Client } from "https://deno.land/x/postgres@v0.15.0/mod.ts";
import { crypto } from "https://deno.land/std@0.132.0/crypto/mod.ts";
import { nanoid } from 'https://deno.land/x/nanoid@v3.0.0/async.ts';
import { ensureDir } from 'https://deno.land/std@0.136.0/fs/mod.ts';
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
            stubString += '    n' + i.toString() + ' = int(input())\n    print("G", end="", file=sys.stderr)\n    print(n' + i.toString() + ', end="", file=sys.stderr)\n    print("H", end="", file=sys.stderr)\n    p' + i.toString() + ' = []\n    nums = []\n    for i in range(n' + i.toString() + '):\n        gh = int(input())\n        print("G", end="", file=sys.stderr)\n        print(gh, end="", file=sys.stderr)\n        print("H", end="", file=sys.stderr)\n        nums.append(gh)\n';
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
    let cleanString = 'import sys\n\nif __name__ == "__main__":\n';
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
            cleanString += '    n = int(input())\n    print("Q", end="", file=sys.stderr)\n    print(n, end="", file=sys.stderr)\n    print("W", end="", file=sys.stderr)\n    nns = []\n    nums = []\n    for i in range(n):\n        nn = int(input())\n        print("Q", end="", file=sys.stderr)\n        print(nn, end="", file=sys.stderr)\n        print("W", end="", file=sys.stderr)\n        nns.append(nn)\n        nnums = []\n        for j in range(nn):\n            qw = int(input())\n            print("Q", end="", file=sys.stderr)\n            print(qw, end="", file=sys.stderr)\n            print("W", end="", file=sys.stderr)\n            nnums.append(qw)\n        nnums.sort()\n        nums.append(nnums)\n    nums.sort()\n    print(n)\n    for i in range(n):\n        print(nns[i])\n        for j in range(nns[i]):\n            print(nums[i][j])\n';
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
                        customInputContent += inputCommaSeparatedValues.length.toString() + '\n';
                        for (let i = 0; i < inputCommaSeparatedValues.length; ++i) {
                            customInputContent += parseInt(inputCommaSeparatedValues[i]).toString() + '\n';
                        }
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
                let standardOutputResults = await Deno.readTextFile("./sandbox/standardOutputFromPySandbox.txt");
                let outputResults = await Deno.readTextFile("./sandbox/outputFromPySandbox.txt");
                console.log("CCC");
                console.log(standardOutputResults);
                console.log("DDD");
                console.log(outputResults);
                console.log("EEE");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDSCxXQUFXLEVBQ1gsTUFBTSxFQUVOLE1BQU0sR0FFVCxNQUFNLGdDQUFnQyxDQUFDO0FBTXhDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSw2Q0FBNkMsQ0FBQztBQUNyRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sNkNBQTZDLENBQUM7QUFDckUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLDRDQUE0QyxDQUFBO0FBQ25FLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSx5Q0FBeUMsQ0FBQztBQUNwRSxNQUFNLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQztJQUN0QixJQUFJLEVBQUUsUUFBUTtJQUNkLFFBQVEsRUFBRSxRQUFRO0lBQ2xCLFFBQVEsRUFBRSxRQUFRO0lBQ2xCLFFBQVEsRUFBRSxXQUFXO0lBQ3JCLElBQUksRUFBRSxJQUFJO0lBQ1YsR0FBRyxFQUFFO1FBQ0QsT0FBTyxFQUFFLEtBQUs7UUFDZCxPQUFPLEVBQUUsS0FBSztLQUNqQjtDQUNKLENBQUMsQ0FBQztBQUNILE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDaEMsTUFBTSxHQUFHLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQztBQUM5QixNQUFNLE1BQU0sR0FBRyxJQUFJLE1BQU0sRUFBRSxDQUFDO0FBaUM1QixNQUFNLG9CQUFvQixHQUFHLENBQUMsQ0FBQztBQUUvQixJQUFJLGFBQWEsR0FBZSxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsQ0FBQztBQUV4RCxJQUFJLElBQUksR0FBK0IsRUFBRSxDQUFDO0FBRTFDLElBQUksWUFBWSxHQUErQixFQUFFLENBQUM7QUFFbEQsSUFBSSxhQUFhLEdBQThDLEVBQUUsQ0FBQztBQUVsRSxJQUFJLGtCQUFrQixHQUFzQixFQUFFLENBQUM7QUFDL0MsSUFB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QyxHQUFHLEVBQUUsa0JBQWtCO1FBQ3JDLEtBQUssRUFBRSxZQUFZO0tBQ3RCLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQyxDQUFDO0FBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNyQyxNQUFNLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgICBBcHBsaWNhdGlvbixcbiAgICBSb3V0ZXIsXG4gICAgUm91dGVyQ29udGV4dCxcbiAgICBTdGF0dXMsXG4gICAgc2VuZCxcbn0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3gvb2FrL21vZC50c1wiO1xuXG5pbXBvcnQgeyBNYXRjaG1ha2luZ0RhdGEgfSBmcm9tIFwiLi9yZWFjdC1hcHAvc3JjL2NvbXBvbmVudHMvY29tbW9uL2ludGVyZmFjZXMvbWF0Y2htYWtpbmdEYXRhLnRzXCI7XG5pbXBvcnQgeyBRdWVzdGlvbkRhdGEgfSBmcm9tIFwiLi9yZWFjdC1hcHAvc3JjL2NvbXBvbmVudHMvY29tbW9uL2ludGVyZmFjZXMvbWF0Y2htYWtpbmdEYXRhLnRzXCI7XG5pbXBvcnQgeyBUZXN0Q2FzZXNQYXNzZWQgfSBmcm9tIFwiLi9yZWFjdC1hcHAvc3JjL2NvbXBvbmVudHMvY29tbW9uL2ludGVyZmFjZXMvbWF0Y2htYWtpbmdEYXRhLnRzXCI7XG5cbmltcG9ydCB7IENsaWVudCB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC94L3Bvc3RncmVzQHYwLjE1LjAvbW9kLnRzXCI7XG5pbXBvcnQgeyBjcnlwdG8gfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQDAuMTMyLjAvY3J5cHRvL21vZC50c1wiO1xuaW1wb3J0IHsgbmFub2lkIH0gZnJvbSAnaHR0cHM6Ly9kZW5vLmxhbmQveC9uYW5vaWRAdjMuMC4wL2FzeW5jLnRzJ1xuaW1wb3J0IHsgZW5zdXJlRGlyIH0gZnJvbSAnaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQDAuMTM2LjAvZnMvbW9kLnRzJztcbmNvbnN0IGNsaWVudCA9IG5ldyBDbGllbnQoe1xuICAgIHVzZXI6IFwibGljb2RlXCIsXG4gICAgZGF0YWJhc2U6IFwibGljb2RlXCIsXG4gICAgcGFzc3dvcmQ6IFwiZWRvY2lsXCIsXG4gICAgaG9zdG5hbWU6IFwibG9jYWxob3N0XCIsXG4gICAgcG9ydDogNTQzMixcbiAgICB0bHM6IHtcbiAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgIGVuZm9yY2U6IGZhbHNlLFxuICAgIH0sXG59KTtcbmNvbnN0IGVudiA9IERlbm8uZW52LnRvT2JqZWN0KCk7XG5jb25zdCBhcHAgPSBuZXcgQXBwbGljYXRpb24oKTtcbmNvbnN0IHJvdXRlciA9IG5ldyBSb3V0ZXIoKTtcblxuaW50ZXJmYWNlIEhlbGxvV29ybGQge1xuICAgIHRleHQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFVzZXIge1xuICAgIGVtYWlsOiB7IHZhbHVlOiBzdHJpbmcgfTtcbiAgICB1c2VybmFtZTogeyB2YWx1ZTogc3RyaW5nIH07XG4gICAgcGFzc3dvcmQ6IHsgdmFsdWU6IHN0cmluZyB9O1xufVxuXG5pbnRlcmZhY2UgTWF0Y2htYWtpbmdVc2VyIHtcbiAgICBlbG9SYXRpbmc6IG51bWJlcjtcbiAgICBzaWQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIENvZGVTdWJtaXNzaW9uIHtcbiAgICB2YWx1ZTogc3RyaW5nO1xuICAgIGlucHV0OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBUZXN0UmVzdWx0IHtcbiAgICB0ZXN0TmFtZTogc3RyaW5nLFxuICAgIHBhc3NlZDogYm9vbGVhblxufVxuXG5pbnRlcmZhY2UgUXVlc3Rpb25JbmZvcm1hdGlvbiB7XG4gICAgcXVlc3Rpb25JZDogbnVtYmVyLFxuICAgIGlucHV0Rm9ybWF0OiBzdHJpbmdbXSxcbiAgICBvdXRwdXRGb3JtYXQ6IHN0cmluZ1tdLFxufVxuXG5jb25zdCBudW1RdWVzdGlvbnNQZXJNYXRjaCA9IDM7XG5cbmxldCBoZWxsb1dvcmxkVmFyOiBIZWxsb1dvcmxkID0geyB0ZXh0OiAnSGVsbG8gV29ybGQnIH07XG5cbmxldCBzaWRzOiB7IFtuYW1lOiBzdHJpbmddOiBzdHJpbmcgfSA9IHt9O1xuXG5sZXQgc2lkc1Byb2dyZXNzOiB7IFtuYW1lOiBzdHJpbmddOiBudW1iZXIgfSA9IHt9O1xuXG5sZXQgc2lkc1F1ZXN0aW9uczogeyBbbmFtZTogc3RyaW5nXTogUXVlc3Rpb25JbmZvcm1hdGlvbltdIH0gPSB7fTtcblxubGV0IG1hdGNobWFraW5nUXVldWUyNTogTWF0Y2htYWtpbmdVc2VyW10gPSBbXTtcbmxldCBtYXRjaG1ha2luZ1F1ZXVlNTA6IE1hdGNobWFraW5nVXNlcltdID0gW107XG5sZXQgbWF0Y2htYWtpbmdRdWV1ZTEwMDogTWF0Y2htYWtpbmdVc2VyW10gPSBbXTtcbmxldCBtYXRjaG1ha2luZ1F1ZXVlMjAwOiBNYXRjaG1ha2luZ1VzZXJbXSA9IFtdO1xubGV0IG1hdGNobWFraW5nUXVldWU1MDA6IE1hdGNobWFraW5nVXNlcltdID0gW107XG5cbmxldCBtYXRjaGVzOiB7IFtuYW1lOiBzdHJpbmddOiBzdHJpbmcgfSA9IHt9O1xuXG5jb25zdCBudW1UZXN0Q2FzZXM6IG51bWJlciA9IDExO1xuXG5mdW5jdGlvbiBnZW5lcmF0ZVRlc3RDYXNlU3RyaW5nKGFsbFRlc3RDYXNlczogc3RyaW5nW10sIGZvcm1hdDogc3RyaW5nW10sIGo6IG51bWJlciwgc2hvdWxkUHJpbnQ6IGJvb2xlYW4pIHtcbiAgICBsZXQgdGVzdENhc2VTdHJpbmcgPSAnJztcbiAgICBsZXQgdGVzdENhc2UgPSBhbGxUZXN0Q2FzZXNbal0uc3BsaXQoJzsnKTtcbiAgICBsZXQgayA9IDA7XG4gICAgbGV0IG0gPSAwO1xuICAgIGxldCBtTWF4ID0gMDtcbiAgICBsZXQgbiA9IDA7XG4gICAgbGV0IG5NYXggPSAwO1xuICAgIGxldCBpbnNpZGVBcnJheSA9IGZhbHNlO1xuICAgIGxldCBpbnNpZGVBcnJheUFycmF5ID0gZmFsc2U7XG4gICAgaWYgKHNob3VsZFByaW50KSB7IGNvbnNvbGUubG9nKFwiT1VUUFVUT1VUUFVUT1VUUFVUT1VUUFVUT1VUUFVUT1VUUFVUT1VUUFVUT1VUUFVUT1VUUFVUXCIpOyB9XG4gICAgZm9yIChsZXQgbCA9IDA7IGwgPCB0ZXN0Q2FzZS5sZW5ndGg7ICsrbCkge1xuICAgICAgICBpZiAoc2hvdWxkUHJpbnQpIHsgY29uc29sZS5sb2coXCJMXCIgKyBsLnRvU3RyaW5nKCkgKyBcIkxcIik7IGNvbnNvbGUubG9nKFwiTElcIiArIHRlc3RDYXNlW2xdICsgXCJMSVwiKTsgfVxuICAgICAgICBpZiAoZm9ybWF0W2tdID09ICduJykge1xuICAgICAgICAgICAgaWYgKHNob3VsZFByaW50KSB7IGNvbnNvbGUubG9nKFwiS1wiICsgay50b1N0cmluZygpICsgXCJLXCIpOyB9XG4gICAgICAgICAgICB0ZXN0Q2FzZVN0cmluZyArPSB0ZXN0Q2FzZVtsXSArICdcXG4nO1xuICAgICAgICAgICAgKytrO1xuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdFtrXSA9PSAnYScpIHtcbiAgICAgICAgICAgIGlmIChpbnNpZGVBcnJheSkge1xuICAgICAgICAgICAgICAgIGlmIChtIDwgbU1heCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2hvdWxkUHJpbnQpIHsgY29uc29sZS5sb2coXCJNXCIgKyBtLnRvU3RyaW5nKCkgKyBcIk1cIik7IH1cbiAgICAgICAgICAgICAgICAgICAgdGVzdENhc2VTdHJpbmcgKz0gdGVzdENhc2VbbF0gKyAnXFxuJztcbiAgICAgICAgICAgICAgICAgICAgKyttO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzaG91bGRQcmludCkgeyBjb25zb2xlLmxvZyhcIktLXCIgKyBrLnRvU3RyaW5nKCkgKyBcIktLXCIpOyB9XG4gICAgICAgICAgICAgICAgICAgIGluc2lkZUFycmF5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICsraztcbiAgICAgICAgICAgICAgICAgICAgLS1sO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHNob3VsZFByaW50KSB7IGNvbnNvbGUubG9nKFwiTU1cIiArIG0udG9TdHJpbmcoKSArIFwiTU1cIik7IH1cbiAgICAgICAgICAgICAgICB0ZXN0Q2FzZVN0cmluZyArPSB0ZXN0Q2FzZVtsXSArICdcXG4nO1xuICAgICAgICAgICAgICAgIG0gPSAwO1xuICAgICAgICAgICAgICAgIG1NYXggPSBwYXJzZUludCh0ZXN0Q2FzZVtsXSk7XG4gICAgICAgICAgICAgICAgaW5zaWRlQXJyYXkgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGZvcm1hdFtrXSA9PSAnYWEnKSB7XG4gICAgICAgICAgICBpZiAoaW5zaWRlQXJyYXkpIHtcbiAgICAgICAgICAgICAgICBpZiAobSA8IG1NYXgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluc2lkZUFycmF5QXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuIDwgbk1heCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzaG91bGRQcmludCkgeyBjb25zb2xlLmxvZyhcIk5cIiArIG4udG9TdHJpbmcoKSArIFwiTlwiKTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlc3RDYXNlU3RyaW5nICs9IHRlc3RDYXNlW2xdICsgJ1xcbic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKytuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2hvdWxkUHJpbnQpIHsgY29uc29sZS5sb2coXCJNTU1cIiArIG0udG9TdHJpbmcoKSArIFwiTU1NXCIpOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zaWRlQXJyYXlBcnJheSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrbTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAtLWw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2hvdWxkUHJpbnQpIHsgY29uc29sZS5sb2coXCJOTlwiICsgbi50b1N0cmluZygpICsgXCJOTlwiKTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGVzdENhc2VTdHJpbmcgKz0gdGVzdENhc2VbbF0gKyAnXFxuJztcbiAgICAgICAgICAgICAgICAgICAgICAgIG4gPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgbk1heCA9IHBhcnNlSW50KHRlc3RDYXNlW2xdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc2lkZUFycmF5QXJyYXkgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNob3VsZFByaW50KSB7IGNvbnNvbGUubG9nKFwiS0tLXCIgKyBrLnRvU3RyaW5nKCkgKyBcIktLS1wiKTsgfVxuICAgICAgICAgICAgICAgICAgICBpbnNpZGVBcnJheSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICArK2s7XG4gICAgICAgICAgICAgICAgICAgIC0tbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChzaG91bGRQcmludCkgeyBjb25zb2xlLmxvZyhcIk1NTU1cIiArIG0udG9TdHJpbmcoKSArIFwiTU1NTVwiKTsgfVxuICAgICAgICAgICAgICAgIHRlc3RDYXNlU3RyaW5nICs9IHRlc3RDYXNlW2xdICsgJ1xcbic7XG4gICAgICAgICAgICAgICAgbSA9IDA7XG4gICAgICAgICAgICAgICAgbU1heCA9IHBhcnNlSW50KHRlc3RDYXNlW2xdKTtcbiAgICAgICAgICAgICAgICBpbnNpZGVBcnJheSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHNob3VsZFByaW50KSB7IGNvbnNvbGUubG9nKFwiRU5EUFVURU5EUFVURU5EUFVURU5EUFVURU5EUFVURU5EUFVURU5EUFVURU5EUFVURU5EUFVUXCIpOyB9XG4gICAgaWYgKHNob3VsZFByaW50KSB7IGNvbnNvbGUubG9nKFwiREVCUFVUREVCUFVUREVCUFVUREVCUFVUREVCUFVUREVCUFVUREVCUFVUREVCUFVUREVCUFVUXCIpOyB9XG4gICAgaWYgKHNob3VsZFByaW50KSB7IGNvbnNvbGUubG9nKHRlc3RDYXNlU3RyaW5nKTsgfVxuICAgIGlmIChzaG91bGRQcmludCkgeyBjb25zb2xlLmxvZyhcIkZJTlBVVEZJTlBVVEZJTlBVVEZJTlBVVEZJTlBVVEZJTlBVVEZJTlBVVEZJTlBVVEZJTlBVVFwiKTsgfVxuICAgIHJldHVybiB0ZXN0Q2FzZVN0cmluZztcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVTdHViU3RyaW5nKGlucHV0Rm9ybWF0OiBzdHJpbmdbXSwgb3V0cHV0Rm9ybWF0OiBzdHJpbmdbXSwgZnVuY3Rpb25TaWduYXR1cmU6IHN0cmluZywgbm9ybWFsU3R1YjogYm9vbGVhbikge1xuICAgIGxldCBzdHViU3RyaW5nID0gJ1xcblxcbmltcG9ydCBzeXNcXG5cXG5pZiBfX25hbWVfXyA9PSBcIl9fbWFpbl9fXCI6XFxuJztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0Rm9ybWF0Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChpbnB1dEZvcm1hdFtpXSA9PSAnbicpIHtcbiAgICAgICAgICAgIHN0dWJTdHJpbmcgKz0gJyAgICBwJyArIGkudG9TdHJpbmcoKSArICcgPSBpbnQoaW5wdXQoKSlcXG4gICAgcHJpbnQoXCJHXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgIHByaW50KHAnICsgaS50b1N0cmluZygpICsgJywgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgcHJpbnQoXCJIXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuJztcbiAgICAgICAgfSBlbHNlIGlmIChpbnB1dEZvcm1hdFtpXSA9PSAnYScpIHtcbiAgICAgICAgICAgIHN0dWJTdHJpbmcgKz0gJyAgICBuJyArIGkudG9TdHJpbmcoKSArICcgPSBpbnQoaW5wdXQoKSlcXG4gICAgcHJpbnQoXCJHXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgIHByaW50KG4nICsgaS50b1N0cmluZygpICsgJywgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgcHJpbnQoXCJIXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgIHAnICsgaS50b1N0cmluZygpICsgJyA9IFtdXFxuICAgIG51bXMgPSBbXVxcbiAgICBmb3IgaSBpbiByYW5nZShuJyArIGkudG9TdHJpbmcoKSArICcpOlxcbiAgICAgICAgZ2ggPSBpbnQoaW5wdXQoKSlcXG4gICAgICAgIHByaW50KFwiR1wiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICAgICAgcHJpbnQoZ2gsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgICAgICBwcmludChcIkhcIiwgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgICAgIG51bXMuYXBwZW5kKGdoKVxcbic7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5wdXRGb3JtYXRbaV0gPT0gJ2FhJykge1xuICAgICAgICAgICAgc3R1YlN0cmluZyArPSAnICAgIG4nICsgaS50b1N0cmluZygpICsgJyA9IGludChpbnB1dCgpKVxcbiAgICBwJyArIGkudG9TdHJpbmcoKSArICcgPSBbXVxcbiAgICBmb3IgaSBpbiByYW5nZShuJyArIGkudG9TdHJpbmcoKSArICcpOlxcbiAgICAgICAgbm4nICsgaS50b1N0cmluZygpICsgJyA9IGludChpbnB1dCgpKVxcbiAgICAgICAgcHAnICsgaS50b1N0cmluZygpICsgJyA9IFtdXFxuICAgICAgICBmb3IgaiBpbiByYW5nZShubicgKyBpLnRvU3RyaW5nKCkgKyAnKTpcXG4gICAgICAgICAgICBwcCcgKyBpLnRvU3RyaW5nKCkgKyAnLmFwcGVuZChpbnQoaW5wdXQoKSkpXFxuICAgICAgICBwJyArIGkudG9TdHJpbmcoKSArICcuYXBwZW5kKHBwJyArIGkudG9TdHJpbmcoKSArICcpXFxuJztcbiAgICAgICAgfVxuICAgIH1cbiAgICBzdHViU3RyaW5nICs9ICcgICAgcmVzdWx0ID0gJyArIGZ1bmN0aW9uU2lnbmF0dXJlLnNwbGl0KCcoJylbMF0uc3BsaXQoJ2RlZiAnKVsxXSArICcoJztcbiAgICBpZiAoaW5wdXRGb3JtYXQubGVuZ3RoID4gMCkge1xuICAgICAgICBzdHViU3RyaW5nICs9ICdwMCc7XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgaW5wdXRGb3JtYXQubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgc3R1YlN0cmluZyArPSAnLCBwJyArIGkudG9TdHJpbmcoKVxuICAgIH1cbiAgICBzdHViU3RyaW5nICs9ICcpXFxuJztcbiAgICBpZiAobm9ybWFsU3R1Yikge1xuICAgICAgICBzdHViU3RyaW5nICs9ICcgICAgcHJpbnQoXCJ2MTB6ZzU3WklVRjZ2alpnU1BhRFk3MFRRZmY4d1RIWGdvZFgyb3RyRE1FYXkwV2xTMzZNakRoSEgwNTR1UnJGeEdISFNlZ3ZHY0E3ZWFxQlwiKVxcbidcbiAgICAgICAgaWYgKG91dHB1dEZvcm1hdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBpZiAob3V0cHV0Rm9ybWF0WzBdID09ICduJykge1xuICAgICAgICAgICAgICAgIHN0dWJTdHJpbmcgKz0gJyAgICBwcmludChyZXN1bHQpXFxuJztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAob3V0cHV0Rm9ybWF0WzBdID09ICdhJykge1xuICAgICAgICAgICAgICAgIHN0dWJTdHJpbmcgKz0gJyAgICBwcmludChsZW4ocmVzdWx0KSlcXG4gICAgZm9yIHIgaW4gcmVzdWx0OlxcbiAgICAgICAgcHJpbnQocilcXG4nO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRGb3JtYXRbMF0gPT0gJ2FhJykge1xuICAgICAgICAgICAgICAgIHN0dWJTdHJpbmcgKz0gJyAgICBwcmludChsZW4ocmVzdWx0KSlcXG4gICAgZm9yIHIgaW4gcmVzdWx0OlxcbiAgICAgICAgcHJpbnQobGVuKHIpKVxcbiAgICAgICAgZm9yIHJyIGluIHI6XFxuICAgICAgICAgICAgcHJpbnQocnIpXFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3R1YlN0cmluZztcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVDbGVhblN0cmluZyhvdXRwdXRGb3JtYXQ6IHN0cmluZ1tdLCBub3JtYWxDbGVhbjogYm9vbGVhbikge1xuICAgIGxldCBjbGVhblN0cmluZyA9ICdpbXBvcnQgc3lzXFxuXFxuaWYgX19uYW1lX18gPT0gXCJfX21haW5fX1wiOlxcbic7XG4gICAgaWYgKG5vcm1hbENsZWFuKSB7XG4gICAgICAgIGNsZWFuU3RyaW5nICs9ICcgICAgd2hpbGUgVHJ1ZTpcXG4gICAgICAgIHRyeUlucHV0ID0gaW5wdXQoKVxcbiAgICAgICAgcHJpbnQoXCJPS1wiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICAgICAgcHJpbnQodHJ5SW5wdXQsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgICAgICBwcmludChcIlBMXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgICAgICBpZiAodHJ5SW5wdXQgPT0gXCJ2MTB6ZzU3WklVRjZ2alpnU1BhRFk3MFRRZmY4d1RIWGdvZFgyb3RyRE1FYXkwV2xTMzZNakRoSEgwNTR1UnJGeEdISFNlZ3ZHY0E3ZWFxQlwiKTpcXG4gICAgICAgICAgICBicmVha1xcbic7XG4gICAgfVxuICAgIGlmIChvdXRwdXRGb3JtYXQubGVuZ3RoID4gMCkge1xuICAgICAgICBpZiAob3V0cHV0Rm9ybWF0WzBdID09ICduJykge1xuICAgICAgICAgICAgY2xlYW5TdHJpbmcgKz0gJyAgICBxdyA9IGlucHV0KClcXG4gICAgcHJpbnQoXCJRXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgIHByaW50KHF3LCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICBwcmludChcIldcIiwgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgcHJpbnQocXcpXFxuJztcbiAgICAgICAgfSBlbHNlIGlmIChvdXRwdXRGb3JtYXRbMF0gPT0gJ2EnKSB7XG4gICAgICAgICAgICBjbGVhblN0cmluZyArPSAnICAgIG4gPSBpbnQoaW5wdXQoKSlcXG4gICAgcHJpbnQoXCJRXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgIHByaW50KG4sIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgIHByaW50KFwiV1wiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICBudW1zID0gW11cXG4gICAgZm9yIGkgaW4gcmFuZ2Uobik6XFxuICAgICAgICBxdyA9IGludChpbnB1dCgpKVxcbiAgICAgICAgcHJpbnQoXCJRXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgICAgICBwcmludChxdywgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgICAgIHByaW50KFwiV1wiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICAgICAgbnVtcy5hcHBlbmQocXcpXFxuICAgIG51bXMuc29ydCgpXFxuICAgIHByaW50KG4pXFxuICAgIGZvciBpIGluIHJhbmdlKG4pOlxcbiAgICAgICAgcHJpbnQobnVtc1tpXSknO1xuICAgICAgICB9IGVsc2UgaWYgKG91dHB1dEZvcm1hdFswXSA9PSAnYWEnKSB7XG4gICAgICAgICAgICBjbGVhblN0cmluZyArPSAnICAgIG4gPSBpbnQoaW5wdXQoKSlcXG4gICAgcHJpbnQoXCJRXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgIHByaW50KG4sIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgIHByaW50KFwiV1wiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICBubnMgPSBbXVxcbiAgICBudW1zID0gW11cXG4gICAgZm9yIGkgaW4gcmFuZ2Uobik6XFxuICAgICAgICBubiA9IGludChpbnB1dCgpKVxcbiAgICAgICAgcHJpbnQoXCJRXCIsIGVuZD1cIlwiLCBmaWxlPXN5cy5zdGRlcnIpXFxuICAgICAgICBwcmludChubiwgZW5kPVwiXCIsIGZpbGU9c3lzLnN0ZGVycilcXG4gICAgICAgIHByaW50KFwiV1wiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICAgICAgbm5zLmFwcGVuZChubilcXG4gICAgICAgIG5udW1zID0gW11cXG4gICAgICAgIGZvciBqIGluIHJhbmdlKG5uKTpcXG4gICAgICAgICAgICBxdyA9IGludChpbnB1dCgpKVxcbiAgICAgICAgICAgIHByaW50KFwiUVwiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICAgICAgICAgIHByaW50KHF3LCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICAgICAgICAgIHByaW50KFwiV1wiLCBlbmQ9XCJcIiwgZmlsZT1zeXMuc3RkZXJyKVxcbiAgICAgICAgICAgIG5udW1zLmFwcGVuZChxdylcXG4gICAgICAgIG5udW1zLnNvcnQoKVxcbiAgICAgICAgbnVtcy5hcHBlbmQobm51bXMpXFxuICAgIG51bXMuc29ydCgpXFxuICAgIHByaW50KG4pXFxuICAgIGZvciBpIGluIHJhbmdlKG4pOlxcbiAgICAgICAgcHJpbnQobm5zW2ldKVxcbiAgICAgICAgZm9yIGogaW4gcmFuZ2Uobm5zW2ldKTpcXG4gICAgICAgICAgICBwcmludChudW1zW2ldW2pdKVxcbic7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNsZWFuU3RyaW5nO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZU1ha2VSZXBvcnRTdHJpbmcoaTogbnVtYmVyKSB7XG4gICAgLy9yZXR1cm4gJyMhL2Jpbi9iYXNoXFxuXFxuKGNhdCBzdHViLnB5KSA+PiBhbnN3ZXIucHlcXG4oY2F0IHN0dWJDdXN0b21JbnB1dC5weSkgPj4gYW5zd2VyQ3VzdG9tSW5wdXQucHlcXG5cXG5jb250YWluZXJJRD0kKGRvY2tlciBydW4gLWRpdCBweS1zYW5kYm94KVxcbmRvY2tlciBjcCBUZXN0SW5wdXRzLyAke2NvbnRhaW5lcklEfTpob21lL1Rlc3RFbnZpcm9ubWVudC9UZXN0SW5wdXRzL1xcbmRvY2tlciBjcCBUZXN0T3V0cHV0cy8gJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvVGVzdE91dHB1dHMvXFxuZG9ja2VyIGNwIGFuc3dlci5weSAke2NvbnRhaW5lcklEfTpob21lL1Rlc3RFbnZpcm9ubWVudC9hbnN3ZXIucHlcXG5kb2NrZXIgY3AgY3VzdG9tSW5wdXQuaW4gJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvY3VzdG9tSW5wdXQuaW5cXG5kb2NrZXIgY3AgYW5zd2VyQ3VzdG9tSW5wdXQucHkgJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvYW5zd2VyQ3VzdG9tSW5wdXQucHlcXG5kb2NrZXIgY3AgY2xlYW4ucHkgJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvY2xlYW4ucHlcXG5cXG5kb2NrZXIgZXhlYyAke2NvbnRhaW5lcklEfSBzaCAtYyBcImNkIGhvbWUvVGVzdEVudmlyb25tZW50LyAmJiB0aW1lb3V0IDEwIC4vbWFrZVJlcG9ydC5zaFwiXFxuXFxuZG9ja2VyIGNwICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L3JlcG9ydC50eHQgcmVwb3J0RnJvbVB5U2FuZGJveC50eHRcXG5kb2NrZXIgY3AgJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvc3RhbmRhcmRPdXRwdXQudHh0IHN0YW5kYXJkT3V0cHV0RnJvbVB5U2FuZGJveC50eHRcXG5kb2NrZXIgY3AgJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvb3V0cHV0LnR4dCBvdXRwdXRGcm9tUHlTYW5kYm94LnR4dFxcblxcbmRvY2tlciBraWxsICR7Y29udGFpbmVySUR9XFxuXFxuZG9ja2VyIHJtICR7Y29udGFpbmVySUR9XFxuXFxuJztcbiAgICByZXR1cm4gJyMhL2Jpbi9iYXNoXFxuXFxuKGNhdCBzdHViLnB5KSA+PiAuLi9hbnN3ZXIucHlcXG4oY2F0IHN0dWJDdXN0b21JbnB1dC5weSkgPj4gLi4vYW5zd2VyQ3VzdG9tSW5wdXQucHlcXG5cXG5jb250YWluZXJJRD0kKGRvY2tlciBydW4gLWRpdCBweS1zYW5kYm94KVxcbmRvY2tlciBjcCBUZXN0SW5wdXRzLyAke2NvbnRhaW5lcklEfTpob21lL1Rlc3RFbnZpcm9ubWVudC9UZXN0SW5wdXRzL1xcbmRvY2tlciBjcCBUZXN0T3V0cHV0cy8gJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvVGVzdE91dHB1dHMvXFxuZG9ja2VyIGNwIC4uL2Fuc3dlci5weSAke2NvbnRhaW5lcklEfTpob21lL1Rlc3RFbnZpcm9ubWVudC9hbnN3ZXIucHlcXG5kb2NrZXIgY3AgLi4vY3VzdG9tSW5wdXQuaW4gJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvY3VzdG9tSW5wdXQuaW5cXG5kb2NrZXIgY3AgLi4vYW5zd2VyQ3VzdG9tSW5wdXQucHkgJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvYW5zd2VyQ3VzdG9tSW5wdXQucHlcXG5kb2NrZXIgY3AgY2xlYW4ucHkgJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvY2xlYW4ucHlcXG5kb2NrZXIgY3AgY2xlYW5PdXRwdXQucHkgJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvY2xlYW5PdXRwdXQucHlcXG5cXG5kb2NrZXIgZXhlYyAke2NvbnRhaW5lcklEfSBzaCAtYyBcImNkIGhvbWUvVGVzdEVudmlyb25tZW50LyAmJiB0aW1lb3V0IDEwIC4vbWFrZVJlcG9ydC5zaFwiXFxuXFxuZG9ja2VyIGNwICR7Y29udGFpbmVySUR9OmhvbWUvVGVzdEVudmlyb25tZW50L3JlcG9ydC50eHQgLi4vcmVwb3J0RnJvbVB5U2FuZGJveC50eHRcXG5kb2NrZXIgY3AgJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvc3RhbmRhcmRPdXRwdXQudHh0IC4uL3N0YW5kYXJkT3V0cHV0RnJvbVB5U2FuZGJveC50eHRcXG5kb2NrZXIgY3AgJHtjb250YWluZXJJRH06aG9tZS9UZXN0RW52aXJvbm1lbnQvb3V0cHV0LnR4dCAuLi9vdXRwdXRGcm9tUHlTYW5kYm94LnR4dFxcblxcbmRvY2tlciBraWxsICR7Y29udGFpbmVySUR9XFxuXFxuZG9ja2VyIHJtICR7Y29udGFpbmVySUR9XFxuXFxuJztcbn1cblxuYXN5bmMgZnVuY3Rpb24gbG9hZFRlc3RDYXNlcygpIHtcbiAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgIGNvbnN0IHF1ZXN0aW9uc1Jlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IGNvdW50KCopIGZyb20gcXVlc3Rpb25zXCIpO1xuICAgIGxldCBudW1RdWVzdGlvbnMgPSBOdW1iZXIocXVlc3Rpb25zUmVzdWx0LnJvd3NbMF1bMF0gYXMgbnVtYmVyKTtcbiAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMTsgaSA8PSBudW1RdWVzdGlvbnM7ICsraSkge1xuICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICBjb25zdCBzZWxlY3RlZFJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IGZ1bmN0aW9uX3NpZ25hdHVyZSwgaW5wdXRfb3V0cHV0X2Zvcm1hdCwgdGVzdF9jYXNlcyBmcm9tIHF1ZXN0aW9ucyB3aGVyZSBpZCA9IFwiICsgaS50b1N0cmluZygpKTtcbiAgICAgICAgbGV0IGZ1bmN0aW9uU2lnbmF0dXJlOiBzdHJpbmcgPSBzZWxlY3RlZFJlc3VsdC5yb3dzWzBdWzBdIGFzIHN0cmluZztcbiAgICAgICAgbGV0IGlucHV0T3V0cHV0Rm9ybWF0ID0gc2VsZWN0ZWRSZXN1bHQucm93c1swXVsxXSBhcyBzdHJpbmc7XG4gICAgICAgIGxldCB0ZXN0Q2FzZXMgPSBzZWxlY3RlZFJlc3VsdC5yb3dzWzBdWzJdIGFzIHN0cmluZztcbiAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICBsZXQgaW5wdXRPdXRwdXRGb3JtYXRzID0gaW5wdXRPdXRwdXRGb3JtYXQuc3BsaXQoJ3wnKTtcbiAgICAgICAgbGV0IGlucHV0Rm9ybWF0OiBzdHJpbmdbXSA9IGlucHV0T3V0cHV0Rm9ybWF0c1swXS5zcGxpdCgnOycpO1xuICAgICAgICBpbnB1dEZvcm1hdC5zaGlmdCgpO1xuICAgICAgICBsZXQgb3V0cHV0Rm9ybWF0OiBzdHJpbmdbXSA9IGlucHV0T3V0cHV0Rm9ybWF0c1sxXS5zcGxpdCgnOycpO1xuICAgICAgICBvdXRwdXRGb3JtYXQuc2hpZnQoKTtcbiAgICAgICAgbGV0IGFsbFRlc3RDYXNlczogc3RyaW5nW10gPSB0ZXN0Q2FzZXMuc3BsaXQoJ3wnKTtcbiAgICAgICAgZm9yIChsZXQgajogbnVtYmVyID0gMDsgaiA8IG51bVRlc3RDYXNlczsgKytqKSB7XG4gICAgICAgICAgICBhd2FpdCBlbnN1cmVEaXIoXCIuL3NhbmRib3gvXCIgKyBpLnRvU3RyaW5nKCkgKyBcIi9UZXN0SW5wdXRzL1wiKTtcbiAgICAgICAgICAgIGF3YWl0IGVuc3VyZURpcihcIi4vc2FuZGJveC9cIiArIGkudG9TdHJpbmcoKSArIFwiL1Rlc3RPdXRwdXRzL1wiKTtcbiAgICAgICAgICAgIGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZShcIi4vc2FuZGJveC9cIiArIGkudG9TdHJpbmcoKSArIFwiL1Rlc3RJbnB1dHMvdGVzdFwiICsgKGogKyAxKS50b1N0cmluZygpICsgXCIuaW5cIixcbiAgICAgICAgICAgICAgICBnZW5lcmF0ZVRlc3RDYXNlU3RyaW5nKGFsbFRlc3RDYXNlcywgaW5wdXRGb3JtYXQsIGosIC8qaSA9PSAyICYmIGogPT0gMCovZmFsc2UpKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgc2Vjb25kSGFsZlRocmVzaG9sZCA9IDIgKiBudW1UZXN0Q2FzZXM7XG4gICAgICAgIGZvciAobGV0IGogPSAxMTsgaiA8IHNlY29uZEhhbGZUaHJlc2hvbGQ7ICsraikge1xuICAgICAgICAgICAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKFwiLi9zYW5kYm94L1wiICsgaS50b1N0cmluZygpICsgXCIvVGVzdE91dHB1dHMvdGVzdFwiICsgKGogLSAxMCkudG9TdHJpbmcoKSArIFwiLm91dFwiLFxuICAgICAgICAgICAgICAgIGdlbmVyYXRlVGVzdENhc2VTdHJpbmcoYWxsVGVzdENhc2VzLCBvdXRwdXRGb3JtYXQsIGosIGZhbHNlKSk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKFwiLi9zYW5kYm94L1wiICsgaS50b1N0cmluZygpICsgXCIvc3R1Yi5weVwiLCBnZW5lcmF0ZVN0dWJTdHJpbmcoaW5wdXRGb3JtYXQsIG91dHB1dEZvcm1hdCxcbiAgICAgICAgICAgIGZ1bmN0aW9uU2lnbmF0dXJlLCB0cnVlKSk7XG4gICAgICAgIGF3YWl0IERlbm8ud3JpdGVUZXh0RmlsZShcIi4vc2FuZGJveC9cIiArIGkudG9TdHJpbmcoKSArIFwiL3N0dWJDdXN0b21JbnB1dC5weVwiLCBnZW5lcmF0ZVN0dWJTdHJpbmcoaW5wdXRGb3JtYXQsIG91dHB1dEZvcm1hdCxcbiAgICAgICAgICAgIGZ1bmN0aW9uU2lnbmF0dXJlLCBmYWxzZSkpO1xuICAgICAgICBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoXCIuL3NhbmRib3gvXCIgKyBpLnRvU3RyaW5nKCkgKyBcIi9jbGVhbi5weVwiLCBnZW5lcmF0ZUNsZWFuU3RyaW5nKG91dHB1dEZvcm1hdCwgdHJ1ZSkpO1xuICAgICAgICBhd2FpdCBEZW5vLndyaXRlVGV4dEZpbGUoXCIuL3NhbmRib3gvXCIgKyBpLnRvU3RyaW5nKCkgKyBcIi9jbGVhbk91dHB1dC5weVwiLCBnZW5lcmF0ZUNsZWFuU3RyaW5nKG91dHB1dEZvcm1hdCwgZmFsc2UpKTtcbiAgICAgICAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKFwiLi9zYW5kYm94L1wiICsgaS50b1N0cmluZygpICsgXCIvbWFrZVJlcG9ydC5zaFwiLCBnZW5lcmF0ZU1ha2VSZXBvcnRTdHJpbmcoaSkpO1xuICAgICAgICBhd2FpdCBEZW5vLnJ1bih7XG4gICAgICAgICAgICBjbWQ6IFtcImNobW9kXCIsIFwidSt4XCIsIFwibWFrZVJlcG9ydC5zaFwiXSxcbiAgICAgICAgICAgIGN3ZDogXCIuL3NhbmRib3gvXCIgKyBpLnRvU3RyaW5nKClcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5sb2FkVGVzdENhc2VzKCk7XG5cbmZ1bmN0aW9uIGRlbGF5KHRpbWU6IG51bWJlcikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgdGltZSkpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBzZWxlY3RRdWVzdGlvbnMobWF0Y2htYWtpbmdVc2VyOiBNYXRjaG1ha2luZ1VzZXIpIHtcbiAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgIGNvbnN0IHF1ZXN0aW9uc1Jlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IGNvdW50KCopIGZyb20gcXVlc3Rpb25zXCIpO1xuICAgIGxldCBudW1RdWVzdGlvbnMgPSBOdW1iZXIocXVlc3Rpb25zUmVzdWx0LnJvd3NbMF1bMF0gYXMgbnVtYmVyKTtcbiAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgbGV0IHF1ZXN0aW9uc1NlbGVjdGVkOiBudW1iZXJbXSA9IFtdO1xuICAgIGxldCByYW5kb21QZXJtdXRhdGlvbjogbnVtYmVyW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVF1ZXN0aW9uczsgKytpKSB7XG4gICAgICAgIHJhbmRvbVBlcm11dGF0aW9uW2ldID0gaTtcbiAgICB9XG4gICAgLy8gUGFydGlhbCBGaXNoZXItWWF0ZXMgQWxnb3JpdGhtIGZvciByYW5kb20gc2VsZWN0aW9uIG9mIHF1ZXN0aW9uc1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtUXVlc3Rpb25zUGVyTWF0Y2g7ICsraSkge1xuICAgICAgICBsZXQgaiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG51bVF1ZXN0aW9ucyk7XG4gICAgICAgIFtyYW5kb21QZXJtdXRhdGlvbltpXSwgcmFuZG9tUGVybXV0YXRpb25bal1dID0gW3JhbmRvbVBlcm11dGF0aW9uW2pdLCByYW5kb21QZXJtdXRhdGlvbltpXV07XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtUXVlc3Rpb25zUGVyTWF0Y2g7ICsraSkge1xuICAgICAgICBxdWVzdGlvbnNTZWxlY3RlZC5wdXNoKHJhbmRvbVBlcm11dGF0aW9uW2ldICsgMSk7XG4gICAgfVxuICAgIGxldCBxdWVzdGlvbnNJbmZvcm1hdGlvbjogUXVlc3Rpb25JbmZvcm1hdGlvbltdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBxdWVzdGlvbnNTZWxlY3RlZC5sZW5ndGg7ICsraSkge1xuICAgICAgICBsZXQgaW5wdXRPdXRwdXRGb3JtYXQgPSAnJztcbiAgICAgICAgZm9yICg7Oykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlbGVjdGVkUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgaW5wdXRfb3V0cHV0X2Zvcm1hdCBmcm9tIHF1ZXN0aW9ucyB3aGVyZSBpZCA9IFwiXG4gICAgICAgICAgICAgICAgICAgICsgcXVlc3Rpb25zU2VsZWN0ZWRbaV0udG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSUlJcIik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocXVlc3Rpb25zU2VsZWN0ZWRbaV0udG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJRUVFcIik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coc2VsZWN0ZWRSZXN1bHQpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiV1dXXCIpO1xuICAgICAgICAgICAgICAgIGlucHV0T3V0cHV0Rm9ybWF0ID0gc2VsZWN0ZWRSZXN1bHQucm93c1swXVswXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGlucHV0T3V0cHV0Rm9ybWF0cyA9IGlucHV0T3V0cHV0Rm9ybWF0LnNwbGl0KCd8Jyk7XG4gICAgICAgIGxldCBpbnB1dEZvcm1hdDogc3RyaW5nW10gPSBpbnB1dE91dHB1dEZvcm1hdHNbMF0uc3BsaXQoJzsnKTtcbiAgICAgICAgaW5wdXRGb3JtYXQuc2hpZnQoKTtcbiAgICAgICAgbGV0IG91dHB1dEZvcm1hdDogc3RyaW5nW10gPSBpbnB1dE91dHB1dEZvcm1hdHNbMV0uc3BsaXQoJzsnKTtcbiAgICAgICAgb3V0cHV0Rm9ybWF0LnNoaWZ0KCk7XG4gICAgICAgIGxldCBxdWVzdGlvbkluZm9ybWF0aW9uOiBRdWVzdGlvbkluZm9ybWF0aW9uID0geyBxdWVzdGlvbklkOiBxdWVzdGlvbnNTZWxlY3RlZFtpXSwgaW5wdXRGb3JtYXQ6IGlucHV0Rm9ybWF0LCBvdXRwdXRGb3JtYXQ6IG91dHB1dEZvcm1hdCB9O1xuICAgICAgICBxdWVzdGlvbnNJbmZvcm1hdGlvbi5wdXNoKHF1ZXN0aW9uSW5mb3JtYXRpb24pO1xuICAgIH1cbiAgICBzaWRzUXVlc3Rpb25zW21hdGNobWFraW5nVXNlci5zaWRdID0gcXVlc3Rpb25zSW5mb3JtYXRpb247XG4gICAgc2lkc1F1ZXN0aW9uc1ttYXRjaGVzW21hdGNobWFraW5nVXNlci5zaWRdXSA9IHF1ZXN0aW9uc0luZm9ybWF0aW9uO1xufVxuXG5hc3luYyBmdW5jdGlvbiBhZGRUb1F1ZXVlIChxdWV1ZTogTWF0Y2htYWtpbmdVc2VyW10sIG1hdGNobWFraW5nVXNlcjogTWF0Y2htYWtpbmdVc2VyLCByYW5nZTogbnVtYmVyLCBjb250ZXh0OiBhbnkpIHtcbiAgICBxdWV1ZS5wdXNoKG1hdGNobWFraW5nVXNlcik7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBxdWV1ZS5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAocXVldWVbaV0uc2lkICE9IG1hdGNobWFraW5nVXNlci5zaWRcbiAgICAgICAgICAgICAgICAmJiBNYXRoLmFicyhtYXRjaG1ha2luZ1VzZXIuZWxvUmF0aW5nIC0gcXVldWVbaV0uZWxvUmF0aW5nKSA8PSByYW5nZSkge1xuICAgICAgICAgICAgbWF0Y2hlc1txdWV1ZVtpXS5zaWRdID0gbWF0Y2htYWtpbmdVc2VyLnNpZDtcbiAgICAgICAgICAgIG1hdGNoZXNbbWF0Y2htYWtpbmdVc2VyLnNpZF0gPSBxdWV1ZVtpXS5zaWQ7XG4gICAgICAgICAgICBzaWRzUHJvZ3Jlc3NbcXVldWVbaV0uc2lkXSA9IDA7XG4gICAgICAgICAgICBzaWRzUHJvZ3Jlc3NbbWF0Y2htYWtpbmdVc2VyLnNpZF0gPSAwO1xuICAgICAgICAgICAgLy9jYW4gY2FsbCBnb1NlcnZlci9yZWdpc3RlclBhaXIgaGVyZVxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJhdHRlbXB0aW5nIHJlZ2lzdGVyIHBhaXIgXCIgKyBtYXRjaG1ha2luZ1VzZXIuc2lkICsgXCIsIFwiICsgcXVldWVbaV0uc2lkKVxuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChcImh0dHA6Ly9sb2NhbGhvc3Q6NTAwMC9yZWdpc3RlclBhaXJcIiwge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICAgICBJZDE6IG1hdGNobWFraW5nVXNlci5zaWQsXG4gICAgICAgICAgICAgICAgICAgIElkMjogcXVldWVbaV0uc2lkLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgfSk7IC8vVE9ETyAtIENoZWNrIHJlc3BvbnNlIFxuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2Uuc3RhdHVzKTtcbiAgICAgICAgICAgIC8vY2FuIHByb2JhYmx5IGVsaW1pbmF0ZSB0aGlzLCBtYWluIHB1cnBvc2Ugb2YgdGhpcyBhcGlcbiAgICAgICAgICAgIC8vbWV0aG9kIGlzIHRvIG1hdGNoIHVzZXJzIGFuZCByZWdpc3RlciB0aGVtIHdpdGggdGhlIGdvIHNlcnZlclxuICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0ge1xuICAgICAgICAgICAgICAgIHVzZXJuYW1lOiBzaWRzW21hdGNobWFraW5nVXNlci5zaWRdLFxuICAgICAgICAgICAgICAgIGVsb1JhdGluZzogbWF0Y2htYWtpbmdVc2VyLmVsb1JhdGluZyxcbiAgICAgICAgICAgICAgICBvcHBvbmVudFVzZXJuYW1lOiBzaWRzW3F1ZXVlW2ldLnNpZF0sXG4gICAgICAgICAgICAgICAgb3Bwb25lbnRFbG9SYXRpbmc6IHF1ZXVlW2ldLmVsb1JhdGluZyxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBxdWV1ZS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICBxdWV1ZS5wb3AoKTtcbiAgICAgICAgICAgIHNlbGVjdFF1ZXN0aW9ucyhtYXRjaG1ha2luZ1VzZXIpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5hc3luYyBmdW5jdGlvbiBjaGVja0lmRm91bmRJblF1ZXVlKGRlbGF5VGltZTogbnVtYmVyLCBtYXRjaG1ha2luZ1VzZXI6IE1hdGNobWFraW5nVXNlciwgdXNlcm5hbWU6IHN0cmluZywgY29udGV4dDogYW55KSB7XG4gICAgYXdhaXQgZGVsYXkoZGVsYXlUaW1lKTtcbiAgICBpZiAobWF0Y2htYWtpbmdVc2VyLnNpZCBpbiBtYXRjaGVzKSB7XG4gICAgICAgIGxldCBvcHBvbmVudFVzZXJuYW1lID0gc2lkc1ttYXRjaGVzW21hdGNobWFraW5nVXNlci5zaWRdXTtcbiAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgY29uc3QgdXNlcm5hbWVSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBlbG9fcmF0aW5nIGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICArIHVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICBsZXQgb3Bwb25lbnRFbG9SYXRpbmcgPSB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzBdIGFzIG51bWJlcjtcbiAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7XG4gICAgICAgICAgICB1c2VybmFtZTogc2lkc1ttYXRjaG1ha2luZ1VzZXIuc2lkXSxcbiAgICAgICAgICAgIGVsb1JhdGluZzogbWF0Y2htYWtpbmdVc2VyLmVsb1JhdGluZyxcbiAgICAgICAgICAgIG9wcG9uZW50VXNlcm5hbWU6IG9wcG9uZW50VXNlcm5hbWUsXG4gICAgICAgICAgICBvcHBvbmVudEVsb1JhdGluZzogb3Bwb25lbnRFbG9SYXRpbmcsXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUZyb21RdWV1ZShxdWV1ZTogTWF0Y2htYWtpbmdVc2VyW10sIHNpZDogc3RyaW5nKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBxdWV1ZS5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAocXVldWVbaV0uc2lkID09PSBzaWQpIHtcbiAgICAgICAgICAgIHF1ZXVlLnNwbGljZShpLCAxKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuY29uc3QgcG9ydDogbnVtYmVyID0gK2Vudi5MSUNPREVfUE9SVCB8fCAzMDAwO1xuYXBwLmFkZEV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLCAoZXZ0KSA9PiB7XG4gICAgY29uc29sZS5sb2coZXZ0LmVycm9yKTtcbn0pO1xucm91dGVyXG4gICAgLmdldChcIi9hcGkvaGVsbG8td29ybGRcIiwgKGNvbnRleHQpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IGhlbGxvV29ybGRWYXI7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLnBvc3QoXCIvYXBpL3Bvc3QtaGVsbG8td29ybGRcIiwgYXN5bmMgKGNvbnRleHQ6IFJvdXRlckNvbnRleHQ8YW55PikgPT4ge1xuICAgICAgICBpZiAoIWNvbnRleHQucmVxdWVzdC5oYXNCb2R5KSB7XG4gICAgICAgICAgICBjb250ZXh0LnRocm93KFN0YXR1cy5CYWRSZXF1ZXN0LCBcIkJhZCBSZXF1ZXN0XCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJvZHkgPSBjb250ZXh0LnJlcXVlc3QuYm9keSgpO1xuICAgICAgICBsZXQgaGVsbG9Xb3JsZDogUGFydGlhbDxIZWxsb1dvcmxkPiB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGJvZHkudHlwZSA9PT0gXCJqc29uXCIpIHtcbiAgICAgICAgICAgIGhlbGxvV29ybGQgPSBhd2FpdCBib2R5LnZhbHVlO1xuICAgICAgICB9IGVsc2UgaWYgKGJvZHkudHlwZSA9PT0gXCJmb3JtXCIpIHtcbiAgICAgICAgICAgIGhlbGxvV29ybGQgPSB7fTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIGF3YWl0IGJvZHkudmFsdWUpIHtcbiAgICAgICAgICAgICAgICBoZWxsb1dvcmxkW2tleSBhcyBrZXlvZiBIZWxsb1dvcmxkXSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGJvZHkudHlwZSA9PT0gXCJmb3JtLWRhdGFcIikge1xuICAgICAgICAgICAgY29uc3QgZm9ybURhdGEgPSBhd2FpdCBib2R5LnZhbHVlLnJlYWQoKTtcbiAgICAgICAgICAgIGhlbGxvV29ybGQgPSBmb3JtRGF0YS5maWVsZHM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhlbGxvV29ybGQpIHtcbiAgICAgICAgICAgIGNvbnRleHQuYXNzZXJ0KHR5cGVvZiBoZWxsb1dvcmxkLnRleHQgPT09IFwic3RyaW5nXCIsIFN0YXR1cy5CYWRSZXF1ZXN0KTtcbiAgICAgICAgICAgIGhlbGxvV29ybGRWYXIgPSBoZWxsb1dvcmxkIGFzIEhlbGxvV29ybGQ7XG4gICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLnN0YXR1cyA9IFN0YXR1cy5PSztcbiAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IGhlbGxvV29ybGQ7XG4gICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLnR5cGUgPSBcImpzb25cIjtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb250ZXh0LnRocm93KFN0YXR1cy5CYWRSZXF1ZXN0LCBcIkJhZCBSZXF1ZXN0XCIpO1xuICAgIH0pXG4gICAgLnBvc3QoXCIvYXBpL3JlZ2lzdGVyXCIsIGFzeW5jIChjb250ZXh0OiBSb3V0ZXJDb250ZXh0PGFueT4pID0+IHtcbiAgICAgICAgbGV0IHNpZCA9IGF3YWl0IGNvbnRleHQuY29va2llcy5nZXQoJ3NpZCcpO1xuICAgICAgICBpZiAoIXNpZCkge1xuICAgICAgICAgICAgc2lkID0gYXdhaXQgbmFub2lkKDQwKTtcbiAgICAgICAgICAgIGNvbnRleHQuY29va2llcy5zZXQoJ3NpZCcsIHNpZCk7XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICghY29udGV4dC5yZXF1ZXN0Lmhhc0JvZHkpIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnRocm93KFN0YXR1cy5CYWRSZXF1ZXN0LCBcIkJhZCBSZXF1ZXN0XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgYm9keSA9IGNvbnRleHQucmVxdWVzdC5ib2R5KCk7XG4gICAgICAgICAgICBsZXQgdXNlcjogUGFydGlhbDxVc2VyPiB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmIChib2R5LnR5cGUgPT09IFwianNvblwiKSB7XG4gICAgICAgICAgICAgICAgdXNlciA9IGF3YWl0IGJvZHkudmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgIGNvbnRleHQuYXNzZXJ0KFxuICAgICAgICAgICAgICAgICAgICB0eXBlb2YgdXNlcj8uZW1haWw/LnZhbHVlID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgICAgICYmIHR5cGVvZiB1c2VyPy51c2VybmFtZT8udmFsdWUgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIHVzZXI/LnBhc3N3b3JkPy52YWx1ZSA9PT0gXCJzdHJpbmdcIiwgU3RhdHVzLkJhZFJlcXVlc3QpO1xuICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2Uuc3RhdHVzID0gU3RhdHVzLk9LO1xuICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgdXNlcm5hbWVSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCB1c2VybmFtZSBmcm9tIHVzZXJzIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgICAgICAgICArIHVzZXI/LnVzZXJuYW1lPy52YWx1ZSArIFwiJ1wiKTtcbiAgICAgICAgICAgICAgICBpZiAodXNlcm5hbWVSZXN1bHQucm93cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVtYWlsUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgZW1haWwgZnJvbSB1c2VycyB3aGVyZSBlbWFpbD0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgdXNlcj8uZW1haWw/LnZhbHVlICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZW1haWxSZXN1bHQucm93cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc2FsdEhleFN0cmluZyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzMjsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2FsdEhleFN0cmluZyArPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBNYXRoLnBvdygyLCAzMikpLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzYWx0SGV4U3RyaW5nTGVuZ3RoID0gc2FsdEhleFN0cmluZy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDI1NiAtIHNhbHRIZXhTdHJpbmdMZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNhbHRIZXhTdHJpbmcgPSBcIjBcIiArIHNhbHRIZXhTdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdGV4dEVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXkgPSBuZXcgVWludDhBcnJheShhd2FpdCBjcnlwdG8uc3VidGxlLmRpZ2VzdCgnU0hBMy01MTInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRFbmNvZGVyLmVuY29kZSh1c2VyPy5wYXNzd29yZD8udmFsdWUgKyBzYWx0SGV4U3RyaW5nKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhhc2hlZFBhc3N3b3JkVWludDhBcnJheS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nICs9IChoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXlbaV0gPCAxNiA/IFwiMFwiIDogXCJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXlbaV0udG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nTGVuZ3RoID0gaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMjggLSBoYXNoZWRQYXNzd29yZEhleFN0cmluZ0xlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgPSBcIjBcIiArIGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpbnNlcnQgaW50byBwdWJsaWMudXNlcnMoZW1haWwsIHVzZXJuYW1lLCBoYXNoZWRfcGFzc3dvcmQsIHNhbHQsIG51bV93aW5zLCBudW1fbG9zc2VzLCBjcmVhdGVkX2F0LCB1cGRhdGVkX2F0LCBlbG9fcmF0aW5nLCBoYXNfMjQwMF9yYXRpbmdfaGlzdG9yeSlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgXCIgdmFsdWVzICgnXCIgKyB1c2VyPy5lbWFpbD8udmFsdWUgKyBcIicsICdcIiArIHVzZXI/LnVzZXJuYW1lPy52YWx1ZSArIFwiJywgJ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBcIlxcXFx4XCIgKyBoYXNoZWRQYXNzd29yZEhleFN0cmluZyArIFwiJywgJ1wiICsgXCJcXFxceFwiICsgc2FsdEhleFN0cmluZyArIFwiJywgJzAnLCAnMCcsIG5vdygpLCBub3coKSwgJzEwMDAnLCAnZmFsc2UnKVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzaWQgPSBhd2FpdCBuYW5vaWQoNDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2lkc1tzaWRdID0gdXNlci51c2VybmFtZS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNvbnRleHQuY29va2llcy5zZXQoJ3NpZCcsIHNpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB1c2VyO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0geyB0ZXh0OiAnR2l2ZW4gRW1haWwgQWxyZWFkeSBFeGlzdHMnIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7IHRleHQ6ICdHaXZlbiBVc2VybmFtZSBBbHJlYWR5IEV4aXN0cycgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UudHlwZSA9IFwianNvblwiO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRleHQudGhyb3coU3RhdHVzLkJhZFJlcXVlc3QsIFwiQmFkIFJlcXVlc3RcIik7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLnBvc3QoXCIvYXBpL2xvZ2luXCIsIGFzeW5jIChjb250ZXh0OiBSb3V0ZXJDb250ZXh0PGFueT4pID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICghY29udGV4dC5yZXF1ZXN0Lmhhc0JvZHkpIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnRocm93KFN0YXR1cy5CYWRSZXF1ZXN0LCBcIkJhZCBSZXF1ZXN0XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgYm9keSA9IGNvbnRleHQucmVxdWVzdC5ib2R5KCk7XG4gICAgICAgICAgICBsZXQgdXNlcjogUGFydGlhbDxVc2VyPiB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmIChib2R5LnR5cGUgPT09IFwianNvblwiKSB7XG4gICAgICAgICAgICAgICAgdXNlciA9IGF3YWl0IGJvZHkudmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgIGNvbnRleHQuYXNzZXJ0KFxuICAgICAgICAgICAgICAgICAgICB0eXBlb2YgdXNlcj8uZW1haWw/LnZhbHVlID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgICAgICYmIHR5cGVvZiB1c2VyPy5wYXNzd29yZD8udmFsdWUgPT09IFwic3RyaW5nXCIsIFN0YXR1cy5CYWRSZXF1ZXN0KTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLnN0YXR1cyA9IFN0YXR1cy5PSztcbiAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVzZXJuYW1lUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgZW1haWwsIHVzZXJuYW1lLCBoYXNoZWRfcGFzc3dvcmQsIHNhbHQgZnJvbSB1c2VycyB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgKyB1c2VyPy5lbWFpbD8udmFsdWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgaWYgKHVzZXJuYW1lUmVzdWx0LnJvd3MubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbWFpbFJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IGVtYWlsLCB1c2VybmFtZSwgaGFzaGVkX3Bhc3N3b3JkLCBzYWx0IGZyb20gdXNlcnMgd2hlcmUgZW1haWw9J1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIHVzZXI/LmVtYWlsPy52YWx1ZSArIFwiJ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVtYWlsUmVzdWx0LnJvd3MubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0geyB0ZXh0OiAnR2l2ZW4gRW1haWwgb3IgVXNlcm5hbWUgRG9lcyBOb3QgRXhpc3QnIH07XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc2FsdEhleFN0cmluZyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAoZW1haWxSZXN1bHQucm93c1swXVszXSBhcyBVaW50OEFycmF5KS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNhbHRIZXhTdHJpbmcgKz0gKChlbWFpbFJlc3VsdC5yb3dzWzBdWzNdIGFzIFVpbnQ4QXJyYXkpW2ldIDwgMTYgPyBcIjBcIiA6IFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgKGVtYWlsUmVzdWx0LnJvd3NbMF1bM10gYXMgVWludDhBcnJheSlbaV0udG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHRleHRFbmNvZGVyID0gbmV3IFRleHRFbmNvZGVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgY3J5cHRvLnN1YnRsZS5kaWdlc3QoJ1NIQTMtNTEyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0RW5jb2Rlci5lbmNvZGUodXNlcj8ucGFzc3dvcmQ/LnZhbHVlICsgc2FsdEhleFN0cmluZykpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBoYXNoZWRQYXNzd29yZEhleFN0cmluZyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXkubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNoZWRQYXNzd29yZEhleFN0cmluZyArPSAoaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5W2ldIDwgMTYgPyBcIjBcIiA6IFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5W2ldLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzZXJ2ZXJIYXNoZWRQYXNzd29yZEhleFN0cmluZyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAoZW1haWxSZXN1bHQucm93c1swXVsyXSBhcyBVaW50OEFycmF5KS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZlckhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nICs9ICgoZW1haWxSZXN1bHQucm93c1swXVsyXSBhcyBVaW50OEFycmF5KVtpXSA8IDE2ID8gXCIwXCIgOiBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIChlbWFpbFJlc3VsdC5yb3dzWzBdWzJdIGFzIFVpbnQ4QXJyYXkpW2ldLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYXNoZWRQYXNzd29yZEhleFN0cmluZyA9PT0gc2VydmVySGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZm91bmRVc2VyOiBVc2VyID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbWFpbDogeyB2YWx1ZTogZW1haWxSZXN1bHQucm93c1swXVswXSBhcyBzdHJpbmcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcm5hbWU6IHsgdmFsdWU6IGVtYWlsUmVzdWx0LnJvd3NbMF1bMV0gYXMgc3RyaW5nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiB7IHZhbHVlOiAnJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgc2lkID0gYXdhaXQgbmFub2lkKDQwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWRzW3NpZF0gPSBmb3VuZFVzZXIudXNlcm5hbWUudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY29udGV4dC5jb29raWVzLnNldCgnc2lkJywgc2lkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSBmb3VuZFVzZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UuYm9keSA9IHsgdGV4dDogJ1dyb25nIFBhc3N3b3JkJyB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNhbHRIZXhTdHJpbmcgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAodXNlcm5hbWVSZXN1bHQucm93c1swXVszXSBhcyBVaW50OEFycmF5KS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2FsdEhleFN0cmluZyArPSAoKHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bM10gYXMgVWludDhBcnJheSlbaV0gPCAxNiA/IFwiMFwiIDogXCJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArICh1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzNdIGFzIFVpbnQ4QXJyYXkpW2ldLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBsZXQgdGV4dEVuY29kZXIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGhhc2hlZFBhc3N3b3JkVWludDhBcnJheSA9IG5ldyBVaW50OEFycmF5KGF3YWl0IGNyeXB0by5zdWJ0bGUuZGlnZXN0KCdTSEEzLTUxMicsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0RW5jb2Rlci5lbmNvZGUodXNlcj8ucGFzc3dvcmQ/LnZhbHVlICsgc2FsdEhleFN0cmluZykpKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYXNoZWRQYXNzd29yZEhleFN0cmluZyArPSAoaGFzaGVkUGFzc3dvcmRVaW50OEFycmF5W2ldIDwgMTYgPyBcIjBcIiA6IFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBoYXNoZWRQYXNzd29yZFVpbnQ4QXJyYXlbaV0udG9TdHJpbmcoMTYpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGxldCBzZXJ2ZXJIYXNoZWRQYXNzd29yZEhleFN0cmluZyA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8ICh1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzJdIGFzIFVpbnQ4QXJyYXkpLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJ2ZXJIYXNoZWRQYXNzd29yZEhleFN0cmluZyArPSAoKHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMl0gYXMgVWludDhBcnJheSlbaV0gPCAxNiA/IFwiMFwiIDogXCJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArICh1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzJdIGFzIFVpbnQ4QXJyYXkpW2ldLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoaGFzaGVkUGFzc3dvcmRIZXhTdHJpbmcgPT09IHNlcnZlckhhc2hlZFBhc3N3b3JkSGV4U3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZm91bmRVc2VyOiBVc2VyID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtYWlsOiB7IHZhbHVlOiB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzBdIGFzIHN0cmluZyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJuYW1lOiB7IHZhbHVlOiB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzFdIGFzIHN0cmluZyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkOiB7IHZhbHVlOiAnJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHNpZCA9IGF3YWl0IG5hbm9pZCg0MCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaWRzW3NpZF0gPSBmb3VuZFVzZXIudXNlcm5hbWUudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjb250ZXh0LmNvb2tpZXMuc2V0KCdzaWQnLCBzaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0gZm91bmRVc2VyO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0geyB0ZXh0OiAnV3JvbmcgUGFzc3dvcmQnIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICAgICAgICAgIGNvbnRleHQucmVzcG9uc2UudHlwZSA9IFwianNvblwiO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRleHQudGhyb3coU3RhdHVzLkJhZFJlcXVlc3QsIFwiQmFkIFJlcXVlc3RcIik7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLmdldChcIi9hcGkvdXNlclwiLCBhc3luYyAoY29udGV4dCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IHNpZCA9IGF3YWl0IGNvbnRleHQuY29va2llcy5nZXQoJ3NpZCcpO1xuICAgICAgICAgICAgaWYgKHNpZCAmJiB0eXBlb2Ygc2lkID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGxldCB1c2VybmFtZSA9IHNpZHNbc2lkIGFzIHN0cmluZ107XG4gICAgICAgICAgICAgICAgaWYgKHVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHVzZXJuYW1lUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgZW1haWwsIHVzZXJuYW1lLCBudW1fd2lucywgbnVtX2xvc3NlcywgZWxvX3JhdGluZyBmcm9tIHVzZXJzIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKyB1c2VybmFtZSArIFwiJ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZvdW5kVXNlcjogVXNlciA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVtYWlsOiB7IHZhbHVlOiB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzBdIGFzIHN0cmluZyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlcm5hbWU6IHsgdmFsdWU6IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMV0gYXMgc3RyaW5nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXNzd29yZDogeyB2YWx1ZTogJycgfSxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyOiBmb3VuZFVzZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBudW1XaW5zOiB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzJdIGFzIG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bUxvc3NlczogdXNlcm5hbWVSZXN1bHQucm93c1swXVszXSBhcyBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbG9SYXRpbmc6IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bNF0gYXMgbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH1cbiAgICB9KVxuICAgIC5nZXQoXCIvYXBpL29wcG9uZW50XCIsIGFzeW5jIChjb250ZXh0KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgc2lkID0gYXdhaXQgY29udGV4dC5jb29raWVzLmdldCgnc2lkJyk7XG4gICAgICAgICAgICBpZiAoc2lkICYmIHR5cGVvZiBzaWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgbGV0IHVzZXJuYW1lID0gc2lkc1tzaWQgYXMgc3RyaW5nXTtcbiAgICAgICAgICAgICAgICBsZXQgb3Bwb25lbnRVc2VybmFtZSA9IHNpZHNbbWF0Y2hlc1tzaWQgYXMgc3RyaW5nXSBhcyBzdHJpbmddO1xuICAgICAgICAgICAgICAgIGlmICh1c2VybmFtZSAmJiBvcHBvbmVudFVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5jb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHVzZXJuYW1lUmVzdWx0ID0gYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJzZWxlY3QgZWxvX3JhdGluZyBmcm9tIHVzZXJzIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgKyB1c2VybmFtZSArIFwiJ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3Bwb25lbnRVc2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IGVsb19yYXRpbmcgZnJvbSB1c2VycyB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgb3Bwb25lbnRVc2VybmFtZSArIFwiJ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VCb2R5IDogTWF0Y2htYWtpbmdEYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgeW91OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcm5hbWU6IHVzZXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZzogdXNlcm5hbWVSZXN1bHQucm93c1swXVswXSBhcyBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2lkOiBzaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgb3Bwb25lbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogb3Bwb25lbnRVc2VybmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbG9SYXRpbmc6IG9wcG9uZW50VXNlcm5hbWVSZXN1bHQucm93c1swXVswXSBhcyBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2lkOiAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0gcmVzcG9uc2VCb2R5O1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH1cbiAgICB9KVxuICAgIC5nZXQoXCIvYXBpL3F1ZXN0aW9uXCIsIGFzeW5jIChjb250ZXh0KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgc2lkID0gYXdhaXQgY29udGV4dC5jb29raWVzLmdldCgnc2lkJyk7XG4gICAgICAgICAgICBpZiAoc2lkICYmIHR5cGVvZiBzaWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBxdWVzdGlvblJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IHF1ZXN0aW9uLCBmdW5jdGlvbl9zaWduYXR1cmUsIGRlZmF1bHRfY3VzdG9tX2lucHV0IGZyb20gcXVlc3Rpb25zIHdoZXJlIGlkID0gXCJcbiAgICAgICAgICAgICAgICAgICAgKyBzaWRzUXVlc3Rpb25zW3NpZF1bc2lkc1Byb2dyZXNzW3NpZF1dLnF1ZXN0aW9uSWQudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJVVVVcIik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coc2lkc1F1ZXN0aW9uc1tzaWRdW3NpZHNQcm9ncmVzc1tzaWRdXS5xdWVzdGlvbklkLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSUlJXCIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlQm9keSA6IFF1ZXN0aW9uRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgcXVlc3Rpb246IHF1ZXN0aW9uUmVzdWx0LnJvd3NbMF1bMF0gYXMgc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbl9zaWduYXR1cmU6IHF1ZXN0aW9uUmVzdWx0LnJvd3NbMF1bMV0gYXMgc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0X2N1c3RvbV9pbnB1dDogcXVlc3Rpb25SZXN1bHQucm93c1swXVsyXSBhcyBzdHJpbmcsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSByZXNwb25zZUJvZHk7XG4gICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH1cbiAgICB9KVxuICAgIC5nZXQoXCIvYXBpL21hdGNobWFraW5nXCIsIGFzeW5jIChjb250ZXh0KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgc2lkID0gYXdhaXQgY29udGV4dC5jb29raWVzLmdldCgnc2lkJyk7XG4gICAgICAgICAgICBpZiAoc2lkICYmIHR5cGVvZiBzaWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgbGV0IHVzZXJuYW1lID0gc2lkc1tzaWQgYXMgc3RyaW5nXTtcbiAgICAgICAgICAgICAgICBpZiAodXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXNlcm5hbWVSZXN1bHQgPSBhd2FpdCBjbGllbnQucXVlcnlBcnJheShcInNlbGVjdCBlbG9fcmF0aW5nIGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICAgICAgICAgICAgICArIHVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgbWF0Y2htYWtpbmdVc2VyOiBNYXRjaG1ha2luZ1VzZXIgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbG9SYXRpbmc6IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMF0gYXMgbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2lkOiBzaWQsXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgcXVldWVzOiBNYXRjaG1ha2luZ1VzZXJbXVtdID0gW21hdGNobWFraW5nUXVldWUyNSwgbWF0Y2htYWtpbmdRdWV1ZTUwLCBtYXRjaG1ha2luZ1F1ZXVlMTAwLCBtYXRjaG1ha2luZ1F1ZXVlMjAwXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJhbmdlczogbnVtYmVyW10gPSBbMjUsIDUwLCAxMDAsIDIwMF07XG4gICAgICAgICAgICAgICAgICAgIGxldCBkZWxheVRpbWVzTnVtczogbnVtYmVyW10gPSBbMSwgNSwgMTAsIDYwXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZvdW5kTWF0Y2g6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBxdWV1ZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZE1hdGNoID0gYXdhaXQgYWRkVG9RdWV1ZShxdWV1ZXNbaV0sIG1hdGNobWFraW5nVXNlciwgcmFuZ2VzW2ldLCBjb250ZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGRlbGF5VGltZXNOdW1zW2ldOyArK2opIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kTWF0Y2ggPSBhd2FpdCBjaGVja0lmRm91bmRJblF1ZXVlKDEwMDAsIG1hdGNobWFraW5nVXNlciwgdXNlcm5hbWUsIGNvbnRleHQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmRNYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlRnJvbVF1ZXVlKHF1ZXVlc1tpXSwgc2lkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWZvdW5kTWF0Y2ggJiYgIWFkZFRvUXVldWUobWF0Y2htYWtpbmdRdWV1ZTUwMCwgbWF0Y2htYWtpbmdVc2VyLCA1MDAsIGNvbnRleHQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoIShhd2FpdCBjaGVja0lmRm91bmRJblF1ZXVlKDEwMDAsIG1hdGNobWFraW5nVXNlciwgdXNlcm5hbWUsIGNvbnRleHQpKSkgeyB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLmdldChcIi9hcGkvbG9nb3V0XCIsIGFzeW5jIChjb250ZXh0KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgc2lkID0gYXdhaXQgY29udGV4dC5jb29raWVzLmdldCgnc2lkJyk7XG4gICAgICAgICAgICBpZiAoc2lkICYmIHR5cGVvZiBzaWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHNpZHNbc2lkIGFzIHN0cmluZ107XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0geyB0ZXh0OiAnU3VjY2Vzc2Z1bGx5IExvZ2dlZCBPdXQnIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLnBvc3QoXCIvYXBpL3J1blwiLCBhc3luYyAoY29udGV4dDogUm91dGVyQ29udGV4dDxhbnk+KSA9PiB7XG4gICAgICAgIC8vIGNvbnRleHQucmVzcG9uc2Uuc3RhdHVzID0gU3RhdHVzLk9LO1xuICAgICAgICAvLyBjb25zdCBkdW1ieVJlc3VsdDogVGVzdENhc2VzUGFzc2VkID0ge1xuICAgICAgICAvLyAgICAgdGVzdENhc2VzUGFzc2VkOiBbdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZV0sXG4gICAgICAgIC8vICAgICBzdGFuZGFyZE91dHB1dDogXCJUZXN0IFN0YW5kYXJkIE91dHB1dFwiLFxuICAgICAgICAvLyAgICAgb3V0cHV0OiBcIlRlc3QgT3V0cHV0XCJcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyBjb250ZXh0LnJlc3BvbnNlLmJvZHkgPSBkdW1ieVJlc3VsdFxuICAgICAgICAvLyByZXR1cm5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBzaWQgPSBhd2FpdCBjb250ZXh0LmNvb2tpZXMuZ2V0KCdzaWQnKTtcbiAgICAgICAgICAgIGlmIChzaWQgJiYgdHlwZW9mIHNpZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRleHQucmVxdWVzdC5oYXNCb2R5KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQudGhyb3coU3RhdHVzLkJhZFJlcXVlc3QsIFwiQmFkIFJlcXVlc3RcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBjb250ZXh0LnJlcXVlc3QuYm9keSgpO1xuICAgICAgICAgICAgICAgIGxldCBjb2RlOiBQYXJ0aWFsPENvZGVTdWJtaXNzaW9uPiB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBpZiAoYm9keS50eXBlID09PSBcImpzb25cIikge1xuICAgICAgICAgICAgICAgICAgICBjb2RlID0gYXdhaXQgYm9keS52YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5hc3NlcnQodHlwZW9mIGNvZGU/LnZhbHVlID09PSBcInN0cmluZ1wiLCBTdGF0dXMuQmFkUmVxdWVzdCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQuYXNzZXJ0KHR5cGVvZiBjb2RlPy5pbnB1dCA9PT0gXCJzdHJpbmdcIiwgU3RhdHVzLkJhZFJlcXVlc3QpO1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3BvbnNlLnN0YXR1cyA9IFN0YXR1cy5PSztcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJaWlpcIik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGNvZGUudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlhYWFwiKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKFwiLi9zYW5kYm94L2Fuc3dlci5weVwiLCBjb2RlLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKFwiLi9zYW5kYm94L2Fuc3dlckN1c3RvbUlucHV0LnB5XCIsIGNvZGUudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgaW5wdXRMaW5lczogc3RyaW5nW10gPSBjb2RlLmlucHV0LnNwbGl0KCdcXG4nKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGN1c3RvbUlucHV0Q29udGVudDogc3RyaW5nID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGxldCBxdWVzdGlvbkluZm9ybWF0aW9uOiBRdWVzdGlvbkluZm9ybWF0aW9uID0gc2lkc1F1ZXN0aW9uc1tzaWRdW3NpZHNQcm9ncmVzc1tzaWRdXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBxdWVzdGlvbkluZm9ybWF0aW9uLmlucHV0Rm9ybWF0Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk9PT1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHF1ZXN0aW9uSW5mb3JtYXRpb24uaW5wdXRGb3JtYXRbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJQUFBcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocXVlc3Rpb25JbmZvcm1hdGlvbi5pbnB1dEZvcm1hdFtpXSA9PSAnbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21JbnB1dENvbnRlbnQgKz0gcGFyc2VJbnQoaW5wdXRMaW5lc1tpXSkudG9TdHJpbmcoKSArICdcXG4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChxdWVzdGlvbkluZm9ybWF0aW9uLmlucHV0Rm9ybWF0W2ldID09ICdhJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpbnB1dENvbW1hU2VwYXJhdGVkVmFsdWVzOiBzdHJpbmdbXSA9IGlucHV0TGluZXNbaV0uc3BsaXQoJ1snKVsxXS5zcGxpdCgnXScpWzBdLnNwbGl0KCcsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9tSW5wdXRDb250ZW50ICs9IGlucHV0Q29tbWFTZXBhcmF0ZWRWYWx1ZXMubGVuZ3RoLnRvU3RyaW5nKCkgKyAnXFxuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRDb21tYVNlcGFyYXRlZFZhbHVlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21JbnB1dENvbnRlbnQgKz0gcGFyc2VJbnQoaW5wdXRDb21tYVNlcGFyYXRlZFZhbHVlc1tpXSkudG9TdHJpbmcoKSArICdcXG4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocXVlc3Rpb25JbmZvcm1hdGlvbi5pbnB1dEZvcm1hdFtpXSA9PSAnYWEnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGlucHV0Q29tbWFTZXBhcmF0ZWRWYWx1ZXM6IHN0cmluZ1tdID0gaW5wdXRMaW5lc1tpXS5zcGxpdCgnW1snKVsxXS5zcGxpdCgnXV0nKVswXS5zcGxpdCgnXSxbJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9tSW5wdXRDb250ZW50ICs9IGlucHV0Q29tbWFTZXBhcmF0ZWRWYWx1ZXMubGVuZ3RoLnRvU3RyaW5nKCkgKyAnXFxuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRDb21tYVNlcGFyYXRlZFZhbHVlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaW5wdXRDQ29tbWFTZXBhcmF0ZWRWYWx1ZXM6IHN0cmluZ1tdID0gaW5wdXRMaW5lc1tpXS5zcGxpdCgnLCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21JbnB1dENvbnRlbnQgKz0gaW5wdXRDQ29tbWFTZXBhcmF0ZWRWYWx1ZXMubGVuZ3RoLnRvU3RyaW5nKCkgKyAnXFxuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGlucHV0Q0NvbW1hU2VwYXJhdGVkVmFsdWVzLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21JbnB1dENvbnRlbnQgKz0gcGFyc2VJbnQoaW5wdXRDQ29tbWFTZXBhcmF0ZWRWYWx1ZXNbaV0pLnRvU3RyaW5nKCkgKyAnXFxuJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAocXVlc3Rpb25JbmZvcm1hdGlvbi5vdXRwdXRGb3JtYXQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJOTk5cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhxdWVzdGlvbkluZm9ybWF0aW9uLm91dHB1dEZvcm1hdFswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk1NTVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkFBQVwiKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRGVuby53cml0ZVRleHRGaWxlKFwiLi9zYW5kYm94L2N1c3RvbUlucHV0LmluXCIsIGN1c3RvbUlucHV0Q29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUFCXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXBvcnRQcm9jZXNzID0gYXdhaXQgRGVuby5ydW4oe1xuICAgICAgICAgICAgICAgICAgICAgICAgY21kOiBbXCIuL21ha2VSZXBvcnQuc2hcIl0sXG4gICAgICAgICAgICAgICAgICAgICAgICBjd2Q6IFwiLi9zYW5kYm94L1wiICsgcXVlc3Rpb25JbmZvcm1hdGlvbi5xdWVzdGlvbklkLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGRvdXQ6IFwicGlwZWRcIlxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBQkJcIik7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHJlcG9ydFByb2Nlc3Mub3V0cHV0KCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQkJCXCIpO1xuICAgICAgICAgICAgICAgICAgICBsZXQganNvblJlc3VsdHM6IFN0cmluZyA9IGF3YWl0IERlbm8ucmVhZFRleHRGaWxlKFwiLi9zYW5kYm94L3JlcG9ydEZyb21QeVNhbmRib3gudHh0XCIpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgc3RhbmRhcmRPdXRwdXRSZXN1bHRzOiBzdHJpbmcgPSBhd2FpdCBEZW5vLnJlYWRUZXh0RmlsZShcIi4vc2FuZGJveC9zdGFuZGFyZE91dHB1dEZyb21QeVNhbmRib3gudHh0XCIpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgb3V0cHV0UmVzdWx0czogc3RyaW5nID0gYXdhaXQgRGVuby5yZWFkVGV4dEZpbGUoXCIuL3NhbmRib3gvb3V0cHV0RnJvbVB5U2FuZGJveC50eHRcIik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ0NDXCIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzdGFuZGFyZE91dHB1dFJlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRERFwiKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cob3V0cHV0UmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRUVFXCIpO1xuICAgICAgICAgICAgICAgICAgICBqc29uUmVzdWx0cyA9IGpzb25SZXN1bHRzLnJlcGxhY2UoL1xccy9nLCBcIlwiKTtcbiAgICAgICAgICAgICAgICAgICAganNvblJlc3VsdHMgPSBqc29uUmVzdWx0cy5zdWJzdHJpbmcoMCwganNvblJlc3VsdHMubGVuZ3RoIC0gMikgKyBcIl1cIlxuICAgICAgICAgICAgICAgICAgICBsZXQgdGVzdFJlc3VsdHM6IFRlc3RSZXN1bHRbXSAgPSBKU09OLnBhcnNlKGpzb25SZXN1bHRzLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgdGVzdENhc2VzUGFzc2VkOiBUZXN0Q2FzZXNQYXNzZWQgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXN0Q2FzZXNQYXNzZWQ6IHRlc3RSZXN1bHRzLm1hcCgodHI6IFRlc3RSZXN1bHQpID0+IHRyLnBhc3NlZCksXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFuZGFyZE91dHB1dDogc3RhbmRhcmRPdXRwdXRSZXN1bHRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0OiBvdXRwdXRSZXN1bHRzLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRlc3RDYXNlc1Bhc3NlZC50ZXN0Q2FzZXNQYXNzZWQuc29tZShlbGVtZW50ID0+ICFlbGVtZW50KSAmJiArK3NpZHNQcm9ncmVzc1tzaWRdID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgb3Bwb25lbnRTaWQgPSBtYXRjaGVzW3NpZF07XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgbWF0Y2hlc1tzaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG1hdGNoZXNbb3Bwb25lbnRTaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHNpZHNQcm9ncmVzc1tzaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHNpZHNQcm9ncmVzc1tvcHBvbmVudFNpZF07XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgc2lkc1F1ZXN0aW9uc1tzaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHNpZHNRdWVzdGlvbnNbb3Bwb25lbnRTaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG51bVdpbnM6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1HYW1lczogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZzogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhczI0MDBSYXRpbmdIaXN0b3J5OiBib29sZWFuID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3Bwb25lbnROdW1Mb3NzZXM6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHBvbmVudE51bUdhbWVzOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3Bwb25lbnRFbG9SYXRpbmc6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHBvbmVudEhhczI0MDBSYXRpbmdIaXN0b3J5OiBib29sZWFuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdXNlcm5hbWUgPSBzaWRzW3NpZCBhcyBzdHJpbmddO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFwic2VsZWN0IG51bV93aW5zLCBudW1fbG9zc2VzLCBlbG9fcmF0aW5nLCBoYXNfMjQwMF9yYXRpbmdfaGlzdG9yeSBmcm9tIHVzZXJzIHdoZXJlIHVzZXJuYW1lPSdcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIHVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bVdpbnMgPSB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzBdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1HYW1lcyA9IG51bVdpbnMgKyAodXNlcm5hbWVSZXN1bHQucm93c1swXVsxXSBhcyBudW1iZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZyA9IHVzZXJuYW1lUmVzdWx0LnJvd3NbMF1bMl0gYXMgbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhczI0MDBSYXRpbmdIaXN0b3J5ID0gdXNlcm5hbWVSZXN1bHQucm93c1swXVszXSBhcyBib29sZWFuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgb3Bwb25lbnRVc2VybmFtZSA9IHNpZHNbb3Bwb25lbnRTaWQgYXMgc3RyaW5nXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3Bwb25lbnRVc2VybmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1c2VybmFtZVJlc3VsdCA9IGF3YWl0IGNsaWVudC5xdWVyeUFycmF5KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzZWxlY3QgbnVtX3dpbnMsIG51bV9sb3NzZXMsIGVsb19yYXRpbmcsIGhhc18yNDAwX3JhdGluZ19oaXN0b3J5IGZyb20gdXNlcnMgd2hlcmUgdXNlcm5hbWU9J1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIG9wcG9uZW50VXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50TnVtTG9zc2VzID0gdXNlcm5hbWVSZXN1bHQucm93c1swXVsxXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50TnVtR2FtZXMgPSAodXNlcm5hbWVSZXN1bHQucm93c1swXVswXSBhcyBudW1iZXIpICsgb3Bwb25lbnROdW1Mb3NzZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50RWxvUmF0aW5nID0gdXNlcm5hbWVSZXN1bHQucm93c1swXVsyXSBhcyBudW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50SGFzMjQwMFJhdGluZ0hpc3RvcnkgPSB1c2VybmFtZVJlc3VsdC5yb3dzWzBdWzNdIGFzIGJvb2xlYW47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5lbmQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKytudW1XaW5zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZWxvUmF0aW5nVmFyaWF0aW9uOiBudW1iZXIgPSAxIC0gMS4wIC8gKDEgKyBNYXRoLnBvdygxMCwgKG9wcG9uZW50RWxvUmF0aW5nIC0gZWxvUmF0aW5nKSAvIDQwMC4wKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsb1JhdGluZyArPSBNYXRoLmZsb29yKChudW1HYW1lcyA8IDMwID8gKGVsb1JhdGluZyA8IDIzMDAgPyA0MCA6IDIwKSA6IChoYXMyNDAwUmF0aW5nSGlzdG9yeSA/IDEwIDogMjApKSAqIGVsb1JhdGluZ1ZhcmlhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsrb3Bwb25lbnROdW1Mb3NzZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcG9uZW50RWxvUmF0aW5nIC09IE1hdGguY2VpbCgob3Bwb25lbnROdW1HYW1lcyA8IDMwID8gKG9wcG9uZW50RWxvUmF0aW5nIDwgMjMwMCA/IDQwIDogMjApIDogKG9wcG9uZW50SGFzMjQwMFJhdGluZ0hpc3RvcnkgPyAxMCA6IDIwKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogZWxvUmF0aW5nVmFyaWF0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJ1cGRhdGUgdXNlcnMgc2V0IG51bV93aW5zID0gXCIgKyBudW1XaW5zLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiLCBlbG9fcmF0aW5nID0gXCIgKyBlbG9SYXRpbmcudG9TdHJpbmcoKSArIFwiLCBoYXNfMjQwMF9yYXRpbmdfaGlzdG9yeSA9IFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAoaGFzMjQwMFJhdGluZ0hpc3RvcnkgfHwgZWxvUmF0aW5nID49IDI0MDApLnRvU3RyaW5nKCkgKyBcIiB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIHVzZXJuYW1lICsgXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LmVuZCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHBvbmVudFVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgY2xpZW50LnF1ZXJ5QXJyYXkoXCJ1cGRhdGUgdXNlcnMgc2V0IG51bV9sb3NzZXMgPSBcIiArIG9wcG9uZW50TnVtTG9zc2VzLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFwiLCBlbG9fcmF0aW5nID0gXCIgKyBvcHBvbmVudEVsb1JhdGluZy50b1N0cmluZygpICsgXCIsIGhhc18yNDAwX3JhdGluZ19oaXN0b3J5ID0gXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIChvcHBvbmVudEhhczI0MDBSYXRpbmdIaXN0b3J5IHx8IG9wcG9uZW50RWxvUmF0aW5nID49IDI0MDApLnRvU3RyaW5nKCkgKyBcIiB3aGVyZSB1c2VybmFtZT0nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIG9wcG9uZW50VXNlcm5hbWUgKyBcIidcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjbGllbnQuZW5kKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXNwb25zZS5ib2R5ID0gdGVzdENhc2VzUGFzc2VkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgfSk7XG5hcHAudXNlKHJvdXRlci5yb3V0ZXMoKSk7XG5hcHAudXNlKHJvdXRlci5hbGxvd2VkTWV0aG9kcygpKTtcbmFwcC51c2UoYXN5bmMgKGNvbnRleHQpID0+IHtcbiAgICBpZiAoIWNvbnRleHQucmVxdWVzdC51cmwucGF0aG5hbWUuZW5kc1dpdGgoJy5qcycpXG4gICAgICAgICYmICFjb250ZXh0LnJlcXVlc3QudXJsLnBhdGhuYW1lLmVuZHNXaXRoKCcucG5nJylcbiAgICAgICAgJiYgIWNvbnRleHQucmVxdWVzdC51cmwucGF0aG5hbWUuZW5kc1dpdGgoJy5pY28nKVxuICAgICAgICAmJiAhY29udGV4dC5yZXF1ZXN0LnVybC5wYXRobmFtZS5lbmRzV2l0aCgnLnR4dCcpKVx0e1xuICAgICAgICBjb250ZXh0LnJlcXVlc3QudXJsLnBhdGhuYW1lID0gJy8nO1xuICAgIH1cbiAgICBhd2FpdCBjb250ZXh0LnNlbmQoe1xuICAgICAgICByb290OiBgJHtEZW5vLmN3ZCgpfS9yZWFjdC1hcHAvYnVpbGRgLFxuICAgICAgICBpbmRleDogXCJpbmRleC5odG1sXCIsXG4gICAgfSk7XG59KTtcbmNvbnNvbGUubG9nKFwiUnVubmluZyBvbiBwb3J0XCIsIHBvcnQpO1xuYXdhaXQgYXBwLmxpc3Rlbih7IHBvcnQgfSk7XG4iXX0=