import React from 'react';
import styles from './PrivacyPolicy.module.css'; 
import { Helmet } from 'react-helmet-async'; 
import { ShieldCheck, Info, User, Database, Scale, Share2, Cookie, CheckSquare, RefreshCw } from 'lucide-react';

function PrivacyPolicy() {
    const siteName = "Belge Hızlı"; 
    const ownerName = "Abdurrahman Görkem Ünal"; 
    const address = "Gülbahar Mah. Kurtuluş 1 Sk. No: 15 İç Kapı No:10 Şişli / İSTANBUL"; 
    const email = "info@belgehizli.com"; 
    const lastUpdateDate = "24.03.2026"; 
    const siteUrl = "https://www.belgehizli.com/"; 

    return (
        <>
            <Helmet> 
                <title>Gizlilik Politikası - Belge Hızlı</title>
                <meta name="description" content="Belge Hızlı web sitesinin gizlilik politikası. Kişisel verilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu öğrenin." />
            </Helmet> 

            <div className={styles.container}>
                <div className={styles.header}>
                    <ShieldCheck size={48} className={styles.titleIcon} />
                    <h1 className={styles.title}>Gizlilik Politikası ve Aydınlatma Metni</h1> 
                    <p className={styles.lastUpdated}><strong>Son Güncelleme:</strong> {lastUpdateDate}</p>
                </div>

                <div className={styles.importantNote}>
                    <div className={styles.noteIconWrapper}>
                        <Info size={24} />
                    </div>
                    <div className={styles.noteContent}>
                        Sitemizdeki belge oluşturma hizmetleri tamamen ücretsizdir. Kullanıcılarımız dilerlerse sunucu ve geliştirme masraflarımıza katkıda bulunmak amacıyla Shopier altyapısı üzerinden gönüllü "Dijital Destek" satın alabilirler. Aşağıdaki politikalar, bu genel kullanım ve destek süreçlerini kapsar.
                    </div>
                </div>

                <p className={styles.paragraph}>
                    <strong>{siteName}</strong> olarak, <strong>{siteUrl}</strong> internet sitemizi ziyaret eden kullanıcılarımızın kişisel verilerinin gizliliğine büyük önem veriyoruz. 6698 sayılı KVKK uyarınca verilerinizin işlenmesi hakkında sizleri bilgilendirmek isteriz.
                </p>

                {/* 1. VERİ SORUMLUSU */}
                <h2 className={styles.sectionTitle}><User size={22} className={styles.sectionIcon} /> 1. Veri Sorumlusunun Kimliği</h2> 
                <ul className={styles.infoList}>
                    <li><strong>Veri Sorumlusu:</strong> <span>{ownerName}</span></li> 
                    <li><strong>Adres:</strong> <span>{address}</span></li>
                    <li><strong>E-posta:</strong> <a href={`mailto:${email}`} className={styles.link}>{email}</a></li>
                </ul>

                {/* 2. İŞLENEN VERİLER */}
                <h2 className={styles.sectionTitle}><Database size={22} className={styles.sectionIcon} /> 2. İşlenen Kişisel Veriler ve Amaçları</h2> 
                <ul className={styles.dataList}>
                    <li><strong>İletişim Bilgileri:</strong> E-posta adresiniz (belge gönderimi için).</li>
                    <li><strong>Form Verileri:</strong> Şablonları doldururken girdiğiniz geçici veriler (sadece PDF oluşturmak için anlık işlenir).</li>
                    <li><strong>İşlem Güvenliği Bilgileri:</strong> IP adresiniz ve log kayıtları.</li>
                    <li><strong>Destek/Ödeme Bilgileri:</strong> Gönüllü dijital destek satın almanız durumunda ad, soyad ve iletişim bilgileriniz Shopier aracılığıyla yasal faturalandırma amacıyla işlenir. Kredi kartı bilgileriniz tarafımızca ASLA görülmez ve saklanmaz.</li>
                </ul>

                {/* 3. HUKUKİ SEBEPLER */}
                <h2 className={styles.sectionTitle}><Scale size={22} className={styles.sectionIcon} /> 3. Kişisel Veri İşlemenin Hukuki Sebepleri</h2> 
                <p className={styles.paragraph}>KVKK m.5 uyarınca; bir sözleşmenin ifası (şartların kabulü), hukuki yükümlülüklerin yerine getirilmesi ve meşru menfaatlerimiz doğrultusunda verileriniz işlenmektedir.</p>

                {/* 4. VERİ AKTARIMI */}
                <h2 className={styles.sectionTitle}><Share2 size={22} className={styles.sectionIcon} /> 4. Kişisel Verilerin Aktarımı</h2> 
                <p className={styles.paragraph}>
                    Kişisel verileriniz, yalnızca gerekli güvenlik önlemleri alınarak aşağıdaki taraflara aktarılabilir:
                </p>
                <ul className={styles.purposeList}>
                    <li><strong>Ödeme Hizmeti Sağlayıcıları:</strong> Gönüllü destek işlemlerinin güvenli tahsilatı ve yasal faturalandırma için Shopier (iyzico vb. altyapılar) ile sipariş bilgileriniz paylaşılır.</li> 
                    <li><strong>Yetkili Kamu Kurumları:</strong> Yasal zorunluluklar doğduğunda yetkili mercilerle.</li>
                </ul>

                {/* 5. ÇEREZLER */}
                <h2 className={styles.sectionTitle}>
                    <Cookie size={22} className={styles.sectionIcon} />
                    5. Çerezler (Cookies)
                </h2> 
                <p className={styles.paragraph}>
                    Sitemizde kullanıcı deneyimini geliştirmek, sitenin verimli çalışmasını sağlamak ve tercihlerinizi hatırlamak gibi amaçlarla çerezler kullanmaktayız:
                </p>
                <ul className={styles.dataList}>
                    <li><strong>Zorunlu Çerezler:</strong> Sitenin temel fonksiyonlarının çalışması için gereklidir.</li>
                    <li><strong>Performans ve Analitik Çerezler:</strong> Site kullanımını analiz ederek performansı artırmamıza yardımcı olur.</li>
                    <li><strong>İşlevsellik Çerezleri:</strong> Dil seçimi gibi tercihlerinizi hatırlar.</li>
                </ul>
                <p className={styles.paragraph}>
                    Çerez tercihlerinizi tarayıcınızın ayarlarından yönetebilirsiniz:
                </p>
                <ul className={styles.linkList}>
                    <li><a href="https://support.google.com/chrome/answer/95647?hl=tr" target="_blank" rel="noopener noreferrer" className={styles.link}>Google Chrome</a></li>
                    <li><a href="https://support.mozilla.org/tr/kb/cerezler-web-sitelerinin-bilgisayarinizda-depoladi" target="_blank" rel="noopener noreferrer" className={styles.link}>Mozilla Firefox</a></li>
                    <li><a href="https://support.apple.com/kb/ph19214?locale=tr_TR" target="_blank" rel="noopener noreferrer" className={styles.link}>Safari</a></li>
                </ul>

                {/* 6. HAKLARINIZ */}
                <h2 className={styles.sectionTitle}>
                    <CheckSquare size={22} className={styles.sectionIcon} />
                    6. KVKK Kapsamındaki Haklarınız
                </h2> 
                <p className={styles.paragraph}>KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
                <ul className={styles.rightsList}>
                    <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
                    <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme,</li>
                    <li>Kişisel verilerinizin işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
                    <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme,</li>
                    <li>Kişisel verilerin silinmesini veya yok edilmesini isteme.</li>
                </ul>
                <p className={styles.paragraph}>
                    Bu haklarınızı kullanmak için taleplerinizi <a href={`mailto:${email}`} className={styles.link}>{email}</a> adresine iletebilirsiniz.
                </p>

                {/* 7. GÜNCELLEMELER */}
                <h2 className={styles.sectionTitle}>
                    <RefreshCw size={22} className={styles.sectionIcon} />
                    7. Politika Değişiklikleri
                </h2> 
                <p className={styles.paragraph}>
                    İşbu Gizlilik Politikası ve Aydınlatma Metni, değişen şartlara ve mevzuata uyum sağlamak amacıyla zaman zaman güncellenebilir. Güncellemeler Sitemizde yayınlandığı tarihte yürürlüğe girer.
                </p>
            </div>
        </>
    );
}

export default PrivacyPolicy;