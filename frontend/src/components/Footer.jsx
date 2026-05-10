// frontend/src/components/Footer.jsx
import React from 'react';
import { Link, useParams } from 'react-router-dom'; 
import { useTranslation } from 'react-i18next';
import styles from './Footer.module.css';

function Footer() {
  const { t } = useTranslation();
  const { lang } = useParams(); 
  const currentLang = lang || 'tr'; 

  // 🔥 Dinamik Rotalar
  const libraryRoute = currentLang === 'tr' ? 'sablonlar' : 'templates';
  const registerRoute = currentLang === 'tr' ? 'kayit-ol' : 'register';
  const loginRoute = currentLang === 'tr' ? 'giris-yap' : 'login';
  const privacyRoute = currentLang === 'tr' ? 'gizlilik-politikasi' : 'privacy-policy';
  const termsRoute = currentLang === 'tr' ? 'kullanim-sartlari' : 'terms-of-service';
  const preInfoRoute = currentLang === 'tr' ? 'on-bilgilendirme-formu' : 'pre-information-form';

  return (
    <footer className={styles.appFooter}>
      <div className={styles.footerContent}>

        <div className={styles.footerBrand}>
          <Link to={`/${currentLang}`} className={styles.logoContainer}>
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
                <li><Link to={`/${currentLang}/${libraryRoute}`}>{t('footer.publicLibrary')}</Link></li>
                <li><Link to={`/${currentLang}/${registerRoute}`}>{t('footer.signUpFree')}</Link></li>
                <li><Link to={`/${currentLang}/${loginRoute}`}>{t('footer.login')}</Link></li>
              </ul>
            </nav>
          </div>

          <div className={styles.linkColumn}>
            <h4 className={styles.columnTitle}>{t('footer.legal')}</h4>
            <nav className={styles.footerNav}>
              <ul>
                <li><Link to={`/${currentLang}/${privacyRoute}`}>{t('footer.privacy')}</Link></li>
                <li><Link to={`/${currentLang}/${termsRoute}`}>{t('footer.terms')}</Link></li>
                <li><Link to={`/${currentLang}/${preInfoRoute}`}>{t('footer.disclaimer')}</Link></li>
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