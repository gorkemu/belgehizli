// frontend/src/pages/TemplateDetail.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { PostDownloadModal } from '../components/PostDownloadModal';
import api from '../utils/api'; 
import styles from './TemplateDetail.module.css';
import DocumentForm from '../components/DocumentForm';
import DocumentPreview from '../components/DocumentPreview';
import { SEOHead } from '../components/SEOHead'; 
import {
    ArrowLeft, CheckCircle2, AlertCircle, Download,
    Loader2, X, ArrowDown, Edit2, ArrowRight, FileText, CheckSquare
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { getUserFriendlyMessage } from '../utils/getUserFriendlyMessage';

function TemplateDetail() {
    const { t } = useTranslation();
    const { slug, lang } = useParams(); 
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const currentLang = lang || 'tr'; 

    // Dinamik Rotalar
    const termsRoute = currentLang === 'tr' ? 'kullanim-sartlari' : 'terms-of-service';
    const privacyRoute = currentLang === 'tr' ? 'gizlilik-politikasi' : 'privacy-policy';

    const formRef = useRef(null);
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({});
    const [formErrors, setFormErrors] = useState({});
    const [loadingDownload, setLoadingDownload] = useState(false);
    const [downloadError, setDownloadError] = useState(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);

    const previewRef = useRef(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isNoticeVisibleByScroll, setIsNoticeVisibleByScroll] = useState(true);
    const [isNoticeDismissed, setIsNoticeDismissed] = useState(false);
    const editorRef = useRef(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [showBackWarning, setShowBackWarning] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [autoSaveVisible, setAutoSaveVisible] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(null);
        setDownloadError(null);
        setIsConversionModalOpen(false);
        setCurrentStep(1);

        api.get(`/sablonlar/detay/${slug}`)
            .then(response => {
                setTemplate(response.data);

                const savedFormData = localStorage.getItem(`belgehizli-autosave-${slug}`);
                let initialData = {};

                if (savedFormData) {
                    try {
                        initialData = JSON.parse(savedFormData);
                    } catch (e) {
                        console.error("Hafızadaki veri okunamadı", e);
                    }
                }

                setFormData(initialData);
                setFormErrors({});
                setAgreedToTerms(false);
                setLoading(false);
            })
            .catch(error => {
                if (error.response?.status === 404) {
                    setError(t('templateDetail.notFound'));
                } else {
                    const message = getUserFriendlyMessage(
                        error.response?.data,
                        'templateDetail.loadError',
                        t
                    );
                    setError(message);
                }
                setLoading(false);
            });
    }, [slug, t]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const currentRef = previewRef.current;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsNoticeVisibleByScroll(false);
                }
                else if (entry.boundingClientRect.top > 0) {
                    setIsNoticeVisibleByScroll(true);
                }
                else {
                    setIsNoticeVisibleByScroll(false);
                }
            },
            { root: null, rootMargin: '-100px 0px 0px 0px', threshold: 0.1 }
        );

        if (currentRef) observer.observe(currentRef);
        return () => { if (currentRef) observer.unobserve(currentRef); };
    }, [template]);

    useEffect(() => {
        if (formData && Object.keys(formData).length > 0) {
            const handler = setTimeout(() => {
                localStorage.setItem(`belgehizli-autosave-${slug}`, JSON.stringify(formData));
                setAutoSaveVisible(true);
                setTimeout(() => setAutoSaveVisible(false), 2000);
            }, 500);
            return () => clearTimeout(handler);
        }
    }, [formData, slug]);

    useEffect(() => {
        if (currentStep === 2 && editorRef.current) {
            setTimeout(() => editorRef.current.focus(), 100);
        }
    }, [currentStep]);

    const scrollToPreview = () => {
        if (previewRef.current) {
            const headerOffset = 95;
            const elementPosition = previewRef.current.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
    };

    const handleFormChange = (newFormData, errors) => {
        setFormData(newFormData);
        setFormErrors(errors);
    };

    const handleFormValidityChange = (valid) => {
        setIsFormValid(valid);
    };

    const handleNextStep = async () => {
        let isFormValidLocal = true;
        if (formRef.current) {
            isFormValidLocal = await formRef.current.handleSubmit();
        }

        if (isFormValidLocal) {
            setCurrentStep(2);
            if (window.innerWidth <= 1024 && previewRef.current) {
                setTimeout(() => {
                    const headerOffset = 95;
                    const elementPosition = previewRef.current.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.scrollY - headerOffset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }, 50);
            }
        }
    };

    const confirmGoBackToForm = () => {
        setCurrentStep(1);
        setShowBackWarning(false);
    };

    const handleDownload = async () => {
        let detectedError = null;

        if (!agreedToTerms) detectedError = t('templateDetail.termsNotAccepted');
        if (!detectedError && !formRef.current) detectedError = t('templateDetail.formValidationFailed');
        if (!detectedError && formRef.current) {
            const isDocumentFormValid = await formRef.current.handleSubmit();
            if (!isDocumentFormValid) detectedError = t('templateDetail.fillRequiredFields');
        }

        if (detectedError) {
            setDownloadError(detectedError);
            return;
        }

        setDownloadError(null);
        setLoadingDownload(true);

        try {
            let finalEditedHtml = null;
            if (editorRef.current) {
                let rawHtml = editorRef.current.innerHTML;
                finalEditedHtml = rawHtml.replace(/<mark[^>]*>/gi, '').replace(/<\/mark>/gi, '');
            }

            const backendPayload = {
                formData,
                editedHtml: finalEditedHtml,
                email: formData?.belge_email || formData?.document_email || '',
                consentTimestamp: new Date().toISOString(),
            };

            const response = await api.post(`/templates/${template._id}/generate-document`, backendPayload, {
                responseType: 'blob'
            });

            const formatFilename = (text) => {
                if (!text) return 'belge';
                return text
                    .replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ş/g, 'S')
                    .replace(/I/g, 'I').replace(/İ/g, 'I').replace(/Ö/g, 'O')
                    .replace(/Ç/g, 'C').replace(/ğ/g, 'g').replace(/ü/g, 'u')
                    .replace(/ş/g, 's').replace(/ı/g, 'i').replace(/i/g, 'i')
                    .replace(/ö/g, 'o').replace(/ç/g, 'c')
                    .replace(/\s+/g, '_')
                    .replace(/[^a-zA-Z0-9._-]/g, '');
            };

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            const filename = template?.name ? `${formatFilename(template.name)}.pdf` : 'belge.pdf';

            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            localStorage.removeItem(`belgehizli-autosave-${slug}`);

            setTimeout(() => {
                setIsConversionModalOpen(true);
            }, 800);

            setDownloadError(null);

        } catch (error) {
            console.error('İndirme hatası:', error);

            let message = getUserFriendlyMessage(
                error.response?.data,
                'templateDetail.downloadError',
                t
            );

            if (message === t('templateDetail.downloadError')) {
                if (error.response?.status === 429) message = t('templateDetail.tooManyRequests');
                else if (error.response?.status === 500) message = t('templateDetail.serverError');
                else if (error.code === 'ERR_NETWORK') message = t('templateDetail.networkError');
            }
            setDownloadError(message);
        } finally {
            setLoadingDownload(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.statusContainer}>
                <Loader2 size={40} className={styles.spinner} />
                <p>{t('templateDetail.preparing')}</p>
            </div>
        );
    }

    if (error) return (
        <div className={styles.errorScreen}>
            <AlertCircle size={48} />
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>{t('templateDetail.refreshPage')}</button>
        </div>
    );
    if (!template) return null;

    const progressPercent = currentStep === 1 ? 50 : 100;

    return (
        <div className={styles.root}>
            <SEOHead 
                dynamicTitle={template.name ? `${template.name}` : t('templateDetail.defaultTitle')} 
                descKey="templateList.metaDescription" 
            />

            <div className={styles.workspaceContainer}>
                <div className={styles.workspaceHeader}>
                    <Button variant="secondary" onClick={() => navigate(-1)} leftIcon={<ArrowLeft size={16} />} className={styles.backButton}>
                        {t('templateDetail.back')}
                    </Button>
                    <div className={styles.headerTitles}>
                        <div className={styles.freeBadge}>
                            <FileText size={14} /> {t('templateDetail.publicTemplateBadge')}
                        </div>
                        <h1 className={styles.title}>{template.name}</h1>
                        <p className={styles.description}>{template.description}</p>
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
                                <p className={styles.formColumnHint}>{t('templateDetail.step1Hint')}</p>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className={styles.formOverlay} onClick={() => setShowBackWarning(true)}>
                                <div className={styles.overlayContent}>
                                    <div className={styles.overlayStep}>{t('templateDetail.step2Tag')}</div>
                                    <CheckSquare size={32} className={styles.overlayIconSuccess} />
                                    <h4>{t('templateDetail.reviewDocument')}</h4>
                                    <p>{t('templateDetail.reviewDescription')}</p>
                                </div>
                            </div>
                        )}

                        <div className={currentStep === 2 ? styles.blurredForm : ''}>
                            {template.fields && template.fields.length > 0 ? (
                                <DocumentForm templateFields={template.fields} onChange={handleFormChange} onValidChange={handleFormValidityChange} ref={formRef} initialData={formData} />
                            ) : (
                                <div className={styles.emptyFormNotice}>{t('templateDetail.noFormFields')}</div>
                            )}

                            {currentStep === 1 && (
                                <div className={`${styles.step1ActionContainer} ${isMobile ? styles.stickyMobileButton : ''}`}>
                                    <div className={styles.progressHint}>
                                        <CheckCircle2 size={16} className={styles.progressIcon} />
                                        {t('templateDetail.fillRequiredHint')}
                                    </div>
                                    <Button variant="primary" size="lg" onClick={handleNextStep} disabled={!isFormValid} fullWidth={isMobile} leftIcon={<Edit2 size={20} />} rightIcon={<ArrowRight size={18} />}>
                                        {t('templateDetail.nextStepReview')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.previewColumn} ref={previewRef} data-locked={currentStep === 1 ? "true" : "false"}>
                        {template.content ? (
                            <>
                                <DocumentPreview templateContent={template.content} formData={formData} editorRef={editorRef} currentStep={currentStep} />
                                {currentStep === 2 && (
                                    <div className={styles.previewNotes}>
                                        <p className={styles.secureNote}>{t('templateDetail.manualEditsNote')}</p>
                                        <p className={styles.highlightNote}>{t('templateDetail.highlightNote')}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className={styles.emptyPreviewNotice}>{t('templateDetail.noPreviewContent')}</div>
                        )}
                    </div>
                </div>

                {currentStep === 2 && (
                    <div className={styles.actionSection}>
                        <div className={styles.checkoutSection}>
                            <label className={styles.termsCheckboxContainer}>
                                <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className={styles.checkboxInput} />
                                <span className={styles.termsLabel}>
                                    {t('templateDetail.termsPrefix')}
                                    <Link to={`/${currentLang}/${termsRoute}`} target="_blank" className={styles.termsLink}>{t('templateDetail.termsOfService')}</Link>
                                    {' '}{t('templateDetail.and')}{' '}
                                    <Link to={`/${currentLang}/${privacyRoute}`} target="_blank" className={styles.termsLink}>{t('templateDetail.privacyPolicy')}</Link>
                                    {t('templateDetail.termsSuffix')}
                                </span>
                            </label>

                            {downloadError && (
                                <div className={styles.paymentError}><AlertCircle size={16} /> {downloadError}</div>
                            )}

                            <div className={styles.ctaWrapper}>
                                <Button variant="primary" size="lg" onClick={handleDownload} disabled={!agreedToTerms} isLoading={loadingDownload} leftIcon={!loadingDownload && <Download size={18} />}>
                                    {loadingDownload ? t('templateDetail.processing') : t('templateDetail.downloadPdf')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showBackWarning && (
                <div className={styles.modalOverlay} onClick={() => setShowBackWarning(false)}>
                    <div className={styles.warningModal} onClick={(e) => e.stopPropagation()}>
                        <AlertCircle size={40} className={styles.warningIcon} />
                        <h3>{t('templateDetail.backToFormTitle')}</h3>
                        <p>{t('templateDetail.backToFormWarning')}</p>
                        <div className={styles.warningActions}>
                            <Button variant="secondary" onClick={() => setShowBackWarning(false)}>{t('templateDetail.stayInPreview')}</Button>
                            <Button variant="danger" onClick={confirmGoBackToForm}>{t('templateDetail.goBackAnyway')}</Button>
                        </div>
                    </div>
                </div>
            )}

            {isMobile && !isNoticeDismissed && isNoticeVisibleByScroll && currentStep === 1 && (
                <div className={styles.mobilePreviewNotice} onClick={scrollToPreview}>
                    <div className={styles.noticeIconCircle}><ArrowDown size={16} className={styles.noticeIcon} /></div>
                    <span className={styles.noticeText}>{t('templateDetail.livePreviewBelow')}</span>
                    <button onClick={(e) => { e.stopPropagation(); setIsNoticeDismissed(true); }} className={styles.noticeCloseBtn} aria-label={t('templateDetail.close')}><X size={14} /></button>
                </div>
            )}

            <PostDownloadModal isOpen={isConversionModalOpen} onClose={() => setIsConversionModalOpen(false)} isLoggedIn={!!user} />
        </div>
    );
}

export default TemplateDetail;