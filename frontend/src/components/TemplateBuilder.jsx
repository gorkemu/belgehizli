// frontend/src/components/TemplateBuilder.jsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './TemplateBuilder.module.css';
import DocumentForm from './DocumentForm';
import DocumentPreview from './DocumentPreview';

import DOMPurify from 'dompurify';
import CharacterCount from '@tiptap/extension-character-count';

import { driver } from "driver.js";
import "driver.js/dist/driver.css";

import {
  Wrench, Eye, Save, X, Plus, Trash2, CheckCircle2, AlertCircle,
  ArrowLeft, ChevronDown, ChevronUp, Type, AlignLeft, Calendar,
  CheckSquare, CircleDot, Hash, Settings, GripVertical,
  Undo2, Redo2, Bold, Italic, PenTool, Link as LinkIcon, Copy,
  AlignCenter, AlignRight, Zap, Heading1, Heading2, Heading3,
  Sparkles, Lightbulb, Wand2, Layers, Loader2, Cloud,
  Bot, Palette, Highlighter, List, ListOrdered, Scissors,
  FileUp, Printer, Variable, AlignJustify
} from 'lucide-react';

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import { Highlight } from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import * as mammoth from 'mammoth';
import axios from 'axios';
import Handlebars from 'handlebars';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const EDITOR_LIMITS = { MAX_CHARS: 50000, MAX_IMAGE_SIZE_MB: 2 };

const THEMES = [
  { id: 'default', label: 'Gün Işığı', emoji: '☀️' },
  { id: 'dark', label: 'Gece Yarısı', emoji: '🌙' },
  { id: 'amber', label: 'Kütüphane', emoji: '🕯️' },
  { id: 'forest', label: 'Orman', emoji: '🌲' },
  { id: 'glacier', label: 'Buzul', emoji: '❄️' },
  { id: 'sunset', label: 'Günbatımı', emoji: '🌅' },
  { id: 'ink', label: 'Mürekkep', emoji: '🖋️' },
  { id: 'lavender', label: 'Lavanta', emoji: '🔮' },
];

if (!Handlebars.helpers.eq) {
  Handlebars.registerHelper('eq', function (a, b) {
    return String(a) == String(b);
  });
}

const VARIABLE_FORMATS = [
  { id: 'curly2', label: 'Çift Süslü Parantez', ex: '{{isim}}', regex: /\{\{\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*\}\}/g },
  { id: 'square', label: 'Köşeli Parantez', ex: '[isim]', regex: /\[\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*\]/g },
  { id: 'angle2', label: 'Çift Ok', ex: '<<isim>>', regex: /(?:&lt;|<){2}\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*(?:&gt;|>){2}/g },
  { id: 'curly1', label: 'Tek Süslü Parantez', ex: '{isim}', regex: /\{(?!\s*\{)\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*\}(?!\s*\})/g },
  { id: 'at', label: 'Et İşareti', ex: '@isim', regex: /@([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)/g }
];

const TEXT_COLORS = ['#000000', '#1e293b', '#334155', '#475569', '#2563eb', '#dc2626', '#059669'];
const HIGHLIGHT_COLORS = ['transparent', '#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8'];

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

const FIELD_TYPES = [
  { value: 'text', label: 'Kısa Metin', icon: Type }, { value: 'textarea', label: 'Uzun Metin', icon: AlignLeft },
  { value: 'number', label: 'Sayı', icon: Hash }, { value: 'date', label: 'Tarih', icon: Calendar },
  { value: 'select', label: 'Açılır Liste', icon: ChevronDown }, { value: 'radio', label: 'Tekli Seçim', icon: CircleDot },
  { value: 'checkbox', label: 'Çoklu Seçim', icon: CheckSquare }
];

const generateVarName = (text) => text.toString().toLowerCase().replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

const getTriggerSymbols = (t) => {
  if (t === '[') return { s: '[', e: ']' };
  if (t === '{') return { s: '{', e: '}' };
  if (t === '{{') return { s: '{{', e: '}}' };
  if (t === '<<') return { s: '<<', e: '>>' };
  if (t === '@') return { s: '@', e: '' };
  return { s: t, e: '' };
};

const getRegexForTrigger = (trigger) => {
  if (trigger === '{{') return /\{\{\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*\}\}/g;
  if (trigger === '[') return /\[\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*\]/g;
  if (trigger === '{') return /\{(?!\s*\{)\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*\}(?!\s*\})/g;
  if (trigger === '<<') return /(?:<<|&lt;&lt;)\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*(?:>>|&gt;&gt;)/g;
  if (trigger === '@') return /@([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)/g;
  const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`${escaped}([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)`, 'g');
};

const cleanHtmlContent = (html) => html || '';

const insertSignatureBlock = (type) => {
  let html = '';
  if (type === 'left') {
    html = `<p style="text-align: left"><strong>[Taraf / Unvan]</strong></p><p style="text-align: left"><br></p><p style="text-align: left">İmza</p><p></p>`;
  } else if (type === 'right') {
    html = `<p style="text-align: right"><strong>[Taraf / Unvan]</strong></p><p style="text-align: right"><br></p><p style="text-align: right">İmza</p><p></p>`;
  }
  return html;
};

const convertToHandlebars = (html, trigger) => {
  let processedHtml = html || '';
  processedHtml = processedHtml.replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ');

  const condRegex = /(?:<p>)?\s*(?:<strong[^>]*>)?\[EĞER:\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*=\s*([^\]]+)\](?:<\/strong>)?\s*(?:<\/p>)?([\s\S]*?)(?:<p>)?\s*(?:<strong[^>]*>)?\[ŞART SONU\](?:<\/strong>)?\s*(?:<\/p>)?/g;
  processedHtml = processedHtml.replace(condRegex, '{{#if (eq $1 "$2")}}$3{{/if}}');

  if (trigger && trigger !== '{{') {
    const tempDiv = window.document.createElement('div');
    tempDiv.innerHTML = processedHtml;
    const regex = getRegexForTrigger(trigger);
    const walk = (node) => {
      if (node.nodeType === 3) node.nodeValue = node.nodeValue.replace(regex, '{{$1}}');
      else if (node.nodeType === 1) { for (let child of node.childNodes) walk(child); }
    };
    walk(tempDiv);
    processedHtml = tempDiv.innerHTML;
  }
  return processedHtml;
};

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

