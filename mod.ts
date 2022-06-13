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
import { ensureDir } from 'https://deno.land/std@0.136.0/fs/mod.ts';
import { parse } from "https://deno.land/std@0.143.0/flags/mod.ts"
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
const args = parse(Deno.args, {alias: {"prod": "p"}, boolean: ["prod"],})
const prod : boolean = args.prod
const app = new Application();
const router = new Router();
//let iiiCounter = 0;

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

interface QuestionInformation {
    questionId: number,
    inputFormat: string[],
    outputFormat: string[],
}

const numQuestionsPerMatch = 3;

let helloWorldVar: HelloWorld = { text: 'Hello World' };

let sids: { [name: string]: string } = {};

let sidsProgress: { [name: string]: number } = {};

let sidsQuestions: { [name: string]: QuestionInformation[] } = {};

let matchmakingQueue25: MatchmakingUser[] = [];
let matchmakingQueue50: MatchmakingUser[] = [];
let matchmakingQueue100: MatchmakingUser[] = [];
let matchmakingQueue200: MatchmakingUser[] = [];
let matchmakingQueue500: MatchmakingUser[] = [];

let matches: { [name: string]: string } = {};

const numTestCases: number = 11;

function registerPairEndPoint() : string {
    return prod ? "https://licode.io/registerPair" : "http://localhost:5000/registerPair";
}

function generateTestCaseString(allTestCases: string[], format: string[], j: number, shouldPrint: boolean) {
    let testCaseString = '';
    let testCase = allTestCases[j].split(';');
    let k = 0;
    let m = 0;
    let mMax = 0;
    let n = 0;
    let nMax = 0;
    let insideArray = false;
    let insideArrayArray = false;
    if (shouldPrint) { console.log("OUTPUTOUTPUTOUTPUTOUTPUTOUTPUTOUTPUTOUTPUTOUTPUTOUTPUT"); }
    for (let l = 0; l < testCase.length; ++l) {
        if (shouldPrint) { console.log("L" + l.toString() + "L"); console.log("LI" + testCase[l] + "LI"); }
        if (format[k] == 'n') {
            if (shouldPrint) { console.log("K" + k.toString() + "K"); }
            testCaseString += testCase[l] + '\n';
            ++k;
        } else if (format[k] == 'a') {
            if (insideArray) {
                if (m < mMax) {
                    if (shouldPrint) { console.log("M" + m.toString() + "M"); }
                    testCaseString += testCase[l] + '\n';
                    ++m;
                } else {
                    if (shouldPrint) { console.log("KK" + k.toString() + "KK"); }
                    insideArray = false;
                    ++k;
                    --l;
                }
            } else {
                if (shouldPrint) { console.log("MM" + m.toString() + "MM"); }
                testCaseString += testCase[l] + '\n';
                m = 0;
                mMax = parseInt(testCase[l]);
                insideArray = true;
            }
        } else if (format[k] == 'aa') {
            if (insideArray) {
                if (m < mMax) {
                    if (insideArrayArray) {
                        if (n < nMax) {
                            if (shouldPrint) { console.log("N" + n.toString() + "N"); }
                            testCaseString += testCase[l] + '\n';
                            ++n;
                        } else {
                            if (shouldPrint) { console.log("MMM" + m.toString() + "MMM"); }
                            insideArrayArray = false;
                            ++m;
                            --l;
                        }
                    } else {
                        if (shouldPrint) { console.log("NN" + n.toString() + "NN"); }
                        testCaseString += testCase[l] + '\n';
                        n = 0;
                        nMax = parseInt(testCase[l]);
                        insideArrayArray = true;
                    }
                } else {
                    if (shouldPrint) { console.log("KKK" + k.toString() + "KKK"); }
                    insideArray = false;
                    ++k;
                    --l;
                }
            } else {
                if (shouldPrint) { console.log("MMMM" + m.toString() + "MMMM"); }
                testCaseString += testCase[l] + '\n';
                m = 0;
                mMax = parseInt(testCase[l]);
                insideArray = true;
            }
        }
    }
    if (shouldPrint) { console.log("ENDPUTENDPUTENDPUTENDPUTENDPUTENDPUTENDPUTENDPUTENDPUT"); }
    if (shouldPrint) { console.log("DEBPUTDEBPUTDEBPUTDEBPUTDEBPUTDEBPUTDEBPUTDEBPUTDEBPUT"); }
    if (shouldPrint) { console.log(testCaseString); }
    if (shouldPrint) { console.log("FINPUTFINPUTFINPUTFINPUTFINPUTFINPUTFINPUTFINPUTFINPUT"); }
    return testCaseString;
}

