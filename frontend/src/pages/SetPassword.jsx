// frontend/src/pages/SetPassword.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { getUserFriendlyMessage } from '../utils/getUserFriendlyMessage';
import styles from './Auth.module.css';
import Button from '../components/ui/Button';

const SetPassword = () => {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  const { resetPassword } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus({
        type: 'error',
        message: t('setPassword.invalidToken')
      });
    }
  }, [token, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    setStatus({ type: '', message: '' });
    setIsLoading(true);

    try {
      const response = await resetPassword(token, newPassword);
      const successMessage = getUserFriendlyMessage(
        response?.data || response,
        'setPassword.successFallback',
        t
      );
      setStatus({ type: 'success', message: successMessage });
      
      // 3 saniye sonra login'e yönlendir
      setTimeout(() => {
        navigate('/giris-yap');
      }, 3000);
    } catch (err) {
      const errorMessage = getUserFriendlyMessage(
        err.response?.data,
        'setPassword.errorFallback',
        t
      );
      setStatus({ type: 'error', message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h2 className={styles.authTitle}>{t('setPassword.title')}</h2>
        <p className={styles.authSubtitle}>{t('setPassword.subtitle')}</p>

        {status.message && (
          <div className={status.type === 'success' ? styles.successBox : styles.errorBox} style={status.type === 'success' ? { backgroundColor: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0', padding: '14px 18px', borderRadius: '12px', fontSize: '0.9rem', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' } : {}}>
            {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />} 
            {status.message}
          </div>
        )}

        {!status.message || status.type === 'error' ? (
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>{t('setPassword.newPassword')}</label>
              <input
                type="password"
                className={styles.input}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder={t('setPassword.passwordPlaceholder')}
                disabled={!token}
              />
            </div>
            
            <Button type="submit" variant="primary" size="lg" fullWidth disabled={isLoading || !token}>
              {isLoading ? t('setPassword.saving') : t('setPassword.save')}
            </Button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p style={{ color: '#57534e', fontSize: '0.95rem' }}>{t('setPassword.redirecting')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetPassword;