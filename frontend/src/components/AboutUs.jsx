// frontend/src/components/AboutUs.jsx
import React from 'react';
import styles from './AboutUs.module.css'; 
import { Helmet } from 'react-helmet-async'; 
import { ShieldCheck, Info } from 'lucide-react'; 

function AboutUs() {
    const siteName = import.meta.env.VITE_SITE_NAME;

    return (
        <>
            <Helmet> 
                <title>Hakkımızda - Belge Hızlı | Amacımız ve Kolaylaştırdığımız Belge Oluşturma Süreci</title>
                <meta name="description" content="Belge Hızlı'nın kuruluş amacı ve online belge oluşturma sürecini nasıl kolaylaştırdığımız hakkında bilgi edinin." />
                <link rel="canonical" href="https://www.belgehizli.com/hakkimizda" />
            </Helmet> 

            <div className={styles.container}>
                <h1 className={styles.title}>
                    <ShieldCheck size={36} className={styles.titleIcon} />
                    Hakkımızda
                </h1> 

                <div className={styles.contentWrapper}>
                    <p className={styles.paragraph}>
                        <strong>{siteName}</strong> olarak amacımız, sıkça ihtiyaç duyulan yasal belgeleri
                        hazırlama sürecini kolaylaştırmak, hızlı ve pratik çözümler sunmaktır. Teknolojiyi kullanarak,
                        belirli standartlardaki belge ihtiyaçlarınızı, kendi bilgilerinizle saniyeler içinde ve hatasız bir şekilde
                        oluşturmanıza olanak tanıyoruz.
                    </p>

                    <p className={styles.paragraph}>
                        Sitemizde bulunan şablonlar, alanında deneyimli profesyonellerin katkılarıyla genel ihtiyaçlar göz önünde bulundurularak hazırlanmıştır.
                        Sizin için hazırladığımız akıllı form alanlarını doldurarak bu şablonları kendi durumunuza göre kişiselleştirebilir ve anında
                        PDF formatında indirebilirsiniz.
                    </p>

                    <div className={styles.importantNote}>
                        <div className={styles.noteIconWrapper}>
                            <Info size={24} />
                        </div>
                        <div className={styles.noteContent}>
                            <strong>Önemli Hatırlatma:</strong> {siteName} bir hukuk bürosu değildir ve sunduğumuz hizmetler hukuki danışmanlık
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