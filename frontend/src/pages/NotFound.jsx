// frontend/src/pages/NotFound.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './NotFound.module.css';
import { Helmet } from 'react-helmet-async';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import Button from '../components/ui/Button';

function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>{t('notFound.pageTitle')}</title>
      </Helmet>

      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <div className={styles.iconWrapper}>
            <div className={styles.iconBg}>
              <FileQuestion size={40} className={styles.icon} />
            </div>
          </div>

          <h1 className={styles.errorCode}>404</h1>
          <h2 className={styles.title}>{t('notFound.title')}</h2>

          <p className={styles.message}>
            {t('notFound.message')}
          </p>

          <div className={styles.actions}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/')}
              leftIcon={<Home size={18} />}
            >
              <span>{t('notFound.home')}</span>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => window.history.back()}
              leftIcon={<ArrowLeft size={18} />}
            >
              <span>{t('notFound.goBack')}</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default NotFound;