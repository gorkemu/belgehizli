import React, { useEffect } from 'react';
import { useParams, Outlet, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SUPPORTED_LANGS = ['tr', 'en'];

export const LanguageWrapper = () => {
    const { lang } = useParams();
    const { i18n } = useTranslation();

    useEffect(() => {
        // Eğer URL'deki dil destekleniyorsa ve mevcut dilden farklıysa güncelle
        if (SUPPORTED_LANGS.includes(lang) && i18n.language !== lang) {
            i18n.changeLanguage(lang);
        }
        
        // SEO için KRİTİK: HTML etiketinin dilini URL'e göre değiştir
        if (SUPPORTED_LANGS.includes(lang)) {
            document.documentElement.lang = lang;
        }
    }, [lang, i18n]);

    // Eğer kullanıcı rastgele bir dil girerse (örn: /fr/sablonlar), onu varsayılan dile (tr) yönlendir
    if (!SUPPORTED_LANGS.includes(lang)) {
        return <Navigate to="/tr" replace />;
    }

    // Doğru dildeyse alt rotaları (sayfaları) render et
    return <Outlet />;
};