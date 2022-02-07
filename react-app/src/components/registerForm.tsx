import * as React from "react";
import Form from "./common/form";

class RegisterForm extends Form {
    state = {
        data: { username: "", password: "", name: "" },
        errors: {},
    };

    doSubmit = () => {
        // Call the server
        console.log("Submitted");
    };

    render() {
        return (
            <div>
                <h1>Register</h1>
                <form onSubmit={this.handleSubmit}>
                    {this.renderInput("email", "Email")}
                    {this.renderInput("username", "Username")}
                    {this.renderInput("password", "Password")}
                    {this.renderInput("name", "Name")}
                    {this.renderButton("Register")}
                </form>
            </div>
        );
    }
}

export default RegisterForm;