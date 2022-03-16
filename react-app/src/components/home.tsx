import * as React from "react";
import { Link } from "react-router-dom";

export interface HomeProps {}

export interface HomeState {}

class Home extends React.Component<HomeProps, HomeState> {
  //state = { :  }
  render() {
    return (
      <React.Fragment>
        <h1>licode</h1>
        <h2>Welcome to licode!</h2>
        <div>
          <Link to="/signin">Sign in</Link>
        </div>
        <div>
          <Link to="/register">Sign up</Link>
        </div>
        <div>
          <Link to="/editor">Coding Editor</Link>
        </div>
      </React.Fragment>
    );
  }
}

export default Home;