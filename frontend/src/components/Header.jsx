// frontend/src/components/Header.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Search, LayoutDashboard, Menu, X, ChevronDown, ChevronUp } from 'lucide-react'; 
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import styles from './Header.module.css';
import Button from '../components/ui/Button';
import { translatePath } from '../utils/routeDictionary';
import { useTheme } from '../context/ThemeContext';
import { THEMES } from '../features/TemplateBuilder/utils/constants';

function Header() {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [themePopover, setThemePopover] = useState(false); 
  const [mobileThemeOpen, setMobileThemeOpen] = useState(false); 
  
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcutText = isMac ? '⌘ K' : 'Ctrl K';

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const { lang } = useParams();
  const { theme, changeTheme } = useTheme();

  const currentLang = lang || 'tr';
  const isDark = theme !== 'light' && theme !== 'glacier' && theme !== 'default';
  const currentThemeObj = THEMES.find(t => t.id === theme) || THEMES[0];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setMobileThemeOpen(false); 
  }, [location]);

  const openCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  const switchLanguage = (targetLang) => {
    if (currentLang === targetLang) return;
    i18n.changeLanguage(targetLang);
    const newUrl = translatePath(location.pathname, targetLang);
    navigate({ pathname: newUrl, search: location.search });
  };

  const handleThemeSelect = (themeId) => {
    changeTheme(themeId);
    setThemePopover(false); 
    setMobileThemeOpen(false); 
  };

  return (
    <>
      <div className={styles.headerSpacer} />

      <header className={`${styles.appHeader} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.headerInner}>
          <Link to={`/${currentLang}`} className={styles.logoContainer}>
            <img src={isDark ? "/logo-full-white.svg" : "/logo-full.svg"} alt="Belge Hızlı" className={styles.logoFull} />
            <img src={isDark ? "/logo-icon-white.svg" : "/logo-icon.svg"} alt="Belge Hızlı" className={styles.logoIcon} />
          </Link>

          <div className={styles.searchWrapper}>
            <button className={styles.headerSearchBtn} onClick={openCommandPalette}>
              <Search className={styles.searchIcon} size={16} />
              <span className={styles.searchPlaceholder}>{t('header.searchPlaceholder')}</span>
              <div className={styles.searchShortcut}>{shortcutText}</div>
            </button>
          </div>

          <button
            className={styles.hamburgerBtn}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className={`${styles.rightSpacer} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
            
            <div className={styles.languageSwitcher}>
              <button
                className={`${styles.langOption} ${currentLang === 'en' ? styles.langOptionActive : ''}`}
                onClick={() => switchLanguage('en')}
                aria-label="English"
              >
                English
              </button>
              <button
                className={`${styles.langOption} ${currentLang === 'tr' ? styles.langOptionActive : ''}`}
                onClick={() => switchLanguage('tr')}
                aria-label="Türkçe"
              >
                Türkçe
              </button>
            </div>

            {isMobileMenuOpen ? (
              <div className={styles.mobileThemeSection}>
                <button 
                  className={styles.mobileThemeToggleBtn}
                  onClick={() => setMobileThemeOpen(!mobileThemeOpen)}
                >
                  <div className={styles.mobileThemeToggleLeft}>
                    <span className={styles.themeEmoji}>{currentThemeObj.emoji}</span>
                    <div className={styles.mobileThemeLabels}>
                      <span className={styles.mobileThemeSub}>{t('header.changeTheme')}</span>
                      <span className={styles.mobileThemeMain}>{t(currentThemeObj.label)}</span>
                    </div>
                  </div>
                  {mobileThemeOpen ? <ChevronUp size={18} className={styles.chevron} /> : <ChevronDown size={18} className={styles.chevron} />}
                </button>

                {mobileThemeOpen && (
                  <div className={styles.mobileThemeListWrapper}>
                    <div className={styles.mobileThemeList}>
                      {THEMES.map(th => (
                        <button
                          key={th.id}
                          onClick={() => handleThemeSelect(th.id)}
                          className={`${styles.mobileThemeOption} ${theme === th.id ? styles.activeMobileTheme : ''}`}
                        >
                          <span className={styles.themeEmoji}>{th.emoji}</span>
                          <span>{t(th.label)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.compactThemeDropdown}>
                <button
                  className={styles.themeActiveBtn}
                  onClick={() => setThemePopover(!themePopover)}
                  aria-label={t('header.changeTheme')}
                  title={t('header.changeTheme')}
                >
                  {currentThemeObj.emoji}
                </button>
                {themePopover && (
                  <>
                    <div className={styles.themeOverlay} onClick={() => setThemePopover(false)} />
                    <div className={styles.themePopoverMenu}>
                      {THEMES.map(th => (
                        <button
                          key={th.id}
                          onClick={() => handleThemeSelect(th.id)}
                          className={`${styles.themePopoverItem} ${theme === th.id ? styles.active : ''}`}
                        >
                          <span>{th.emoji}</span>
                          <span>{t(th.label)}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {user ? (
              <Button variant="primary" size="lg" onClick={() => navigate(`/${currentLang}/${currentLang === 'tr' ? 'panel' : 'dashboard'}`)} leftIcon={<LayoutDashboard size={16} />}>
                <span>{t('header.workspace')}</span>
              </Button>
            ) : (
              <div className={styles.authButtons}>
                <Button variant="secondary" onClick={() => navigate(`/${currentLang}/${currentLang === 'tr' ? 'giris-yap' : 'login'}`)}>
                  <span>{t('header.login')}</span>
                </Button>
                <Button variant="primary" onClick={() => navigate(`/${currentLang}/${currentLang === 'tr' ? 'kayit-ol' : 'register'}`)}>
                  <span>{t('header.register')}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className={styles.mobileOverlay} onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </>
  );
}

export default Header;