// frontend/src/pages/TemplateList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './TemplateList.module.css';
import { Helmet } from 'react-helmet-async';
import {
  Search, FileText, ArrowRight, AlertCircle, Info,
  Loader2, Home, Briefcase, Landmark, Scale, User, FolderKanban
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const CATEGORIES = [
  { id: 'all', label: 'Tüm Şablonlar', icon: <FolderKanban size={16} />, keywords: [] },
  { id: 'gayrimenkul', label: 'Gayrimenkul', icon: <Home size={16} />, keywords: ['kira', 'taşınmaz', 'arsa', 'gayrimenkul', 'ev', 'tahliye', 'tapu', 'emlak'] },
  { id: 'is-kariyer', label: 'İş & Kariyer', icon: <Briefcase size={16} />, keywords: ['işçi', 'işveren', 'istifa', 'freelancer', 'staj', 'cv', 'özgeçmiş', 'personel', 'bakım'] },
  { id: 'ticari', label: 'Ticari', icon: <Landmark size={16} />, keywords: ['ortaklık', 'satış', 'teklif', 'danışmanlık', 'gizlilik', 'nda', 'devir', 'gider', 'pazarlama', 'hizmet'] },
  { id: 'dilekce', label: 'Dilekçe & İhtarname', icon: <Scale size={16} />, keywords: ['dilekçe', 'ihtarname', 'şikayet', 'başvuru', 'tespit', 'tutanak'] },
  { id: 'bireysel', label: 'Bireysel', icon: <User size={16} />, keywords: ['araç', 'borç', 'ödünç', 'emanet', 'eşya', 'fotoğraf', 'evlilik', 'miras', 'seyahat', 'muvafakatname'] }
];

function TemplateList() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [visibleCount, setVisibleCount] = useState(12);
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
        if (error.response) errorMessage = `Sunucu hatası: ${error.response.status}`;
        else if (error.request) errorMessage = 'Sunucuya ulaşılamadı. Lütfen ağ bağlantınızı kontrol edin.';
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
    navigate(val ? `/sablonlar?search=${encodeURIComponent(val)}` : '/sablonlar', { replace: true });
  };

  const handleSearchSubmit = (e) => e.preventDefault();

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesCategory = true;
    if (activeCategory !== 'all') {
      const categoryObj = CATEGORIES.find(c => c.id === activeCategory);
      matchesCategory = categoryObj.keywords.some(kw =>
        template.name.toLowerCase().includes(kw) || template.slug.includes(kw)
      );
    }
    return matchesSearch && matchesCategory;
  });

  const displayedTemplates = filteredTemplates.slice(0, visibleCount);
  const handleLoadMore = () => setVisibleCount(prev => prev + 12);

  const getPreviewImageUrl = (templateId) => `/template-previews/${templateId}.webp`;

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
    <div className={styles.pageWrapper}>
      <Helmet>
        <title>Açık Kütüphane - Belge Hızlı</title>
        <meta name="description" content="Kira sözleşmesi, iş sözleşmesi, freelancer anlaşması ve dilekçe şablonları. Sıfırdan başlamayın, formu doldurun ve belgenizi anında alın." />
        <link rel="canonical" href="https://www.belgehizli.com/sablonlar" />
      </Helmet>

      <div className={styles.disclaimerBanner}>
        <div className={styles.disclaimerInner}>
          <Info size={16} className={styles.disclaimerIcon} />
          <span>Bu kütüphanedeki şablonlar genel kullanıma uygundur. Çok spesifik hukuki durumlarınız için profesyonel danışmanlık almanız önerilir.</span>
        </div>
      </div>

      <div className={styles.listPageContainer}>

        <div className={styles.listHeader}>
          <div className={styles.badge}>
            <FileText size={13} />
            <span>Açık Kütüphane</span>
          </div>

          <h1 className={styles.sectionTitle}>Hazır Şablonlar</h1>
          <p className={styles.subtitle}>
            Sıfırdan başlamanıza gerek yok. İhtiyacınız olan taslağı seçin,
            sistemin size soracağı soruları yanıtlayın ve saniyeler içinde eksiksiz PDF çıktınızı alın.
          </p>

          <form className={styles.searchBar} onSubmit={handleSearchSubmit}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Şablon ara (örn: kira, iş, dilekçe)..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <button type="submit">Hızlı Ara</button>
          </form>

          <div className={styles.categoryWrapper}>
            {CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  setSearchTerm('');
                  navigate('/sablonlar', { replace: true });
                }}
                className={`${styles.categoryTab} ${activeCategory === category.id ? styles.categoryTabActive : ''}`}
              >
                {category.icon}
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={styles.templateGrid}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`${styles.templateCard} ${styles.skeletonCard}`}>
                <div className={styles.skeletonImage}></div>
                <div className={styles.cardContent}>
                  <div className={styles.skeletonTitle}></div>
                  <div className={styles.skeletonDesc}></div>
                  <div className={`${styles.skeletonDesc} ${styles.skeletonDescShort}`}></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredTemplates.length > 0 ? (
          <>
            <div className={styles.templateGrid}>
              {displayedTemplates.map(template => (
                <Link to={`/sablonlar/detay/${template.slug}`} key={template._id} className={styles.templateCard}>
                  <div className={styles.cardImageContainer}>
                    <img
                      src={getPreviewImageUrl(template._id)}
                      alt={template.name}
                      className={styles.cardPreviewImage}
                      loading="lazy"
                      onError={(e) => { e.target.onerror = null; e.target.src = '/template-previews/placeholder.png'; }}
                    />
                    <div className={styles.imageOverlay}>
                      <div className={styles.overlayAction}>
                        <FileText size={18} /> Formu Görüntüle
                      </div>
                    </div>
                  </div>
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>{template.name}</h3>
                    <p className={styles.cardDescription}>{template.description}</p>
                    <div className={styles.cardFooter}>
                      <span className={styles.cardLinkText}>
                        Şablonu İncele <ArrowRight size={16} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {visibleCount < filteredTemplates.length && (
              <div className={styles.loadMoreContainer}>
                <button onClick={handleLoadMore} className={styles.loadMoreButton}>
                  Daha Fazla Göster
                </button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.noTemplatesMessage}>
            <div className={styles.noDataIconWrap}>
              <Search size={32} />
            </div>
            <h3>Şablon bulunamadı</h3>
            <p>Aradığınız kriterlere uygun bir taslak kütüphanemizde yer almıyor.</p>
            <button onClick={() => { setSearchTerm(''); setActiveCategory('all'); }} className={styles.clearSearchButton}>
              Filtreleri Temizle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TemplateList;