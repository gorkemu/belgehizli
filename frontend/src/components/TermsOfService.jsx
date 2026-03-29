import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import styles from './TermsOfService.module.css'; 
import { Helmet } from 'react-helmet-async'; 
import { ScrollText, Loader2 } from 'lucide-react';

function TermsOfService() {
    const [legalDoc, setLegalDoc] = useState(null);
    const [loading, setLoading] = useState(true);

    const siteName = import.meta.env.VITE_SITE_NAME || "Belge Hızlı";

    useEffect(() => {
        const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
        
        axios.get(`${API_URL}/legal/kullanim_sartlari/latest`)
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
                <p>Kullanım Şartları yükleniyor...</p>
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
                <title>Kullanım Şartları - {siteName}</title>
            </Helmet> 

            <div className={styles.container}>
                <div className={styles.header}>
                    <ScrollText size={48} className={styles.titleIcon} />
                    <h1 className={styles.title}>Kullanım Şartları ve Mesafeli Satış Sözleşmesi</h1> 
                    <p className={styles.lastUpdated}>
                        <strong>Son Güncelleme:</strong> {formattedDate}
                    </p>
                </div>

                <div 
                    className={styles.dynamicContent}
                    dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(legalDoc?.content || '') 
                    }} 
                />
            </div>
        </>
    );
}

export default TermsOfService;