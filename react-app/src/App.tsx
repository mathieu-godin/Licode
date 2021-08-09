import React from "react";
import http from "./services/httpService";
import { Route, Switch } from "react-router-dom";
import Home from "./components/home";
import SigninForm from "./components/signinForm";
import RegisterForm from "./components/registerForm";

function App() {
    return (
        <React.Fragment>
            <main className="container">
                <Switch>
                    <Route path="/register" component={RegisterForm} />
                    <Route path="/signin" component={SigninForm} />
                    <Route path="/" component={Home} />
                </Switch>
            </main>
        </React.Fragment>
    );
}

export default App;
