import * as React from "react";
import Form from "./common/form";

export interface LoginFormProps {}

export interface LoginFormState {}

class SigninForm extends Form {
    //state = { :  }
    render() {
        return (
            <div>
                <h1>Login</h1>
                <form>
                    {this.renderInput("email_username", "Email or Username")}
                    {this.renderInput("password", "Password")}
                    {this.renderButton("Login")}
                </form>
            </div>
        );
    }
}

export default SigninForm;