// frontend/src/pages/FocusEditor.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Handlebars from 'handlebars';
import DOMPurify from 'dompurify';
import CharacterCount from '@tiptap/extension-character-count';

import {
    ArrowLeft, Eye, Code, Variable, Bold, Italic, Strikethrough,
    List, ListOrdered, Image as ImageIcon, AlertTriangle, CheckCircle2,
    Plus, Edit2, Trash2, FileText, Zap, PanelLeftClose, PanelLeft, Maximize2, Minimize2,
    AlignLeft, AlignCenter, AlignRight, AlignJustify, Scissors, Palette,
    Quote, Table as TableIcon, Video, PaintBucket, Highlighter,
    Undo2, Redo2, RotateCcw, X, ChevronDown, Loader2, Printer, Cloud, PenTool,
    Heading1, Heading2, Heading3, Sparkles, Bot, Keyboard
} from 'lucide-react';

import { driver } from "driver.js";
import "driver.js/dist/driver.css";

import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Blockquote } from '@tiptap/extension-blockquote';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import { Highlight } from '@tiptap/extension-highlight';
import ImageResize from 'tiptap-extension-resize-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import YoutubeExtension from '@tiptap/extension-youtube';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import { common, createLowlight } from 'lowlight';
import 'highlight.js/styles/atom-one-dark.css';
import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import styles from './FocusEditor.module.css';

const lowlight = createLowlight(common);
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

const TEXT_COLORS_LIGHT = ['#000000', '#1e293b', '#334155', '#475569', '#2563eb', '#dc2626', '#059669'];
const TEXT_COLORS_DARK = ['#ffffff', '#f8fafc', '#e2e8f0', '#cbd5e1', '#60a5fa', '#f87171', '#34d399'];
const HIGHLIGHT_COLORS_LIGHT = ['transparent', '#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8'];
const HIGHLIGHT_COLORS_DARK = ['transparent', '#713f12', '#14532d', '#1e3a8a', '#831843'];

const PROJECT_MODES = {
    FREE: { allowedFonts: ['Inter', 'system-ui', 'Helvetica', 'Arial', 'Times New Roman', 'Georgia', 'Calibri, sans-serif', 'monospace', 'Comic Sans MS'], features: { code: true, video: true, highlight: true, colors: true, tables: true, fontSize: true, media: true } },
    ACADEMIC: { allowedFonts: ['Times New Roman', 'Arial', 'Helvetica'], features: { code: false, video: false, highlight: false, colors: false, tables: true, fontSize: true, media: true } },
    BOOK: { allowedFonts: ['Georgia', 'Times New Roman', 'Inter'], features: { code: false, video: false, highlight: false, colors: false, tables: false, fontSize: true, media: true } },
    ARTICLE: { allowedFonts: ['Inter', 'system-ui', 'Georgia', 'Helvetica'], features: { code: false, video: true, highlight: true, colors: true, tables: true, fontSize: true, media: true } },
    TECHNICAL: { allowedFonts: ['Inter', 'system-ui', 'monospace'], features: { code: true, video: true, highlight: true, colors: true, tables: true, fontSize: false, media: true } },
    LEGAL: { allowedFonts: ['Times New Roman', 'Arial'], features: { code: false, video: false, highlight: false, colors: false, tables: true, fontSize: false, media: false } }
};

// TIPTAP CUSTOM EXTENSIONS
const CustomBlockquote = Blockquote.extend({ addAttributes() { return { ...this.parent?.(), backgroundColor: { default: null, parseHTML: el => el.getAttribute('data-bg-color'), renderHTML: attrs => attrs.backgroundColor ? { 'data-bg-color': attrs.backgroundColor, style: `background-color: ${attrs.backgroundColor}` } : {} }, borderColor: { default: null, parseHTML: el => el.getAttribute('data-border-color'), renderHTML: attrs => attrs.borderColor ? { 'data-border-color': attrs.borderColor, style: `border-left-color: ${attrs.borderColor}` } : {} }, }; }, });
const BlockquoteHighlightExtension = Extension.create({ name: 'blockquoteHighlight', addProseMirrorPlugins() { return [new Plugin({ props: { decorations(state) { const { selection } = state; if (selection.empty) return DecorationSet.empty; const decorations = []; state.doc.descendants((node, pos) => { if (node.type.name === 'blockquote') { const from = pos; const to = pos + node.nodeSize; if (selection.from >= from && selection.to <= to) decorations.push(Decoration.node(from, to, { class: 'blockquote-has-selection' })); } }); return DecorationSet.create(state.doc, decorations); }, }, }),]; }, });
const FontSize = Extension.create({ name: 'fontSize', addOptions() { return { types: ['textStyle'] }; }, addGlobalAttributes() { return [{ types: this.options.types, attributes: { fontSize: { default: null, parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''), renderHTML: attributes => attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {} } } }]; }, addCommands() { return { setFontSize: fontSize => ({ chain }) => chain().setMark('textStyle', { fontSize }).run(), unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).run(), }; }, });
const LineHeight = Extension.create({ name: 'lineHeight', addOptions() { return { types: ['paragraph', 'heading'] }; }, addGlobalAttributes() { return [{ types: this.options.types, attributes: { lineHeight: { default: null, parseHTML: element => element.style.lineHeight, renderHTML: attributes => attributes.lineHeight ? { style: `line-height: ${attributes.lineHeight}` } : {} } } }]; }, addCommands() { return { setLineHeight: lineHeight => ({ commands }) => this.options.types.map(type => commands.updateAttributes(type, { lineHeight })).some(Boolean), unsetLineHeight: () => ({ commands }) => this.options.types.map(type => commands.resetAttributes(type, 'lineHeight')).some(Boolean), }; }, });
const CustomTableCell = TableCell.extend({ addAttributes() { return { ...this.parent?.(), backgroundColor: { default: null, parseHTML: element => element.getAttribute('data-background-color'), renderHTML: attributes => attributes.backgroundColor ? { 'data-background-color': attributes.backgroundColor, style: `background-color: ${attributes.backgroundColor}` } : {} }, verticalAlign: { default: 'top', parseHTML: element => element.style.verticalAlign || 'top', renderHTML: attributes => ({ style: `vertical-align: ${attributes.verticalAlign}` }), }, }; }, });
const CustomTableHeader = TableHeader.extend({ addAttributes() { return { ...this.parent?.(), backgroundColor: { default: null, parseHTML: element => element.getAttribute('data-background-color'), renderHTML: attributes => attributes.backgroundColor ? { 'data-background-color': attributes.backgroundColor, style: `background-color: ${attributes.backgroundColor}` } : {} }, verticalAlign: { default: 'top', parseHTML: element => element.style.verticalAlign || 'top', renderHTML: attributes => ({ style: `vertical-align: ${attributes.verticalAlign}` }), }, }; }, });

const Divider = () => <div className={`no-print ${styles.toolbarDivider}`} />;
const TBtn = ({ onClick, variant = 'default', icon, title, disabled = false }) => {
    let btnClass = styles.toolbarBtn;
    if (variant === 'active') btnClass = `${styles.toolbarBtn} ${styles.toolbarBtnActive}`;
    else if (variant === 'danger') btnClass = `${styles.toolbarBtn} ${styles.toolbarBtnDanger}`;
    else if (variant === 'primary') btnClass = `${styles.toolbarBtn} ${styles.toolbarBtnPrimary}`;
    if (disabled) btnClass = `${btnClass} ${styles.toolbarBtnDisabled}`;
    return <button type="button" className={`no-print ${btnClass}`} onMouseDown={e => e.preventDefault()} onClick={onClick} title={title} disabled={disabled}>{icon}</button>;
};

// YARDIMCI FONKSİYONLAR 
const insertSignatureBlock = (type) => {
    let html = '';
    if (type === 'left') { html = `<p style="text-align: left"><strong>[1. Taraf / Unvan]</strong></p><p style="text-align: left"><br></p><p style="text-align: left">İmza</p><p></p>`; }
    else if (type === 'right') { html = `<p style="text-align: right"><strong>[1. Taraf / Unvan]</strong></p><p style="text-align: right"><br></p><p style="text-align: right">İmza</p><p></p>`; }
    else if (type === 'dual') {
        const baseStyle = "width: 50%; text-align: center; border: none; padding: 20px;";
        const content = "<p><strong>[1. Taraf / Unvan]</strong></p><p><br></p><p>İmza</p>";
        const content2 = "<p><strong>[2. Taraf / Unvan]</strong></p><p><br></p><p>İmza</p>";
        html = `<table data-type="signature" style="width: 100%; border: none; border-collapse: collapse; margin-top: 2em;"><tbody><tr><td style="${baseStyle}">${content}</td><td style="${baseStyle}">${content2}</td></tr></tbody></table><p></p>`;
    }
    return html;
};

const getTriggerSymbols = (t) => {
    if (t === '[') return { s: '[', e: ']' };
    if (t === '{') return { s: '{', e: '}' };
    if (t === '{{') return { s: '{{', e: '}}' };
    if (t === '<<') return { s: '<<', e: '>>' };
    if (t === '@') return { s: '@', e: '' };
    return { s: t, e: '' };
};

