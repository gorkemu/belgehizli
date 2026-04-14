// frontend/src/components/PostDownloadModal.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Cloud, FolderKanban, X } from 'lucide-react';
import styles from './PostDownloadModal.module.css';

export const PostDownloadModal = ({ isOpen, onClose, isLoggedIn }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <Check size={20} strokeWidth={2.5} />
                    </div>
                    <button onClick={onClose} className={styles.closeBtn} title="Kapat">
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.content}>
                    <h2 className={styles.title}>Belgeniz cihazınıza kaydedildi.</h2>

                    <p className={styles.description}>
                        {isLoggedIn
                            ? "İhtiyacınız olan belgeyi başarıyla indirdiniz. Bu şablonu kendi projeleriniz arasına kopyalamak, üzerinde dilediğiniz gibi oynamak veya sıfırdan kendi belgenizi oluşturmak isterseniz ana panele göz atabilirsiniz."
                            : <>İhtiyacınız olan belgeyi başarıyla oluşturduk. Eğer bu taslağı ileride tekrar kullanmak, üzerinde değişiklik yapmak veya benzer belgeleri otomatik hazırlamak isterseniz, sistemde sizin için <strong>ücretsiz</strong> bir alan ayırabiliriz.</>
                        }
                    </p>

                    <div className={styles.empathyText}>
                        Şimdilik sadece bu belgeye ihtiyacınız varsa, pencereyi kapatıp işinize dönebilirsiniz. Kolaylıklar dileriz.
                    </div>
                </div>

                <div className={styles.actions}>
                    <button
                        className={styles.secondaryBtn}
                        onClick={onClose}
                    >
                        Pencereyi Kapat
                    </button>

                    {isLoggedIn ? (
                        <button
                            className={styles.primaryBtn}
                            onClick={() => navigate('/panel')}
                        >
                            <FolderKanban size={18} /> Ana Panele Git
                        </button>
                    ) : (
                        <button
                            className={styles.primaryBtn}
                            onClick={() => navigate('/kayit-ol')}
                        >
                            <Cloud size={18} /> Ücretsiz Hesap Oluştur
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};