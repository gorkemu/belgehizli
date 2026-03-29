import React from 'react';
import styles from './PreInformationForm.module.css';
import { FileSignature, Info, ShieldAlert, Settings, CheckCircle2 } from 'lucide-react';

function PreInformationForm() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>
                <FileSignature size={36} className={styles.titleIcon} /> Ön Bilgilendirme Formu
            </h1> 

            <div className={styles.importantNote}>
                <div className={styles.noteIconWrapper}><Info size={24} /></div>
                <div className={styles.noteContent}>
                    Sitemizdeki belge oluşturma (PDF) hizmetleri tamamen ücretsizdir. İşbu form, yalnızca kullanıcılarımızın kendi istekleriyle platform masraflarına destek olmak amacıyla Shopier üzerinden satın alacağı <strong>Dijital Destek (Kahve Ismarla)</strong> paketleri için geçerlidir.
                </div>
            </div>

            <h2 className={styles.sectionTitle}><Settings size={22} className={styles.sectionIcon} /> 1. Hizmetin Nitelikleri ve Teslimat</h2> 
            <ul className={styles.definitionList}>
                <li><strong>Hizmetin Tanımı:</strong> Alıcının, platformun ücretsiz kalmasına ve sunucu masraflarına katkıda bulunmak amacıyla Shopier aracılığıyla satın aldığı "dijital teşekkür/destek" paketidir.</li>
                <li><strong>Teslimat:</strong> Hizmet, ödeme yapıldığı an elektronik ortamda ifa edilir. Herhangi bir kargo veya fiziki gönderim yoktur.</li>
                <li><strong>Fiyat:</strong> Seçilen destek paketinin (Örn: 1 Fincan Kahve) vergiler dahil tutarı ödeme ekranında gösterilir.</li>
            </ul>

            <h2 className={styles.sectionTitle}><CheckCircle2 size={22} className={styles.successIcon} /> 2. Veri Güvenliği ve 24 Saat Kuralı (KVKK)</h2> 
            <p className={styles.successNote}>
                Ödeme işlemi Shopier'ın güvenli altyapısı üzerinden gerçekleşir, kredi kartı bilgileriniz tarafımızca görülmez. Belge oluşturmak için girdiğiniz tüm sözleşme ve form verileri ise, belgeniz üretildikten <strong>24 saat sonra sunucularımızdan otomatik ve kalıcı olarak silinir.</strong>
            </p>

            <h2 className={styles.sectionTitle}><ShieldAlert size={22} className={styles.sectionIcon} /> 3. Cayma Hakkı Yoktur</h2> 
            <p className={`${styles.paragraph} ${styles.warningNote}`}>
                Mesafeli Sözleşmeler Yönetmeliği m.15 uyarınca, elektronik ortamda anında ifa edilen hizmetlerde (bağış niteliğindeki dijital destek/katkı payı) yasal olarak <strong>cayma hakkı bulunmamaktadır ve ücret iadesi yapılamaz.</strong> Alıcı, işlemi onaylayarak bu şartı peşinen kabul eder.
            </p>

            <hr className={styles.separator} />
            <p className={styles.confirmation}>
                ALICI, bu formu okuyup anladığını; hizmetin niteliği, 24 saatlik veri silme politikası ve cayma hakkı bulunmadığı konusunda açıkça bilgilendirildiğini kabul eder.
            </p>
        </div>
    );
}

export default PreInformationForm;