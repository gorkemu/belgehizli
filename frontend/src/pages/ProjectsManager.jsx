// frontend/src/pages/ProjectsManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Plus, X, BookOpen, FileText, Calendar, Trash2,
  AlertTriangle, ChevronRight, Loader2, CheckCircle2, LayoutTemplate
} from 'lucide-react';
import styles from './ProjectsManager.module.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const DOCUMENT_MODES = [
  { id: 'FREE', label: 'Serbest Mod (Genel)', desc: 'Tüm font, renk, tablo ve medya özelliklerine izin verir.' },
  { id: 'ACADEMIC', label: 'Akademik / Makale', desc: 'Resmi fontlar (Times New Roman vb.). Renk ve vurgu kapalıdır.' },
  { id: 'BOOK', label: 'Kitap / E-Kitap', desc: 'Okunabilirliği yüksek kitap fontları. Medya ve tablolar kapalıdır.' },
  { id: 'ARTICLE', label: 'Dergi / Blog Yazısı', desc: 'Modern tipografi ve tüm görsel/medya eklentileri açıktır.' },
  { id: 'TECHNICAL', label: 'Teknik Doküman (Araştırma)', desc: 'Sistem fontları ve kod blokları içerir. Renkli yazılar kapalıdır.' },
  { id: 'LEGAL', label: 'Sözleşme / Hukuki Belge', desc: 'Sadece resmi fontlar ve tablolar açıktır. Medya ve renkler kapalıdır.' }
];

