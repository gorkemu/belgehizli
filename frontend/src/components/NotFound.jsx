// frontend/src/components/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './NotFound.module.css'; 
import { Helmet } from 'react-helmet-async'; 
import { FileQuestion, ArrowLeft } from 'lucide-react'; 

function NotFound() {
  return (
    <>
      <Helmet>
        <title>Sayfa Bulunamadı (404) - Belge Hızlı</title>
        <meta name="description" content="Aradığınız sayfa bulunamadı veya taşınmış olabilir." />
      </Helmet>

      <div className={styles.container}>
        <div className={styles.contentWrapper}>
            <div className={styles.iconWrapper}>
                <FileQuestion size={64} className={styles.icon} />
            </div>
            
            <h1 className={styles.errorCode}>404</h1> 
            <h2 className={styles.title}>Sayfa Bulunamadı</h2>
            
            <p className={styles.message}>
                Üzgünüz, aradığınız sayfa mevcut değil, ismi değiştirilmiş veya geçici olarak kullanım dışı olabilir.
            </p>
            
            <Link to="/" className={styles.homeLink}>
                <ArrowLeft size={18} /> Ana Sayfaya Dön
            </Link>
        </div>
      </div>
    </>
  );
}

export default NotFound;