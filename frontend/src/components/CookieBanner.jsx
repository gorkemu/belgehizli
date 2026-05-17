// src/components/CookieBanner.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import CookieConsent from 'react-cookie-consent';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import styles from './CookieBanner.module.css'; 

const CookieBanner = ({
  buttonText,
  declineButtonText,
  cookieName = "belgeHizliCookieConsent",
  expires = 150,
  children 
}) => {
  const { t, i18n } = useTranslation();

  const currentLang = i18n.language?.split('-')[0] || 'tr';

  const privacyPolicyPath = currentLang === 'tr' 
    ? `/${currentLang}/gizlilik-politikasi` 
    : `/${currentLang}/privacy-policy`;

  const acceptText = buttonText || t('cookie.accept');
  const declineText = declineButtonText || t('cookie.decline');

  const defaultContent = (
    <>
      {t('cookie.description')}{" "}
      <Link
        to={privacyPolicyPath}
        className={styles.privacyLink}
      >
        {t('cookie.privacyPolicy')}
      </Link>{" "}
      {t('cookie.readMore')}
    </>
  );

  return (
    <div className={styles.cookieWrapper}>
      <CookieConsent
        location="bottom"
        buttonText={acceptText}
        declineButtonText={declineText}
        cookieName={cookieName}
        expires={expires}
        enableDeclineButton 
        containerClasses={styles.bannerContainer}
        buttonClasses={styles.acceptButton}
        declineButtonClasses={styles.declineButton}
      >
        {children || defaultContent}
      </CookieConsent>
    </div>
  );
};

CookieBanner.propTypes = {
  buttonText: PropTypes.string,
  declineButtonText: PropTypes.string,
  cookieName: PropTypes.string,
  expires: PropTypes.number,
  children: PropTypes.node
};

export default CookieBanner;