import React, { useState } from 'react';
import { useTemplateBuilder } from '../../hooks/useTemplateBuilder';
import { generateVarName, getTriggerSymbols } from '../../utils/helpers';
import globalStyles from '../../TemplateBuilder.module.css';
import styles from './Sidebar.module.css';

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Plus, Lightbulb } from 'lucide-react';
import SortableFieldCard from './SortableFieldCard';

const Sidebar = () => {
  const { 
    formData, setFormData, 
    formErrors, setFormErrors,
    expandedFields, setExpandedFields,
    editorInstance, triggerSymbol, showToast 
  } = useTemplateBuilder();

  const [highlightedField, setHighlightedField] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // --- Field Manipulation Functions ---
  const toggleExpand = id => setExpandedFields(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
  
  const addField = () => {
    const id = Math.random().toString(36).substr(2, 9);
    setFormData(p => ({ ...p, fields: [...p.fields, { id, name: '', label: '', fieldType: 'text', required: true, options: [], placeholder: '', condition: null, nameEdited: false }] }));
    setExpandedFields([id]); 
    setHighlightedField(id); 
    setTimeout(() => setHighlightedField(null), 2500); 
    setTimeout(() => { const el = document.getElementById('field-list'); if (el) el.scrollTop = el.scrollHeight; }, 80);
  };

  const updateFieldLabelAndName = (i, v) => { 
    setFormData(p => { 
      const fs = [...p.fields]; 
      let nextName = fs[i].name;

      if (!fs[i].nameEdited) {
        const baseVarName = generateVarName(v);
        let finalName = baseVarName;
        let counter = 1;
        while (fs.some((f, idx) => idx !== i && f.name === finalName)) {
          finalName = `${baseVarName}_${counter}`;
          counter++;
        }
        nextName = finalName;
      }

      fs[i] = { ...fs[i], label: v, name: nextName }; 
      return { ...p, fields: fs }; 
    }); 
    
    if (formErrors[`field_${i}`]) {
      setFormErrors(p => ({ ...p, [`field_${i}`]: false })); 
    }
  };

  const updateFieldName = (i, v) => setFormData(p => { const fs = [...p.fields]; fs[i] = { ...fs[i], name: v, nameEdited: true }; return { ...p, fields: fs }; });
  const updateField = (i, k, v) => setFormData(p => { const fs = [...p.fields]; fs[i] = { ...fs[i], [k]: v }; if (k === 'fieldType' && !['select', 'radio', 'checkbox'].includes(v)) fs[i].options = []; return { ...p, fields: fs }; });
  const removeField = i => setFormData(p => ({ ...p, fields: p.fields.filter((_, idx) => idx !== i) }));
  
  const addOption = fi => setFormData(p => { const fs = [...p.fields]; fs[fi].options = [...(fs[fi].options || []), '']; return { ...p, fields: fs }; });
  const updateOption = (fi, oi, v) => setFormData(p => { const fs = [...p.fields]; fs[fi].options[oi] = v; return { ...p, fields: fs }; });
  const removeOption = (fi, oi) => setFormData(p => { const fs = [...p.fields]; fs[fi].options = fs[fi].options.filter((_, i) => i !== oi); return { ...p, fields: fs }; });
  
  const toggleCondition = i => setFormData(p => { const fs = [...p.fields]; fs[i].condition = fs[i].condition ? null : { field: '', value: '' }; return { ...p, fields: fs }; });
  const getChoiceFields = ci => formData.fields.filter((f, i) => i !== ci && ['select', 'radio', 'checkbox'].includes(f.fieldType));

  const handleDragEnd = ({ active, over }) => { 
    if (active && over && active.id !== over.id) { 
      setFormData(p => { 
        const oi = p.fields.findIndex(f => f.id === active.id); 
        const ni = p.fields.findIndex(f => f.id === over.id); 
        return { ...p, fields: arrayMove(p.fields, oi, ni) }; 
      }); 
    } 
  };

  const handleInsertVariable = (name) => {
    if (!editorInstance) return;
    const sym = getTriggerSymbols(triggerSymbol);
    editorInstance.chain().focus().insertContent({ type: 'text', text: ` ${sym.s}${name}${sym.e} ` }).run();
    showToast('Metne eklendi!', 'success');
  };

  return (
    <aside className={styles.left}>
      <div className={styles.panelHead}>
        <span className={styles.panelTitle}>Form alanları</span>
        <span className={styles.fieldCount}>{formData.fields.length}</span>
      </div>
      
      <div className={styles.fieldList} id="field-list">
        {formData.fields.length === 0 ? (
          <div className={styles.emptyFieldsState}>
            <Lightbulb size={32} color="var(--warning)" style={{ marginBottom: 12 }} />
            <h4>Formunuz henüz boş</h4>
            <p>Sağdaki kağıda metninizi yapıştırın veya belge sürükleyin. Değişecek kelimeleri fareyle seçerek soruya dönüştürün!</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={formData.fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
              {formData.fields.map((field, i) => (
                <SortableFieldCard 
                  key={field.id} 
                  field={field} 
                  index={i} 
                  isExpanded={expandedFields.includes(field.id)} 
                  formErrors={formErrors} 
                  isHighlighted={highlightedField === field.id} 
                  toggleExpand={toggleExpand} 
                  updateField={updateField} 
                  updateFieldLabelAndName={updateFieldLabelAndName} 
                  updateFieldName={updateFieldName} 
                  removeField={removeField} 
                  addOption={addOption} 
                  updateOption={updateOption} 
                  removeOption={removeOption} 
                  toggleCondition={toggleCondition} 
                  getChoiceFields={getChoiceFields} 
                  allFields={formData.fields} 
                  onInsertVariable={handleInsertVariable} 
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
        <button className={styles.addFieldBtn} onClick={addField}>
          <Plus size={16} /> Yeni alan ekle
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;