// frontend/src/pages/UserTemplateEdit.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { TemplateBuilder } from '../components/TemplateBuilder';
import { Loader2, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const UserTemplateEdit = () => {
    const { id } = useParams();

    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const token = localStorage.getItem('user_token');
                const response = await axios.get(`${API_BASE_URL}/user-templates/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const data = response.data;
                data.fields = data.fields.map(f => ({
                    ...f,
                    options: Array.isArray(f.options) ? f.options : []
                }));

                setTemplate(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Şablon yüklenemedi.');
            } finally {
                setLoading(false);
            }
        };
        fetchTemplate();
    }, [id]);

    const handleSave = async (payload) => {
        const token = localStorage.getItem('user_token');

        await axios.put(`${API_BASE_URL}/user-templates/${id}`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const projectId = payload.projectId || payload.project;
        if (projectId) {
            await axios.put(`${API_BASE_URL}/projects/${projectId}`, { name: payload.name }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', color: '#57534e' }}>
            <Loader2 size={36} className="spinner" style={{ animation: 'spin 1s linear infinite', marginBottom: 12, color: '#a8a29e' }} />
            <p>Şablon yükleniyor...</p>
        </div>
    );

    if (error) return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', color: '#dc2626' }}>
            <AlertCircle size={36} style={{ marginBottom: 12 }} />
            <p>{error}</p>
        </div>
    );

    return <TemplateBuilder initialData={template} onSave={handleSave} isUser={true} />;
};

export default UserTemplateEdit;