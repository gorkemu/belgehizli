// frontend/src/pages/ProjectDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Plus, Variable, FileText, Trash2, Edit2, BookOpen,
  CheckCircle2, Loader2, Zap, Key, Link as LinkIcon, Copy, X, Settings2, AlertTriangle, LayoutTemplate
} from 'lucide-react';

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './ProjectDetail.module.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const SortableDocumentRow = ({ doc, onEdit, onDelete, onRename, editingId, navigate }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: doc._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 10 : 1 };
  const isFocusMode = doc.editorMode === 'focus_editor';

  return (
    <div ref={setNodeRef} style={style} className={`${styles.sortableRow} ${isDragging ? styles.dragging : ''}`} onClick={() => { if (editingId !== doc._id) navigate(doc.editorMode === 'focus_editor' ? `/panel/editor/${doc._id}` : `/panel/duzenle/${doc._id}`); }}>
      <div className={styles.sortableRowContent}>
        <span {...attributes} {...listeners} className={styles.dragHandle} onClick={e => e.stopPropagation()}>⠿</span>
        <div className={`${styles.docIcon} ${isFocusMode ? styles.docIconFocus : ''}`}>
          {isFocusMode ? <FileText size={18} color="#8b5cf6" /> : <Settings2 size={18} color="#2563eb" />}
        </div>
        <div className={styles.docInfo} onDoubleClick={e => { e.stopPropagation(); onEdit(doc._id); }}>
          {editingId === doc._id ? (
            <input autoFocus onFocus={e => e.target.select()} defaultValue={doc.name} onBlur={e => onRename(doc._id, e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onRename(doc._id, e.target.value); if (e.key === 'Escape') onEdit(null); }} className={styles.docNameInput} onClick={e => e.stopPropagation()} />
          ) : (
            <><h3 className={styles.docName}>{doc.name}</h3><span className={styles.docMode}>{isFocusMode ? 'Odak Modu (Metin)' : 'Şablon Modu (Form)'}</span></>
          )}
        </div>
      </div>
      <div className={styles.sortableRowActions}>
        <button onClick={e => { e.stopPropagation(); onEdit(doc._id); }} className={styles.editBtn} title="Yeniden Adlandır"><Edit2 size={15} /></button>
        <button onClick={e => { e.stopPropagation(); onDelete(doc._id); }} className={styles.deleteBtn} title="Sil"><Trash2 size={15} /></button>
      </div>
    </div>
  );
};

