import * as React from "react";

export interface SignUpFormProps {}

export interface SignUpFormState {}

class SignUpForm extends React.Component<SignUpFormProps, SignUpFormState> {
  //state = { :  }
  handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Call the server
    // Save the changes
    // Redirect the user to a different page
    console.log("Submitted");
  };
  render() {
    return (
      <div>
        <h1>Sign up</h1>
        <form onSubmit={this.handleSubmit}>
          <div>
            <input id="email" type="text" placeholder="Email Address" />
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
          <button>Sign up</button>
        </form>
      </div>
    );
  }
}

export default SignUpForm;
