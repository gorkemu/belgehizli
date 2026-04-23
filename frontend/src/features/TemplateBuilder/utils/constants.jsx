import React from 'react';
import { Type, AlignLeft, Hash, Calendar, ChevronDown, CircleDot, CheckSquare, Heading1, Heading2, Heading3, List, ListOrdered, Scissors, AlignRight } from 'lucide-react';

export const EDITOR_LIMITS = { MAX_CHARS: 50000, MAX_IMAGE_SIZE_MB: 2 };

export const THEMES = [
  { id: 'default', label: 'Gün Işığı', emoji: '☀️' },
  { id: 'dark', label: 'Gece Yarısı', emoji: '🌙' },
  { id: 'amber', label: 'Kütüphane', emoji: '🕯️' },
  { id: 'forest', label: 'Orman', emoji: '🌲' },
  { id: 'glacier', label: 'Buzul', emoji: '❄️' },
  { id: 'sunset', label: 'Günbatımı', emoji: '🌅' },
  { id: 'ink', label: 'Mürekkep', emoji: '🖋️' },
  { id: 'lavender', label: 'Lavanta', emoji: '🔮' },
];

export const VARIABLE_FORMATS = [
  { id: 'curly2', label: 'Çift Süslü Parantez', ex: '{{isim}}', regex: /\{\{\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*\}\}/g },
  { id: 'square', label: 'Köşeli Parantez', ex: '[isim]', regex: /\[\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*\]/g },
  { id: 'angle2', label: 'Çift Ok', ex: '<<isim>>', regex: /(?:&lt;|<){2}\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*(?:&gt;|>){2}/g },
  { id: 'curly1', label: 'Tek Süslü Parantez', ex: '{isim}', regex: /\{(?!\s*\{)\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*\}(?!\s*\})/g },
  { id: 'at', label: 'Et İşareti', ex: '@isim', regex: /@([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)/g }
];

export const TEXT_COLORS = ['#000000', '#1e293b', '#334155', '#475569', '#2563eb', '#dc2626', '#059669'];
export const HIGHLIGHT_COLORS = ['transparent', '#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8'];

export const FIELD_TYPES = [
  { value: 'text', label: 'Kısa Metin', icon: Type }, 
  { value: 'textarea', label: 'Uzun Metin', icon: AlignLeft },
  { value: 'number', label: 'Sayı', icon: Hash }, 
  { value: 'date', label: 'Tarih', icon: Calendar },
  { value: 'select', label: 'Açılır Liste', icon: ChevronDown }, 
  { value: 'radio', label: 'Tekli Seçim', icon: CircleDot },
  { value: 'checkbox', label: 'Çoklu Seçim', icon: CheckSquare }
];