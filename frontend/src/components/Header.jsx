// frontend/src/components/Header.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, LayoutDashboard } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import styles from './Header.module.css';
import Button from '../components/ui/Button';

function Header() {
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
                placeholder="Hazır şablon ara (örn: kira, dilekçe)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <button type="submit" className={styles.searchBtn}>Bul</button>
            </form>
          </div>

          <div className={styles.rightSpacer}>
            {user ? (

              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/panel')}
                style={{width: '240px', height: '50px'}}
                leftIcon={<LayoutDashboard size={16} />}
              >
                <span>Çalışma Alanı</span>
              </Button>
            ) : (
              <div className={styles.authButtons}>
                <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/giris-yap')}
                style={{width: '160px', height: '40px'}}
              >
                <span>Giriş</span>
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/kayit-ol')}
                style={{width: '160px', height: '40px'}}
              >
                <span>Kayıt Ol</span>
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