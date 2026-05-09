// frontend/src/components/Header.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, LayoutDashboard, Globe } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import styles from './Header.module.css';
import Button from '../components/ui/Button';

function Header() {
  const { t, i18n } = useTranslation();

  const [scrolled, setScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setSearchTerm(''); }, [location]);

  const handleSearch = e => {
    e.preventDefault();
    if (searchTerm.trim()) navigate(`/sablonlar?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  const dashboardPath = user?.currentOrganization?.type === 'CLIENT' ? '/portal' : '/panel';

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('tr') ? 'en' : 'tr';
    i18n.changeLanguage(newLang);
  };

  return (
    <>
      <div className={styles.headerSpacer} />

      <header className={`${styles.appHeader} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.headerInner}>

          <Link to="/" className={styles.logoContainer}>
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
                className={`${styles.langOption} ${i18n.language.startsWith('tr') ? styles.langOptionActive : ''}`}
                onClick={() => {
                  if (!i18n.language.startsWith('tr')) i18n.changeLanguage('tr');
                }}
                aria-label="Türkçe"
                aria-pressed={i18n.language.startsWith('tr')}
              >
                TR
              </button>
              <button
                className={`${styles.langOption} ${i18n.language.startsWith('en') ? styles.langOptionActive : ''}`}
                onClick={() => {
                  if (!i18n.language.startsWith('en')) i18n.changeLanguage('en');
                }}
                aria-label="English"
                aria-pressed={i18n.language.startsWith('en')}
              >
                EN
              </button>
            </div>

            {user ? (
              <Button variant="primary" size="lg" onClick={() => navigate('/panel')} leftIcon={<LayoutDashboard size={16} />}>
                <span>{t('header.workspace')}</span>
              </Button>
            ) : (
              <div className={styles.authButtons}>
                <Button variant="secondary" onClick={() => navigate('/giris-yap')}>
                  <span>{t('header.login')}</span>
                </Button>
                <Button variant="primary" onClick={() => navigate('/kayit-ol')}>
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