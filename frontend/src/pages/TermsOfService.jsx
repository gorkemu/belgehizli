// frontend/src/pages/TermsOfService.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import DOMPurify from 'dompurify';
import styles from './TermsOfService.module.css';
import { SEOHead } from '../components/SEOHead';
import { ScrollText, Loader2 } from 'lucide-react';

function TermsOfService() {
    const { t } = useTranslation();
    const { lang } = useParams();
    const currentLang = lang === 'en' ? 'en-US' : 'tr-TR';

    const fetchType = lang === 'en' ? 'kullanim_sartlari_en' : 'kullanim_sartlari';

    const [legalDoc, setLegalDoc] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/legal/${fetchType}/latest`)
            .then(res => {
                setLegalDoc(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Kullanım Şartları yüklenemedi", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className={styles.container} style={{ textAlign: 'center', padding: '5rem' }}>
                <Loader2 className={styles.spinner} size={48} />
                <p>{t('legal.loadingTerms')}</p>
            </div>
        );
    }

    const formattedDate = legalDoc?.updatedAt
        ? new Date(legalDoc.updatedAt).toLocaleDateString(currentLang, { day: '2-digit', month: 'long', year: 'numeric' })
        : t('legal.datePending');

    const formatLegalContent = (html) => {
        if (!html) return '';
        const cleanHtml = html.replace(/&nbsp;/g, ' ');
        return DOMPurify.sanitize(cleanHtml);
    };

    return (
        <>
            <SEOHead titleKey="legal.termsTitle" descKey="legal.termsDesc" />

            <div className={styles.container}>
                <div className={styles.header}>
                    <ScrollText size={48} className={styles.titleIcon} />
                    <h1 className={styles.title}>{t('legal.termsTitle')}</h1>
                    <p className={styles.lastUpdated}>
                        <strong>{t('legal.lastUpdated')}:</strong> {formattedDate}
                    </p>
                </div>

                <div
                    className={styles.dynamicContent}
                    dangerouslySetInnerHTML={{
                        __html: formatLegalContent(legalDoc?.content)
                    }}
                />
            </div>
        </>
    );
}

export default TermsOfService;