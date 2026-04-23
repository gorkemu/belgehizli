import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, ChevronDown, ChevronUp, AlertCircle, Plus, 
  Trash2, X, Settings, Zap, Type 
} from 'lucide-react';
import { FIELD_TYPES } from '../../utils/constants';
import globalStyles from '../../TemplateBuilder.module.css';
import styles from './Sidebar.module.css';

const SortableFieldCard = ({ 
  field, index, isExpanded, formErrors, isHighlighted, 
  toggleExpand, updateField, updateFieldLabelAndName, updateFieldName, 
  removeField, addOption, updateOption, removeOption, 
  toggleCondition, getChoiceFields, allFields, onInsertVariable 
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const [tab, setTab] = useState('basic');
  
  const style = { 
    transform: CSS.Translate.toString(transform), 
    transition, 
    opacity: isDragging ? 0.4 : 1, 
    zIndex: isDragging ? 50 : 1 
  };
  
  const FieldIcon = FIELD_TYPES.find(t => t.value === (field.fieldType || 'text'))?.icon || Type;
  const hasError = formErrors[`field_${index}`] || formErrors[`options_${index}`];

  return (
    <div ref={setNodeRef} style={style} className={`${styles.fieldCard} ${hasError ? styles.cardError : ''} ${isExpanded ? styles.cardOpen : ''} ${isHighlighted ? styles.cardHighlighted : ''}`}>
      <div className={styles.fieldHeader} onClick={() => toggleExpand(field.id)}>
        <div className={styles.fieldHeaderLeft}>
          <span {...attributes} {...listeners} className={styles.dragHandle} onClick={e => e.stopPropagation()}>
            <GripVertical size={16} />
          </span>
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
          <div className={styles.tabRow}>
            <button className={`${styles.tab} ${tab === 'basic' ? styles.tabActive : ''}`} onClick={() => setTab('basic')}>Temel</button>
            <button className={`${styles.tab} ${tab === 'advanced' ? styles.tabActive : ''}`} onClick={() => setTab('advanced')}>Gelişmiş</button>
          </div>
          
          {tab === 'basic' ? (
            <div className={styles.tabContent}>
              <div className={styles.fg}>
                <label>Soru metni</label>
                <input className={`${styles.inp} ${formErrors[`field_${index}`] ? styles.inpErr : ''}`} value={field.label || ''} onChange={e => updateFieldLabelAndName(index, e.target.value)} placeholder="Örn: Adı Soyadı" autoFocus />
              </div>
              <div className={styles.row2}>
                <div className={styles.fg}>
                  <label>Alan tipi</label>
                  <select className={styles.sel} value={field.fieldType || 'text'} onChange={e => updateField(index, 'fieldType', e.target.value)}>
                    {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className={styles.fgCheck}>
                  <label className={styles.checkLabel}>
                    <input type="checkbox" checked={field.required !== false} onChange={e => updateField(index, 'required', e.target.checked)} className={styles.chk} /> Zorunlu alan
                  </label>
                </div>
              </div>
              {['select', 'radio', 'checkbox'].includes(field.fieldType) && (
                <div className={`${styles.optArea} ${formErrors[`options_${index}`] ? styles.optAreaErr : ''}`}>
                  <label>Seçenekler</label>
                  {(field.options || []).map((opt, oi) => (
                    <div key={oi} className={styles.optRow}>
                      <span className={styles.optBullet} />
                      <input className={`${styles.inp} ${formErrors[`options_${index}`] && !opt.trim() ? styles.inpErr : ''}`} value={opt} onChange={e => updateOption(index, oi, e.target.value)} placeholder={`Seçenek ${oi + 1}`} />
                      <button className={styles.optDel} onClick={() => removeOption(index, oi)}><X size={13} /></button>
                    </div>
                  ))}
                  <button className={styles.addOpt} onClick={() => addOption(index)}><Plus size={14} /> Seçenek ekle</button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.tabContent}>
              <div className={styles.fg}>
                <label>Değişken adı <span className={styles.hint}>(otomatik)</span></label>
                <input className={`${styles.inp} ${styles.monoInp}`} value={field.name || ''} onChange={e => updateFieldName(index, e.target.value)} />
              </div>
              <div className={styles.fg}>
                <label>Placeholder metni</label>
                <input className={styles.inp} value={field.placeholder || ''} onChange={e => updateField(index, 'placeholder', e.target.value)} placeholder="Yönlendirici metin..." />
              </div>
              <div className={styles.condWrap}>
                {!field.condition ? (
                  <button className={styles.addCond} onClick={() => toggleCondition(index)}><Zap size={13} /> Gösterim şartı ekle</button>
                ) : (
                  <div className={styles.condBox}>
                    <div className={styles.condTitle}><Settings size={13} /> Gösterim şartı <button className={styles.removeCond} onClick={() => updateField(index, 'condition', null)}>Kaldır</button></div>
                    <div className={styles.row2}>
                      <div className={styles.fg}>
                        <label>Hangi soruya bağlı?</label>
                        <select className={styles.sel} value={field.condition.field || ''} onChange={e => updateField(index, 'condition', { ...field.condition, field: e.target.value, value: '' })}>
                          <option value="">Seçiniz…</option>
                          {getChoiceFields(index).map(f => <option key={f.name} value={f.name}>{f.label || f.name}</option>)}
                        </select>
                      </div>
                      {field.condition.field && (
                        <div className={styles.fg}>
                          <label>Cevabı ne olmalı?</label>
                          <select className={styles.sel} value={field.condition.value || ''} onChange={e => updateField(index, 'condition', { ...field.condition, value: e.target.value })}>
                            <option value="">Seçiniz…</option>
                            {(allFields.find(f => f.name === field.condition.field)?.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className={styles.fieldFooter}>
            <button className={styles.delBtn} onClick={() => removeField(index)}><Trash2 size={13} /> Sil</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SortableFieldCard;