// frontend/src/pages/UserFillTemplate.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DocumentForm from '../components/DocumentForm';
import DocumentPreview from '../components/DocumentPreview';
import styles from './TemplateDetail.module.css';
import { ArrowLeft, CheckCircle2, AlertCircle, Download, Loader2, Edit2, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const UserFillTemplate = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({});
    const [currentStep, setCurrentStep] = useState(1);
    const [isFormValid, setIsFormValid] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showBackWarning, setShowBackWarning] = useState(false);

    const formRef = useRef(null);
    const previewRef = useRef(null);
    const editorRef = useRef(null);

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                const token = localStorage.getItem('user_token');
                const res = await axios.get(`${API_BASE_URL}/user-templates/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTemplate(res.data);
            } catch (err) {
                setError("Şablon yüklenemedi. Lütfen tekrar deneyin.");
            } finally {
                setLoading(false);
            }
        };
        fetchTemplate();
    }, [id]);

    const handleNextStep = async () => {
        let isFormValidLocal = true;
        if (formRef.current) {
            isFormValidLocal = await formRef.current.handleSubmit();
        }

        if (isFormValidLocal) {
            setCurrentStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const confirmGoBackToForm = () => {
        setCurrentStep(1);
        setShowBackWarning(false);
    };

    const handleGenerate = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            let finalEditedHtml = null;
            if (editorRef.current) {
                let rawHtml = editorRef.current.innerHTML;
                finalEditedHtml = rawHtml.replace(/<mark[^>]*>/gi, '').replace(/<\/mark>/gi, '');
            }

            const token = localStorage.getItem('user_token');
            const response = await axios.post(`${API_BASE_URL}/templates/${template._id}/generate-document`,
                {
                    formData,
                    editedHtml: finalEditedHtml,
                    consentTimestamp: new Date().toISOString()
                },
                {
                    responseType: 'blob',
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${template.name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error(err);
            setError("Belge oluşturulurken hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className={styles.statusContainer}>
            <Loader2 size={48} className={styles.spinner} />
            <p>Çalışma Alanı Hazırlanıyor...</p>
        </div>
    );

    if (error && !template) return (
        <div className={styles.errorScreen}>
            <AlertCircle size={48} />
            <p>{error}</p>
            <button onClick={() => navigate('/panel')} className={styles.backButton}>Panele Dön</button>
        </div>
    );

    const progressPercent = currentStep === 1 ? 50 : 100;

    return (
        <>
            <Helmet>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>
            <div className={`${styles.workspaceContainer} ${styles.userFillContainer}`}>
                <div className={styles.workspaceHeader}>
                    <button onClick={() => navigate('/panel')} className={styles.backButton}>
                        <ArrowLeft size={18} /> İptal Et ve Çık
                    </button>
                    <div className={styles.headerTitles}>
                        <h1 className={styles.title}>{template.name}</h1>
                        {template.description && <p className={styles.description}>{template.description}</p>}
                    </div>
                </div>

                <div className={styles.stepperWrapper}>
                    <div className={`${styles.stepItem} ${currentStep === 1 ? styles.stepActive : ''}`}>
                        <div className={styles.stepNumber}>1</div>
                        <span>Formu Doldur</span>
                    </div>
                    <div className={`${styles.stepConnector} ${currentStep === 2 ? styles.connectorDone : ''}`} />
                    <div className={`${styles.stepItem} ${currentStep === 2 ? styles.stepActive : styles.stepPassive}`}>
                        <div className={styles.stepNumber}>2</div>
                        <span>İncele & Son Rötuşlar</span>
                    </div>
                </div>

                <div className={styles.progressBarContainer}>
                    <div className={styles.progressBar} style={{ width: `${progressPercent}%` }} />
                </div>

                <div className={styles.editorContainer}>
                    <div className={styles.formColumn}>
                        {currentStep === 1 && (
                            <div className={styles.formColumnHeader}>
                                <div className={styles.formStepTag}>Adım 1 / 2</div>
                                <p className={styles.formColumnHint}>
                                    Müşterinize ait bilgileri girin. Canlı önizlemede sonucu görebilirsiniz.
                                </p>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className={styles.formOverlay} onClick={() => setShowBackWarning(true)}>
                                <div className={styles.overlayContent}>
                                    <CheckCircle2 size={32} className={styles.overlayIconSuccess} />
                                    <h4>Form Dolduruldu</h4>
                                    <p>Şimdi sağ taraftaki önizleme üzerinden manuel düzeltmeler yapabilirsiniz.</p>
                                </div>
                            </div>
                        )}

                        <div className={currentStep === 2 ? styles.blurredForm : ''}>
                            {template.fields && template.fields.length > 0 ? (
                                <DocumentForm
                                    templateFields={template.fields}
                                    onChange={(data) => setFormData(data)}
                                    onValidChange={(valid) => setIsFormValid(valid)}
                                    ref={formRef}
                                />
                            ) : (
                                <div className={styles.emptyFormNotice}>Bu şablon için dinamik soru bulunmuyor.</div>
                            )}

                            {currentStep === 1 && (
                                <div className={styles.step1ActionContainer}>
                                    <button
                                        onClick={handleNextStep}
                                        disabled={!isFormValid}
                                        className={`${styles.nextStepButton} ${!isFormValid ? styles.disabledButton : ''}`}
                                    >
                                        <span className={styles.btnInner}>
                                            <Edit2 size={20} />
                                            <span>
                                                <span className={styles.btnMainText}>Sonraki Adım: İncele & Düzenle</span>
                                            </span>
                                        </span>
                                        <ArrowRight size={18} className={styles.btnArrow} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.previewColumn} ref={previewRef} data-locked={currentStep === 1 ? "true" : "false"}>
                        <DocumentPreview
                            templateContent={template.content}
                            formData={formData}
                            editorRef={editorRef}
                            currentStep={currentStep}
                        />
                    </div>
                </div>

                {currentStep === 2 && (
                    <div className={styles.actionSection}>
                        <div className={styles.checkoutSection}>
                            {error && <div className={styles.paymentError}><AlertCircle size={18} /> {error}</div>}

                            <div className={styles.ctaWrapper}>
                                <button
                                    onClick={handleGenerate}
                                    disabled={isSubmitting}
                                    className={`${styles.payDownloadButton} ${isSubmitting ? styles.disabledButton : ''}`}
                                >
                                    <Download size={20} />
                                    {isSubmitting ? 'PDF Oluşturuluyor...' : `Belgeyi Üret ve İndir`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showBackWarning && (
                    <div className={styles.modalOverlay} onClick={() => setShowBackWarning(false)}>
                        <div className={styles.warningModal} onClick={(e) => e.stopPropagation()}>
                            <AlertCircle size={48} className={styles.warningIcon} />
                            <h3>Forma Geri Dön?</h3>
                            <p>Eğer forma geri dönerseniz <strong>önizleme üzerinde</strong> elle yaptığınız rötuşlar silinecektir.</p>
                            <div className={styles.warningActions}>
                                <button onClick={() => setShowBackWarning(false)} className={styles.cancelBtn}>İptal, Önizlemede Kal</button>
                                <button onClick={confirmGoBackToForm} className={styles.confirmBtn}>Evet, Forma Dön</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default UserFillTemplate;