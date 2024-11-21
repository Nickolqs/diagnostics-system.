import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/global.css';  // Оновлено шлях

function Index() {
    return <div>Welcome to the Diagnostics System!</div>;
}

const Navbar = () => {
    return (
        <nav className="navbar">
            <ul className="navbar-list">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/history">History</Link></li>
                <li><Link to="/retrain">Retrain</Link></li>
                <li><Link to="/profile">Profile</Link></li>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/register">Register</Link></li>
            </ul>
        </nav>
    );
};
export default Navbar;
