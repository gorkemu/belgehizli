// frontend/src/pages/ForgotPassword.jsx
import React, { useState, useContext } from 'react';
import { Link, useParams } from 'react-router-dom'; 
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { getUserFriendlyMessage } from '../utils/getUserFriendlyMessage';
import { SEOHead } from '../components/SEOHead'; 
import styles from './Auth.module.css';
import Button from '../components/ui/Button';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const { lang } = useParams(); 
  const currentLang = lang || 'tr';

  const loginRoute = currentLang === 'tr' ? 'giris-yap' : 'login';

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
      <SEOHead titleKey="forgotPassword.title" descKey="forgotPassword.subtitle" />

      <div className={styles.authCard}>
        <h2 className={styles.authTitle}>{t('forgotPassword.title')}</h2>
        <p className={styles.authSubtitle}>{t('forgotPassword.subtitle')}</p>

        {status.message && (
          <div className={status.type === 'success' ? styles.successBox : styles.errorBox} style={status.type === 'success' ? { backgroundColor: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0', padding: '14px 18px', borderRadius: '12px', fontSize: '0.9rem', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' } : {}}>
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
          <Link to={`/${currentLang}/${loginRoute}`} className={styles.switchLink}>{t('forgotPassword.signIn')}</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;