import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useTemplateBuilder } from '../hooks/useTemplateBuilder';
import globalStyles from '../TemplateBuilder.module.css';
import styles from './EditorCanvas.module.css';
import { getTriggerSymbols, getRegexForTrigger, generateVarName, insertSignatureBlock } from '../utils/helpers';
import { EDITOR_LIMITS, FIELD_TYPES } from '../utils/constants';

import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import { Highlight } from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import * as mammoth from 'mammoth';
import DOMPurify from 'dompurify';

import {
  Heading1, Heading2, Heading3, List, ListOrdered,
  Scissors, AlignLeft, AlignRight, FileUp, Sparkles, X, Layers, Bold, Italic
} from 'lucide-react';

// --- Custom Tiptap Extensions ---
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() { return [{ types: this.options.types, attributes: { fontSize: { default: null, parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''), renderHTML: attributes => attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {} } } }]; },
  addCommands() { return { setFontSize: fontSize => ({ chain }) => chain().setMark('textStyle', { fontSize }).run(), unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).run(), }; },
});

const LineHeight = Extension.create({
  name: 'lineHeight',
  addOptions() { return { types: ['paragraph', 'heading'] }; },
  addGlobalAttributes() { return [{ types: this.options.types, attributes: { lineHeight: { default: null, parseHTML: element => element.style.lineHeight, renderHTML: attributes => attributes.lineHeight ? { style: `line-height: ${attributes.lineHeight}` } : {} } } }]; },
  addCommands() { return { setLineHeight: lineHeight => ({ commands }) => this.options.types.map(type => commands.updateAttributes(type, { lineHeight })).some(Boolean), unsetLineHeight: () => ({ commands }) => this.options.types.map(type => commands.resetAttributes(type, 'lineHeight')).some(Boolean), }; },
});

