import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { login } from "../../api/api";
import Cookies from "js-cookie";
import "../../styles/global.css";

function Login() {
    const [credentials, setCredentials] = useState({ login: "", password: "" });
    const { isAuthenticated, login: loginUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/diagnose"); // Якщо користувач авторизований, перенаправити на діагностику
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userData = await login(credentials);
            console.log("User data from login:", userData); // Логування
    
            localStorage.setItem("user_id", userData.user.ID); // Збереження ID в localStorage
            localStorage.setItem("pib", userData.user.PIB); // Збереження PIB в localStorage
            localStorage.setItem("login", userData.user.Login); // Збереження логіна
    
            loginUser(userData.user); // Збереження користувача в контексті
            navigate("/diagnose"); // Перехід до сторінки "Діагностика"
        } catch (error) {
            console.error("Error during login:", error); // Логування помилок
            alert(error.error || "Login failed. Please check your credentials.");
        }
    };
    
    

    return (
        <div className="form-section">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Login"
                    value={credentials.login}
                    onChange={(e) => setCredentials({ ...credentials, login: e.target.value })}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    required
                />
                <button type="submit">Login</button>
            </form>
        </div>
    );
}

export default Login;
