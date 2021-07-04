import * as React from "react";
import { Component } from "react";

export interface SigninProps {}

export interface SigninState {}

class Signin extends React.Component<SigninProps, SigninState> {
  //state = { :  }
  render() {
    //return (  );
    return (
      <div>
        <h1>licode</h1>
        <form>
          <input placeholder="Email Address" />
        </form>
      </div>
    );
  }
}

export default Signin;
