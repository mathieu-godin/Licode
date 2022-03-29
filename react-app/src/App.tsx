import React, { useState, useCallback } from "react";
import http from "./services/httpService";
import { Route, Routes } from "react-router-dom";
import Home from "./components/home";
import LoginForm from "./components/loginForm";
import RegisterForm from "./components/registerForm";
import CodingEditorWaiter from "./components/codingEditorWaiter";
import Dashboard from "./components/dashboard";
import DashboardRedirect from "./components/dashboardRedirect";
import HomeRedirect from "./components/homeRedirect";

function App() {
    const [token, setToken] = useState(localStorage.getItem('token') === '1');
    const getToken = useCallback(() => {
        setToken(true);
        localStorage.setItem('token', '1');
    }, []);
    const giveToken = useCallback(() => {
        setToken(false);
        localStorage.setItem('token', '0');
    }, []);

    if (!token) {
        return (
            <React.Fragment>
                <main className="container">
                    <Routes>
                        <Route path="/dashboard" element={<HomeRedirect />} />
                        <Route path="/editor" element={<CodingEditorWaiter />} />
                        <Route path="/register" element={<RegisterForm setToken={getToken} />} />
                        <Route path="/signin" element={<LoginForm setToken={getToken} />} />
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
                <Route path="/dashboard" element={<Dashboard setToken={giveToken} />} />
                        <Route path="/editor" element={<CodingEditorWaiter />} />
                        <Route path="/register" element={<DashboardRedirect />} />
                        <Route path="/signin" element={<DashboardRedirect />} />
                        <Route path="/" element={<DashboardRedirect />} />
                </Routes>
            </main>
        </React.Fragment>
    );
}

export default App;