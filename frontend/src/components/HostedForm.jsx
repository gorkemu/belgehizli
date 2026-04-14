// frontend/src/components/HostedForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Handlebars from 'handlebars';
import DocumentForm from './DocumentForm';
import styles from './HostedForm.module.css';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, FileText, Download, Loader2, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const convertToHandlebars = (html, trigger) => {
    if (!trigger || trigger === '{{') return html;
    const tempDiv = window.document.createElement('div');
    tempDiv.innerHTML = html;
    let regex;
    if (trigger === '[') regex = /\[([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\]/g;
    else if (trigger === '{') regex = /\{([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\}/g;
    else { const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); regex = new RegExp(`${escaped}([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)`, 'g'); }
    const walk = (node) => {
        if (node.nodeType === 3) node.nodeValue = node.nodeValue.replace(regex, '{{$1}}');
        else if (node.nodeType === 1) { for (let child of node.childNodes) walk(child); }
    };
    walk(tempDiv);
    return tempDiv.innerHTML;
};

const HostedForm = () => {
    const { slug } = useParams();

    const [projectData, setProjectData] = useState(null);
    const [documents, setDocuments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [formData, setFormData] = useState({});
    const [isFormValid, setIsFormValid] = useState(false);
    const formRef = useRef(null);

    useEffect(() => {
        const fetchProjectOrTemplate = async () => {
            try {
                const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
                if (isObjectId) {
                    const response = await axios.get(`${API_BASE_URL}/projects/public/${slug}`);
                    setProjectData(response.data.project);
                    setDocuments(response.data.documents || []);
                } else {
                    const response = await axios.get(`${API_BASE_URL}/sablonlar/detay/${slug}`);
                    setProjectData(response.data);
                }
                setLoading(false);
            } catch (err) {
                console.error("Yükleme hatası:", err);
                setError("Belge bulunamadı veya erişim yetkiniz yok.");
                setLoading(false);
            }
        };
        fetchProjectOrTemplate();
    }, [slug]);

    const handleSubmit = async () => {
        if (formRef.current) {
            const isValid = formRef.current.handleSubmit();
            if (!isValid) {
                alert("Lütfen tüm zorunlu alanları eksiksiz doldurun.");
                return;
            }
        }

        setIsSubmitting(true);

        try {
            let fullContent = "";
            if (documents && documents.length > 0) {
                fullContent = documents.map(doc => doc.content).join('<hr class="page-break" />');
            } else if (projectData && projectData.content) {
                fullContent = projectData.content;
            }

            const cleanedData = { ...formData };
            Object.keys(cleanedData).forEach(key => {
                if (Array.isArray(cleanedData[key])) {
                    cleanedData[key] = cleanedData[key].join(', ');
                }
            });

            const currentTrigger = projectData?.settings?.variableTrigger || '{{';
            const hbHtml = convertToHandlebars(fullContent, currentTrigger);
            const template = Handlebars.compile(hbHtml);
            const resultHtml = template(cleanedData);

            const queryParams = new URLSearchParams(window.location.search);
            const clientId = queryParams.get('client');

            const response = await axios.post(`${API_BASE_URL}/projects/public/${projectData._id || slug}/complete`, {
                clientId: clientId,
                completedData: cleanedData,
                html: resultHtml
            }, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = window.document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${projectData.name || 'Belge'}.pdf`);
            window.document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);

            setIsSubmitting(false);
            setIsSuccess(true);

        } catch (err) {
            console.error("Derleme hatası:", err);
            if (err.response && err.response.data instanceof Blob) {
                const errorText = await err.response.data.text();
                try {
                    const errJson = JSON.parse(errorText);
                    alert(`Sistem Hatası: ${errJson.message}`);
                } catch (e) {
                    alert("PDF oluşturulurken bir hata oluştu.");
                }
            } else {
                alert("İşlem sırasında bir bağlantı hatası oluştu.");
            }
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className={styles.centerScreen}>
            <Loader2 size={44} className={styles.spinner} />
            <p>Form yükleniyor...</p>
        </div>
    );

    if (error) return (
        <div className={styles.centerScreen}>
            <AlertCircle size={56} className={styles.errorIcon} />
            <h2>Üzgünüz 😕</h2>
            <p>{error}</p>
        </div>
    );

    if (isSuccess) return (
        <div className={styles.successScreen}>
            <div className={styles.successCard}>
                <div className={styles.successIconWrapper}>
                    <CheckCircle2 size={44} color="#10b981" />
                </div>
                <h2 className={styles.successTitle}>İşlem Başarılı!</h2>
                <p className={styles.successMessage}>
                    Belgeniz başarıyla oluşturuldu ve cihazınıza indirildi. Bilgileriniz ilgili yetkiliye güvenle iletilmiştir.
                </p>
                <div className={styles.successNote}>
                    <Download size={18} /> İndirilen PDF dosyasını açarak kontrol edebilirsiniz.
                </div>
            </div>
        </div>
    );

    let formFields = [];
    if (documents && documents.length > 0) {
        documents.forEach(doc => {
            if (doc.fields && doc.fields.length > 0) {
                formFields = [...formFields, ...doc.fields];
            }
        });
    }
    if (formFields.length === 0 && projectData.fields && projectData.fields.length > 0) {
        formFields = projectData.fields;
    }
    if (formFields.length === 0 && projectData.variables && Object.keys(projectData.variables).length > 0) {
        formFields = Object.keys(projectData.variables)
            .filter(k => k !== '_trigger')
            .map(key => ({
                name: key,
                label: key.replace(/_/g, ' ').toUpperCase(),
                fieldType: 'text',
                required: true
            }));
    }

    return (
        <>
            <Helmet>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <div className={`${styles.pageContainer} no-print`}>
                <div className={styles.formWrapper}>
                    <div className={styles.formHeader}>
                        <div className={styles.headerBadge}>
                            <FileText size={16} /> Ücretsiz Belge
                        </div>
                        <h1 className={styles.title}>{projectData.name}</h1>
                        {projectData.description && (
                            <p className={styles.description}>{projectData.description}</p>
                        )}
                    </div>

                    <div className={styles.formBody}>
                        {formFields.length > 0 ? (
                            <DocumentForm
                                ref={formRef}
                                templateFields={formFields}
                                onChange={(data) => setFormData(data)}
                                onValidChange={(valid) => setIsFormValid(valid)}
                            />
                        ) : (
                            <div className={styles.emptyFieldsMessage}>
                                <FileText size={48} className={styles.emptyIcon} />
                                <p className={styles.emptyTitle}>Doldurulacak bir alan bulunmuyor.</p>
                                <p className={styles.emptySubtext}>Doğrudan PDF olarak indirebilirsiniz.</p>
                            </div>
                        )}
                    </div>

                    <div className={styles.formFooter}>
                        <button
                            className={styles.submitBtn}
                            onClick={handleSubmit}
                            disabled={isSubmitting || (formFields.length > 0 && !isFormValid)}
                        >
                            {isSubmitting ? (
                                <><Loader2 size={20} className={styles.btnSpinner} /> PDF Hazırlanıyor...</>
                            ) : (
                                'Tamamla ve PDF İndir'
                            )}
                        </button>
                        <div className={styles.watermark}>
                            Powered by <strong>BelgeHızlı</strong>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HostedForm;