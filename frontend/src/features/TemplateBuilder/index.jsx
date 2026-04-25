// frontend/src/features/TemplateBuilder/index.jsx
import React from 'react';
import { TemplateBuilderProvider } from './context/TemplateBuilderContext';
import { useTemplateBuilder } from './hooks/useTemplateBuilder'; 

// Alt bileşenler
import Header from './components/Header';
import SmartBar from './components/SmartBar';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import EditorCanvas from './components/EditorCanvas';
import PreviewMode from './components/PreviewMode';
import Modals from './components/Modals';

import styles from './TemplateBuilder.module.css';

// Compound Component'in Ana Sarmalayıcısı
const BuilderRoot = ({ initialData, onSave }) => {
  return (
    <TemplateBuilderProvider initialData={initialData} onSave={onSave}>
      <BuilderContent />
    </TemplateBuilderProvider>
  );
};

// İçerik (Context'e erişebilmesi için ayrı bir component)
const BuilderContent = () => {
  const { mode, editorTheme, toast } = useTemplateBuilder(); 

  return (
    <div className={styles.root} data-theme={editorTheme}>
      <Header />

      <div className={styles.workspace}>
        {mode === 'build' ? (
          <div className={styles.split}>
            <Sidebar />
            <main className={styles.right}>
              <SmartBar />
              <Toolbar />
              <EditorCanvas />
            </main>
          </div>
        ) : (
          <PreviewMode />
        )}
      </div>

      <Modals />

      {/* Global Toast */}
      {toast.show && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

BuilderRoot.Header = Header;
BuilderRoot.SmartBar = SmartBar;
BuilderRoot.Sidebar = Sidebar;
BuilderRoot.EditorCanvas = EditorCanvas;

export default BuilderRoot;