// PDF/Backend formatı için Handlebars'a dönüştür ( {{isim}} )
const convertToHandlebars = (html, trigger) => {
    if (!trigger || trigger === '{{') return html;
    const tempDiv = window.document.createElement('div'); tempDiv.innerHTML = html; let regex;
    if (trigger === '[') regex = /\[\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*\]/g;
    else if (trigger === '{') regex = /\{(?!\s*\{)\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*\}(?!\s*\})/g;
    else if (trigger === '<<') regex = /(?:&lt;|<){2}\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*(?:&gt;|>){2}/g;
    else if (trigger === '@') regex = /@([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)/g;
    else { const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); regex = new RegExp(`${escaped}\\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\\s*`, 'g'); }
    const walk = (node) => { if (node.nodeType === 3) node.nodeValue = node.nodeValue.replace(regex, '{{$1}}'); else if (node.nodeType === 1) { for (let child of node.childNodes) walk(child); } };
    walk(tempDiv); return tempDiv.innerHTML;
};

// Veritabanından gelen Handlebars kodunu Editör formatına (Örn: <<isim>>) çevir
const convertFromHandlebars = (html, trigger) => {
    if (!trigger || trigger === '{{') return html;
    const tempDiv = window.document.createElement('div'); tempDiv.innerHTML = html;
    const regex = /\{\{\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*\}\}/g;
    let replacement = trigger === '[' ? '[$1]' : trigger === '{' ? '{$1}' : trigger === '<<' ? '&lt;&lt;$1&gt;&gt;' : trigger === '@' ? '@$1' : `${trigger}$1`;
    const walk = (node) => { if (node.nodeType === 3) node.nodeValue = node.nodeValue.replace(regex, replacement); else if (node.nodeType === 1) { for (let child of node.childNodes) walk(child); } };
    walk(tempDiv); return tempDiv.innerHTML;
};

const SLASH_COMMANDS = [
    { id: 'h1', label: 'Büyük Başlık', icon: <Heading1 size={14} />, action: (ed) => ed.chain().focus().toggleHeading({ level: 1 }).run() },
    { id: 'h2', label: 'Orta Başlık', icon: <Heading2 size={14} />, action: (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run() },
    { id: 'h3', label: 'Küçük Başlık', icon: <Heading3 size={14} />, action: (ed) => ed.chain().focus().toggleHeading({ level: 3 }).run() },
    { id: 'bullet', label: 'Madde İmleri', icon: <List size={14} />, action: (ed) => ed.chain().focus().toggleBulletList().run() },
    { id: 'ordered', label: 'Numaralı Liste', icon: <ListOrdered size={14} />, action: (ed) => ed.chain().focus().toggleOrderedList().run() },
    { id: 'quote', label: 'Alıntı (Blok)', icon: <Quote size={14} />, action: (ed) => ed.chain().focus().toggleBlockquote().run() },
    { id: 'table', label: 'Tablo Ekle', icon: <TableIcon size={14} />, action: (ed) => ed.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { id: 'divider', label: 'Sayfa Sonu', icon: <Scissors size={14} />, action: (ed) => ed.chain().focus().setHorizontalRule().run() },
    { id: 'sig_left', label: 'İmza (Sola)', icon: <AlignLeft size={14} />, action: (ed) => ed.chain().focus().insertContent(insertSignatureBlock('left')).run() },
    { id: 'sig_left', label: 'İmza (Sağa)', icon: <AlignRight size={14} />, action: (ed) => ed.chain().focus().insertContent(insertSignatureBlock('right')).run() },
    { id: 'sig_dual', label: 'İmza (Yanyana)', icon: <PenTool size={14} />, action: (ed) => ed.chain().focus().insertContent(insertSignatureBlock('dual')).run() },
];

const SortableSection = memo(({ section, id: currentId, onSwitch, onEdit, onDelete, editingId, onRename }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section._id });
    const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 10 : 1 };
    const isActive = section._id === currentId;
    return (
        <div ref={setNodeRef} style={style} className={`${styles.sectionRow} ${isActive ? styles.sectionRowActive : ''}`} onClick={() => { if (editingId !== section._id) onSwitch(section._id); }}>
            <span {...attributes} {...listeners} className={styles.sectionDragHandle} onClick={e => e.stopPropagation()}>⠿</span>
            <div className={styles.sectionInfo} onDoubleClick={e => { e.stopPropagation(); onEdit(section._id); }}>
                <FileText size={14} color={isActive ? 'var(--accent)' : 'var(--text-muted)'} className={styles.sectionIcon} />
                {editingId === section._id ? (<input autoFocus onFocus={e => e.target.select()} defaultValue={section.name} onBlur={e => onRename(section._id, e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onRename(section._id, e.target.value); if (e.key === 'Escape') onEdit(null); }} className={styles.sectionInput} onClick={e => e.stopPropagation()} />) : (<span className={`${styles.sectionName} ${isActive ? styles.sectionNameActive : ''}`}>{section.name}</span>)}
            </div>
            <div className={styles.sectionActions} onClick={e => e.stopPropagation()}><button onClick={() => onEdit(section._id)} className={styles.sectionEditBtn}><Edit2 size={12} /></button><button onClick={() => onDelete(section._id)} className={styles.sectionDeleteBtn}><Trash2 size={12} /></button></div>
        </div>
    );
});
SortableSection.displayName = 'SortableSection';

