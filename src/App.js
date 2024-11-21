import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import './styles/global.css';
import Login from "./components/Auth/Login";
import Diagnose from "./components/Dashboard/Diagnose";
import History from "./components/Dashboard/History";
import Retrain from "./components/Dashboard/Retrain";
import Profile from "./components/Profile/Profile";
import Navbar from "./components/Dashboard/Navbar";

function ProtectedRoute({ element }) {
    const { isAuthenticated } = useAuth();

    // Якщо користувач не авторизований, перенаправляємо його на "/"
    return isAuthenticated ? element : <Navigate to="/" />;
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <div>
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<Login />} /> {/* Сторінка логіну */}
                        <Route path="/diagnose" element={<ProtectedRoute element={<Diagnose />} />} />
                        <Route path="/history" element={<ProtectedRoute element={<History />} />} />
                        <Route path="/retrain" element={<ProtectedRoute element={<Retrain />} />} />
                        <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}


export default App;
