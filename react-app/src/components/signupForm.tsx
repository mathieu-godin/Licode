import * as React from "react";
import { useAuth0 } from "@auth0/auth0-react";

export interface SignUpFormProps {}

export interface SignUpFormState {}

class SignUpForm extends React.Component<SignUpFormProps, SignUpFormState> {
  //state = { :  }
  handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // var webAuth = new useAuth0.WebAuth({
    //   domain: process.env.REACT_APP_AUTH0_DOMAIN,
    //   clientId: "PyykIoYBm39EUgeLnJ1WBuHhSg94EU0z"
    // });
    // Call the server
    // Save the changes
    // Redirect the user to a different page
    //console.log("Submitted");
  };
  render() {
    return (
      <div>
        <h1>Sign up</h1>
        <form onSubmit={this.handleSubmit}>
          <div>
            <input id="email" type="text" placeholder="Email Address Test" />
          </div>
          <div>
            <input id="username" type="text" placeholder="Username" />
          </div>
          <div>
            <input id="password" type="text" placeholder="Password" />
          </div>
          <div>
            <input
              id="confirm-passord"
              type="text"
              placeholder="Confirm Password"
            />
          </div>
          <input type="submit" value="Sign up"/>
        </form>
      </div>
    );
  }
}

export default SignUpForm;
