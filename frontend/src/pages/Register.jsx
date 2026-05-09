// frontend/src/pages/Register.jsx
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { AlertCircle, Loader2 } from 'lucide-react';
import { getUserFriendlyMessage } from '../utils/getUserFriendlyMessage';
import styles from './Auth.module.css';
import Button from '../components/ui/Button';

const Register = () => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(formData.fullName, formData.email, formData.password);
      navigate('/panel', { replace: true });
    } catch (err) {
      setError(getUserFriendlyMessage(err.response?.data, 'register.error', t));
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.authContainer}>
        <Loader2 size={32} className={styles.spinner} color="#2563eb" />
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h2 className={styles.authTitle}>{t('register.title')}</h2>
        <p className={styles.authSubtitle}>{t('register.subtitle')}</p>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('register.fullName')}</label>
            <input
              type="text"
              name="fullName"
              className={styles.input}
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder={t('register.fullNamePlaceholder')}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t('register.email')}</label>
            <input
              type="email"
              name="email"
              className={styles.input}
              required
              value={formData.email}
              onChange={handleChange}
              placeholder={t('register.emailPlaceholder')}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t('register.password')}</label>
            <input
              type="password"
              name="password"
              className={styles.input}
              required
              minLength={8}
              pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
              title={t('register.passwordHint')}
              value={formData.password}
              onChange={handleChange}
              placeholder={t('register.passwordPlaceholder')}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
          >
            {isLoading ? t('register.creating') : t('register.submit')}
          </Button>
        </form>

        <p className={styles.switchText}>
          {t('register.haveAccount')}{' '}
          <Link to="/giris-yap" className={styles.switchLink}>{t('register.signIn')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;