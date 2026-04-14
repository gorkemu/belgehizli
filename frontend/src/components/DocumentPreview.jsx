// frontend/src/components/DocumentPreview.jsx
import React, { useMemo } from 'react';
import styles from './DocumentPreview.module.css';
import Handlebars from 'handlebars';
import { FileSearch, FileText, Loader2, Edit3, Lock, Eye } from 'lucide-react';
import DOMPurify from 'dompurify';

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
        return dateString;
    }
}

if (!Handlebars.helpers.math) {
    Handlebars.registerHelper('math', function (lvalue, operator, rvalue) {
        lvalue = parseFloat(lvalue);
        rvalue = parseFloat(rvalue);
        return {
            '+': lvalue + rvalue, '-': lvalue - rvalue,
            '*': lvalue * rvalue, '/': lvalue / rvalue,
            '%': lvalue % rvalue
        }[operator];
    });

    Handlebars.registerHelper('eq', function (a, b) { return String(a) === String(b); });

    Handlebars.registerHelper('each_with_index', function (context, options) {
        let ret = "";
        if (context && context.length > 0) {
            for (let i = 0; i < context.length; i++) ret += options.fn({ ...context[i], '@index': i });
        } else {
            ret = options.inverse(this);
        }
        return ret;
    });

    Handlebars.registerHelper('gt', function (a, b) { return parseFloat(a) > parseFloat(b); });
    Handlebars.registerHelper('default', function (value, defaultValue) {
        return value !== undefined && value !== null && value !== '' ? value : defaultValue;
    });
    Handlebars.registerHelper('formatDate', formatDateHelper);
}

function prepareTemplateForHighlighting(templateStr) {
    if (!templateStr) return '';
    let processed = templateStr.replace(/\{\{\{(.*?)\}\}\}/g, `<mark class="${styles.dynamicHighlight}">{{{$1}}}</mark>`);
    processed = processed.replace(/\{\{(?![#\/!>{]|else\b)(.*?)\}\}/g, `<mark class="${styles.dynamicHighlight}">{{$1}}</mark>`);
    return processed;
}

const purifyConfig = {
    ALLOWED_TAGS: [
        'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
        'div', 'span', 'mark', 'table', 'tbody', 'td', 'tr', 'th', 'thead',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'u', 'strike', 'pre',
        'img', 'iframe'
    ],
    ALLOWED_ATTR: [
        'class', 'style', 'href', 'target',
        'src', 'alt', 'width', 'height',
        'data-youtube-video', 'allowfullscreen', 'frameborder',
        'containerstyle', 'wrapperstyle'
    ],
    FORBID_TAGS: ['script', 'style'],
    FORBID_ATTR: ['onerror', 'onload', 'onmouseover']
};

function DocumentPreview({ templateContent, formData, editorRef, currentStep }) {

    const safeHtml = useMemo(() => {
        if (!templateContent) return '';

        try {
            let templateToUse = templateContent;

            if (currentStep === 2) {
                templateToUse = prepareTemplateForHighlighting(templateContent);
            }

            const compiledTemplate = Handlebars.compile(templateToUse);
            const rawHtml = compiledTemplate(formData || {});

            return DOMPurify.sanitize(rawHtml, purifyConfig);

        } catch (error) {
            console.error("Şablon Derleme Hatası:", error);
            return `
                <div class="${styles.errorFallback}">
                    <h3>Sözdizimi Hatası (Syntax Error)</h3>
                    <p>Şablonunuzda kapatılmamış bir değişken <strong>{{ }}</strong> veya hatalı bir kurgu bulunuyor. Lütfen kontrol edip tekrar deneyin.</p>
                </div>
            `;
        }
    }, [templateContent, formData, currentStep]);

    if (!templateContent) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <Loader2 size={36} className={styles.spinner} />
                    <p>Önizleme verileri yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!formData) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <FileText size={48} className={styles.emptyIcon} />
                    <p>Belge önizlemesini görmek için sol taraftaki formu doldurmaya başlayabilirsiniz.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.previewHeader}>
                <FileSearch size={18} className={styles.headerIcon} />
                <h3 className={styles.previewTitle}>Belge Önizlemesi</h3>

                {currentStep === 1 ? (
                    <div className={styles.lockedBadge}>
                        <Lock size={14} /> Manuel Düzenleme Kapalı
                    </div>
                ) : (
                    <div className={styles.editBadge}>
                        <Edit3 size={14} /> Manuel Düzenleme Açık
                    </div>
                )}
            </div>

            {currentStep === 1 && (
                <div className={styles.step1Banner}>
                    <div className={styles.bannerIcon}>
                        <Eye size={20} />
                    </div>
                    <div className={styles.bannerContent}>
                        <strong>Canlı Önizleme Aktif</strong>
                        <p>Sol taraftaki forma girdiğiniz veriler eşzamanlı olarak bu alana yansıyacaktır. Manuel metin düzenlemelerini bir sonraki adımda yapabilirsiniz.</p>
                    </div>
                </div>
            )}

            <div className={styles.paperContainer}>
                <div
                    ref={editorRef}
                    className={styles.previewArea}
                    data-editable={currentStep === 2}
                    dangerouslySetInnerHTML={{ __html: safeHtml }}
                    contentEditable={currentStep === 2}
                    suppressContentEditableWarning={true}
                />
            </div>
        </div>
    );
}

export default DocumentPreview;