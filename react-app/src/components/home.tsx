import * as React from "react";
import AuthButtons from "./auth-buttons.js";

export interface HomeProps {}

export interface HomeState {}

class Home extends React.Component<HomeProps, HomeState> {
  //state = { :  }
  render() {
    return (
      <>
        <h1>licode</h1>
        <h2>Welcome to licode!</h2>
        <AuthButtons/>
      </>
    );
  }
}

export default Home;
