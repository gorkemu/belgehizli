// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('user_token');
            if (token) {
                try {
                    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser(response.data);
                } catch (error) {
                    console.error("Otomatik giriş başarısız:", error);
                    localStorage.removeItem('user_token');
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, [API_BASE_URL]);

    const login = async (email, password) => {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
        localStorage.setItem('user_token', response.data.token);
        setUser(response.data);
        return response.data;
    };

    const register = async (fullName, email, password) => {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, {
            fullName,
            email,
            password
        });
        localStorage.setItem('user_token', response.data.token);
        setUser(response.data);
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('user_token');
        setUser(null);
        window.location.href = '/giris-yap';
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};