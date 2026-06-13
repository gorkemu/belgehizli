// frontend/src/features/TemplateBuilder/utils/constants.jsx
import React from 'react';
import { Type, AlignLeft, Hash, Calendar, ChevronDown, CircleDot, CheckSquare, Heading1, Heading2, Heading3, List, ListOrdered, Scissors, AlignRight } from 'lucide-react';

export const EDITOR_LIMITS = { MAX_CHARS: 50000, MAX_IMAGE_SIZE_MB: 2 };

// Çeviri anahtarları: "templateBuilder.themes.<label>"
export const THEMES = [
  // Açık Temalar
  { id: 'default', label: 'templateBuilder.themes.daylight', emoji: '☀️', type: 'light' },
  { id: 'glacier', label: 'templateBuilder.themes.glacier', emoji: '❄️', type: 'light' },
  { id: 'marine', label: 'templateBuilder.themes.marine', emoji: '🌊', type: 'light' },
  { id: 'ivory', label: 'templateBuilder.themes.ivory', emoji: '📜', type: 'light' },
  { id: 'sage', label: 'templateBuilder.themes.sage', emoji: '🌿', type: 'light' },
  { id: 'rose', label: 'templateBuilder.themes.rose', emoji: '🌹', type: 'light' },
  
  // Koyu Temalar
  { id: 'dark', label: 'templateBuilder.themes.midnight', emoji: '🌙', type: 'dark' },
  { id: 'amber', label: 'templateBuilder.themes.library', emoji: '🕯️', type: 'dark' },
  { id: 'forest', label: 'templateBuilder.themes.forest', emoji: '🌲', type: 'dark' },
  { id: 'sunset', label: 'templateBuilder.themes.sunset', emoji: '🌅', type: 'dark' },
  { id: 'ink', label: 'templateBuilder.themes.ink', emoji: '🖋️', type: 'dark' },
  { id: 'lavender', label: 'templateBuilder.themes.lavender', emoji: '🔮', type: 'dark' },
  { id: 'noir', label: 'templateBuilder.themes.noir', emoji: '🖤', type: 'dark' },
  { id: 'slate', label: 'templateBuilder.themes.slate', emoji: '🪨', type: 'dark' }
];

// Çeviri anahtarları: "templateBuilder.variableFormat.<label>"
export const VARIABLE_FORMATS = [
  {
    id: 'curly2',
    label: 'templateBuilder.variableFormat.doubleCurly',
    ex: 'templateBuilder.variableFormat.exampleDoubleCurly',   // "{{isim}}" → "{{name}}"
    regex: /\{\{\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*\}\}/g
  },
  {
    id: 'square',
    label: 'templateBuilder.variableFormat.square',
    ex: 'templateBuilder.variableFormat.exampleSquare',       // "[isim]" → "[name]"
    regex: /\[\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*\]/g
  },
  {
    id: 'angle2',
    label: 'templateBuilder.variableFormat.doubleAngle',
    ex: 'templateBuilder.variableFormat.exampleDoubleAngle',  // "<<isim>>" → "<<name>>"
    regex: /(?:&lt;|<){2}\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*(?:&gt;|>){2}/g
  },
  {
    id: 'curly1',
    label: 'templateBuilder.variableFormat.singleCurly',
    ex: 'templateBuilder.variableFormat.exampleSingleCurly',  // "{isim}" → "{name}"
    regex: /\{(?!\s*\{)\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*\}(?!\s*\})/g
  },
  {
    id: 'at',
    label: 'templateBuilder.variableFormat.atSign',
    ex: 'templateBuilder.variableFormat.exampleAtSign',       // "@isim" → "@name"
    regex: /@([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)/g
  }
];

export const TEXT_COLORS = ['#000000', '#1e293b', '#334155', '#475569', '#2563eb', '#dc2626', '#059669'];
export const HIGHLIGHT_COLORS = ['transparent', '#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8'];

// Çeviri anahtarları: "templateBuilder.fieldType.<value>"
export const FIELD_TYPES = [
  { value: 'text', label: 'templateBuilder.fieldType.text', icon: Type }, 
  { value: 'textarea', label: 'templateBuilder.fieldType.textarea', icon: AlignLeft },
  { value: 'number', label: 'templateBuilder.fieldType.number', icon: Hash }, 
  { value: 'date', label: 'templateBuilder.fieldType.date', icon: Calendar },
  { value: 'select', label: 'templateBuilder.fieldType.select', icon: ChevronDown }, 
  { value: 'radio', label: 'templateBuilder.fieldType.radio', icon: CircleDot },
  { value: 'checkbox', label: 'templateBuilder.fieldType.checkbox', icon: CheckSquare }
];