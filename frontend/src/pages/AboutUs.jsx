// frontend/src/pages/AboutUs.jsx
import React from 'react';
import styles from './AboutUs.module.css'; 
import { Helmet } from 'react-helmet-async'; 
import { ShieldCheck, Info } from 'lucide-react'; 

function AboutUs() {
    const siteName = import.meta.env.VITE_SITE_NAME || "Belge Hızlı";

    return (
        <>
            <Helmet> 
                <title>Hakkımızda - {siteName} | Belge Oluşturma Süreci</title>
                <meta name="description" content={`${siteName}'nın kuruluş amacı ve online belge oluşturma sürecini nasıl kolaylaştırdığımız hakkında bilgi edinin.`} />
            </Helmet> 

            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className={styles.title}>Hakkımızda</h1> 
                </div>

                <div className={styles.contentWrapper}>
                    <p className={styles.paragraph}>
                        <strong>{siteName}</strong> olarak amacımız, sıkça ihtiyaç duyulan yasal ve rutin belgeleri
                        hazırlama sürecini kolaylaştırmak, tekrarlayan kopyala-yapıştır döngülerini kırmaktır. Teknolojiyi kullanarak,
                        belirli standartlardaki belge ihtiyaçlarınızı kendi bilgilerinizle saniyeler içinde ve hatasız bir şekilde
                        oluşturmanıza olanak tanıyoruz.
                    </p>

                    <p className={styles.paragraph}>
                        Sitemizde bulunan şablonlar, genel ihtiyaçlar göz önünde bulundurularak hazırlanmıştır.
                        Sizin için tasarladığımız akıllı form alanlarını doldurarak bu şablonları kendi durumunuza göre kişiselleştirebilir ve anında
                        PDF formatında indirebilir veya çalışma alanınıza kaydedebilirsiniz.
                    </p>

                    <div className={styles.importantNote}>
                        <div className={styles.noteIconWrapper}>
                            <Info size={20} />
                        </div>
                        <div className={styles.noteContent}>
                            <strong>Önemli Hatırlatma</strong> {siteName} bir hukuk bürosu değildir ve sunduğumuz hizmetler hukuki danışmanlık
                            yerine geçmez. Oluşturduğunuz belgelerin özel durumunuza tam uygunluğu ve yasal geçerliliği konusunda
                            emin olmak için her zaman bir hukuk profesyoneline danışmanızı öneririz.
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default AboutUs;