import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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

  // Çeviri için yardımcı: FIELD_TYPES label'larını t() ile al
  const getFieldTypeLabel = (value) => {
    const key = `templateBuilder.fieldType.${value}`;
    const translated = t(key);
    // Eğer çeviri anahtarı yoksa (geri dönüş olarak key dönerse) orijinal label'ı döndür
    return translated !== key ? translated : FIELD_TYPES.find(t => t.value === value)?.label || value;
  };

  return (
    <div ref={setNodeRef} style={style} className={`${styles.fieldCard} ${hasError ? styles.cardError : ''} ${isExpanded ? styles.cardOpen : ''} ${isHighlighted ? styles.cardHighlighted : ''}`}>
      <div className={styles.fieldHeader} onClick={() => toggleExpand(field.id)}>
        <div className={styles.fieldHeaderLeft}>
          <span {...attributes} {...listeners} className={styles.dragHandle} onClick={e => e.stopPropagation()}>
            <GripVertical size={16} />
          </span>
          <div className={styles.fieldTypeIcon}><FieldIcon size={15} /></div>
          <span className={styles.fieldLabel}>{field.label || <span className={styles.unnamed}>{t('sidebar.unnamedField')}</span>}</span>
        </div>
        <div className={styles.fieldHeaderRight}>
          {field.name && (
            <button className={styles.insertVarBtn} onClick={(e) => { e.stopPropagation(); onInsertVariable(field.name); }} title={t('sidebar.insertToText')}>
              <Plus size={12} /> {t('sidebar.add')}
            </button>
          )}
          {hasError && <AlertCircle size={15} className={styles.errorIcon} />}
          {isExpanded ? <ChevronUp size={16} className={styles.chevron} /> : <ChevronDown size={16} className={styles.chevron} />}
        </div>
      </div>
      
      {isExpanded && (
        <div className={styles.fieldBody}>
          <div className={styles.tabRow}>
            <button className={`${styles.tab} ${tab === 'basic' ? styles.tabActive : ''}`} onClick={() => setTab('basic')}>{t('sidebar.basic')}</button>
            <button className={`${styles.tab} ${tab === 'advanced' ? styles.tabActive : ''}`} onClick={() => setTab('advanced')}>{t('sidebar.advanced')}</button>
          </div>
          
          {tab === 'basic' ? (
            <div className={styles.tabContent}>
              <div className={styles.fg}>
                <label>{t('sidebar.questionText')}</label>
                <input className={`${styles.inp} ${formErrors[`field_${index}`] ? styles.inpErr : ''}`} value={field.label || ''} onChange={e => updateFieldLabelAndName(index, e.target.value)} placeholder={t('sidebar.questionPlaceholder')} autoFocus />
              </div>
              <div className={styles.row2}>
                <div className={styles.fg}>
                  <label>{t('sidebar.fieldType')}</label>
                  <select className={styles.sel} value={field.fieldType || 'text'} onChange={e => updateField(index, 'fieldType', e.target.value)}>
                    {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{getFieldTypeLabel(t.value)}</option>)}
                  </select>
                </div>
                <div className={styles.fgCheck}>
                  <label className={styles.checkLabel}>
                    <input type="checkbox" checked={field.required !== false} onChange={e => updateField(index, 'required', e.target.checked)} className={styles.chk} /> {t('sidebar.required')}
                  </label>
                </div>
              </div>
              {['select', 'radio', 'checkbox'].includes(field.fieldType) && (
                <div className={`${styles.optArea} ${formErrors[`options_${index}`] ? styles.optAreaErr : ''}`}>
                  <label>{t('sidebar.options')}</label>
                  {(field.options || []).map((opt, oi) => (
                    <div key={oi} className={styles.optRow}>
                      <span className={styles.optBullet} />
                      <input className={`${styles.inp} ${formErrors[`options_${index}`] && !opt.trim() ? styles.inpErr : ''}`} value={opt} onChange={e => updateOption(index, oi, e.target.value)} placeholder={`${t('sidebar.option')} ${oi + 1}`} />
                      <button className={styles.optDel} onClick={() => removeOption(index, oi)}><X size={13} /></button>
                    </div>
                  ))}
                  <button className={styles.addOpt} onClick={() => addOption(index)}><Plus size={14} /> {t('sidebar.addOption')}</button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.tabContent}>
              <div className={styles.fg}>
                <label>{t('sidebar.variableName')} <span className={styles.hint}>{t('sidebar.auto')}</span></label>
                <input className={`${styles.inp} ${styles.monoInp}`} value={field.name || ''} onChange={e => updateFieldName(index, e.target.value)} />
              </div>
              <div className={styles.fg}>
                <label>{t('sidebar.placeholderText')}</label>
                <input className={styles.inp} value={field.placeholder || ''} onChange={e => updateField(index, 'placeholder', e.target.value)} placeholder={t('sidebar.placeholderHint')} />
              </div>
              <div className={styles.condWrap}>
                {!field.condition ? (
                  <button className={styles.addCond} onClick={() => toggleCondition(index)}><Zap size={13} /> {t('sidebar.addCondition')}</button>
                ) : (
                  <div className={styles.condBox}>
                    <div className={styles.condTitle}><Settings size={13} /> {t('sidebar.condition')} <button className={styles.removeCond} onClick={() => updateField(index, 'condition', null)}>{t('sidebar.removeCondition')}</button></div>
                    <div className={styles.row2}>
                      <div className={styles.fg}>
                        <label>{t('sidebar.conditionQuestion')}</label>
                        <select className={styles.sel} value={field.condition.field || ''} onChange={e => updateField(index, 'condition', { ...field.condition, field: e.target.value, value: '' })}>
                          <option value="">{t('sidebar.select')}</option>
                          {getChoiceFields(index).map(f => <option key={f.name} value={f.name}>{f.label || f.name}</option>)}
                        </select>
                      </div>
                      {field.condition.field && (
                        <div className={styles.fg}>
                          <label>{t('sidebar.conditionValue')}</label>
                          <select className={styles.sel} value={field.condition.value || ''} onChange={e => updateField(index, 'condition', { ...field.condition, value: e.target.value })}>
                            <option value="">{t('sidebar.select')}</option>
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
            <button className={styles.delBtn} onClick={() => removeField(index)}><Trash2 size={13} /> {t('sidebar.delete')}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SortableFieldCard;