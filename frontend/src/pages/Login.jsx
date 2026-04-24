import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AlertCircle, Loader2, KeyRound, ArrowLeft } from 'lucide-react';
import styles from './Auth.module.css';
import Button from '../components/ui/Button';

const Login = () => {
  // 1. Adım State'leri (Normal Giriş)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 2. Adım State'leri (MFA)
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [otp, setOtp] = useState('');

  // Ortak State'ler
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Context'ten yeni verifyMfa fonksiyonunu da alıyoruz
  const { login, verifyMfa, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await login(email, password);
      
      // Backend MFA istiyorsa 2. adıma geç
      if (response.requiresMfa) {
        setRequiresMfa(true);
        setTempToken(response.tempToken);
        setIsLoading(false);
      } else {
        // MFA istemiyorsa direkt panele gönder
        const from = location.state?.from?.pathname || '/panel';
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Giriş başarısız oldu. Bilgilerinizi kontrol edin.');
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await verifyMfa(tempToken, otp);
      const from = location.state?.from?.pathname || '/panel';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Geçersiz doğrulama kodu.');
      setIsLoading(false);
    }
  };

  // Sayfa ilk yüklendiğinde global loading varsa spinner göster
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
        
        {/* === MFA ADIMI (2. ADIM) === */}
        {requiresMfa ? (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '50%', color: '#2563eb' }}>
                <KeyRound size={32} />
              </div>
            </div>
            <h2 className={styles.authTitle}>Doğrulama Kodu</h2>
            <p className={styles.authSubtitle}>
              <b>{email}</b> adresine gönderdiğimiz 6 haneli kodu girin.
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
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} // Sadece rakam girmesine izin ver
                  placeholder="••••••"
                  autoFocus
                />
              </div>
              <Button type="submit" variant="primary" size="lg" fullWidth disabled={isLoading || otp.length < 6}>
                {isLoading ? 'Doğrulanıyor...' : 'Giriş Yap'}
              </Button>
            </form>

            <button 
              onClick={() => { setRequiresMfa(false); setOtp(''); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#57534e', fontSize: '0.9rem', width: '100%', marginTop: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} /> Geri Dön
            </button>
          </div>
        ) : (
          
          /* === NORMAL LOGİN ADIMI (1. ADIM) === */
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <h2 className={styles.authTitle}>Hoş Geldiniz</h2>
            <p className={styles.authSubtitle}>Hesabınıza giriş yaparak devam edin.</p>

            {error && (
              <div className={styles.errorBox}>
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className={styles.label}>Şifre</label>
                  <Link to="/sifremi-unuttum" className={styles.switchLink} style={{ fontSize: '0.8rem', fontWeight: '600' }}>Şifremi Unuttum?</Link>
                </div>
                <input
                  type="password"
                  className={styles.input}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" variant="primary" size="lg" fullWidth disabled={isLoading}>
                {isLoading ? 'Kontrol Ediliyor...' : 'Giriş Yap'}
              </Button>
            </form>

            <p className={styles.switchText}>
              Henüz hesabınız yok mu?
              <Link to="/kayit-ol" className={styles.switchLink}>Hemen Kayıt Olun</Link>
            </p>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default Login;