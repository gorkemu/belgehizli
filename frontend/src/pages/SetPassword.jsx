import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import styles from './Auth.module.css';
import Button from '../components/ui/Button';

const SetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  const { resetPassword } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus({ type: 'error', message: 'Geçersiz veya eksik güvenlik jetonu (token). Lütfen e-postanızdaki bağlantıya tekrar tıklayın.' });
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    setStatus({ type: '', message: '' });
    setIsLoading(true);

    try {
      const response = await resetPassword(token, newPassword);
      setStatus({ type: 'success', message: response.message });
      
      // 3 saniye sonra login'e yönlendir
      setTimeout(() => {
        navigate('/giris-yap');
      }, 3000);
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Şifre güncellenirken bir hata oluştu.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h2 className={styles.authTitle}>Yeni Şifre Belirle</h2>
        <p className={styles.authSubtitle}>Güvenliğiniz için yeni ve güçlü bir şifre oluşturun.</p>

        {status.message && (
          <div className={status.type === 'success' ? styles.successBox : styles.errorBox} style={status.type === 'success' ? { backgroundColor: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0', padding: '14px 18px', borderRadius: '12px', fontSize: '0.9rem', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' } : {}}>
            {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />} 
            {status.message}
          </div>
        )}

        {!status.message || status.type === 'error' ? (
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Yeni Şifre</label>
              <input
                type="password"
                className={styles.input}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="En az 8 karakter (Büyük/Küçük/Rakam)"
                disabled={!token}
              />
            </div>
            
            <Button type="submit" variant="primary" size="lg" fullWidth disabled={isLoading || !token}>
              {isLoading ? 'Güncelleniyor...' : 'Şifreyi Kaydet'}
            </Button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p style={{ color: '#57534e', fontSize: '0.95rem' }}>Giriş sayfasına yönlendiriliyorsunuz...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetPassword;