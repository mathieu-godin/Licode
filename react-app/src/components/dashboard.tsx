import * as React from "react";
import { AppBar, Toolbar, Box, Button, Typography, Grid, Stack, Table, Paper, TableContainer, TableBody, TableRow, TableCell } from "@mui/material"
import Avatar from '@mui/material/Avatar';
import Form from "./common/form";
import { sizing } from '@mui/system';
import Image from '../images/BlueBackground.png';

const styles = {
    paperContainer: {
        backgroundImage: `url(${Image})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
        border:"10px"
    }
};

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
    loaded: boolean,
}

export interface GreetingProps {
    username: string,
    loaded: boolean,
}

function Greeting(props: GreetingProps) {
    const loaded: boolean = props.loaded;
    if (loaded) {
        return <Typography variant="h6" sx={{ mr: 55 }}>Welcome, {props.username}</Typography>;
    } else {
        return <Typography variant="h6" sx={{ mr: 55, display: "none"  }} />;
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
            loaded: false,
        }
    }

    componentDidMount() {
        fetch('/api/user').then(response => response.json()).then((json) => {
            this.setState({
                user: json,
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
            <Paper style={styles.paperContainer}
            >
                <Box
                    height="96vh" 
                    display="flex" 
                    flexDirection="column"
                >
                    <AppBar position="static">
                        <Toolbar>
                            <Greeting loaded={this.state.loaded} username={this.state.user.username.value} />
                            <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
                                licode
                            </Typography>
                        </Toolbar>
                    </AppBar>
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
                            <TableContainer component={Paper}>
                                <Table>                          
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>Number of Wins: </TableCell>
                                            <TableCell>5</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Number of Losses: </TableCell>
                                            <TableCell>3</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Winrate: </TableCell>
                                            <TableCell>62.5%</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <Button 
                                fullWidth variant="contained"
                                href="/editor"                                           
                            >
                                PLAY 
                            </Button>
                            <Button variant="contained" onClick={this.handleLogout}>
                                LOGOUT
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            </Paper>
        );
    }
}

export default Dashboard;