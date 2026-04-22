// frontend/src/pages/ProjectDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Edit2, CheckCircle2, Loader2, Link as LinkIcon, Copy, X, AlertTriangle, LayoutTemplate
} from 'lucide-react';
import styles from './ProjectDetail.module.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [documents, setDocuments] = useState([]); // Template document ref
  const [loading, setLoading] = useState(true);

  const [editingProjectName, setEditingProjectName] = useState(false);
  const [editingProjectDesc, setEditingProjectDesc] = useState(false);

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

  const syncProjectDetails = async (updates) => {
    try {
      const token = localStorage.getItem('user_token');
      const updatedProject = { ...project, ...updates };
      setProject(updatedProject);
      await axios.put(`${API_BASE_URL}/projects/${id}`, updatedProject, { headers: { Authorization: `Bearer ${token}` } });
    } catch { showToast('Proje güncellenemedi.', 'error'); }
  };

  const handleTextareaInput = (e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; };

  const publicLink = `${window.location.origin}/f/${project?._id}`;
  const copyToClipboard = () => { navigator.clipboard.writeText(publicLink); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); };

  if (loading) return <div className={styles.loadingContainer}><Loader2 size={28} className={styles.spinner} /><p>Şablon Detayları Yükleniyor...</p></div>;

  if (!project) return (
    <div className={styles.root}>
      <div className={styles.emptyDocuments} style={{ marginTop: '10vh' }}>
        <AlertTriangle size={56} color="#dc2626" style={{ marginBottom: 16 }} />
        <h2 style={{ color: '#1c1917', margin: '0 0 8px 0', fontSize: '1.4rem' }}>Şablon Bulunamadı</h2>
        <p style={{ color: '#57534e', marginBottom: 24 }}>Bu şablon silinmiş veya erişim izniniz bulunmuyor.</p>
        <Link to="/panel/projects" className={styles.backHomeBtn} style={{ textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Şablonlarıma Dön
        </Link>
      </div>
    </div>
  );

  return (
    <div className={styles.root}>
      {toast.show && <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}><CheckCircle2 size={20} /> {toast.message}</div>}

      {isShareModalOpen && (
        <div className={styles.modalOverlay} onMouseDown={() => setIsShareModalOpen(false)}>
          <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2><div className={styles.modalIcon}><LinkIcon size={22} color="#2563eb" /></div> Genel Bağlantı</h2>
              <button onClick={() => setIsShareModalOpen(false)} className={styles.modalClose}><X size={20} /></button>
            </div>
            <div className={styles.linkGenerated}>
              <p className={styles.modalDescText}>Bu bağlantıyı gönderdiğiniz kişiler, form alanlarını kendi bilgilerine göre doldurup anında PDF çıktısı alabilirler.</p>
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

      <div className={styles.pageHeader}>
        <Link to="/panel/projects" className={styles.backLink}><ArrowLeft size={16} /> Tüm Şablonlar</Link>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.titleRow}>
              <div className={styles.projectNameWrapper} onDoubleClick={() => setEditingProjectName(true)}>
                <div className={styles.titleIconBox}>
                  <LayoutTemplate size={24} color="#2563eb" />
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
              ) : (<p>{project.description || <em>Bir açıklama eklemek için çift tıklayın...</em>}</p>)}
              {!editingProjectDesc && <button onClick={() => setEditingProjectDesc(true)} className={styles.editDescBtn}><Edit2 size={14} /></button>}
            </div>
          </div>
          <button onClick={() => setIsShareModalOpen(true)} className={styles.dispatchBtn}><LinkIcon size={18} /> Genel Bağlantı</button>
        </div>
      </div>

      <div className={styles.mainGrid} style={{ gridTemplateColumns: '1fr' }}>
        <div className={styles.templateOverviewPanel}>
          <div className={styles.templateOverviewHero}>
            <div className={styles.templateHeroIcon}>
              <LayoutTemplate size={40} color="#2563eb" />
            </div>
            <h2>Şablon Tasarımcısı</h2>
            <p>Form alanlarınızı tanımlamak ve şablon metnini yapılandırmak için tasarımcı arayüzünü başlatın.</p>

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
      </div>
    </div>
  );
};