import React from "react";
import { Route, Switch } from "react-router-dom";
import Home from "./components/home";
import SigninForm from "./components/signinForm";
import SignupForm from "./components/signupForm";

function App() {
  return (
    <React.Fragment>
      <main className="container">
        <Switch>
          <Route path="/signup" component={SignupForm} />
          <Route path="/signin" component={SigninForm} />
          <Route path="/" component={Home} />
        </Switch>
      </main>
    </React.Fragment>
  );
}

export default App;