export const ProjectsManager = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'authoring', 
    mode: 'FREE'
  });

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

  // CMD+K KOMUT PALETİ DİNLEYİCİSİ (Event Listeners)
  useEffect(() => {
    const handleNewDocEvent = () => {
      setFormData(prev => ({ ...prev, category: 'authoring', mode: 'FREE' }));
      setIsModalOpen(true);
    };

    const handleNewTemplateEvent = () => {
      setFormData(prev => ({ ...prev, category: 'form_builder' }));
      setIsModalOpen(true);
    };

    window.addEventListener('open-new-doc-modal', handleNewDocEvent);
    window.addEventListener('open-new-template-modal', handleNewTemplateEvent);

    return () => {
      window.removeEventListener('open-new-doc-modal', handleNewDocEvent);
      window.removeEventListener('open-new-template-modal', handleNewTemplateEvent);
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
      console.error("Belgeler alınamadı:", err);
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
        category: formData.category,
        settings: { mode: formData.category === 'authoring' ? formData.mode : 'FREE' }
      };

      const response = await axios.post(`${API_BASE_URL}/projects/create`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsModalOpen(false);
      setFormData({ name: '', description: '', category: 'authoring', mode: 'FREE' });
      showToast('Belge başarıyla oluşturuldu.');
      navigate(`/panel/projects/${response.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Belge oluşturulurken hata oluştu.');
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
      showToast('Belge kalıcı olarak silindi.');
    } catch (err) {
      showToast('Belge silinirken bir hata oluştu.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.root}>

      {/* Toast Bildirimi */}
      {toast.show && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          <CheckCircle2 size={18} /> {toast.message}
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.pageTitle}>
            Tüm Belgeler
          </h1>
          <p className={styles.pageSubtitle}>
            Sözleşme, dilekçe veya rutin belgelerinizi tek bir yerden yönetin ve organize edin.
          </p>
        </div>
        <button onClick={() => {
          setFormData(prev => ({ ...prev, category: 'authoring' }));
          setIsModalOpen(true);
        }} className={styles.addButton}>
          <Plus size={18} /> Yeni Belge
        </button>
      </div>

      {/* Yükleniyor / Boş Durum veya Grid */}
      {loading ? (
        <div className={styles.loadingState}>
          <Loader2 size={24} className={styles.spinnerIcon} />
          <p>Belgeleriniz yükleniyor...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconBox}>
            <FileText size={32} color="#a8a29e" />
          </div>
          <h3 className={styles.emptyTitle}>Henüz bir belgeniz yok</h3>
          <p className={styles.emptyText}>
            Hemen yeni bir metin belgesi veya akıllı form şablonu oluşturarak çalışmaya başlayın.
          </p>
          <button onClick={() => {
            setFormData(prev => ({ ...prev, category: 'authoring' }));
            setIsModalOpen(true);
          }} className={styles.emptyButton}>
            İlk Belgenizi Oluşturun
          </button>
        </div>
      ) : (
        <div className={styles.projectGrid}>
          {documents.map(doc => (
            <div
              key={doc._id}
              onClick={() => navigate(`/panel/projects/${doc._id}`)}
              className={styles.projectCard}
            >
              <div className={styles.cardHeader}>
                <div className={styles.categoryIcon}>
                  {doc.category === 'authoring' ? <BookOpen size={18} color="#57534e" /> : <LayoutTemplate size={18} color="#57534e" />}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setDocToDelete(doc); }}
                  className={styles.deleteButton}
                  title="Belgeyi Sil"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <h3 className={styles.projectName}>{doc.name}</h3>
              <p className={styles.projectDesc}>
                {doc.description || 'Açıklama girilmemiş.'}
              </p>

              <div className={styles.cardFooter}>
                <div className={styles.categoryInfo}>
                  <span className={styles.categoryName}>
                    {doc.category === 'authoring' ? 'Odak Modu (Metin)' : 'Şablon Modu (Form)'}
                  </span>
                  {doc.category === 'authoring' && doc.settings?.mode && (
                    <span className={styles.modeBadge}>
                      <ChevronRight size={12} />
                      {DOCUMENT_MODES.find(m => m.id === doc.settings.mode)?.label || doc.settings.mode}
                    </span>
                  )}
                </div>
                <span className={styles.projectDate}>
                  <Calendar size={12} /> {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString('tr-TR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Yeni Belge Modalı */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onMouseDown={() => setIsModalOpen(false)}>
          <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Yeni Belge Oluştur</h2>
              <button onClick={() => setIsModalOpen(false)} className={styles.modalClose}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className={styles.modalError}>
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleCreateDocument} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Belge veya Şablon Adı *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: Kira Sözleşmesi, Gizlilik Anlaşması (NDA)"
                  className={styles.formInput}
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Açıklama (Opsiyonel)</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Bu belge ne hakkında?"
                  className={styles.formTextarea}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Çalışma Modu Seçimi</label>
                <div className={styles.categoryGrid}>

                  <label className={`${styles.categoryCard} ${formData.category === 'authoring' ? styles.categoryCardActive : ''}`}>
                    <input type="radio" name="category" value="authoring" checked={formData.category === 'authoring'} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                    <div className={styles.categoryIconWrap}>
                      <BookOpen size={24} />
                    </div>
                    <div className={styles.categoryTextWrap}>
                      <span>Odak Modu (Metin Editörü)</span>
                      <small>Sıfırdan veya yapıştırarak belgeler hazırlayın. Dikkat dağıtmayan arayüz.</small>
                    </div>
                  </label>

                  <label className={`${styles.categoryCard} ${formData.category === 'form_builder' ? styles.categoryCardActive : ''}`}>
                    <input type="radio" name="category" value="form_builder" checked={formData.category === 'form_builder'} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                    <div className={styles.categoryIconWrap}>
                      <LayoutTemplate size={24} />
                    </div>
                    <div className={styles.categoryTextWrap}>
                      <span>Şablon Modu (Akıllı Form)</span>
                      <small>Sorular ekleyerek kendi akıllı sözleşme ve anket şablonlarınızı oluşturun.</small>
                    </div>
                  </label>
                </div>
              </div>

              {/* Format Menüsü (Sadece Authoring) */}
              {formData.category === 'authoring' && (
                <div className={styles.modeSelector}>
                  <label className={styles.formLabel}>Belge Formatı & Tasarım Kuralları</label>
                  <select
                    value={formData.mode}
                    onChange={e => setFormData({ ...formData, mode: e.target.value })}
                    className={styles.formSelect}
                  >
                    {DOCUMENT_MODES.map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                  <p className={styles.modeDesc}>
                    {DOCUMENT_MODES.find(m => m.id === formData.mode)?.desc}
                  </p>
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>
                  Vazgeç
                </button>
                <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                  {isSubmitting ? 'Oluşturuluyor...' : 'Oluştur ve Başla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Silme Onay Modalı */}
      {docToDelete && (
        <div className={styles.modalOverlay} onMouseDown={() => setDocToDelete(null)}>
          <div className={styles.confirmModal} onMouseDown={e => e.stopPropagation()}>
            <div className={styles.confirmIcon}>
              <AlertTriangle size={24} color="#dc2626" />
            </div>
            <h2 className={styles.confirmTitle}>Belgeyi Sil</h2>
            <p className={styles.confirmText}>
              <strong>"{docToDelete.name}"</strong> adlı çalışmanızı ve içindeki tüm içeriği silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className={styles.confirmActions}>
              <button onClick={() => setDocToDelete(null)} className={styles.cancelBtn}>
                Vazgeç
              </button>
              <button onClick={handleDeleteDocument} disabled={isDeleting} className={styles.dangerBtn}>
                {isDeleting ? 'Siliniyor...' : 'Kalıcı Olarak Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};