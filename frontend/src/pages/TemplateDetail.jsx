// frontend/src/pages/TemplateDetail.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { PostDownloadModal } from '../components/PostDownloadModal';
import axios from 'axios';
import styles from './TemplateDetail.module.css';
import DocumentForm from '../components/DocumentForm';
import DocumentPreview from '../components/DocumentPreview';
import { Helmet } from 'react-helmet-async';
import {
    ArrowLeft, CheckCircle2, AlertCircle, Download,
    Loader2, X, ArrowDown, Edit2, ArrowRight, FileText, CheckSquare
} from 'lucide-react';

function TemplateDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

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
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
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

        axios.get(`${API_BASE_URL}/sablonlar/detay/${slug}`)
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
                setError(error.response?.status === 404 ? 'Şablon bulunamadı.' : 'Şablon yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin.');
                setLoading(false);
            });
    }, [slug]);

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
            {
                root: null,
                rootMargin: '-100px 0px 0px 0px',
                threshold: 0.1
            }
        );

        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
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

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
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

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
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

        if (!agreedToTerms) {
            detectedError = 'Lütfen indirme işlemine geçmeden önce Kullanım Şartları ve Gizlilik Politikası\'nı onaylayın.';
        }

        if (!detectedError && !formRef.current) {
            detectedError = "Form verileri doğrulanamadı. Lütfen sayfayı yenileyin.";
        }

        if (!detectedError && formRef.current) {
            const isDocumentFormValid = await formRef.current.handleSubmit();
            if (!isDocumentFormValid) {
                detectedError = 'Lütfen formdaki zorunlu alanları doldurun veya hatalı girişleri düzeltin.';
            }
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
                email: formData?.belge_email || '',
                consentTimestamp: new Date().toISOString(),
            };

            const response = await axios.post(`${API_BASE_URL}/templates/${template._id}/generate-document`, backendPayload, {
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

            let message = 'İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.';

            if (error.response?.status === 429) {
                message = 'Çok fazla istek yapıldı, lütfen kısa bir süre bekleyip tekrar deneyin.';
            } else if (error.response?.status === 500) {
                message = 'Sunucu kaynaklı bir hata oluştu, lütfen daha sonra tekrar deneyin.';
            } else if (error.code === 'ERR_NETWORK') {
                message = 'Lütfen internet bağlantınızı kontrol edip tekrar deneyin.';
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
                <p>Şablon hazırlanıyor...</p>
            </div>
        );
    }

    if (error) return (
        <div className={styles.errorScreen}>
            <AlertCircle size={48} />
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Sayfayı Yenile</button>
        </div>
    );
    if (!template) return null;

    const progressPercent = currentStep === 1 ? 50 : 100;

    return (
        <div className={styles.root}>
            <Helmet>
                <title>{template.name ? `${template.name} - Belge Hızlı` : 'Şablon Doldur'}</title>
            </Helmet>

            <div className={styles.workspaceContainer}>
                <div className={styles.workspaceHeader}>
                    <button onClick={() => navigate(-1)} className={styles.backButton}>
                        <ArrowLeft size={16} /> Geri Dön
                    </button>
                    <div className={styles.headerTitles}>
                        <div className={styles.freeBadge}>
                            <FileText size={14} /> Açık Kütüphane Şablonu
                        </div>
                        <h1 className={styles.title}>{template.name}</h1>
                        <p className={styles.description}>{template.description}</p>
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
                        <span>İncele ve İndir</span>
                    </div>
                </div>

                <div className={styles.progressBarContainer}>
                    <div className={styles.progressBar} style={{ width: `${progressPercent}%` }} />
                </div>

                <div className={styles.editorContainer}>
                    <div className={styles.formColumn}>
                        {currentStep === 1 && (
                            <div className={styles.formColumnHeader}>
                                <div className={styles.formStepTag}>Adım 1</div>
                                <p className={styles.formColumnHint}>
                                    İlgili alanları doldurun, sağ taraftaki önizlemede belgenizi görün. Gerekli yerleri tamamladıktan sonra <strong>“Sonraki Adım”</strong> ile önizleme moduna geçebilirsiniz.
                                </p>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className={styles.formOverlay} onClick={() => setShowBackWarning(true)}>
                                <div className={styles.overlayContent}>
                                    <div className={styles.overlayStep}>Adım 2</div>
                                    <CheckSquare size={32} className={styles.overlayIconSuccess} />
                                    <h4>Belgenizi İnceleyin</h4>
                                    <p>Sağdaki önizleme üzerinden son manuel düzenlemelerinizi yapabilir ve PDF olarak indirebilirsiniz.</p>
                                </div>
                            </div>
                        )}

                        <div className={currentStep === 2 ? styles.blurredForm : ''}>
                            {template.fields && template.fields.length > 0 ? (
                                <DocumentForm
                                    templateFields={template.fields}
                                    onChange={handleFormChange}
                                    onValidChange={handleFormValidityChange}
                                    ref={formRef}
                                    initialData={formData}
                                />
                            ) : (
                                <div className={styles.emptyFormNotice}>Bu şablon için doldurulacak özel bir form alanı bulunmamaktadır.</div>
                            )}

                            {currentStep === 1 && (
                                <div className={`${styles.step1ActionContainer} ${isMobile ? styles.stickyMobileButton : ''}`}>
                                    <div className={styles.progressHint}>
                                        <CheckCircle2 size={16} className={styles.progressIcon} />
                                        Zorunlu alanları doldurduktan sonra ilerleyebilirsiniz.
                                    </div>
                                    <button
                                        onClick={handleNextStep}
                                        disabled={!isFormValid}
                                        className={`${styles.nextStepButton} ${!isFormValid ? styles.disabledButton : ''}`}
                                    >
                                        <span className={styles.btnInner}>
                                            <Edit2 size={20} />
                                            <span>
                                                <span className={styles.btnMainText}>Sonraki Adım: İncele</span>
                                                <span className={styles.btnSubText}>Belgeyi kontrol edip indirebilirsiniz</span>
                                            </span>
                                        </span>
                                        <ArrowRight size={18} className={styles.btnArrow} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.previewColumn} ref={previewRef} data-locked={currentStep === 1 ? "true" : "false"}>
                        {template.content ? (
                            <>
                                <DocumentPreview
                                    templateContent={template.content}
                                    formData={formData}
                                    editorRef={editorRef}
                                    currentStep={currentStep}
                                />
                                {currentStep === 2 && (
                                    <div className={styles.previewNotes}>
                                        <p className={styles.secureNote}>Önizleme üzerinde yaptığınız tüm manuel düzenlemeler doğrudan PDF dosyasına yansıtılacaktır.</p>
                                        <p className={styles.highlightNote}>
                                            Sarı renkli değişken vurguları yalnızca kontrol amaçlıdır, indirilen dosyada görünmez.
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className={styles.emptyPreviewNotice}>Önizleme içeriği tanımlanmamış.</div>
                        )}
                    </div>
                </div>

                {currentStep === 2 && (
                    <div className={styles.actionSection}>
                        <div className={styles.checkoutSection}>
                            <label className={styles.termsCheckboxContainer}>
                                <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className={styles.checkboxInput} />
                                <span className={styles.termsLabel}>
                                    <Link to="/kullanim-sartlari" target="_blank" className={styles.termsLink}>Kullanım Şartları</Link>'nı
                                    ve <Link to="/gizlilik-politikasi" target="_blank" className={styles.termsLink}>Gizlilik Politikası</Link>'nı okudum.
                                </span>
                            </label>

                            {downloadError && (
                                <div className={styles.paymentError}><AlertCircle size={16} /> {downloadError}</div>
                            )}

                            <div className={styles.ctaWrapper}>
                                <button
                                    onClick={handleDownload}
                                    disabled={loadingDownload || !agreedToTerms}
                                    className={`${styles.payDownloadButton} ${(loadingDownload || !agreedToTerms) ? styles.disabledButton : ''}`}
                                >
                                    <Download size={18} />
                                    {loadingDownload ? 'Belge İşleniyor...' : 'PDF Olarak İndir'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showBackWarning && (
                <div className={styles.modalOverlay} onClick={() => setShowBackWarning(false)}>
                    <div className={styles.warningModal} onClick={(e) => e.stopPropagation()}>
                        <AlertCircle size={40} className={styles.warningIcon} />
                        <h3>Forma Geri Dön?</h3>
                        <p>Eğer forma geri dönerseniz <strong>canlı önizleme üzerinde manuel olarak</strong> yaptığınız metin düzenlemeleri silinecektir.</p>
                        <div className={styles.warningActions}>
                            <button onClick={() => setShowBackWarning(false)} className={styles.cancelBtn}>Önizlemede Kal</button>
                            <button onClick={confirmGoBackToForm} className={styles.confirmBtn}>Yine De Dön</button>
                        </div>
                    </div>
                </div>
            )}

            {isMobile && !isNoticeDismissed && isNoticeVisibleByScroll && currentStep === 1 && (
                <div className={styles.mobilePreviewNotice} onClick={scrollToPreview}>
                    <div className={styles.noticeIconCircle}><ArrowDown size={16} className={styles.noticeIcon} /></div>
                    <span className={styles.noticeText}>Canlı önizleme aşağıda</span>
                    <button onClick={(e) => { e.stopPropagation(); setIsNoticeDismissed(true); }} className={styles.noticeCloseBtn} aria-label="Kapat"><X size={14} /></button>
                </div>
            )}

            <PostDownloadModal
                isOpen={isConversionModalOpen}
                onClose={() => setIsConversionModalOpen(false)}
                isLoggedIn={!!user}
            />
        </div>
    );
}

export default TemplateDetail;