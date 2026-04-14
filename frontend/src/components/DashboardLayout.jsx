// frontend/src/components/DashboardLayout.jsx
import React, { useContext, useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard, FolderKanban,
  LogOut, Settings, Globe,
  Menu, X, ChevronRight,
} from 'lucide-react';
import styles from './DashboardLayout.module.css';

export const DashboardLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
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
    { path: '/panel',          name: 'Özet',       icon: LayoutDashboard, exact: true  },
    { path: '/panel/projects', name: 'Belgelerim', icon: FolderKanban,    exact: false },
  ];

  return (
    <div className={styles.root}>
      {isMobile && (
        <div className={styles.mobileHeader}>
          <Link to="/panel" className={styles.mobileLogoLink}>
            <img
              src="/logo-icon.svg"
              alt="Belge Hızlı"
              className={styles.mobileLogoIcon}
            />
            <span className={styles.mobileLogoText}>BelgeHızlı</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className={styles.menuBtn}
            aria-label="Menüyü aç"
          >
            <Menu size={24} color="#1c1917" />
          </button>
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
          <Link to="/panel" className={styles.sidebarLogoLink}>
            <img
              src="/logo-full-white.svg"
              alt="Belge Hızlı"
              className={styles.sidebarLogo}
            />
          </Link>
          {isMobile && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className={styles.closeBtn}
              aria-label="Menüyü kapat"
            >
              <X size={20} />
            </button>
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
              <p className={styles.userOrg}>Kişisel Çalışma Alanı</p>
            </div>
          </div>

          <div className={styles.footerLinksGroup}>
            <Link to="/" className={styles.footerLink}>
              <Globe size={16} className={styles.icon} />
              <span>Ana Sayfaya Dön</span>
            </Link>
            <Link
              to="/panel/settings"
              className={`${styles.footerLink} ${location.pathname === '/panel/settings' ? styles.footerLinkActive : ''}`}
            >
              <Settings
                size={16}
                className={location.pathname === '/panel/settings' ? styles.iconActive : styles.icon}
              />
              <span>Hesap Ayarları</span>
            </Link>
            <button onClick={logout} className={styles.logoutBtn}>
              <LogOut size={16} className={styles.logoutIcon} />
              <span>Güvenli Çıkış</span>
            </button>
          </div>
        </div>
      </aside>

      <main className={`${styles.main} ${isMobile ? styles.mainMobile : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};