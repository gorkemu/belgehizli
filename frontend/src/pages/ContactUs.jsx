// frontend/src/pages/ContactUs.jsx
import React from 'react';
import { useTranslation, Trans } from 'react-i18next'; 
import { SEOHead } from '../components/SEOHead'; 
import styles from './ContactUs.module.css'; 
import { Building2, Mail, Phone, MapPin, FileText, User, Headset } from 'lucide-react';

function ContactUs() {
    const { t } = useTranslation();

    const ownerName = import.meta.env.VITE_SITE_OWNER_NAME;
    const address = import.meta.env.VITE_SELLER_ADDRESS;
    const taxOffice = import.meta.env.VITE_SELLER_TAX_OFFICE;
    const taxIdNumber = import.meta.env.VITE_SELLER_TAX_ID;
    const email = import.meta.env.VITE_SELLER_EMAIL;
    const phone = import.meta.env.VITE_SELLER_PHONE;

    return (
        <div className={styles.container}>
            <SEOHead 
                titleKey="contactUs.pageTitle" 
                descKey="contactUs.metaDescription" 
            />

            <div className={styles.header}>
                <div className={styles.iconWrapper}>
                    <Headset size={32} />
                </div>
                <h1 className={styles.title}>{t('contactUs.title')}</h1> 
                <p className={styles.paragraph}>
                    {t('contactUs.paragraph1')}
                    <br />
                    <Trans i18nKey="contactUs.paragraph2" components={{ bold: <strong /> }} />
                </p>
            </div>

            <div className={styles.gridContainer}>
                <div className={styles.infoCard}>
                    <h2 className={styles.subHeading}>
                        <Building2 size={20} className={styles.subHeadingIcon} />
                        {t('contactUs.companyInfo')}
                    </h2> 
                    <div className={styles.infoList}>
                        <div className={styles.infoItem}>
                            <User size={18} className={styles.itemIcon} />
                            <div>
                                <span className={styles.label}>{t('contactUs.fullName')}</span>
                                <span className={styles.value}>{ownerName}</span>
                            </div>
                        </div>
                        <div className={styles.infoItem}>
                            <Building2 size={18} className={styles.itemIcon} />
                            <div>
                                <span className={styles.label}>{t('contactUs.taxOffice')}</span>
                                <span className={styles.value}>{taxOffice}</span>
                            </div>
                        </div>
                        <div className={styles.infoItem}>
                            <FileText size={18} className={styles.itemIcon} />
                            <div>
                                <span className={styles.label}>{t('contactUs.taxId')}</span>
                                <span className={styles.value}>{taxIdNumber}</span>
                            </div>
                        </div>
                        <div className={styles.infoItem}>
                            <MapPin size={18} className={styles.itemIcon} />
                            <div>
                                <span className={styles.label}>{t('contactUs.address')}</span>
                                <span className={styles.value}>{address}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.infoCard}>
                    <h2 className={styles.subHeading}>
                        <Mail size={20} className={styles.subHeadingIcon} />
                        {t('contactUs.contactChannels')}
                    </h2> 
                    <div className={styles.infoList}>
                        <div className={styles.infoItem}>
                            <Mail size={18} className={styles.itemIcon} />
                            <div>
                                <span className={styles.label}>{t('contactUs.email')}</span>
                                <a href={`mailto:${email}`} className={styles.linkValue}>{email}</a>
                            </div>
                        </div>
                        <div className={styles.infoItem}>
                            <Phone size={18} className={styles.itemIcon} />
                            <div>
                                <span className={styles.label}>{t('contactUs.phone')}</span>
                                <a href={`tel:${phone}`} className={styles.linkValue}>{phone}</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContactUs;