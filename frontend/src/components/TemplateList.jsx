import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './TemplateList.module.css';
import { Helmet } from 'react-helmet-async';
import { Search, FileText, ArrowRight, AlertCircle, Loader2, Home as HomeIcon, Car, Gavel, Info, CheckCircle2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const POPULAR_CHIPS = [
    { name: 'Kira Sözleşmesi', slug: 'konut-kira-sozlesmesi', icon: <HomeIcon size={14} /> },
    { name: 'İstifa Dilekçesi', slug: 'istifa-dilekcesi-isci-tarafindan-fesih', icon: <FileText size={14} /> },
    { name: 'Araç Satış', slug: 'arac-satis-sozlesmesi', icon: <Car size={14} /> },
    { name: 'Genel İhtarname', slug: 'genel-ihtarname', icon: <Gavel size={14} /> },
];

function TemplateList() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        axios.get(`${API_BASE_URL}/sablonlar`) 
            .then(response => {
                setTemplates(response.data);
                setLoading(false);
            })
            .catch(error => {
                let errorMessage = 'Şablonlar yüklenirken bir hata oluştu.';
                if (error.response) {
                    errorMessage = `Sunucu hatası: ${error.response.status}`;
                } else if (error.request) {
                    errorMessage = 'Sunucuya ulaşılamadı. Lütfen ağ bağlantınızı kontrol edin.';
                }
                setError(errorMessage);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const query = params.get('search') || '';
        setSearchTerm(query);
    }, [location.search]);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        
        if (val) {
            navigate(`/sablonlar?search=${encodeURIComponent(val)}`, { replace: true });
        } else {
            navigate(`/sablonlar`, { replace: true });
        }
    };

    // Form submit edildiğinde sayfanın yenilenmesini engellemek için
    const handleSearchSubmit = (e) => {
        e.preventDefault();
    };

    const filteredTemplates = templates.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getPreviewImageUrl = (templateId) => {
        return `/template-previews/${templateId}.webp`; 
    };

    if (loading) {
        return (
            <div className={styles.statusContainer}>
                <Loader2 size={64} className={styles.spinner} />
                <p>Şablonlar Yükleniyor...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.statusContainerError}>
                <AlertCircle size={48} />
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className={styles.retryButton}>Yeniden Dene</button>
            </div>
        );
    }

    return (
        <> 
            <Helmet> 
                <title>Tüm Şablonlar - Belge Hızlı | Online Sözleşme Oluştur</title>
                <meta name="description" content="Kira sözleşmesi, iş sözleşmesi, freelancer anlaşması, dilekçe ve daha birçok hazır belge şablonu Belge Hızlı'da. Hemen seçin, doldurun, indirin." />
                <link rel="canonical" href="https://www.belgehizli.com/sablonlar" />
            </Helmet> 

            <div className={styles.listPageContainer}>
                <div className={styles.stickyBadgeWrapper}>
                    <div className={styles.freeBadge}>
                        <CheckCircle2 size={16} /> Tamamen Ücretsiz & Reklamsız
                    </div>
                </div>
                
                <div className={styles.listHeader}>
                    <h1 className={styles.sectionTitle}>Belgenizi Kolayca Oluşturun</h1> 
                    <p className={styles.subtitle}>
                        İhtiyacınız olan şablonu seçin, akıllı formu doldurun ve PDF olarak anında indirin.
                    </p>
                    <div className={styles.disclaimerBox}>
                        <Info size={16} className={styles.disclaimerIcon} />
                        <span>Şablonlarımız genel kullanıma uygundur, çok özel durumlar için profesyonel danışmanlık almanız önerilir.</span>
                    </div>
                </div>

                <div className={styles.searchSection}>
                    <form className={styles.searchBar} onSubmit={handleSearchSubmit}>
                        <Search className={styles.searchIcon} size={20} />
                        <input
                            type="text"
                            placeholder="Şablon ara (örn: kira, iş, dilekçe)..." 
                            value={searchTerm}
                            onChange={handleSearchChange} 
                        />
                        <button type="submit">Ara</button>
                    </form>

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
                </div>

                {filteredTemplates.length > 0 ? (
                    <div className={styles.templateGrid}>
                        {filteredTemplates.map(template => (
                            <Link to={`/sablonlar/detay/${template.slug}`} key={template._id} className={styles.templateCard}>
                                <div className={styles.cardImageContainer}>
                                    <img
                                        src={getPreviewImageUrl(template._id)} 
                                        alt={`${template.name} Önizleme`}
                                        className={styles.cardPreviewImage}
                                        loading="lazy"
                                        onError={(e) => { e.target.onerror = null; e.target.src = '/template-previews/placeholder.png'; }}
                                    />
                                    <div className={styles.imageOverlay}>
                                        <FileText size={48} color="white" />
                                        <span>Formu Doldur</span>
                                    </div>
                                </div>
                                <div className={styles.cardContent}>
                                    <h3 className={styles.cardTitle}>{template.name}</h3>
                                    <p className={styles.cardDescription}>{template.description}</p>
                                </div>
                                <div className={styles.cardFooter}>
                                    <span className={styles.cardLinkText}> 
                                        Hemen Doldur ve İndir <ArrowRight size={16} />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className={styles.noTemplatesMessage}>
                        <Search size={48} className={styles.noDataIcon} />
                        <p>Aradığınız "<strong>{searchTerm}</strong>" kriterlerine uygun şablon bulunamadı.</p>
                        <button onClick={() => handleSearchChange({ target: { value: '' } })} className={styles.clearSearchButton}>Aramayı Temizle</button>
                    </div>
                )}
            </div>
        </>
    );
}

export default TemplateList;