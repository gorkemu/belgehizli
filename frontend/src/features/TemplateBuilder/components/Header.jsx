// frontend/src/features/TemplateBuilder/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplateBuilder } from '../hooks/useTemplateBuilder';
import globalStyles from '../TemplateBuilder.module.css';
import styles from './Header.module.css';
import DOMPurify from 'dompurify';
import Button from '../../../components/ui/Button';

import {
  ArrowLeft, Wrench, Eye, Save, Cloud,
  AlertCircle, Loader2, Link as LinkIcon, Printer
} from 'lucide-react';
import { THEMES } from '../utils/constants';

const Header = () => {
  const navigate = useNavigate();
  const { 
    formData, setFormData, 
    formErrors, setFormErrors,
    mode, setMode, 
    editorTheme, handleThemeChange, 
    saveStatus, setSaveStatus,
    onSave, 
    editorInstance, getCleanFields, triggerSymbol, showToast,
    expandedFields, setExpandedFields,
    setIsShareModalOpen, 
    setPdfConfirmModal,
    showBackWarning, setShowBackWarning,  
    previewStep
  } = useTemplateBuilder();

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Theme Popover State
  const [themePopover, setThemePopover] = useState(false);

  // Kaydetme İşlemi (Context'teki editorInstance'ı kullanır)
  const handleSaveClick = async () => {
    const err = {};

    // 1. Şablon Adı Kontrolü
    if (!formData.name?.trim()) err.name = true;

    // 2. İçerik (Editör) Kontrolü
    // SADECE Tasarım modundaysak editörden veri al, Önizlemedeysek şablonun orijinal halini koru!
    const currentContent = (mode === 'build' && editorInstance) 
      ? editorInstance.getHTML() 
      : (formData.content || '');
    const stripped = currentContent.replace(/(<([^>]+)>)/gi, '').trim(); // Sadece HTML etiketlerini değil, içindeki metni kontrol eder
    if (!stripped) err.content = true;

    // 3. Form Alanları (Sorular) Kontrolü
    formData.fields.forEach((f, i) => {
      if (!f.label?.trim()) err[`field_${i}`] = true;

      // Select, radio veya checkbox ise boş seçenek bırakılmış mı kontrolü
      if (
        ['select', 'radio', 'checkbox'].includes(f.fieldType) &&
        (!f.options?.length || f.options.some(o => !o.trim()))
      ) {
        err[`options_${i}`] = true;
      }
    });

    // 4. Hata Varsa İşlemi Durdur ve Kullanıcıyı Uyar
    if (Object.keys(err).length > 0) {
      setFormErrors(err);
      showToast('Lütfen eksik alanları (kırmızı) tamamlayın.', 'error');

      // Hatalı olan ilk form alanının index'ini bul
      const errorFieldIndex = Object.keys(err)
        .find(k => k.startsWith('field_') || k.startsWith('options_'))
        ?.split('_')[1];

      // Eğer hata bir form alanındaysa, o alanın (kartın) detaylarını otomatik aç
      if (errorFieldIndex !== undefined) {
        const id = formData.fields[errorFieldIndex]?.id;
        if (id && !expandedFields.includes(id)) {
          setExpandedFields(prev => [...prev, id]);
        }
      }
      return; // Kaydetmeyi iptal et
    }

    // 5. Her Şey Yolundaysa Kaydetme İşlemine Geç
    setFormErrors({});
    setSaveStatus('saving'); // Header'daki bulut ikonunu "Kaydediliyor..." spinner'ına çevirir

    try {
      if (onSave) {
        const sanitizedContent = DOMPurify.sanitize(currentContent);

        const payload = {
          ...formData,
          content: sanitizedContent,
          fields: getCleanFields(),
          settings: { ...formData.settings, variableTrigger: triggerSymbol }
        };

        await Promise.all([
          onSave(payload),
          new Promise(resolve => setTimeout(resolve, 600))
        ]);

        showToast('Şablon başarıyla kaydedildi!', 'success');
        setSaveStatus('saved');
      }
    } catch (error) {
      console.error("Kaydetme Hatası:", error);
      showToast('Kaydetme başarısız oldu.', 'error');
      setSaveStatus('error');
    }
  };

  // --- SESSİZ OTO-KAYDETME FONKSİYONU ---
  const handleAutoSave = async () => {
    if (!onSave) return;
    setSaveStatus('saving');

    try {
      const currentContent = editorInstance ? editorInstance.getHTML() : (formData.content || '');
      const sanitizedContent = DOMPurify.sanitize(currentContent);

      await Promise.all([
        onSave({
          ...formData,
          content: sanitizedContent,
          fields: getCleanFields(),
          settings: { ...formData.settings, variableTrigger: triggerSymbol }
        }),
        new Promise(resolve => setTimeout(resolve, 600)) // UX gecikmesi
      ]);
      setSaveStatus('saved');
    } catch (error) {
      console.error("Oto-kaydetme hatası:", error);
      setSaveStatus('error');
    }
  };

  // --- OTO-KAYDETME TETİKLEYİCİSİ (2 Saniye) ---
  useEffect(() => {
    // Form tamamen boşken (ilk açılışta) oto-kayıt yapma
    if (!formData.name && formData.fields.length === 0) return;

    // Kullanıcı bir şey değiştirdiği an bulut ikonunu "Değişiklikler var" yap
    setSaveStatus('unsaved');

    // 2 saniye boyunca kullanıcıdan yeni bir tuş vuruşu gelmezse kaydet
    const timer = setTimeout(() => {
      handleAutoSave();
    }, 2000);

    // Eğer 2 saniye dolmadan kullanıcı bir şey yazarsa, eski sayacı iptal et (Debounce)
    return () => clearTimeout(timer);
  }, [formData]); // formData her değiştiğinde bu efekt çalışır

  return (
    <header className={styles.header}>
      <Button 
        variant="secondary" 
        onClick={() => navigate('/panel/projects')} 
        leftIcon={<ArrowLeft size={16} />}
      >
        <span>Şablonlarım</span>
      </Button>

      <input
        className={`${styles.nameInput} ${formErrors.name ? styles.inpErr : ''}`}
        value={formData.name || ''}
        onChange={e => {
          setFormData(p => ({ ...p, name: e.target.value }));
          if (formErrors.name) setFormErrors(p => ({ ...p, name: false }));
        }}
        placeholder="Şablon adı…"
      />

      <div className={styles.compactThemeDropdown} id="tb-theme-btn">
        <button onClick={() => setThemePopover(!themePopover)} className={styles.themeActiveBtn} title="Temayı Değiştir">
          {THEMES.find(t => t.id === editorTheme)?.emoji}
        </button>

        {themePopover && (
          <>
            <div className={globalStyles.popoverOverlay} onClick={() => setThemePopover(false)} />
            <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '8px', zIndex: 99999 }}>
              <div className={globalStyles.dropdownMenuFixed} style={{ minWidth: '150px' }}>
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { handleThemeChange(t.id); setThemePopover(false); }}
                    className={globalStyles.dropdownItem}
                    style={{ justifyContent: 'flex-start', gap: '8px' }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{t.emoji}</span>
                    <span style={{ fontWeight: editorTheme === t.id ? '800' : '600', color: editorTheme === t.id ? 'var(--text-primary)' : 'inherit' }}>
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className={styles.modeSwitch}>
        <button 
          className={`${styles.modeBtn} ${mode === 'build' ? styles.modeOn : ''}`} 
          onClick={() => {
            // Önizlemenin hangi adımında olursa olsun, tasarıma geçerken uyar
            if (mode === 'preview') {
              setShowBackWarning('build');
            } else {
              setMode('build');
            }
          }}
        >
          <Wrench size={15} /> Tasarım
        </button>
        
        <button 
          id="tb-preview-btn" 
          className={`${styles.modeBtn} ${mode === 'preview' ? styles.modeOn : ''}`} 
          onClick={() => setMode('preview')}
        >
          <Eye size={15} /> Önizleme
        </button>
      </div>

      <div className={styles.headerRight}>
        <div className={styles.autoSaveIndicator}>
          {saveStatus === 'saving' && <><Loader2 size={14} className={styles.spinnerIcon} /> Kaydediliyor...</>}
          {saveStatus === 'saved' && <><Cloud size={14} style={{ color: 'var(--success)' }} /> Buluta kaydedildi</>}
          {saveStatus === 'unsaved' && <><span className={styles.unsavedDot}></span> Değişiklikler var</>}
          {saveStatus === 'error' && <><AlertCircle size={14} style={{ color: 'var(--danger)' }} /> Kaydedilemedi</>}
        </div>

        <div className={styles.headerActionsDivider} />

        <Button 
          id="tb-share-btn" 
          variant="secondary" 
          onClick={() => setIsShareModalOpen(true)} 
          title="Genel Bağlantı"
          leftIcon={<LinkIcon size={15} />}
        >
          <span>Paylaş</span>
        </Button>

        {mode === 'preview' && (
          <Button 
            variant="secondary" 
            onClick={() => setPdfConfirmModal(true)} 
            isLoading={isGeneratingPdf}
            leftIcon={!isGeneratingPdf && <Printer size={15} />}
          >
            <span>İndir</span>
          </Button>
        )}

        <Button 
          variant="primary" 
          onClick={handleSaveClick} 
          isLoading={saveStatus === 'saving'}
          leftIcon={<Save size={15} />}
        >
          <span>Kaydet</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;