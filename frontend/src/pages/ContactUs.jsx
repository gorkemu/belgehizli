// frontend/src/pages/ContactUs.jsx
import React from 'react';
import styles from './ContactUs.module.css'; 
import { Helmet } from 'react-helmet-async'; 
import { Building2, Mail, Phone, MapPin, FileText, User, Headset } from 'lucide-react';

function ContactUs() {
    const ownerName = import.meta.env.VITE_SITE_OWNER_NAME;
    const address = import.meta.env.VITE_SELLER_ADDRESS;
    const taxOffice = import.meta.env.VITE_SELLER_TAX_OFFICE;
    const taxIdNumber = import.meta.env.VITE_SELLER_TAX_ID;
    const email = import.meta.env.VITE_SELLER_EMAIL;
    const phone = import.meta.env.VITE_SELLER_PHONE;

    return (
        <>
            <Helmet> 
                <title>İletişim - Belge Hızlı | Bize Ulaşın</title>
                <meta name="description" content="Belge Hızlı ile iletişime geçin. Soru, öneri veya işbirliği talepleriniz için bize ulaşabilirsiniz." />
            </Helmet> 

            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <Headset size={32} />
                    </div>
                    <h1 className={styles.title}>İletişim Bilgileri</h1> 
                    <p className={styles.paragraph}>
                        Soru, öneri veya teknik destek talepleriniz için aşağıdaki bilgileri kullanabilirsiniz.
                        Müşteri destek talepleriniz için öncelikli olarak <strong>e-posta adresimizi</strong> kullanmanızı rica ederiz.
                    </p>
                </div>

                <div className={styles.gridContainer}>
                    <div className={styles.infoCard}>
                        <h2 className={styles.subHeading}>
                            <Building2 size={20} className={styles.subHeadingIcon} />
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

                    <div className={styles.infoCard}>
                        <h2 className={styles.subHeading}>
                            <Mail size={20} className={styles.subHeadingIcon} />
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