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
        <Grid container spacing={2}>
            <Grid item xs={6}>
                <Button variant="contained">
                    <Link to="/signin">Sign in</Link>
                </Button>
            </Grid>
            <Grid item xs={8}>
                <Button variant="contained">
                    <Link to="/register">Sign in</Link>
                </Button>
            </Grid>
            <Grid item xs={6}>
                <Button variant="contained">
                    <Link to="/editor">Sign in</Link>
                </Button>
            </Grid>
        </Grid>
      </React.Fragment>
    );
  }
}

export default Home;