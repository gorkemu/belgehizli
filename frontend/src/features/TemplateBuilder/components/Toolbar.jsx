// frontend/src/features/TemplateBuilder/components/Toolbar.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { editorInstance, formData, showToast, triggerSymbol } = useTemplateBuilder();
  const [popover, setPopover] = useState({ show: false, type: null, top: 0, left: 0 });

  if (!editorInstance) return null;

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
    showToast(t('templateBuilder.toolbar.toast.variableInserted'), 'success');
  };

  const T = ({ onClick, active, icon, title, disabled, className = '' }) => (
    <button
      disabled={disabled}
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`${styles.tb} ${active ? styles.tbActive : ''} ${disabled ? styles.tbDisabled : ''} ${className}`}
    >
      {icon}
    </button>
  );

  return (
    <>
      <div id="tb-toolbar" className={`no-print ${styles.toolbar}`}>
        <T onClick={() => editorInstance.chain().focus().undo().run()} disabled={!editorInstance.can().undo()} icon={<Undo2 size={15} />} title={t('templateBuilder.toolbar.undo')} />
        <T onClick={() => editorInstance.chain().focus().redo().run()} disabled={!editorInstance.can().redo()} icon={<Redo2 size={15} />} title={t('templateBuilder.toolbar.redo')} />
        <div className={styles.tbDivider} />

        <T onClick={() => editorInstance.chain().focus().toggleBold().run()} active={editorInstance.isActive('bold')} icon={<Bold size={15} />} title={t('templateBuilder.toolbar.bold')} />
        <T onClick={() => editorInstance.chain().focus().toggleItalic().run()} active={editorInstance.isActive('italic')} icon={<Italic size={15} />} title={t('templateBuilder.toolbar.italic')} />
        <div className={styles.tbDivider} />

        <select onChange={e => editorInstance.chain().focus().setFontFamily(e.target.value).run()} defaultValue="" className={styles.select}>
          <option value="" disabled>{t('templateBuilder.toolbar.font')}</option>
          <option value="Inter">Inter</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Arial">Arial</option>
        </select>
        <select onChange={e => e.target.value ? editorInstance.chain().focus().setFontSize(e.target.value).run() : editorInstance.chain().focus().unsetFontSize().run()} value={currentFontSize || ''} className={styles.select}>
          <option value="">{t('templateBuilder.toolbar.size')}</option>
          {[10, 12, 14, 16, 18, 20, 24, 28].map(s => <option key={s} value={`${s}px`}>{s}</option>)}
        </select>
        <select onChange={e => e.target.value ? editorInstance.chain().focus().setLineHeight(e.target.value).run() : editorInstance.chain().focus().unsetLineHeight().run()} value={currentLineHeight || ''} className={styles.select}>
          <option value="">{t('templateBuilder.toolbar.line')}</option>
          <option value="1.4">1.4</option>
          <option value="1.5">1.5</option>
          <option value="1.6">1.6</option>
          <option value="1.7">1.7</option>
          <option value="1.8">1.8</option>
        </select>
        <div className={styles.tbDivider} />

        <T onClick={e => popover.show && popover.type === 'textColor' ? closePopover() : openPopover(e, 'textColor')} active={!!textColor} icon={<Palette size={16} />} title={t('templateBuilder.toolbar.textColor')} />
        <T onClick={e => popover.show && popover.type === 'highlightColor' ? closePopover() : openPopover(e, 'highlightColor')} active={highlightColor && highlightColor !== 'transparent'} icon={<Highlighter size={16} />} title={t('templateBuilder.toolbar.highlightColor')} />
        <div className={styles.tbDivider} />

        <select onChange={e => { const val = parseInt(e.target.value); val === 0 ? editorInstance.chain().focus().unsetFontSize().setParagraph().run() : editorInstance.chain().focus().unsetFontSize().toggleHeading({ level: val }).run(); }} value={currentHeadingLevel} className={styles.select}>
          <option value="0">{t('templateBuilder.toolbar.normal')}</option>
          <option value="1">{t('templateBuilder.toolbar.heading1')}</option>
          <option value="2">{t('templateBuilder.toolbar.heading2')}</option>
          <option value="3">{t('templateBuilder.toolbar.heading3')}</option>
        </select>
        <div className={styles.tbDivider} />

        <T onClick={() => editorInstance.chain().focus().setTextAlign('left').run()} active={editorInstance.isActive({ textAlign: 'left' })} icon={<AlignLeft size={15} />} title={t('templateBuilder.toolbar.alignLeft')} />
        <T onClick={() => editorInstance.chain().focus().setTextAlign('center').run()} active={editorInstance.isActive({ textAlign: 'center' })} icon={<AlignCenter size={15} />} title={t('templateBuilder.toolbar.alignCenter')} />
        <T onClick={() => editorInstance.chain().focus().setTextAlign('right').run()} active={editorInstance.isActive({ textAlign: 'right' })} icon={<AlignRight size={15} />} title={t('templateBuilder.toolbar.alignRight')} />
        <T onClick={() => editorInstance.chain().focus().setTextAlign('justify').run()} active={editorInstance.isActive({ textAlign: 'justify' })} icon={<AlignJustify size={15} />} title={t('templateBuilder.toolbar.alignJustify')} />
        <div className={styles.tbDivider} />

        <T onClick={() => editorInstance.chain().focus().toggleBulletList().run()} active={editorInstance.isActive('bulletList')} icon={<List size={15} />} title={t('templateBuilder.toolbar.bulletList')} />
        <T onClick={() => editorInstance.chain().focus().toggleOrderedList().run()} active={editorInstance.isActive('orderedList')} icon={<ListOrdered size={15} />} title={t('templateBuilder.toolbar.orderedList')} />
        <div className={styles.tbDivider} />

        <T
          onClick={e => popover.show && popover.type === 'variables' ? closePopover() : openPopover(e, 'variables')}
          icon={
            <div className={styles.selectInner}>
              <Variable size={14} />
              <span>{t('templateBuilder.toolbar.insertVariable')}</span>
              <ChevronDown size={12} />
            </div>
          }
          title={t('templateBuilder.toolbar.insertVariable')}
          className={styles.select}
        />
        <div className={styles.tbDivider} />

        <T
          onClick={e => popover.show && popover.type === 'signature' ? closePopover() : openPopover(e, 'signature')}
          active={popover.show && popover.type === 'signature'}
          icon={
            <div className={styles.selectInner}>
              <PenTool size={15} />
              <span>{t('templateBuilder.toolbar.insertSignature')}</span>
              <ChevronDown size={12} />
            </div>
          }
          title={t('templateBuilder.toolbar.insertSignature')}
          className={styles.select}
        />
      </div>

      {/* Toolbar Local Popovers */}
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
                <button className={globalStyles.dropdownItem} onClick={() => { editorInstance.chain().focus().insertContent(insertSignatureBlock('left', t, triggerSymbol)).run(); closePopover(); }}>{t('templateBuilder.toolbar.signatureLeft')}</button>
                <button className={globalStyles.dropdownItem} onClick={() => { editorInstance.chain().focus().insertContent(insertSignatureBlock('right', t, triggerSymbol)).run(); closePopover(); }}>{t('templateBuilder.toolbar.signatureRight')}</button>
              </div>
            )}

            {popover.type === 'variables' && (
              <div className={globalStyles.dropdownMenuFixed} style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '4px 10px',
                  color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--border)',
                  marginBottom: '4px'
                }}>
                  {t('templateBuilder.toolbar.variables')}
                </div>
                {formData.fields.length === 0 ? (
                  <div className={globalStyles.dropdownEmpty}>{t('templateBuilder.toolbar.noVariables')}</div>
                ) : (
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