// frontend/src/pages/ProjectsManager.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; 
import api from '../utils/api'; 
import { Plus, X, Calendar, Trash2, AlertTriangle, Loader2, CheckCircle2, LayoutTemplate, MoreHorizontal, Edit3 } from 'lucide-react';
import styles from './ProjectsManager.module.css';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useTranslation } from 'react-i18next';
import { getUserFriendlyMessage } from '../utils/getUserFriendlyMessage';
import { SEOHead } from '../components/SEOHead'; 

export const ProjectsManager = () => {
  const { t, i18n } = useTranslation();
  const { lang } = useParams(); 
  const currentLang = lang || 'tr';
  const navigate = useNavigate();

  const editRoute = currentLang === 'tr' ? 'panel/duzenle' : 'dashboard/edit';

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editTargetId, setEditTargetId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });

  // Delete Modal & Menu
  const [docToDelete, setDocToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rowMenuOpen, setRowMenuOpen] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    const close = () => setRowMenuOpen(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  useEffect(() => {
    const handleNewDocEvent = () => setIsModalOpen(true);
    window.addEventListener('open-new-doc-modal', handleNewDocEvent);
    window.addEventListener('open-new-template-modal', handleNewDocEvent);

    return () => {
      window.removeEventListener('open-new-doc-modal', handleNewDocEvent);
      window.removeEventListener('open-new-template-modal', handleNewDocEvent);
    };
  }, []);

  const fetchDocuments = async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await api.get(`/projects/my-projects?t=${timestamp}`);
      setDocuments(response.data);
    } catch (err) {
      setError(getUserFriendlyMessage(err.response?.data, 'projects.errorLoading', t));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        category: 'form_builder',
        settings: { mode: 'FREE' }
      };

      const response = await api.post(`/projects/create`, payload);

      setIsModalOpen(false);
      setFormData({ name: '', description: '' });
      showToast(t('projects.successCreated'));
      navigate(`/${currentLang}/${editRoute}/${response.data._id}`);
    } catch (err) {
      setError(getUserFriendlyMessage(err.response?.data, 'projects.errorCreating', t));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (doc) => {
    setEditTargetId(doc._id);
    setEditFormData({ name: doc.name, description: doc.description || '' });
    setIsEditModalOpen(true);
    setRowMenuOpen(null);
  };

  const handleEditDocument = async (e) => {
    e.preventDefault();
    setIsEditSubmitting(true);
    setError('');

    try {
      await api.put(`/projects/${editTargetId}`, { name: editFormData.name, description: editFormData.description });
      setDocuments(prev => prev.map(doc => doc._id === editTargetId ? { ...doc, name: editFormData.name, description: editFormData.description } : doc));
      setIsEditModalOpen(false);
      showToast(t('projects.toastEdited'));
    } catch (err) {
      setError(getUserFriendlyMessage(err.response?.data, 'projects.errorEditing', t));
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/projects/${docToDelete._id}`);
      setDocuments(documents.filter(p => p._id !== docToDelete._id));
      setDocToDelete(null);
      showToast(t('projects.toastDeleted'));
    } catch (err) {
      showToast(getUserFriendlyMessage(err.response?.data, 'projects.toastDeleteError', t), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    const locale = i18n.language.startsWith('tr') ? 'tr-TR' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale);
  };

  return (
    <div className={styles.root}>
      <SEOHead titleKey="projects.title" descKey="projects.subtitle" />

      {toast.show && <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}><CheckCircle2 size={18} /> {toast.message}</div>}

      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.pageTitle}>{t('projects.title')}</h1>
          <p className={styles.pageSubtitle}>{t('projects.subtitle')}</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)} leftIcon={<Plus size={18} />}>
          {t('projects.newTemplate')}
        </Button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <Loader2 size={24} className={styles.spinnerIcon} />
          <p>{t('projects.loading')}</p>
        </div>
      ) : documents.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconBox}><LayoutTemplate size={32} color="#a8a29e" /></div>
          <h3 className={styles.emptyTitle}>{t('projects.emptyTitle')}</h3>
          <p className={styles.emptyText}>{t('projects.emptyText')}</p>
          <Button variant="primary" size="lg" onClick={() => setIsModalOpen(true)}>
            {t('projects.createFirst')}
          </Button>
        </div>
      ) : (
        <div className={styles.projectGrid}>
          {documents.map(doc => (
            <div key={doc._id} onClick={() => navigate(`/${currentLang}/${editRoute}/${doc._id}`)} className={styles.projectCard}>
              <div className={styles.cardHeader}>
                <div className={styles.categoryIcon}><LayoutTemplate size={18} color="#57534e" /></div>
                
                {/* 3 Noktalı Menü */}
                <div className={styles.projectMenu}>
                  <button onClick={e => { e.stopPropagation(); setRowMenuOpen(rowMenuOpen === doc._id ? null : doc._id); }} className={styles.menuTrigger}>
                    <MoreHorizontal size={18} />
                  </button>
                  {rowMenuOpen === doc._id && (
                    <div className={styles.menuDropdown} onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEditModal(doc)} className={styles.menuItem}>
                        <Edit3 size={14} /> {t('projects.edit')}
                      </button>
                      <div className={styles.menuDivider}></div>
                      <button onClick={() => { setDocToDelete(doc); setRowMenuOpen(null); }} className={`${styles.menuItem} ${styles.menuItemDanger}`}>
                        <Trash2 size={14} /> {t('projects.deleteTooltip')}
                      </button>
                    </div>
                  )}
                </div>

              </div>
              <h3 className={styles.projectName}>{doc.name}</h3>
              <p className={styles.projectDesc}>{doc.description || t('projects.noDescription')}</p>
              <div className={styles.cardFooter}>
                <span className={styles.projectDate}><Calendar size={12} /> {formatDate(doc.updatedAt || doc.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onMouseDown={() => setIsModalOpen(false)}>
          <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{t('projects.modalCreateTitle')}</h2>
              <button onClick={() => setIsModalOpen(false)} className={styles.modalClose}><X size={20} /></button>
            </div>
            {error && <div className={styles.modalError}><AlertTriangle size={16} /> {error}</div>}
            <form onSubmit={handleCreateDocument} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{t('projects.templateName')}</label>
                <Input
                  type="text"
                  required
                  placeholder={t('projects.templateNamePlaceholder')}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{t('projects.description')}</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder={t('projects.descriptionPlaceholder')} className={styles.formTextarea} />
              </div>
              <div className={styles.modalActions}>
                <Button type="button" variant="secondary" size="lg" onClick={() => setIsModalOpen(false)} style={{ flex: '1' }}>
                  {t('projects.cancel')}
                </Button>
                <Button type="submit" variant="primary" size="lg" disabled={isSubmitting} style={{ flex: '1' }}>
                  {isSubmitting ? t('projects.creating') : t('projects.createAndStart')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className={styles.modalOverlay} onMouseDown={() => setIsEditModalOpen(false)}>
          <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{t('projects.modalEditTitle')}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className={styles.modalClose}><X size={20} /></button>
            </div>
            {error && <div className={styles.modalError}><AlertTriangle size={16} /> {error}</div>}
            <form onSubmit={handleEditDocument} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{t('projects.templateName')}</label>
                <Input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{t('projects.description')}</label>
                <textarea value={editFormData.description} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} className={styles.formTextarea} />
              </div>
              <div className={styles.modalActions}>
                <Button type="button" variant="secondary" size="lg" onClick={() => setIsEditModalOpen(false)} style={{ flex: '1' }}>
                  {t('projects.cancel')}
                </Button>
                <Button type="submit" variant="primary" size="lg" disabled={isEditSubmitting} style={{ flex: '1' }}>
                  {isEditSubmitting ? t('projects.saving') : t('projects.saveChanges')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {docToDelete && (
        <div className={styles.modalOverlay} onMouseDown={() => setDocToDelete(null)}>
          <div className={styles.confirmModal} onMouseDown={e => e.stopPropagation()}>
            <div className={styles.confirmIcon}><AlertTriangle size={24} color="#dc2626" /></div>
            <h2 className={styles.confirmTitle}>{t('projects.deleteConfirmTitle')}</h2>
            <p className={styles.confirmText}>{t('projects.deleteConfirmText', { name: docToDelete.name })}</p>
            <div className={styles.confirmActions}>
              <Button type="button" variant="secondary" onClick={() => setDocToDelete(null)} style={{ flex: '1' }}>{t('projects.cancel')}</Button>
              <Button type="submit" variant="danger" onClick={handleDeleteDocument} disabled={isDeleting} style={{ flex: '1' }}>
                {isDeleting ? t('projects.deleting') : t('projects.deleteConfirm')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsManager;