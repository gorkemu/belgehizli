// frontend/src/pages/UserTemplateCreate.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TemplateBuilder from '../features/TemplateBuilder';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const UserTemplateCreate = () => {
    const navigate = useNavigate();

    const handleSave = async (payload) => {
        const token = localStorage.getItem('user_token');
        await axios.put(`${API_BASE_URL}/user-templates/${id}`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
    };

    return <TemplateBuilder onSave={handleSave} isUser={true} />;
};

export default UserTemplateCreate;