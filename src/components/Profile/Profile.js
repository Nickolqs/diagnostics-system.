import React, { useState, useEffect } from "react";
import axios from "axios";
import '../../styles/global.css';

const Profile = () => {
    const [profile, setProfile] = useState({
        ID: null, // Використовується для зберігання унікального ID користувача
        name: "",
        login: "",
        role: "Engineer",
    });

    const [newUser, setNewUser] = useState({
        name: "",
        login: "",
        password: "",
        role: "Engineer",
    });

    const [message, setMessage] = useState("");
    const [addMessage, setAddMessage] = useState("");

    // Завантаження профілю користувача
    useEffect(() => {
        const userId = localStorage.getItem("user_id");
        if (!userId) {
            setMessage("User ID not found. Please log in again.");
            return;
        }
    
        axios
            .get("/profile", {
                headers: { Authorization: userId },
            })
            .then((response) => {
                if (response.data) {
                    setProfile({
                        ID: response.data.ID, // Встановлюємо ID з відповіді
                        name: response.data.name,
                        login: response.data.login,
                        role: response.data.role,
                    });
                }
            })
            .catch((error) => {
                console.error("Error fetching profile:", error);
                setMessage("Failed to load profile information.");
            });
    }, []);
    
    // Оновлення профілю
    const updateProfile = (e) => {
        e.preventDefault();
    
        if (!profile.ID) {
            setMessage("User ID not found. Please log in again.");
            return;
        }
    
        axios
            .post("/profile/update", profile) // Передаємо весь об'єкт профілю, включаючи ID
            .then(() => setMessage("Profile updated successfully."))
            .catch((error) => {
                console.error("Error updating profile:", error);
                setMessage("Failed to update profile.");
            });
    };
    

    // Додавання нового користувача
    const addUser = (e) => {
        e.preventDefault();

        if (!newUser.name || !newUser.login || !newUser.password) {
            setAddMessage("All fields are required.");
            return;
        }

        axios
            .post("/users/add", newUser)
            .then(() => {
                setAddMessage("User added successfully.");
                setNewUser({
                    name: "",
                    login: "",
                    password: "",
                    role: "Engineer",
                });
            })
            .catch((error) => {
                console.error("Error adding user:", error);
                setAddMessage("Failed to add user.");
            });
    };

    return (
        <div>
            <div className="form-section">
                <h2>Profile</h2>
                <form onSubmit={updateProfile}>
                    <label>Name:</label>
                    <input
                        type="text"
                        name="name"
                        value={profile.name}
                        onChange={(e) =>
                            setProfile({ ...profile, [e.target.name]: e.target.value })
                        }
                        required
                    />
                    <label>Login:</label>
                    <input
                        type="text"
                        name="login"
                        value={profile.login}
                        onChange={(e) =>
                            setProfile({ ...profile, [e.target.name]: e.target.value })
                        }
                        required
                    />
                    <label>Role:</label>
                    <select
                        name="role"
                        value={profile.role}
                        onChange={(e) =>
                            setProfile({ ...profile, [e.target.name]: e.target.value })
                        }
                    >
                        <option value="Engineer">Engineer</option>
                        <option value="Diagnostic">Diagnostic</option>
                        <option value="Repairer">Repairer</option>
                    </select>
                    <button type="submit">Update Profile</button>
                </form>
                {message && <p>{message}</p>}
            </div>

            <div className="form-section">
                <h2>Add New User</h2>
                <form onSubmit={addUser}>
                    <label>Name:</label>
                    <input
                        type="text"
                        name="name"
                        value={newUser.name}
                        onChange={(e) =>
                            setNewUser({ ...newUser, [e.target.name]: e.target.value })
                        }
                        required
                    />
                    <label>Login:</label>
                    <input
                        type="text"
                        name="login"
                        value={newUser.login}
                        onChange={(e) =>
                            setNewUser({ ...newUser, [e.target.name]: e.target.value })
                        }
                        required
                    />
                    <label>Password:</label>
                    <input
                        type="password"
                        name="password"
                        value={newUser.password}
                        onChange={(e) =>
                            setNewUser({ ...newUser, [e.target.name]: e.target.value })
                        }
                        required
                    />
                    <label>Role:</label>
                    <select
                        name="role"
                        value={newUser.role}
                        onChange={(e) =>
                            setNewUser({ ...newUser, [e.target.name]: e.target.value })
                        }
                    >
                        <option value="Engineer">Engineer</option>
                        <option value="Diagnostic">Diagnostic</option>
                        <option value="Repairer">Repairer</option>
                    </select>
                    <button type="submit">Add User</button>
                </form>
                {addMessage && <p>{addMessage}</p>}
            </div>
        </div>
    );
};

export default Profile;
