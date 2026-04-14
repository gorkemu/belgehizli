// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  FolderKanban, ArrowRight, FileText, Plus,
  Edit3, Trash2, AlertTriangle, CheckCircle2, Loader2, BookOpen, LayoutTemplate, MoreHorizontal
} from 'lucide-react';
import styles from './Dashboard.module.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [stats, setStats] = useState({ projectCount: 0 });
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [rowMenuOpen, setRowMenuOpen] = useState(null);
  const [deleteProjectTarget, setDeleteProjectTarget] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('user_token');
      const timestamp = new Date().getTime();
      const projectsRes = await axios.get(`${API_BASE_URL}/projects/my-projects?t=${timestamp}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const projects = projectsRes.data;

      setStats({ projectCount: projects.length });
      setRecentProjects(projects.slice(0, 5));
    } catch (error) {
      console.error("Dashboard verileri alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const onFocus = () => fetchDashboardData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => {
    const close = () => setRowMenuOpen(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleDeleteProject = async () => {
    try {
      const token = localStorage.getItem('user_token');
      await axios.delete(`${API_BASE_URL}/projects/${deleteProjectTarget}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentProjects(prev => prev.filter(p => p._id !== deleteProjectTarget));
      setStats(s => ({ projectCount: s.projectCount - 1 }));
      setDeleteProjectTarget(null);
      showToast('Belge kalıcı olarak silindi.');
    } catch {
      showToast('Belge silinirken bir hata oluştu.', 'error');
    }
  };

  const handleRenameProject = async (projectId) => {
    if (!editingProjectName.trim()) return setEditingProjectId(null);
    try {
      const token = localStorage.getItem('user_token');
      await axios.put(`${API_BASE_URL}/projects/${projectId}`, { name: editingProjectName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentProjects(prev => prev.map(p => p._id === projectId ? { ...p, name: editingProjectName } : p));
      setEditingProjectId(null);
      showToast('Belge adı güncellendi.');
    } catch {
      showToast('İsim değiştirilemedi.', 'error');
    }
  };

  if (loading) return (
    <div className={styles.loadingContainer}>
      <Loader2 size={24} className={styles.spinner} />
      <p className={styles.loadingText}>Çalışma alanınız hazırlanıyor...</p>
    </div>
  );

  return (
    <div className={styles.root}>

      {toast.show && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          <CheckCircle2 size={18} /> {toast.message}
        </div>
      )}

      {deleteProjectTarget && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIconBox}>
              <AlertTriangle size={24} color="#dc2626" />
            </div>
            <h2 className={styles.modalTitle}>Belgeyi Sil</h2>
            <p className={styles.modalText}>
              Bu belgeyi ve içerdiği tüm verileri kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className={styles.modalActions}>
              <button onClick={() => setDeleteProjectTarget(null)} className={styles.cancelModalBtn}>Vazgeç</button>
              <button onClick={handleDeleteProject} className={styles.confirmDeleteBtn}>Kalıcı Olarak Sil</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.heroSection}>
        <div className={styles.heroTextContainer}>
          <h1 className={styles.greeting}>
            Çalışma alanınıza hoş geldiniz, {user?.fullName?.split(' ')[0]}.
          </h1>
          <p className={styles.subtitle}>
            Yeni bir belge oluşturun veya son düzenlediğiniz çalışmalara hızla geri dönün.
          </p>
        </div>

        <div className={styles.heroCardsRow}>
          <button onClick={() => navigate('/panel/projects')} className={styles.heroCardPrimary}>
            <div className={styles.heroCardIconPrimary}>
              <Plus size={24} color="#ffffff" />
            </div>
            <div className={styles.heroCardContent}>
              <h3>Yeni Belge Oluştur</h3>
              <p>Boş bir sayfadan veya form modundan başlayın.</p>
            </div>
          </button>

          <button onClick={() => navigate('/sablonlar')} className={styles.heroCardSecondary}>
            <div className={styles.heroCardIconSecondary}>
              <BookOpen size={24} color="#1c1917" />
            </div>
            <div className={styles.heroCardContent}>
              <h3>Açık Kütüphane</h3>
              <p>Hazır şablonları keşfedin ve anında kullanın.</p>
            </div>
          </button>
        </div>
      </div>

      <div className={styles.projectsSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            Son Düzenlenenler
          </h3>
          <Link to="/panel/projects" className={styles.viewAllLink}>
            Tümünü Gör <ArrowRight size={14} />
          </Link>
        </div>

        <div className={styles.projectList}>
          {recentProjects.length === 0 ? (
            <div className={styles.emptyProjects}>
              <div className={styles.emptyIcon}><FolderKanban size={28} color="#a8a29e" /></div>
              <p>Henüz bir belgeniz bulunmuyor. Yeni bir belge oluşturarak başlayın.</p>
            </div>
          ) : (
            recentProjects.map(project => (
              <div key={project._id} className={styles.projectRow}>
                <div className={styles.projectInfo} onClick={() => navigate(`/panel/projects/${project._id}`)}>
                  <div className={styles.projectIconWrapper}>
                    {project.category === 'form_builder' ? <LayoutTemplate size={18} color="#57534e" /> : <FileText size={18} color="#57534e" />}
                  </div>
                  <div className={styles.projectTextData}>
                    {editingProjectId === project._id ? (
                      <input
                        autoFocus
                        value={editingProjectName}
                        onChange={e => setEditingProjectName(e.target.value)}
                        onBlur={() => handleRenameProject(project._id)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRenameProject(project._id); if (e.key === 'Escape') setEditingProjectId(null); }}
                        className={styles.editInput}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <h4 className={styles.projectName}>{project.name}</h4>
                    )}
                    <span className={styles.projectDate}>
                      {new Date(project.updatedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className={styles.projectMenu}>
                  <button
                    onClick={e => { e.stopPropagation(); setRowMenuOpen(rowMenuOpen === project._id ? null : project._id); }}
                    className={styles.menuTrigger}
                    title="Seçenekler"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {rowMenuOpen === project._id && (
                    <div className={styles.menuDropdown} onClick={e => e.stopPropagation()}>
                      <button onClick={() => { navigate(`/panel/projects/${project._id}`); setRowMenuOpen(null); }} className={styles.menuItem}>
                        <Edit3 size={14} /> Düzenlemeye Devam Et
                      </button>
                      <button onClick={() => { setEditingProjectId(project._id); setEditingProjectName(project.name); setRowMenuOpen(null); }} className={styles.menuItem}>
                        <FolderKanban size={14} /> Yeniden Adlandır
                      </button>
                      <div className={styles.menuDivider}></div>
                      <button onClick={() => { setDeleteProjectTarget(project._id); setRowMenuOpen(null); }} className={`${styles.menuItem} ${styles.menuItemDanger}`}>
                        <Trash2 size={14} /> Kalıcı Olarak Sil
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;