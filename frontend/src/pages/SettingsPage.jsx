// frontend/src/pages/SettingsPage.jsx
import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { User, CheckCircle2, AlertTriangle, Building2, Save, ShieldCheck } from 'lucide-react';
import styles from './SettingsPage.module.css';
import Button from '../components/ui/Button';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const SettingsPage = () => {
    const { user } = useContext(AuthContext);
    
    const [fullName, setFullName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        if (user) {
            setFullName(user.fullName || '');
        }
    }, [user]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        
        if (newPassword || currentPassword) {
            if (!currentPassword) return showToast('Lütfen mevcut şifrenizi girin.', 'error');
            if (newPassword.length < 6) return showToast('Yeni şifre en az 6 karakter olmalıdır.', 'error');
            if (newPassword !== confirmPassword) return showToast('Yeni şifreler eşleşmiyor.', 'error');
        }

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('user_token');
            const payload = { fullName };
            
            if (currentPassword && newPassword) {
                payload.currentPassword = currentPassword;
                payload.newPassword = newPassword;
            }

            await axios.put(`${API_BASE_URL}/auth/update-profile`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            showToast('Bilgileriniz başarıyla güncellendi.', 'success');
            
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

        } catch (error) {
            showToast(error.response?.data?.message || 'Güncelleme başarısız oldu.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.root}>
            
            {toast.show && (
                <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />} 
                    {toast.message}
                </div>
            )}

            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>
                    Hesap Ayarları
                </h1>
                <p className={styles.pageSubtitle}>
                    Kişisel bilgilerinizi ve güvenlik ayarlarınızı yönetin.
                </p>
            </div>

            <div className={styles.content}>
                
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardIconBox}>
                            <Building2 size={20} />
                        </div>
                        <div>
                            <h2 className={styles.cardTitle}>Çalışma Alanı Bilgileri</h2>
                            <p className={styles.cardDesc}>Sisteme kayıtlı olduğunuz detaylar.</p>
                        </div>
                    </div>
                    <div className={styles.orgInfo}>
                        <div className={styles.infoGroup}>
                            <span className={styles.label}>Kayıtlı E-posta Adresi</span>
                            <span className={styles.value}>{user?.email}</span>
                        </div>
                        
                    </div>
                </div>

                <form onSubmit={handleUpdateProfile} className={styles.card}>
                    
                    <div className={styles.section}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIconBox}>
                                <User size={20} />
                            </div>
                            <div>
                                <h2 className={styles.cardTitle}>Kişisel Bilgiler</h2>
                                <p className={styles.cardDesc}>Belgelerde ve panellerde görünecek adınız.</p>
                            </div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.field}>
                                <label className={styles.formLabel}>Ad Soyad</label>
                                <input 
                                    type="text" 
                                    value={fullName} 
                                    onChange={e => setFullName(e.target.value)}
                                    required
                                    className={styles.input}
                                    placeholder="Tam adınızı girin"
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.divider} />

                    <div className={styles.section}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIconBox}>
                                <ShieldCheck size={20} />
                            </div>
                            <div className={styles.headerTitleRow}>
                                <div>
                                    <h2 className={styles.cardTitle}>Güvenlik & Şifre</h2>
                                    <p className={styles.cardDesc}>Hesabınızın şifresini değiştirmek isterseniz bu alanı kullanın.</p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.passwordFields}>
                            <div className={styles.field}>
                                <label className={styles.formLabel}>Mevcut Şifreniz</label>
                                <input 
                                    type="password" 
                                    value={currentPassword} 
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.passwordRow}>
                                <div className={styles.field}>
                                    <label className={styles.formLabel}>Yeni Şifre</label>
                                    <input 
                                        type="password" 
                                        value={newPassword} 
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="En az 6 karakter"
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.formLabel}>Yeni Şifre (Tekrar)</label>
                                    <input 
                                        type="password" 
                                        value={confirmPassword} 
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="Yeni şifrenizi doğrulayın"
                                        className={styles.input}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.formFooter}>
                        <Button 
                            type="submit" 
                            variant="primary"
                            size="lg"
                            disabled={!fullName.trim()} 
                            isLoading={isSubmitting}
                            leftIcon={!isSubmitting && <Save size={16} />}
                        >
                            {isSubmitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default SettingsPage;