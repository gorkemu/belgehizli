// src/components/CookieBanner.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import CookieConsent from 'react-cookie-consent';
import PropTypes from 'prop-types';

const CookieBanner = ({
  buttonText = "Kabul Et",
  declineButtonText = "Reddet",
  cookieName = "belgeHizliCookieConsent",
  expires = 150,

  style = {
    background: "var(--gray-900)",
    color: "var(--gray-100)",
    fontSize: "0.9rem",
    padding: "10px 20px",
    alignItems: "center"
  },
  buttonStyle = {
    background: "var(--primary-color)",
    color: "white",
    fontSize: "0.9rem",
    fontWeight: "600",
    borderRadius: "var(--radius-md)",
    padding: "10px 20px",
    margin: "0 10px 0 0"
  },
  declineButtonStyle = {
    background: "transparent",
    color: "var(--gray-300)",
    border: "1px solid var(--gray-600)",
    fontSize: "0.9rem",
    borderRadius: "var(--radius-md)",
    padding: "9px 20px"
  },

  privacyPolicyPath = "/gizlilik-politikasi",
  children 
}) => {
  const defaultContent = (
    <>
      Bu web sitesi, kullanıcı deneyimini geliştirmek ve site trafiğini analiz etmek için çerezleri kullanır. Daha fazla bilgi için{" "}
      <Link
        to={privacyPolicyPath}
        style={{ color: "var(--gray-300)", textDecoration: "underline" }}
      >
        Gizlilik Politikamızı
      </Link>{" "}
      okuyun.
    </>
  );

  return (
    <CookieConsent
      location="bottom"
      buttonText={buttonText}
      declineButtonText={declineButtonText}
      cookieName={cookieName}
      style={style}
      buttonStyle={buttonStyle}
      declineButtonStyle={declineButtonStyle}
      expires={expires}
      enableDeclineButton 
    >
      {children || defaultContent}
    </CookieConsent>
  );
};

CookieBanner.propTypes = {
  buttonText: PropTypes.string,
  declineButtonText: PropTypes.string,
  cookieName: PropTypes.string,
  expires: PropTypes.number,
  style: PropTypes.object,
  buttonStyle: PropTypes.object,
  declineButtonStyle: PropTypes.object,
  privacyPolicyPath: PropTypes.string,
  children: PropTypes.node
};

export default CookieBanner;