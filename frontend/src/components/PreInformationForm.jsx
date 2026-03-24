// frontend/src/components/PreInformationForm.jsx
import React from 'react';
import styles from './PreInformationForm.module.css';
import { FileSignature, Info, ShieldAlert, Scale, Building2, UserCircle, Settings, CreditCard, Package } from 'lucide-react';

function PreInformationForm() {
    const ownerName = "Abdurrahman Görkem Ünal"; 
    const email = "info@belgehizli.com"; 

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>
                <FileSignature size={36} className={styles.titleIcon} /> Ön Bilgilendirme Formu
            </h1> 

            <div className={styles.importantNote}>
                <div className={styles.noteIconWrapper}><Info size={24} /></div>
                <div className={styles.noteContent}>
                    Sitemizdeki PDF oluşturma araçları ücretsizdir. Bu form, yalnızca kullanıcılarımızın kendi istekleriyle Shopier üzerinden satın alacağı <strong>Dijital Destek (Kahve Ismarla)</strong> paketleri için geçerlidir.
                </div>
            </div>

            <h2 className={styles.sectionTitle}><Settings size={22} className={styles.sectionIcon} /> 1. Hizmetin Nitelikleri ve Teslimat</h2> 
            <ul className={styles.definitionList}>
                <li><strong>Hizmetin Tanımı:</strong> Alıcının, platformun sunucu ve yazılım masraflarına katkıda bulunmak amacıyla Shopier aracılığıyla satın aldığı dijital teşekkür/destek paketidir.</li>
                <li><strong>Teslimat:</strong> Hizmet, ödeme anında elektronik ortamda anında ifa edilir. Herhangi bir kargo veya fiziki gönderim yoktur.</li>
                <li><strong>Fiyat:</strong> Seçilen destek paketinin (Örn: 1 Fincan Kahve) vergiler dahil tutarı ödeme ekranında gösterilir.</li>
            </ul>

            <h2 className={styles.sectionTitle}><ShieldAlert size={22} className={styles.sectionIcon} /> 2. Cayma Hakkı Yoktur</h2> 
            <p className={`${styles.paragraph} ${styles.warningNote}`}>
                Mesafeli Sözleşmeler Yönetmeliği m.15 uyarınca, elektronik ortamda anında ifa edilen hizmetlerde (dijital destek/katkı payı) yasal olarak <strong>cayma hakkı bulunmamaktadır ve ücret iadesi yapılamaz.</strong> Alıcı, işlemi onaylayarak bu şartı peşinen kabul eder.
            </p>
        </div>
    );
}

export default PreInformationForm;