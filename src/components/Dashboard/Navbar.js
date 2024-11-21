import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/global.css";

const Navbar = () => {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout(); // Очищуємо стан авторизації
        navigate("/"); // Повертаємо користувача на сторінку логіну
    };

    return (
        <nav className="navbar">
            <ul className="navbar-list">
                {isAuthenticated ? (
                    <>
                        <li>
                            <Link to="/diagnose">Diagnose</Link>
                        </li>
                        <li>
                            <Link to="/history">History</Link>
                        </li>
                        <li>
                            <Link to="/retrain">Retrain</Link>
                        </li>
                        <li>
                            <Link to="/profile">Profile</Link>
                        </li>
                        <li>
                            <button
                                onClick={handleLogout}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "0",
                                    margin: "0"
                                }}
                            >
                                Logout
                            </button>
                        </li>
                    </>
                ) : (
                    <>
                        <li>
                            <Link to="/">Login</Link>
                        </li>
                    </>
                )}
            </ul>
        </nav>
    );
};

export default Navbar;
