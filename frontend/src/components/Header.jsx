import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Header.module.css';

function Header() {
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isActive = (path) => location.pathname === path;

    return (
        <header className={`${styles.appHeader} ${scrolled ? styles.scrolled : ''}`}>
            <Link to="/" className={styles.logo}>
                <img src="/logo.png" alt="Belge Hızlı Logosu" height="40" />
            </Link>
            <nav className={styles.appNav}>
                <ul>
                    <li>
                        <Link to="/" className={isActive('/') ? styles.active : ''}>Ana Sayfa</Link>
                    </li>
                    <li>
                        <Link to="/sablonlar" className={isActive('/sablonlar') ? styles.active : ''}>Şablonlar</Link>
                    </li>
                    <li>
                        <Link to="/hakkimizda" className={isActive('/hakkimizda') ? styles.active : ''}>Hakkımızda</Link>
                    </li>
                    <li>
                        <Link to="/iletisim" className={isActive('/iletisim') ? styles.active : ''}>İletişim</Link>
                    </li>
                    
                    <li>
                        <Link to="/sablonlar" className={styles.navCtaBtn}>Hemen Başla</Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
}

export default Header;