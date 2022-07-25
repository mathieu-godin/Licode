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
                            <TableCell>Rating: </TableCell>
                            <TableCell>{props.eloRating}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Number of Wins: </TableCell>
                            <TableCell>{props.numWins}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Number of Losses: </TableCell>
                            <TableCell>{props.numLosses}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Winrate: </TableCell>
                            <TableCell>{computeWinRate(props.numWins, props.numLosses)}</TableCell>
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
                    sx={{ backgroundImage: `url(${Image})`, backgroundRepeat: 'no-repeat', backgroundSize: 'cover' }}
                    display="flex" 
                    flexDirection="column"
                >
                    <Typography sx={{ position: 'fixed', left: 30, top: 30, fontSize: 32, color: 'white' }}>
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
                            sx={{ bgcolor:'background.paper', border:5, p:2, borderColor: 'primary.main'}} 
                        >
                            <Typography
                                align='center'
                                variant='h6'
                                color="common.white"
                                sx={{bgcolor:'text.disabled', borderRadius:1, p:1}}
                            >
                                STATS
                            </Typography>
                            <WinLossTable loaded={this.state.loaded} numWins={this.state.numWins} numLosses={this.state.numLosses} eloRating={this.state.eloRating} />
                            <Button 
                                fullWidth variant="contained"
                                href="/waitlist"                                           
                            >
                                PLAY 
                            </Button>
                            <Button variant="contained" onClick={this.handleLogout}>
                                LOGOUT
                            </Button>
                        </Stack>
                    </Box>
                </Box>
        );
    }
}

export default Dashboard;