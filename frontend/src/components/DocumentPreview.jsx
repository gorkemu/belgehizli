// frontend/src/components/DocumentPreview.jsx
import React from 'react'; 
import styles from './DocumentPreview.module.css';
import Handlebars from 'handlebars';
import { FileSearch, AlertTriangle, FileText, Loader2 } from 'lucide-react'; 

// --- DATE FORMAT HELPER ---
function formatDateHelper(dateString) {
    if (!dateString || typeof dateString !== 'string') return ''; 
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; 

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); 
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return dateString; 
    }
}

// Handlebars helpers 
try {
    Handlebars.registerHelper('math', function (lvalue, operator, rvalue) {
        lvalue = parseFloat(lvalue);
        rvalue = parseFloat(rvalue);
        return {
            '+': lvalue + rvalue, '-': lvalue - rvalue,
            '*': lvalue * rvalue, '/': lvalue / rvalue,
            '%': lvalue % rvalue
        }[operator];
    });

    Handlebars.registerHelper('eq', function (a, b) {
        return String(a) === String(b);
    });

    Handlebars.registerHelper('each_with_index', function(context, options) {
        let ret = "";
        if (context && context.length > 0) {
            for(let i=0; i<context.length; i++) {
                 ret = ret + options.fn({...context[i], '@index': i});
            }
        } else {
            ret = options.inverse(this); 
        }
        return ret;
    });

    Handlebars.registerHelper('gt', function (a, b) {
        return parseFloat(a) > parseFloat(b);
    });

    Handlebars.registerHelper('default', function (value, defaultValue) {
        return value !== undefined && value !== null && value !== '' ? value : defaultValue;
    });

    Handlebars.registerHelper('formatDate', formatDateHelper); 

} catch (e) {
    console.error("Handlebars helper kaydedilirken hata:", e);
}

function DocumentPreview({ templateContent, formData }) {

    // Şablon yüklenirken gösterilecek durum
    if (!templateContent) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <Loader2 size={40} className={styles.spinner} />
                    <p>Önizleme için şablon içeriği yükleniyor...</p>
                </div>
            </div>
        );
    }

    // Form verisi beklenirken gösterilecek durum
    if (!formData) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <FileText size={48} className={styles.emptyIcon} />
                    <p>Belgeyi önizlemek için lütfen sol taraftaki formu doldurmaya başlayın.</p>
                </div>
            </div>
        );
    }

    try {
        const template = Handlebars.compile(templateContent);
        const previewHtml = template(formData); 

        return (
            <div className={styles.container}>
                <div className={styles.previewHeader}>
                    <FileSearch size={20} className={styles.headerIcon} />
                    <h3 className={styles.previewTitle}>Canlı Önizleme</h3>
                </div>

                <div className={styles.paperContainer}>
                    <div 
                        className={styles.previewArea} 
                        dangerouslySetInnerHTML={{ __html: previewHtml }} 
                    />
                </div>
            </div>
        );
    } catch (error) {
        console.error("Handlebars şablonunu derlerken/işlerken hata oluştu (Frontend):", error);
        return (
            <div className={styles.container}>
                 <div className={styles.previewHeader}>
                    <AlertTriangle size={20} className={styles.errorIconHeader} />
                    <h3 className={styles.previewTitleError}>Önizleme Hatası</h3>
                 </div>
                 <div className={styles.previewError}>
                     <p><strong>Önizleme oluşturulurken bir hata meydana geldi.</strong></p>
                     <p className={styles.errorMessageText}>{error.message}</p>
                     <p className={styles.errorHint}>
                        Lütfen şablon içeriğini ve form verilerini kontrol edin. Handlebars sözdizimi hatalı veya eksik olabilir.
                     </p>
                </div>
             </div>
        );
    }
}

export default DocumentPreview;