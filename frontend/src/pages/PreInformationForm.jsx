// frontend/src/pages/PreInformationForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import styles from './PreInformationForm.module.css';
import { FileSignature, Loader2 } from 'lucide-react';

function PreInformationForm() {
    const [legalDoc, setLegalDoc] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

        axios.get(`${API_URL}/legal/on_bilgilendirme/latest`)
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
                <p>Yükleniyor...</p>
            </div>
        );
    }

    const formattedDate = legalDoc?.updatedAt
        ? new Date(legalDoc.updatedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
        : "Tarih Bekleniyor...";

    const formatLegalContent = (html) => {
        if (!html) return '';
        const cleanHtml = html.replace(/&nbsp;/g, ' ');
        return DOMPurify.sanitize(cleanHtml);
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>
                <FileSignature size={36} className={styles.titleIcon} /> Ön Bilgilendirme Formu
            </h1>

            <div className={styles.versionBadge}>Son Güncelleme: {formattedDate}</div>

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