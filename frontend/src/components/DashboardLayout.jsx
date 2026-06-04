// frontend/src/components/DashboardLayout.jsx
import React, { useContext, useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard, FolderKanban,
  LogOut, Settings, Globe,
  AlertTriangle
} from 'lucide-react';
import styles from './DashboardLayout.module.css';
import Button from '../components/ui/Button';

export const DashboardLayout = () => {
  const { t } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const { lang } = useParams();
  const currentLang = lang || 'tr';

  const dashboardRoute = currentLang === 'tr' ? 'panel' : 'dashboard';
  const projectsRoute = currentLang === 'tr' ? 'panel/projects' : 'dashboard/projects';
  const settingsRoute = currentLang === 'tr' ? 'panel/settings' : 'dashboard/settings';

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navItems = [
    { path: `/${currentLang}/${dashboardRoute}`, name: t('dashboardLayout.overview'), icon: LayoutDashboard, exact: true },
    { path: `/${currentLang}/${projectsRoute}`, name: t('dashboardLayout.myTemplates'), icon: FolderKanban, exact: false },
  ];

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  return (
    <div className={styles.root}>
      {showLogoutModal && (
        <div className={styles.modalOverlay} onClick={() => setShowLogoutModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIconBox}>
              <AlertTriangle size={24} color="#dc2626" />
            </div>
            <h2 className={styles.modalTitle}>{t('dashboardLayout.logoutConfirmTitle')}</h2>
            <p className={styles.modalText}>{t('dashboardLayout.logoutConfirmText')}</p>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setShowLogoutModal(false)} style={{ flex: 1 }}>
                {t('dashboardLayout.cancel')}
              </Button>
              <Button variant="danger" onClick={handleLogout} style={{ flex: 1 }}>
                {t('dashboardLayout.confirmLogout')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <aside className={styles.sidebar}>
        <nav className={styles.nav}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              >
                <Icon size={18} className={isActive ? styles.iconActive : styles.icon} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userDetails}>
              <p className={styles.userName}>{user?.fullName}</p>
              <p className={styles.userOrg}>{t('dashboardLayout.personalWorkspace')}</p>
            </div>
          </div>

          <div className={styles.footerLinksGroup}>
            <Link to={`/${currentLang}`} className={styles.footerLink}>
              <Globe size={16} className={styles.icon} />
              <span>{t('dashboardLayout.backToHome')}</span>
            </Link>

            <Link
              to={`/${currentLang}/${settingsRoute}`}
              className={`${styles.footerLink} ${location.pathname.includes(settingsRoute) ? styles.footerLinkActive : ''}`}
            >
              <Settings
                size={16}
                className={location.pathname.includes(settingsRoute) ? styles.iconActive : styles.icon}
              />
              <span>{t('dashboardLayout.accountSettings')}</span>
            </Link>

            <Button
              variant="ghost"
              fullWidth
              onClick={() => setShowLogoutModal(true)}
              className={styles.logoutBtn}
              leftIcon={<LogOut size={16} className={styles.logoutIcon} />}
            >
              <span>{t('dashboardLayout.logout')}</span>
            </Button>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};