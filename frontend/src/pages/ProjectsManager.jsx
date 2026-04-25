// frontend/src/pages/ProjectsManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Calendar, Trash2, AlertTriangle, Loader2, CheckCircle2, LayoutTemplate } from 'lucide-react';
import styles from './ProjectsManager.module.css';
import Button from '../components/ui/Button';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const ProjectsManager = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const [docToDelete, setDocToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    fetchDocuments();
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
      const token = localStorage.getItem('user_token');
      const timestamp = new Date().getTime();
      const response = await axios.get(`${API_BASE_URL}/projects/my-projects?t=${timestamp}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data);
    } catch (err) {
      setError('Belgeler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('user_token');
      const payload = {
        name: formData.name,
        description: formData.description,
        category: 'form_builder',
        settings: { mode: 'FREE' }
      };

      const response = await axios.post(`${API_BASE_URL}/projects/create`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsModalOpen(false);
      setFormData({ name: '', description: '' });
      showToast('Şablon başarıyla oluşturuldu.');
      navigate(`/panel/duzenle/${response.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Oluşturulurken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('user_token');
      await axios.delete(`${API_BASE_URL}/projects/${docToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(documents.filter(p => p._id !== docToDelete._id));
      setDocToDelete(null);
      showToast('Şablon kalıcı olarak silindi.');
    } catch (err) {
      showToast('Silinirken bir hata oluştu.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.root}>
      {toast.show && <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}><CheckCircle2 size={18} /> {toast.message}</div>}

      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.pageTitle}>Tüm Şablonlar</h1>
          <p className={styles.pageSubtitle}>Sözleşme ve form şablonlarınızı tek bir yerden yönetin.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus size={18} />}
        >
          Yeni Şablon
        </Button>
      </div>

      {loading ? (
        <div className={styles.loadingState}><Loader2 size={24} className={styles.spinnerIcon} /><p>Şablonlarınız yükleniyor...</p></div>
      ) : documents.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconBox}><LayoutTemplate size={32} color="#a8a29e" /></div>
          <h3 className={styles.emptyTitle}>Henüz bir şablonunuz yok</h3>
          <p className={styles.emptyText}>Hemen yeni bir akıllı form şablonu oluşturarak çalışmaya başlayın.</p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsModalOpen(true)}
          >
            İlk Şablonunuzu Oluşturun
          </Button>
        </div>
      ) : (
        <div className={styles.projectGrid}>
          {documents.map(doc => (
            <div key={doc._id} onClick={() => navigate(`/panel/duzenle/${doc._id}`)} className={styles.projectCard}>
              <div className={styles.cardHeader}>
                <div className={styles.categoryIcon}><LayoutTemplate size={18} color="#57534e" /></div>
                <button onClick={(e) => { e.stopPropagation(); setDocToDelete(doc); }} className={styles.deleteButton} title="Sil"><Trash2 size={16} /></button>
              </div>
              <h3 className={styles.projectName}>{doc.name}</h3>
              <p className={styles.projectDesc}>{doc.description || 'Açıklama girilmemiş.'}</p>
              <div className={styles.cardFooter}>
                <span className={styles.projectDate}><Calendar size={12} /> {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString('tr-TR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay} onMouseDown={() => setIsModalOpen(false)}>
          <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Yeni Şablon Oluştur</h2>
              <button onClick={() => setIsModalOpen(false)} className={styles.modalClose}><X size={20} /></button>
            </div>
            {error && <div className={styles.modalError}><AlertTriangle size={16} /> {error}</div>}
            <form onSubmit={handleCreateDocument} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Şablon Adı *</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Örn: İş Sözleşmesi" className={styles.formInput} autoFocus />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Açıklama (Opsiyonel)</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Bu şablon ne hakkında?" className={styles.formTextarea} />
              </div>
              <div className={styles.modalActions}>
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: '1' }}
                >
                  Vazgeç
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  style={{ flex: '1' }}
                >
                  {isSubmitting ? 'Oluşturuluyor...' : 'Oluştur ve Başla'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {docToDelete && (
        <div className={styles.modalOverlay} onMouseDown={() => setDocToDelete(null)}>
          <div className={styles.confirmModal} onMouseDown={e => e.stopPropagation()}>
            <div className={styles.confirmIcon}><AlertTriangle size={24} color="#dc2626" /></div>
            <h2 className={styles.confirmTitle}>Şablonu Sil</h2>
            <p className={styles.confirmText}><strong>"{docToDelete.name}"</strong> adlı şablonu silmek istediğinize emin misiniz?</p>
            <div className={styles.confirmActions}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDocToDelete(null)}
                style={{ flex: '1' }}
              >
                Vazgeç
              </Button>
              <Button
                type="submit"
                variant="danger"
                onClick={handleDeleteDocument}
                disabled={isDeleting}
                style={{ flex: '1' }}
              >
                {isDeleting ? 'Siliniyor...' : 'Kalıcı Olarak Sil'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};