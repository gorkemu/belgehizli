// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom'; 
import api from '../utils/api'; 
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import {
  ArrowRight, Plus, Edit3, Trash2, AlertTriangle, CheckCircle2,
  Loader2, BookOpen, LayoutTemplate, MoreHorizontal, X
} from 'lucide-react';
import styles from './Dashboard.module.css';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { getUserFriendlyMessage } from '../utils/getUserFriendlyMessage';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { lang } = useParams(); 
  const { t, i18n } = useTranslation();

  const currentLang = lang || 'tr'; 

  const [stats, setStats] = useState({ projectCount: 0 });
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Menu & Delete State
  const [rowMenuOpen, setRowMenuOpen] = useState(null);
  const [deleteProjectTarget, setDeleteProjectTarget] = useState(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editTargetId, setEditTargetId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchDashboardData = async () => {
    try {
      const timestamp = new Date().getTime();
      const projectsRes = await api.get(`/projects/my-projects?t=${timestamp}`);
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
      await api.delete(`/projects/${deleteProjectTarget}`);
      setRecentProjects(prev => prev.filter(p => p._id !== deleteProjectTarget));
      setStats(s => ({ projectCount: s.projectCount - 1 }));
      setDeleteProjectTarget(null);
      showToast(t('dashboard.toastDeleted'));
    } catch (err) {
      showToast(getUserFriendlyMessage(err.response?.data, 'dashboard.toastDeleteError', t), 'error');
    }
  };

  const openEditModal = (project) => {
    setEditTargetId(project._id);
    setEditFormData({ name: project.name, description: project.description || '' });
    setIsEditModalOpen(true);
    setRowMenuOpen(null);
  };

  const handleEditProject = async (e) => {
    e.preventDefault();
    setIsEditSubmitting(true);

    try {
      await api.put(`/projects/${editTargetId}`, { name: editFormData.name, description: editFormData.description });
      setRecentProjects(prev => prev.map(p => p._id === editTargetId ? { ...p, name: editFormData.name, description: editFormData.description } : p));
      setIsEditModalOpen(false);
      showToast(t('dashboard.toastEdited'));
    } catch (err) {
      showToast(getUserFriendlyMessage(err.response?.data, 'dashboard.errorEditing', t), 'error');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const locale = i18n.language.startsWith('tr') ? 'tr-TR' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) return (
    <div className={styles.loadingContainer}>
      <Loader2 size={24} className={styles.spinner} />
      <p className={styles.loadingText}>{t('dashboard.loading')}</p>
    </div>
  );

  const projectsRoute = currentLang === 'tr' ? 'panel/projects' : 'dashboard/projects';
  const libraryRoute = currentLang === 'tr' ? 'sablonlar' : 'templates';
  const editRoute = currentLang === 'tr' ? 'panel/duzenle' : 'dashboard/edit';

  return (
    <div className={styles.root}>
      {toast.show && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          <CheckCircle2 size={18} /> {toast.message}
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteProjectTarget && (
        <div className={styles.modalOverlay} onMouseDown={() => setDeleteProjectTarget(null)}>
          <div className={styles.modalCard} onMouseDown={e => e.stopPropagation()}>
            <div className={styles.modalIconBox}><AlertTriangle size={24} color="#dc2626" /></div>
            <h2 className={styles.modalTitle}>{t('dashboard.deleteTitle')}</h2>
            <p className={styles.modalText}>{t('dashboard.deleteConfirmText')}</p>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setDeleteProjectTarget(null)} style={{ flex: 1 }}>
                {t('dashboard.cancel')}
              </Button>
              <Button variant="danger" onClick={handleDeleteProject} style={{ flex: 1 }}>
                {t('dashboard.deletePermanently')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className={styles.modalOverlay} onMouseDown={() => setIsEditModalOpen(false)}>
          <div className={styles.modalCard} style={{ textAlign: 'left' }} onMouseDown={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className={styles.modalTitle} style={{ margin: 0 }}>{t('dashboard.modalEditTitle')}</h2>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleEditProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>{t('dashboard.projectName')}</label>
                <Input type="text" required value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>{t('dashboard.description')}</label>
                <textarea 
                  value={editFormData.description} 
                  onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} 
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: '0.9rem', resize: 'vertical', minHeight: '100px' }} 
                />
              </div>
              <div className={styles.modalActions} style={{ marginTop: '8px' }}>
                <Button type="button" variant="secondary" size="lg" onClick={() => setIsEditModalOpen(false)} style={{ flex: '1' }}>
                  {t('dashboard.cancel')}
                </Button>
                <Button type="submit" variant="primary" size="lg" disabled={isEditSubmitting} style={{ flex: '1' }}>
                  {isEditSubmitting ? t('dashboard.saving') : t('dashboard.saveChanges')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.heroSection}>
        <div className={styles.heroTextContainer}>
          <h1 className={styles.greeting}>{t('dashboard.greeting', { name: user?.fullName?.split(' ')[0] })}</h1>
          <p className={styles.subtitle}>{t('dashboard.subtitle')}</p>
        </div>

        <div className={styles.heroCardsRow}>
          <button onClick={() => navigate(`/${currentLang}/${projectsRoute}`)} className={styles.heroCardPrimary}>
            <div className={styles.heroCardIconPrimary}><Plus size={24} color="var(--bg-app)" /></div>
            <div className={styles.heroCardContent}>
              <h3>{t('dashboard.createNew')}</h3>
              <p>{t('dashboard.createDesc')}</p>
            </div>
          </button>
          <button onClick={() => navigate(`/${currentLang}/${libraryRoute}`)} className={styles.heroCardSecondary}>
            <div className={styles.heroCardIconSecondary}><BookOpen size={24} color="var(--text-primary)" /></div>
            <div className={styles.heroCardContent}>
              <h3>{t('dashboard.library')}</h3>
              <p>{t('dashboard.libraryDesc')}</p>
            </div>
          </button>
        </div>
      </div>

      <div className={styles.projectsSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>{t('dashboard.recentlyEdited')}</h3>
          <Link to={`/${currentLang}/${projectsRoute}`} className={styles.viewAllLink}>{t('dashboard.viewAll')} <ArrowRight size={14} /></Link>
        </div>
        <div className={styles.projectList}>
          {recentProjects.length === 0 ? (
            <div className={styles.emptyProjects}>
              <div className={styles.emptyIcon}><LayoutTemplate size={28} color="#a8a29e" /></div>
              <p>{t('dashboard.emptyProjects')}</p>
            </div>
          ) : (
            recentProjects.map(project => (
              <div key={project._id} className={styles.projectRow}>
                <div className={styles.projectInfo} onClick={() => navigate(`/${currentLang}/${editRoute}/${project._id}`)}>
                  <div className={styles.projectIconWrapper}><LayoutTemplate size={18} color="var(--text-muted)" /></div>
                  <div className={styles.projectTextData}>
                    <h4 className={styles.projectName}>{project.name}</h4>
                    <span className={styles.projectDate}>{formatDate(project.updatedAt)}</span>
                  </div>
                </div>
                <div className={styles.projectMenu}>
                  <button onClick={e => { e.stopPropagation(); setRowMenuOpen(rowMenuOpen === project._id ? null : project._id); }} className={styles.menuTrigger}><MoreHorizontal size={18} /></button>
                  {rowMenuOpen === project._id && (
                    <div className={styles.menuDropdown} onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEditModal(project)} className={styles.menuItem}>
                        <Edit3 size={14} /> {t('dashboard.edit')}
                      </button>
                      <div className={styles.menuDivider}></div>
                      <button onClick={() => { setDeleteProjectTarget(project._id); setRowMenuOpen(null); }} className={`${styles.menuItem} ${styles.menuItemDanger}`}>
                        <Trash2 size={14} /> {t('dashboard.deletePermanently')}
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