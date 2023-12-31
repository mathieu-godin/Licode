import * as React from "react";
import { Box, Button, Typography, Grid, Stack, Table, Paper, TableContainer, TableBody, TableRow, TableCell } from "@mui/material"
import Image from '../images/BlueBackground.png';

interface User {
    email: { value: string };
    username: { value: string };
    password: { value: string };
}

export interface DashboardProps {
    setToken: Function
}

export interface DashboardState {
    user: User,
    numWins: number,
    numLosses: number,
    eloRating: number,
    loaded: boolean,
}



export interface WinLossProps {
    numWins: number,
    numLosses: number,
    eloRating: number,
    loaded: boolean,
}

function computeWinRate(numWins: number, numLosses: number) {
    let numGames = numWins + numLosses;
    if (numGames > 0) {
        return (numWins / numGames * 100).toFixed(2).toString() + '%';
    } else {
        return '0%';
    }
}

function WinLossTable(props: WinLossProps) {
    const loaded: boolean = props.loaded;
    if (loaded) {
        return (
            <TableContainer component={Paper}>
                <Table>                          
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{fontSize: 24}}>Rating: </TableCell>
                            <TableCell sx={{fontSize: 24}}>{props.eloRating}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{fontSize: 24}}>Number of Wins: </TableCell>
                            <TableCell sx={{fontSize: 24}}>{props.numWins}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{fontSize: 24}}>Number of Losses: </TableCell>
                            <TableCell sx={{fontSize: 24}}>{props.numLosses}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{fontSize: 24}}>Winrate: </TableCell>
                            <TableCell sx={{fontSize: 24}}>{computeWinRate(props.numWins, props.numLosses)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        );
    } else {
        return (
            <TableContainer component={Paper}>
                <Table>                          
                    <TableBody>
                        <TableRow>
                            <TableCell />
                            <TableCell />
                        </TableRow>
                        <TableRow>
                            <TableCell />
                            <TableCell />
                        </TableRow>
                        <TableRow>
                            <TableCell />
                            <TableCell />
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }
}

class Dashboard extends React.Component<DashboardProps, DashboardState> {
    constructor(props: DashboardProps) {
        super(props);
        this.handleLogout = this.handleLogout.bind(this);
        this.state = {
            user: {
                email: { value: '' },
                username: { value: '' },
                password: { value: '' },
            },
            numWins: 500,
            numLosses: 500,
            eloRating: 5000,
            loaded: false,
        }
    }

    componentDidMount() {
        fetch('/api/user').then(response => response.json()).then((json) => {
            this.setState({
                user: json.user,
                numWins: json.numWins,
                numLosses: json.numLosses,
                eloRating: json.eloRating,
                loaded: true,
            });
        })
    }

    async handleLogout () {
        await fetch('/api/logout');
        this.props.setToken();
    };

    render() {
        return (
                <Box
                    height="100vh"
                    sx={{ backgroundColor: '#01182a', backgroundRepeat: 'no-repeat', backgroundSize: 'cover' }}
                    display="flex" 
                    flexDirection="column"
                >
                    <Typography sx={{ position: 'fixed', left: 30, top: 30, fontSize: 56, color: 'white' }}>
                        Welcome, {this.state.user.username.value}
                    </Typography>
                    <Box
                        display="flex"
                        alignItems="center" 
                        justifyContent="center"
                        minHeight="80vh"
                    >
                        <Stack
                            spacing={2}
                            sx={{ bgcolor:'background.paper', border:5, p:2, borderColor: 'primary.main', width: '80vw', marginTop: '15vh'}} 
                        >
                            <Typography
                                align='center'
                                color="common.white"
                                sx={{bgcolor:'text.disabled', borderRadius:1, p:1, fontSize: 32}}
                            >
                                STATS
                            </Typography>
                            <WinLossTable loaded={this.state.loaded} numWins={this.state.numWins} numLosses={this.state.numLosses} eloRating={this.state.eloRating} />
                            <Button 
                                fullWidth variant="contained"
                                href="/licode/waitlist"
                                sx={{fontSize: 32}}                                        
                            >
                                PLAY 
                            </Button>
                            <Button variant="contained" onClick={this.handleLogout} sx={{fontSize: 32}}>
                                LOGOUT
                            </Button>
                        </Stack>
                    </Box>
                </Box>
        );
    }
}

export default Dashboard;