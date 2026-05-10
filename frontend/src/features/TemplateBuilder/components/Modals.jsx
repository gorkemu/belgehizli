// frontend/src/features/TemplateBuilder/components/Modals.jsx
import React, { useState } from 'react';
import api from '../../../utils/api'; 
import Handlebars from 'handlebars';
import { useTranslation } from 'react-i18next';
import { useTemplateBuilder } from '../hooks/useTemplateBuilder';
import styles from '../TemplateBuilder.module.css';
import { Wand2, Zap, Link as LinkIcon, CheckCircle2, Copy, Printer, X, Sparkles, AlertCircle } from 'lucide-react';
import { VARIABLE_FORMATS } from '../utils/constants';
import { getTriggerSymbols, generateVarName, convertToHandlebars } from '../utils/helpers';
import Button from '../../../components/ui/Button';

const Modals = () => {
  const { t } = useTranslation();
  const { 
    formData, setFormData, editorInstance, showToast, 
    triggerSymbol, virtualFormData, setExpandedFields,
    magicModal, setMagicModal,
    mode, setMode,
    condModal, setCondModal,
    isShareModalOpen, setIsShareModalOpen,
    pdfConfirmModal, setPdfConfirmModal,
    showBackWarning, setShowBackWarning,
    previewStep, setPreviewStep
  } = useTemplateBuilder();

  // --- Local State for Modals ---
  const [condField, setCondField] = useState('');
  const [condValue, setCondValue] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const publicLink = `${window.location.origin}/f/${formData._id || 'preview'}`;

  // --- Handlers ---
  const copyToClipboard = () => { 
    navigator.clipboard.writeText(publicLink); 
    setIsCopied(true); 
    setTimeout(() => setIsCopied(false), 2000); 
  };

  const executeMagicExtract = () => {
    if (!editorInstance) return; 
    const format = VARIABLE_FORMATS.find(f => f.id === magicModal.selectedFormat); 
    if (!format) return;

    const currentHtml = editorInstance.getHTML(); 
    const matches = [...currentHtml.matchAll(format.regex)].map(m => m[1]); 
    const uniqueRawNames = [...new Set(matches)];
    
    if (uniqueRawNames.length === 0) { 
      showToast(t('templateBuilder.modals.magic.noVariablesFound', { format: format.ex }), "error"); 
      return; 
    }

    const newFields = []; 
    const existingVarNames = formData.fields.map(f => f.name);
    const sym = getTriggerSymbols(triggerSymbol);
    const normalizedHtml = currentHtml.replace(format.regex, (match, p1) => `${sym.s}${generateVarName(p1)}${sym.e}`);
    
    uniqueRawNames.forEach(rawName => {
      const cleanVarName = generateVarName(rawName);
      if (!existingVarNames.includes(cleanVarName) && !newFields.some(f => f.name === cleanVarName)) { 
        newFields.push({ id: Math.random().toString(36).substr(2, 9), name: cleanVarName, label: rawName.trim().toUpperCase(), fieldType: 'text', required: true, options: [], condition: null, nameEdited: true }); 
      }
    });

    if (newFields.length > 0) {
      setFormData(p => ({ ...p, fields: [...p.fields, ...newFields] })); 
      setExpandedFields(prev => [...prev, ...newFields.map(f => f.id)]);
      setTimeout(() => { const el = document.getElementById('field-list'); if (el) el.scrollTop = el.scrollHeight; }, 100);
    }
    
    editorInstance.commands.setContent(normalizedHtml); 
    setMagicModal({ show: false, selectedFormat: 'curly2' }); 
    showToast(t('templateBuilder.modals.magic.variablesDetected', { count: uniqueRawNames.length }), 'success');
  };

  const insertConditional = () => {
    if (!condField || !condValue) return showToast(t('templateBuilder.modals.conditional.selectBoth'), 'error');
    const html = `<p><strong style="color: #d97706;">[EĞER: ${condField} = ${condValue}]</strong></p><p>${t('templateBuilder.modals.conditional.placeholderText')}</p><p><strong style="color: #d97706;">[ŞART SONU]</strong></p><p></p>`;
    editorInstance?.chain().focus().insertContent(html).run();
    setCondModal(false); setCondField(''); setCondValue(''); 
    showToast(t('templateBuilder.modals.conditional.blockInserted'));
  };

  const handlePrintPDF = async () => {
    setIsGeneratingPdf(true); 
    showToast(t('templateBuilder.modals.pdf.preparing'), 'success');
    try {
      const hbHtml = convertToHandlebars(editorInstance.getHTML(), triggerSymbol);
      const template = Handlebars.compile(hbHtml);
      const finalHtml = template(virtualFormData);

      const targetId = formData._id || 'preview';
      
      const res = await api.post(`/projects/${targetId}/generate-pdf`,
        { html: finalHtml, documentName: formData.name || 'Sablon' },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a'); 
      link.href = url; 
      link.download = `${formData.name || 'Sablon'}.pdf`; 
      window.document.body.appendChild(link); 
      link.click(); 
      link.parentNode.removeChild(link);
      showToast(t('templateBuilder.modals.pdf.downloaded'));
    } catch (error) {
      console.error(error); 
      showToast(t('templateBuilder.modals.pdf.error'), 'error');
    } finally { 
      setIsGeneratingPdf(false); setPdfConfirmModal(false); 
    }
  };

  return (
    <>
      {/* SİHİRLİ ALGILAMA MODALI */}
      {magicModal.show && (
        <div className={styles.overlay} onClick={() => setMagicModal({ show: false })}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <div className={styles.modalIcon} style={{ background: 'var(--text-primary)', color: 'var(--bg-surface)', borderColor: 'var(--border)' }}><Wand2 size={20} /></div>
              <div>
                <h3>{t('templateBuilder.modals.magic.title')}</h3>
                <p>{t('templateBuilder.modals.magic.description')}</p>
              </div>
              <button className={styles.modalClose} onClick={() => setMagicModal({ show: false })}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formatGrid}>
                {VARIABLE_FORMATS.map(format => (
                  <button
                    key={format.id}
                    onClick={() => setMagicModal(p => ({ ...p, selectedFormat: format.id }))}
                    className={`${styles.formatOption} ${magicModal.selectedFormat === format.id ? styles.formatOptionActive : ''}`}
                  >
                    <b className={styles.formatEx}>{t(format.ex)}</b>
                    <span className={styles.formatLabel}>{t(format.label)}</span>
                  </button>
                ))}
              </div>
              <div className={styles.magicInfoBox}>
                <Sparkles size={14} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
                <p>{t('templateBuilder.modals.magic.infoBox')}</p>
              </div>
            </div>
            <div className={styles.modalFoot}>
              <Button variant="ghost" onClick={() => setMagicModal({ show: false })}>
                {t('templateBuilder.modals.cancel')}
              </Button>
              <Button variant="primary" onClick={executeMagicExtract}>
                {t('templateBuilder.modals.apply')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ŞARTLI BLOK MODALI */}
      {condModal && (
        <div className={styles.overlay} onClick={() => setCondModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <div className={styles.modalIcon} style={{ background: 'var(--accent-bg)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}><Zap size={20} /></div>
              <div>
                <h3>{t('templateBuilder.modals.conditional.title')}</h3>
                <p>{t('templateBuilder.modals.conditional.description')}</p>
              </div>
              <button className={styles.modalClose} onClick={() => setCondModal(false)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.fg}>
                <label>{t('templateBuilder.modals.conditional.whichQuestion')}</label>
                <select
                  className={styles.sel}
                  value={condField}
                  onChange={e => { setCondField(e.target.value); setCondValue(''); }}
                >
                  <option value="">{t('templateBuilder.modals.selectPlaceholder')}</option>
                  {formData.fields.filter(f => ['select', 'radio', 'checkbox'].includes(f.fieldType)).map(f => (
                    <option key={f.name} value={f.name}>{f.label || f.name}</option>
                  ))}
                </select>
              </div>
              {condField && (
                <div className={styles.fg}>
                  <label>{t('templateBuilder.modals.conditional.whichAnswer')}</label>
                  <select
                    className={styles.sel}
                    value={condValue}
                    onChange={e => setCondValue(e.target.value)}
                  >
                    <option value="">{t('templateBuilder.modals.selectPlaceholder')}</option>
                    {formData.fields.find(f => f.name === condField)?.options.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className={styles.modalFoot}>
              <Button variant="ghost" onClick={() => setCondModal(false)}>
                {t('templateBuilder.modals.cancel')}
              </Button>
              <Button variant="primary" disabled={!condField || !condValue} onClick={insertConditional}>
                {t('templateBuilder.modals.conditional.insertBlock')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* GENEL BAĞLANTI MODALI */}
      {isShareModalOpen && (
        <div className={styles.overlay} onMouseDown={() => setIsShareModalOpen(false)}>
          <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <div className={styles.modalIcon} style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}><LinkIcon size={20} /></div>
              <div>
                <h3>{t('templateBuilder.modals.share.title')}</h3>
                <p>{t('templateBuilder.modals.share.description')}</p>
              </div>
              <button className={styles.modalClose} onClick={() => setIsShareModalOpen(false)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.linkCopyBox} style={{ display: 'flex', gap: '8px', background: 'var(--bg-input)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <input type="text" readOnly value={publicLink} style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontFamily: 'monospace' }} />
                <Button 
                  variant="primary" 
                  onClick={copyToClipboard} 
                  leftIcon={isCopied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  style={{ flex: 'none' }} 
                >
                  {isCopied ? t('templateBuilder.modals.share.copied') : t('templateBuilder.modals.share.copy')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF ONAY MODALI */}
      {pdfConfirmModal && (
        <div className={styles.overlay} onClick={() => setPdfConfirmModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <div className={styles.modalIcon} style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}><Printer size={20} /></div>
              <div>
                <h3>{t('templateBuilder.modals.pdf.title')}</h3>
                <p>{t('templateBuilder.modals.pdf.description')}</p>
              </div>
              <button className={styles.modalClose} onClick={() => setPdfConfirmModal(false)}><X size={18} /></button>
            </div>
            <div className={styles.modalFoot}>
              <Button variant="ghost" onClick={() => setPdfConfirmModal(false)}>
                {t('templateBuilder.modals.cancel')}
              </Button>
              <Button variant="primary" isLoading={isGeneratingPdf} onClick={handlePrintPDF}>
                {t('templateBuilder.modals.pdf.confirmAndDownload')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* İKİ FONKSİYONLU UYARI MODALI */}
      {showBackWarning !== null && (
        <div className={styles.overlay} onClick={() => setShowBackWarning(null)}>
          <div className={styles.warningModal} onClick={(e) => e.stopPropagation()}>
            <AlertCircle size={40} className={styles.warningIcon} />
            
            <h3>
              {showBackWarning === 'build'
                ? t('templateBuilder.modals.backWarning.returnToDesign')
                : t('templateBuilder.modals.backWarning.returnToForm')}
            </h3>
            
            <p>
              {showBackWarning === 'build'
                ? t('templateBuilder.modals.backWarning.designWarning')
                : previewStep === 2
                  ? t('templateBuilder.modals.backWarning.previewEditsLost')
                  : t('templateBuilder.modals.backWarning.previewInterrupted')}
            </p>
            
            <div className={styles.warningActions}>
              <Button variant="ghost" onClick={() => setShowBackWarning(null)}>
                {t('templateBuilder.modals.backWarning.stayInPreview')}
              </Button>
              
              <Button variant="danger" onClick={() => {
                if (showBackWarning === 'build') {
                  setMode('build');
                  setPreviewStep(1);
                } else {
                  setPreviewStep(1);
                }
                setShowBackWarning(null);
              }}>
                {t('templateBuilder.modals.backWarning.goBackAnyway')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Modals;