import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

function Footer() {
    return (
        <footer className={styles.appFooter}>
            <div className={styles.waveContainer}>
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C52.16,104.22,106.84,106.51,160.89,101.47,214.9,96.44,263.39,67.24,321.39,56.44Z" className={styles.waveFill}></path>
                </svg>
            </div>
            
            <div className={styles.footerContent}>
                <div className={styles.footerBrand}>
                    <img src="/logo.png" alt="Belge Hızlı" className={styles.footerLogo} />
                    <p className={styles.footerDesc}>Hızlı, Güvenilir ve Ücretsiz Sözleşme Şablonları.</p>
                </div>

                <nav className={styles.footerNav}>
                    <ul>
                        <li><Link to="/gizlilik-politikasi">Gizlilik Politikası</Link></li>
                        <li><Link to="/kullanim-sartlari">Kullanım Şartları</Link></li>
                        <li><Link to="/teslimat-iade">Teslimat ve İade</Link></li>
                        <li><Link to="/on-bilgilendirme-formu">Ön Bilgilendirme Formu</Link></li>
                    </ul>
                </nav>
            </div>
            
            <div className={styles.footerBottom}>
                <p>© {new Date().getFullYear()} Belge Hızlı. Tüm hakları saklıdır.</p>
            </div>
        </footer>
    );
}

export default Footer;