import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

function Footer() {
    return (
        <footer className={styles.appFooter}>
            <div className={styles.footerContent}>
                
                <div className={styles.footerBrand}>
                    <div className={styles.logoContainer}>
                        <div className={styles.iconCropper}>
                            <img src="/logo.png" alt="Belge Hızlı İkon" />
                        </div>
                        <span className={styles.logoText}>
                            BELGE <span className={styles.logoTextLight}>HIZLI</span>
                        </span>
                    </div>
                    <p className={styles.footerDesc}>
                        Hızlı, güvenilir ve ücretsiz sözleşme şablonları.
                    </p>
                </div>

                <div className={styles.footerLinksWrapper}>
                    
                    <div className={styles.linkColumn}>
                        <h4 className={styles.columnTitle}>Kurumsal</h4>
                        <nav className={styles.footerNav}>
                            <ul>
                                <li><Link to="/sablonlar">Tüm Şablonlar</Link></li>
                                <li><Link to="/hakkimizda">Hakkımızda</Link></li>
                                <li><Link to="/iletisim">İletişim</Link></li>
                            </ul>
                        </nav>
                    </div>

                    <div className={styles.linkColumn}>
                        <h4 className={styles.columnTitle}>Yasal & Destek</h4>
                        <nav className={styles.footerNav}>
                            <ul>
                                <li><Link to="/gizlilik-politikasi">Gizlilik Politikası</Link></li>
                                <li><Link to="/kullanim-sartlari">Kullanım Şartları</Link></li>
                                <li><Link to="/teslimat-iade">İptal ve İade</Link></li>
                                <li><Link to="/on-bilgilendirme-formu">Ön Bilgilendirme</Link></li>
                            </ul>
                        </nav>
                    </div>

                </div>
            </div>

            <div className={styles.footerBottom}>
                <p>© {new Date().getFullYear()} Belge Hızlı. Tüm hakları saklıdır.</p>
            </div>
        </footer>
    );
}

export default Footer;