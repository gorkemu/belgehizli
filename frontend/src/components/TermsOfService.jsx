// frontend/src/components/TermsOfService.jsx
import React from 'react';
import styles from './TermsOfService.module.css'; 
import { Helmet } from 'react-helmet-async'; 
import { ScrollText, Info, Scale, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

function TermsOfService() {
    const siteName = import.meta.env.VITE_SITE_NAME;
    const ownerName = import.meta.env.VITE_SELLER_NAME;
    const address = import.meta.env.VITE_SELLER_ADDRESS; 
    const email = import.meta.env.VITE_SELLER_EMAIL;
    const lastUpdateDate = "24.03.2026"; 
    const siteUrl = import.meta.env.VITE_SITE_URL;

    return (
        <>
            <Helmet> 
                <title>Kullanım Şartları - Belge Hızlı</title>
            </Helmet> 

            <div className={styles.container}>
                <div className={styles.header}>
                    <ScrollText size={48} className={styles.titleIcon} />
                    <h1 className={styles.title}>Kullanım Şartları ve Mesafeli Satış Sözleşmesi</h1> 
                    <p className={styles.lastUpdated}><strong>Son Güncelleme:</strong> {lastUpdateDate}</p>
                </div>

                <div className={styles.importantNote}>
                    <div className={styles.noteIconWrapper}>
                        <Info size={24} />
                    </div>
                    <div className={styles.noteContent}>
                        Sitemizdeki belge oluşturma hizmetleri <strong>tamamen ücretsizdir</strong>. Kullanıcılar dilerlerse Shopier üzerinden gönüllü "Dijital Destek" sağlayabilirler. Bölüm 2'deki Mesafeli Satış Sözleşmesi, yalnızca bu gönüllü destek alımları için geçerlidir.
                    </div>
                </div>

                <div className={styles.mainSection}>
                    <h2 className={styles.mainSectionTitle}>
                        <FileText size={28} className={styles.mainSectionIcon} /> BÖLÜM 1: KULLANIM ŞARTLARI
                    </h2> 

                    <h3 className={styles.articleTitle}>MADDE 1 & 2: HİZMETİN KAPSAMI</h3> 
                    <p className={styles.paragraph}>
                        {siteName}, kullanıcıların ücretsiz olarak PDF belgeleri oluşturmasını sağlar. 
                    </p>
                    <div className={styles.warningNote}>
                        <div className={styles.noteIconWrapper}><ShieldAlert size={24} /></div>
                        <div className={styles.noteContent}>
                            <strong>Hukuki Tavsiye Değildir:</strong> {siteName} bir hukuk bürosu değildir. Oluşturulan belgelerin yasal geçerliliğini kontrol etmek tamamen kullanıcının sorumluluğundadır.
                        </div>
                    </div>

                    <h3 className={styles.articleTitle}>MADDE 3: GÖNÜLLÜ DESTEK (BAĞIŞ DEĞİLDİR)</h3> 
                    <p className={styles.paragraph}>
                        Kullanıcılar, platformun ücretsiz kalmasına yardımcı olmak için Shopier entegrasyonu üzerinden "Dijital Destek / Teşekkür" paketleri satın alabilirler. Bu işlem bir bağış değil, dijital hizmet bedelidir ve yasal olarak faturalandırılır.
                    </p>
                </div>

                <hr className={styles.separator} />

                <div className={styles.mainSection}>
                    <h2 className={styles.mainSectionTitle}>
                        <Scale size={28} className={styles.mainSectionIcon} /> BÖLÜM 2: MESAFELİ SATIŞ SÖZLEŞMESİ
                    </h2> 
                    <p className={styles.paragraph}>
                        İşbu Sözleşme, kullanıcının <strong>kendi isteğiyle</strong> Shopier üzerinden satın aldığı "Dijital Destek" hizmetini kapsar.
                    </p>

                    <h3 className={styles.articleTitle}>MADDE 1: TARAFLAR VE KONU</h3> 
                    <p className={styles.paragraph}><strong>SATICI:</strong> {ownerName} ({email})</p>
                    <p className={styles.paragraph}>
                        <strong>KONU:</strong> Alıcı'nın platforma destek olmak amacıyla elektronik ortamda sipariş ettiği dijital hizmetin satışı ve ifasıdır.
                    </p>

                    <h3 className={styles.articleTitle}>MADDE 2: CAYMA HAKKI</h3> 
                    <div className={styles.warningNote}>
                        <div className={styles.noteIconWrapper}><ShieldAlert size={24} /></div>
                        <div className={styles.noteContent}>
                            Satın alınan "Dijital Destek" paketleri, Mesafeli Sözleşmeler Yönetmeliği m.15 uyarınca <strong>"Elektronik ortamda anında ifa edilen hizmetler"</strong> kapsamında olduğundan <strong>cayma hakkı ve iadesi yoktur.</strong>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default TermsOfService;