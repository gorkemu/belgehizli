// frontend/src/components/Header.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom'; 
import { Search, LayoutDashboard, Globe } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import styles from './Header.module.css';
import Button from '../components/ui/Button';
import { translatePath } from '../utils/routeDictionary'; 

function Header() {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const { lang } = useParams(); 

  const currentLang = lang || 'tr'; 

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setSearchTerm(''); }, [location]);

  const handleSearch = e => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const searchRoute = currentLang === 'tr' ? 'sablonlar' : 'templates';
      navigate(`/${currentLang}/${searchRoute}?search=${encodeURIComponent(searchTerm.trim())}`);
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
            <img src="/logo-full.svg" alt="Belge Hızlı" className={styles.logoFull} />
            <img src="/logo-icon.svg" alt="Belge Hızlı" className={styles.logoIcon} />
          </Link>

          <div className={`${styles.searchWrapper} ${scrolled ? styles.searchVisible : styles.searchHidden}`}>
            <form className={styles.headerSearch} onSubmit={handleSearch}>
              <Search className={styles.searchIcon} size={16} />
              <input
                type="text"
                placeholder={t('header.searchPlaceholder')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <button type="submit" className={styles.searchBtn}>{t('header.find')}</button>
            </form>
          </div>

          <div className={styles.rightSpacer}>
            {/* Dil Değiştirici */}
            <div className={styles.languageSwitcher}>
              <button
                className={`${styles.langOption} ${currentLang === 'tr' ? styles.langOptionActive : ''}`}
                onClick={() => switchLanguage('tr')}
                aria-label="Türkçe"
              >
                TR
              </button>
              <button
                className={`${styles.langOption} ${currentLang === 'en' ? styles.langOptionActive : ''}`}
                onClick={() => switchLanguage('en')}
                aria-label="English"
              >
                EN
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
    </>
  );
}

export default Header;