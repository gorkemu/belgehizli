import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTemplateBuilder } from '../hooks/useTemplateBuilder';
import globalStyles from '../TemplateBuilder.module.css';
import styles from './SmartBar.module.css';
import { Wand2, Zap, FileUp } from 'lucide-react';
import * as mammoth from 'mammoth';
import DOMPurify from 'dompurify';
import { getTriggerSymbols, getRegexForTrigger } from '../utils/helpers';
import Button from '../../../components/ui/Button';

const SmartBar = () => {
  const { t } = useTranslation();
  const {
    editorInstance, triggerSymbol, setTriggerSymbol,
    showToast, setMagicModal, setCondModal
  } = useTemplateBuilder();

  const fileInputRef = useRef(null);
  const [isTriggerCustom, setIsTriggerCustom] = useState(!['{{', '[', '{', '@', '<<'].includes(triggerSymbol));
  const [customTriggerInput, setCustomTriggerInput] = useState('');

  const handleTriggerChange = (newTrigger) => {
    if (!newTrigger || !newTrigger.trim() || newTrigger === triggerSymbol) return;
    if (newTrigger.length > 5) return showToast(t('templateBuilder.smartBar.toast.triggerTooLong'), 'error');
    if (newTrigger.includes('/')) return showToast(t('templateBuilder.smartBar.toast.slashReserved'), 'error');

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
    showToast(t('templateBuilder.smartBar.toast.triggerUpdated'), 'success');
  };

  const processFile = (file) => {
    if (!file || !editorInstance) return;
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 2) return showToast(t('templateBuilder.smartBar.toast.fileTooLarge'), 'error');

    if (file.type === "text/plain" || file.type === "text/html") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const contentToInsert = file.type === "text/plain" ? text.split('\n').map(line => `<p>${line}</p>`).join('') : DOMPurify.sanitize(text);
        editorInstance.commands.setContent(contentToInsert);
        showToast(t('templateBuilder.smartBar.toast.fileImported'), 'success');
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.docx')) {
      showToast(t('templateBuilder.smartBar.toast.parsingDocx', { fileName: file.name }), 'success', false);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = await mammoth.convertToHtml({ arrayBuffer: e.target.result });
          editorInstance.commands.setContent(DOMPurify.sanitize(result.value));
          showToast(t('templateBuilder.smartBar.toast.wordImported'), 'success');
        } catch { showToast(t('templateBuilder.smartBar.toast.wordError'), 'error'); }
      };
      reader.readAsArrayBuffer(file);
    } else if (file.type === "application/pdf") {
      showToast(t('templateBuilder.smartBar.toast.pdfNotSupported'), 'error');
    } else {
      showToast(t('templateBuilder.smartBar.toast.unsupportedFile'), 'error');
    }
  };

  return (
    <div className={styles.smartBar}>
      <div className={styles.smartBarLeft}>
        <Button 
          id="tb-magic-btn" 
          variant="primary" 
          onClick={() => setMagicModal({ show: true, selectedFormat: 'curly2' })} 
          title={t('templateBuilder.smartBar.magicTitle')}
          leftIcon={<Wand2 size={16} />}
        >
          <span>{t('templateBuilder.smartBar.detectAll')}</span>
        </Button>
        <span className={styles.smartHint}>{t('templateBuilder.smartBar.magicHint')}</span>
      </div>

      <div className={styles.smartBarRight}>
        <select
          id="tb-trigger-select"
          value={triggerSymbol}
          onChange={e => {
            if (e.target.value === 'custom') { setIsTriggerCustom(true); setCustomTriggerInput(''); }
            else { setIsTriggerCustom(false); handleTriggerChange(e.target.value); }
          }}
          className={styles.triggerSelectSmart} title={t('templateBuilder.smartBar.triggerTitle')}
        >
          <option value="{{">{"{{ }}"}</option>
          <option value="[">{"[ ]"}</option>
          <option value="<<">{"<< >>"}</option>
          <option value="@">{"@"}</option>
          <option value="custom">{t('templateBuilder.smartBar.custom')}</option>
        </select>

        {isTriggerCustom && (
          <div className={styles.customTriggerWrapper}>
            <input type="text" maxLength={5} value={customTriggerInput} onChange={e => setCustomTriggerInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { handleTriggerChange(customTriggerInput); setIsTriggerCustom(false); } }} placeholder={t('templateBuilder.smartBar.customPlaceholder')} className={globalStyles.inp} style={{ width: '60px', padding: '6px' }} />
            <Button variant="secondary" size="sm" onClick={() => { handleTriggerChange(customTriggerInput); setIsTriggerCustom(false); }}>
              <span>{t('templateBuilder.smartBar.select')}</span>
            </Button>
          </div>
        )}

        <input type="file" ref={fileInputRef} onChange={e => { processFile(e.target.files[0]); if (fileInputRef.current) fileInputRef.current.value = ""; }} accept=".txt,.html,.docx,.pdf" style={{ display: 'none' }} />
        
        <Button 
          id="tb-import" 
          variant="secondary" 
          onClick={() => fileInputRef.current?.click()}
          leftIcon={<FileUp size={16} />}
        >
          <span>{t('templateBuilder.smartBar.import')}</span>
        </Button>

        <Button 
          id="tb-cond-btn" 
          variant="warning" 
          onClick={() => setCondModal(true)}
          leftIcon={<Zap size={14} />}
        >
          <span>{t('templateBuilder.smartBar.conditionalBlock')}</span>
        </Button>
      </div>
    </div>
  );
};

export default SmartBar;