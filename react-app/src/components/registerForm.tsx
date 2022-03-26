import * as React from "react";
import Form from "./common/form";

interface User {
    email: { value: string };
    username: { value: string };
    password: { value: string };
}

let userVar: User = {
    email: { value: 'AAA' },
    username: { value: 'BBB' },
    password: { value: 'CCC' },
}

class RegisterForm extends Form {
    handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        let user: User = {
            email: { value: '' },
            username: { value: '' },
            password: { value: '' },
        }
        user.email.value = (e.target as typeof e.target & User).email.value;
        user.username.value = (e.target as typeof e.target & User).username.value;
        user.password.value = (e.target as typeof e.target & User).password.value;
        try {
            let res = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(user),
            })
                .then(response => response.json())
                .then(data => console.log(data.email.value));
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
            </div>
        );
    }
}

export default RegisterForm;