function generateStubString(inputFormat: string[], outputFormat: string[], functionSignature: string, normalStub: boolean) {
    let stubString = '\n\nimport sys\n\nif __name__ == "__main__":\n';
    for (let i = 0; i < inputFormat.length; ++i) {
        if (inputFormat[i] == 'n') {
            stubString += '    p' + i.toString() + ' = int(input())\n';
        } else if (inputFormat[i] == 'a') {
            stubString += '    n' + i.toString() + ' = int(input())\n    p' + i.toString() + ' = []\n    for i in range(n' + i.toString() + '):\n        gh = int(input())\n        p' + i.toString() + '.append(gh)\n';
        } else if (inputFormat[i] == 'aa') {
            stubString += '    n' + i.toString() + ' = int(input())\n    p' + i.toString() + ' = []\n    for i in range(n' + i.toString() + '):\n        nn' + i.toString() + ' = int(input())\n        pp' + i.toString() + ' = []\n        for j in range(nn' + i.toString() + '):\n            pp' + i.toString() + '.append(int(input()))\n        p' + i.toString() + '.append(pp' + i.toString() + ')\n';
        }
    }
    stubString += '    result = ' + functionSignature.split('(')[0].split('def ')[1] + '(';
    if (inputFormat.length > 0) {
        stubString += 'p0';
    }
    for (let i = 1; i < inputFormat.length; ++i) {
        stubString += ', p' + i.toString()
    }
    stubString += ')\n';
    if (normalStub) {
        stubString += '    print("v10zg57ZIUF6vjZgSPaDY70TQff8wTHXgodX2otrDMEay0WlS36MjDhHH054uRrFxGHHSegvGcA7eaqB")\n'
        if (outputFormat.length > 0) {
            if (outputFormat[0] == 'n') {
                stubString += '    print(result)\n';
            } else if (outputFormat[0] == 'a') {
                stubString += '    print(len(result))\n    for r in result:\n        print(r)\n';
            } else if (outputFormat[0] == 'aa') {
                stubString += '    print(len(result))\n    for r in result:\n        print(len(r))\n        for rr in r:\n            print(rr)\n';
            }
        }
    }
    return stubString;
}

function generateCleanString(outputFormat: string[], normalClean: boolean) {
    let cleanString = '';
    if (outputFormat[0] != 'aa') {
        cleanString += 'import sys\n\nif __name__ == "__main__":\n';
    } else {
        cleanString += 'import sys\nimport functools\n\ndef compareNns(x, y):\n    if x[0] > y[0]:\n        return 1\n    elif x[0] < y[0]:\n        return -1\n    else:\n        for i in range(x[0]):\n            if x[1][i] > y[1][i]:\n                return 1\n            if x[1][i] < y[1][i]:\n                return -1\n    return 0\n\nif __name__ == "__main__":\n';
    }
    if (normalClean) {
        cleanString += '    while True:\n        tryInput = input()\n        if (tryInput == "v10zg57ZIUF6vjZgSPaDY70TQff8wTHXgodX2otrDMEay0WlS36MjDhHH054uRrFxGHHSegvGcA7eaqB"):\n            break\n';
    }
    if (outputFormat.length > 0) {
        if (outputFormat[0] == 'n') {
            cleanString += '    qw = input()\n    print(qw)\n';
        } else if (outputFormat[0] == 'a') {
            cleanString += '    n = int(input())\n    nums = []\n    for i in range(n):\n        qw = int(input())\n        nums.append(qw)\n    nums.sort()\n    print(n)\n    for i in range(n):\n        print(nums[i])';
        } else if (outputFormat[0] == 'aa') {
            cleanString += '    n = int(input())\n    nns = []\n    nums = []\n    for i in range(n):\n        nn = int(input())\n        nns = nns.copy()\n        nns = []\n        nns.append(nn)\n        nnums = []\n        for j in range(nn):\n            qw = int(input())\n            nnums.append(qw)\n        nnums.sort()\n        nns.append(nnums)\n        nums.append(nns)\n    nums.sort(key = functools.cmp_to_key(compareNns))\n    print(n)\n    for i in range(n):\n        print(nums[i][0])\n        for j in range(len(nums[i][1])):\n            print(nums[i][1][j])\n';
        }
    }
    return cleanString;
}

