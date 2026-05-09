// frontend/src/pages/ForgotPassword.jsx
import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { getUserFriendlyMessage } from '../utils/getUserFriendlyMessage';
import styles from './Auth.module.css';
import Button from '../components/ui/Button';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { forgotPassword } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setIsLoading(true);

    try {
      const response = await forgotPassword(email);
      const successMessage = getUserFriendlyMessage(
        response?.data || response,
        'forgotPassword.successFallback',
        t
      );
      setStatus({ type: 'success', message: successMessage });
      setEmail('');
    } catch (err) {
      const errorMessage = getUserFriendlyMessage(
        err.response?.data,
        'forgotPassword.errorFallback',
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
        <h2 className={styles.authTitle}>{t('forgotPassword.title')}</h2>
        <p className={styles.authSubtitle}>{t('forgotPassword.subtitle')}</p>

        {status.message && (
          <div className={status.type === 'success' ? styles.successBox : styles.errorBox}>
            {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('forgotPassword.email')}</label>
            <input
              type="email"
              className={styles.input}
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('forgotPassword.emailPlaceholder')}
            />
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={isLoading || status.type === 'success'}>
            {isLoading ? t('forgotPassword.sending') : t('forgotPassword.submit')}
          </Button>
        </form>

        <p className={styles.switchText}>
          {t('forgotPassword.remembered')}{' '}
          <Link to="/giris-yap" className={styles.switchLink}>{t('forgotPassword.signIn')}</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;