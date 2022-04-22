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
import { MatchmakingData, QuestionData } from "./common/interfaces/matchmakingData";

interface CodeSubmission {
    value: string;
    input: string;
}

const defaultSignature: string = 'def makeSum(nums, target):\n    ',
    defaultInput: string = '[2,7,11,15]\n9';

enum MSGTYPE {
    MsgTypeBegin  = 0,
	Connection    = 1,
	CodeUpdate    = 2,
	Peek          = 3,
	Slow          = 4,
	Skip          = 5,
	Error         = 6,
	MsgTypeEnd    = 7,
}
const AlwaysSendCodeUpdate = true

interface Msg {
    MsgType: number,
    Ok: boolean,
    What: string,
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
    sendingCodeUpdates: boolean,
    firstMsg: boolean,
    peeking: boolean,
    skipping: boolean,

    input: string,
    standardOutput: string,
    output: string,
    questionNum: number,
    opponentQuestionNum: number,
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
        this.processOpponentCode = this.processOpponentCode.bind(this)
        this.sendCodeUpdate = this.sendCodeUpdate.bind(this)
        this.playerWon = this.playerWon.bind(this)
        this.handleInputChange = this.handleInputChange.bind(this);
        this.state = {
            username: '',
            eloRating: 5000,
            opponentUsername: '',
            opponentEloRating: 5000,
            loaded: false,
            testCasesPassed: [false, false, false, false, false, false, false, false],
            rightEditorCode: '',
            socket: null,
            sid: '',
            typingSlow: false,
            sendingCodeUpdates: false,
            firstMsg: true,
            peeking: false,
            skipping: false,
            code: defaultSignature,
            input: defaultInput,
            standardOutput: '',
            output: '',
            questionNum: 1,
            opponentQuestionNum: 1,
        }
    }

    async componentDidMount() {
        console.log("Attempting Connection...");

        const data: MatchmakingData = await fetch('/api/opponent').then(response => response.json());
        //const questionData: QuestionData = await fetch('/api/question').then(response => response.json());
        this.setState({
            username: data.you.username,
            eloRating: data.you.eloRating,
            opponentUsername: data.opponent.username,
            opponentEloRating: data.opponent.eloRating,
            sid: data.you.sid,
            //socket: new WebSocket("ws://localhost:8080/ws"),
            loaded: true,
        });

        /*if(this.state.socket == null) return;
        this.state.socket.onopen = () => {
            console.log(`Successfully Connected with sid: ${this.state.sid}`);
            this.state.socket?.send(`${MSGTYPE.Connection} ${this.state.sid}`);
        };*/
        
        /*this.state.socket.onclose = () => {
            console.log("Client Closed!")
            //sock.send("Client Closed!")
            //probably need some reconnect scheme
            //may need to make a helper for all writing to
            //server to detect disconnects
        };*/
        
        /*this.state.socket.onmessage = (event) => {
            const msgObj: Msg = JSON.parse(event.data)
            console.log(msgObj)
            switch(msgObj.MsgType) {
                case MSGTYPE.Connection: //connecting and reconnecting
                    if(msgObj.Ok) {
                        console.log("Registered!")
                        //send initial code update
                        this.sendCodeUpdate(this.state.code)
                    } else {
                        console.log("Registration Failed! ".concat(msgObj.What))
                    }
                    break
                case MSGTYPE.CodeUpdate: 
                    if(msgObj.Ok) {
                        //receiving a code update
                        this.setState({
                            rightEditorCode: this.processOpponentCode(msgObj.What)
                        })
                    } else if (msgObj.What == "B") {
                        //handle request for code updates
                        this.setState({
                            sendingCodeUpdates: true
                        })
                        //since we are being asked to send updates, 
                        //we have to send one now
                        if(this.state.sendingCodeUpdates) {
                            this.state.socket?.send(MSGTYPE.CodeUpdate.toString().concat(" ".concat(this.state.code)))
                        }
                    } else if (msgObj.What == "E") {
                        //stop sending code updates
                        this.setState({
                            sendingCodeUpdates: false
                        })
                    }
                    break
                case MSGTYPE.Peek:
                    //stop peaking
                    this.setState({
                        peeking: false
                    })
                    this.setState({
                        rightEditorCode: this.processOpponentCode(this.state.rightEditorCode)
                    })
                    break
                case MSGTYPE.Slow:
                    this.setState({
                        typingSlow: !msgObj.Ok
                    })
                    break      
                case MSGTYPE.Error:
                    console.log("Error: ".concat(msgObj.What))
                    break
                default:
                    break
            }
        }

        this.state.socket.onerror = (error) => {
            console.log("Socket Error: ", error);
        };*/
    }

    async handleRun () {
        let codeSubmission: CodeSubmission = {
            value: '',
            input: '',
        }
        codeSubmission.value = this.state.code;
        codeSubmission.input = this.state.input;
        let res = await fetch('/api/run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(codeSubmission),
        }).then(response => response.json());
        if (res.testCasesPassed) {
            this.setState({ testCasesPassed: res.testCasesPassed });
        }
        if (res.standardOutput) {
            this.setState({ standardOutput: res.standardOutput });
        }
        if (res.output) {
            this.setState({ output: res.output });
        }
    };

    peekOpponent () {
        console.log("Sending Peek")
        this.state.socket?.send(MSGTYPE.Peek.toString())
        this.setState({
            peeking: true
        })
    }
    slowOpponent () {
        console.log("Sending Slow")
        this.state.socket?.send(MSGTYPE.Slow.toString())
    }
    skipTestCase () {
        console.log("Sending Skip")
        this.setState({
            skipping: true
        })
        this.state.socket?.send(MSGTYPE.Skip.toString())
    }

    processOpponentCode (code: string) : string {
        if(this.state.peeking) {
            return code;
        }
        var r = 0
        var randomChars : string = "#!$*?~"
        var ret = code.replace(/[^\s]/g, (substr: string, ..._args: any[]) : string => {
            console.log("substr: ".concat(substr))
            const oldR = r
            r = (r + 1) % randomChars.length
            return randomChars[oldR]
        })  

        return ret
    }  

    sendCodeUpdate(code: string) {
        if(this.state.sendingCodeUpdates || AlwaysSendCodeUpdate) {
            this.state.socket?.send(MSGTYPE.CodeUpdate.toString().concat(" ".concat(code)));
        }
    }

    handleCodeChange (e: React.ChangeEvent<HTMLInputElement>) {
        const oldCode = this.state.code
        this.setState({ code: e.currentTarget.value });
        if(this.state.typingSlow) {
            e.currentTarget.value = oldCode
            var target = e.currentTarget
            setTimeout(() => {
                target.value = this.state.code
                this.sendCodeUpdate(this.state.code)
            }, 500)
        } else {
            this.sendCodeUpdate(this.state.code)
        }
    }

    opponentEditorChange (e: React.ChangeEvent<HTMLInputElement>) {
        console.log("Opponent Editor Change")
    }

    handleInputChange (e: React.ChangeEvent<HTMLInputElement>) {
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
        if(this.state.skipping) {
            this.setState({
                skipping: false
            })
        }
        return pWon
    }

    render() {
        const rightEditorCode: string = "!@#$%^&*()!@#$%^&*()\n    !@#$%^&*(\n        !@#$%^&*",
            rightInput = "*#&#^#%@&@*\n*";
        console.log("rendering")
        if(this.playerWon()){
            if (this.state.questionNum == 3) {
                return <Navigate to="/victory"/>
            } else {
                this.setState({ testCasesPassed: [false, false, false, false, false, false, false, false],
                    questionNum: this.state.questionNum + 1, code: defaultSignature, input: defaultInput });
            }
        }
        return (
            <ThemeProvider theme={editorTheme}>
                <Box sx={{ display: 'flex', height: '100%', bgcolor: 'primary.main', m: 0, p: 0 }}>
                    <Grid container direction="column">
                        <Grid container item mt={1}>
                            <Grid item xs={1} />
                            <Grid container direction="column" item xs={10}>
                                <Grid item mt={2}>
                                    <Typography variant="problemDescription" sx={{ m: 0, p: 0 }}>
                                        Given an array of integers
                                    </Typography>
                                    <Typography variant="problemHighlightedWord" sx={{ m: 0, p: 0 }}>
                                        &nbsp;nums
                                    </Typography>
                                    <Typography variant="problemDescription" sx={{ m: 0, p: 0 }}>
                                        &nbsp;and an integer
                                    </Typography>
                                    <Typography variant="problemHighlightedWord" sx={{ m: 0, p: 0 }}>
                                        &nbsp;target
                                    </Typography>
                                    <Typography variant="problemDescription" sx={{ m: 0, p: 0 }}>
                                        ,
                                    </Typography>
                                    <Typography variant="problemDescription" sx={{ m: 0, p: 0 }}>
                                        &nbsp;return
                                    </Typography>
                                    <Typography variant="problemDescriptionItalic" sx={{ m: 0, p: 0 }}>
                                        &nbsp;indices of the two numbers such that they add up to
                                    </Typography>
                                    <Typography variant="problemHighlightedItalicWord" sx={{ m: 0, p: 0 }}>
                                        &nbsp;target
                                    </Typography>
                                    <Typography variant="problemDescription" sx={{ m: 0, p: 0 }}>
                                        .
                                    </Typography>
                                </Grid>
                                <Grid item mt={1.5}>
                                    <Typography variant="problemDescription" sx={{ m: 0, p: 0 }}>
                                        You may assume that each input would have
                                    </Typography>
                                    <Typography variant="problemDescriptionItalic" sx={{ m: 0, p: 0 }}>
                                        &nbsp;exactly
                                    </Typography>
                                    <Typography variant="problemDescription" sx={{ m: 0, p: 0 }}>
                                        &nbsp;one solution, and you may not use the
                                    </Typography>
                                    <Typography variant="problemDescriptionItalic" sx={{ m: 0, p: 0 }}>
                                        &nbsp;same
                                    </Typography>
                                    <Typography variant="problemDescription" sx={{ m: 0, p: 0 }}>
                                        &nbsp;element twice.
                                    </Typography>
                                </Grid>
                                <Grid item mt={1.5}>
                                    <Typography variant="problemDescription" sx={{ m: 0, p: 0 }}>
                                        You can return the answer in any order.
                                    </Typography>
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
                                        <Grid item>
                                            <IconButton color="button" onClick={this.skipTestCase}>
                                                <CheckCircleIcon sx={{ fontSize: 32 }} />
                                            </IconButton>
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
                                    <EditorTextField id="filled-multiline-static" multiline fullWidth rows={12} variant="filled"
                                        value={this.state.code} onChange={this.handleCodeChange} />
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
                                        <Grid container>
                                            <Grid item xs="auto">
                                                <IconButton color="button" onClick={this.slowOpponent}>
                                                    <SpeedIcon sx={{ fontSize: 32 }} />
                                                </IconButton>
                                            </Grid>
                                            <Grid item xs="auto">
                                                <Typography variant="buttonExponent" sx={{ m: 0, p: 0 }}>
                                                    2
                                                </Typography>
                                            </Grid>
                                            <Grid item xs="auto">
                                                <IconButton color="button" onClick={this.peekOpponent}>
                                                    <RemoveRedEyeIcon sx={{ fontSize: 32 }} />
                                                </IconButton>
                                            </Grid>
                                            <Grid item xs="auto">
                                                <Typography variant="buttonExponent" sx={{ m: 0, p: 0 }}>
                                                    1
                                                </Typography>
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
                                    <EditorTextField id="filled-multiline-static" multiline fullWidth rows={12} variant="filled"
                                        value={this.state.rightEditorCode} InputProps={{ readOnly: true }} />
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
                                            defaultValue={rightInput} InputProps={{ readOnly: true }} />
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
                                                <CheckIcon sx={{ fontSize: 60, color: 'primary.checkmark' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CheckIcon sx={{ fontSize: 60, color: 'primary.checkmark' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CheckIcon sx={{ fontSize: 60, color: 'primary.checkmark' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CheckIcon sx={{ fontSize: 60, color: 'primary.checkmark' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CloseIcon sx={{ fontSize: 60, color: 'primary.cross' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CloseIcon sx={{ fontSize: 60, color: 'primary.cross' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CloseIcon sx={{ fontSize: 60, color: 'primary.cross' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CloseIcon sx={{ fontSize: 60, color: 'primary.cross' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CloseIcon sx={{ fontSize: 60, color: 'primary.cross' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CloseIcon sx={{ fontSize: 60, color: 'primary.cross' }} />
                                            </Grid>
                                            <Grid item xs={1}>
                                                <CloseIcon sx={{ fontSize: 60, color: 'primary.cross' }} />
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