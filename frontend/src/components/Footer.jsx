// frontend/src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

function Footer() {
  return (
    <footer className={styles.appFooter}>
      <div className={styles.footerContent}>

        <div className={styles.footerBrand}>
          <Link to="/" className={styles.logoContainer}>
            <img
              src="/logo-full-white.svg"
              alt="Belge Hızlı"
              className={styles.footerLogo}
            />
          </Link>
          <p className={styles.footerDesc}>
            Sözleşme, dilekçe ve rutin yazışmalarınızı hazırlamanın en yalın hali.
            Dikkatinizi dağıtmayan, tekrarı ortadan kaldıran ücretsiz çalışma alanınız.
          </p>
        </div>

        <div className={styles.footerLinksWrapper}>

          <div className={styles.linkColumn}>
            <h4 className={styles.columnTitle}>Platform</h4>
            <nav className={styles.footerNav}>
              <ul>
                <li><Link to="/sablonlar">Açık Kütüphane</Link></li>
                <li><Link to="/kayit-ol">Ücretsiz Kayıt Ol</Link></li>
                <li><Link to="/giris-yap">Giriş Yap</Link></li>
              </ul>
            </nav>
          </div>

          <div className={styles.linkColumn}>
            <h4 className={styles.columnTitle}>Yasal & Destek</h4>
            <nav className={styles.footerNav}>
              <ul>
                <li><Link to="/gizlilik-politikasi">Gizlilik Politikası</Link></li>
                <li><Link to="/kullanim-sartlari">Kullanım Şartları</Link></li>
                <li><Link to="/on-bilgilendirme-formu">Ön Bilgilendirme</Link></li>
              </ul>
            </nav>
          </div>

        </div>
      </div>

      <div className={styles.footerBottom}>
        <p>© {new Date().getFullYear()} Belge Hızlı. Tüm hakları saklıdır.</p>
      </div>
    </footer>
  );
}

export default Footer;