// frontend/src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './Footer.module.css';

function Footer() {
  const { t } = useTranslation();

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
            {t('footer.description')}
          </p>
        </div>

        <div className={styles.footerLinksWrapper}>

          <div className={styles.linkColumn}>
            <h4 className={styles.columnTitle}>{t('footer.platform')}</h4>
            <nav className={styles.footerNav}>
              <ul>
                <li><Link to="/sablonlar">{t('footer.publicLibrary')}</Link></li>
                <li><Link to="/kayit-ol">{t('footer.signUpFree')}</Link></li>
                <li><Link to="/giris-yap">{t('footer.login')}</Link></li>
              </ul>
            </nav>
          </div>

          <div className={styles.linkColumn}>
            <h4 className={styles.columnTitle}>{t('footer.legal')}</h4>
            <nav className={styles.footerNav}>
              <ul>
                <li><Link to="/gizlilik-politikasi">{t('footer.privacy')}</Link></li>
                <li><Link to="/kullanim-sartlari">{t('footer.terms')}</Link></li>
                <li><Link to="/on-bilgilendirme-formu">{t('footer.disclaimer')}</Link></li>
              </ul>
            </nav>
          </div>

        </div>
      </div>

      <div className={styles.footerBottom}>
        <p>© {new Date().getFullYear()} Belge Hızlı. {t('footer.rights')}</p>
      </div>
    </footer>
  );
}

export default Footer;