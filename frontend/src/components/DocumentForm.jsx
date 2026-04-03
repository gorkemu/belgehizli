import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { IMaskInput } from 'react-imask';
import styles from './DocumentForm.module.css';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

const DocumentForm = forwardRef(({ templateFields, onChange, onValidChange, initialData }, ref) => {
    const [formValues, setFormValues] = useState({});
    const [errors, setErrors] = useState({});
    const isInitialized = useRef(false);
    const isBlurValidating = useRef(false);

    const isFieldVisible = (field, currentFormValues) => {
        if (!field.condition) return true;
        const controllingFieldValue = currentFormValues[field.condition.field];
        return String(controllingFieldValue) === String(field.condition.value);
    };

    const createEmptyBlock = (subfields) => {
        const block = {};
        subfields.forEach(subfield => { block[subfield.name] = ''; });
        return block;
    };

    const checkValiditySilently = () => {
        let formIsValid = true;
        if (!templateFields) return true;

        templateFields.forEach(field => {
            const isVisible = isFieldVisible(field, formValues);
            if (!isVisible) return;

            if (field.fieldType !== 'repeatable') {
                if (field.required) {
                    const v = formValues[field.name];
                    if (v === undefined || v === null || String(v).trim() === '') {
                        formIsValid = false;
                    }
                }
                if (!formIsValid) return;
                if (field.fieldType === 'email' && formValues[field.name] && !/\S+@\S+\.\S+/.test(formValues[field.name])) {
                    formIsValid = false;
                }
                if (field.fieldType === 'number' && formValues[field.name] && isNaN(Number(formValues[field.name]))) {
                    formIsValid = false;
                }
            } else {
                const blocks = formValues[field.name] || [];
                blocks.forEach(block => {
                    field.subfields.forEach(subfield => {
                        if (subfield.required) {
                            const sv = block[subfield.name];
                            if (sv === undefined || sv === null || String(sv).trim() === '') {
                                formIsValid = false;
                            }
                        }
                    });
                    if (!formIsValid) return;
                });
            }
        });

        return formIsValid;
    };

    useEffect(() => {
        if (!templateFields || !Array.isArray(templateFields) || isInitialized.current) return;

        const initialValues = {};
        const initialErrors = {};

        templateFields.forEach(field => {
            if (field.fieldType === 'repeatable') {
                if (initialData && Array.isArray(initialData[field.name]) && initialData[field.name].length > 0) {
                    initialValues[field.name] = initialData[field.name];
                    initialErrors[field.name] = initialData[field.name].map(() => ({}));
                } else {
                    initialValues[field.name] = [];
                    initialErrors[field.name] = [];
                    const minInstances = field.minInstances || 1;
                    for (let i = 0; i < minInstances; i++) {
                        initialValues[field.name].push(createEmptyBlock(field.subfields));
                        initialErrors[field.name].push({});
                    }
                }
            } else {
                initialValues[field.name] = initialData?.[field.name] !== undefined ? initialData[field.name] : '';
            }
        });

        setFormValues(initialValues);
        setErrors(initialErrors);
        isInitialized.current = true;
    }, [templateFields, initialData]);

    useEffect(() => {
        if (onChange) onChange(formValues, errors);
        if (onValidChange) onValidChange(checkValiditySilently());
    }, [formValues, errors, onChange, onValidChange]);

    const updateFormValue = (name, newValue) => {
        const match = name.match(/^([a-zA-Z0-9_]+)\[(\d+)\]\[([a-zA-Z0-9_]+)\]$/);
        if (match) {
            const [blockName, indexStr, subfieldName] = match.slice(1);
            const index = parseInt(indexStr, 10);
            setFormValues(prev => ({ ...prev, [blockName]: prev[blockName]?.map((item, i) => i === index ? { ...item, [subfieldName]: newValue } : item) ?? [] }));
            setErrors(prev => {
                const newErrors = { ...prev };
                if (newErrors[name]) {
                    delete newErrors[name];
                }
                return newErrors;
            });
        } else {
            setFormValues(prev => ({ ...prev, [name]: newValue }));
            setErrors(prev => {
                const newErrors = { ...prev };
                if (newErrors[name]) {
                    delete newErrors[name];
                }
                return newErrors;
            });

            setFormValues(current => {
                const updated = { ...current };
                templateFields.forEach(f => {
                    if (f.condition?.field === name && !isFieldVisible(f, updated)) {
                        if (f.fieldType === 'repeatable') {
                            if (updated[f.name]?.length > 0) updated[f.name] = [];
                            if (errors[f.name]) setErrors(prev => {
                                const ne = { ...prev };
                                delete ne[f.name];
                                return ne;
                            });
                        } else {
                            if (updated[f.name] !== '') updated[f.name] = '';
                            if (errors[f.name]) setErrors(prev => {
                                const ne = { ...prev };
                                delete ne[f.name];
                                return ne;
                            });
                        }
                    }
                });
                return updated;
            });
        }
    };

    const handleInputChange = (event) => {
        updateFormValue(event.target.name, event.target.type === 'checkbox' ? event.target.checked : event.target.value);
    };

    const handleFieldBlur = (event) => {
        if (isBlurValidating.current) return;
        isBlurValidating.current = true;
        validateField(event.target.name);
        isBlurValidating.current = false;
    };

    const handleAddBlock = (blockName, subfields, maxInstances) => {
        setFormValues(prev => {
            const curr = prev[blockName] || [];
            if (maxInstances && curr.length >= maxInstances) {
                return prev;
            }
            return { ...prev, [blockName]: [...curr, createEmptyBlock(subfields)] };
        });
    };

    const handleRemoveBlock = (blockName, index, minInstances) => {
        setFormValues(prev => {
            const curr = prev[blockName] || [];
            if (curr.length <= (minInstances || 0)) {
                return prev;
            }
            return { ...prev, [blockName]: curr.filter((_, i) => i !== index) };
        });
        setErrors(prev => {
            const newErrors = { ...prev };
            Object.keys(newErrors).forEach(key => {
                if (key.startsWith(`${blockName}[${index}]`)) {
                    delete newErrors[key];
                }
            });
            return newErrors;
        });
    };

    useImperativeHandle(ref, () => ({
        handleSubmit: () => validateForm()
    }));

    const validateField = (name) => {
        if (!templateFields) return;

        const match = name.match(/^([a-zA-Z0-9_]+)\[(\d+)\]\[([a-zA-Z0-9_]+)\]$/);
        let field, value;

        if (match) {
            const [blockName, index, subName] = [match[1], parseInt(match[2]), match[3]];
            field = templateFields.find(f => f.name === blockName)?.subfields.find(sf => sf.name === subName);
            value = formValues[blockName]?.[index]?.[subName];
        } else {
            field = templateFields.find(f => f.name === name);
            value = formValues[name];
        }

        if (!field) return;

        let fieldError = '';
        if (field.required && (!value || String(value).trim() === '')) {
            fieldError = `${field.label || field.name} alanı zorunludur.`;
        } else if (!fieldError && field.fieldType === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
            fieldError = `Geçerli bir e-posta adresi girin.`;
        } else if (!fieldError && field.fieldType === 'number' && value && isNaN(Number(value))) {
            fieldError = `Bir sayı girmelisiniz.`;
        }

        setErrors(prev => {
            const newErrors = { ...prev };
            if (fieldError) {
                newErrors[name] = fieldError;
            } else {
                delete newErrors[name];
            }
            return newErrors;
        });
    };

    const validateForm = () => {
        const newErrors = {};
        let formIsValid = true;

        templateFields.forEach(field => {
            const isVisible = isFieldVisible(field, formValues);
            if (!isVisible) return;

            if (field.fieldType !== 'repeatable') {
                const value = formValues[field.name];
                let fieldError = '';
                if (field.required && (!value || String(value).trim() === '')) {
                    fieldError = `${field.label || field.name} alanı zorunludur.`;
                    formIsValid = false;
                } else if (field.fieldType === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
                    fieldError = `Geçerli bir e-posta adresi girin.`;
                    formIsValid = false;
                }
                if (fieldError) newErrors[field.name] = fieldError;
            } else {
                const blocks = formValues[field.name] || [];
                blocks.forEach((block, index) => {
                    field.subfields.forEach(subfield => {
                        const inputName = `${field.name}[${index}][${subfield.name}]`;
                        const value = block[subfield.name];
                        if (subfield.required && (!value || String(value).trim() === '')) {
                            newErrors[inputName] = `${subfield.label || subfield.name} zorunludur.`;
                            formIsValid = false;
                        }
                    });
                });
            }
        });

        setErrors(newErrors);
        return formIsValid;
    };

    const renderInputField = (field, blockIndex = null) => {
        if (!field || !field.name) return null;
        const inputName = blockIndex !== null ? `${field.blockName}[${blockIndex}][${field.name}]` : field.name;
        const value = blockIndex !== null ? formValues[field.blockName]?.[blockIndex]?.[field.name] || '' : formValues[field.name] || '';
        const errorMessage = errors[inputName] || '';

        const inputClass = errorMessage ? `${styles.formInput} ${styles.inputError}` : styles.formInput;
        const selectClass = errorMessage ? `${styles.formSelect} ${styles.inputError}` : styles.formSelect;
        const textareaClass = errorMessage ? `${styles.formTextarea} ${styles.inputError}` : styles.formTextarea;
        const placeholderText = field.placeholder || field.label || '';

        let maskOptions = null;
        let inputType = field.fieldType === 'email' ? 'email' : (field.fieldType === 'number' ? 'number' : (field.fieldType === 'date' ? 'date' : 'text'));

        if (field.name.toLowerCase().includes('telefon')) {
            maskOptions = { mask: '{0}(000) 000 00 00', lazy: false };
            inputType = 'tel';
        } else if (field.name.toLowerCase().includes('tc_no') || field.name.toLowerCase().includes('tc_kimlik_no')) {
            maskOptions = { mask: '00000000000' };
            inputType = 'tel';
        } else if (field.name.toLowerCase().includes('iban')) {
            maskOptions = { mask: 'TR00 0000 0000 0000 0000 0000 00', prepare: (str) => str.toUpperCase() };
            inputType = 'text';
        }

        const commonProps = {
            id: inputName,
            name: inputName,
            onBlur: handleFieldBlur,
        };

        switch (field.fieldType) {
            case 'text':
            case 'number':
            case 'email':
            case 'tel':
                if (maskOptions) {
                    return <IMaskInput {...maskOptions} type={inputType} {...commonProps} className={inputClass} value={value} placeholder={placeholderText} unmask={true} onAccept={(unmaskedValue) => { updateFormValue(inputName, unmaskedValue); }} />;
                } else {
                    return <input type={inputType} {...commonProps} className={inputClass} onChange={handleInputChange} placeholder={placeholderText} value={value} />;
                }
            case 'date':
                return <input type="date" {...commonProps} className={inputClass} onChange={handleInputChange} value={value} />;
            case 'textarea':
                return <textarea {...commonProps} className={textareaClass} onChange={handleInputChange} placeholder={placeholderText} value={value} rows={field.rows || 3} />;
            case 'select':
                return (
                    <select {...commonProps} className={selectClass} onChange={handleInputChange} value={value}>
                        <option value="">{placeholderText || 'Seçiniz...'}</option>
                        {field.options?.map((opt, idx) => typeof opt === 'string' ? <option key={`${inputName}-opt-${idx}`} value={opt}>{opt}</option> : <option key={`${inputName}-opt-${idx}`} value={opt.value}>{opt.label}</option>)}
                    </select>
                );
            case 'radio':
                return (
                    <div className={styles.radioGroup}>
                        {field.options?.map((opt, idx) => {
                            const val = typeof opt === 'string' ? opt : opt.value;
                            const lbl = typeof opt === 'string' ? opt : opt.label;
                            const id = `${inputName}-opt-${idx}`;
                            return (
                                <label key={id} className={styles.radioContainer}>
                                    <input type="radio" id={id} name={inputName} value={val} checked={String(value) === String(val)} onChange={handleInputChange} className={styles.radioInput} onBlur={handleFieldBlur} />
                                    <span className={styles.radioLabel}>{lbl}</span>
                                </label>
                            );
                        })}
                    </div>
                );
            default:
                return <input type="text" {...commonProps} className={inputClass} onChange={handleInputChange} placeholder={placeholderText} value={value} />;
        }
    };

    return (
        <div className={styles.container}>
            <form onSubmit={(e) => e.preventDefault()}>
                {templateFields.map((field) => {
                    const visible = isFieldVisible(field, formValues);
                    if (!visible) return null;

                    if (field.fieldType === 'repeatable') {
                        const blocks = formValues[field.name] || [];
                        const minInstances = field.minInstances || 1;
                        const maxInstances = field.maxInstances;
                        const canRemove = blocks.length > minInstances;
                        const canAdd = !maxInstances || blocks.length < maxInstances;

                        return (
                            <div key={field.name} className={styles.repeatableBlockContainer}>
                                <h3 className={styles.repeatableBlockLabel}>{field.label}</h3>
                                {blocks.map((blockData, index) => (
                                    <div key={`${field.name}-${index}`} className={styles.repeatableBlockInstance}>
                                        <div className={styles.blockHeader}>
                                            <h4>{field.blockTitle || 'Blok'} {index + 1}</h4>
                                            {canRemove && (
                                                <button type="button" onClick={() => handleRemoveBlock(field.name, index, minInstances)} className={styles.removeButton}>
                                                    <Trash2 size={14} /> {field.removeLabel || 'Sil'}
                                                </button>
                                            )}
                                        </div>
                                        {field.subfields.map(subfield => {
                                            const inputName = `${field.name}[${index}][${subfield.name}]`;
                                            const subfieldError = errors[inputName];
                                            return (
                                                <div key={subfield.name} className={styles.formGroup}>
                                                    <label className={styles.formLabel}>
                                                        {subfield.label || subfield.name}
                                                        {subfield.required && <span>*</span>}
                                                    </label>
                                                    {renderInputField({ ...subfield, blockName: field.name }, index)}
                                                    {subfieldError && (
                                                        <p className={styles.errorMessage}>
                                                            <AlertCircle size={12} /> {subfieldError}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                                {canAdd && (
                                    <button type="button" onClick={() => handleAddBlock(field.name, field.subfields, maxInstances)} className={styles.addButton}>
                                        <Plus size={16} /> {field.addLabel || 'Yeni Ekle'}
                                    </button>
                                )}
                            </div>
                        );
                    } else {
                        const fieldError = errors[field.name];
                        return (
                            <div key={field.name} className={styles.formGroup}>
                                {field.fieldType !== 'checkbox' && (
                                    <label className={styles.formLabel}>
                                        {field.label || field.name}
                                        {field.required && <span>*</span>}
                                    </label>
                                )}
                                {renderInputField(field)}
                                {fieldError && (
                                    <p className={styles.errorMessage}>
                                        <AlertCircle size={12} /> {fieldError}
                                    </p>
                                )}
                                {field.name === 'belge_email' && (
                                    <small className={styles.emailInfoText}>
                                        Orijinal PDF belgenizin bir kopyası bu adrese gönderilecektir.
                                    </small>
                                )}
                            </div>
                        );
                    }
                })}
            </form>
        </div>
    );
});

export default DocumentForm;