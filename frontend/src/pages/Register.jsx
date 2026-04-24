// frontend/src/pages/Register.jsx
import React, { useState, useContext } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AlertCircle, Loader2 } from 'lucide-react';
import styles from './Auth.module.css';
import Button from '../components/ui/Button';

const Register = () => {
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
      navigate('/panel/projects', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Kayıt işlemi başarısız oldu.');
      setIsLoading(false); 
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h2 className={styles.authTitle}>Hesap Oluştur</h2>
        <p className={styles.authSubtitle}>Saniyeler içinde üretmeye başlayın.</p>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Ad Soyad</label>
            <input
              type="text"
              name="fullName"
              className={styles.input}
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Adınız Soyadınız"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>E-posta Adresi</label>
            <input
              type="email"
              name="email"
              className={styles.input}
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="ornek@email.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Şifre</label>
            <input
              type="password"
              name="password"
              className={styles.input}
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="En az 6 karakter"
            />
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            size="lg" 
            fullWidth 
            isLoading={isLoading}
          >
            {isLoading ? 'Hesap Oluşturuluyor...' : 'Ücretsiz Kayıt Ol'}
          </Button>
        </form>

        <p className={styles.switchText}>
          Zaten hesabınız var mı?
          <Link to="/giris-yap" className={styles.switchLink}>Giriş Yapın</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;