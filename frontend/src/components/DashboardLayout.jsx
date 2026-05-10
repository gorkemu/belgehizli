// frontend/src/components/DashboardLayout.jsx
import React, { useContext, useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useParams } from 'react-router-dom'; 
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard, FolderKanban,
  LogOut, Settings, Globe,
  Menu, X, ChevronRight,
} from 'lucide-react';
import styles from './DashboardLayout.module.css';
import Button from '../components/ui/Button';

export const DashboardLayout = () => {
  const { t } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const { lang } = useParams(); 
  const currentLang = lang || 'tr';

  // Dinamik Rotalar
  const dashboardRoute = currentLang === 'tr' ? 'panel' : 'dashboard';
  const projectsRoute = currentLang === 'tr' ? 'panel/projects' : 'dashboard/projects';
  const settingsRoute = currentLang === 'tr' ? 'panel/settings' : 'dashboard/settings';

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { setIsMobileMenuOpen(false); }, [location]);

  const navItems = [
    { path: `/${currentLang}/${dashboardRoute}`,  name: t('dashboardLayout.overview'), icon: LayoutDashboard, exact: true  },
    { path: `/${currentLang}/${projectsRoute}`, name: t('dashboardLayout.myTemplates'), icon: FolderKanban,  exact: false },
  ];

  return (
    <div className={styles.root}>
      {isMobile && (
        <div className={styles.mobileHeader}>
          <Link to={`/${currentLang}/${dashboardRoute}`} className={styles.mobileLogoLink}>
            <img
              src="/logo-icon.svg"
              alt="Belge Hızlı"
              className={styles.mobileLogoIcon}
            />
            <span className={styles.mobileLogoText}>BelgeHızlı</span>
          </Link>
          <Button
            variant="ghost"
            onClick={() => setIsMobileMenuOpen(true)}
            className={styles.menuBtn} 
            aria-label={t('dashboardLayout.openMenu')}
          >
            <Menu size={24} color="#1c1917" />
          </Button>
        </div>
      )}

      {isMobile && isMobileMenuOpen && (
        <div
          className={styles.overlay}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          styles.sidebar,
          isMobile         ? styles.sidebarMobile : '',
          isMobileMenuOpen ? styles.sidebarOpen   : '',
        ].join(' ')}
      >
        <div className={styles.sidebarHeader}>
          <Link to={`/${currentLang}/${dashboardRoute}`} className={styles.sidebarLogoLink}>
            <img
              src="/logo-full-white.svg"
              alt="Belge Hızlı"
              className={styles.sidebarLogo}
            />
          </Link>
          {isMobile && (
            <Button
              variant="ghost"
              onClick={() => setIsMobileMenuOpen(false)}
              className={styles.closeBtn} 
              aria-label={t('dashboardLayout.closeMenu')}
            >
              <X size={20} />
            </Button>
          )}
        </div>

        <nav className={styles.nav}>
          {navItems.map(item => {
            const Icon     = item.icon;
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
                {isActive && <ChevronRight size={14} className={styles.activeChevron} />}
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
              onClick={logout} 
              className={styles.logoutBtn} 
              leftIcon={<LogOut size={16} className={styles.logoutIcon} />}
            >
              <span>{t('dashboardLayout.logout')}</span>
            </Button>
          </div>
        </div>
      </aside>

      <main className={`${styles.main} ${isMobile ? styles.mainMobile : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};