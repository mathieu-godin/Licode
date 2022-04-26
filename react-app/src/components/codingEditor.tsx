import * as React from "react";
import { Box, Typography, Grid, Button, IconButton, TextField } from '@mui/material';
import { ButtonProps } from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { ThemeProvider } from '@mui/material/styles';
import editorTheme from './themes/editorTheme';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SpeedIcon from '@mui/icons-material/Speed';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { Navigate } from "react-router-dom";
import { MatchmakingData, QuestionData, TestCasesPassed } from "./common/interfaces/matchmakingData";
import AceEditor from "react-ace";

//Add imports for modes to be supported
//import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

interface CodeSubmission {
    value: string;
    input: string;
}

const defaultSignature: string = 'def makeSum(nums, target):\n    ',
    defaultInput: string = '[2,7,11,15]\n9';

/*
SERVER replies with Msg as json
Message Types:
	Behaviour
		TypeSlow		- tell player to type slow
		Peek			- tell player to stop peeking
	Information
		Connection		- tell player if connection succeed
		Error			- give player an error message
		Loss			- inform player their opponent has won
		QuestionNum		- inform player their opponent is on a new question
	FieldUpdate
		Code			- give player their opponent's code editor input
		Input			- etc.
		Output
		StandardOutput
*/

/*
CLIENT sends message type and args i.e. <MsgType> <args[1]> <args[2]> ...
Message Types:
	ConnectionRequest		- indicates player wants to join the game with sid args[1]
	StartPeeking			- player using peek wildcard
	SlowOpponent			- player using typing speed wildcard
	Skip					- player is skipping a test case
	GiveFieldUpdate			- player is sending a field update (code, input, ...)
		same subtypes as SERVER FieldUpdate
	GiveQuestionNum			- indicates the player is now solving question args[1]
	Win						- the player has solved the final question
*/

//Server message top level types
enum SERVERMSGTYPE {
	Behaviour   = 0,
	Information = 1,
	FieldUpdate = 2,
}

//Behaviour subtypes
enum BEHAVIOUR {
	TypeSlow = 0,
	Peek     = 1,
}

//Information subtypes
enum INFORMATION {
	Connection  = 0,
	Error       = 1,
	Loss        = 2,
	QuestionNum = 3,
}

//FieldUpdate subtypes
enum FIELDUPDATE {
	Code           = 0,
	Input          = 1,
	Output         = 2,
	StandardOutput = 3,
    TestCases      = 4,
}

//client messages
enum CLIENTMSGTYPE {
	ConnectionRequest       = 0,
	StartPeeking            = 1,
	SlowOpponent            = 2,
	Skip                    = 3,
	GiveFieldUpdate         = 4,
	GiveQuestionNum         = 5,
	Win                     = 6,
}


interface ServerMsg {
    Type: number,
    Data: any,
}

interface BehaviourData {
	Type: number,
	Start: boolean, 
}

interface InformationData {
	Type: number,
	Info: string,
}

interface FieldUpdateData {
	Type: number,
	NewValue: string,
}

export interface CodingEditorProps {}

export interface CodingEditorState {
    username: string,
    eloRating: number,
    opponentUsername: string,
    opponentEloRating: number,
    loaded: boolean,
    testCasesPassed: boolean[],
    code: string,
    rightEditorCode: string,
    socket:  WebSocket | null,
    sid: string,
    typingSlow: boolean,
    canType: boolean, //used to type slow
    sendingCodeUpdates: boolean,
    firstMsg: boolean,
    peeking: boolean,
    skipping: boolean,
    lost: boolean,

    input: string,
    standardOutput: string,
    output: string,
    questionNum: number,

    rightInput: string,
    rightOutput: string,
    rightStandardOutput: string,
    rightTestCasesPassed: boolean[],
    opponentQuestionNum: number,

    questionLines: string[],
}

export interface QuestionLineProps {
    question: string,
}

