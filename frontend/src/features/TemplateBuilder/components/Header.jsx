// frontend/src/features/TemplateBuilder/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTemplateBuilder } from '../hooks/useTemplateBuilder';
import globalStyles from '../TemplateBuilder.module.css';
import styles from './Header.module.css';
import DOMPurify from 'dompurify';
import Button from '../../../components/ui/Button';
import { useTheme } from '../../../context/ThemeContext';

import {
  ArrowLeft, Wrench, Eye, Save, Cloud,
  AlertCircle, Loader2, Link as LinkIcon, Printer
} from 'lucide-react';
import { THEMES } from '../utils/constants';

const Header = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lang } = useParams();
  const currentLang = lang || 'tr';

  const { theme, changeTheme } = useTheme();


  const {
    formData, setFormData,
    formErrors, setFormErrors,
    mode, setMode,
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
  const [themePopover, setThemePopover] = useState(false);

  const projectsRoute = currentLang === 'tr' ? 'panel/projects' : 'dashboard/projects';

  const handleBackToProjects = () => {
    navigate(`/${currentLang}/${projectsRoute}`);
  };

  const handleSaveClick = async () => {
    const err = {};

    if (!formData.name?.trim()) err.name = true;

    const currentContent = (mode === 'build' && editorInstance)
      ? editorInstance.getHTML()
      : (formData.content || '');
    const stripped = currentContent.replace(/(<([^>]+)>)/gi, '').trim();
    if (!stripped) err.content = true;

    formData.fields.forEach((f, i) => {
      if (!f.label?.trim()) err[`field_${i}`] = true;
      if (
        ['select', 'radio', 'checkbox'].includes(f.fieldType) &&
        (!f.options?.length || f.options.some(o => !o.trim()))
      ) {
        err[`options_${i}`] = true;
      }
    });

    if (Object.keys(err).length > 0) {
      setFormErrors(err);
      showToast(t('templateBuilder.toast.fillRequiredFields'), 'error');

      const errorFieldIndex = Object.keys(err)
        .find(k => k.startsWith('field_') || k.startsWith('options_'))
        ?.split('_')[1];
      if (errorFieldIndex !== undefined) {
        const id = formData.fields[errorFieldIndex]?.id;
        if (id && !expandedFields.includes(id)) {
          setExpandedFields(prev => [...prev, id]);
        }
      }
      return;
    }

    setFormErrors({});
    setSaveStatus('saving');

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

        showToast(t('templateBuilder.toast.savedSuccess'), 'success');
        setSaveStatus('saved');
      }
    } catch (error) {
      console.error("Kaydetme Hatası:", error);
      showToast(t('templateBuilder.toast.saveFailed'), 'error');
      setSaveStatus('error');
    }
  };

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
        new Promise(resolve => setTimeout(resolve, 600))
      ]);
      setSaveStatus('saved');
    } catch (error) {
      console.error("Oto-kaydetme hatası:", error);
      setSaveStatus('error');
    }
  };

  useEffect(() => {
    if (!formData.name && formData.fields.length === 0) return;
    setSaveStatus('unsaved');
    const timer = setTimeout(() => {
      handleAutoSave();
    }, 2000);
    return () => clearTimeout(timer);
  }, [formData]);

  const onThemeSelect = (themeId) => {
    changeTheme(themeId);
    setThemePopover(false);
  };

  const currentThemeObj = THEMES.find(th => th.id === theme) || THEMES[0];

  return (
    <header className={styles.header}>
      <Button
        variant="secondary"
        onClick={handleBackToProjects}
        leftIcon={<ArrowLeft size={16} />}
      >
        <span>{t('templateBuilder.header.myTemplates')}</span>
      </Button>

      <input
        className={`${styles.nameInput} ${formErrors.name ? styles.inpErr : ''}`}
        value={formData.name || ''}
        onChange={e => {
          setFormData(p => ({ ...p, name: e.target.value }));
          if (formErrors.name) setFormErrors(p => ({ ...p, name: false }));
        }}
        placeholder={t('templateBuilder.header.templateNamePlaceholder')}
      />

      <div className={styles.compactThemeDropdown} id="tb-theme-btn">
        <button onClick={() => setThemePopover(!themePopover)} className={styles.themeActiveBtn} title={t('templateBuilder.header.changeTheme')}>
          {currentThemeObj.emoji}
        </button>

        {themePopover && (
          <>
            <div className={globalStyles.popoverOverlay} onClick={() => setThemePopover(false)} />
            <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '8px', zIndex: 99999 }}>
              <div className={globalStyles.dropdownMenuFixed} style={{ minWidth: '150px' }}>
                {THEMES.map(th => (
                  <button
                    key={th.id}
                    onClick={() => onThemeSelect(th.id)}
                    className={globalStyles.dropdownItem}
                    style={{ justifyContent: 'flex-start', gap: '8px' }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{th.emoji}</span>
                    <span style={{ fontWeight: theme === th.id ? '800' : '600', color: theme === th.id ? 'var(--text-primary)' : 'inherit' }}>
                      {t(th.label)}
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
            if (mode === 'preview') {
              setShowBackWarning('build');
            } else {
              setMode('build');
            }
          }}
        >
          <Wrench size={15} /> {t('templateBuilder.header.design')}
        </button>

        <button
          id="tb-preview-btn"
          className={`${styles.modeBtn} ${mode === 'preview' ? styles.modeOn : ''}`}
          onClick={() => setMode('preview')}
        >
          <Eye size={15} /> {t('templateBuilder.header.preview')}
        </button>
      </div>

      <div className={styles.headerRight}>
        <div className={styles.autoSaveIndicator}>
          {saveStatus === 'saving' && <><Loader2 size={14} className={styles.spinnerIcon} /> {t('templateBuilder.header.saving')}</>}
          {saveStatus === 'saved' && <><Cloud size={14} style={{ color: 'var(--success)' }} /> {t('templateBuilder.header.savedToCloud')}</>}
          {saveStatus === 'unsaved' && <><span className={styles.unsavedDot}></span> {t('templateBuilder.header.unsavedChanges')}</>}
          {saveStatus === 'error' && <><AlertCircle size={14} style={{ color: 'var(--danger)' }} /> {t('templateBuilder.header.saveFailed')}</>}
        </div>

        <div className={styles.headerActionsDivider} />

        <Button
          id="tb-share-btn"
          variant="secondary"
          onClick={() => setIsShareModalOpen(true)}
          title={t('templateBuilder.header.share')}
          leftIcon={<LinkIcon size={15} />}
        >
          <span>{t('templateBuilder.header.share')}</span>
        </Button>

        {mode === 'preview' && (
          <Button
            variant="secondary"
            onClick={() => setPdfConfirmModal(true)}
            isLoading={isGeneratingPdf}
            leftIcon={!isGeneratingPdf && <Printer size={15} />}
          >
            <span>{t('templateBuilder.header.download')}</span>
          </Button>
        )}

        <Button
          variant="primary"
          onClick={handleSaveClick}
          isLoading={saveStatus === 'saving'}
          leftIcon={<Save size={15} />}
        >
          <span>{t('templateBuilder.header.save')}</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;