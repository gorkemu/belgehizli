// frontend/src/features/TemplateBuilder/context/TemplateBuilderContext.jsx
import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';

export const TemplateBuilderContext = createContext(null);

export const TemplateBuilderProvider = ({ children, initialData, onSave }) => {
  // --- Core State ---
  const [formData, setFormData] = useState(() => {
    const d = initialData || { name: '', description: '', content: '', fields: [], settings: {} };
    d.fields = (d.fields || []).map(f => ({ ...f, id: f.id || Math.random().toString(36).substr(2, 9) }));
    return d;
  });

  const [mode, setMode] = useState('build'); // 'build' | 'preview'
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved' | 'error'
  const [triggerSymbol, setTriggerSymbol] = useState(initialData?.settings?.variableTrigger || '{{');

  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [expandedFields, setExpandedFields] = useState([]);

  const [previewStep, setPreviewStep] = useState(1);
  const [virtualFormData, setVirtualFormData] = useState({});

  const [magicModal, setMagicModal] = useState({ show: false, selectedFormat: 'curly2' });
  const [condModal, setCondModal] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [pdfConfirmModal, setPdfConfirmModal] = useState(false);

  const [editorInstance, setEditorInstance] = useState(null);
  
  const previewEditorRef = useRef(null);

  const showToast = useCallback((msg, type = 'success', silent = false) => {
    if (silent) return;
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3200);
  }, []);

  const [showBackWarning, setShowBackWarning] = useState(null);

  const getCleanFields = useCallback(() => {
    return formData.fields.map(f => ({
      ...f,
      options: (f.options || []).filter(o => o.trim())
    }));
  }, [formData.fields]);

  const contextValue = {
    formData, setFormData,
    mode, setMode,
    saveStatus, setSaveStatus,
    triggerSymbol, setTriggerSymbol,
    formErrors, setFormErrors,
    toast, showToast,
    expandedFields, setExpandedFields,
    editorInstance, setEditorInstance,
    previewEditorRef, 
    magicModal, setMagicModal,
    condModal, setCondModal,
    previewStep, setPreviewStep,
    virtualFormData, setVirtualFormData,
    isShareModalOpen, setIsShareModalOpen,
    pdfConfirmModal, setPdfConfirmModal,
    getCleanFields,
    showBackWarning, setShowBackWarning,
    onSave 
  };

  return (
    <TemplateBuilderContext.Provider value={contextValue}>
      {children}
    </TemplateBuilderContext.Provider>
  );
};