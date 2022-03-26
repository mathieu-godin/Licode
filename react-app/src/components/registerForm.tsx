import * as React from "react";
import Form from "./common/form";

interface HelloWorld {
    text: string;
    email: { value: string };
}

let helloWorldVar: HelloWorld = { text: 'ABCDEFG', email: { value: 'aaa' } };

class RegisterForm extends Form {
    state = {
        data: { username: "", password: "", name: "" },
        errors: {},
    };

    handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        helloWorldVar.text = (e.target as typeof e.target & HelloWorld).email.value;
        try {
            let res = await fetch('/api/post-hello-world', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(helloWorldVar),
            })
                .then(response => response.json())
                .then(data => console.log(data.text));
        } catch (err) {
            console.log(err);
        } 
    };

    handleHelloWorldGet = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            let res = await fetch('/api/hello-world')
                .then(response => response.json())
                .then(data => console.log(data.text));
        } catch (err) {
            console.log(err);
        } 
    };

    render() {
        return (
            <div>
                <h1>Register</h1>
                <form onSubmit={this.handleSubmit}>
                    {this.renderInput("email", "Email")}
                    {this.renderInput("username", "Username")}
                    {this.renderInput("password", "Password")}
                    {this.renderButton("Register")}
                </form>
                <h1>Hello World GET</h1>
                <form onSubmit={this.handleHelloWorldGet}>
                    {this.renderInput("email", "Email")}
                    {this.renderInput("username", "Username")}
                    {this.renderInput("password", "Password")}
                    {this.renderButton("Register")}
                </form>
            </div>
        );
    }
}

export default RegisterForm;