function generateMakeReportString(i: number) {
    //return '#!/bin/bash\n\n(cat stub.py) >> answer.py\n(cat stubCustomInput.py) >> answerCustomInput.py\n\ncontainerID=$(docker run -dit py-sandbox)\ndocker cp TestInputs/ ${containerID}:home/TestEnvironment/TestInputs/\ndocker cp TestOutputs/ ${containerID}:home/TestEnvironment/TestOutputs/\ndocker cp answer.py ${containerID}:home/TestEnvironment/answer.py\ndocker cp customInput.in ${containerID}:home/TestEnvironment/customInput.in\ndocker cp answerCustomInput.py ${containerID}:home/TestEnvironment/answerCustomInput.py\ndocker cp clean.py ${containerID}:home/TestEnvironment/clean.py\n\ndocker exec ${containerID} sh -c "cd home/TestEnvironment/ && timeout 10 ./makeReport.sh"\n\ndocker cp ${containerID}:home/TestEnvironment/report.txt reportFromPySandbox.txt\ndocker cp ${containerID}:home/TestEnvironment/standardOutput.txt standardOutputFromPySandbox.txt\ndocker cp ${containerID}:home/TestEnvironment/output.txt outputFromPySandbox.txt\n\ndocker kill ${containerID}\n\ndocker rm ${containerID}\n\n';
    return '#!/bin/bash\n\n(cat stub.py) >> ../answer.py\n(cat stubCustomInput.py) >> ../answerCustomInput.py\n\ncontainerID=$(docker run -dit py-sandbox)\ndocker cp TestInputs/ ${containerID}:home/TestEnvironment/TestInputs/\ndocker cp TestOutputs/ ${containerID}:home/TestEnvironment/TestOutputs/\ndocker cp ../answer.py ${containerID}:home/TestEnvironment/answer.py\ndocker cp ../customInput.in ${containerID}:home/TestEnvironment/customInput.in\ndocker cp ../answerCustomInput.py ${containerID}:home/TestEnvironment/answerCustomInput.py\ndocker cp clean.py ${containerID}:home/TestEnvironment/clean.py\ndocker cp cleanOutput.py ${containerID}:home/TestEnvironment/cleanOutput.py\n\ndocker exec ${containerID} sh -c "cd home/TestEnvironment/ && timeout 10 ./makeReport.sh"\n\ndocker cp ${containerID}:home/TestEnvironment/report.txt ../reportFromPySandbox.txt\ndocker cp ${containerID}:home/TestEnvironment/standardOutput.txt ../standardOutputFromPySandbox.txt\ndocker cp ${containerID}:home/TestEnvironment/standardError.txt ../standardErrorFromPySandbox.txt\ndocker cp ${containerID}:home/TestEnvironment/output.txt ../outputFromPySandbox.txt\n\ndocker kill ${containerID}\n\ndocker rm ${containerID}\n\n';
}