const SLASH_COMMANDS = [
  { id: 'h1', label: 'Büyük Başlık', icon: <Heading1 size={14} />, action: (ed) => ed.chain().focus().toggleHeading({ level: 1 }).run() },
  { id: 'h2', label: 'Orta Başlık', icon: <Heading2 size={14} />, action: (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: 'h3', label: 'Küçük Başlık', icon: <Heading3 size={14} />, action: (ed) => ed.chain().focus().toggleHeading({ level: 3 }).run() },
  { id: 'bullet', label: 'Madde İmleri', icon: <List size={14} />, action: (ed) => ed.chain().focus().toggleBulletList().run() },
  { id: 'ordered', label: 'Numaralı Liste', icon: <ListOrdered size={14} />, action: (ed) => ed.chain().focus().toggleOrderedList().run() },
  { id: 'divider', label: 'Sayfa Sonu', icon: <Scissors size={14} />, action: (ed) => ed.chain().focus().setHorizontalRule().run() },
  { id: 'sig_left', label: 'İmza (Sola)', icon: <AlignLeft size={14} />, action: (ed) => ed.chain().focus().insertContent(insertSignatureBlock('left')).run() },
  { id: 'sig_right', label: 'İmza (Sağa)', icon: <AlignRight size={14} />, action: (ed) => ed.chain().focus().insertContent(insertSignatureBlock('right')).run() },
];

const EditorCanvas = () => {
  const {
    formData, setFormData, triggerSymbol,
    setEditorInstance, showToast, expandedFields, setExpandedFields, mode
  } = useTemplateBuilder();

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const debounceTimer = useRef(null);
  const mousePosRef = useRef({ x: 0, y: 0 });

  // Menü Durumları
  const [selectionMenu, setSelectionMenu] = useState({ show: false, top: 0, left: 0, mode: 'button', text: '', fieldType: 'text' });
  const [formatMenu, setFormatMenu] = useState({ show: false, top: 0, left: 0 });
  const [slashMenuState, setSlashMenuState] = useState({ show: false, pos: { top: 0, left: 0 }, query: '', range: null });
  const [varMenuState, setVarMenuState] = useState({ show: false, pos: { top: 0, left: 0 }, query: '', range: null });

  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const [varSelectedIndex, setVarSelectedIndex] = useState(0);
  const [varNameInput, setVarNameInput] = useState('');

  const [multiReplace, setMultiReplace] = useState({ show: false, searchText: '', occurrences: [], newField: null, finalVarName: '' });

  const slashMenuStateRef = useRef(slashMenuState);
  const slashSelectedIndexRef = useRef(slashSelectedIndex);
  const varMenuStateRef = useRef(varMenuState);
  const varSelectedIndexRef = useRef(varSelectedIndex);

  useEffect(() => { slashMenuStateRef.current = slashMenuState; }, [slashMenuState]);
  useEffect(() => { slashSelectedIndexRef.current = slashSelectedIndex; }, [slashSelectedIndex]);
  useEffect(() => { varMenuStateRef.current = varMenuState; }, [varMenuState]);
  useEffect(() => { varSelectedIndexRef.current = varSelectedIndex; }, [varSelectedIndex]);
  // Menüde ok tuşlarıyla gezerken otomatik aşağı/yukarı kaydırma (Scroll into view)
  useEffect(() => {
    if (slashMenuState.show) {
      const el = window.document.getElementById(`slash-item-${slashSelectedIndex}`);
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
    if (varMenuState.show) {
      const el = window.document.getElementById(`var-item-${varSelectedIndex}`);
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }, [slashSelectedIndex, slashMenuState.show, varSelectedIndex, varMenuState.show]);
  // Tüm menüleri ESC tuşuyla kapatma
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        // Balon menüyü kapat ve varsayılan buton moduna sıfırla
        setSelectionMenu(p => ({ ...p, show: false, mode: 'button' }));
        setFormatMenu({ show: false, top: 0, left: 0 });

        // Varsa açık olan slash/değişken menülerini de kapat
        setSlashMenuState(s => ({ ...s, show: false }));
        setVarMenuState(s => ({ ...s, show: false }));
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const filteredSlashCmds = useMemo(() => SLASH_COMMANDS.filter(cmd => cmd.label.toLowerCase().includes(slashMenuState.query.toLowerCase())), [slashMenuState.query]);

  const checkCursorForMenu = useCallback((ed) => {
    if (!ed || !ed.view || ed.view.isDestroyed) return;
    const { state, view } = ed; const { selection } = state;

    if (!selection.empty && mode === 'build') {
      const coords = view.coordsAtPos(selection.from);
      const selectedText = state.doc.textBetween(selection.from, selection.to).trim();
      if (selectedText.length > 0) {
        setSelectionMenu(prev => ({ show: true, top: coords.top - 48, left: coords.left, mode: prev.text !== selectedText ? 'button' : prev.mode, text: selectedText, fieldType: prev.text !== selectedText ? 'text' : prev.fieldType }));
        setFormatMenu({ show: true, top: coords.top - 48, left: coords.left });
      }
      setSlashMenuState(s => ({ ...s, show: false })); setVarMenuState(s => ({ ...s, show: false }));
      return;
    } else { setSelectionMenu({ show: false }); setFormatMenu({ show: false }); setVarNameInput(''); }

    const $pos = selection.$anchor;
    const textBefore = $pos.parent.textBetween(Math.max(0, $pos.parentOffset - 40), $pos.parentOffset, null, '\ufffc');

    const escapedTrigger = triggerSymbol === '<<' ? '(?:<<|&lt;&lt;)' : triggerSymbol.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const varRegex = new RegExp(`(?:^|\\s)(${escapedTrigger})([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]*)$`);
    const varMatch = textBefore.match(varRegex);

    if (varMatch) {
      const coords = view.coordsAtPos(selection.from);
      const menuHeight = 320;
      const topPos = (window.innerHeight - coords.bottom < menuHeight) ? coords.top - menuHeight : coords.bottom + 5;
      setVarMenuState({ show: true, pos: { top: topPos, left: coords.left }, query: varMatch[2], range: { from: selection.from - (varMatch[1].length + varMatch[2].length), to: selection.from } });
      setVarSelectedIndex(0); setSlashMenuState(s => ({ ...s, show: false }));
      return;
    }

    const slashRegex = /(?:^|\s)\/([a-zA-ZçğıöşüÇĞİÖŞÜ]*)$/;
    const slashMatch = textBefore.match(slashRegex);
    if (slashMatch) {
      const coords = view.coordsAtPos(selection.from);
      const menuHeight = 320;
      const topPos = (window.innerHeight - coords.bottom < menuHeight) ? coords.top - menuHeight : coords.bottom + 5;
      setSlashMenuState({ show: true, pos: { top: topPos, left: coords.left }, query: slashMatch[1], range: { from: selection.from - (1 + slashMatch[1].length), to: selection.from } });
      setSlashSelectedIndex(0); setVarMenuState(s => ({ ...s, show: false }));
      return;
    }

    setSlashMenuState(s => s.show ? { ...s, show: false } : s);
    setVarMenuState(s => s.show ? { ...s, show: false } : s);
  }, [mode, triggerSymbol]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, blockquote: false }),
      TextStyle, Color, FontFamily, FontSize, LineHeight, Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: "Metni yapıştırın veya '/' tuşuna basın..." }),
      CharacterCount.configure({ limit: EDITOR_LIMITS.MAX_CHARS })
    ],
    content: DOMPurify.sanitize(formData.content || ''),
    onCreate: ({ editor: ed }) => {
      setTimeout(() => setEditorInstance(ed), 0);
    },
    onUpdate: ({ editor: ed }) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        setFormData(p => ({ ...p, content: ed.getHTML() }));
        checkCursorForMenu(ed);
      }, 400);
    },
    onSelectionUpdate: ({ editor: ed }) => checkCursorForMenu(ed)
  });

  // Klavye Yönlendirmeleri (Menu Navigasyonu)
  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        handleKeyDown: (view, event) => {
          const sms = slashMenuStateRef.current; const ssi = slashSelectedIndexRef.current;
          const vms = varMenuStateRef.current; const vsi = varSelectedIndexRef.current;

          if (vms.show) {
            const filteredVars = formData.fields.filter(f => f.name.toLowerCase().includes(vms.query.toLowerCase()));
            if (event.key === 'ArrowUp') { event.preventDefault(); setVarSelectedIndex(p => (p > 0 ? p - 1 : filteredVars.length - 1)); return true; }
            if (event.key === 'ArrowDown') { event.preventDefault(); setVarSelectedIndex(p => (p < filteredVars.length - 1 ? p + 1 : 0)); return true; }
            if (event.key === 'Enter' || event.key === 'Tab') {
              event.preventDefault();
              if (filteredVars[vsi]) {
                const sym = getTriggerSymbols(triggerSymbol);
                editor.chain().focus().deleteRange(vms.range).insertContent({ type: 'text', text: `${sym.s}${filteredVars[vsi].name}${sym.e} ` }).run();
                setVarMenuState(s => ({ ...s, show: false }));
              } return true;
            }
            if (event.key === 'Escape' || event.key === ' ') { setVarMenuState(s => ({ ...s, show: false })); return false; }
            return false;
          }

          if (sms.show) {
            const filteredCmds = SLASH_COMMANDS.filter(cmd => cmd.label.toLowerCase().includes(sms.query.toLowerCase()));
            if (event.key === 'ArrowUp') { event.preventDefault(); setSlashSelectedIndex(p => (p > 0 ? p - 1 : filteredCmds.length - 1)); return true; }
            if (event.key === 'ArrowDown') { event.preventDefault(); setSlashSelectedIndex(p => (p < filteredCmds.length - 1 ? p + 1 : 0)); return true; }
            if (event.key === 'Enter' || event.key === 'Tab') {
              event.preventDefault();
              if (filteredCmds.length > 0) {
                const cmd = filteredCmds[ssi];
                editor.chain().focus().deleteRange(sms.range).run(); cmd.action(editor);
                setSlashMenuState(s => ({ ...s, show: false }));
              } return true;
            }
            if (event.key === 'Escape' || event.key === ' ') { setSlashMenuState(s => ({ ...s, show: false })); return false; }
            return false;
          } return false;
        }
      }
    });
  }, [editor, formData.fields, triggerSymbol]);

  const executeSlashCommand = useCallback((cmd) => {
    const ms = slashMenuStateRef.current; editor?.chain().focus().deleteRange(ms.range).run(); cmd.action(editor); setSlashMenuState(s => ({ ...s, show: false }));
  }, [editor]);

  const handleEditorScroll = useCallback(() => {
    if (slashMenuStateRef.current.show) setSlashMenuState(s => ({ ...s, show: false }));
    if (varMenuStateRef.current.show) setVarMenuState(s => ({ ...s, show: false }));
    if (formatMenu.show) setFormatMenu({ show: false, top: 0, left: 0 });
    if (selectionMenu.show) setSelectionMenu(s => ({ ...s, show: false }));
  }, [formatMenu.show, selectionMenu.show]);

  // Sürükle Bırak (Dosya İçe Aktarma)
  const handleDragOver = (e) => { e.preventDefault(); if (mode === 'build') setIsDraggingFile(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDraggingFile(false); };

  const handleDrop = (e) => {
    e.preventDefault(); setIsDraggingFile(false);
    if (mode !== 'build') return;
    const file = e.dataTransfer.files[0];
    if (!file || !editor) return;

    if (file.type === "text/plain" || file.type === "text/html") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const contentToInsert = file.type === "text/plain" ? text.split('\n').map(line => `<p>${line}</p>`).join('') : DOMPurify.sanitize(text);
        editor.commands.setContent(contentToInsert); showToast("Belge başarıyla içe aktarıldı!", "success");
      }; reader.readAsText(file);
    } else if (file.name.endsWith('.docx')) {
      showToast(`${file.name} ayrıştırılıyor...`, "success", false);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = await mammoth.convertToHtml({ arrayBuffer: e.target.result });
          editor.commands.setContent(DOMPurify.sanitize(result.value)); showToast("Word dosyası başarıyla aktarıldı!", "success");
        } catch { showToast("Word dosyası okunurken hata oluştu.", "error"); }
      }; reader.readAsArrayBuffer(file);
    } else { showToast("Sadece .txt, .html veya .docx yükleyebilirsiniz.", "error"); }
  };

  // Dönüştürme (Çoklu Eşleşme) Mantığı
  const findOccurrences = (searchText) => {
    const occurrences = []; const { doc } = editor.state;
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); const regex = new RegExp(escapeRegExp(searchText), 'gi');
    doc.descendants((node, pos) => {
      if (node.isText) {
        let match; while ((match = regex.exec(node.text)) !== null) {
          occurrences.push({ from: pos + match.index, to: pos + match.index + match[0].length, contextBefore: node.text.substring(Math.max(0, match.index - 35), match.index), contextAfter: node.text.substring(match.index + match[0].length, Math.min(node.text.length, match.index + match[0].length + 35)), matchText: match[0], selected: true });
        }
      }
    }); return occurrences;
  };

  const executeConversion = (newField, finalVarName, positionsToReplace) => {
    setFormData(p => ({ ...p, fields: [...p.fields, newField] }));
    setExpandedFields([...expandedFields, newField.id]);
    let tr = editor.state.tr;
    const sym = getTriggerSymbols(triggerSymbol);
    [...positionsToReplace].sort((a, b) => b.from - a.from).forEach(({ from, to }) => { tr = tr.insertText(`${sym.s}${finalVarName}${sym.e}`, from, to); }); editor.view.dispatch(tr);
    setMultiReplace({ show: false, occurrences: [], newField: null, finalVarName: '', searchText: '' });
    setSelectionMenu({ show: false, top: 0, left: 0, mode: 'button', text: '', fieldType: 'text' }); setFormatMenu({ show: false, top: 0, left: 0 }); setVarNameInput('');
    showToast(`"${newField.label}" başarıyla eklendi! ✨`, 'success');
  };

  const confirmConversion = () => {
    if (!varNameInput.trim()) return showToast("Lütfen bu soru için bir başlık girin.", "error");
    const label = varNameInput.trim(); const baseVarName = generateVarName(label);
    const finalVarName = formData.fields.some(f => f.name === baseVarName) ? `${baseVarName}_${Math.floor(Math.random() * 100)}` : baseVarName;
    const newField = { id: Math.random().toString(36).substr(2, 9), name: finalVarName, label: label, fieldType: selectionMenu.fieldType || 'text', required: true, options: [], placeholder: `${label} giriniz...`, condition: null, nameEdited: true };
    const occurrences = findOccurrences(selectionMenu.text);
    if (occurrences.length > 1) { setMultiReplace({ show: true, searchText: selectionMenu.text, occurrences, newField, finalVarName }); setSelectionMenu({ show: false, top: 0, left: 0, mode: 'button', text: '', fieldType: 'text' }); setFormatMenu({ show: false, top: 0, left: 0 }); }
    else { const { from, to } = editor.state.selection; executeConversion(newField, finalVarName, [{ from, to }]); }
  };

  return (
    <div
      className={`${styles.canvas} ${isDraggingFile ? styles.canvasDragging : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onScroll={handleEditorScroll}
    >
      {isDraggingFile && (
        <div className={styles.dragOverlay}>
          <FileUp size={48} color="var(--accent)" />
          <h2>Belgeyi Buraya Bırakın</h2>
          <p>.txt ve .docx desteklenir</p>
        </div>
      )}

      <div id="tb-paper" className={styles.paper} onClick={() => { if (editor && !editor.isFocused) editor.chain().focus().run(); }}>
        <EditorContent editor={editor} />
      </div>

      {/* --- Variable AutoComplete Menu --- */}
      {varMenuState.show && mode === 'build' && (
        <div className={`no-print ${styles.slashMenu}`} data-testid="variable-menu" style={{ top: varMenuState.pos.top, left: varMenuState.pos.left }}>
          <div className={styles.autocompleteHeader}>DEĞİŞKENLER</div>
          {formData.fields.filter(f => f.name.toLowerCase().includes(varMenuState.query.toLowerCase())).length > 0 ? (
            formData.fields.filter(f => f.name.toLowerCase().includes(varMenuState.query.toLowerCase())).map((f, index) => (
              <div key={f.id} id={`var-item-${index}`} onClick={() => {
                const sym = getTriggerSymbols(triggerSymbol);
                editor.chain().focus().deleteRange(varMenuState.range).insertContent({ type: 'text', text: `${sym.s}${f.name}${sym.e} ` }).run();
                setVarMenuState({ show: false });
              }} onMouseMove={(e) => { if (Math.abs(e.clientX - mousePosRef.current.x) > 2 || Math.abs(e.clientY - mousePosRef.current.y) > 2) { mousePosRef.current = { x: e.clientX, y: e.clientY }; if (varSelectedIndex !== index) setVarSelectedIndex(index); } }} className={`${styles.slashItem} ${index === varSelectedIndex ? styles.slashItemActive : ''}`}>
                <span className={styles.slashLabel}>{f.label || f.name}</span>
              </div>
            ))
          ) : <div className={styles.autocompleteEmpty}>Eşleşen alan yok</div>}
        </div>
      )}

      {/* --- Slash Command Menu --- */}
      {slashMenuState.show && mode === 'build' && (
        <div className={`no-print ${styles.slashMenu}`} data-testid="slash-menu" style={{ top: slashMenuState.pos.top, left: slashMenuState.pos.left }}>
          <div className={styles.autocompleteHeader}>TEMEL BLOKLAR</div>
          {filteredSlashCmds.length > 0 ? filteredSlashCmds.map((cmd, index) => (
            <div key={cmd.id} id={`slash-item-${index}`} onClick={() => executeSlashCommand(cmd)} onMouseMove={(e) => { if (Math.abs(e.clientX - mousePosRef.current.x) > 2 || Math.abs(e.clientY - mousePosRef.current.y) > 2) { mousePosRef.current = { x: e.clientX, y: e.clientY }; if (slashSelectedIndex !== index) setSlashSelectedIndex(index); } }} className={`${styles.slashItem} ${index === slashSelectedIndex ? styles.slashItemActive : ''}`}>
              <span className={styles.slashIcon}>{cmd.icon}</span><span className={styles.slashLabel}>{cmd.label}</span>
            </div>
          )) : <div className={styles.autocompleteEmpty}>Eşleşen komut bulunamadı</div>}
        </div>
      )}

      {/* --- Bubble Menu (Soruya Dönüştür) --- */}
      {formatMenu.show && selectionMenu.show && mode === 'build' && (
        <div className={styles.combinedBubbleMenu} style={{ top: formatMenu.top, left: formatMenu.left }} onMouseDown={e => e.preventDefault()}>
          <div className={styles.bubbleSelectionGroup}>
            {selectionMenu.mode === 'button' ? (
              <button type="button" onClick={() => {
                const textBefore = editor.state.doc.textBetween(Math.max(0, editor.state.selection.from - 40), editor.state.selection.from, null, '\ufffc');
                const match = textBefore.match(/([a-zA-ZçğıöşüÇĞİÖŞÜ\s]+):\s*$/);
                setVarNameInput(match && match[1].trim() ? match[1].trim() : ''); 
                setSelectionMenu(p => ({ ...p, mode: 'input' }));
              }} className={styles.bubbleBtn}><Sparkles size={14} /> Soruya Dönüştür</button>
            ) : (
              <div className={styles.bubbleInputRow}>
                <input autoFocus placeholder="Soru Başlığı" value={varNameInput} onChange={e => setVarNameInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') confirmConversion(); if (e.key === 'Escape') setSelectionMenu(p => ({ ...p, mode: 'button' })); }} className={styles.bubbleInput} />
                <select value={selectionMenu.fieldType} onChange={e => setSelectionMenu(p => ({ ...p, fieldType: e.target.value }))} className={styles.bubbleSelect}>{FIELD_TYPES.map(type => (<option key={type.value} value={type.value}>{type.label}</option>))}</select>
                <button onClick={confirmConversion} className={styles.bubbleConfirmBtn}>Ekle</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Multi Replace Modal --- */}
      {multiReplace.show && (
        <div className={globalStyles.overlay}>
          <div className={globalStyles.modal} style={{ maxWidth: '560px' }}>
            <div className={globalStyles.modalHead}>
              <div className={globalStyles.modalIcon} style={{ background: 'var(--text-primary)', color: 'var(--bg-surface)', borderColor: 'var(--border)' }}><Layers size={20} /></div>
              <div><h3>Çoklu Eşleşme Bulundu</h3><p><b>"{multiReplace.searchText}"</b> ifadesi belgede {multiReplace.occurrences.length} kez geçiyor.</p></div>
              <button className={globalStyles.modalClose} onClick={() => setMultiReplace({ show: false, occurrences: [], newField: null, finalVarName: '', searchText: '' })}><X size={18} /></button>
            </div>
            <div className={globalStyles.modalBody}>
              <div className={styles.multiReplaceList}>
                {multiReplace.occurrences.map((occ, idx) => (
                  <div key={idx} className={`${styles.occurrenceItem} ${occ.selected ? styles.occurrenceSelected : ''}`} onClick={() => {
                    const newOccs = [...multiReplace.occurrences]; newOccs[idx].selected = !newOccs[idx].selected;
                    setMultiReplace({ ...multiReplace, occurrences: newOccs });
                  }}>
                    <input type="checkbox" checked={occ.selected} readOnly className={styles.chk} style={{ marginTop: '3px' }} />
                    <div className={styles.occurrenceText}>...{occ.contextBefore}<span className={styles.occurrenceMatch}>{occ.matchText}</span>{occ.contextAfter}...</div>
                  </div>
                ))}
              </div>
            </div>
            <div className={globalStyles.modalFoot}>
              <button className={globalStyles.cancelBtn} onClick={() => setMultiReplace({ show: false, occurrences: [], newField: null, finalVarName: '', searchText: '' })}>Vazgeç</button>
              <button className={styles.primaryBtn} onClick={() => {
                const selectedOccs = multiReplace.occurrences.filter(o => o.selected);
                if (selectedOccs.length === 0) return showToast("Hiçbir eşleşme seçmediniz.", "error");
                executeConversion(multiReplace.newField, multiReplace.finalVarName, selectedOccs);
              }}>Seçili Olanları Değiştir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorCanvas;