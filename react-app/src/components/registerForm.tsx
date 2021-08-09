import * as React from "react";
import Joi from "joi-browser";
import Form from "./common/form";

export interface RegisterFormProps {}

export interface RegisterFormState {}

class RegisterForm extends React.Component<
    RegisterFormProps,
    RegisterFormState
> {
    state = {
        data: { username: "", password: "", name: "" },
        errors: {},
    };

    schema = {
        username: Joi.string().required().email().label("Username"),
        password: Joi.string().required().min(5).label("Password"),
        name: Joi.string().required().label("Name"),
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
                    {this.renderInput("username", "Username")}
                    {this.renderInput("password", "Password", "password")}
                    {this.renderInput("name", "Name")}
                    {this.renderButton("Register")}
                </form>
            </div>
        );
    }
}

export default RegisterForm;