async function loadTestCases() {
    await client.connect();
    const questionsResult = await client.queryArray("select count(*) from questions");
    let numQuestions = Number(questionsResult.rows[0][0] as number);
    await client.end();
    for (let i: number = 1; i <= numQuestions; ++i) {
        await client.connect();
        const selectedResult = await client.queryArray("select function_signature, input_output_format, test_cases from questions where id = " + i.toString());
        let functionSignature: string = selectedResult.rows[0][0] as string;
        let inputOutputFormat = selectedResult.rows[0][1] as string;
        let testCases = selectedResult.rows[0][2] as string;
        await client.end();
        let inputOutputFormats = inputOutputFormat.split('|');
        let inputFormat: string[] = inputOutputFormats[0].split(';');
        inputFormat.shift();
        let outputFormat: string[] = inputOutputFormats[1].split(';');
        outputFormat.shift();
        let allTestCases: string[] = testCases.split('|');
        for (let j: number = 0; j < numTestCases; ++j) {
            await ensureDir("./sandbox/" + i.toString() + "/TestInputs/");
            await ensureDir("./sandbox/" + i.toString() + "/TestOutputs/");
            await Deno.writeTextFile("./sandbox/" + i.toString() + "/TestInputs/test" + (j + 1).toString() + ".in",
                generateTestCaseString(allTestCases, inputFormat, j, /*i == 2 && j == 0*/false));
        }
        let secondHalfThreshold = 2 * numTestCases;
        for (let j = 11; j < secondHalfThreshold; ++j) {
            await Deno.writeTextFile("./sandbox/" + i.toString() + "/TestOutputs/test" + (j - 10).toString() + ".out",
                generateTestCaseString(allTestCases, outputFormat, j, false));
        }
        await Deno.writeTextFile("./sandbox/" + i.toString() + "/stub.py", generateStubString(inputFormat, outputFormat,
            functionSignature, true));
        await Deno.writeTextFile("./sandbox/" + i.toString() + "/stubCustomInput.py", generateStubString(inputFormat, outputFormat,
            functionSignature, false));
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
    let questionsInformation: QuestionInformation[] = [];
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
                inputOutputFormat = selectedResult.rows[0][0] as string;
                await client.end();
                break;
            } catch (error) {
                console.log(error);
            }
        }
        let inputOutputFormats = inputOutputFormat.split('|');
        let inputFormat: string[] = inputOutputFormats[0].split(';');
        inputFormat.shift();
        let outputFormat: string[] = inputOutputFormats[1].split(';');
        outputFormat.shift();
        let questionInformation: QuestionInformation = { questionId: questionsSelected[i], inputFormat: inputFormat, outputFormat: outputFormat };
        questionsInformation.push(questionInformation);
    }
    sidsQuestions[matchmakingUser.sid] = questionsInformation;
    sidsQuestions[matches[matchmakingUser.sid]] = questionsInformation;
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
            const response = await fetch(registerPairEndPoint(), {
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
                    + sidsQuestions[sid][sidsProgress[sid]].questionId.toString());
                console.log("UUU");
                console.log(sidsQuestions[sid][sidsProgress[sid]].questionId.toString());
                console.log("III");
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
                    console.log("ZZZ");
                    console.log(code.value);
                    console.log("XXX");
                    await Deno.writeTextFile("./sandbox/answer.py", code.value);
                    await Deno.writeTextFile("./sandbox/answerCustomInput.py", code.value);
                    let inputLines: string[] = code.input.split('\n');
                    let customInputContent: string = '';
                    let questionInformation: QuestionInformation = sidsQuestions[sid][sidsProgress[sid]];
                    for (let i = 0; i < questionInformation.inputFormat.length; ++i) {
                        console.log("OOO");
                        console.log(questionInformation.inputFormat[i]);
                        console.log("PPP");
                        if (questionInformation.inputFormat[i] == 'n') {
                            customInputContent += parseInt(inputLines[i]).toString() + '\n';
                        } else if (questionInformation.inputFormat[i] == 'a') {
                            let inputCommaSeparatedValues: string[] = inputLines[i].split('[')[1].split(']')[0].split(',');
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
                        } else if (questionInformation.inputFormat[i] == 'aa') {
                            let inputCommaSeparatedValues: string[] = inputLines[i].split('[[')[1].split(']]')[0].split('],[');
                            customInputContent += inputCommaSeparatedValues.length.toString() + '\n';
                            for (let i = 0; i < inputCommaSeparatedValues.length; ++i) {
                                let inputCCommaSeparatedValues: string[] = inputLines[i].split(',');
                                customInputContent += inputCCommaSeparatedValues.length.toString() + '\n'
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
                    let jsonResults: String = await Deno.readTextFile("./sandbox/reportFromPySandbox.txt");
                    console.log("!!!");
                    console.log(jsonResults);
                    console.log("@@@");
                    let standardOutputResults: string = await Deno.readTextFile("./sandbox/standardOutputFromPySandbox.txt");
                    let standardErrorResults: string = await Deno.readTextFile("./sandbox/standardErrorFromPySandbox.txt");
                    console.log("STDERRSTDERRSTDERRSTDERRSTDERRSTDERRSTDERRSTDERRSTDERRSTDERR");
                    console.log(standardErrorResults);
                    console.log("RERERERERERERERERERERERERERERERERERERERERERERERERERERERERERE");
                    let outputResults: string = await Deno.readTextFile("./sandbox/outputFromPySandbox.txt");
                    let outputResultsSplit: string[] = outputResults.split('\n');
                    let actualOutputResults: string = '';
                    if (questionInformation.outputFormat.length > 0) {
                        if (questionInformation.outputFormat[0] == 'n') {
                            if (outputResultsSplit.length > 0) {
                                actualOutputResults += outputResultsSplit[0];
                            }
                        } else if (questionInformation.outputFormat[0] == 'a') {
                            let n: number = 0;
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
                                actualOutputResults += ']'
                            }
                        } else if (questionInformation.outputFormat[0] == 'aa') {
                            let n: number = 0;
                            let nn: number = 0;
                            let k: number = 0;
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
                                actualOutputResults += ']'
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
                                actualOutputResults += ']'
                            }
                            if (n > 0) {
                                actualOutputResults += ']'
                            }
                        }
                    }
                    console.log("CCC");
                    console.log(standardOutputResults);
                    console.log("DDD");
                    console.log(actualOutputResults);
                    console.log("EEE");
                    jsonResults = jsonResults.replace(/\s/g, "");
                    jsonResults = jsonResults.substring(0, jsonResults.length - 2) + "]"
                    let testResults: TestResult[]  = JSON.parse(jsonResults.toString());
                    let testCasesPassed: TestCasesPassed = {
                        testCasesPassed: testResults.sort((t1, t2) => {
                            //returns the difference of the test numbers (so [2 1 10] -> [1 2 10] and not -> [1 10 2])
                            return +(t1.testName.replace("test", "")) - +(t2.testName.replace("test", ""));
                        }).map((tr: TestResult) => tr.passed),
                        standardOutput: standardOutputResults,
                        standardError: standardErrorResults,
                        output: actualOutputResults,
                    };
                    console.log("11111111111111111111111111");
                    /*if (++iiiCounter % 3 === 0) {
                        for (let i = 0; i < testCasesPassed.testCasesPassed.length; ++i) {
                            testCasesPassed.testCasesPassed[i] = true;
                        }
                    }*/
                    if (!testCasesPassed.testCasesPassed.some(element => !element) && ++sidsProgress[sid] === 3) {
                        let opponentSid = matches[sid];
                        delete matches[sid];
                        delete matches[opponentSid];
                        delete sidsProgress[sid];
                        delete sidsProgress[opponentSid];
                        delete sidsQuestions[sid];
                        delete sidsQuestions[opponentSid];
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
                    console.log("2222222222222222");
                }
            }
        } catch (err) {
            console.log(err);
        }
    })
    .get("/api/wildcardEndpoint", async (context) => {
        context.response.body = { endpoint: 
            prod ? "wss://licode.io/ws" : "ws://localhost:5000/ws"
        };
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
