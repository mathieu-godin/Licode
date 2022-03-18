import * as React from "react";
import { Link } from "react-router-dom";
import {  Button, Typography, Grid  } from "@mui/material"

export interface HomeProps {}

export interface HomeState {}

class Home extends React.Component<HomeProps, HomeState> {
  //state = { :  }
  render() {
    return (
      <React.Fragment>
        <Typography variant="h1">
            licode
        </Typography>
        <Typography variant="h2">
            Welcome to licode!
        </Typography>
        <Grid container direction="column" spacing={2}>
            <Grid item>
                <Button variant="contained" href="/signin">
                    Sign in
                </Button>
            </Grid>
            <Grid item>
                <Button variant="contained" href="/register">
                    Register
                </Button>
            </Grid>
            <Grid item>
                <Button variant="contained" href="/editor">
                    Code Editor
                </Button>
            </Grid>
            <Grid item>
                <Button variant="contained" href="/dashboard">
                    Dashboard
                </Button>
            </Grid>
        </Grid>
      </React.Fragment>
    );
  }
}

export default Home;