// admin-panel-frontend/src/pages/ChangePasswordPage.jsx
import React, { useState } from 'react';
import { Title, SimpleForm, TextInput, SaveButton, useNotify, HttpError } from 'react-admin';
import { Card, CardContent } from '@mui/material';
import axios from 'axios'; 

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const ChangePasswordPage = () => {
    const notify = useNotify();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values) => {
        setLoading(true);
        const { currentPassword, newPassword, confirmPassword } = values;

        if (newPassword !== confirmPassword) {
            notify('Yeni şifreler eşleşmiyor.', { type: 'warning' });
            setLoading(false);
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            notify('Yeni şifre en az 6 karakter olmalıdır.', { type: 'warning' });
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                notify('Oturum bulunamadı, lütfen tekrar giriş yapın.', { type: 'error' });
                setLoading(false);
                return;
            }

            await axios.post(
                `${API_URL}/admin/change-password`,
                { currentPassword, newPassword, confirmPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            notify('Şifre başarıyla değiştirildi.', { type: 'success' });

        } catch (error) {
            console.error("Error changing password:", error);
            const message = error.response?.data?.message || 'Şifre değiştirilirken bir hata oluştu.';
            notify(message, { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card sx={{ marginTop: 2, maxWidth: 600, margin: 'auto' }}>
            <Title title="Şifre Değiştir" />
            <CardContent>
                <SimpleForm onSubmit={handleSubmit} toolbar={null}>
                    <TextInput source="currentPassword" type="password" label="Mevcut Şifre" validate={required()} fullWidth />
                    <TextInput source="newPassword" type="password" label="Yeni Şifre" validate={required()} fullWidth />
                    <TextInput source="confirmPassword" type="password" label="Yeni Şifre (Tekrar)" validate={required()} fullWidth />
                    <SaveButton label="Şifreyi Değiştir" saving={loading} disabled={loading} sx={{ marginTop: 2}} />
                </SimpleForm>
            </CardContent>
        </Card>
    );
};

const required = (message = 'Bu alan zorunludur') => value => value ? undefined : message;

export default ChangePasswordPage;