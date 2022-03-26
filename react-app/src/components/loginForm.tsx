import * as React from "react";
import Form from "./common/form";

interface User {
    email: { value: string };
    username: { value: string };
    password: { value: string };
}

class LoginForm extends Form {
    handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        let user: User = {
            email: { value: '' },
            username: { value: '' },
            password: { value: '' },
        }
        user.email.value = (e.target as typeof e.target & User).email.value;
        user.password.value = (e.target as typeof e.target & User).password.value;
        try {
            let res = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(user),
            })
                .then(response => response.json())
                .then(data => console.log(data));
        } catch (err) {
            console.log(err);
        } 
    };

    render() {
        return (
            <div>
                <h1>Login</h1>
                <form onSubmit={this.handleSubmit}>
                    {this.renderInput("email", "Email or Username")}
                    {this.renderInput("password", "Password")}
                    {this.renderButton("Login")}
                </form>
            </div>
        );
    }
}

export default LoginForm;