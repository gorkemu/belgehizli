// frontend/src/components/DeliveryReturn.jsx
import React from 'react';
import styles from './DeliveryReturn.module.css'; 
import { Helmet } from 'react-helmet-async';
import { PackageX, RefreshCcw, ShieldAlert, Zap, Info } from 'lucide-react';

function DeliveryReturn() {
    const lastUpdateDate = "24.03.2026"; 

    return (
        <>
            <Helmet>
                <title>Teslimat ve İade Koşulları - Belge Hızlı</title>
            </Helmet>

            <div className={styles.container}>
                <div className={styles.header}>
                    <RefreshCcw size={48} className={styles.titleIcon} />
                    <h1 className={styles.title}>Teslimat ve İade Koşulları</h1>
                    <p className={styles.lastUpdated}><strong>Son Güncelleme:</strong> {lastUpdateDate}</p>
                </div>

                <div className={styles.importantNote}>
                    <div className={styles.noteIconWrapper}>
                        <Info size={24} />
                    </div>
                    <div className={styles.noteContent}>
                        Belge Hızlı platformundaki PDF oluşturma hizmetleri ücretsizdir. Bu sayfadaki koşullar, kullanıcıların kendi istekleriyle Shopier üzerinden satın aldığı "Dijital Destek (Kahve Ismarla)" paketlerini kapsar.
                    </div>
                </div>

                {/* 1. TESLİMAT KOŞULLARI */}
                <h2 className={styles.sectionTitle}><Zap size={22} className={styles.sectionIcon} /> 1. Teslimat Koşulları</h2>
                <ul className={styles.policyList}>
                    <li>
                        <strong>Anında Dijital İfa:</strong> Sitemiz üzerinden veya Shopier aracılığıyla satın alınan "Dijital Destek" paketleri, fiziksel bir ürün içermez. İşlem, ödemenin yapıldığı anda elektronik ortamda anında tamamlanır.
                    </li>
                    <li>
                        <PackageX size={18} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                        <strong>Fiziki Kargo Yoktur:</strong> Alıcıya herhangi bir basılı evrak, fatura kopyası veya fiziksel ürün kargolanmayacaktır. Teslimat tamamen dijitaldir.
                    </li>
                </ul>

                {/* 2. İADE VE CAYMA HAKKI */}
                <h2 className={styles.sectionTitle}><ShieldAlert size={22} className={styles.sectionIcon} /> 2. İade ve Cayma Hakkı</h2>
                <p className={styles.paragraph}>
                    Platformumuza yapılan gönüllü dijital destek işlemleri, niteliği gereği iade edilemez bir dijital hizmet tüketimidir.
                </p>
                <div className={styles.warningNote}>
                    <div className={styles.noteIconWrapper}><ShieldAlert size={24} /></div>
                    <div className={styles.noteContent}>
                        <strong>Yasal Dayanak:</strong> 27.11.2014 tarihli ve 29188 sayılı Resmi Gazete'de yayımlanan Mesafeli Sözleşmeler Yönetmeliği'nin <strong>Cayma Hakkının İstisnaları</strong> başlıklı 15. maddesinin 1. fıkrasının (ğ) bendi uyarınca; <em>"Elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayrimaddi mallara ilişkin sözleşmeler"</em> kapsamında <strong>cayma hakkı kullanılamaz ve ücret iadesi talep edilemez.</strong>
                    </div>
                </div>

                {/* 3. İSTİSNAİ DURUMLAR VE ÇÖZÜM */}
                <h2 className={styles.sectionTitle}><RefreshCcw size={22} className={styles.sectionIcon} /> 3. İstisnai Durumlar ve Çözüm</h2>
                <p className={styles.paragraph}>
                    Mükerrer (yanlışlıkla arka arkaya iki kez) ödeme çekilmesi gibi teknik bir hata yaşanması durumunda, işlemin gerçekleştiği tarihi takip eden 3 (üç) iş günü içerisinde <strong>info@belgehizli.com</strong> adresi üzerinden bizimle iletişime geçebilirsiniz. Teknik inceleme sonucunda haksız çekim tespit edilirse iade işlemi Shopier üzerinden başlatılır.
                </p>
            </div>
        </>
    );
}

export default DeliveryReturn;