export const FocusEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const mousePosRef = useRef({ x: 0, y: 0 });
    const sidebarScrollRef = useRef(null);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isZenMode, setIsZenMode] = useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);

    const [currentMode, setCurrentMode] = useState('FREE');
    const [documentData, setDocumentData] = useState(null);
    const [project, setProject] = useState(null);
    const [sections, setSections] = useState([]);
    const [projectVars, setProjectVars] = useState({});

    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('write');
    const [activeTab, setActiveTab] = useState('sections');
    const [isDirty, setIsDirty] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [saveStatus, setSaveStatus] = useState('saved');

    const [deleteSectionTarget, setDeleteSectionTarget] = useState(null);
    const [deleteVarTarget, setDeleteVarTarget] = useState(null);
    const [videoModal, setVideoModal] = useState({ show: false, url: '' });

    const [editingSectionId, setEditingSectionId] = useState(null);
    const [editingVarKey, setEditingVarKey] = useState(null);
    const [editVarKeyTemp, setEditVarKeyTemp] = useState('');
    const [editVarTempValue, setEditVarTempValue] = useState('');
    const [newVarKey, setNewVarKey] = useState('');
    const [newVarValue, setNewVarValue] = useState('');
    const [varSyncStatus, setVarSyncStatus] = useState('idle');
    const [varSearchTerm, setVarSearchTerm] = useState('');

    const [isTriggerCustom, setIsTriggerCustom] = useState(false);
    const [customTriggerInput, setCustomTriggerInput] = useState('');
    const [isEditingTrigger, setIsEditingTrigger] = useState(false);

    const [menuState, setMenuState] = useState({ show: false, pos: { top: 0, left: 0 }, query: '', range: null });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [slashMenuState, setSlashMenuState] = useState({ show: false, pos: { top: 0, left: 0 }, query: '', range: null });
    const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);

    const [varMenuState, setVarMenuState] = useState({ show: false, pos: { top: 0, left: 0 }, query: '', range: null });
    const [varSelectedIndex, setVarSelectedIndex] = useState(0);

    const [formatMenu, setFormatMenu] = useState({ show: false, top: 0, left: 0 });

    const [editorTheme, setEditorTheme] = useState('default');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfConfirmModal, setPdfConfirmModal] = useState(false);
    const [popover, setPopover] = useState({ show: false, type: null, top: 0, left: 0 });

    const documentRef = useRef();
    const projectVarsRef = useRef();
    const handleSaveRef = useRef(null);
    const editorHTMLRef = useRef('');
    const debounceTimer = useRef(null);
    const autoSaveTimerRef = useRef(null);

    const menuStateRef = useRef(menuState);
    const selectedIndexRef = useRef(selectedIndex);
    const slashMenuStateRef = useRef(slashMenuState);
    const slashSelectedIndexRef = useRef(slashSelectedIndex);
    const varMenuStateRef = useRef(varMenuState);
    const varSelectedIndexRef = useRef(varSelectedIndex);

    useEffect(() => { menuStateRef.current = menuState; }, [menuState]);
    useEffect(() => { selectedIndexRef.current = selectedIndex; }, [selectedIndex]);
    useEffect(() => { slashMenuStateRef.current = slashMenuState; }, [slashMenuState]);
    useEffect(() => { slashSelectedIndexRef.current = slashSelectedIndex; }, [slashSelectedIndex]);
    useEffect(() => { varMenuStateRef.current = varMenuState; }, [varMenuState]);
    useEffect(() => { varSelectedIndexRef.current = varSelectedIndex; }, [varSelectedIndex]);
    useEffect(() => { documentRef.current = documentData; }, [documentData]);
    useEffect(() => { projectVarsRef.current = projectVars; }, [projectVars]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('focus_theme');
        if (savedTheme) setEditorTheme(savedTheme);
    }, []);

    useEffect(() => { if (isZenMode) setIsSidebarOpen(false); }, [isZenMode]);

    useEffect(() => {
    const hasSeenTour = localStorage.getItem('focus_editor_tour_seen');
    if (!hasSeenTour && !loading) {
        const timer = setTimeout(() => {
            const driverObj = driver({
                showProgress: true,
                animate: true,
                doneBtnText: 'Yazmaya Başla ✍️',
                nextBtnText: 'İleri →',
                prevBtnText: '← Geri',
                popoverClass: 'custom-driver-theme',
                allowClose: false,
                steps: [
                    /* 1 ─ Belge adı */
                    {
                        element: '#focus-title-input',
                        popover: {
                            title: '📝 Belge Adı',
                            description:
                                'Çalışmanızın adını buradan değiştirebilirsiniz. ' +
                                'Tüm değişiklikler <strong>otomatik olarak buluta</strong> kaydedilir — kaydet butonuna basmayı unutma derdiniz yok.',
                            side: 'bottom',
                            align: 'start',
                        },
                    },
 
                    /* 2 ─ Tema seçici */
                    {
                        element: '#focus-theme-selector',
                        popover: {
                            title: '🎨 Atmosferi Seçin',
                            description:
                                '8 farklı temadan birini seçerek yazı deneyiminizi kişiselleştirin: ' +
                                'Gün Işığı, Gece Yarısı, Kütüphane, Orman, Buzul, Günbatımı, Mürekkep veya Lavanta.',
                            side: 'bottom',
                            align: 'center',
                        },
                    },
 
                    /* 3 ─ Yazım / Önizleme geçişi */
                    {
                        element: '#focus-view-toggle',
                        popover: {
                            title: '👁 Yazım & Önizleme',
                            description:
                                '<strong>Yazım</strong> modunda tam editöre sahipsiniz. ' +
                                '<strong>Önizleme</strong> moduna geçince değişkenler gerçek değerleriyle ' +
                                'belgeye yansır — PDF almadan önce son kontrol için idealdir.',
                            side: 'bottom',
                            align: 'center',
                        },
                    },
 
                    /* 4 ─ Değişkenler sekmesi */
                    {
                        element: '#focus-variables-tab',
                        popover: {
                            title: '⚡ Değişken Kütüphanesi',
                            description:
                                'Projenize ait tüm değişkenleri buradan yönetin. ' +
                                'Ekledikten sonra metin içinde <code>{{</code> yazarak ' +
                                'açılan listeden seçip hızlıca yapıştırabilirsiniz.',
                            side: 'right',
                            align: 'start',
                        },
                        onHighlightStarted: () => {
                            setIsSidebarOpen(true);
                            setActiveTab('variables');
                        },
                    },
 
                    /* 5 ─ Tetikleyici / kısayol tuşu */
                    {
                        element: '.triggerPanel',   // CSS sınıfına göre hedef
                        popover: {
                            title: '🔧 Kısayol Tuşu',
                            description:
                                'Değişkenleri çağırmak için kullandığınız tetikleyiciyi ' +
                                'buradan değiştirebilirsiniz: <code>{{isim}}</code>, ' +
                                '<code>[isim]</code>, <code>@isim</code> veya tamamen özel bir format.',
                            side: 'right',
                            align: 'start',
                        },
                        onHighlightStarted: () => {
                            setIsSidebarOpen(true);
                            setActiveTab('variables');
                        },
                    },
 
                    /* 6 ─ Bölümler / İçindekiler */
                    {
                        element: '#focus-paper-area',
                        popover: {
                            title: '📚 Bölümler (İçindekiler)',
                            description:
                                '"İçindekiler" sekmesinden projenize yeni bölümler ekleyebilir, ' +
                                'sürükle-bırak ile sıralayabilir ve bölümler arasında tek tıkla geçiş yapabilirsiniz.',
                            side: 'left',
                            align: 'center',
                        },
                        onHighlightStarted: () => {
                            setIsSidebarOpen(true);
                            setActiveTab('sections');
                        },
                    },
 
                    /* 7 ─ Slash komutları */
                    {
                        element: '#focus-paper-area',
                        popover: {
                            title: '/ Hızlı Komutlar',
                            description:
                                'Kağıtta yeni bir satıra <strong>/</strong> yazın: anında başlık, tablo, ' +
                                'liste, alıntı, imza bloğu veya sayfa sonu ekleyebilirsiniz. ' +
                                'Eller klavyede kalır, fare gerekmez.',
                            side: 'top',
                            align: 'center',
                        },
                    },
 
                    /* 8 ─ PDF indirme */
                    {
                        element: '.pdfButton',   // CSS sınıfıyla hedef
                        popover: {
                            title: '🖨 PDF\'e Aktar',
                            description:
                                'Belgenizi değişkenler doldurulmuş biçimde PDF olarak indirin. ' +
                                'Önizleme modunda değişkenlerinizi test ettikten sonra kullanmanızı öneririz.',
                            side: 'bottom',
                            align: 'end',
                        },
                    },
 
                    /* 9 ─ Zen modu */
                    {
                        element: '#focus-zen-btn',
                        popover: {
                            title: '🧘 Zen Modu',
                            description:
                                'Tüm menüleri gizleyip yalnızca beyaz kağıda odaklanmak için ' +
                                'bu butona tıklayın. <kbd>Esc</kbd> tuşuyla veya üst köşedeki ' +
                                'küçülen butona tıklayarak normal görünüme dönebilirsiniz.',
                            side: 'bottom',
                            align: 'end',
                        },
                    },
                ],
 
                onDestroyStarted: () => {
                    if (!driverObj.hasNextStep() ||
                        window.confirm('Eğitim turunu kapatmak istediğinize emin misiniz?')) {
                        localStorage.setItem('focus_editor_tour_seen', 'true');
                        driverObj.destroy();
                    }
                },
            });
 
            driverObj.drive();
        }, 1000);
 
        return () => clearTimeout(timer);
    }
}, [loading]);

    const handleThemeChange = useCallback((newTheme) => { setEditorTheme(newTheme); localStorage.setItem('focus_theme', newTheme); setPopover({ show: false }); }, []);
    const showToast = useCallback((message, type = 'success', silent = false) => { if (silent) return; setToast({ show: true, message, type }); setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000); }, []);

    const openPopover = (e, type) => { const rect = e.currentTarget.getBoundingClientRect(); setPopover({ show: true, type, top: rect.bottom + 6, left: rect.left }); };
    const closePopover = () => setPopover({ show: false, type: null, top: 0, left: 0 });

    const handleSave = useCallback(async (silent = false) => {
        if (!editorHTMLRef.current || !documentRef.current) return;
        setSaveStatus('saving');
        try {
            const token = localStorage.getItem('user_token'); const currentVars = projectVarsRef.current || {}; const currentDoc = documentRef.current;
            const sanitizedHtml = DOMPurify.sanitize(editorHTMLRef.current);
            const htmlToSave = convertToHandlebars(sanitizedHtml, currentVars._trigger || '{{');

            await axios.put(`${API_BASE_URL}/user-templates/${id}`, { ...currentDoc, content: htmlToSave }, { headers: { Authorization: `Bearer ${token}` } });
            if (currentDoc.projectId || currentDoc.project) { const pId = currentDoc.projectId || currentDoc.project; await axios.put(`${API_BASE_URL}/projects/${pId}`, { name: currentDoc.name }, { headers: { Authorization: `Bearer ${token}` } }); }
            setIsDirty(false); setSaveStatus('saved'); if (!silent) showToast('Başarıyla kaydedildi.', 'success');
            setSections(prev => prev.map(s => s._id === id ? { ...s, name: currentDoc.name } : s));
        } catch { setSaveStatus('error'); if (!silent) showToast('Kaydetme hatası.', 'error'); }
    }, [id, showToast]);

    useEffect(() => { handleSaveRef.current = handleSave; }, [handleSave]);

    useEffect(() => {
        if (!isDirty) return; setSaveStatus('unsaved');
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => { handleSaveRef.current?.(true); }, 1500);
        return () => clearTimeout(autoSaveTimerRef.current);
    }, [isDirty, documentData?.name]);

    const checkCursorForMenu = useCallback((ed) => {
        const { state, view } = ed; const { selection } = state;
        if (!selection.empty) {
            if (viewMode === 'write') {
                const coords = view.coordsAtPos(selection.from);
                setFormatMenu({ show: true, top: coords.top - 48, left: coords.left });
            }
            setMenuState(s => ({ ...s, show: false })); setSlashMenuState(s => ({ ...s, show: false })); setVarMenuState(s => ({ ...s, show: false }));
            return;
        } else { setFormatMenu({ show: false, top: 0, left: 0 }); }

        const $pos = selection.$anchor;
        const textBefore = $pos.parent.textBetween(Math.max(0, $pos.parentOffset - 40), $pos.parentOffset, null, '\ufffc');

        const trigger = projectVarsRef.current?._trigger || '{{';
        const escapedTrigger = trigger === '<<' ? '(?:<<|&lt;&lt;)' : trigger.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        const varRegex = new RegExp(`(?:^|\\s)(${escapedTrigger})([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]*)$`);
        const varMatch = textBefore.match(varRegex);

        if (varMatch) {
            const coords = view.coordsAtPos(selection.from);
            setVarMenuState({ show: true, pos: { top: coords.bottom + 5, left: coords.left }, query: varMatch[2], range: { from: selection.from - (varMatch[1].length + varMatch[2].length), to: selection.from } });
            setVarSelectedIndex(0); setSlashMenuState(s => ({ ...s, show: false })); setMenuState(s => ({ ...s, show: false }));
            return;
        }

        const slashRegex = /(?:^|\s)\/([a-zA-Zçğıöşü]*)$/;
        const slashMatch = textBefore.match(slashRegex);
        if (slashMatch) {
            const coords = view.coordsAtPos(selection.from);
            setSlashMenuState({ show: true, pos: { top: coords.bottom + 5, left: coords.left }, query: slashMatch[1], range: { from: selection.from - (1 + slashMatch[1].length), to: selection.from } });
            setSlashSelectedIndex(0); setVarMenuState(s => ({ ...s, show: false })); setMenuState(s => ({ ...s, show: false }));
            return;
        }

        setMenuState(s => ({ ...s, show: false })); setSlashMenuState(s => ({ ...s, show: false })); setVarMenuState(s => ({ ...s, show: false }));
    }, [viewMode]);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ blockquote: false, codeBlock: false }),
            TextStyle, Color, FontFamily, FontSize, LineHeight, Highlight.configure({ multicolor: true }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            CustomBlockquote, BlockquoteHighlightExtension, CodeBlockLowlight.configure({ lowlight }),
            Table.configure({ resizable: true }), TableRow, TableHeader, TableCell, CustomTableHeader, CustomTableCell,
            YoutubeExtension, ImageResize,
            Placeholder.configure({ placeholder: "Yazmaya başlayın veya komutlar için '/' tuşuna basın..." }),
            CharacterCount.configure({ limit: EDITOR_LIMITS.MAX_CHARS })
        ],
        content: '',
        onUpdate: ({ editor: ed }) => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            debounceTimer.current = setTimeout(() => { editorHTMLRef.current = ed.getHTML(); setIsDirty(true); checkCursorForMenu(ed); setSaveStatus('unsaved'); }, 400);
        },
        onSelectionUpdate: ({ editor: ed }) => checkCursorForMenu(ed)
    });

    useEffect(() => {
        if (!editor) return;
        editor.setOptions({
            editorProps: {
                handleKeyDown: (view, event) => {
                    const vms = varMenuStateRef.current; const vsi = varSelectedIndexRef.current;
                    const sms = slashMenuStateRef.current; const ssi = slashSelectedIndexRef.current;
                    const pvars = projectVarsRef.current || {};

                    if (vms.show) {
                        const filteredVars = Object.keys(pvars).filter(k => k !== '_trigger' && k.toLowerCase().includes(vms.query.toLowerCase()));
                        if (event.key === 'ArrowUp') { event.preventDefault(); setVarSelectedIndex(p => (p > 0 ? p - 1 : filteredVars.length - 1)); return true; }
                        if (event.key === 'ArrowDown') { event.preventDefault(); setVarSelectedIndex(p => (p < filteredVars.length - 1 ? p + 1 : 0)); return true; }
                        if (event.key === 'Enter' || event.key === 'Tab') {
                            event.preventDefault();
                            if (filteredVars[vsi]) {
                                const sym = getTriggerSymbols(pvars._trigger || '{{');
                                editor.chain().focus().deleteRange(vms.range).insertContent({ type: 'text', text: `${sym.s}${filteredVars[vsi]}${sym.e} ` }).run();
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
                            event.preventDefault(); if (filteredCmds[ssi]) { editor.chain().focus().deleteRange(sms.range).run(); filteredCmds[ssi].action(editor); }
                            setSlashMenuState(s => ({ ...s, show: false })); return true;
                        }
                        if (event.key === 'Escape' || event.key === ' ') { setSlashMenuState(s => ({ ...s, show: false })); return false; }
                        return false;
                    }
                    return false;
                }
            }
        });
    }, [editor]);

    useEffect(() => {
        if (varMenuState.show) { const el = window.document.getElementById(`var-item-${varSelectedIndex}`); if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
        if (slashMenuState.show) { const el = window.document.getElementById(`slash-item-${slashSelectedIndex}`); if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    }, [varSelectedIndex, varMenuState.show, slashSelectedIndex, slashMenuState.show]);

    const filteredSlashCmds = useMemo(() => SLASH_COMMANDS.filter(cmd => cmd.label.toLowerCase().includes(slashMenuState.query.toLowerCase())), [slashMenuState.query]);
    const varKeys = useMemo(() => Object.keys(projectVars).filter(k => k !== '_trigger'), [projectVars]);
    const filteredSidebarVars = useMemo(() => varKeys.filter(k => k.toLowerCase().includes(varSearchTerm.toLowerCase()) || (projectVars[k] || '').toLowerCase().includes(varSearchTerm.toLowerCase())), [varKeys, varSearchTerm, projectVars]);

    const compiledPreview = useMemo(() => {
        if (viewMode !== 'preview') return ''; const html = editorHTMLRef.current; if (!html) return '';
        try { const hbHtml = convertToHandlebars(html, projectVars._trigger || '{{'); const template = Handlebars.compile(hbHtml); return template(projectVars); }
        catch { return `<div style="color:var(--danger); padding:20px;">Şablon derlenirken hata oluştu. Lütfen değişkenlerinizi kontrol edin.</div>`; }
    }, [viewMode, projectVars, isDirty]);

    const executeSlashCommand = useCallback((cmd) => {
        const ms = slashMenuStateRef.current; editor?.chain().focus().deleteRange(ms.range).run(); cmd.action(editor); setSlashMenuState(s => ({ ...s, show: false }));
    }, [editor]);

    useEffect(() => { fetchData(); }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('user_token'); const docRes = await axios.get(`${API_BASE_URL}/user-templates/${id}`, { headers: { Authorization: `Bearer ${token}` } }); setDocumentData(docRes.data);
            if (docRes.data.projectId) {
                const projRes = await axios.get(`${API_BASE_URL}/projects/${docRes.data.projectId}`, { headers: { Authorization: `Bearer ${token}` } }); setProject(projRes.data.project);
                setCurrentMode(projRes.data.project?.settings?.mode || projRes.data.project?.mode || 'FREE');
                setSections((projRes.data.documents || []).sort((a, b) => (a.order || 0) - (b.order || 0)));
                const vars = projRes.data.project.variables || {}; const currentTrigger = projRes.data.project.settings?.variableTrigger || '{{'; vars._trigger = currentTrigger; setProjectVars(vars);
                if (!['{{', '[', '{', '@', '$', '<<'].includes(currentTrigger)) { setIsTriggerCustom(true); setCustomTriggerInput(currentTrigger); setIsEditingTrigger(false); }
                if (editor && docRes.data.content) {
                    const html = convertFromHandlebars(docRes.data.content, currentTrigger);
                    editor.commands.setContent(html, false);
                    editorHTMLRef.current = editor.getHTML();
                }
            }
            setIsDirty(false);
        } catch { showToast('Veriler yüklenirken hata oluştu.', 'error'); } finally { setLoading(false); }
    };

    const handleSwitchSection = useCallback((targetId) => { if (targetId === id) return; if (saveStatus !== 'saved') { handleSave(true).then(() => navigate(`/panel/editor/${targetId}`)); } else { navigate(`/panel/editor/${targetId}`); } }, [id, saveStatus, navigate, handleSave]);
    const handleBackClick = useCallback(() => { if (saveStatus !== 'saved') { handleSave(true).then(() => navigate(`/panel/projects/${project?._id}`)); } else { navigate(`/panel/projects/${project?._id}`); } }, [saveStatus, navigate, project, handleSave]);

    const handleAddSection = useCallback(async () => {
        try {
            const token = localStorage.getItem('user_token'); const response = await axios.post(`${API_BASE_URL}/projects/${project._id}/documents`, { name: `Yeni Bölüm ${sections.length + 1}` }, { headers: { Authorization: `Bearer ${token}` } });
            const newSection = response.data; newSection.order = (sections.length > 0 ? Math.max(...sections.map(s => s.order || 0)) : -1) + 1;
            const updatedSections = [...sections, newSection].sort((a, b) => (a.order || 0) - (b.order || 0)); setSections(updatedSections); setEditingSectionId(newSection._id);
            await axios.patch(`${API_BASE_URL}/projects/${project._id}/documents/reorder`, { orderedIds: updatedSections.map(s => s._id) }, { headers: { Authorization: `Bearer ${token}` } });
            setTimeout(() => { if (sidebarScrollRef.current) sidebarScrollRef.current.scrollTop = sidebarScrollRef.current.scrollHeight; }, 80);
        } catch { showToast('Bölüm eklenemedi.', 'error'); }
    }, [project, sections, showToast]);

    const confirmDeleteSection = useCallback(async () => {
        if (!deleteSectionTarget) return;
        try {
            const token = localStorage.getItem('user_token'); await axios.delete(`${API_BASE_URL}/user-templates/${deleteSectionTarget}`, { headers: { Authorization: `Bearer ${token}` } });
            const remaining = sections.filter(s => s._id !== deleteSectionTarget); setSections(remaining);
            if (deleteSectionTarget === id) { if (remaining.length > 0) navigate(`/panel/editor/${remaining[0]._id}`); else navigate(`/panel/projects/${project._id}`); }
            setDeleteSectionTarget(null); showToast('Bölüm başarıyla silindi.');
        } catch { showToast('Silme işlemi başarısız', 'error'); }
    }, [deleteSectionTarget, sections, id, navigate, project, showToast]);

    const handleRenameSection = useCallback(async (sectionId, newName) => {
        if (!newName.trim()) return setEditingSectionId(null);
        try {
            const token = localStorage.getItem('user_token'); await axios.put(`${API_BASE_URL}/user-templates/${sectionId}`, { name: newName }, { headers: { Authorization: `Bearer ${token}` } });
            setSections(prev => prev.map(s => s._id === sectionId ? { ...s, name: newName } : s));
            if (sectionId === id) { setDocumentData(prev => ({ ...prev, name: newName })); await axios.put(`${API_BASE_URL}/projects/${project._id}`, { name: newName }, { headers: { Authorization: `Bearer ${token}` } }); }
            setEditingSectionId(null);
        } catch { showToast('İsim değiştirilemedi.', 'error'); }
    }, [id, project, showToast]);

    const handleDragEnd = useCallback(async ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const oldIndex = sections.findIndex(s => s._id === active.id); const newIndex = sections.findIndex(s => s._id === over.id);
        const reordered = arrayMove(sections, oldIndex, newIndex); const updatedWithOrder = reordered.map((s, idx) => ({ ...s, order: idx })); setSections(updatedWithOrder);
        try { const token = localStorage.getItem('user_token'); await axios.patch(`${API_BASE_URL}/projects/${project._id}/documents/reorder`, { orderedIds: updatedWithOrder.map(s => s._id) }, { headers: { Authorization: `Bearer ${token}` } }); } catch { showToast('Sıralama kaydedilemedi.', 'error'); }
    }, [sections, project, showToast]);

    const syncVariablesToDb = useCallback(async (updatedVariables) => {
        setVarSyncStatus('saving');
        try { const token = localStorage.getItem('user_token'); await axios.put(`${API_BASE_URL}/projects/${project._id}`, { ...project, variables: updatedVariables }, { headers: { Authorization: `Bearer ${token}` } }); setVarSyncStatus('saved'); setTimeout(() => setVarSyncStatus('idle'), 2000); }
        catch { setVarSyncStatus('idle'); }
    }, [project]);

    // KENAR ÇUBUĞUNDAN EKLEME
    const insertVariableManual = useCallback((key) => {
        if (editor) {
            const sym = getTriggerSymbols(projectVars._trigger || '{{');
            editor.chain().focus().insertContent({ type: 'text', text: ` ${sym.s}${key}${sym.e} ` }).run();
        }
    }, [editor, projectVars._trigger, getTriggerSymbols]);

    const handleAddVariableFromEditor = useCallback(async () => {
        if (!newVarKey.trim() || !newVarValue.trim() || !project) return;
        const formattedKey = newVarKey.trim().toLowerCase().replace(/[^a-z0-9_çğıöşü]/g, '_');
        if (projectVars[formattedKey] !== undefined) return showToast('Bu değişken zaten var!', 'error');
        const updatedVars = { ...projectVars, [formattedKey]: newVarValue };
        setProjectVars(updatedVars); setNewVarKey(''); setNewVarValue(''); await syncVariablesToDb(Object.fromEntries(Object.entries(updatedVars).filter(([k]) => k !== '_trigger')));
    }, [newVarKey, newVarValue, project, projectVars, showToast, syncVariablesToDb]);

    const handleSaveEditedVariable = useCallback(async (oldKey) => {
        if (!editVarKeyTemp.trim()) return showToast('Anahtar boş olamaz.', 'error');
        const newKeyFormatted = editVarKeyTemp.trim().toLowerCase().replace(/[^a-z0-9_çğıöşü]/g, '_');
        if (newKeyFormatted !== oldKey && projectVars[newKeyFormatted] !== undefined) return showToast('Bu anahtar zaten mevcut!', 'error');
        const entries = Object.entries(projectVars).filter(([k]) => k !== '_trigger'); const reordered = entries.map(([k, v]) => k === oldKey ? [newKeyFormatted, editVarTempValue] : [k, v]);
        const updatedVars = { ...Object.fromEntries(reordered), _trigger: projectVars._trigger }; setProjectVars(updatedVars); setEditingVarKey(null); await syncVariablesToDb(Object.fromEntries(reordered));
    }, [editVarKeyTemp, editVarTempValue, projectVars, showToast, syncVariablesToDb]);

    const handleDeleteVariable = useCallback(async (key) => {
        const updated = { ...projectVars }; delete updated[key]; setProjectVars(updated); setDeleteVarTarget(null);
        try { const token = localStorage.getItem('user_token'); await axios.put(`${API_BASE_URL}/projects/${project._id}`, { name: project.name, description: project.description, variables: Object.fromEntries(Object.entries(updated).filter(([k]) => k !== '_trigger')) }, { headers: { Authorization: `Bearer ${token}` } }); showToast('Değişken silindi.'); } catch { showToast('Silme başarısız.', 'error'); }
    }, [projectVars, project, showToast]);

    const handleTriggerChange = useCallback(async (newTrigger) => {
        if (!newTrigger || !newTrigger.trim()) return showToast('Geçersiz tetikleyici.', 'error');
        if (newTrigger.length > 5) return showToast('Tetikleyici en fazla 5 karakter olabilir.', 'error');
        if (newTrigger.includes('/')) return showToast(" '/' işareti komut menüsü için ayrılmıştır.", "error");

        const updatedProject = { ...project, settings: { ...project.settings, variableTrigger: newTrigger } }; setProject(updatedProject); setProjectVars(prev => ({ ...prev, _trigger: newTrigger }));
        try {
            const token = localStorage.getItem('user_token'); await axios.put(`${API_BASE_URL}/projects/${project._id}`, updatedProject, { headers: { Authorization: `Bearer ${token}` } });
            showToast('Tetikleyici güncellendi.'); setIsEditingTrigger(false); if (!['{{', '[', '{', '@', '$', '<<'].includes(newTrigger)) setIsTriggerCustom(true);
            if (editor) { const updatedHtml = convertFromHandlebars(convertToHandlebars(editorHTMLRef.current, projectVars._trigger), newTrigger); editor.commands.setContent(updatedHtml, false); editorHTMLRef.current = editor.getHTML(); }
        } catch { /* silent */ }
    }, [project, editor, projectVars._trigger, showToast]);

    const handleImageUpload = useCallback((e) => { const file = e.target.files[0]; if (file && editor) { const reader = new FileReader(); reader.onload = (event) => { editor.chain().focus().setImage({ src: event.target.result }).run(); }; reader.readAsDataURL(file); } }, [editor]);
    const handleInsertVideo = useCallback(() => { if (videoModal.url.trim() && editor) editor.chain().focus().setYoutubeVideo({ src: videoModal.url.trim() }).run(); setVideoModal({ show: false, url: '' }); }, [videoModal.url, editor]);

    // EVRENSEL PDF İNDİRME ROTASI 
    const handlePrintPDF = async () => {
        setIsGeneratingPdf(true); showToast('PDF hazırlanıyor, lütfen bekleyin...', 'success', false);
        try {
            const token = localStorage.getItem('user_token');
            const hbHtml = convertToHandlebars(editorHTMLRef.current, projectVars._trigger || '{{');
            const template = Handlebars.compile(hbHtml);
            const htmlContent = template(projectVars);
            const targetId = documentData?.projectId || id;

            const res = await axios.post(`${API_BASE_URL}/projects/${targetId}/generate-pdf`,
                { html: htmlContent, documentName: documentData?.name || "Belge" },
                { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `${documentData?.name || "Belge"}.pdf`;
            window.document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            showToast('PDF başarıyla indirildi!', 'success');
        } catch { showToast('PDF oluşturulurken bir hata meydana geldi.', 'error'); } finally { setIsGeneratingPdf(false); setPdfConfirmModal(false); }
    };

    const resetToDefault = useCallback(() => { if (!editor) return; editor.chain().focus().unsetAllMarks().setParagraph().setTextAlign('left').unsetFontSize().run(); }, [editor]);

    if (loading && !documentData) return (<div className={styles.loadingContainer}><Loader2 size={28} className={styles.spinner} /><p>Odak alanı hazırlanıyor...</p></div>);

    const currentTrigger = projectVars._trigger || '{{'; const currentSym = getTriggerSymbols(currentTrigger);
    const modeConfig = PROJECT_MODES[currentMode] || PROJECT_MODES.FREE; const modeFeatures = modeConfig.features;
    const isCodeBlock = editor?.isActive('codeBlock'); const inTable = editor?.isActive('table');
    const textColor = editor?.getAttributes('textStyle').color || ''; const highlightColor = editor?.getAttributes('highlight').color || '';
    const currentFontFamily = editor?.getAttributes('textStyle').fontFamily || ''; const currentFontSize = editor?.getAttributes('textStyle').fontSize || '';
    const currentLineHeight = editor?.getAttributes('paragraph').lineHeight || editor?.getAttributes('heading').lineHeight || '';
    const tableCellBgColor = inTable ? (editor?.getAttributes('tableCell').backgroundColor || editor?.getAttributes('tableHeader').backgroundColor || null) : null;
    const currentHeadingLevel = editor?.isActive('heading', { level: 1 }) ? '1' : editor?.isActive('heading', { level: 2 }) ? '2' : editor?.isActive('heading', { level: 3 }) ? '3' : '0';

    const isDarkPaper = editorTheme === 'dark' || editorTheme === 'ink' || editorTheme === 'lavender' || editorTheme === 'forest' || editorTheme === 'sunset' || editorTheme === 'amber';
    const activeTextColors = isDarkPaper ? TEXT_COLORS_DARK : TEXT_COLORS_LIGHT;
    const activeHighlightColors = isDarkPaper ? HIGHLIGHT_COLORS_DARK : HIGHLIGHT_COLORS_LIGHT;

    return (
        <div className={styles.root} data-theme={editorTheme}>
            {toast.show && <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}><CheckCircle2 size={20} /> {toast.message}</div>}

            {/* Popover Sistemi */}
            {popover.show && (
                <>
                    <div className={styles.popoverOverlay} onMouseDown={closePopover} />
                    <div className={styles.fixedPopover} style={{ top: popover.top, left: popover.left }} onMouseDown={e => e.stopPropagation()}>
                        {popover.type === 'textColor' && (<div className={styles.colorPaletteFixed}>{activeTextColors.map(c => (<button key={c} className={styles.colorDot} style={{ backgroundColor: c }} onClick={() => { editor.chain().focus().setColor(c).run(); closePopover(); }} />))}<button className={`${styles.colorDot} ${styles.colorClearDot}`} onClick={() => { editor.chain().focus().unsetColor().run(); closePopover(); }}><X size={12} color="var(--danger)" /></button></div>)}
                        {popover.type === 'highlightColor' && (<div className={styles.colorPaletteFixed}>{activeHighlightColors.map(c => (<button key={c} className={`${styles.colorDot} ${c === 'transparent' ? styles.colorClearDot : ''}`} style={{ backgroundColor: c === 'transparent' ? 'var(--bg-hover)' : c }} onClick={() => { if (c === 'transparent') editor.chain().focus().unsetHighlight().run(); else editor.chain().focus().toggleHighlight({ color: c }).run(); closePopover(); }}>{c === 'transparent' && <X size={12} color="var(--danger)" />}</button>))}</div>)}
                        {popover.type === 'cellColor' && (<div className={styles.colorPaletteFixed}>{activeHighlightColors.map(c => (<button key={c} className={`${styles.colorDot} ${c === 'transparent' ? styles.colorClearDot : ''}`} style={{ backgroundColor: c === 'transparent' ? 'var(--bg-hover)' : c }} onClick={() => { if (c === 'transparent') editor.chain().focus().setCellAttribute('backgroundColor', null).run(); else editor.chain().focus().setCellAttribute('backgroundColor', c).run(); closePopover(); }}>{c === 'transparent' && <X size={12} color="var(--danger)" />}</button>))}</div>)}
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
                        {popover.type === 'variables' && (
                            <div className={styles.dropdownMenuFixed} style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', margin: '0 0 4px 0' }}>DEĞİŞKENLER</div>
                                {Object.keys(projectVars).filter(k => k !== '_trigger').length === 0 ? (<div style={{ padding: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Değişken bulunamadı</div>) : (
                                    Object.keys(projectVars).filter(k => k !== '_trigger').map(key => (
                                        <button key={key} className={styles.dropdownItem} onClick={() => {
                                            const sym = getTriggerSymbols(projectVars._trigger || '{{');
                                            editor.chain().focus().insertContent({ type: 'text', text: ` ${sym.s}${key}${sym.e} ` }).run();
                                            closePopover();
                                        }}>{key}</button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Slash (Komut) Menüsü */}
            {slashMenuState.show && (
                <>
                    <div className={styles.popoverOverlay} onMouseDown={() => setSlashMenuState(s => ({ ...s, show: false }))} style={{ background: 'transparent' }} />

                    {/* Kısmi Değişiklik: fixedPopover eklendi ve top/left buraya taşındı */}
                    <div className={styles.fixedPopover} style={{ top: slashMenuState.pos.top, left: slashMenuState.pos.left, zIndex: 2000 }}>
                        <div className={styles.dropdownMenuFixed} style={{ minWidth: '180px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', margin: '0 0 4px 0' }}>KOMUTLAR</div>
                            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                {filteredSlashCmds.map((cmd, idx) => (
                                    <button
                                        key={cmd.id}
                                        id={`slash-item-${idx}`}
                                        className={`${styles.dropdownItem} ${idx === slashSelectedIndex ? styles.dropdownItemActive : ''}`}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}
                                        onClick={() => executeSlashCommand(cmd)}
                                    >
                                        <span style={{ color: 'var(--text-secondary)' }}>{cmd.icon}</span>
                                        <span>{cmd.label}</span>
                                    </button>
                                ))}
                                {filteredSlashCmds.length === 0 && <div style={{ padding: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Komut bulunamadı</div>}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Kısayol Değişken Menüsü */}
            {varMenuState.show && (
                <>
                    <div className={styles.popoverOverlay} onMouseDown={() => setVarMenuState(s => ({ ...s, show: false }))} style={{ background: 'transparent' }} />

                    {/* Kısmi Değişiklik: fixedPopover eklendi ve top/left buraya taşındı */}
                    <div className={styles.fixedPopover} style={{ top: varMenuState.pos.top, left: varMenuState.pos.left, zIndex: 2000 }}>
                        <div className={styles.dropdownMenuFixed} style={{ minWidth: '220px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', margin: '0 0 4px 0' }}>DEĞİŞKENLER</div>
                            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                {varKeys.filter(k => k.toLowerCase().includes(varMenuState.query.toLowerCase())).map((k, idx) => (
                                    <button
                                        key={k}
                                        id={`var-item-${idx}`}
                                        className={`${styles.dropdownItem} ${idx === varSelectedIndex ? styles.dropdownItemActive : ''}`}
                                        style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
                                        onClick={() => {
                                            const sym = getTriggerSymbols(projectVars._trigger || '{{');
                                            editor.chain().focus().deleteRange(varMenuState.range).insertContent({ type: 'text', text: `${sym.s}${k}${sym.e} ` }).run();
                                            setVarMenuState(s => ({ ...s, show: false }));
                                        }}
                                    >
                                        <span style={{ fontWeight: 600 }}>{k}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{projectVars[k]}</span>
                                    </button>
                                ))}
                                {varKeys.filter(k => k.toLowerCase().includes(varMenuState.query.toLowerCase())).length === 0 && <div style={{ padding: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Değişken bulunamadı</div>}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* PDF İndirme Modalı */}
            {pdfConfirmModal && (
                <div className={`no-print ${styles.modalOverlay}`} onMouseDown={() => setPdfConfirmModal(false)}>
                    <div className={styles.modalCard} onMouseDown={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalIcon}><Printer size={20} color="var(--accent)" /></div>
                            <div style={{ textAlign: 'left' }}>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', color: 'var(--text-primary)' }}>PDF İndir</h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Girdiğiniz verilere göre belgeniz PDF formatına dönüştürülecektir.</p>
                            </div>
                            <button onClick={() => setPdfConfirmModal(false)} className={styles.modalClose}><X size={20} /></button>
                        </div>
                        <div className={styles.modalActions}>
                            <button onClick={() => setPdfConfirmModal(false)} className={styles.cancelBtn}>İptal</button>
                            <button onClick={handlePrintPDF} className={styles.primaryBtn}>Onayla ve İndir</button>
                        </div>
                    </div>
                </div>
            )}

            {videoModal.show && (<div className={`no-print ${styles.modalOverlay}`}><div className={styles.modalCard}><div className={styles.modalHeader}><div className={styles.modalIcon}><Video size={20} color="var(--accent)" /></div><div style={{ textAlign: 'left' }}><h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', color: 'var(--text-primary)' }}>YouTube Videosu Ekle</h3></div><button onClick={() => setVideoModal({ show: false, url: '' })} className={styles.modalClose}><X size={20} /></button></div><input autoFocus type="url" placeholder="https://youtube.com/watch?v=..." value={videoModal.url} onChange={e => setVideoModal(s => ({ ...s, url: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') handleInsertVideo(); if (e.key === 'Escape') setVideoModal({ show: false, url: '' }); }} className={styles.modalInput} /><div className={styles.modalActions}><button onClick={() => setVideoModal({ show: false, url: '' })} className={styles.cancelBtn}>Vazgeç</button><button onClick={handleInsertVideo} disabled={!videoModal.url.trim()} className={styles.primaryBtn}>Videoyu Ekle</button></div></div></div>)}
            {deleteSectionTarget && (<div className={`no-print ${styles.modalOverlay}`}><div className={styles.modalCard}><div className={styles.modalIconBox}><Trash2 size={24} color="var(--danger)" /></div><h2 style={{ color: 'var(--text-primary)' }}>Bölümü Sil</h2><p style={{ color: 'var(--text-secondary)' }}>Kalıcı olarak silmek istediğinize emin misiniz?</p><div className={styles.modalActions}><button onClick={() => setDeleteSectionTarget(null)} className={styles.cancelBtn}>Vazgeç</button><button onClick={confirmDeleteSection} className={styles.dangerBtn}>Evet, Sil</button></div></div></div>)}
            {deleteVarTarget && (<div className={`no-print ${styles.modalOverlay}`}><div className={styles.modalCard}><div className={styles.modalIconBox}><Trash2 size={22} color="var(--danger)" /></div><h2 style={{ color: 'var(--text-primary)' }}>Değişkeni Sil</h2><div className={styles.modalActions}><button onClick={() => setDeleteVarTarget(null)} className={styles.cancelBtn}>Vazgeç</button><button onClick={() => handleDeleteVariable(deleteVarTarget)} className={styles.dangerBtn}>Evet, Sil</button></div></div></div>)}

            {/* YARDIMCI ASİSTAN BUTONU VE ÇEKMECESİ */}
            <button className={`no-print ${styles.assistantFab}`} onClick={() => setIsAssistantOpen(true)} title="Akıllı Asistan"><Sparkles size={24} /></button>

            <div className={`no-print ${styles.assistantDrawer} ${isAssistantOpen ? styles.assistantDrawerOpen : ''}`}>
                <div className={styles.assistantHeader}>
                    <div className={styles.assistantTitle}><div className={styles.assistantAvatar}><Bot size={20} /></div><h3>Akıllı Asistan</h3></div>
                    <button onClick={() => setIsAssistantOpen(false)} className={styles.modalClose}><X size={20} /></button>
                </div>
                <div className={styles.assistantContent}>
                    <div className={styles.tipCard}>
                        <div className={styles.tipIcon}><Zap size={18} /></div>
                        <div><h4>Slash (/) Komutları</h4><p>Yeni bir satırda <code>/</code> tuşuna basarak hızlıca tablo, başlık veya imza alanı ekleyebilirsiniz. Eller klavyede kalır!</p></div>
                    </div>
                    <div className={styles.tipCard}>
                        <div className={styles.tipIcon}><Keyboard size={18} /></div>
                        <div><h4>Yüzen Menü (Biçimlendirme)</h4><p>Farenizle herhangi bir metni seçtiğiniz anda üzerinde küçük bir biçimlendirme menüsü belirir.</p></div>
                    </div>
                    <div className={styles.tipCard}>
                        <div className={styles.tipIcon}><Variable size={18} /></div>
                        <div><h4>Hızlı Değişken Çağırma</h4><p>Metin içinde <code>{currentTrigger}</code> yazarak değişken kütüphanenizi anında açabilirsiniz.</p></div>
                    </div>
                </div>
            </div>

            <aside className={`no-print ${styles.sidebar} ${isSidebarOpen ? '' : styles.sidebarClosed}`}>
                <div className={styles.sidebarHeader}>
                    <button onClick={handleBackClick} className={styles.backButton}><ArrowLeft size={16} /> Projeye Dön</button>
                    <button onClick={() => setIsSidebarOpen(false)} className={styles.closeSidebarBtn} title="Menüyü Kapat"><PanelLeftClose size={18} /></button>
                </div>
                <div className={styles.sidebarTabs}>
                    {['sections', 'variables'].map(tab => (<button key={tab} id={tab === 'variables' ? 'focus-variables-tab' : undefined} onClick={() => setActiveTab(tab)} className={`${styles.sidebarTab} ${activeTab === tab ? styles.sidebarTabActive : ''}`}>{tab === 'sections' ? 'İçindekiler' : 'Değişkenler'}</button>))}
                </div>
                <div ref={sidebarScrollRef} className={styles.sidebarContent}>
                    {activeTab === 'sections' ? (
                        <div>
                            <div className={styles.sectionHeader}><h3>Bölümler & Sayfalar</h3><button onClick={handleAddSection} className={styles.addButton} title="Yeni Bölüm Ekle"><Plus size={18} /></button></div>
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={sections.map(s => s._id)} strategy={verticalListSortingStrategy}>
                                    <div className={styles.sectionList}>{sections.map(section => <SortableSection key={section._id} section={section} id={id} onSwitch={handleSwitchSection} onEdit={setEditingSectionId} onDelete={setDeleteSectionTarget} onRename={handleRenameSection} editingId={editingSectionId} />)}</div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    ) : (
                        <div>
                            <div className={styles.triggerPanel}>
                                <div className={styles.triggerHeader}><Zap size={18} color="var(--accent)" /><h3>Kısayol Tuşu</h3></div>
                                {isTriggerCustom && !isEditingTrigger ? (
                                    <div className={styles.triggerCustom}><div className={styles.triggerValue}>{currentTrigger}</div><button onClick={() => setIsEditingTrigger(true)} className={styles.triggerEditBtn}>Değiştir</button></div>
                                ) : (
                                    <>
                                        <select value={isTriggerCustom ? 'custom' : currentTrigger} onChange={e => { if (e.target.value === 'custom') { setIsTriggerCustom(true); setCustomTriggerInput(''); } else { setIsTriggerCustom(false); handleTriggerChange(e.target.value); } }} className={styles.triggerSelect}>
                                            <option value="{{">{`{{değişken}}`}</option><option value="[">{`[değişken]`}</option><option value="{">{`{değişken}`}</option><option value="<<">{`<<değişken>>`}</option><option value="@">{`@değişken`}</option><option value="custom">✏️ Özel...</option>
                                        </select>
                                        {isTriggerCustom && (<div className={styles.triggerCustomInput}><input type="text" maxLength={5} value={customTriggerInput} onChange={e => setCustomTriggerInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleTriggerChange(customTriggerInput); }} /><button onClick={() => handleTriggerChange(customTriggerInput)}>Kaydet</button></div>)}
                                        {isEditingTrigger && <button onClick={() => setIsEditingTrigger(false)} className={styles.triggerCancelBtn}>Vazgeç</button>}
                                    </>
                                )}
                            </div>
                            <div className={styles.variablesHeader}><h3><Variable size={16} color="var(--accent)" /> Akıllı Değişkenler</h3><div>{varSyncStatus === 'saving' && <Loader2 size={14} className={styles.spinner} />}{varSyncStatus === 'saved' && <CheckCircle2 size={14} color="var(--success)" />}</div></div>
                            {varKeys.length > 5 && (<div className={styles.variableSearch}><Search size={14} /><input type="text" placeholder="Değişkenlerde ara..." value={varSearchTerm} onChange={e => setVarSearchTerm(e.target.value)} /></div>)}
                            <div className={styles.variableList}>
                                {filteredSidebarVars.length === 0 ? (<p className={styles.emptyText}>Değişken bulunamadı.</p>) : filteredSidebarVars.map(key => (
                                    <div key={key} className={styles.varCard} onClick={() => insertVariableManual(key)}>
                                        {editingVarKey !== key ? (
                                            <div className={styles.varCardInner}><div><div className={styles.varName}>{`${currentSym.s}${key}${currentSym.e}`}</div><div className={styles.varValue}>{projectVars[key]}</div></div><div className={styles.varActions}><button onClick={e => { e.stopPropagation(); setEditingVarKey(key); setEditVarKeyTemp(key); setEditVarTempValue(projectVars[key]); }}><Edit2 size={13} /></button><button onClick={e => { e.stopPropagation(); setDeleteVarTarget(key); }}><Trash2 size={13} /></button></div></div>
                                        ) : (
                                            <div className={styles.varEditForm} onClick={e => e.stopPropagation()}><input autoFocus value={editVarKeyTemp} onChange={e => setEditVarKeyTemp(e.target.value)} placeholder="Anahtar" /><input value={editVarTempValue} onChange={e => setEditVarTempValue(e.target.value)} placeholder="Değer" onKeyDown={e => { if (e.key === 'Enter') handleSaveEditedVariable(key); if (e.key === 'Escape') setEditingVarKey(null); }} /><div className={styles.varEditActions}><button onClick={() => setEditingVarKey(null)}>İptal</button><button onClick={() => handleSaveEditedVariable(key)}>Kaydet</button></div></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className={styles.addVariableForm}>
                                <h4>Yeni Ekle</h4>
                                <input type="text" placeholder="Anahtar (örn: bas_karakter)" value={newVarKey} onChange={e => setNewVarKey(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddVariableFromEditor(); }} />
                                <input type="text" placeholder="Değer (örn: Harry)" value={newVarValue} onChange={e => setNewVarValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddVariableFromEditor(); }} />
                                <button onClick={handleAddVariableFromEditor} disabled={!newVarKey.trim() || !newVarValue.trim() || varSyncStatus === 'saving'}>Kütüphaneye Ekle</button>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            <main className={styles.main}>
                <div className={`no-print ${styles.topHeader} ${isZenMode ? styles.topHeaderZen : ''}`}>
                    <div className={styles.docTitleSection}>
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={styles.sidebarToggleBtn} title={isSidebarOpen ? "Kenar Çubuğunu Gizle" : "Kenar Çubuğunu Göster"}>
                            {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
                        </button>
                        <input id="focus-title-input" className={styles.docTitleInput} value={documentData?.name || ''} onChange={e => { setDocumentData(prev => ({ ...prev, name: e.target.value })); setIsDirty(true); }} onBlur={() => handleSave(true)} placeholder="Belge Adı..." />
                    </div>

                    <div className={styles.headerActions}>
                        {/* TEMA SEÇİCİ DROPDOWN */}
                        <div id="focus-theme-selector" className={styles.compactThemeDropdown}>
                            <button onClick={(e) => popover.show && popover.type === 'themes' ? closePopover() : openPopover(e, 'themes')} className={styles.themeActiveBtn} title="Temayı Değiştir">
                                {THEMES.find(t => t.id === editorTheme)?.emoji}
                            </button>
                        </div>

                        <div id="focus-view-toggle" className={styles.viewToggle}>
                            <button onClick={() => setViewMode('write')} className={viewMode === 'write' ? styles.active : ''}><Code size={15} /> Yazım</button>
                            <button onClick={() => setViewMode('preview')} className={viewMode === 'preview' ? styles.active : ''}><Eye size={15} /> Önizleme</button>
                        </div>

                        <button onClick={() => setPdfConfirmModal(true)} disabled={isGeneratingPdf} className={styles.pdfButton}>
                            {isGeneratingPdf ? <><Loader2 size={16} className={styles.spinner} /> Hazırlanıyor</> : <><Printer size={16} className={styles.pdfIcon} /> İndir</>}
                        </button>

                        <div className={styles.autoSaveIndicator}>
                            {saveStatus === 'saving' && <><Loader2 size={14} className={styles.spinnerIcon} /> Kaydediliyor</>}
                            {saveStatus === 'saved' && <><Cloud size={14} style={{ color: 'var(--success)' }} /> Buluta kaydedildi</>}
                            {saveStatus === 'unsaved' && <><span className={styles.unsavedDot}></span> Değişiklikler var</>}
                            {saveStatus === 'error' && <><AlertCircle size={14} style={{ color: 'var(--danger)' }} /> Hata!</>}
                        </div>

                        <button id="focus-zen-btn" className={styles.zenToggleBtn} onClick={() => setIsZenMode(true)} title="Tam Ekran / Odak Modu"><Maximize2 size={18} /></button>
                    </div>
                </div>

                {viewMode === 'write' && editor && (
                    <div className={`no-print ${styles.toolbar} ${isZenMode ? styles.toolbarZen : ''}`}>
                        <div className={styles.toolbarRow}>
                            <TBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} icon={<Undo2 size={16} />} title="Geri Al" />
                            <TBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} icon={<Redo2 size={16} />} title="Yeniden Yap" />
                            <Divider />
                            {!isCodeBlock && (
                                <>
                                    <select onChange={e => { if (e.target.value) editor.chain().focus().setFontFamily(e.target.value).run(); else editor.chain().focus().unsetFontFamily().run(); }} value={currentFontFamily} className={styles.select}>
                                        <option value="">Font</option>
                                        {modeConfig.allowedFonts.map(font => <option key={font} value={font}>{font.split(',')[0]}</option>)}
                                    </select>
                                    {modeFeatures.fontSize && (
                                        <select onChange={e => e.target.value ? editor.chain().focus().setFontSize(e.target.value).run() : editor.chain().focus().unsetFontSize().run()} value={currentFontSize || ''} className={styles.select}>
                                            <option value="">Boyut</option>{[10, 12, 14, 16, 18, 20, 24, 28].map(s => <option key={s} value={`${s}px`}>{s}</option>)}
                                        </select>
                                    )}
                                    <select onChange={e => e.target.value ? editor.chain().focus().setLineHeight(e.target.value).run() : editor.chain().focus().unsetLineHeight().run()} value={currentLineHeight || ''} className={styles.select}>
                                        <option value="">Satır</option><option value="1">1.0</option><option value="1.2">1.2</option><option value="1.5">1.5</option><option value="2.0">2.0</option>
                                    </select>
                                    <Divider />
                                </>
                            )}

                            {modeFeatures.colors && !isCodeBlock && (<TBtn onClick={(e) => popover.show && popover.type === 'textColor' ? closePopover() : openPopover(e, 'textColor')} variant={textColor ? 'active' : 'default'} icon={<Palette size={16} />} title="Yazı Rengi" />)}
                            {modeFeatures.highlight && !isCodeBlock && (<TBtn onClick={(e) => popover.show && popover.type === 'highlightColor' ? closePopover() : openPopover(e, 'highlightColor')} variant={highlightColor && highlightColor !== 'transparent' ? 'active' : 'default'} icon={<Highlighter size={16} />} title="Vurgu Rengi" />)}

                            {(modeFeatures.colors || modeFeatures.highlight) && !isCodeBlock && <Divider />}
                            {!isCodeBlock && (
                                <>
                                    <TBtn onClick={() => editor.chain().focus().toggleBold().run()} variant={editor.isActive('bold') ? 'active' : 'default'} icon={<Bold size={16} />} title="Kalın" />
                                    <TBtn onClick={() => editor.chain().focus().toggleItalic().run()} variant={editor.isActive('italic') ? 'active' : 'default'} icon={<Italic size={16} />} title="İtalik" />
                                    <TBtn onClick={() => editor.chain().focus().toggleStrike().run()} variant={editor.isActive('strike') ? 'active' : 'default'} icon={<Strikethrough size={16} />} title="Üstü Çizili" />
                                    <Divider />
                                </>
                            )}
                            <TBtn onClick={resetToDefault} icon={<RotateCcw size={15} />} title="Formatı Sıfırla" />
                        </div>
                        <div className={styles.toolbarRow}>
                            <select onChange={e => { const val = parseInt(e.target.value); val === 0 ? editor.chain().focus().unsetFontSize().setParagraph().run() : editor.chain().focus().unsetFontSize().toggleHeading({ level: val }).run(); }} value={currentHeadingLevel} className={styles.select}>
                                <option value="0">Normal</option><option value="1">Başlık 1</option><option value="2">Başlık 2</option><option value="3">Başlık 3</option>
                            </select>
                            <Divider />
                            <TBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} variant={editor.isActive({ textAlign: 'left' }) ? 'active' : 'default'} icon={<AlignLeft size={16} />} />
                            <TBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} variant={editor.isActive({ textAlign: 'center' }) ? 'active' : 'default'} icon={<AlignCenter size={16} />} />
                            <TBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} variant={editor.isActive({ textAlign: 'right' }) ? 'active' : 'default'} icon={<AlignRight size={16} />} />
                            <TBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} variant={editor.isActive({ textAlign: 'justify' }) ? 'active' : 'default'} icon={<AlignJustify size={16} />} />
                            <Divider />
                            <TBtn onClick={() => editor.chain().focus().toggleBulletList().run()} variant={editor.isActive('bulletList') ? 'active' : 'default'} icon={<List size={16} />} />
                            <TBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} variant={editor.isActive('orderedList') ? 'active' : 'default'} icon={<List Ordered size={16} />} />
                            <Divider />
                            <TBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} variant={editor.isActive('blockquote') ? 'active' : 'default'} icon={<Quote size={16} />} />
                            {modeFeatures.code && <TBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} variant={editor.isActive('codeBlock') ? 'active' : 'default'} icon={<Code size={16} />} />}
                            <TBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={<Scissors size={16} />} />
                            <Divider />
                            {modeFeatures.media && (<><input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} /><TBtn onClick={() => fileInputRef.current.click()} icon={<ImageIcon size={16} />} /></>)}
                            {modeFeatures.video && <TBtn onClick={() => setVideoModal({ show: true, url: '' })} icon={<Video size={16} />} />}

                            <TBtn onClick={(e) => popover.show && popover.type === 'variables' ? closePopover() : openPopover(e, 'variables')} icon={<div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Variable size={14} /> <span>Ekle</span> <ChevronDown size={12} /></div>} title="Değişken Ekle" />

                            {modeFeatures.tables && (<TBtn onClick={() => inTable ? editor.chain().focus().deleteTable().run() : editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} variant={inTable ? 'danger' : 'default'} icon={inTable ? <Trash2 size={16} /> : <TableIcon size={16} />} title={inTable ? 'Tabloyu Sil' : 'Tablo Ekle'} />)}
                            {inTable && modeFeatures.tables && (
                                <>
                                    <Divider />
                                    {modeFeatures.colors && (<TBtn onClick={(e) => popover.show && popover.type === 'cellColor' ? closePopover() : openPopover(e, 'cellColor')} variant={tableCellBgColor && tableCellBgColor !== 'transparent' ? 'active' : 'default'} icon={<PaintBucket size={15} />} title="Hücre Rengi" />)}
                                    <TBtn onClick={() => editor.chain().focus().addRowAfter().run()} icon={<span className={styles.tbText}>+ Satır</span>} />
                                    <TBtn onClick={() => editor.chain().focus().deleteRow().run()} icon={<span className={`${styles.tbText} ${styles.tbDanger}`}>− Satır</span>} />
                                    <TBtn onClick={() => editor.chain().focus().addColumnAfter().run()} icon={<span className={styles.tbText}>+ Sütun</span>} />
                                    <TBtn onClick={() => editor.chain().focus().deleteColumn().run()} icon={<span className={`${styles.tbText} ${styles.tbDanger}`}>− Sütun</span>} />
                                </>
                            )}
                        </div>
                    </div>
                )}

                <div id="focus-paper-area" className={styles.canvas}>
                    <div className={styles.a4VirtualPaper}>
                        {viewMode === 'write' ? <EditorContent editor={editor} /> : <div className={styles.previewDocument} dangerouslySetInnerHTML={{ __html: compiledPreview }} />}
                    </div>

                    {!isSidebarOpen && varKeys.length > 0 && viewMode === 'write' && (
                        <div className={`no-print ${styles.quickVarList}`}>
                            <div className={styles.quickVarTitle}><Variable size={14} color="var(--accent)" /><span>Kısayollar ({currentTrigger})</span></div>
                            <div className={styles.quickVarScroll}>
                                {varKeys.map(key => (
                                    <button key={key} className={styles.quickVarItem} onClick={() => insertVariableManual(key)} title="Kağıda Ekle">
                                        <span className={styles.qvName}>{key}</span><span className={styles.qvVal}>{projectVars[key]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};