import * as React from "react";
import { Link } from "react-router-dom";
import {  Button, Typography, Grid  } from "@mui/material"
import Form from "./common/form";

export interface HomeProps {}

export interface HomeState {}

class Dashboard extends Form {
  //state = { :  }
    render() {
        return (
            <React.Fragment>
                <Typography align="center" variant="h1">
                    licode
                </Typography>
                <Grid 
                    container 
                    alignItems="center" 
                    spacing={2}
                    direction="column"
                    //style={{ width: "100%" }}
                >
                    <Grid item>
                        <Button 
                            fullWidth variant="contained"
                            style={{maxWidth: '200px', minWidth: '200px'}}
                            href="/editor">
                            PLAY 
                        </Button>
                    </Grid>
                    <Grid item>
                        <Button 
                            fullWidth variant="contained"
                            style={{maxWidth: '200px', minWidth: '200px'}}
                        >
                            Username
                        </Button>
                    </Grid>
                    <Grid item>
                        <Button 
                            fullWidth variant="contained"
                            style={{maxWidth: '200px', minWidth: '200px'}}
                        >
                            ABOUT
                        </Button>
                    </Grid>
                </Grid>
            </React.Fragment>
        );
    }
}

export default Dashboard;