function QuestionLine(props: QuestionLineProps) {
    let questionSplits = props.question.split('$');
    let highlight: boolean = true;
    let typographies = [];
    if (questionSplits.length > 0) {
        typographies.push(React.createElement(Typography, { variant: 'problemDescription' }, questionSplits[0]));
    }
    for (let i = 1; i < questionSplits.length; ++i) {
        if (highlight) {
            typographies.push(React.createElement(Typography, { variant: 'problemHighlightedWord' }, '\u00A0' + questionSplits[i]));
        } else {
            typographies.push(React.createElement(Typography, { variant: 'problemDescription' }, '\u00A0' + questionSplits[i]));
        }
        highlight = !highlight;
    }
    //return React.createElement('div', {}, ...typographies);
    return React.createElement('div', {}, ...typographies);
}

export interface PlayerInformationProps {
    username: string,
    eloRating: number,
    loaded: boolean,
}

function PlayerInformation(props: PlayerInformationProps) {
    const loaded: boolean = props.loaded;
    if (loaded) {
        return <Typography variant="aboveEditor" sx={{ m: 0, p: 0 }}>{props.username}: Rank {props.eloRating}</Typography>;
    } else {
        return <Typography variant="aboveEditor" sx={{ m: 0, p: 0, display: "none" }} />;
    }
}

const EditorTextField = styled(TextField)({
    '& .MuiInputBase-input': {
        fontSize: 16,
        padding: '2px',
    }
});

const ColorButton = styled(Button)<ButtonProps>(({ theme }) => ({
    color: theme.palette.getContrastText('#268acd'),
    backgroundColor: '#268acd',
    '&:hover': {
      backgroundColor: '#1468ab',
    },
}));

export interface TestCaseIndicatorProps {
    passed: boolean,
}

function TestCaseIndicator(props: TestCaseIndicatorProps) {
    const passed: boolean = props.passed;
    if (passed) {
        return <CheckIcon sx={{ fontSize: 60, color: 'primary.checkmark' }} />;
    } else {
        return <CloseIcon sx={{ fontSize: 60, color: 'primary.cross' }} />;
    }
}

class CodingEditor extends React.Component<CodingEditorProps, CodingEditorState> {
    constructor(props: CodingEditorProps) {
        super(props);
        this.handleRun = this.handleRun.bind(this);
        this.handleCodeChange = this.handleCodeChange.bind(this);
        this.peekOpponent = this.peekOpponent.bind(this)
        this.slowOpponent = this.slowOpponent.bind(this)
        this.skipTestCase = this.skipTestCase.bind(this)
        this.opponentEditorChange = this.opponentEditorChange.bind(this)
        this.processOpponentField = this.processOpponentField.bind(this)
        this.sendCodeUpdate = this.sendCodeUpdate.bind(this)
        this.playerWon = this.playerWon.bind(this)
        this.handleInputChange = this.handleInputChange.bind(this);
        this.sendInititalUpdates = this.sendInititalUpdates.bind(this)
        this.state = {
            username: '',
            eloRating: 5000,
            opponentUsername: '',
            opponentEloRating: 5000,
            loaded: false,
            testCasesPassed: [false, false, false, false, false, false, false, false, false, false, false],
            rightEditorCode: '',
            socket: null,
            sid: '',
            typingSlow: false,
            canType: true,
            sendingCodeUpdates: false,
            firstMsg: true,
            peeking: false,
            lost: false,
            skipping: false,
            code: 'aaqdqd',
            input: defaultInput,
            standardOutput: '',
            output: '',
            rightInput: '',
            rightStandardOutput: '',
            rightOutput: '',
            rightTestCasesPassed: [false, false, false, false, false, false, false, false, false, false, false],
            questionNum: 1,
            opponentQuestionNum: 1,
            questionLines: ['', '', ''],
        }
    }

