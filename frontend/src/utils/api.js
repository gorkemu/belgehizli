// frontend/src/utils/api.js
import axios from 'axios';
import i18n from '../i18n'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Request Interceptor: Her istek çıkmadan hemen önce araya girer
api.interceptors.request.use(
    (config) => {
        // 1. JWT Token'ı otomatik ekle
        const token = localStorage.getItem('user_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // 2. Seçili Dili (TR veya EN) otomatik ekle 
        config.headers['Accept-Language'] = i18n.language || 'tr';

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;