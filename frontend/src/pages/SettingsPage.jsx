// frontend/src/pages/SettingsPage.jsx
import React, { useState, useContext, useEffect } from 'react';
import api from '../utils/api'; 
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { User, CheckCircle2, AlertTriangle, Building2, Save, ShieldCheck } from 'lucide-react';
import { SEOHead } from '../components/SEOHead'; 
import styles from './SettingsPage.module.css';
import Button from '../components/ui/Button';
import { getUserFriendlyMessage } from '../utils/getUserFriendlyMessage';

const SettingsPage = () => {
    const { t } = useTranslation();
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
            if (!currentPassword) return showToast(t('settings.currentPasswordRequired'), 'error');
            if (newPassword.length < 6) return showToast(t('settings.passwordMinLength'), 'error');
            if (newPassword !== confirmPassword) return showToast(t('settings.passwordsMismatch'), 'error');
        }

        setIsSubmitting(true);

        try {
            const payload = { fullName };

            if (currentPassword && newPassword) {
                payload.currentPassword = currentPassword;
                payload.newPassword = newPassword;
            }

            await api.put(`/auth/update-profile`, payload);

            showToast(t('settings.profileUpdated'), 'success');

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

        } catch (error) { 
            showToast(getUserFriendlyMessage(error.response?.data, 'settings.updateFailed', t), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.root}>
            {/* SEO Etiketleri */}
            <SEOHead titleKey="settings.pageTitle" descKey="settings.pageSubtitle" />

            {toast.show && (
                <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    {toast.message}
                </div>
            )}

            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>
                    {t('settings.pageTitle')}
                </h1>
                <p className={styles.pageSubtitle}>
                    {t('settings.pageSubtitle')}
                </p>
            </div>

            <div className={styles.content}>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardIconBox}>
                            <Building2 size={20} />
                        </div>
                        <div>
                            <h2 className={styles.cardTitle}>{t('settings.workspaceInfo')}</h2>
                            <p className={styles.cardDesc}>{t('settings.workspaceDesc')}</p>
                        </div>
                    </div>
                    <div className={styles.orgInfo}>
                        <div className={styles.infoGroup}>
                            <span className={styles.label}>{t('settings.registeredEmail')}</span>
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
                                <h2 className={styles.cardTitle}>{t('settings.personalInfo')}</h2>
                                <p className={styles.cardDesc}>{t('settings.personalInfoDesc')}</p>
                            </div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.field}>
                                <label className={styles.formLabel}>{t('settings.fullName')}</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    required
                                    className={styles.input}
                                    placeholder={t('settings.fullNamePlaceholder')}
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
                                    <h2 className={styles.cardTitle}>{t('settings.security')}</h2>
                                    <p className={styles.cardDesc}>{t('settings.securityDesc')}</p>
                                </div>
                            </div>
                        </div>

                        <div className={styles.passwordFields}>
                            <div className={styles.field}>
                                <label className={styles.formLabel}>{t('settings.currentPassword')}</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.passwordRow}>
                                <div className={styles.field}>
                                    <label className={styles.formLabel}>{t('settings.newPassword')}</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder={t('settings.newPasswordPlaceholder')}
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.formLabel}>{t('settings.confirmPassword')}</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder={t('settings.confirmPasswordPlaceholder')}
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
                            {isSubmitting ? t('settings.saving') : t('settings.saveChanges')}
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default SettingsPage;