    async componentDidMount() {
        console.log("Attempting Connection...");
        const data: MatchmakingData = await fetch('/api/opponent').then(response => response.json());
        const questionData: QuestionData = await fetch('/api/question').then(response => response.json());
        let initialQuestionLines = questionData.question.split(';');
        for (let i = 0; i < 3 - initialQuestionLines.length; ++i) {
            initialQuestionLines.push('');
        }
        let inputLines = questionData.default_custom_input.split(';');
        let initialInput = '';
        if (inputLines.length > 0) {
            initialInput += inputLines[0];
        }
        for (let i = 1; i < inputLines.length; ++i) {
            initialInput += '\n' + inputLines[i];
        }
        this.setState({
            username: data.you.username,
            eloRating: data.you.eloRating,
            opponentUsername: data.opponent.username,
            opponentEloRating: data.opponent.eloRating,
            sid: data.you.sid,
            socket: new WebSocket("ws://localhost:5000/ws"),
            loaded: true,
            questionLines: initialQuestionLines,
            code: questionData.function_signature + '\n    ',
            input: initialInput,
        });

        if(this.state.socket == null) return;
        this.state.socket.onopen = () => {
            console.log(`Successfully Connected with sid: ${this.state.sid}`);
            this.state.socket?.send(`${CLIENTMSGTYPE.ConnectionRequest} ${this.state.sid}`);
        };
        
        this.state.socket.onclose = () => {
            console.log("Client Closed!")
            //sock.send("Client Closed!")
            //probably need some reconnect scheme
            //may need to make a helper for all writing to
            //server to detect disconnects
        };
        
        this.state.socket.onmessage = (event) => {
            const msgObj: ServerMsg = JSON.parse(event.data)
            console.log(msgObj)
            switch(msgObj.Type) {
                case SERVERMSGTYPE.Behaviour:
                    const behaviourData: BehaviourData = msgObj.Data
                    switch(behaviourData.Type) {
                        case BEHAVIOUR.TypeSlow:
                            if(behaviourData.Start) {
                                this.setState({canType: false, typingSlow: true}, () => {
                                    setTimeout(() => {
                                        this.setState({canType: true})
                                    })
                                })
                            } else {
                                this.setState({
                                    canType: true,
                                    typingSlow: false
                                })
                            }
                            break;
                        case BEHAVIOUR.Peek:
                            //stop peaking
                            //behaviourData.Start should always be false, the server
                            //only asks us to stop peeking
                            this.setState({
                                peeking: false
                            })
                            break;
                        default:
                            //error?
                            break;
                    }
                    break;
                case SERVERMSGTYPE.Information:
                    const infoData: InformationData = msgObj.Data
                    switch(infoData.Type) {
                        case INFORMATION.Connection:
                            if(infoData.Info === "") {
                                console.log("Registered!")
                                this.sendInititalUpdates()
                            } else {
                                console.log("Registration Failed! " + infoData.Info)
                            }
                            break;
                        case INFORMATION.Error:
                            console.log("Error: " + infoData.Info)
                            break;
                        case INFORMATION.Loss:
                            console.log("YOU LOSE!!!")
                            this.setState({
                                lost: true
                            })
                            break;
                        case INFORMATION.QuestionNum:
                            this.setState({
                                opponentQuestionNum: parseInt(infoData.Info)
                            })
                            break;
                        default:
                            //error?
                            break;
                    }
                    break;
                case SERVERMSGTYPE.FieldUpdate:
                    const fieldData: FieldUpdateData = msgObj.Data
                    switch(fieldData.Type) {
                        case FIELDUPDATE.Code:
                            //receiving a code update
                            console.log("code update")
                            this.setState({
                                rightEditorCode: fieldData.NewValue
                            })
                            break;
                        case FIELDUPDATE.Input:
                            this.setState({
                                rightInput: fieldData.NewValue
                            })
                            break;
                        case FIELDUPDATE.Output:
                            this.setState({
                                rightOutput: fieldData.NewValue
                            })
                            break;
                        case FIELDUPDATE.StandardOutput:
                            this.setState({
                                rightStandardOutput: fieldData.NewValue
                            })
                            break;
                        case FIELDUPDATE.TestCases:
                            let newTestCases: boolean[] = fieldData.NewValue.split(" ").map((str: string) => str === "1")
                            // if(newTestCases.reduce((count: number, passed: boolean, idx: number) => {
                            //     return passed ? (count + 1) : count
                            // }, 0) === 11){
                            //     newTestCases = [false, false, false, false, false, false, false, false, false, false, false]
                            // }
                            this.setState({
                                rightTestCasesPassed: newTestCases
                            })
                            break;
                        default:
                            //error?
                            break;                                                                                            
                    }
                    break;
                default:
                    //error?
                    break
            }
        }

        this.state.socket.onerror = (error) => {
            console.log("Socket Error: ", error);
        };
    }

    async handleRun () {
        let codeSubmission: CodeSubmission = {
            value: '',
            input: '',
        }
        codeSubmission.value = this.state.code;
        codeSubmission.input = this.state.input;
        let res: TestCasesPassed = await fetch('/api/run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(codeSubmission),
        }).then(response => response.json());

