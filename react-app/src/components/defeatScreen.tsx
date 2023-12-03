import * as React from "react";
import { createTheme, Box, Button, Stack, Paper, IconButton, } from "@mui/material"
import CancelIcon from '@mui/icons-material/Cancel';
import Image from '../images/defeat_background.png';
//import Image from '../images/BlueBackground.png';


export interface DefeatScreenProps {}

export interface DefeatScreenState {}

const styles = {
    paperContainer: {
        backgroundImage: `url(${Image})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
        border:"0px"
    }
};

class DefeatScreen extends React.Component<DefeatScreenProps, DefeatScreenState>{

    render() {
        return (
            <Paper style={styles.paperContainer}>
                <Box
                    display="flex"
                    alignItems="center" 
                    justifyContent="center"
                    minHeight="100vh"
                    //sx={{ bgcolor:'primary.light' }}
                >
                    <Stack
                        spacing={4}
                        sx={{ bgcolor:'background.paper', fontFamily: "Stencil Std", fontSize:40, border:5, p:2, borderColor: '#ff7961'}} 
                    >
                        DEFEAT
                        <Stack direction="row" spacing={0}>
                            <IconButton
                                aria-label="cancelicon"
                                size = "large" 
                                href="/licode/dashboard"                                   
                            >
                                <CancelIcon fontSize="inherit"/>
                            </IconButton>
                            <Button fullWidth
                                    variant="contained"
                                    color = "error"
                                    href="/licode/dashboard"
                            >
                                Return to Dashboard
                            </Button>
                        </Stack>                        
                    </Stack>
                </Box>
            </Paper>

            /*<Paper style={styles.paperContainer}
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
                            <WinLossTable loaded={this.state.loaded} numWins={this.state.numWins} numLosses={this.state.numLosses} />
                            <Button 
                                fullWidth variant="contained"
                                href="/licode/editor"                                           
                            >
                                PLAY 
                            </Button>
                            <Button variant="contained" onClick={this.handleLogout}>
                                LOGOUT
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            </Paper>*/
        );
    }
}

export default DefeatScreen;