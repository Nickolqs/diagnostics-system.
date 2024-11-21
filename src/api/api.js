import axios from "axios";

const API_URL = "http://localhost:5000"; // Адреса сервера

// Авторизація
export const login = async (credentials) => {
    try {
        const response = await axios.post(`${API_URL}/login`, credentials); // Використання правильного маршруту
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: "Unknown error occurred" };
    }
};

// Реєстрація
export const register = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/register`, userData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: "Unknown error occurred" };
    }
};

// Завантаження зображення та діагностика
export const diagnoseImage = async (formData) => {
    try {
        const response = await axios.post(`${API_URL}/diagnose`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: "Unknown error occurred" };
    }
};

// Отримання історії
export const fetchHistory = async (userId) => {
    try {
        const response = await axios.get(`${API_URL}/history`, { params: { user_id: userId } });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: "Unknown error occurred" };
    }
};
