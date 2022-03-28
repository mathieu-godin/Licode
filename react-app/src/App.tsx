import React, { useState, useCallback } from "react";
import http from "./services/httpService";
import { Route, Routes } from "react-router-dom";
import Home from "./components/home";
import LoginForm from "./components/loginForm";
import RegisterForm from "./components/registerForm";
import CodingEditor from "./components/codingEditor";
import Dashboard from "./components/dashboard";

function App() {
    const [token, setToken] = useState(localStorage.getItem('token') === '1');
    const getToken = useCallback(() => {
        setToken(true);
        localStorage.setItem('token', '1');
    }, []);

    if (!token) {
        return (
            <React.Fragment>
                <main className="container">
                    <Routes>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/editor" element={<CodingEditor />} />
                        <Route path="/register" element={<RegisterForm setToken={getToken} />} />
                        <Route path="/signin" element={<LoginForm />} />
                        <Route path="/" element={<Home />} />
                    </Routes>
                </main>
            </React.Fragment>
        );
    }

    return (
        <React.Fragment>
            <main className="container">
                <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/editor" element={<CodingEditor />} />
                        <Route path="/register" element={<Dashboard />} />
                        <Route path="/signin" element={<LoginForm />} />
                        <Route path="/" element={<Dashboard />} />
                </Routes>
            </main>
        </React.Fragment>
    );
}

export default App;