// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

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
                    const response = await api.get(`/auth/me`, {
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
        const response = await api.post(`/auth/login`, { email, password });
        
        // Eğer MFA gerekmiyorsa (eski usül direkt girişse) token'ı kaydet
        if (!response.data.requiresMfa) {
            localStorage.setItem('user_token', response.data.token);
            setUser(response.data);
        }
        
        // Her halükarda veriyi Login.jsx'e döndür (requiresMfa bayrağını okuması için)
        return response.data;
    };

    const verifyMfa = async (tempToken, otp) => {
        const response = await api.post(`/auth/verify-mfa`, { tempToken, otp });
        
        // Doğrulama başarılıysa GERÇEK token'ı kaydet ve kullanıcıyı içeri al
        localStorage.setItem('user_token', response.data.token);
        setUser(response.data);
        return response.data;
    };

    const register = async (fullName, email, password) => {
        const response = await api.post(`/auth/register`, {
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

    const forgotPassword = async (email) => {
        const response = await api.post(`/auth/forgot-password`, { email });
        return response.data;
    };

    const resetPassword = async (token, newPassword) => {
        const response = await api.post(`/auth/set-password`, { token, newPassword });
        return response.data;
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, forgotPassword, resetPassword, verifyMfa }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};