export const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const [project, setProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [variables, setVariables] = useState({});

  const [newVarKey, setNewVarKey] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [editingVarKey, setEditingVarKey] = useState(null);
  const [editVarTempValue, setEditVarTempValue] = useState('');
  const [editingKeyFor, setEditingKeyFor] = useState(null);
  const [editKeyTemp, setEditKeyTemp] = useState('');

  const [editingProjectName, setEditingProjectName] = useState(false);
  const [editingProjectDesc, setEditingProjectDesc] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [deleteVarTarget, setDeleteVarTarget] = useState(null);
  const [deleteSectionTarget, setDeleteSectionTarget] = useState(null);
  const [editingDocId, setEditingDocId] = useState(null);

  const [isTriggerCustom, setIsTriggerCustom] = useState(false);
  const [customTriggerInput, setCustomTriggerInput] = useState('');
  const [isEditingTrigger, setIsEditingTrigger] = useState(false);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => { setToast({ show: true, message, type }); setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000); };

  useEffect(() => {
    if (id) fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const token = localStorage.getItem('user_token');
      const response = await axios.get(`${API_BASE_URL}/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setProject(response.data.project);
      setDocuments(response.data.documents);
      setVariables(response.data.project.variables || {});
      const trg = response.data.project.settings?.variableTrigger || '{{';
      if (!['{{', '[', '{', '@', '$'].includes(trg)) { setIsTriggerCustom(true); setCustomTriggerInput(trg); setIsEditingTrigger(false); }
    } catch {
      console.error("Proje bulunamadı veya yetkisiz erişim.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndOpenTemplate = async () => {
    try {
      const token = localStorage.getItem('user_token');
      const response = await axios.post(`${API_BASE_URL}/projects/${id}/documents`, { name: `Ana Şablon` }, { headers: { Authorization: `Bearer ${token}` } });
      navigate(`/panel/duzenle/${response.data._id}`);
    } catch { showToast('Şablon başlatılamadı.', 'error'); }
  };

  const handleCreateDocument = async () => {
    try {
      const token = localStorage.getItem('user_token');
      const response = await axios.post(`${API_BASE_URL}/projects/${id}/documents`, { name: `Yeni Bölüm ${documents.length + 1}` }, { headers: { Authorization: `Bearer ${token}` } });
      setDocuments([...documents, response.data]);
      setEditingDocId(response.data._id);
    } catch { showToast('Bölüm oluşturulamadı.', 'error'); }
  };

  const confirmDeleteSection = async () => {
    if (!deleteSectionTarget) return;
    try {
      const token = localStorage.getItem('user_token');
      await axios.delete(`${API_BASE_URL}/user-templates/${deleteSectionTarget}`, { headers: { Authorization: `Bearer ${token}` } });
      setDocuments(documents.filter(d => d._id !== deleteSectionTarget));
      setDeleteSectionTarget(null);
      showToast('Bölüm başarıyla silindi.');
    } catch { showToast('Silme işlemi başarısız', 'error'); }
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = documents.findIndex(s => s._id === active.id);
    const newIndex = documents.findIndex(s => s._id === over.id);
    const reordered = arrayMove(documents, oldIndex, newIndex);
    setDocuments(reordered);
    try {
      const token = localStorage.getItem('user_token');
      await axios.patch(`${API_BASE_URL}/projects/${id}/documents/reorder`, { orderedIds: reordered.map(s => s._id) }, { headers: { Authorization: `Bearer ${token}` } });
    } catch { showToast('Sıralama kaydedilemedi.', 'error'); }
  };

  const syncProjectDetails = async (updates) => {
    setSyncStatus('saving');
    try {
      const token = localStorage.getItem('user_token');
      const updatedProject = { ...project, ...updates };
      setProject(updatedProject);
      await axios.put(`${API_BASE_URL}/projects/${id}`, updatedProject, { headers: { Authorization: `Bearer ${token}` } });
      setSyncStatus('saved'); setTimeout(() => setSyncStatus('idle'), 2000);
    } catch { setSyncStatus('idle'); showToast('Proje güncellenemedi.', 'error'); }
  };

  const syncVariablesToDb = async (updatedVariables) => {
    setSyncStatus('saving');
    try {
      const token = localStorage.getItem('user_token');
      await axios.put(`${API_BASE_URL}/projects/${id}`, { ...project, variables: updatedVariables }, { headers: { Authorization: `Bearer ${token}` } });
      setSyncStatus('saved'); setTimeout(() => setSyncStatus('idle'), 2000);
    } catch { setSyncStatus('idle'); }
  };

  const handleRenameDocument = async (docId, newName) => {
    if (!newName.trim()) return setEditingDocId(null);
    try {
      const token = localStorage.getItem('user_token');
      await axios.put(`${API_BASE_URL}/user-templates/${docId}`, { name: newName }, { headers: { Authorization: `Bearer ${token}` } });
      setDocuments(documents.map(d => d._id === docId ? { ...d, name: newName } : d));
      setEditingDocId(null);
    } catch { showToast('İsim değiştirilemedi.', 'error'); }
  };

  const handleAddVariable = async () => {
    if (!newVarKey || !newVarValue) return;
    const formattedKey = newVarKey.trim().toLowerCase().replace(/[^a-z0-9_çğıöşü]/g, '_');
    if (variables[formattedKey] !== undefined) return showToast('Bu değişken zaten var!', 'error');
    const newVars = { ...variables, [formattedKey]: newVarValue };
    setVariables(newVars); setNewVarKey(''); setNewVarValue('');
    await syncVariablesToDb(newVars); showToast('Değişken eklendi.');
  };

  const handleEditVariableValue = async (key, newValue) => {
    if (!newValue.trim()) return setEditingVarKey(null);
    const newVars = { ...variables, [key]: newValue };
    setVariables(newVars); setEditingVarKey(null); await syncVariablesToDb(newVars);
  };

  const handleRenameVariableKey = async (oldKey, newKey) => {
    setEditingKeyFor(null);
    if (!newKey.trim() || oldKey === newKey) return;
    const formatted = newKey.trim().toLowerCase().replace(/[^a-z0-9_çğıöşü]/g, '_');
    if (variables[formatted] !== undefined && formatted !== oldKey) return showToast('Bu anahtar zaten mevcut!', 'error');
    const entries = Object.entries(variables).map(([k, v]) => k === oldKey ? [formatted, v] : [k, v]);
    const newVars = Object.fromEntries(entries);
    setVariables(newVars); await syncVariablesToDb(newVars); showToast('Değişken güncellendi.');
  };

  const confirmDeleteVariable = async () => {
    const newVars = { ...variables }; delete newVars[deleteVarTarget];
    setVariables(newVars); setDeleteVarTarget(null); await syncVariablesToDb(newVars); showToast('Değişken silindi.');
  };

  const handleTriggerChange = async (newTrigger) => {
    if (!newTrigger || !newTrigger.trim()) return showToast('Geçersiz tetikleyici.', 'error');
    if (newTrigger.length > 5) return showToast('Tetikleyici en fazla 5 karakter olabilir.', 'error');
    const updatedProject = { ...project, settings: { ...project.settings, variableTrigger: newTrigger } };
    setProject(updatedProject);
    try {
      const token = localStorage.getItem('user_token');
      await axios.put(`${API_BASE_URL}/projects/${id}`, updatedProject, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Tetikleyici güncellendi.'); setIsEditingTrigger(false);
      if (!['{{', '[', '{', '@', '$'].includes(newTrigger)) setIsTriggerCustom(true);
    } catch { /* silent */ }
  };

  const handleTextareaInput = (e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; };

  const publicLink = `${window.location.origin}/f/${project?._id}`;
  const copyToClipboard = () => { navigator.clipboard.writeText(publicLink); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); };

  if (loading) return <div className={styles.loadingContainer}><Loader2 size={28} className={styles.spinner} /><p>Belge Detayları Yükleniyor...</p></div>;

  if (!project) return (
    <div className={styles.root}>
      <div className={styles.emptyDocuments} style={{ marginTop: '10vh' }}>
        <AlertTriangle size={56} color="#dc2626" style={{ marginBottom: 16 }} />
        <h2 style={{ color: '#1c1917', margin: '0 0 8px 0', fontSize: '1.4rem' }}>Belge Bulunamadı</h2>
        <p style={{ color: '#57534e', marginBottom: 24 }}>Bu belge silinmiş veya erişim izniniz bulunmuyor.</p>
        <Link to="/panel/projects" className={styles.backHomeBtn} style={{ textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Belgelerime Dön
        </Link>
      </div>
    </div>
  );

  const currentTrigger = project?.settings?.variableTrigger || '{{';
  const getTriggerSymbols = (t) => { if (t === '[') return { s: '[', e: ']' }; if (t === '{') return { s: '{', e: '}' }; if (t === '{{') return { s: '{{', e: '}}' }; return { s: t, e: '' }; };
  const currentSym = getTriggerSymbols(currentTrigger);
  const varEntries = Object.entries(variables);

  const isAuthoringMode = project?.category === 'authoring';

  return (
    <div className={styles.root}>
      {toast.show && <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}><CheckCircle2 size={20} /> {toast.message}</div>}

      {/* PAYLAŞIM MODALI */}
      {isShareModalOpen && (
        <div className={styles.modalOverlay} onMouseDown={() => setIsShareModalOpen(false)}>
          <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2><div className={styles.modalIcon}><LinkIcon size={22} color="#2563eb" /></div> Genel Bağlantı</h2>
              <button onClick={() => setIsShareModalOpen(false)} className={styles.modalClose}><X size={20} /></button>
            </div>
            <div className={styles.linkGenerated}>
              <p className={styles.modalDescText}>Bu bağlantıyı gönderdiğiniz kişiler, belge üzerindeki değişkenleri kendi bilgilerine göre doldurup anında PDF çıktısı alabilirler. Girilen veriler sistemimizde saklanmaz.</p>
              <div className={styles.linkCopyBox}>
                <input type="text" readOnly value={publicLink} />
                <button onClick={copyToClipboard} className={isCopied ? styles.copiedBtn : ''}>
                  {isCopied ? <CheckCircle2 size={16} /> : <Copy size={16} />} {isCopied ? 'Kopyalandı' : 'Kopyala'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SİLME MODALLARI */}
      {deleteVarTarget && (
        <div className={styles.modalOverlay} onMouseDown={() => setDeleteVarTarget(null)}>
          <div className={styles.modalSmall} onMouseDown={e => e.stopPropagation()}>
            <div className={styles.modalIconBox}><Trash2 size={24} color="#dc2626" /></div>
            <h2>Değişkeni Sil</h2><p><code>{deleteVarTarget}</code> adlı değişkeni kalıcı olarak silmek istediğinize emin misiniz?</p>
            <div className={styles.modalActions}><button onClick={() => setDeleteVarTarget(null)} className={styles.secondaryBtn}>Vazgeç</button><button onClick={confirmDeleteVariable} className={styles.dangerBtn}>Kalıcı Olarak Sil</button></div>
          </div>
        </div>
      )}

      {deleteSectionTarget && (
        <div className={styles.modalOverlay} onMouseDown={() => setDeleteSectionTarget(null)}>
          <div className={styles.modalSmall} onMouseDown={e => e.stopPropagation()}>
            <div className={styles.modalIconBox}><AlertTriangle size={24} color="#dc2626" /></div>
            <h2>Bölümü Sil</h2><p>Bu bölümü ve içindeki tüm içeriği kalıcı olarak silmek istediğinize emin misiniz?</p>
            <div className={styles.modalActions}><button onClick={() => setDeleteSectionTarget(null)} className={styles.secondaryBtn}>Vazgeç</button><button onClick={confirmDeleteSection} className={styles.dangerBtn}>Evet, Sil</button></div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className={styles.pageHeader}>
        <Link to="/panel/projects" className={styles.backLink}><ArrowLeft size={16} /> Belgelerim</Link>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.titleRow}>
              <div className={styles.projectNameWrapper} onDoubleClick={() => setEditingProjectName(true)}>
                <div className={styles.titleIconBox}>
                  {isAuthoringMode ? <BookOpen size={24} color="#8b5cf6" /> : <LayoutTemplate size={24} color="#2563eb" />}
                </div>
                {editingProjectName ? (
                  <input autoFocus onFocus={e => e.target.select()} defaultValue={project.name} onBlur={e => { syncProjectDetails({ name: e.target.value }); setEditingProjectName(false); }} onKeyDown={e => { if (e.key === 'Enter') { syncProjectDetails({ name: e.target.value }); setEditingProjectName(false); } if (e.key === 'Escape') setEditingProjectName(false); }} className={styles.projectNameInput} />
                ) : (<h1>{project.name}</h1>)}
                <button onClick={() => setEditingProjectName(true)} className={styles.editTitleBtn}><Edit2 size={16} /></button>
              </div>
            </div>
            <div className={styles.descWrapper} onDoubleClick={() => setEditingProjectDesc(true)}>
              {editingProjectDesc ? (
                <textarea autoFocus onFocus={e => { e.target.select(); handleTextareaInput(e); }} onInput={handleTextareaInput} defaultValue={project.description} onBlur={e => { syncProjectDetails({ description: e.target.value }); setEditingProjectDesc(false); }} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); syncProjectDetails({ description: e.target.value }); setEditingProjectDesc(false); } if (e.key === 'Escape') setEditingProjectDesc(false); }} className={styles.projectDescInput} />
              ) : (<p>{project.description || <em>Bir açıklama veya not eklemek için çift tıklayın...</em>}</p>)}
              {!editingProjectDesc && <button onClick={() => setEditingProjectDesc(true)} className={styles.editDescBtn}><Edit2 size={14} /></button>}
            </div>
          </div>
          <button onClick={() => setIsShareModalOpen(true)} className={styles.dispatchBtn}><LinkIcon size={18} /> Genel Bağlantı</button>
        </div>
      </div>

      <div className={styles.mainGrid} style={{ gridTemplateColumns: isAuthoringMode ? '2fr 1fr' : '1fr' }}>

        {/* SOL KOLON */}
        <div className={styles.leftColumn}>
          {isAuthoringMode ? (
            /* ─── ODAK MODU: BÖLÜMLER LİSTESİ ─── */
            <div className={styles.documentsPanel}>
              <div className={styles.documentsHeader}>
                <div>
                  <h2>Bölümler & Sayfalar</h2>
                  <p className={styles.documentsSubtext}>Uzun metinlerinizi alt bölümlere ayırarak daha kolay yönetin.</p>
                </div>
                <button onClick={handleCreateDocument} className={styles.addDocBtn}><Plus size={16} /> Yeni Bölüm</button>
              </div>
              <div className={styles.documentsList}>
                {documents.length === 0 ? (
                  <div className={styles.emptyDocuments}>
                    <div className={styles.emptyIconCircle}><FileText size={32} color="#a8a29e" /></div>
                    <p>Bu çalışmada henüz bir içerik yok.</p>
                    <button onClick={handleCreateDocument} className={styles.addDocBtn} style={{ margin: '0 auto' }}>İlk Bölümü Oluştur</button>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={documents.map(d => d._id)} strategy={verticalListSortingStrategy}>
                      <div className={styles.docsSortableList}>
                        {documents.map(doc => <SortableDocumentRow key={doc._id} doc={doc} editingId={editingDocId} onEdit={setEditingDocId} onDelete={setDeleteSectionTarget} onRename={handleRenameDocument} navigate={navigate} />)}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          ) : (
            /* ─── ŞABLON MODU: TEKİL TASARIMCI KARTI ─── */
            <div className={styles.templateOverviewPanel}>
              <div className={styles.templateOverviewHero}>
                <div className={styles.templateHeroIcon}>
                  <LayoutTemplate size={40} color="#2563eb" />
                </div>
                <h2>Şablon Tasarımcısı</h2>
                <p>Form alanlarınızı tanımlamak, soru kurallarını belirlemek ve şablon metnini yapılandırmak için tasarımcı arayüzünü başlatın.</p>

                {documents.length === 0 ? (
                  <button onClick={handleCreateAndOpenTemplate} className={styles.largePrimaryBtn}>
                    Tasarımcıyı Başlat
                  </button>
                ) : (
                  <button onClick={() => navigate(`/panel/duzenle/${documents[0]._id}`)} className={styles.largePrimaryBtn}>
                    <Edit2 size={18} /> Tasarımcıyı Aç
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SAĞ KOLON (Değişkenler - Sadece Authoring) */}
        {isAuthoringMode && (
          <div className={styles.rightSidebar}>

            <div className={styles.triggerPanel}>
              <div className={styles.triggerPanelHeader}>
                <div className={styles.triggerIcon}><Zap size={18} color="#8b5cf6" /></div>
                <div><h3>Değişken Formatı</h3><p>Tetikleyici sembol seçimi</p></div>
              </div>
              <div className={styles.triggerPanelContent}>
                {isTriggerCustom && !isEditingTrigger ? (
                  <div className={styles.triggerCustomView}>
                    <p>Mevcut Tetikleyici:</p>
                    <div className={styles.triggerValue}>{currentTrigger}</div>
                    <button onClick={() => setIsEditingTrigger(true)}>Değiştir</button>
                  </div>
                ) : (
                  <>
                    <select value={isTriggerCustom ? 'custom' : currentTrigger} onChange={e => { if (e.target.value === 'custom') { setIsTriggerCustom(true); setCustomTriggerInput(''); } else { setIsTriggerCustom(false); handleTriggerChange(e.target.value); } }} className={styles.triggerSelect}>
                      <option value="{{">{`{{değişken}} — Çift Süslü`}</option>
                      <option value="[">{`[değişken] — Köşeli`}</option>
                      <option value="{">{`{değişken} — Tek Süslü`}</option>
                      <option value="<<">{`<<değişken>> — Çift Ok`}</option>
                      <option value="custom">✏️ Özel karakter...</option>
                    </select>
                    {isTriggerCustom && (<div className={styles.triggerCustomInput}><input type="text" maxLength={5} value={customTriggerInput} onChange={e => setCustomTriggerInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && customTriggerInput) handleTriggerChange(customTriggerInput); }} placeholder="Örn: ///" /><button onClick={() => { if (customTriggerInput) handleTriggerChange(customTriggerInput); }}>Kaydet</button></div>)}
                    {isEditingTrigger && <button onClick={() => setIsEditingTrigger(false)} className={styles.triggerCancel}>Vazgeç</button>}
                  </>
                )}
              </div>
            </div>

            <div className={styles.variablesPanel}>
              <div className={styles.variablesHeader}>
                <h2><Variable size={18} color="#f59e0b" /> Değişken Kütüphanesi</h2>
                <div>{syncStatus === 'saving' && <Loader2 size={14} className={styles.spinner} />}{syncStatus === 'saved' && <CheckCircle2 size={14} color="#10b981" />}</div>
              </div>
              <div className={styles.variablesList}>
                {varEntries.length === 0 && <p className={styles.emptyVars}>Bu belge için henüz bir değişken kaydedilmedi.</p>}
                {varEntries.map(([key, value]) => (
                  <div key={key} className={styles.varCard}>
                    <div className={styles.varKeyRow}>
                      <Key size={12} color="#a8a29e" />
                      {editingKeyFor === key ? (
                        <input autoFocus onFocus={e => e.target.select()} value={editKeyTemp} onChange={e => setEditKeyTemp(e.target.value)} onBlur={() => handleRenameVariableKey(key, editKeyTemp)} onKeyDown={e => { if (e.key === 'Enter') handleRenameVariableKey(key, editKeyTemp); if (e.key === 'Escape') setEditingKeyFor(null); }} className={styles.varKeyInput} />
                      ) : (<span className={styles.varKeyName}>{`${currentSym.s}${key}${currentSym.e}`}</span>)}
                      <div className={styles.varActionGroup}>
                        <button onClick={() => { setEditingKeyFor(key); setEditKeyTemp(key); }} className={styles.varEditBtn}><Edit2 size={12} /></button>
                        <button onClick={() => setDeleteVarTarget(key)} className={styles.varDeleteBtn}><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <div className={styles.varValueRow}>
                      {editingVarKey === key ? (
                        <input autoFocus onFocus={e => e.target.select()} value={editVarTempValue} onChange={e => setEditVarTempValue(e.target.value)} onBlur={() => handleEditVariableValue(key, editVarTempValue)} onKeyDown={e => { if (e.key === 'Enter') handleEditVariableValue(key, editVarTempValue); if (e.key === 'Escape') setEditingVarKey(null); }} className={styles.varValueInput} />
                      ) : (<span onDoubleClick={() => { setEditingVarKey(key); setEditVarTempValue(value); }} className={styles.varValue}>{value}</span>)}
                      <button onClick={() => { setEditingVarKey(key); setEditVarTempValue(value); }} className={styles.varEditBtn}><Edit2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.addVarForm}>
                <h4>Yeni Değişken Tanımla</h4>
                <input type="text" placeholder="Anahtar (Örn: yazar_adi)" value={newVarKey} onChange={e => setNewVarKey(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddVariable(); }} />
                <input type="text" placeholder="Varsayılan Değer (Örn: Mehmet)" value={newVarValue} onChange={e => setNewVarValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddVariable(); }} />
                <button onClick={handleAddVariable} disabled={!newVarKey || !newVarValue} className={styles.addVarBtn}>Kütüphaneye Ekle</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};