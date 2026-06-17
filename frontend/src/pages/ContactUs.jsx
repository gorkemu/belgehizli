// frontend/src/pages/ContactUs.jsx
import React from 'react';
import { useTranslation, Trans } from 'react-i18next'; 
import { SEOHead } from '../components/SEOHead'; 
import styles from './ContactUs.module.css'; 
import { Building2, Mail, Phone, MapPin, FileText, User, Headset, LifeBuoy, BookOpen } from 'lucide-react';
import Button from '../components/ui/Button';

function ContactUs() {
    const { t } = useTranslation();

    const ownerName = import.meta.env.VITE_SITE_OWNER_NAME;
    const address = import.meta.env.VITE_SELLER_ADDRESS;
    const taxOffice = import.meta.env.VITE_SELLER_TAX_OFFICE;
    const taxIdNumber = import.meta.env.VITE_SELLER_TAX_ID;
    const email = import.meta.env.VITE_SELLER_EMAIL;
    const phone = import.meta.env.VITE_SELLER_PHONE;

    // Helptal Linkleriniz
    const helptalSubmitUrl = "https://belgehizli.helptal.com/portal/submit";
    const helptalHelpUrl = "https://belgehizli.helptal.com/help";

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
                </p>
            </div>

            <div className={styles.layoutWrapper}>
                
                {/* SOL KOLON: Yardım Merkezi ve Ticket Oluşturma */}
                <div className={styles.supportSection}>
                    <div className={styles.supportCard}>
                        <div className={styles.supportIconWrapper}>
                            <LifeBuoy size={32} className={styles.supportIcon} />
                        </div>
                        <h2>{t('contactUs.helpCenterTitle', 'Yardım Merkezi & Destek')}</h2>
                        <p>{t('contactUs.helpCenterDesc', 'Sorularınızın cevabını bilgi bankamızda bulabilir veya destek ekibimize doğrudan bir talep (ticket) oluşturabilirsiniz.')}</p>

                        <div className={styles.actionButtons}>
                            <Button 
                                variant="primary" 
                                onClick={() => window.open(helptalSubmitUrl, '_blank')}
                                className={styles.actionBtn}
                            >
                                {t('contactUs.submitTicketBtn', 'Destek Talebi Oluştur')}
                            </Button>
                            <Button 
                                variant="secondary" 
                                onClick={() => window.open(helptalHelpUrl, '_blank')}
                                className={styles.actionBtn}
                            >
                                {t('contactUs.knowledgeBaseBtn', 'Bilgi Bankasına Git')}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* SAĞ KOLON: Şirket Bilgileri */}
                <div className={styles.infoSection}>
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

                    
                </div>

            </div>
        </div>
    );
}

export default ContactUs;