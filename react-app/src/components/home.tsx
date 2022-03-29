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
        <ProductHero/>
      </React.Fragment>
    );
  }
}

export default Home;
