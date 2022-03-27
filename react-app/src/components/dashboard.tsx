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

class Dashboard extends Form {
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
                            <Typography variant="h6" sx={{ mr: 55}}>
                                Welcome, johndoe
                            </Typography>
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
                            <Button variant="contained">
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