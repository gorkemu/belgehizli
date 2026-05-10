// frontend/src/pages/Login.jsx
import React, { useState, useContext } from 'react';
import { useNavigate, Link, useLocation, useParams } from 'react-router-dom'; 
import { useTranslation, Trans } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { AlertCircle, Loader2, KeyRound, ArrowLeft } from 'lucide-react';
import { getUserFriendlyMessage } from '../utils/getUserFriendlyMessage';
import { SEOHead } from '../components/SEOHead'; 
import styles from './Auth.module.css';
import Button from '../components/ui/Button';

const Login = () => {
  const { t } = useTranslation();
  const { lang } = useParams(); 
  const currentLang = lang || 'tr';

  // Dinamik Rotalar
  const dashboardRoute = currentLang === 'tr' ? 'panel' : 'dashboard';
  const forgotPasswordRoute = currentLang === 'tr' ? 'sifremi-unuttum' : 'forgot-password';
  const registerRoute = currentLang === 'tr' ? 'kayit-ol' : 'register';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, verifyMfa, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await login(email, password);
      if (response.requiresMfa) {
        setRequiresMfa(true);
        setTempToken(response.tempToken);
        setIsLoading(false);
      } else {
        const from = location.state?.from?.pathname || `/${currentLang}/${dashboardRoute}`;
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(getUserFriendlyMessage(err.response?.data, 'login.error', t));
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await verifyMfa(tempToken, otp);
      const from = location.state?.from?.pathname || `/${currentLang}/${dashboardRoute}`;
      navigate(from, { replace: true });
    } catch (err) {
      setError(getUserFriendlyMessage(err.response?.data, 'login.invalidCode', t));
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
      {/* SEO Etiketleri */}
      <SEOHead titleKey="login.welcome" descKey="login.subtitle" />

      <div className={styles.authCard}>
        {requiresMfa ? (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '50%', color: '#2563eb' }}>
                <KeyRound size={32} />
              </div>
            </div>
            <h2 className={styles.authTitle}>{t('login.mfaTitle')}</h2>
            <p className={styles.authSubtitle}>
              <Trans i18nKey="login.mfaInstructions" values={{ email }} components={{ bold: <strong /> }} />
            </p>

            {error && (
              <div className={styles.errorBox}>
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <form onSubmit={handleMfaSubmit}>
              <div className={styles.formGroup}>
                <input
                  type="text"
                  maxLength="6"
                  className={styles.input}
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontWeight: 'bold' }}
                  required
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  autoFocus
                />
              </div>
              <Button type="submit" variant="primary" size="lg" fullWidth disabled={isLoading || otp.length < 6}>
                {isLoading ? t('login.verifying') : t('login.signIn')}
              </Button>
            </form>

            <button
              onClick={() => { setRequiresMfa(false); setOtp(''); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#57534e', fontSize: '0.9rem', width: '100%', marginTop: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} /> {t('login.goBack')}
            </button>
          </div>
        ) : (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <h2 className={styles.authTitle}>{t('login.welcome')}</h2>
            <p className={styles.authSubtitle}>{t('login.subtitle')}</p>

            {error && (
              <div className={styles.errorBox}>
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('login.email')}</label>
                <input
                  type="email"
                  className={styles.input}
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('login.emailPlaceholder')}
                />
              </div>
              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className={styles.label}>{t('login.password')}</label>
                  <Link to={`/${currentLang}/${forgotPasswordRoute}`} className={styles.switchLink} style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                    {t('login.forgotPassword')}
                  </Link>
                </div>
                <input
                  type="password"
                  className={styles.input}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('login.passwordPlaceholder')}
                />
              </div>
              <Button type="submit" variant="primary" size="lg" fullWidth disabled={isLoading}>
                {isLoading ? t('login.checking') : t('login.signIn')}
              </Button>
            </form>

            <p className={styles.switchText}>
              {t('login.noAccount')}{' '}
              <Link to={`/${currentLang}/${registerRoute}`} className={styles.switchLink}>{t('login.registerNow')}</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;