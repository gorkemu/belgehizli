import React, { useState } from 'react';
import axios from 'axios';
import Handlebars from 'handlebars';
import { useTemplateBuilder } from '../hooks/useTemplateBuilder';
import styles from '../TemplateBuilder.module.css';
import { Wand2, Zap, Link as LinkIcon, CheckCircle2, Copy, Printer, X, Sparkles } from 'lucide-react';
import { VARIABLE_FORMATS } from '../utils/constants';
import { getTriggerSymbols, generateVarName, convertToHandlebars } from '../utils/helpers';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const Modals = () => {
  const { 
    formData, setFormData, editorInstance, showToast, 
    triggerSymbol, virtualFormData, setExpandedFields,
    magicModal, setMagicModal,
    condModal, setCondModal,
    isShareModalOpen, setIsShareModalOpen,
    pdfConfirmModal, setPdfConfirmModal
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
      showToast(`Belgede "${format.ex}" formatında değişken bulunamadı.`, "error"); 
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
    showToast(`${uniqueRawNames.length} değişken algılandı! ✨`, 'success');
  };

  const insertConditional = () => {
    if (!condField || !condValue) return showToast('Değişkeni ve değeri seçin.', 'error');
    const html = `<p><strong style="color: #d97706;">[EĞER: ${condField} = ${condValue}]</strong></p><p>Buraya şartlı metninizi yazın...</p><p><strong style="color: #d97706;">[ŞART SONU]</strong></p><p></p>`;
    editorInstance?.chain().focus().insertContent(html).run();
    setCondModal(false); setCondField(''); setCondValue(''); 
    showToast('Şartlı blok eklendi.');
  };

  const handlePrintPDF = async () => {
    setIsGeneratingPdf(true); showToast('PDF hazırlanıyor...', 'success');
    try {
      const token = localStorage.getItem('user_token');
      const hbHtml = convertToHandlebars(editorInstance.getHTML(), triggerSymbol);
      const template = Handlebars.compile(hbHtml);
      const finalHtml = template(virtualFormData);

      const targetId = formData._id || 'preview';
      const res = await axios.post(`${API_BASE_URL}/projects/${targetId}/generate-pdf`,
        { html: finalHtml, documentName: formData.name || 'Sablon' },
        { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a'); 
      link.href = url; 
      link.download = `${formData.name || 'Sablon'}.pdf`; 
      window.document.body.appendChild(link); 
      link.click(); 
      link.parentNode.removeChild(link);
      showToast('PDF başarıyla indirildi!');
    } catch (error) {
      console.error(error); showToast('PDF oluşturulurken hata!', 'error');
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
              <div><h3>Sihirli Algılama</h3><p>Belgenizde daha önceden kullandığınız boşluk/değişken formatını seçin.</p></div>
              <button className={styles.modalClose} onClick={() => setMagicModal({ show: false })}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formatGrid}>
                {VARIABLE_FORMATS.map(f => (
                  <button key={f.id} onClick={() => setMagicModal(p => ({ ...p, selectedFormat: f.id }))} className={`${styles.formatOption} ${magicModal.selectedFormat === f.id ? styles.formatOptionActive : ''}`}>
                    <b className={styles.formatEx}>{f.ex}</b><span className={styles.formatLabel}>{f.label}</span>
                  </button>
                ))}
              </div>
              <div className={styles.magicInfoBox}>
                <Sparkles size={14} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
                <p>Seçtiğiniz formattaki tüm kelimeler bulunacak, sol tarafa <b>Soru</b> olarak eklenecek ve metin içindekiler standart <b>{"{{değişken}}"}</b> formatına otomatik çevrilecektir.</p>
              </div>
            </div>
            <div className={styles.modalFoot}>
              <button className={styles.cancelBtn} onClick={() => setMagicModal({ show: false })}>Vazgeç</button>
              <button className={styles.primaryBtn} onClick={executeMagicExtract}>Uygula</button>
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
              <div><h3>Şartlı Blok Ekle</h3><p>Seçilen soruya belirli bir cevap verildiğinde görünecek bir metin bloğu oluşturur.</p></div>
              <button className={styles.modalClose} onClick={() => setCondModal(false)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.fg}>
                <label>Hangi Soruya Bağlı?</label>
                <select className={styles.sel} value={condField} onChange={e => { setCondField(e.target.value); setCondValue(''); }}>
                  <option value="">Seçiniz...</option>
                  {formData.fields.filter(f => ['select', 'radio', 'checkbox'].includes(f.fieldType)).map(f => (
                    <option key={f.name} value={f.name}>{f.label || f.name}</option>
                  ))}
                </select>
              </div>
              {condField && (
                <div className={styles.fg}>
                  <label>Hangi Cevap Verildiğinde Gösterilsin?</label>
                  <select className={styles.sel} value={condValue} onChange={e => setCondValue(e.target.value)}>
                    <option value="">Seçiniz...</option>
                    {formData.fields.find(f => f.name === condField)?.options.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className={styles.modalFoot}>
              <button className={styles.cancelBtn} onClick={() => setCondModal(false)}>Vazgeç</button>
              <button className={styles.primaryBtn} disabled={!condField || !condValue} onClick={insertConditional}>Bloğu Ekle</button>
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
              <div><h3>Genel Bağlantı</h3><p>Bu bağlantıyı gönderdiğiniz kişiler formu doldurup anında PDF alabilir.</p></div>
              <button className={styles.modalClose} onClick={() => setIsShareModalOpen(false)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.linkCopyBox} style={{ display: 'flex', gap: '8px', background: 'var(--bg-input)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <input type="text" readOnly value={publicLink} style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontFamily: 'monospace' }} />
                <button onClick={copyToClipboard} className={styles.primaryBtn} style={{ flex: 'none', padding: '8px 16px' }}>
                  {isCopied ? <CheckCircle2 size={16} /> : <Copy size={16} />} {isCopied ? 'Kopyalandı' : 'Kopyala'}
                </button>
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
              <div><h3>PDF İndir</h3><p>Girdiğiniz verilere göre şablonunuz PDF formatına dönüştürülecektir.</p></div>
              <button className={styles.modalClose} onClick={() => setPdfConfirmModal(false)}><X size={18} /></button>
            </div>
            <div className={styles.modalFoot}>
              <button className={styles.cancelBtn} onClick={() => setPdfConfirmModal(false)}>İptal</button>
              <button className={styles.primaryBtn} disabled={isGeneratingPdf} onClick={handlePrintPDF}>
                {isGeneratingPdf ? 'Hazırlanıyor...' : 'Onayla ve İndir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Modals;