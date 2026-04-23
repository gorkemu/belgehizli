import React, { useRef, useState } from 'react';
import { useTemplateBuilder } from '../hooks/useTemplateBuilder';
import globalStyles from '../TemplateBuilder.module.css';
import styles from './SmartBar.module.css';
import { Wand2, Zap, FileUp } from 'lucide-react';
import * as mammoth from 'mammoth';
import DOMPurify from 'dompurify';
import { getTriggerSymbols, getRegexForTrigger } from '../utils/helpers';

const SmartBar = () => {
  const {
    editorInstance, triggerSymbol, setTriggerSymbol,
    showToast, setMagicModal, setCondModal
  } = useTemplateBuilder();

  const fileInputRef = useRef(null);
  const [isTriggerCustom, setIsTriggerCustom] = useState(!['{{', '[', '{', '@', '<<'].includes(triggerSymbol));
  const [customTriggerInput, setCustomTriggerInput] = useState('');

  // Tetikleyici Değiştirme Mantığı
  const handleTriggerChange = (newTrigger) => {
    if (!newTrigger || !newTrigger.trim() || newTrigger === triggerSymbol) return;
    if (newTrigger.length > 5) return showToast('Tetikleyici en fazla 5 karakter olabilir.', 'error');
    if (newTrigger.includes('/')) return showToast(" '/' işareti komut menüsü için ayrılmıştır.", "error");

    if (editorInstance) {
      let currentHtml = editorInstance.getHTML();
      const newSym = getTriggerSymbols(newTrigger);
      const regex = getRegexForTrigger(triggerSymbol);

      const tempDiv = window.document.createElement('div');
      tempDiv.innerHTML = currentHtml;

      const walk = (node) => {
        if (node.nodeType === 3) {
          node.nodeValue = node.nodeValue.replace(regex, (match, p1) => `${newSym.s}${p1}${newSym.e}`);
        } else if (node.nodeType === 1) {
          for (let child of node.childNodes) walk(child);
        }
      };
      walk(tempDiv);
      editorInstance.commands.setContent(tempDiv.innerHTML, false);
    }
    setTriggerSymbol(newTrigger);
    showToast('Değişken formatı güncellendi.', 'success');
  };

  // Dosya İçe Aktarma Mantığı
  const processFile = (file) => {
    if (!file || !editorInstance) return;
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 2) return showToast("Dosya boyutu çok büyük (Max 2MB).", "error");

    if (file.type === "text/plain" || file.type === "text/html") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const contentToInsert = file.type === "text/plain" ? text.split('\n').map(line => `<p>${line}</p>`).join('') : DOMPurify.sanitize(text);
        editorInstance.commands.setContent(contentToInsert);
        showToast("Belge başarıyla içe aktarıldı!", "success");
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.docx')) {
      showToast(`${file.name} ayrıştırılıyor...`, "success", false);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = await mammoth.convertToHtml({ arrayBuffer: e.target.result });
          editorInstance.commands.setContent(DOMPurify.sanitize(result.value));
          showToast("Word dosyası başarıyla aktarıldı!", "success");
        } catch { showToast("Word dosyası okunurken hata oluştu.", "error"); }
      };
      reader.readAsArrayBuffer(file);
    } else if (file.type === "application/pdf") {
      showToast("PDF ayrıştırma servisi şu an aktif değil. Lütfen .docx kullanın.", "error");
    } else {
      showToast("Lütfen sadece .txt, .html veya .docx dosyası yükleyin.", "error");
    }
  };

  return (
    <div className={styles.smartBar}>
      <div className={styles.smartBarLeft}>
        <button id="tb-magic-btn" onClick={() => setMagicModal({ show: true, selectedFormat: 'curly2' })} className={styles.magicBtn} title="Farklı formatlardaki değişkenleri otomatik bulur">
          <Wand2 size={16} /> Tümünü Algıla
        </button>
        <span className={styles.smartHint}>Belgenizdeki gizli değişkenleri anında forma çevirin.</span>
      </div>

      <div className={styles.smartBarRight}>
        <select
          id="tb-trigger-select"
          value={triggerSymbol}
          onChange={e => {
            if (e.target.value === 'custom') { setIsTriggerCustom(true); setCustomTriggerInput(''); }
            else { setIsTriggerCustom(false); handleTriggerChange(e.target.value); }
          }}
          className={styles.triggerSelectSmart} title="Değişken Formatı (Tetikleyici)"
        >
          <option value="{{">{"{{ }}"}</option>
          <option value="[">{"[ ]"}</option>
          <option value="<<">{"<< >>"}</option>
          <option value="@">{"@isim"}</option>
          <option value="custom">Özel...</option>
        </select>

        {isTriggerCustom && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <input type="text" maxLength={5} value={customTriggerInput} onChange={e => setCustomTriggerInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { handleTriggerChange(customTriggerInput); setIsTriggerCustom(false); } }} placeholder="Örn: //" className={globalStyles.inp} style={{ width: '60px', padding: '6px' }} />
            <button onClick={() => { handleTriggerChange(customTriggerInput); setIsTriggerCustom(false); }} className={styles.actionBtn}>Seç</button>
          </div>
        )}

        <input type="file" ref={fileInputRef} onChange={e => { processFile(e.target.files[0]); if (fileInputRef.current) fileInputRef.current.value = ""; }} accept=".txt,.html,.docx,.pdf" style={{ display: 'none' }} />
        <button id="tb-import" className={styles.actionBtn} onClick={() => fileInputRef.current?.click()}>
          <FileUp size={16} /> İçe Aktar
        </button>

        <button id="tb-cond-btn" className={styles.condBtn} onClick={() => setCondModal(true)}>
          <Zap size={14} /> Şartlı Blok
        </button>
      </div>
    </div>
  );
};

export default SmartBar;