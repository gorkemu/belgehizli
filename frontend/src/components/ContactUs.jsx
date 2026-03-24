// frontend/src/components/ContactUs.jsx
import React from 'react';
import styles from './ContactUs.module.css'; 
import { Helmet } from 'react-helmet-async'; 
import { Building2, Mail, Phone, MapPin, FileText, User, Headset } from 'lucide-react';

function ContactUs() {
	const ownerName = "Abdurrahman Görkem Ünal";
	const address = "Gülbahar Mah. Kurtuluş 1 Sk. No: 15 İç Kapı No:10 Şişli / İSTANBUL";
	const taxOffice = "Zincirlikuyu Vergi Dairesi Müd.";
	const taxIdNumber = "9070132427";
	const email = "info@belgehizli.com"; 
	const phone = "05530968833";

	return (
        <>
            <Helmet> 
                <title>İletişim - Belge Hızlı | Bize Ulaşın</title>
                <meta
                    name="description"
                    content="Belge Hızlı ile iletişime geçin. Soru, öneri veya işbirliği talepleriniz için e-posta gönderebilirsiniz."
                />
                <link rel="canonical" href="https://www.belgehizli.com/iletisim" />
            </Helmet> 

            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <Headset size={40} />
                    </div>
                    <h1 className={styles.title}>İletişim Bilgileri</h1> 
                    <p className={styles.paragraph}>
                        Bizimle iletişime geçmek için aşağıdaki bilgileri kullanabilirsiniz.
                        Müşteri destek talepleriniz için öncelikli olarak <strong>e-posta adresimizi</strong> kullanmanızı rica ederiz.
                    </p>
                </div>

                <div className={styles.gridContainer}>
                    {/* FİRMA BİLGİLERİ KARTI */}
                    <div className={styles.infoCard}>
                        <h2 className={styles.subHeading}>
                            <Building2 size={24} className={styles.subHeadingIcon} />
                            Firma Bilgileri
                        </h2> 
                        <div className={styles.infoList}>
                            <div className={styles.infoItem}>
                                <User size={18} className={styles.itemIcon} />
                                <div>
                                    <span className={styles.label}>Adı Soyadı</span>
                                    <span className={styles.value}>{ownerName}</span>
                                </div>
                            </div>
                            <div className={styles.infoItem}>
                                <Building2 size={18} className={styles.itemIcon} />
                                <div>
                                    <span className={styles.label}>Vergi Dairesi</span>
                                    <span className={styles.value}>{taxOffice}</span>
                                </div>
                            </div>
                            <div className={styles.infoItem}>
                                <FileText size={18} className={styles.itemIcon} />
                                <div>
                                    <span className={styles.label}>Vergi Kimlik Numarası</span>
                                    <span className={styles.value}>{taxIdNumber}</span>
                                </div>
                            </div>
                            <div className={styles.infoItem}>
                                <MapPin size={18} className={styles.itemIcon} />
                                <div>
                                    <span className={styles.label}>Merkez Adresi</span>
                                    <span className={styles.value}>{address}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* İLETİŞİM KANALLARI KARTI */}
                    <div className={styles.infoCard}>
                        <h2 className={styles.subHeading}>
                            <Mail size={24} className={styles.subHeadingIcon} />
                            İletişim Kanalları
                        </h2> 
                        <div className={styles.infoList}>
                            <div className={styles.infoItem}>
                                <Mail size={18} className={styles.itemIcon} />
                                <div>
                                    <span className={styles.label}>E-posta</span>
                                    <a href={`mailto:${email}`} className={styles.linkValue}>{email}</a>
                                </div>
                            </div>
                            <div className={styles.infoItem}>
                                <Phone size={18} className={styles.itemIcon} />
                                <div>
                                    <span className={styles.label}>Telefon</span>
                                    <a href={`tel:${phone}`} className={styles.linkValue}>{phone}</a>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}

export default ContactUs;