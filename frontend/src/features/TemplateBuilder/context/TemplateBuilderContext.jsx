import React, { createContext, useState, useEffect, useCallback } from 'react';

export const TemplateBuilderContext = createContext(null);

export const TemplateBuilderProvider = ({ children, initialData, onSave }) => {
  // --- Core State ---
  const [formData, setFormData] = useState(() => {
    const d = initialData || { name: '', description: '', content: '', fields: [], settings: {} };
    d.fields = (d.fields || []).map(f => ({ ...f, id: f.id || Math.random().toString(36).substr(2, 9) }));
    return d;
  });
  
  const [mode, setMode] = useState('build'); // 'build' | 'preview'
  const [editorTheme, setEditorTheme] = useState('default');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved' | 'error'
  const [triggerSymbol, setTriggerSymbol] = useState(initialData?.settings?.variableTrigger || '{{');
  
  // --- UI & Error State ---
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [expandedFields, setExpandedFields] = useState([]);

  // --- Preview & Form State ---
  const [previewStep, setPreviewStep] = useState(1);
  const [virtualFormData, setVirtualFormData] = useState({});

  // --- Modals State ---
  const [magicModal, setMagicModal] = useState({ show: false, selectedFormat: 'curly2' });
  const [condModal, setCondModal] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [pdfConfirmModal, setPdfConfirmModal] = useState(false);
  
  // --- Editor Instance ---
  const [editorInstance, setEditorInstance] = useState(null);

  // Global Toast Handler
  const showToast = useCallback((msg, type = 'success', silent = false) => { 
    if (silent) return; 
    setToast({ show: true, message: msg, type }); 
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3200); 
  }, []);

  const getCleanFields = useCallback(() => {
    return formData.fields.map(f => ({ 
      ...f, 
      options: (f.options || []).filter(o => o.trim()) 
    }));
  }, [formData.fields]);

  // Theme Initializer
  useEffect(() => {
    const savedTheme = localStorage.getItem('template_theme');
    if (savedTheme) setEditorTheme(savedTheme);
  }, []);

  const handleThemeChange = useCallback((newTheme) => {
    setEditorTheme(newTheme);
    localStorage.setItem('template_theme', newTheme);
  }, []);

  const contextValue = {
    formData, setFormData,
    mode, setMode,
    editorTheme, handleThemeChange,
    saveStatus, setSaveStatus,
    triggerSymbol, setTriggerSymbol,
    formErrors, setFormErrors,
    toast, showToast,
    expandedFields, setExpandedFields,
    editorInstance, setEditorInstance,
    magicModal, setMagicModal, 
    condModal, setCondModal,
    previewStep, setPreviewStep,
    virtualFormData, setVirtualFormData,
    isShareModalOpen, setIsShareModalOpen,
    pdfConfirmModal, setPdfConfirmModal,
    getCleanFields,
    onSave // Dışarıdan gelen ana kaydetme fonksiyonu
  };

  return (
    <TemplateBuilderContext.Provider value={contextValue}>
      {children}
    </TemplateBuilderContext.Provider>
  );
};