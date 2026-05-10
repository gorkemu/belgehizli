// frontend/src/pages/UserFillTemplate.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; 
import api from '../utils/api'; 
import { useTranslation } from 'react-i18next'; 
import DocumentForm from '../components/DocumentForm';
import DocumentPreview from '../components/DocumentPreview';
import styles from './TemplateDetail.module.css';
import { ArrowLeft, CheckCircle2, AlertCircle, Download, Loader2, Edit2, ArrowRight } from 'lucide-react';
import { SEOHead } from '../components/SEOHead'; 
import { Helmet } from 'react-helmet-async'; 

const UserFillTemplate = () => {
    const { t } = useTranslation();
    const { id, lang } = useParams(); 
    const navigate = useNavigate();
    const currentLang = lang || 'tr';

    // Dinamik Panel Rotası
    const dashboardRoute = currentLang === 'tr' ? 'panel' : 'dashboard';

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
                const res = await api.get(`/user-templates/${id}`);
                setTemplate(res.data);
            } catch (err) {
                setError(t('templateDetail.loadError'));
            } finally {
                setLoading(false);
            }
        };
        fetchTemplate();
    }, [id, t]);

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

            const response = await api.post(`/templates/${template._id}/generate-document`, 
                {
                    formData,
                    editedHtml: finalEditedHtml,
                    consentTimestamp: new Date().toISOString()
                },
                { responseType: 'blob' }
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
            setError(t('templateDetail.downloadError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className={styles.statusContainer}>
            <Loader2 size={48} className={styles.spinner} />
            <p>{t('templateDetail.preparing')}</p> 
        </div>
    );

    if (error && !template) return (
        <div className={styles.errorScreen}>
            <AlertCircle size={48} />
            <p>{error}</p>
            <button onClick={() => navigate(`/${currentLang}/${dashboardRoute}`)} className={styles.backButton}>
                {t('templateDetail.back')} 
            </button>
        </div>
    );

    const progressPercent = currentStep === 1 ? 50 : 100;

    return (
        <>
            {/* SEO Etiketleri */}
            <SEOHead dynamicTitle={template?.name || t('templateDetail.defaultTitle')} descKey="homePage.metaDescription" />
            <Helmet>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <div className={`${styles.workspaceContainer} ${styles.userFillContainer}`}>
                <div className={styles.workspaceHeader}>
                    <button onClick={() => navigate(`/${currentLang}/${dashboardRoute}`)} className={styles.backButton}>
                        <ArrowLeft size={18} /> {t('templateDetail.back')}
                    </button>
                    <div className={styles.headerTitles}>
                        <h1 className={styles.title}>{template.name}</h1>
                        {template.description && <p className={styles.description}>{template.description}</p>}
                    </div>
                </div>

                <div className={styles.stepperWrapper}>
                    <div className={`${styles.stepItem} ${currentStep === 1 ? styles.stepActive : ''}`}>
                        <div className={styles.stepNumber}>1</div>
                        <span>{t('templateDetail.stepFillForm')}</span> 
                    </div>
                    <div className={`${styles.stepConnector} ${currentStep === 2 ? styles.connectorDone : ''}`} />
                    <div className={`${styles.stepItem} ${currentStep === 2 ? styles.stepActive : styles.stepPassive}`}>
                        <div className={styles.stepNumber}>2</div>
                        <span>{t('templateDetail.stepReviewDownload')}</span> 
                    </div>
                </div>

                <div className={styles.progressBarContainer}>
                    <div className={styles.progressBar} style={{ width: `${progressPercent}%` }} />
                </div>

                <div className={styles.editorContainer}>
                    <div className={styles.formColumn}>
                        {currentStep === 1 && (
                            <div className={styles.formColumnHeader}>
                                <div className={styles.formStepTag}>{t('templateDetail.step1Tag')}</div>
                                <p className={styles.formColumnHint}>
                                    {t('templateDetail.step1Hint')}
                                </p>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className={styles.formOverlay} onClick={() => setShowBackWarning(true)}>
                                <div className={styles.overlayContent}>
                                    <CheckCircle2 size={32} className={styles.overlayIconSuccess} />
                                    <h4>{t('templateDetail.reviewDocument')}</h4>
                                    <p>{t('templateDetail.reviewDescription')}</p>
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
                                <div className={styles.emptyFormNotice}>{t('templateDetail.noFormFields')}</div>
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
                                                <span className={styles.btnMainText}>{t('templateDetail.nextStepReview')}</span>
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
                                    {isSubmitting ? t('templateDetail.processing') : t('templateDetail.downloadPdf')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showBackWarning && (
                    <div className={styles.modalOverlay} onClick={() => setShowBackWarning(false)}>
                        <div className={styles.warningModal} onClick={(e) => e.stopPropagation()}>
                            <AlertCircle size={48} className={styles.warningIcon} />
                            <h3>{t('templateDetail.backToFormTitle')}</h3>
                            <p>{t('templateDetail.backToFormWarning')}</p>
                            <div className={styles.warningActions}>
                                <button onClick={() => setShowBackWarning(false)} className={styles.cancelBtn}>{t('templateDetail.stayInPreview')}</button>
                                <button onClick={confirmGoBackToForm} className={styles.confirmBtn}>{t('templateDetail.goBackAnyway')}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default UserFillTemplate;