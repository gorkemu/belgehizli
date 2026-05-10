// frontend/src/pages/AboutUs.jsx
import React from 'react';
import { useTranslation } from 'react-i18next'; 
import { SEOHead } from '../components/SEOHead'; 
import styles from './AboutUs.module.css'; 
import { ShieldCheck, Info } from 'lucide-react'; 

function AboutUs() {
    const { t } = useTranslation();
    const siteName = import.meta.env.VITE_SITE_NAME || "Belge Hızlı";

    return (
        <div className={styles.container}>
            <SEOHead 
                titleKey="aboutUs.pageTitle" 
                descKey="aboutUs.metaDescription" 
            />

            <div className={styles.header}>
                <div className={styles.iconWrapper}>
                    <ShieldCheck size={32} />
                </div>
                <h1 className={styles.title}>{t('aboutUs.title')}</h1> 
            </div>

            <div className={styles.contentWrapper}>
                <p className={styles.paragraph}>
                    <strong>{siteName}</strong> {t('aboutUs.paragraph1')}
                </p>

                <p className={styles.paragraph}>
                    {t('aboutUs.paragraph2')}
                </p>

                <div className={styles.importantNote}>
                    <div className={styles.noteIconWrapper}>
                        <Info size={20} />
                    </div>
                    <div className={styles.noteContent}>
                        <strong>{t('aboutUs.importantNoteTitle')}</strong> {siteName} {t('aboutUs.importantNoteContent')}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AboutUs;