// frontend/src/pages/PreInformationForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api'; 
import DOMPurify from 'dompurify';
import styles from './PreInformationForm.module.css';
import { SEOHead } from '../components/SEOHead'; 
import { FileSignature, Loader2 } from 'lucide-react';

function PreInformationForm() {
    const { t } = useTranslation();
    const { lang } = useParams();
    const currentLang = lang === 'en' ? 'en-US' : 'tr-TR';

    const fetchType = lang === 'en' ? 'on_bilgilendirme_en' : 'on_bilgilendirme';

    const [legalDoc, setLegalDoc] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/legal/${fetchType}/latest`)
            .then(res => {
                setLegalDoc(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Ön bilgilendirme formu yüklenemedi", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className={styles.container} style={{ textAlign: 'center', padding: '3rem' }}>
                <Loader2 className={styles.spinner} size={40} />
                <p>{t('legal.loading')}</p>
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
        <div className={styles.container}>
            <SEOHead titleKey="legal.preInfoTitle" descKey="legal.preInfoDesc" />

            <h1 className={styles.title}>
                <FileSignature size={36} className={styles.titleIcon} /> {t('legal.preInfoTitle')}
            </h1>

            <div className={styles.versionBadge}>{t('legal.lastUpdated')}: {formattedDate}</div>

            <div
                className={styles.dynamicContent}
                dangerouslySetInnerHTML={{
                    __html: formatLegalContent(legalDoc?.content)
                }}
            />
        </div>
    );
}

export default PreInformationForm;