// frontend/src/features/TemplateBuilder/components/PreviewMode.jsx
import React, { useMemo, useRef, useEffect } from 'react';
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
  const {
    formData, virtualFormData, setVirtualFormData,
    previewStep, setPreviewStep, triggerSymbol, showToast, getCleanFields, setShowBackWarning
  } = useTemplateBuilder();

  const previewEditorRef = useRef(null);

  
  // Form doğrulama
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

  // Anlık HTML Derleme (Handlebars ile)
  const previewHtml = useMemo(() => {
    let html = formData.content || '';
    if (!html) return '';

    // Tiptap resim hizalama düzeltmeleri
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
    // Kullanıcı Forma (Adım 1) geri döndüğünde, editörün içini orijinal HTML ile ez
    if (previewStep === 1 && previewEditorRef.current?.commands) {
      previewEditorRef.current.commands.setContent(previewHtml);
    }
  }, [previewStep, previewHtml]);

  return (
    <div className={globalStyles.split}>
      <aside className={sidebarStyles.left} style={{ background: 'var(--bg-sidebar)', display: 'flex', flexDirection: 'column' }}>
        <div className={sidebarStyles.panelHead}>
          <span className={sidebarStyles.panelTitle}>Test formu</span>
          <span className={styles.stepBadge}>Adım {previewStep}/2</span>
        </div>

        <div style={{ opacity: previewStep === 2 ? 0.35 : 1, pointerEvents: previewStep === 2 ? 'none' : 'auto', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '20px' }}>
            {formData.fields.length > 0 ? (
              <DocumentForm templateFields={getCleanFields()} initialData={virtualFormData} onChange={setVirtualFormData} />
            ) : <p style={{ color: 'var(--text-muted)' }}>Test edilecek alan yok.</p>}
          </div>
        </div>

        <div className={styles.previewFooter}>
          {previewStep === 1 ? (
            <Button
              variant="primary"
              className={styles.pulseBtn}
              onClick={() => {
                if (validatePreviewForm()) { setPreviewStep(2); }
                else { showToast("Lütfen tüm zorunlu alanları doldurun.", "error"); }
              }}
              rightIcon={<ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />}
            >
              Belgeyi İncele
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => setShowBackWarning('form')}
              leftIcon={<Edit3 size={16} />}
            >
              Forma Dön ve Düzenle
            </Button>
          )}
        </div>
      </aside>

      <main className={globalStyles.right} style={{ padding: '40px', alignItems: 'center', overflowY: 'auto' }}>
        <div className={globalStyles.canvas} style={{ width: '100%', padding: '0 40px' }}>
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