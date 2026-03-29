import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import styles from './PrivacyPolicy.module.css'; 
import { Helmet } from 'react-helmet-async'; 
import { ShieldCheck, Loader2 } from 'lucide-react';

function PrivacyPolicy() {
    const [legalDoc, setLegalDoc] = useState(null);
    const [loading, setLoading] = useState(true);

    const siteName = import.meta.env.VITE_SITE_NAME || "Belge Hızlı";

    useEffect(() => {
        const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
        
        axios.get(`${API_URL}/legal/gizlilik_politikasi/latest`)
            .then(res => {
                setLegalDoc(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Hukuki metin yüklenemedi", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className={styles.container} style={{ textAlign: 'center', padding: '5rem' }}>
                <Loader2 className={styles.spinner} size={48} />
                <p>Politika yükleniyor...</p>
            </div>
        );
    }

    const formattedDate = legalDoc?.updatedAt 
        ? new Date(legalDoc.updatedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
        : "Tarih Bekleniyor...";

    const getCleanedHtml = (htmlContent) => {
        if (!htmlContent) return '';
        const cleanHtml = htmlContent.replace(/&nbsp;/g, ' ');
        return DOMPurify.sanitize(cleanHtml);
    };

    return (
        <>
            <Helmet> 
                <title>Gizlilik Politikası - {siteName}</title>
            </Helmet> 

            <div className={styles.container}>
                <div className={styles.header}>
                    <ShieldCheck size={48} className={styles.titleIcon} />
                    <h1 className={styles.title}>Gizlilik Politikası ve Aydınlatma Metni</h1> 
                    <p className={styles.lastUpdated}>
                        <strong>Son Güncelleme:</strong> {formattedDate}
                    </p>
                </div>

                <div 
                    className={styles.dynamicContent}
                    dangerouslySetInnerHTML={{ 
                        __html: getCleanedHtml(legalDoc?.content) 
                    }} 
                />
            </div>
        </>
    );
}

export default PrivacyPolicy;