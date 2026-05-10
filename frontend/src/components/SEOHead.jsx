// frontend/src/components/SEOHead.jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { translatePath } from '../utils/routeDictionary';

export const SEOHead = ({ titleKey, descKey, dynamicTitle }) => {
    const { t } = useTranslation();
    const location = useLocation();
    
    const baseUrl = 'https://belgehizli.com';
    const trUrl = `${baseUrl}${translatePath(location.pathname, 'tr')}`;
    const enUrl = `${baseUrl}${translatePath(location.pathname, 'en')}`;

    // Eğer dynamicTitle gönderilmişse onu kullan, yoksa titleKey'i çevir
    const pageTitle = dynamicTitle ? dynamicTitle : t(titleKey);

    return (
        <Helmet>
            <title>{pageTitle} | Belge Hızlı</title>
            <meta name="description" content={t(descKey)} />
            
            <link rel="alternate" hreflang="tr" href={trUrl} />
            <link rel="alternate" hreflang="en" href={enUrl} />
            <link rel="alternate" hreflang="x-default" href={trUrl} />
        </Helmet>
    );
};