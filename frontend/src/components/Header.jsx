// frontend/src/components/Header.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom'; 
import { Search, LayoutDashboard, Globe, Menu, X } from 'lucide-react'; 
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import styles from './Header.module.css';
import Button from '../components/ui/Button';
import { translatePath } from '../utils/routeDictionary'; 
import { useTheme } from '../context/ThemeContext'; 

function Header() {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const { lang } = useParams(); 
  const { theme } = useTheme(); 

  const currentLang = lang || 'tr'; 
  const isDark = theme !== 'light' && theme !== 'glacier' && theme !== 'default';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { 
    setSearchTerm(''); 
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleSearch = e => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const searchRoute = currentLang === 'tr' ? 'sablonlar' : 'templates';
      navigate(`/${currentLang}/${searchRoute}?search=${encodeURIComponent(searchTerm.trim())}`);
      setIsMobileMenuOpen(false); 
    }
  };

  const switchLanguage = (targetLang) => {
    if (currentLang === targetLang) return; 
    
    i18n.changeLanguage(targetLang);
    const newUrl = translatePath(location.pathname, targetLang);
    navigate({ pathname: newUrl, search: location.search });
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
            <form className={styles.headerSearch} onSubmit={handleSearch}>
              <Search className={styles.searchIcon} size={16} />
              <input
                type="text"
                name='searchInput'
                placeholder={t('header.searchPlaceholder')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <button type="submit" className={styles.searchBtn}>{t('header.find')}</button>
            </form>
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