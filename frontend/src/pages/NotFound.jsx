// frontend/src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './NotFound.module.css';
import { Helmet } from 'react-helmet-async';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

function NotFound() {
  return (
    <>
      <Helmet>
        <title>Sayfa Bulunamadı (404) - Belge Hızlı</title>
      </Helmet>

      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <div className={styles.iconWrapper}>
            <div className={styles.iconBg}>
              <FileQuestion size={40} className={styles.icon} />
            </div>
          </div>

          <h1 className={styles.errorCode}>404</h1>
          <h2 className={styles.title}>Sayfa Bulunamadı</h2>

          <p className={styles.message}>
            Üzgünüz, aradığınız sayfa mevcut değil, ismi değiştirilmiş veya geçici olarak kullanım dışı olabilir.
          </p>

          <div className={styles.actions}>
            <Link to="/" className={styles.homeLink}>
              <Home size={18} /> Ana Sayfa
            </Link>
            <button onClick={() => window.history.back()} className={styles.backLink}>
              <ArrowLeft size={18} /> Geri Dön
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default NotFound;