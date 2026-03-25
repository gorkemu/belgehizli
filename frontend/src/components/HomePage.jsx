import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import styles from './HomePage.module.css'; 
import { Helmet } from 'react-helmet-async'; 
import { FileText, Search, PenLine, Download, ArrowRight, Home as HomeIcon, Car, Gavel, CheckCircle2 } from 'lucide-react';

const POPULAR_CHIPS = [
    { name: 'Kira Sözleşmesi', slug: 'konut-kira-sozlesmesi', icon: <HomeIcon size={14} /> },
    { name: 'İstifa Dilekçesi', slug: 'istifa-dilekcesi-isci-tarafindan-fesih', icon: <FileText size={14} /> },
    { name: 'Araç Satış', slug: 'arac-satis-sozlesmesi', icon: <Car size={14} /> },
    { name: 'Genel İhtarname', slug: 'genel-ihtarname', icon: <Gavel size={14} /> },
];

const DYNAMIC_DOCS = [
    { id: 1, title: 'Kira Sözleşmesi', icon: <HomeIcon size={24} />, color: '#2563eb', bg: '#eff6ff' },
    { id: 2, title: 'İstifa Dilekçesi', icon: <FileText size={24} />, color: '#059669', bg: '#ecfdf5' },
    { id: 3, title: 'Araç Satış', icon: <Car size={24} />, color: '#d97706', bg: '#fffbeb' },
    { id: 4, title: 'İhtarname', icon: <Gavel size={24} />, color: '#dc2626', bg: '#fef2f2' },
];

function HomePage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [docIndex, setDocIndex] = useState(0); 
    const [fade, setFade] = useState(false); 
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(true);
            setTimeout(() => {
                setDocIndex((prev) => (prev + 1) % DYNAMIC_DOCS.length);
                setFade(false); 
            }, 300); 
        }, 3000); 

        return () => clearInterval(interval);
    }, []);

    const currentDoc = DYNAMIC_DOCS[docIndex]

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/sablonlar?search=${encodeURIComponent(searchTerm.trim())}`);
        }
    };

    return (
        <> 
            <Helmet> 
                <title>Belge Hızlı - Online Sözleşme ve Belge Oluşturucu</title>
                <meta name="description" content="İhtiyacınıza özel kira sözleşmesi, iş anlaşması, dilekçe ve daha birçok belge şablonunu online olarak kolayca doldurun ve anında PDF indirin." />
                <link rel="canonical" href="https://www.belgehizli.com/" />
            </Helmet> 

            <div className={styles.homeContainer}>
                
                <section className={styles.heroSection}>
                    <div className={styles.heroContent}>
                        <div className={styles.badge}>✨ Yeni Nesil Belge Yönetimi</div>
                        <h1 className={styles.heroTitle}>
                            Profesyonel Sözleşmeler ve Belgeler <span className={styles.highlight}>Anında Hazır</span>
                        </h1>
                        <p className={styles.heroSubtitle}>
                            İhtiyacınıza özel, dinamik olarak oluşturulan şablonlarla saniyeler içinde hatasız PDF belgelerinizi hazırlayın.
                        </p>
                        {/* --- ÜCRETSİZ VURGUSU --- */}
                        <div className={styles.trustIndicators}>
                            <span><CheckCircle2 size={18} className={styles.checkIcon}/> %100 Ücretsiz</span>
                            <span><CheckCircle2 size={18} className={styles.checkIcon}/> Kredi Kartı Gerekmez</span>
                            <span><CheckCircle2 size={18} className={styles.checkIcon}/> Üyelik Gerekmez</span>
                        </div>
                        {/* --- ARAMA BÖLÜMÜ --- */}
                        <form className={styles.searchBar} onSubmit={handleSearch}>
                            <Search className={styles.searchIcon} size={20} />
                            <input 
                                type="text" 
                                placeholder="Hangi belgeye ihtiyacınız var?" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button type="submit">Ara</button>
                        </form>

                        {/* --- POPÜLER ÇİPLER --- */}
                        <div className={styles.quickAccess}>
                            <span className={styles.quickLabel}>Popüler:</span>
                            {POPULAR_CHIPS.map((chip) => (
                                <button 
                                    key={chip.slug} 
                                    onClick={() => navigate(`/sablonlar/detay/${chip.slug}`)}
                                    className={styles.chip}
                                    type="button"
                                >
                                    {chip.icon} {chip.name}
                                </button>
                            ))}
                        </div>

                        {/* CTA BUTONU */}
                        <div className={styles.heroAction}>
                            <Link to="/sablonlar" className={styles.ctaButtonOutline}>
                                Tüm Şablonları Görüntüle <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                    
                    <div className={styles.heroImagePlaceholder}>
                        <div className={`${styles.dynamicDocumentCard} ${fade ? styles.fadeOut : styles.fadeIn}`}>
                            {/* Kart Başlığı ve İkon */}
                            <div className={styles.docHeader}>
                                <div 
                                    className={styles.docIconBox} 
                                    style={{ color: currentDoc.color, backgroundColor: currentDoc.bg }}
                                >
                                    {currentDoc.icon}
                                </div>
                                <span className={styles.docTitle}>{currentDoc.title}</span>
                            </div>
                            
                            {/* Kart Gövdesi (Skeleton Form Alanları) */}
                            <div className={styles.docBody}>
                                <div className={styles.skeletonLabel} style={{ width: '40%' }}></div>
                                <div className={styles.skeletonInput}></div>
                                
                                <div className={styles.skeletonLabel} style={{ width: '60%' }}></div>
                                <div className={styles.skeletonInput}></div>
                                
                                <div className={styles.skeletonLabel} style={{ width: '30%' }}></div>
                                <div className={styles.skeletonInput} style={{ height: '40px' }}></div>
                            </div>

                            {/* Kart Altı (Sahte Buton) */}
                            <div className={styles.docFooter}>
                                <div className={styles.skeletonButton} style={{ backgroundColor: currentDoc.color }}></div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.howItWorksSection}>
                    <h2 className={styles.sectionTitle}>Nasıl Çalışır?</h2>
                    <div className={styles.stepsContainer}>
                        {/* 1. ADIM */}
                        <div className={`${styles.step} ${styles.stepSearch}`}>
                            <div className={styles.iconWrapper}>
                                <Search size={32} />
                            </div>
                            <h3>1. Şablon Seç</h3>
                            <p>İhtiyacınız olan şablonu bulun.</p>
                        </div>

                        {/* 2. ADIM */}
                        <div className={`${styles.step} ${styles.stepWrite}`}>
                            <div className={styles.iconWrapper}>
                                <PenLine size={32} />
                            </div>
                            <h3>2. Formu Doldur</h3>
                            <p>Akıllı formdaki alanları doldurun ve anlık önizlemesini yapın.</p>
                        </div>

                        {/* 3. ADIM */}
                        <div className={`${styles.step} ${styles.stepDownload}`}>
                            <div className={styles.iconWrapper}>
                                <Download size={32} />
                            </div>
                            <h3>3. İndir ve Kullan</h3>
                            <p>Belgenizi anında ve ücretsiz olarak indirin.</p>
                        </div>
                    </div>
                </section>

                <section className={styles.footerCtaSection}>
                    <h2 className={styles.footerCtaTitle}>Hemen Belgenizi Oluşturmaya Başlayın</h2>
                    <Link to="/sablonlar" className={styles.ctaButton}>
                        Şablonları İncele <ArrowRight size={20} />
                    </Link>
                </section>
            </div>
        </>
    );
}

export default HomePage;