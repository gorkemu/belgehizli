import React, { useState } from 'react';
import { useTemplateBuilder } from '../hooks/useTemplateBuilder';
import globalStyles from '../TemplateBuilder.module.css';
import styles from './Toolbar.module.css';

import {
  Undo2, Redo2, Bold, Italic, Palette, Highlighter,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Variable, PenTool, ChevronDown, X
} from 'lucide-react';

import { TEXT_COLORS, HIGHLIGHT_COLORS } from '../utils/constants';
import { insertSignatureBlock } from '../utils/helpers';

const Toolbar = () => {
  const { editorInstance, formData, showToast } = useTemplateBuilder();
  const [popover, setPopover] = useState({ show: false, type: null, top: 0, left: 0 });

  if (!editorInstance) return null; // Editör yüklenene kadar gösterme

  const openPopover = (e, type) => { 
    const rect = e.currentTarget.getBoundingClientRect(); 
    setPopover({ show: true, type, top: rect.bottom + 6, left: rect.left }); 
  };
  const closePopover = () => setPopover({ show: false, type: null, top: 0, left: 0 });

  const currentFontSize = editorInstance.getAttributes('textStyle').fontSize || '';
  const currentLineHeight = editorInstance.getAttributes('paragraph').lineHeight || editorInstance.getAttributes('heading').lineHeight || '';
  const textColor = editorInstance.getAttributes('textStyle').color || '';
  const highlightColor = editorInstance.getAttributes('highlight').color || '';
  const currentHeadingLevel = editorInstance.isActive('heading', { level: 1 }) ? '1' : editorInstance.isActive('heading', { level: 2 }) ? '2' : editorInstance.isActive('heading', { level: 3 }) ? '3' : '0';

  const handleInsertVariable = (name) => {
    editorInstance.chain().focus().insertContent(` {{${name}}} `).run();
    showToast('Değişken eklendi', 'success');
  };

  const T = ({ onClick, active, icon, title, disabled }) => (
    <button
      disabled={disabled}
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`${styles.tb} ${active ? styles.tbActive : ''} ${disabled ? styles.tbDisabled : ''}`}
    >
      {icon}
    </button>
  );

  return (
    <>
      <div id="tb-toolbar" className={`no-print ${styles.toolbar}`}>
        <T onClick={() => editorInstance.chain().focus().undo().run()} disabled={!editorInstance.can().undo()} icon={<Undo2 size={15} />} title="Geri al" />
        <T onClick={() => editorInstance.chain().focus().redo().run()} disabled={!editorInstance.can().redo()} icon={<Redo2 size={15} />} title="İleri al" />
        <div className={styles.tbDivider} />
        
        <T onClick={() => editorInstance.chain().focus().toggleBold().run()} active={editorInstance.isActive('bold')} icon={<Bold size={15} />} title="Kalın (Ctrl+B)" />
        <T onClick={() => editorInstance.chain().focus().toggleItalic().run()} active={editorInstance.isActive('italic')} icon={<Italic size={15} />} title="İtalik (Ctrl+I)" />
        <div className={styles.tbDivider} />
        
        <select onChange={e => editorInstance.chain().focus().setFontFamily(e.target.value).run()} defaultValue="" className={styles.select}>
          <option value="" disabled>Font</option><option value="Inter">Inter</option><option value="Helvetica">Helvetica</option><option value="Arial">Arial</option>
        </select>
        <select onChange={e => e.target.value ? editorInstance.chain().focus().setFontSize(e.target.value).run() : editorInstance.chain().focus().unsetFontSize().run()} value={currentFontSize || ''} className={styles.select}>
          <option value="">Boyut</option>{[10, 12, 14, 16, 18, 20, 24, 28].map(s => <option key={s} value={`${s}px`}>{s}</option>)}
        </select>
        <select onChange={e => e.target.value ? editorInstance.chain().focus().setLineHeight(e.target.value).run() : editorInstance.chain().focus().unsetLineHeight().run()} value={currentLineHeight || ''} className={styles.select}>
          <option value="">Satır</option><option value="1.4">1.4</option><option value="1.5">1.5</option><option value="1.6">1.6</option><option value="1.7">1.7</option><option value="1.8">1.8</option>
        </select>
        <div className={styles.tbDivider} />
        
        <T onClick={e => popover.show && popover.type === 'textColor' ? closePopover() : openPopover(e, 'textColor')} active={!!textColor} icon={<Palette size={16} />} title="Yazı Rengi" />
        <T onClick={e => popover.show && popover.type === 'highlightColor' ? closePopover() : openPopover(e, 'highlightColor')} active={highlightColor && highlightColor !== 'transparent'} icon={<Highlighter size={16} />} title="Vurgu Rengi" />
        <div className={styles.tbDivider} />
        
        <select onChange={e => { const val = parseInt(e.target.value); val === 0 ? editorInstance.chain().focus().unsetFontSize().setParagraph().run() : editorInstance.chain().focus().unsetFontSize().toggleHeading({ level: val }).run(); }} value={currentHeadingLevel} className={styles.select}>
          <option value="0">Normal</option><option value="1">Başlık 1</option><option value="2">Başlık 2</option><option value="3">Başlık 3</option>
        </select>
        <div className={styles.tbDivider} />
        
        <T onClick={() => editorInstance.chain().focus().setTextAlign('left').run()} active={editorInstance.isActive({ textAlign: 'left' })} icon={<AlignLeft size={15} />} title="Sola Hizala" />
        <T onClick={() => editorInstance.chain().focus().setTextAlign('center').run()} active={editorInstance.isActive({ textAlign: 'center' })} icon={<AlignCenter size={15} />} title="Ortala" />
        <T onClick={() => editorInstance.chain().focus().setTextAlign('right').run()} active={editorInstance.isActive({ textAlign: 'right' })} icon={<AlignRight size={15} />} title="Sağa Hizala" />
        <T onClick={() => editorInstance.chain().focus().setTextAlign('justify').run()} active={editorInstance.isActive({ textAlign: 'justify' })} icon={<AlignJustify size={15} />} title="İki Yana Hizala" />
        <div className={styles.tbDivider} />
        
        <T onClick={() => editorInstance.chain().focus().toggleBulletList().run()} active={editorInstance.isActive('bulletList')} icon={<List size={15} />} title="Madde İşaretli Liste" />
        <T onClick={() => editorInstance.chain().focus().toggleOrderedList().run()} active={editorInstance.isActive('orderedList')} icon={<ListOrdered size={15} />} title="Numaralı Liste" />
        <div className={styles.tbDivider} />
        
        <T onClick={e => popover.show && popover.type === 'variables' ? closePopover() : openPopover(e, 'variables')} icon={<div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Variable size={14} /><span style={{ fontSize: '14px' }}>Değişken Ekle</span><ChevronDown size={12} /></div>} title="Değişken Ekle" />
        <div className={styles.tbDivider} />
        
        <T onClick={e => popover.show && popover.type === 'signature' ? closePopover() : openPopover(e, 'signature')} active={popover.show && popover.type === 'signature'} icon={<div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><PenTool size={15} /><span style={{ fontSize: '14px' }}>İmza Ekle</span> <ChevronDown size={12} /></div>} title="İmza Ekle" />
      </div>

      {/* Toolbar Yerel Popover'ları */}
      {popover.show && (
        <>
          <div className={globalStyles.popoverOverlay} onMouseDown={closePopover} />
          <div className={globalStyles.fixedPopover} style={{ top: popover.top, left: popover.left }} onMouseDown={e => e.stopPropagation()}>
            
            {popover.type === 'textColor' && (
              <div className={globalStyles.colorPaletteFixed}>
                {TEXT_COLORS.map(c => (<button key={c} className={globalStyles.colorDot} style={{ backgroundColor: c }} onClick={() => { editorInstance.chain().focus().setColor(c).run(); closePopover(); }} />))}
                <button className={globalStyles.colorClearDot} onClick={() => { editorInstance.chain().focus().unsetColor().run(); closePopover(); }}><X size={12} /></button>
              </div>
            )}
            
            {popover.type === 'highlightColor' && (
              <div className={globalStyles.colorPaletteFixed}>
                {HIGHLIGHT_COLORS.map(c => (<button key={c} className={globalStyles.colorDot} style={{ backgroundColor: c === 'transparent' ? 'var(--bg-hover)' : c }} onClick={() => { if (c === 'transparent') editorInstance.chain().focus().unsetHighlight().run(); else editorInstance.chain().focus().toggleHighlight({ color: c }).run(); closePopover(); }} />))}
              </div>
            )}
            
            {popover.type === 'signature' && (
              <div className={globalStyles.dropdownMenuFixed}>
                <button className={globalStyles.dropdownItem} onClick={() => { editorInstance.chain().focus().insertContent(insertSignatureBlock('left')).run(); closePopover(); }}>Sola İmza</button>
                <button className={globalStyles.dropdownItem} onClick={() => { editorInstance.chain().focus().insertContent(insertSignatureBlock('right')).run(); closePopover(); }}>Sağa İmza</button>
              </div>
            )}
            
            {popover.type === 'variables' && (
              <div className={globalStyles.dropdownMenuFixed} style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>DEĞİŞKENLER</div>
                {formData.fields.length === 0 ? (<div style={{ padding: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Soru eklemediniz</div>) : (
                  formData.fields.map(f => (
                    <button key={f.id} className={globalStyles.dropdownItem} onClick={() => { handleInsertVariable(f.name); closePopover(); }}>{f.label || f.name}</button>
                  ))
                )}
              </div>
            )}

          </div>
        </>
      )}
    </>
  );
};

export default Toolbar;