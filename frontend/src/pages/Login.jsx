// frontend/src/pages/Login.jsx
import React, { useState, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AlertCircle, Loader2 } from 'lucide-react';
import styles from './Auth.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      const from = location.state?.from?.pathname || '/panel';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Giriş başarısız oldu. Bilgilerinizi kontrol edin.');
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
        <h2 className={styles.authTitle}>Hoş Geldiniz</h2>
        <p className={styles.authSubtitle}>Hesabınıza giriş yaparak devam edin.</p>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>E-posta Adresi</label>
            <input
              type="email"
              className={styles.input}
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ornek@email.com"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Şifre</label>
            <input
              type="password"
              className={styles.input}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? (
              <><Loader2 size={18} className={styles.spinner} /> Giriş Yapılıyor...</>
            ) : 'Giriş Yap'}
          </button>
        </form>

        <p className={styles.switchText}>
          Henüz hesabınız yok mu?
          <Link to="/kayit-ol" className={styles.switchLink}>Hemen Kayıt Olun</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;