import * as React from "react";
import {  Button, Typography, Grid  } from "@mui/material"
import AppAppBar from "./appAppBar";
import ProductHero from "./ProductHero";

export interface HomeProps {}

export interface HomeState {}

class Home extends React.Component<HomeProps, HomeState> {
  //state = { :  }
  render() {
    return (
      <React.Fragment>
        <AppAppBar />
        <Typography variant="h2">
            Welcome to licode!
        </Typography>
        <Grid container direction="column" spacing={2}>
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
            <Grid item>
                <Button variant="contained" href="/victory">
                    Victory
                </Button>
            </Grid>
            <Grid item>
                <Button variant="contained" href="/defeat">
                    Defeat
                </Button>
            </Grid>
        </Grid>
        <ProductHero/>
      </React.Fragment>
    );
  }
}

export default Home;