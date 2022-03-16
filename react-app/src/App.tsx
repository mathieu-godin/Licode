import React from "react";
import http from "./services/httpService";
import { Route, Routes } from "react-router-dom";
import Home from "./components/home";
import LoginForm from "./components/loginForm";
import RegisterForm from "./components/registerForm";
import CodingEditor from "./components/codingEditor";

function App() {
    return (
        <React.Fragment>
            <main className="container">
                <Routes>
                    <Route path="/editor" element={<CodingEditor />} />
                    <Route path="/register" element={<RegisterForm />} />
                    <Route path="/signin" element={<LoginForm />} />
                    <Route path="/" element={<Home />} />
                </Routes>
            </main>
        </React.Fragment>
    );
}

export default App;