        if (res.testCasesPassed) {
            this.sendFieldUpdate(FIELDUPDATE.TestCases, this.stringifyBoolArray(res.testCasesPassed))
            this.setState({ testCasesPassed: res.testCasesPassed });
        }
        if (res.standardOutput) {
            this.sendFieldUpdate(FIELDUPDATE.StandardOutput, res.standardOutput)
            this.setState({ standardOutput: res.standardOutput });
        }
        if (res.output) {
            this.sendFieldUpdate(FIELDUPDATE.Output, res.output)
            this.setState({ output: res.output });
        }
        let hasWon = true;
        for (let i = 0; i < res.testCasesPassed.length; ++i) {
            if (!res.testCasesPassed[i]) {
                hasWon = false;
                break;
            }
        }
        console.log("AAA");
        console.log(hasWon);
        console.log(this.state.questionNum);
        console.log("BBB");
        if (hasWon && this.state.questionNum < 4) {
            console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
            const questionData: QuestionData = await fetch('/api/question').then(response => response.json());
            let initialQuestionLines = questionData.question.split(';');
            for (let i = 0; i < 3 - initialQuestionLines.length; ++i) {
                initialQuestionLines.push('');
            }
            let inputLines = questionData.default_custom_input.split(';');
            let initialInput = '';
            if (inputLines.length > 0) {
                initialInput += inputLines[0];
            }
            for (let i = 1; i < inputLines.length; ++i) {
                initialInput += '\n' + inputLines[i];
            }
            this.setState({ questionLines: initialQuestionLines, code: questionData.function_signature + '\n    ', input: initialInput });
        }
    };

    peekOpponent () {
        console.log("Sending Peek")
        this.state.socket?.send(CLIENTMSGTYPE.StartPeeking.toString())
        this.setState({
            peeking: true
        })
    }
    slowOpponent () {
        console.log("Sending Slow")
        this.state.socket?.send(CLIENTMSGTYPE.SlowOpponent.toString())
    }
    skipTestCase () {
        console.log("Sending Skip")
        this.setState({
            skipping: true
        })
        this.state.socket?.send(CLIENTMSGTYPE.Skip.toString())
    }

    processOpponentField (field: string) : string {
        var r = 0
        var randomChars : string = "#!$*?~"
        var ret = field.replace(/[^\s]/g, (substr: string, ..._args: any[]) : string => {
            const oldR = r
            r = (r + 1) % randomChars.length
            return randomChars[oldR]
        })  

        return ret
    }  

    sendFieldUpdate(type: number, newValue: string) {
        this.state.socket?.send(CLIENTMSGTYPE.GiveFieldUpdate.toString() + " " + type.toString() + " " + newValue)
    }

    sendCodeUpdate(code: string) {
        this.sendFieldUpdate(FIELDUPDATE.Code, code)
    }

    handleCodeChange (value: string, e: React.ChangeEvent<HTMLInputElement>) {
        console.log("handling: " + value)
        if (this.state.canType && !this.state.typingSlow) {
            //normal case, just update state
            console.log("normal case");
            this.sendFieldUpdate(FIELDUPDATE.Code, value)
            this.setState({
                code: value
            });
        } else if (this.state.canType) {
            //they waited long enough
            console.log("slow, but can type")
            this.sendFieldUpdate(FIELDUPDATE.Code, value)
            this.setState({code: value, canType: false}, () => {
                setTimeout(() => {
                    this.setState({canType: true})
                })
            })
        } else {
            //they can't type yet, revert the change
            console.log("can't type")
            console.log(e.currentTarget)
            e.currentTarget.value = this.state.code
        }
    }

    opponentEditorChange (e: React.ChangeEvent<HTMLInputElement>) {
        console.log("Opponent Editor Change")
    }

    handleInputChange (e: React.ChangeEvent<HTMLInputElement>) {
        this.sendFieldUpdate(FIELDUPDATE.Input, e.currentTarget.value);
        this.setState({ input: e.currentTarget.value });
    }

    playerWon() : boolean {
        const testsPassed: number = this.state.testCasesPassed.reduce((numPassed: number, passed: boolean) => {
            if (passed) {
                return numPassed + 1;
            } else {
                return numPassed;
            }
        }, 0);
        const pWon = testsPassed == 11 || testsPassed == 10 && this.state.skipping;
        //I think overwriting false with false was causing an infinte
        //recursion in render() leading to a nasty error
        if(this.state.skipping) {
            this.setState({
                skipping: false
            })
        }
        return pWon
    }

    stringifyBoolArray(boolArr: boolean[]) : string {
        return boolArr.map((v: boolean) => v ? "1" : "0").join(" ")
    }
    
    sendInititalUpdates() {
        //code
        this.sendCodeUpdate(this.state.code)
        //input
        this.sendFieldUpdate(FIELDUPDATE.Input, this.state.input)
        //test cases
        this.sendFieldUpdate(FIELDUPDATE.TestCases, this.stringifyBoolArray(this.state.testCasesPassed))

        console.log("sent initial updates")

        //(standard) output???
    }

    render() {
        // const rightEditorCode: string = "!@#$%^&*()!@#$%^&*()\n    !@#$%^&*(\n        !@#$%^&*",
        //     rightInput = "*#&#^#%@&@*\n*";
        console.log("rendering w peeking = " + (this.state.peeking ? "true" : "false"))
        if(this.playerWon()){
            if (this.state.questionNum == 3) {
                this.state.socket?.send(CLIENTMSGTYPE.Win.toString())
                return <Navigate to="/victory"/>
            } else {
                this.state.socket?.send(CLIENTMSGTYPE.GiveQuestionNum.toString() + " " + (this.state.questionNum + 1).toString())
                this.setState({ testCasesPassed: [false, false, false, false, false, false, false, false],
                    questionNum: this.state.questionNum + 1 }, () => this.sendInititalUpdates());
            }
        } else if (this.state.lost) {
            return <Navigate to="/dashboard"/>
        }
        return (
            <ThemeProvider theme={editorTheme}>
                <Box sx={{ display: 'flex', height: '100%', bgcolor: 'primary.main', m: 0, p: 0 }}>
                    <Grid container direction="column">
                        <Grid container item mt={1}>
                            <Grid item xs={1} />
                            <Grid container direction="column" item xs={10}>
                                <Grid item mt={2}>
                                    <QuestionLine question={this.state.questionLines[0]} />
                                </Grid>
                                <Grid item mt={1.5}>
                                    <QuestionLine question={this.state.questionLines[1]} />
                                </Grid>
                                <Grid item mt={1.5}>
                                    <QuestionLine question={this.state.questionLines[2]} />
                                </Grid>
                            </Grid>
                            <Grid item xs ={1} />
                        </Grid>
                        <Grid container item mt={0.5}>
                            <Grid item xs={0.75} />
                            <Grid container direction="column" item xs={5}>
                                <Grid container item mt={2}>
                                    <Grid item xs={0.5} />
                                    <Grid container direction="column" item xs={11}>
                                        <Grid item>
                                            <PlayerInformation loaded={this.state.loaded} username="You" eloRating={this.state.eloRating} />
                                        </Grid>
                                        <Grid container>
                                            <Grid item xs="auto">
                                                <IconButton color="button" onClick={this.skipTestCase}>
                                                    <CheckCircleIcon sx={{ fontSize: 32 }} />
                                                </IconButton>
                                            </Grid>
                                            <Grid item xs="auto">
                                                <IconButton color="button" onClick={this.slowOpponent}>
                                                    <SpeedIcon sx={{ fontSize: 32 }} />
                                                </IconButton>
                                            </Grid>
                                            <Grid item xs="auto">
                                                <IconButton color="button" onClick={this.peekOpponent}>
                                                    <RemoveRedEyeIcon sx={{ fontSize: 32 }} />
                                                </IconButton>
                                            </Grid>
                                        </Grid>
                                        <Grid item>
                                            <Typography variant="aboveEditor" sx={{ m: 0, p: 0 }}>
                                                Question {this.state.questionNum}/3
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={0.5} />
                                </Grid>
                                <Grid item mt={1}>
                                    <AceEditor
                                        mode="python"
                                        theme="github"
                                        name="filled-multiline-static"
                                        fontSize={14}
                                        value={this.state.code}
                                        onChange={this.handleCodeChange}
                                        setOptions={{
                                            enableBasicAutocompletion: true,
                                            enableLiveAutocompletion: true,
                                            enableSnippets: true
                                        }}
                                        editorProps={{ $blockScrolling: true}}
                                    />
                                </Grid>
                                <Grid item container mt={1} alignItems="center">
                                    <Grid item container xs={2} direction="column" alignItems="center">
                                        <Grid item >
                                            <Typography variant="inputOutput" sx={{ m: 0, p: 0 }}>
                                                Input
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={10}>
                                        <EditorTextField id="filled-multiline-static" multiline fullWidth rows={2} variant="filled"
                                            value={this.state.input} onChange={this.handleInputChange} />
                                    </Grid>
                                </Grid>
                                <Grid item container mt={1} alignItems="center">
                                    <Grid item container xs={2} direction="column" alignItems="center">
                                        <Grid item >
                                            <Typography variant="inputOutput" sx={{ m: 0, p: 0 }}>
                                                Standard Output
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={10}>
                                        <EditorTextField id="filled-multiline-static" multiline fullWidth rows={2} variant="filled"
                                            InputProps={{ readOnly: true }} value={this.state.standardOutput} />
                                    </Grid>
                                </Grid>
                                <Grid item container mt={1} alignItems="center">
                                    <Grid item container xs={2} direction="column" alignItems="center">
                                        <Grid item >
                                            <Typography variant="inputOutput" sx={{ m: 0, p: 0 }}>
                                                Output
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={10}>
                                        <EditorTextField id="filled-multiline-static" multiline fullWidth rows={2} variant="filled"
                                            InputProps={{ readOnly: true }} value={this.state.output} />
                                    </Grid>
                                </Grid>
                                <Grid container item mt={2}>
                                    <Grid item xs={0.5} />
                                    <Grid container direction="column" item xs={11}>
                                        <Grid item>
                                            <Typography variant="aboveEditor" sx={{ m: 0, p: 0 }}>
                                                Test Cases
                                            </Typography>
                                        </Grid>
                                        <Grid container item>
                                            <Grid item xs={0.5} />
                                            <Grid item xs={1}>
                                                <TestCaseIndicator passed={this.state.testCasesPassed[0]} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <TestCaseIndicator passed={this.state.testCasesPassed[1]} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <TestCaseIndicator passed={this.state.testCasesPassed[2]} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <TestCaseIndicator passed={this.state.testCasesPassed[3]} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <TestCaseIndicator passed={this.state.testCasesPassed[4]} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <TestCaseIndicator passed={this.state.testCasesPassed[5]} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <TestCaseIndicator passed={this.state.testCasesPassed[6]} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <TestCaseIndicator passed={this.state.testCasesPassed[7]} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <TestCaseIndicator passed={this.state.testCasesPassed[8]} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <TestCaseIndicator passed={this.state.testCasesPassed[9]} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <TestCaseIndicator passed={this.state.testCasesPassed[10]} />
                                            </Grid>
                                            <Grid item xs={0.5} />
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={0.5} />
                                </Grid>
                            </Grid>
                            <Grid item xs={0.5} />
                            <Grid container direction="column" item xs={5}>
                                <Grid container item mt={2}>
                                    <Grid item xs={0.5} />
                                    <Grid container direction="column" item xs={11}>
                                        <Grid item>
                                            <PlayerInformation loaded={this.state.loaded} username={this.state.opponentUsername}
                                                eloRating={this.state.opponentEloRating} />
                                        </Grid>
                                        <Grid container sx={{ visibility: 'hidden' }}>
                                            <Grid item xs="auto">
                                                <IconButton color="button">
                                                    <CheckCircleIcon sx={{ fontSize: 32 }} />
                                                </IconButton>
                                            </Grid>
                                            <Grid item xs="auto">
                                                <IconButton color="button">
                                                    <SpeedIcon sx={{ fontSize: 32 }} />
                                                </IconButton>
                                            </Grid>
                                            <Grid item xs="auto">
                                                <IconButton color="button">
                                                    <RemoveRedEyeIcon sx={{ fontSize: 32 }} />
                                                </IconButton>
                                            </Grid>
                                        </Grid>
                                        <Grid item>
                                            <Typography variant="aboveEditor" sx={{ m: 0, p: 0 }}>
                                                Question {this.state.opponentQuestionNum}/3
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={0.5} />
                                </Grid>
                                <Grid item mt={1}>
                                    <AceEditor
                                        mode="text"
                                        theme="github"
                                        name="filled-multiline-static"
                                        fontSize={14}
                                        readOnly={true}
                                        highlightActiveLine={false}
                                        value = {this.state.peeking? this.state.rightEditorCode : this.processOpponentField(this.state.rightEditorCode)}
                                        onChange={this.handleCodeChange}
                                        editorProps={{ $blockScrolling: true}}
                                    />
                                </Grid>
                                <Grid item container mt={1} alignItems="center">
                                    <Grid item container xs={2} direction="column" alignItems="center">
                                        <Grid item >
                                            <Typography variant="inputOutput" sx={{ m: 0, p: 0 }}>
                                                Input
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={10}>
                                        <EditorTextField id="filled-multiline-static" multiline fullWidth rows={2} variant="filled"
                                            value={this.state.peeking ? this.state.rightInput : this.processOpponentField(this.state.rightInput)}
                                            InputProps={{ readOnly: true }} />
                                    </Grid>
                                </Grid>
                                <Grid item container mt={1} alignItems="center">
                                    <Grid item container xs={2} direction="column" alignItems="center">
                                        <Grid item >
                                            <Typography variant="inputOutput" sx={{ m: 0, p: 0 }}>
                                                Standard Output
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={10}>
                                        <EditorTextField id="filled-multiline-static" multiline fullWidth rows={2} variant="filled"
                                            value={this.state.peeking ? this.state.rightStandardOutput : this.processOpponentField(this.state.rightStandardOutput)}
                                            InputProps={{ readOnly: true }} />
                                    </Grid>
                                </Grid>
                                <Grid item container mt={1} alignItems="center">
                                    <Grid item container xs={2} direction="column" alignItems="center">
                                        <Grid item >
                                            <Typography variant="inputOutput" sx={{ m: 0, p: 0 }}>
                                                Output
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={10}>
                                        <EditorTextField id="filled-multiline-static" multiline fullWidth rows={2} variant="filled"
                                            value={this.state.peeking ? this.state.rightOutput : this.processOpponentField(this.state.rightOutput)}
                                            InputProps={{ readOnly: true }} />
                                    </Grid>
                                </Grid>
                                <Grid container item mt={2}>
                                    <Grid item xs={0.5} />
                                    <Grid container direction="column" item xs={11}>
                                        <Grid item>
                                            <Typography variant="aboveEditor" sx={{ m: 0, p: 0 }}>
                                                Test Cases
                                            </Typography>
                                        </Grid>
                                        <Grid container item>
                                            <Grid item xs={0.5} />
                                            <Grid item xs={1}>
                                                <TestCaseIndicator passed={this.state.rightTestCasesPassed[0]} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <TestCaseIndicator passed={this.state.rightTestCasesPassed[1]} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <TestCaseIndicator passed={this.state.rightTestCasesPassed[2]} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <TestCaseIndicator passed={this.state.rightTestCasesPassed[3]} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <TestCaseIndicator passed={this.state.rightTestCasesPassed[4]} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <TestCaseIndicator passed={this.state.rightTestCasesPassed[5]} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <TestCaseIndicator passed={this.state.rightTestCasesPassed[6]} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <TestCaseIndicator passed={this.state.rightTestCasesPassed[7]} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <TestCaseIndicator passed={this.state.rightTestCasesPassed[8]} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <TestCaseIndicator passed={this.state.rightTestCasesPassed[9]} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <TestCaseIndicator passed={this.state.rightTestCasesPassed[10]} />
                                            </Grid>
                                            <Grid item xs={0.5} />
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={0.5} />
                                </Grid>
                            </Grid>
                            <Grid item xs={0.75} />
                        </Grid>
                        <Grid container item mt={1.5}>
                            <Grid item xs={0.5} />
                            <Grid item xs={1.5}>
                                <ColorButton variant="contained" sx={{ minWidth: 125, fontSize: 24 }} onClick={this.handleRun}>
                                    Run
                                </ColorButton>
                            </Grid>
                            <Grid item xs={10} />
                        </Grid>
                    </Grid>
                </Box>
            </ThemeProvider>
        );
    }
}

export default CodingEditor;