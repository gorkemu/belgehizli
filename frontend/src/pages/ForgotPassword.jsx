import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import styles from './Auth.module.css';
import Button from '../components/ui/Button';

const ForgotPassword = () => {
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
      // Başarılı da olsa başarısız da olsa güvenlik gereği aynı mesaj dönecek
      setStatus({ type: 'success', message: response.message });
      setEmail(''); // Formu temizle
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h2 className={styles.authTitle}>Şifremi Unuttum</h2>
        <p className={styles.authSubtitle}>E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.</p>

        {status.message && (
          <div className={status.type === 'success' ? styles.successBox : styles.errorBox}>
            {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {status.message}
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

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={isLoading || status.type === 'success'}>
            {isLoading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
          </Button>
        </form>

        <p className={styles.switchText}>
          Şifrenizi hatırladınız mı?
          <Link to="/giris-yap" className={styles.switchLink}>Giriş Yapın</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;