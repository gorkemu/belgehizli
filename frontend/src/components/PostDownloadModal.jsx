// frontend/src/components/PostDownloadModal.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Cloud, FolderKanban, X } from 'lucide-react';
import styles from './PostDownloadModal.module.css';

export const PostDownloadModal = ({ isOpen, onClose, isLoggedIn }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <Check size={20} strokeWidth={2.5} />
          </div>
          <button onClick={onClose} className={styles.closeBtn} title={t('postDownloadModal.close')}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.content}>
          <h2 className={styles.title}>{t('postDownloadModal.title')}</h2>

          <p className={styles.description}>
            {isLoggedIn
              ? t('postDownloadModal.descriptionLoggedIn')
              : t('postDownloadModal.descriptionGuest')
            }
          </p>

          <div className={styles.empathyText}>
            {t('postDownloadModal.empathyText')}
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.secondaryBtn} onClick={onClose}>
            {t('postDownloadModal.closeWindow')}
          </button>

          {isLoggedIn ? (
            <button
              className={styles.primaryBtn}
              onClick={() => navigate('/panel')}
            >
              <FolderKanban size={18} /> {t('postDownloadModal.goToDashboard')}
            </button>
          ) : (
            <button
              className={styles.primaryBtn}
              onClick={() => navigate('/kayit-ol')}
            >
              <Cloud size={18} /> {t('postDownloadModal.createFreeAccount')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};