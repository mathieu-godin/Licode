import * as React from "react";
import { Box, Button, Typography, Grid, Stack, Table, Paper, TableContainer, TableBody, TableRow, TableCell } from "@mui/material"
import Avatar from '@mui/material/Avatar';
import Form from "./common/form";
import { sizing } from '@mui/system';
export interface HomeProps {}

export interface HomeState {}

class Dashboard extends Form {
  //state = { :  }
    render() {
        return (
            <Box
                height="0vh" display="flex" flexDirection="column"
            >
                <Grid container spacing = {2}>
                    <Grid item 
                        xs={2}
                        //className={classes.outerColumn}
                        direction="column"
                        //align="left"
                        style={{display: "flex", justifyContent: "flex-end"}}
                        //alignSelf= 'end'
                        //position="relative" 
                        //top = "20vh"
                        //bottom="0vh"
                        //style={{ minHeight: '82vh' }}
                    >
                        <Button 
                            fullWidth variant="contained"
                            style={{maxWidth: '150px', minWidth: '150px', minHeight: '50px'}}
                        >
                                Logout
                        </Button>
                    </Grid>
                    <Grid item xs={7}
                      container 
                      alignItems="center" 
                      justifyContent="top"
                      spacing={25}
                      direction="column"
                      style={{height:'calc(100vh - ${uiDefault.APPBAR_HEIGHT})'}}
                      //style={{ minHeight: '82vh' }}
                    >
                        <Grid item xs={0}>
                            <Typography align="center" variant="h1">
                                licode
                            </Typography>
                        </Grid>
                        <Grid item xs={0}>
                            <Button 
                                fullWidth variant="contained"
                                style={{maxWidth: '200px', minWidth: '200px', minHeight: '75px'}}
                                href="/editor">
                                PLAY 
                            </Button>
                        </Grid>
                    </Grid>
                    <Grid item xs={3} 
                        //display="flex"
                        //justifyContent="flex-end"
                        container
                        direction="column"
                        spacing={5}
                    >
                        <Grid item xs={0}>
                            <Stack direction="row" justifyContent="end">
                                <Avatar src="/static/images/avatar/profile_pic.jpg" />
                            </Stack>
                        </Grid>
                        <Grid item xs={0}>
                            <TableContainer component={Paper}>
                                <Table 
                                    //sx={{ maxWidth: 200 }} 
                                    //</TableContainer>aria-label="simple table"
                                >                          
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
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
        );
    }
}

export default Dashboard;