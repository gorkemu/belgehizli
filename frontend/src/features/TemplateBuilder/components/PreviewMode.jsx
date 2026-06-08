// frontend/src/features/TemplateBuilder/components/PreviewMode.jsx
import React, { useMemo, useEffect } from 'react'; 
import { useTranslation } from 'react-i18next';
import { useTemplateBuilder } from '../hooks/useTemplateBuilder';
import globalStyles from '../TemplateBuilder.module.css';
import sidebarStyles from './Sidebar/Sidebar.module.css';
import styles from './PreviewMode.module.css';
import { ArrowLeft, Edit3 } from 'lucide-react';
import Handlebars from 'handlebars';
import DOMPurify from 'dompurify';
import { convertToHandlebars } from '../utils/helpers';
import DocumentForm from '../../../components/DocumentForm';
import DocumentPreview from '../../../components/DocumentPreview';
import Button from '../../../components/ui/Button';

const PreviewMode = () => {
  const { t } = useTranslation();
  const {
    formData, virtualFormData, setVirtualFormData,
    previewStep, setPreviewStep, triggerSymbol, showToast, getCleanFields, setShowBackWarning,
    previewEditorRef 
  } = useTemplateBuilder();

  const validatePreviewForm = () => {
    const requiredFields = formData.fields.filter(f => f.required);
    for (let field of requiredFields) {
      if (field.condition && field.condition.field) {
        const depValue = virtualFormData[field.condition.field];
        if (depValue !== field.condition.value) continue;
      }
      const val = virtualFormData[field.name];
      if (val === undefined || val === null || val === '') return false;
      if (Array.isArray(val) && val.length === 0) return false;
    }
    return true;
  };

  const previewHtml = useMemo(() => {
    let html = formData.content || '';
    if (!html) return '';

    html = html.replace(/<div[^>]*style="[^"]*(margin:\s*0px auto|margin:\s*0px 0px 0px auto)[^"]*"[^>]*>([\s\S]*?)<img([^>]+)>([\s\S]*?)<\/div>/gi, (match, margin, before, imgAttrs, after) => {
      const alignClass = margin.includes('0px 0px 0px auto') ? 'tiptap-align-right' : 'tiptap-align-center';
      let newImgAttrs = imgAttrs;
      if (newImgAttrs.includes('class="')) {
        newImgAttrs = newImgAttrs.replace('class="', `class="${alignClass} `);
      } else {
        newImgAttrs = ` class="${alignClass}" ` + newImgAttrs;
      }
      return `<img${newImgAttrs}>`;
    });

    html = html.replace(/<div[^>]*style="display:\s*flex[^>]*>\s*(<img[^>]+>)\s*<\/div>/gi, "$1");

    const purifyConfig = {
      ALLOWED_TAGS: [
        'b', 'i', 'em', 'strong', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'img', 'table', 'tr', 'td', 'th',
        'tbody', 'thead', 'tfoot', 'hr', 'br', 'div', 'span', 'iframe', 'figure', 'figcaption'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'class', 'style', 'data-align', 'align',
        'data-background-color', 'width', 'height', 'allowfullscreen', 'frameborder', 'target'
      ],
      FORBID_TAGS: ['script'], KEEP_CONTENT: true
    };

    try {
      const hbHtml = convertToHandlebars(html, triggerSymbol);
      const template = Handlebars.compile(hbHtml);
      const finalHtml = template(virtualFormData || {});
      return DOMPurify.sanitize(finalHtml || '', purifyConfig);
    } catch (error) {
      console.error("Önizleme derleme hatası:", error);
      return DOMPurify.sanitize(html || '', purifyConfig);
    }
  }, [formData.content, virtualFormData, triggerSymbol]);

  useEffect(() => {
    if (previewStep === 1 && previewEditorRef.current?.commands) {
      previewEditorRef.current.commands.setContent(previewHtml);
    }
  }, [previewStep, previewHtml, previewEditorRef]);

  return (
    <div className={globalStyles.split}>
      <aside className={`${sidebarStyles.left} ${styles.previewSidebar}`}>
        <div className={sidebarStyles.panelHead}>
          <span className={sidebarStyles.panelTitle}>{t('templateBuilder.previewMode.testForm')}</span>
          <span className={styles.stepBadge}>{t('templateBuilder.previewMode.step', { current: previewStep })}</span>
        </div>

        <div className={styles.previewFormArea} style={{ opacity: previewStep === 2 ? 0.35 : 1, pointerEvents: previewStep === 2 ? 'none' : 'auto' }}>
          <div className={styles.previewFormInner}>
            {formData.fields.length > 0 ? (
              <DocumentForm templateFields={getCleanFields()} initialData={virtualFormData} onChange={setVirtualFormData} />
            ) : (
              <p className={styles.noFieldsText}>{t('templateBuilder.previewMode.noFields')}</p>
            )}
          </div>
        </div>

        <div className={styles.previewFooter}>
          {previewStep === 1 ? (
            <Button
              variant="primary"
              className={styles.pulseBtn}
              onClick={() => {
                if (validatePreviewForm()) {
                  setPreviewStep(2);
                } else {
                  showToast(t('templateBuilder.previewMode.fillRequired'), "error");
                }
              }}
              rightIcon={<ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />}
            >
              {t('templateBuilder.previewMode.reviewDocument')}
            </Button>
          ) : (
            <Button
              variant="secondary"
              className={styles.backFormBtn}
              onClick={() => setShowBackWarning('form')}
              leftIcon={<Edit3 size={16} />}
            >
              {t('templateBuilder.previewMode.backToForm')}
            </Button>
          )}
        </div>
      </aside>

      <main className={`${globalStyles.right} ${styles.previewMain}`}>
        <div className={`${globalStyles.canvas} ${styles.previewCanvas}`}>
          <div className={globalStyles.paper}>
            <DocumentPreview
              templateContent={previewHtml}
              formData={virtualFormData}
              editorRef={previewEditorRef} 
              currentStep={previewStep}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default PreviewMode;