const SortableFieldCard = ({ field, index, isExpanded, formErrors, isHighlighted, toggleExpand, updateField, updateFieldLabelAndName, updateFieldName, removeField, addOption, updateOption, removeOption, toggleCondition, getChoiceFields, allFields, onInsertVariable }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const [tab, setTab] = useState('basic');
  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 50 : 1 };
  const FieldIcon = FIELD_TYPES.find(t => t.value === (field.fieldType || 'text'))?.icon || Type;
  const hasError = formErrors[`field_${index}`] || formErrors[`options_${index}`];

  return (
    <div ref={setNodeRef} style={style} className={`${styles.fieldCard} ${hasError ? styles.cardError : ''} ${isExpanded ? styles.cardOpen : ''} ${isHighlighted ? styles.cardHighlighted : ''}`}>
      <div className={styles.fieldHeader} onClick={() => toggleExpand(field.id)}>
        <div className={styles.fieldHeaderLeft}>
          <span {...attributes} {...listeners} className={styles.dragHandle} onClick={e => e.stopPropagation()}><GripVertical size={16} /></span>
          <div className={styles.fieldTypeIcon}><FieldIcon size={15} /></div>
          <span className={styles.fieldLabel}>{field.label || <span className={styles.unnamed}>İsimsiz alan</span>}</span>
        </div>
        <div className={styles.fieldHeaderRight}>
          {field.name && (
            <button className={styles.insertVarBtn} onClick={(e) => { e.stopPropagation(); onInsertVariable(field.name); }} title="Metne Ekle">
              <Plus size={12} /> Ekle
            </button>
          )}
          {hasError && <AlertCircle size={15} className={styles.errorIcon} />}
          {isExpanded ? <ChevronUp size={16} className={styles.chevron} /> : <ChevronDown size={16} className={styles.chevron} />}
        </div>
      </div>
      {isExpanded && (
        <div className={styles.fieldBody}>
          <div className={styles.tabRow}><button className={`${styles.tab} ${tab === 'basic' ? styles.tabActive : ''}`} onClick={() => setTab('basic')}>Temel</button><button className={`${styles.tab} ${tab === 'advanced' ? styles.tabActive : ''}`} onClick={() => setTab('advanced')}>Gelişmiş</button></div>
          {tab === 'basic' ? (
            <div className={styles.tabContent}>
              <div className={styles.fg}><label>Soru metni</label><input className={`${styles.inp} ${formErrors[`field_${index}`] ? styles.inpErr : ''}`} value={field.label || ''} onChange={e => updateFieldLabelAndName(index, e.target.value)} placeholder="Örn: Adı Soyadı" autoFocus /></div>
              <div className={styles.row2}>
                <div className={styles.fg}><label>Alan tipi</label><select className={styles.sel} value={field.fieldType || 'text'} onChange={e => updateField(index, 'fieldType', e.target.value)}>{FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                <div className={styles.fgCheck}><label className={styles.checkLabel}><input type="checkbox" checked={field.required !== false} onChange={e => updateField(index, 'required', e.target.checked)} className={styles.chk} /> Zorunlu alan</label></div>
              </div>
              {['select', 'radio', 'checkbox'].includes(field.fieldType) && (
                <div className={`${styles.optArea} ${formErrors[`options_${index}`] ? styles.optAreaErr : ''}`}>
                  <label>Seçenekler</label>
                  {(field.options || []).map((opt, oi) => (<div key={oi} className={styles.optRow}><span className={styles.optBullet} /><input className={`${styles.inp} ${formErrors[`options_${index}`] && !opt.trim() ? styles.inpErr : ''}`} value={opt} onChange={e => updateOption(index, oi, e.target.value)} placeholder={`Seçenek ${oi + 1}`} /><button className={styles.optDel} onClick={() => removeOption(index, oi)}><X size={13} /></button></div>))}
                  <button className={styles.addOpt} onClick={() => addOption(index)}><Plus size={14} /> Seçenek ekle</button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.tabContent}>
              <div className={styles.fg}><label>Değişken adı <span className={styles.hint}>(otomatik)</span></label><input className={`${styles.inp} ${styles.monoInp}`} value={field.name || ''} onChange={e => updateFieldName(index, e.target.value)} /></div>
              <div className={styles.fg}><label>Placeholder metni</label><input className={styles.inp} value={field.placeholder || ''} onChange={e => updateField(index, 'placeholder', e.target.value)} placeholder="Yönlendirici metin..." /></div>
              <div className={styles.condWrap}>
                {!field.condition ? (<button className={styles.addCond} onClick={() => toggleCondition(index)}><Zap size={13} /> Gösterim şartı ekle</button>) : (
                  <div className={styles.condBox}>
                    <div className={styles.condTitle}><Settings size={13} /> Gösterim şartı <button className={styles.removeCond} onClick={() => updateField(index, 'condition', null)}>Kaldır</button></div>
                    <div className={styles.row2}>
                      <div className={styles.fg}><label>Hangi soruya bağlı?</label><select className={styles.sel} value={field.condition.field || ''} onChange={e => updateField(index, 'condition', { ...field.condition, field: e.target.value, value: '' })}><option value="">Seçiniz…</option>{getChoiceFields(index).map(f => <option key={f.name} value={f.name}>{f.label || f.name}</option>)}</select></div>
                      {field.condition.field && (<div className={styles.fg}><label>Cevabı ne olmalı?</label><select className={styles.sel} value={field.condition.value || ''} onChange={e => updateField(index, 'condition', { ...field.condition, value: e.target.value })}><option value="">Seçiniz…</option>{(allFields.find(f => f.name === field.condition.field)?.options || []).map(o => <option key={o} value={o}>{o}</option>)}</select></div>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className={styles.fieldFooter}><button className={styles.delBtn} onClick={() => removeField(index)}><Trash2 size={13} /> Sil</button></div>
        </div>
      )}
    </div>
  );
};

export const TemplateBuilder = ({ initialData, onSave }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('build');
  const [previewStep, setPreviewStep] = useState(1);
  const [expandedFields, setExpandedFields] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [virtualFormData, setVirtualFormData] = useState({});
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfConfirmModal, setPdfConfirmModal] = useState(false);

  const [triggerSymbol, setTriggerSymbol] = useState(initialData?.settings?.variableTrigger || '{{');
  const [isTriggerCustom, setIsTriggerCustom] = useState(!['{{', '[', '{', '@', '<<'].includes(initialData?.settings?.variableTrigger || '{{'));
  const [customTriggerInput, setCustomTriggerInput] = useState('');

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef(null);

  const [condModal, setCondModal] = useState(false);
  const [condField, setCondField] = useState('');
  const [condValue, setCondValue] = useState('');

  const [editorTheme, setEditorTheme] = useState('default');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const [magicModal, setMagicModal] = useState({ show: false, selectedFormat: 'curly2' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [highlightedField, setHighlightedField] = useState(null);

  const [selectionMenu, setSelectionMenu] = useState({ show: false, top: 0, left: 0, mode: 'button', text: '', fieldType: 'text' });
  const [formatMenu, setFormatMenu] = useState({ show: false, top: 0, left: 0 });

  const [slashMenuState, setSlashMenuState] = useState({ show: false, pos: { top: 0, left: 0 }, query: '', range: null });
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);

  const [varMenuState, setVarMenuState] = useState({ show: false, pos: { top: 0, left: 0 }, query: '', range: null });
  const [varSelectedIndex, setVarSelectedIndex] = useState(0);

  const [popover, setPopover] = useState({ show: false, type: null, top: 0, left: 0 });
  const [varNameInput, setVarNameInput] = useState('');
  const [multiReplace, setMultiReplace] = useState({ show: false, searchText: '', occurrences: [], newField: null, finalVarName: '' });
  const [saveStatus, setSaveStatus] = useState('saved');

  const previewEditorRef = useRef(null);
  const debounceTimer = useRef(null);
  const handleSaveRef = useRef(null);
  const mousePosRef = useRef({ x: 0, y: 0 });

  const slashMenuStateRef = useRef(slashMenuState);
  const slashSelectedIndexRef = useRef(slashSelectedIndex);
  const varMenuStateRef = useRef(varMenuState);
  const varSelectedIndexRef = useRef(varSelectedIndex);

  const filteredSlashCmds = useMemo(() => SLASH_COMMANDS.filter(cmd => cmd.label.toLowerCase().includes(slashMenuState.query.toLowerCase())), [slashMenuState.query]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('template_theme');
    if (savedTheme) setEditorTheme(savedTheme);
  }, []);

  const handleThemeChange = useCallback((newTheme) => {
    setEditorTheme(newTheme);
    localStorage.setItem('template_theme', newTheme);
    setPopover({ show: false });
  }, []);

  useEffect(() => { slashMenuStateRef.current = slashMenuState; }, [slashMenuState]);
  useEffect(() => { slashSelectedIndexRef.current = slashSelectedIndex; }, [slashSelectedIndex]);
  useEffect(() => { varMenuStateRef.current = varMenuState; }, [varMenuState]);
  useEffect(() => { varSelectedIndexRef.current = varSelectedIndex; }, [varSelectedIndex]);

  const [formData, setFormData] = useState(() => {
    const d = initialData || { name: '', description: '', content: '', fields: [], settings: {} };
    d.fields = (d.fields || []).map(f => ({ ...f, id: f.id || Math.random().toString(36).substr(2, 9) }));
    if (d.content && d.content.includes('<h1>Bölüm Başlığı</h1>')) d.content = '';
    return d;
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [editorInstance, setEditorInstance] = useState(null);

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
    onCreate: ({ editor: ed }) => { setTimeout(() => setEditorInstance(ed), 0); },
    onUpdate: ({ editor: ed }) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        setFormData(p => ({ ...p, content: ed.getHTML() }));
        if (formErrors.content) setFormErrors(p => ({ ...p, content: false }));
        checkCursorForMenu(ed);
      }, 400);
    },
    onSelectionUpdate: ({ editor: ed }) => checkCursorForMenu(ed)
  });

  const showToast = useCallback((msg, type = 'success', silent = false) => { if (silent) return; setToast({ show: true, message: msg, type }); setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3200); }, []);
  const getCleanFields = () => formData.fields.map(f => ({ ...f, options: (f.options || []).filter(o => o.trim()) }));

  const handleTriggerChange = useCallback((newTrigger) => {
    if (!newTrigger || !newTrigger.trim() || newTrigger === triggerSymbol) return;
    if (newTrigger.length > 5) return showToast('Tetikleyici en fazla 5 karakter olabilir.', 'error');
    if (newTrigger.includes('/')) return showToast(" '/' işareti komut menüsü için ayrılmıştır.", "error");

    if (editor) {
      let currentHtml = editor.getHTML();
      const newSym = getTriggerSymbols(newTrigger);
      const regex = getRegexForTrigger(triggerSymbol);

      const tempDiv = window.document.createElement('div');
      tempDiv.innerHTML = currentHtml;

      const walk = (node) => {
        if (node.nodeType === 3) {
          node.nodeValue = node.nodeValue.replace(regex, (match, p1) => {
            return `${newSym.s}${p1}${newSym.e}`;
          });
        } else if (node.nodeType === 1) {
          for (let child of node.childNodes) walk(child);
        }
      };
      walk(tempDiv);
      currentHtml = tempDiv.innerHTML;

      editor.commands.setContent(currentHtml, false);
    }
    setTriggerSymbol(newTrigger);
    showToast('Değişken formatı güncellendi.', 'success');
  }, [editor, triggerSymbol, showToast]);

  const previewHtml = useMemo(() => {
    let html = formData.content || '';
    if (!html) return '';

    html = html.replace(/<div[^>]*style="[^"]*(margin:\s*0px auto|margin:\s*0px 0px 0px auto)[^"]*"[^>]*>([\s\S]*?)<img([^>]+)>([\s\S]*?)<\/div>/gi, (match, margin, before, imgAttrs, after) => {
      const alignClass = margin.includes('0px 0px 0px auto') ? 'tiptap-align-right' : 'tiptap-align-center';
      let newImgAttrs = imgAttrs;
      if (newImgAttrs.includes('class="')) {
        newImgAttrs = newImgAttrs.replace('class="', `class="${alignClass} `);
      } else {
        newImgAttrs = ` class="${alignClass}" ` + newImgAttrs;
      }
      return `<img${newImgAttrs}>`;
    });

    html = html.replace(/<div[^>]*style="display:\s*flex[^>]*>\s*(<img[^>]+>)\s*<\/div>/gi, "$1");

    const purifyConfig = {
      ALLOWED_TAGS: [
        'b', 'i', 'em', 'strong', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'img', 'table', 'tr', 'td', 'th',
        'tbody', 'thead', 'tfoot', 'hr', 'br', 'div', 'span', 'iframe', 'figure', 'figcaption'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'class', 'style', 'data-align', 'align',
        'data-background-color', 'width', 'height', 'allowfullscreen', 'frameborder', 'target'
      ],
      FORBID_TAGS: ['script'],
      KEEP_CONTENT: true
    };

    try {
      const hbHtml = convertToHandlebars(html, triggerSymbol);
      const template = Handlebars.compile(hbHtml);
      const finalHtml = template(virtualFormData || {});

      return DOMPurify.sanitize(cleanHtmlContent(finalHtml), purifyConfig);
    } catch (error) {
      console.error("Önizleme derleme hatası:", error);
      return DOMPurify.sanitize(cleanHtmlContent(html), purifyConfig);
    }
  }, [formData.content, virtualFormData, triggerSymbol]);

  const handleSave = async (silent = false) => {
    const err = {};

    if (!formData.name?.trim()) err.name = true;

    const currentContent = editor ? editor.getHTML() : (formData.content || '');
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

    if (Object.keys(err).length) {
      if (!silent) {
        setFormErrors(err);
        showToast('Lütfen eksik alanları (kırmızı) tamamlayın.', 'error');
        const fi = Object.keys(err)
          .find(k => k.startsWith('field_') || k.startsWith('options_'))
          ?.split('_')[1];
        if (fi !== undefined) {
          const id = formData.fields[fi]?.id;
          if (id && !expandedFields.includes(id)) {
            setExpandedFields(p => [...p, id]);
          }
        }
      }
      return;
    }

    setFormErrors({});
    setSaveStatus('saving');

    try {
      const sanitizedContent = DOMPurify.sanitize(currentContent);
      await onSave({
        ...formData,
        content: sanitizedContent,
        fields: getCleanFields(),
        settings: {
          ...formData.settings,
          variableTrigger: triggerSymbol
        }
      });
      if (!silent) showToast('Şablon başarıyla kaydedildi!', 'success');
      setSaveStatus('saved');
    } catch {
      if (!silent) showToast('Kaydetme başarısız oldu.', 'error');
      setSaveStatus('error');
    }
  };

  useEffect(() => {
    handleSaveRef.current = handleSave;
  });

  useEffect(() => {
    if (!editor) return;
    const hasSeenTour = localStorage.getItem('template_builder_tour_seen');
    if (hasSeenTour) return;

    const timer = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        doneBtnText: 'Bitir 🎉',
        nextBtnText: 'İleri →',
        prevBtnText: '← Geri',
        popoverClass: 'custom-driver-theme',
        allowClose: false,
        steps: [
          {
            element: '#tb-paper',
            popover: {
              title: '📄 Beyaz Kağıt',
              description: 'Belge içeriğinizi buraya yazın. Mevcut bir Word / .txt dosyasını doğrudan kağıdın üzerine sürükleyip bırakabilirsiniz.',
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '#tb-toolbar',
            popover: {
              title: '✍️ Düzenleme Araçları',
              description: 'Yazı tipi, boyut, hizalama, imza ve tablo gibi tüm biçimlendirme araçlarını buradan kullanabilirsiniz.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tb-magic-btn',
            popover: {
              title: '✨ Sihirli Algılama',
              description: 'Daha önce <code>{{isim}}</code>, <code>[tarih]</code> gibi formatlar kullandıysanız bu buton hepsini otomatik bulur ve sol panele form alanı olarak ekler.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#field-list',
            popover: {
              title: '📋 Form Alanları',
              description: 'Kağıtta bir kelimeyi fareyle seçtiğinizde beliren "Soruya Dönüştür" seçeneği, o kelimeyi otomatik olarak form sorusuna çevirir.',
              side: 'right',
              align: 'center',
            },
          },
          {
            element: '#tb-cond-btn',
            popover: {
              title: '⚡ Şartlı Blok',
              description: 'Belirli bir form sorusuna verilen cevaba göre gösterilecek / gizlenecek paragraflar ekleyebilirsiniz.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#tb-theme-btn',
            popover: {
              title: '🎨 Tema Seçici',
              description: 'Gözünüzü yormaması için çalışma alanınızın temasını (Gece Yarısı, Orman vb.) buradan değiştirebilirsiniz.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#tb-share-btn',
            popover: {
              title: '🔗 Genel Bağlantı',
              description: 'Müşterilerinize veya karşı tarafa göndereceğiniz form linkini buradan oluşturup kopyalayabilirsiniz.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#tb-preview-btn',
            popover: {
              title: '👁 Önizleme & Test',
              description: 'Formu test verileriyle doldurun, belgenizin nasıl görüneceğini canlı izleyin ve PDF olarak indirin.',
              side: 'bottom',
              align: 'center',
            },
          },
        ],
        onDestroyStarted: () => {
          localStorage.setItem('template_builder_tour_seen', 'true');
          driverObj.destroy();
        },
      });
      driverObj.drive();
    }, 900);

    return () => clearTimeout(timer);
  }, [editor]);

  useEffect(() => {
    if (!formData.name && formData.fields.length === 0) return;

    setSaveStatus('unsaved');
    const timer = setTimeout(() => {
      handleSaveRef.current?.(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [formData]);

  const openPopover = (e, type) => { const rect = e.currentTarget.getBoundingClientRect(); setPopover({ show: true, type, top: rect.bottom + 6, left: rect.left }); };
  const closePopover = () => setPopover({ show: false, type: null, top: 0, left: 0 });

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

  useEffect(() => {
    if (slashMenuState.show) { const el = window.document.getElementById(`slash-item-${slashSelectedIndex}`); if (el) el.scrollIntoView({ block: 'nearest' }); }
    if (varMenuState.show) { const el = window.document.getElementById(`var-item-${varSelectedIndex}`); if (el) el.scrollIntoView({ block: 'nearest' }); }
  }, [slashSelectedIndex, slashMenuState.show, varSelectedIndex, varMenuState.show]);

  const handleEditorScroll = useCallback(() => {
    if (slashMenuStateRef.current.show) setSlashMenuState(s => ({ ...s, show: false }));
    if (varMenuStateRef.current.show) setVarMenuState(s => ({ ...s, show: false }));
    if (formatMenu.show) setFormatMenu({ show: false, top: 0, left: 0 });
    if (selectionMenu.show) setSelectionMenu(s => ({ ...s, show: false }));
  }, [formatMenu.show, selectionMenu.show]);

  const executeSlashCommand = useCallback((cmd) => {
    const ms = slashMenuStateRef.current; editor?.chain().focus().deleteRange(ms.range).run(); cmd.action(editor); setSlashMenuState(s => ({ ...s, show: false }));
  }, [editor]);

  const handleInsertVariable = useCallback((name) => {
    if (!editor) return;
    const sym = getTriggerSymbols(triggerSymbol);
    editor.chain().focus().insertContent({ type: 'text', text: ` ${sym.s}${name}${sym.e} ` }).run();
    showToast('Metne eklendi!', 'success');
  }, [editor, triggerSymbol, showToast]);

  const handlePrintPDF = async () => {
    setIsGeneratingPdf(true); showToast('PDF hazırlanıyor...', 'success');
    try {
      const token = localStorage.getItem('user_token');
      const hbHtml = convertToHandlebars(editor.getHTML(), triggerSymbol);
      const template = Handlebars.compile(hbHtml);
      const finalHtml = template(virtualFormData);

      const targetId = initialData?._id || 'preview';
      const res = await axios.post(`${API_BASE_URL}/projects/${targetId}/generate-pdf`,
        { html: finalHtml, documentName: formData.name || 'Sablon' },
        { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a'); link.href = url; link.download = `${formData.name || 'Sablon'}.pdf`; window.document.body.appendChild(link); link.click(); link.parentNode.removeChild(link);
      showToast('PDF başarıyla indirildi!');
    } catch (error) {
      console.error(error); showToast('PDF oluşturulurken hata!', 'error');
    } finally { setIsGeneratingPdf(false); setPdfConfirmModal(false); }
  };

  const handleDragOver = (e) => { e.preventDefault(); if (mode === 'build') setIsDraggingFile(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDraggingFile(false); };

  const processFile = (file) => {
    if (!file || !editor) return;
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 2) return showToast("Dosya boyutu çok büyük (Max 2MB).", "error");

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
    } else if (file.type === "application/pdf") {
      showToast("PDF ayrıştırma servisi (backend) şu an aktif değil. Lütfen .docx kullanın.", "error");
    } else { showToast("Lütfen sadece .txt, .html veya .docx dosyası yükleyin.", "error"); }
  };

  const handleDrop = (e) => { e.preventDefault(); setIsDraggingFile(false); if (mode !== 'build') return; processFile(e.dataTransfer.files[0]); };
  const handleFileInputChange = (e) => { processFile(e.target.files[0]); if (fileInputRef.current) fileInputRef.current.value = ""; };

  const validatePreviewForm = () => {
    const requiredFields = formData.fields.filter(f => f.required);
    for (let field of requiredFields) {
      if (field.condition && field.condition.field) {
        const depValue = virtualFormData[field.condition.field];
        if (depValue !== field.condition.value) continue;
      }
      const val = virtualFormData[field.name];
      if (val === undefined || val === null || val === '') return false;
      if (Array.isArray(val) && val.length === 0) return false;
    } return true;
  };

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
    setExpandedFields([newField.id]); setHighlightedField(newField.id); setTimeout(() => setHighlightedField(null), 2500);
    setTimeout(() => { const el = document.getElementById('field-list'); if (el) el.scrollTop = el.scrollHeight; }, 100);
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

  const handleConvertClick = () => {
    if (!editor) return; const { $from } = editor.state.selection;
    const textBefore = $from.parent.textBetween(Math.max(0, $from.parentOffset - 40), $from.parentOffset, null, '\ufffc');
    const match = textBefore.match(/([a-zA-ZçğıöşüÇĞİÖŞÜ\s]+):\s*$/);
    setVarNameInput(match && match[1].trim() ? match[1].trim() : ''); setSelectionMenu(p => ({ ...p, mode: 'input' }));
  };

  const toggleOccurrence = (index) => { setMultiReplace(prev => { const newOccs = [...prev.occurrences]; newOccs[index].selected = !newOccs[index].selected; return { ...prev, occurrences: newOccs }; }); };
  const handleMultiReplaceConfirm = () => { const selectedOccs = multiReplace.occurrences.filter(o => o.selected); if (selectedOccs.length === 0) return showToast("Hiçbir eşleşme seçmediniz.", "error"); executeConversion(multiReplace.newField, multiReplace.finalVarName, selectedOccs); };

  const executeMagicExtract = () => {
    if (!editor) return; const format = VARIABLE_FORMATS.find(f => f.id === magicModal.selectedFormat); if (!format) return;
    const currentHtml = editor.getHTML(); const matches = [...currentHtml.matchAll(format.regex)].map(m => m[1]); const uniqueRawNames = [...new Set(matches)];
    if (uniqueRawNames.length === 0) { showToast(`Belgede "${format.ex}" formatında bir değişken bulunamadı.`, "error"); return; }
    const newFields = []; const existingVarNames = formData.fields.map(f => f.name);
    const sym = getTriggerSymbols(triggerSymbol);
    const normalizedHtml = currentHtml.replace(format.regex, (match, p1) => `${sym.s}${generateVarName(p1)}${sym.e}`);
    uniqueRawNames.forEach(rawName => {
      const cleanVarName = generateVarName(rawName);
      if (!existingVarNames.includes(cleanVarName) && !newFields.some(f => f.name === cleanVarName)) { newFields.push({ id: Math.random().toString(36).substr(2, 9), name: cleanVarName, label: rawName.trim().toUpperCase(), fieldType: 'text', required: true, options: [], condition: null, nameEdited: true }); }
    });
    if (newFields.length > 0) {
      setFormData(p => ({ ...p, fields: [...p.fields, ...newFields] })); setExpandedFields(newFields.map(f => f.id)); setHighlightedField(newFields[0].id); setTimeout(() => setHighlightedField(null), 2500);
      setTimeout(() => { const el = document.getElementById('field-list'); if (el) el.scrollTop = el.scrollHeight; }, 100);
    }
    editor.commands.setContent(normalizedHtml); setMagicModal({ show: false, selectedFormat: 'curly2' }); showToast(`${uniqueRawNames.length} değişken algılandı! ✨`, 'success');
  };

  const insertConditional = () => {
    if (!condField || !condValue) return showToast('Değişkeni ve değeri seçin.', 'error');
    const html = `<p><strong style="color: #d97706;">[EĞER: ${condField} = ${condValue}]</strong></p><p>Buraya şartlı metninizi yazın...</p><p><strong style="color: #d97706;">[ŞART SONU]</strong></p><p></p>`;
    editor?.chain().focus().insertContent(html).run();
    setCondModal(false); setCondField(''); setCondValue(''); showToast('Şartlı blok eklendi.');
  };

  const toggleExpand = id => setExpandedFields(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
  const addField = () => {
    const id = Math.random().toString(36).substr(2, 9);
    setFormData(p => ({ ...p, fields: [...p.fields, { id, name: '', label: '', fieldType: 'text', required: true, options: [], placeholder: '', condition: null, nameEdited: false }] }));
    setExpandedFields([id]); setHighlightedField(id); setTimeout(() => setHighlightedField(null), 2500); setTimeout(() => { const el = document.getElementById('field-list'); if (el) el.scrollTop = el.scrollHeight; }, 80);
  };

  const updateFieldLabelAndName = (i, v) => { setFormData(p => { const fs = [...p.fields]; fs[i] = { ...fs[i], label: v, ...(!fs[i].nameEdited ? { name: generateVarName(v) } : {}) }; return { ...p, fields: fs }; }); if (formErrors[`field_${i}`]) setFormErrors(p => ({ ...p, [`field_${i}`]: false })); };
  const updateFieldName = (i, v) => setFormData(p => { const fs = [...p.fields]; fs[i] = { ...fs[i], name: v, nameEdited: true }; return { ...p, fields: fs }; });
  const updateField = (i, k, v) => setFormData(p => { const fs = [...p.fields]; fs[i] = { ...fs[i], [k]: v }; if (k === 'fieldType' && !['select', 'radio', 'checkbox'].includes(v)) fs[i].options = []; return { ...p, fields: fs }; });
  const removeField = i => setFormData(p => ({ ...p, fields: p.fields.filter((_, idx) => idx !== i) }));
  const addOption = fi => setFormData(p => { const fs = [...p.fields]; fs[fi].options = [...(fs[fi].options || []), '']; return { ...p, fields: fs }; });
  const updateOption = (fi, oi, v) => setFormData(p => { const fs = [...p.fields]; fs[fi].options[oi] = v; return { ...p, fields: fs }; });
  const removeOption = (fi, oi) => setFormData(p => { const fs = [...p.fields]; fs[fi].options = fs[fi].options.filter((_, i) => i !== oi); return { ...p, fields: fs }; });
  const toggleCondition = i => { setFormData(p => { const fs = [...p.fields]; fs[i].condition = fs[i].condition ? null : { field: '', value: '' }; return { ...p, fields: fs }; }); };
  const getChoiceFields = ci => formData.fields.filter((f, i) => i !== ci && ['select', 'radio', 'checkbox'].includes(f.fieldType));
  const handleDragEnd = ({ active, over }) => { if (active && over && active.id !== over.id) { setFormData(p => { const oi = p.fields.findIndex(f => f.id === active.id); const ni = p.fields.findIndex(f => f.id === over.id); return { ...p, fields: arrayMove(p.fields, oi, ni) }; }); } };

  const currentFontSize = editor?.getAttributes('textStyle').fontSize || '';
  const currentLineHeight = editor?.getAttributes('paragraph').lineHeight || editor?.getAttributes('heading').lineHeight || '';
  const textColor = editor?.getAttributes('textStyle').color || '';
  const highlightColor = editor?.getAttributes('highlight').color || '';
  const inTable = editor?.isActive('table');
  const currentHeadingLevel = editor?.isActive('heading', { level: 1 }) ? '1' : editor?.isActive('heading', { level: 2 }) ? '2' : editor?.isActive('heading', { level: 3 }) ? '3' : '0';

  const publicLink = `${window.location.origin}/f/${initialData?._id}`;
  const copyToClipboard = () => { navigator.clipboard.writeText(publicLink); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); };

  const T = ({ onClick, active, icon, title, disabled, customStyle }) => (
    <button
      disabled={disabled}
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`${styles.tb} ${active ? styles.tbActive : ''} ${disabled ? styles.tbDisabled : ''}`}
      style={customStyle}
    >
      {icon}
    </button>
  );

  return (
    <div className={styles.root} data-theme={editorTheme}>

      {popover.show && (
        <>
          <div className={styles.popoverOverlay} onMouseDown={closePopover} />
          <div className={styles.fixedPopover} style={{ top: popover.top, left: popover.left }} onMouseDown={e => e.stopPropagation()}>
            {popover.type === 'textColor' && (<div className={styles.colorPaletteFixed}>{TEXT_COLORS.map(c => (<button key={c} className={styles.colorDot} style={{ backgroundColor: c }} onClick={() => { editor.chain().focus().setColor(c).run(); closePopover(); }} />))}<button className={styles.colorClearDot} onClick={() => { editor.chain().focus().unsetColor().run(); closePopover(); }}><X size={12} /></button></div>)}
            {popover.type === 'highlightColor' && (<div className={styles.colorPaletteFixed}>{HIGHLIGHT_COLORS.map(c => (<button key={c} className={styles.colorDot} style={{ backgroundColor: c === 'transparent' ? 'var(--bg-hover)' : c }} onClick={() => { if (c === 'transparent') editor.chain().focus().unsetHighlight().run(); else editor.chain().focus().toggleHighlight({ color: c }).run(); closePopover(); }} />))}</div>)}
            {popover.type === 'themes' && (
              <div className={styles.dropdownMenuFixed} style={{ minWidth: '140px' }}>
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => handleThemeChange(t.id)} className={styles.dropdownItem} style={{ justifyContent: 'flex-start', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{t.emoji}</span>
                    <span style={{ fontWeight: editorTheme === t.id ? '800' : '600', color: editorTheme === t.id ? 'var(--text-primary)' : 'inherit' }}>{t.label}</span>
                  </button>
                ))}
              </div>
            )}
            {popover.type === 'signature' && (
              <div className={styles.dropdownMenuFixed}>
                <button className={styles.dropdownItem} onClick={() => { editor.chain().focus().insertContent(insertSignatureBlock('left')).run(); closePopover(); }}>Sola İmza</button>
                <button className={styles.dropdownItem} onClick={() => { editor.chain().focus().insertContent(insertSignatureBlock('right')).run(); closePopover(); }}>Sağa İmza</button>
              </div>
            )}
            {popover.type === 'variables' && (
              <div className={styles.dropdownMenuFixed} style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>DEĞİŞKENLER</div>
                {formData.fields.length === 0 ? (<div style={{ padding: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Soru eklemediniz</div>) : (
                  formData.fields.map(f => (
                    <button key={f.id} className={styles.dropdownItem} onClick={() => { handleInsertVariable(f.name); closePopover(); }}>{f.label || f.name}</button>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ŞARTLI BLOK MODALI */}
      {condModal && (
        <div className={styles.overlay} onClick={() => setCondModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <div className={styles.modalIcon} style={{ background: 'var(--accent-bg)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}><Zap size={20} /></div>
              <div><h3>Şartlı Blok Ekle</h3><p>Seçilen soruya belirli bir cevap verildiğinde görünecek bir metin bloğu oluşturur.</p></div>
              <button className={styles.modalClose} onClick={() => setCondModal(false)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.fg}>
                <label>Hangi Soruya Bağlı?</label>
                <select className={styles.sel} value={condField} onChange={e => { setCondField(e.target.value); setCondValue(''); }}>
                  <option value="">Seçiniz...</option>
                  {formData.fields.filter(f => ['select', 'radio', 'checkbox'].includes(f.fieldType)).map(f => (
                    <option key={f.name} value={f.name}>{f.label || f.name}</option>
                  ))}
                </select>
              </div>
              {condField && (
                <div className={styles.fg}>
                  <label>Hangi Cevap Verildiğinde Gösterilsin?</label>
                  <select className={styles.sel} value={condValue} onChange={e => setCondValue(e.target.value)}>
                    <option value="">Seçiniz...</option>
                    {formData.fields.find(f => f.name === condField)?.options.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className={styles.modalFoot}>
              <button className={styles.cancelBtn} onClick={() => setCondModal(false)}>Vazgeç</button>
              <button className={styles.primaryBtn} disabled={!condField || !condValue} onClick={insertConditional}>Bloğu Ekle</button>
            </div>
          </div>
        </div>
      )}

      {/* GENEL BAĞLANTI MODALI */}
      {isShareModalOpen && (
        <div className={styles.overlay} onMouseDown={() => setIsShareModalOpen(false)}>
          <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <div className={styles.modalIcon} style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}><LinkIcon size={20} /></div>
              <div><h3>Genel Bağlantı</h3><p>Bu bağlantıyı gönderdiğiniz kişiler formu doldurup anında PDF alabilir.</p></div>
              <button className={styles.modalClose} onClick={() => setIsShareModalOpen(false)}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.linkCopyBox} style={{ display: 'flex', gap: '8px', background: 'var(--bg-input)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <input type="text" readOnly value={publicLink} style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontFamily: 'monospace' }} />
                <button onClick={copyToClipboard} className={styles.primaryBtn} style={{ flex: 'none', padding: '8px 16px' }}>
                  {isCopied ? <CheckCircle2 size={16} /> : <Copy size={16} />} {isCopied ? 'Kopyalandı' : 'Kopyala'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF ONAY MODALI */}
      {pdfConfirmModal && (
        <div className={styles.overlay} onClick={() => setPdfConfirmModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <div className={styles.modalIcon} style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}><Printer size={20} /></div>
              <div><h3>PDF İndir</h3><p>Girdiğiniz verilere göre şablonunuz PDF formatına dönüştürülecektir.</p></div>
              <button className={styles.modalClose} onClick={() => setPdfConfirmModal(false)}><X size={18} /></button>
            </div>
            <div className={styles.modalFoot}>
              <button className={styles.cancelBtn} onClick={() => setPdfConfirmModal(false)}>İptal</button>
              <button className={styles.primaryBtn} onClick={handlePrintPDF}>Onayla ve İndir</button>
            </div>
          </div>
        </div>
      )}

      <button className={`no-print ${styles.assistantFab}`} onClick={() => setIsAssistantOpen(true)} title="Akıllı Asistan"><Sparkles size={24} /></button>
      <div className={`no-print ${styles.assistantDrawer} ${isAssistantOpen ? styles.assistantDrawerOpen : ''}`}>
        <div className={styles.assistantHeader}>
          <div className={styles.assistantTitle}><div className={styles.assistantAvatar}><Bot size={20} /></div><h3>Akıllı Asistan</h3></div>
          <button onClick={() => setIsAssistantOpen(false)} className={styles.modalClose}><X size={20} /></button>
        </div>
        <div className={styles.assistantContent}>
          <div className={styles.tipCard}><div className={styles.tipIcon}><Wand2 size={18} /></div><div><h4>Sihirli Algılama</h4><p>Metninizdeki tüm <code>{"{{isim}}"}</code> benzeri kelimeleri tek tıkla forma dönüştürür.</p></div></div>
          <div className={styles.tipCard}><div className={styles.tipIcon}><Zap size={18} /></div><div><h4>Slash (/) Komutları</h4><p>Kağıtta boş bir satıra <code>/</code> yazarak hızlıca başlık veya imza ekleyebilirsiniz.</p></div></div>
          <div className={styles.tipCard}><div className={styles.tipIcon}><FileUp size={18} /></div><div><h4>İçe Aktar</h4><p>Elindeki bir .txt veya Word belgesini doğrudan beyaz kağıdın üzerine sürükleyip bırakabilirsin.</p></div></div>
        </div>
      </div>

      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/panel/projects')}><ArrowLeft size={16} /> <span>Şablonlarım</span></button>
        <input className={`${styles.nameInput} ${formErrors.name ? styles.inpErr : ''}`} value={formData.name || ''} onChange={e => { setFormData(p => ({ ...p, name: e.target.value })); if (formErrors.name) setFormErrors(p => ({ ...p, name: false })); }} placeholder="Şablon adı…" />

        <div className={styles.compactThemeDropdown} id="tb-theme-btn">
          <button onClick={(e) => popover.show && popover.type === 'themes' ? closePopover() : openPopover(e, 'themes')} className={styles.themeActiveBtn} title="Temayı Değiştir">
            {THEMES.find(t => t.id === editorTheme)?.emoji}
          </button>
        </div>

        <div className={styles.modeSwitch}>
          <button className={`${styles.modeBtn} ${mode === 'build' ? styles.modeOn : ''}`} onClick={() => setMode('build')}><Wrench size={15} /> Tasarım</button>
          <button id="tb-preview-btn" className={`${styles.modeBtn} ${mode === 'preview' ? styles.modeOn : ''}`} onClick={() => { setMode('preview'); setPreviewStep(1); }}><Eye size={15} /> Önizleme</button>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.autoSaveIndicator}>
            {saveStatus === 'saving' && <><Loader2 size={14} className={styles.spinnerIcon} /> Kaydediliyor...</>}
            {saveStatus === 'saved' && <><Cloud size={14} style={{ color: 'var(--success)' }} /> Buluta kaydedildi</>}
            {saveStatus === 'unsaved' && <><span className={styles.unsavedDot}></span> Değişiklikler var</>}
            {saveStatus === 'error' && <><AlertCircle size={14} style={{ color: 'var(--danger)' }} /> Kaydedilemedi</>}
          </div>
          <div className={styles.headerActionsDivider} />

          <button id="tb-share-btn" onClick={() => setIsShareModalOpen(true)} className={styles.pdfBtn} title="Genel Bağlantı">
            <LinkIcon size={15} /> Paylaş
          </button>

          {mode === 'preview' && (
            <button className={styles.pdfBtn} onClick={() => setPdfConfirmModal(true)} disabled={isGeneratingPdf}>
              <Printer size={15} /> {isGeneratingPdf ? '...' : 'İndir'}
            </button>
          )}

          <button className={styles.saveBtn} onClick={() => handleSave(false)} disabled={saveStatus === 'saving'}><Save size={15} /> Kaydet</button>
        </div>
      </header>

      <div className={styles.workspace}>
        {mode === 'build' && (
          <div className={styles.split}>
            <aside className={styles.left}>
              <div className={styles.panelHead}><span className={styles.panelTitle}>Form alanları</span><span className={styles.fieldCount}>{formData.fields.length}</span></div>
              <div className={styles.fieldList} id="field-list">
                {formData.fields.length === 0 ? (
                  <div className={styles.emptyFieldsState}><Lightbulb size={32} color="var(--warning)" style={{ marginBottom: 12 }} /><h4>Formunuz henüz boş</h4><p>Sağdaki kağıda metninizi yapıştırın veya belge sürükleyin. Değişecek kelimeleri fareyle seçerek soruya dönüştürün!</p></div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={formData.fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                      {formData.fields.map((field, i) => <SortableFieldCard key={field.id} field={field} index={i} isExpanded={expandedFields.includes(field.id)} formErrors={formErrors} isHighlighted={highlightedField === field.id} toggleExpand={toggleExpand} updateField={updateField} updateFieldLabelAndName={updateFieldLabelAndName} updateFieldName={updateFieldName} removeField={removeField} addOption={addOption} updateOption={updateOption} removeOption={removeOption} toggleCondition={toggleCondition} getChoiceFields={getChoiceFields} allFields={formData.fields} onInsertVariable={handleInsertVariable} />)}
                    </SortableContext>
                  </DndContext>
                )}
                <button className={styles.addFieldBtn} onClick={addField}><Plus size={16} /> Yeni alan ekle</button>
              </div>
            </aside>

            <main className={styles.right}>
              <div className={styles.smartBar}>
                <div className={styles.smartBarLeft}>
                  <button id="tb-magic-btn" onClick={() => setMagicModal({ show: true, selectedFormat: 'curly2' })} className={styles.magicBtn} title="Farklı formatlardaki değişkenleri otomatik bulur"><Wand2 size={16} /> Tümünü Algıla</button>
                  <span className={styles.smartHint}>Belgenizdeki gizli değişkenleri anında forma çevirin.</span>
                </div>
                <div className={styles.smartBarRight}>
                  <select id="tb-trigger-select" value={triggerSymbol} onChange={e => { if (e.target.value === 'custom') { setIsTriggerCustom(true); setCustomTriggerInput(''); } else { setIsTriggerCustom(false); handleTriggerChange(e.target.value); } }} className={styles.triggerSelectSmart} title="Değişken Formatı (Tetikleyici)">
                    <option value="{{">{"{{ }}"}</option>
                    <option value="[">{"[ ]"}</option>
                    <option value="<<">{"<< >>"}</option>
                    <option value="@">{"@isim"}</option>
                    <option value="custom">Özel...</option>
                  </select>
                  {isTriggerCustom && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input type="text" maxLength={5} value={customTriggerInput} onChange={e => setCustomTriggerInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { handleTriggerChange(customTriggerInput); setIsTriggerCustom(false); } }} placeholder="Örn: //" className={styles.inp} style={{ width: '60px', padding: '6px' }} />
                      <button onClick={() => { handleTriggerChange(customTriggerInput); setIsTriggerCustom(false); }} className={styles.actionBtn}>Seç</button>
                    </div>
                  )}

                  <input type="file" ref={fileInputRef} onChange={handleFileInputChange} accept=".txt,.html,.docx,.pdf" style={{ display: 'none' }} />
                  <button className={styles.actionBtn} onClick={() => fileInputRef.current?.click()}><FileUp size={16} /> İçe Aktar</button>
                  <button id="tb-cond-btn" className={styles.condBtn} onClick={() => setCondModal(true)}><Zap size={14} /> Şartlı Blok</button>
                </div>
              </div>

              {editor && (
                <div id="tb-toolbar" className={`no-print ${styles.toolbar}`}>
                  <T onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} icon={<Undo2 size={15} />} title="Geri al" />
                  <T onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} icon={<Redo2 size={15} />} title="İleri al" />
                  <div className={styles.tbDivider} />
                  <T onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} icon={<Bold size={15} />} title="Kalın (Ctrl+B)" />
                  <T onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} icon={<Italic size={15} />} title="İtalik (Ctrl+I)" />
                  <div className={styles.tbDivider} />
                  <select onChange={e => editor.chain().focus().setFontFamily(e.target.value).run()} defaultValue="" className={styles.select}>
                    <option value="" disabled>Font</option><option value="Inter">Inter</option><option value="Helvetica">Helvetica</option><option value="Arial">Arial</option>
                  </select>
                  <select onChange={e => e.target.value ? editor.chain().focus().setFontSize(e.target.value).run() : editor.chain().focus().unsetFontSize().run()} value={currentFontSize || ''} className={styles.select}>
                    <option value="">Boyut</option>{[10, 12, 14, 16, 18, 20, 24, 28].map(s => <option key={s} value={`${s}px`}>{s}</option>)}
                  </select>
                  <select onChange={e => e.target.value ? editor.chain().focus().setLineHeight(e.target.value).run() : editor.chain().focus().unsetLineHeight().run()} value={currentLineHeight || ''} className={styles.select}>
                    <option value="">Satır</option><option value="1.4">1.4</option><option value="1.5">1.5</option><option value="1.6">1.6</option><option value="1.7">1.7</option><option value="1.8">1.8</option>
                  </select>
                  <div className={styles.tbDivider} />
                  <T onClick={e => popover.show && popover.type === 'textColor' ? closePopover() : openPopover(e, 'textColor')} active={!!textColor} icon={<Palette size={16} />} title="Yazı Rengi" />
                  <T onClick={e => popover.show && popover.type === 'highlightColor' ? closePopover() : openPopover(e, 'highlightColor')} active={highlightColor && highlightColor !== 'transparent'} icon={<Highlighter size={16} />} title="Vurgu Rengi" />
                  <div className={styles.tbDivider} />
                  <select onChange={e => { const val = parseInt(e.target.value); val === 0 ? editor.chain().focus().unsetFontSize().setParagraph().run() : editor.chain().focus().unsetFontSize().toggleHeading({ level: val }).run(); }} value={currentHeadingLevel} className={styles.select}>
                    <option value="0">Normal</option><option value="1">Başlık 1</option><option value="2">Başlık 2</option><option value="3">Başlık 3</option>
                  </select>
                  <div className={styles.tbDivider} />
                  <T onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} icon={<AlignLeft size={15} />} title="Sola Hizala" />
                  <T onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} icon={<AlignCenter size={15} />} title="Ortala" />
                  <T onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} icon={<AlignRight size={15} />} title="Sağa Hizala" />
                  <T onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} icon={<AlignJustify size={15} />} title="İki Yana Hizala" />
                  <div className={styles.tbDivider} />
                  <T onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} icon={<List size={15} />} title="Madde İşaretli Liste" />
                  <T onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} icon={<ListOrdered size={15} />} title="Numaralı Liste" />
                  <div className={styles.tbDivider} />
                  <T onClick={e => popover.show && popover.type === 'variables' ? closePopover() : openPopover(e, 'variables')} icon={<div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Variable size={14} /><span style={{ fontSize: '14px' }}>Değişken Ekle</span><ChevronDown size={12} /></div>} title="Değişken Ekle" />
                  <div className={styles.tbDivider} />
                  <T onClick={e => popover.show && popover.type === 'signature' ? closePopover() : openPopover(e, 'signature')} active={popover.show && popover.type === 'signature'} icon={<div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><PenTool size={15} /><span style={{ fontSize: '14px' }}>İmza Ekle</span> <ChevronDown size={12} /></div>} title="İmza Ekle" />
                </div>
              )}

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
                    <p>.txt, .docx veya .pdf desteklenir</p>
                  </div>
                )}

                {varMenuState.show && mode === 'build' && (
                  <div className={`no-print ${styles.slashMenu}`} style={{ top: varMenuState.pos.top, left: varMenuState.pos.left }}>
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

                {slashMenuState.show && mode === 'build' && (
                  <div className={`no-print ${styles.slashMenu}`} style={{ top: slashMenuState.pos.top, left: slashMenuState.pos.left }}>
                    <div className={styles.autocompleteHeader}>TEMEL BLOKLAR</div>
                    {filteredSlashCmds.length > 0 ? filteredSlashCmds.map((cmd, index) => (
                      <div key={cmd.id} id={`slash-item-${index}`} onClick={() => executeSlashCommand(cmd)} onMouseMove={(e) => { if (Math.abs(e.clientX - mousePosRef.current.x) > 2 || Math.abs(e.clientY - mousePosRef.current.y) > 2) { mousePosRef.current = { x: e.clientX, y: e.clientY }; if (slashSelectedIndex !== index) setSlashSelectedIndex(index); } }} className={`${styles.slashItem} ${index === slashSelectedIndex ? styles.slashItemActive : ''}`}>
                        <span className={styles.slashIcon}>{cmd.icon}</span><span className={styles.slashLabel}>{cmd.label}</span>
                      </div>
                    )) : <div className={styles.autocompleteEmpty}>Eşleşen komut bulunamadı</div>}
                  </div>
                )}

                {formatMenu.show && selectionMenu.show && mode === 'build' && (
                  <div className={styles.combinedBubbleMenu} style={{ top: formatMenu.top, left: formatMenu.left }} onMouseDown={e => e.preventDefault()}>
                    <div className={styles.bubbleFormatGroup}>
                      <button onClick={() => editor.chain().focus().toggleBold().run()} className={`${styles.bubbleActionBtn} ${editor.isActive('bold') ? styles.bubbleActionBtnActive : ''}`}><Bold size={14} /></button>
                      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`${styles.bubbleActionBtn} ${editor.isActive('italic') ? styles.bubbleActionBtnActive : ''}`}><Italic size={14} /></button>
                      <div className={styles.bubbleDivider} />
                      <button onClick={(e) => { e.preventDefault(); openPopover(e, 'textColor'); }} className={styles.bubbleActionBtn}><Palette size={14} /></button>
                      <button onClick={(e) => { e.preventDefault(); openPopover(e, 'highlightColor'); }} className={styles.bubbleActionBtn}><Highlighter size={14} /></button>
                    </div>
                    <div className={styles.bubbleDivider} />
                    <div className={styles.bubbleSelectionGroup}>
                      {selectionMenu.mode === 'button' ? (
                        <button type="button" onClick={handleConvertClick} className={styles.bubbleBtn}><Sparkles size={14} /> Soruya Dönüştür</button>
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

                <div id="tb-paper" className={styles.paper} onClick={() => { if (editor && !editor.isFocused) editor.chain().focus().run(); }} onScroll={handleEditorScroll}>
                  <EditorContent editor={editor} />
                </div>
              </div>
            </main>
          </div>
        )}

        {mode === 'preview' && (
          <div className={styles.split}>
            <aside className={styles.left} style={{ background: 'var(--bg-sidebar)', display: 'flex', flexDirection: 'column' }}>
              <div className={styles.panelHead}><span className={styles.panelTitle}>Test formu</span><span className={styles.stepBadge}>Adım {previewStep}/2</span></div>
              <div className={styles.previewForm} style={{ opacity: previewStep === 2 ? 0.35 : 1, pointerEvents: previewStep === 2 ? 'none' : 'auto', flex: 1, overflowY: 'auto' }}>
                <div style={{ padding: '20px' }}>
                  {formData.fields.length > 0 ? (<DocumentForm templateFields={getCleanFields()} initialData={virtualFormData} onChange={setVirtualFormData} />) : <p className={styles.muted}>Test edilecek alan yok.</p>}
                </div>
              </div>
              <div className={styles.previewFooter}>
                {previewStep === 1 ? (<button className={`${styles.nextBtn} ${styles.pulseBtn}`} onClick={() => { if (validatePreviewForm()) { setPreviewStep(2); } else { showToast("Lütfen tüm zorunlu alanları doldurun.", "error"); } }}>Belgeyi İncele <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} /></button>) : (<button className={styles.backFormBtn} onClick={() => setPreviewStep(1)}>← Forma dön ve düzenle</button>)}
              </div>
            </aside>
            <main className={styles.right} style={{ padding: '40px', alignItems: 'center' }}>
              <div className={styles.canvas} style={{ width: '100%', padding: '0 40px' }}>
                <div className={styles.paper}>
                  <DocumentPreview templateContent={previewHtml} formData={virtualFormData} editorRef={previewEditorRef} currentStep={previewStep} />
                </div>
              </div>
            </main>
          </div>
        )}
      </div>

      {/* SİHİRLİ ALGILAMA MODALI */}
      {magicModal.show && (
        <div className={styles.overlay} onClick={() => setMagicModal({ show: false })}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <div className={styles.modalIcon} style={{ background: 'var(--text-primary)', color: 'var(--bg-surface)', borderColor: 'var(--border)' }}><Wand2 size={20} /></div>
              <div><h3>Sihirli Algılama</h3><p>Belgenizde daha önceden kullandığınız boşluk/değişken formatını seçin.</p></div>
              <button className={styles.modalClose} onClick={() => setMagicModal({ show: false })}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formatGrid}>
                {VARIABLE_FORMATS.map(f => (
                  <button key={f.id} onClick={() => setMagicModal(p => ({ ...p, selectedFormat: f.id }))} className={`${styles.formatOption} ${magicModal.selectedFormat === f.id ? styles.formatOptionActive : ''}`}>
                    <b className={styles.formatEx}>{f.ex}</b><span className={styles.formatLabel}>{f.label}</span>
                  </button>
                ))}
              </div>
              <div className={styles.magicInfoBox}>
                <Sparkles size={14} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
                <p>Seçtiğiniz formattaki tüm kelimeler bulunacak, sol tarafa <b>Soru</b> olarak eklenecek ve metin içindekiler standart <b>{"{{değişken}}"}</b> formatına otomatik çevrilecektir.</p>
              </div>
            </div>
            <div className={styles.modalFoot}>
              <button className={styles.cancelBtn} onClick={() => setMagicModal({ show: false })}>Vazgeç</button>
              <button className={styles.primaryBtn} onClick={executeMagicExtract}>Uygula</button>
            </div>
          </div>
        </div>
      )}

      {/* ÇOKLU EŞLEŞME MODALI */}
      {multiReplace.show && (
        <div className={styles.overlay}>
          <div className={styles.modal} style={{ maxWidth: '560px' }}>
            <div className={styles.modalHead}>
              <div className={styles.modalIcon} style={{ background: 'var(--text-primary)', color: 'var(--bg-surface)', borderColor: 'var(--border)' }}><Layers size={20} /></div>
              <div><h3>Çoklu Eşleşme Bulundu</h3><p><b>"{multiReplace.searchText}"</b> ifadesi belgede toplam {multiReplace.occurrences.length} kez geçiyor.</p></div>
              <button className={styles.modalClose} onClick={() => setMultiReplace({ show: false, occurrences: [], newField: null, finalVarName: '', searchText: '' })}><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Hangi cümlelerdeki kelimelerin <b>{"{{"}{multiReplace.finalVarName}{"}}"}</b> değişkenine dönüştürüleceğini seçin:</p>
              <div className={styles.multiReplaceList}>
                {multiReplace.occurrences.map((occ, idx) => (
                  <div key={idx} className={`${styles.occurrenceItem} ${occ.selected ? styles.occurrenceSelected : ''}`} onClick={() => toggleOccurrence(idx)}>
                    <input type="checkbox" checked={occ.selected} readOnly className={styles.chk} style={{ marginTop: '3px' }} />
                    <div className={styles.occurrenceText}>...{occ.contextBefore}<span className={styles.occurrenceMatch}>{occ.matchText}</span>{occ.contextAfter}...</div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.modalFoot}>
              <button className={styles.cancelBtn} onClick={() => setMultiReplace({ show: false, occurrences: [], newField: null, finalVarName: '', searchText: '' })}>Vazgeç</button>
              <button className={styles.primaryBtn} onClick={handleMultiReplaceConfirm}>Seçili Olanları Değiştir</button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />} {toast.message}
        </div>
      )}
    </div>
  );
};

export default TemplateBuilder;