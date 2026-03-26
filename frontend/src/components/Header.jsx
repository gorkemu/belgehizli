import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import styles from './Header.module.css';

function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 60);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setSearchTerm('');
    }, [location]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/sablonlar?search=${encodeURIComponent(searchTerm.trim())}`);
        }
    };

    return (
        <>
            <div className={styles.headerSpacer}></div>

            <header className={`${styles.appHeader} ${scrolled ? styles.scrolled : ''}`}>
                <div className={styles.headerInner}>
                    
                    <Link to="/" className={styles.logoContainer}>
                        <img src="/logo.png" alt="Belge Hızlı" className={styles.dynamicLogoImg} />
                        <span className={styles.logoText}>
                            BELGE <span className={styles.logoTextLight}>HIZLI</span>
                        </span>
                    </Link>

                    <div className={`${styles.searchWrapper} ${scrolled ? styles.searchVisible : styles.searchHidden}`}>
                        <form className={styles.headerSearch} onSubmit={handleSearch}>
                            <Search className={styles.searchIcon} size={18} />
                            <input
                                type="text"
                                placeholder="Şablon ara (örn: kira)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button type="submit" className={styles.searchBtn}>Ara</button>
                        </form>
                    </div>

                    <div className={styles.rightSpacer}></div>

                </div>
            </header>
        </>
    );
}

export default Header;