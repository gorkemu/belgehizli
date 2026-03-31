import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './TemplateList.module.css';
import { Helmet } from 'react-helmet-async';
import { Search, FileText, ArrowRight, AlertCircle, Info, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const CATEGORIES = [
  { id: 'all', label: 'Tümü', keywords: [] },
  { id: 'gayrimenkul', label: '🏠 Gayrimenkul', keywords: ['kira', 'taşınmaz', 'arsa', 'gayrimenkul', 'ev', 'tahliye', 'tapu', 'emlak'] },
  { id: 'is-kariyer', label: '💼 İş & Kariyer', keywords: ['işçi', 'işveren', 'istifa', 'freelancer', 'staj', 'cv', 'özgeçmiş', 'personel', 'bakım'] },
  { id: 'ticari', label: '🏢 Ticari', keywords: ['ortaklık', 'satış', 'teklif', 'danışmanlık', 'gizlilik', 'nda', 'devir', 'gider', 'pazarlama', 'hizmet'] },
  { id: 'dilekce', label: '⚖️ Dilekçe & İhtarname', keywords: ['dilekçe', 'ihtarname', 'şikayet', 'başvuru', 'tespit', 'tutanak'] },
  { id: 'bireysel', label: '🤝 Bireysel', keywords: ['araç', 'borç', 'ödünç', 'emanet', 'eşya', 'fotoğraf', 'evlilik', 'miras', 'seyahat', 'muvafakatname'] }
];

function TemplateList() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [visibleCount, setVisibleCount] = useState(12);

  const categoryScrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/sablonlar`)
      .then(response => {
        setTemplates(response.data);
        setLoading(false);
        setTimeout(handleScroll, 100);
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

  useEffect(() => {
    setVisibleCount(12);
  }, [searchTerm, activeCategory, templates]);

  const handleScroll = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 5);
    }
  };

  const scrollCategory = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = 250;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  useEffect(() => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollLeft = 0;
      handleScroll();
    }
  }, [activeCategory]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (val) {
      navigate(`/sablonlar?search=${encodeURIComponent(val)}`, { replace: true });
    } else {
      navigate(`/sablonlar`, { replace: true });
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCategory = true;
    if (activeCategory !== 'all') {
      const categoryObj = CATEGORIES.find(c => c.id === activeCategory);
      matchesCategory = categoryObj.keywords.some(kw => 
        template.name.toLowerCase().includes(kw) || 
        template.slug.includes(kw)
      );
    }
    return matchesSearch && matchesCategory;
  });

  const displayedTemplates = filteredTemplates.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 12);
  };

  const getPreviewImageUrl = (templateId) => {
    return `/template-previews/${templateId}.webp`;
  };

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

          <div className={styles.categoryWrapper}>
            {showLeftArrow && (
              <button 
                className={`${styles.scrollArrow} ${styles.scrollArrowLeft}`} 
                onClick={() => scrollCategory('left')}
                aria-label="Sola Kaydır"
              >
                <ChevronLeft size={20} />
              </button>
            )}

            <div 
              className={styles.categoryScroll} 
              ref={categoryScrollRef} 
              onScroll={handleScroll}
            >
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setActiveCategory(category.id);
                    setSearchTerm(''); 
                    navigate('/sablonlar', { replace: true });
                  }}
                  className={`${styles.categoryTab} ${activeCategory === category.id ? styles.categoryTabActive : ''}`}
                  type="button"
                >
                  {category.label}
                </button>
              ))}
            </div>

            {showRightArrow && (
              <button 
                className={`${styles.scrollArrow} ${styles.scrollArrowRight}`} 
                onClick={() => scrollCategory('right')}
                aria-label="Sağa Kaydır"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className={styles.templateGrid}>
            {[...Array(8)].map((_, index) => (
              <div key={index} className={`${styles.templateCard} ${styles.skeletonCard}`}>
                <div className={styles.skeletonImage}></div>
                <div className={styles.cardContent}>
                  <div className={styles.skeletonTitle}></div>
                  <div className={styles.skeletonDesc}></div>
                  <div className={`${styles.skeletonDesc} ${styles.skeletonDescShort}`}></div>
                </div>
                <div className={styles.cardFooter}>
                  <div className={styles.skeletonButton}></div>
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
            {visibleCount < filteredTemplates.length && (
              <div className={styles.loadMoreContainer}>
                <button onClick={handleLoadMore} className={styles.loadMoreButton}>
                  Daha Fazla Şablon Göster ({filteredTemplates.length - visibleCount} kaldı)
                </button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.noTemplatesMessage}>
            <Search size={48} className={styles.noDataIcon} />
            <p>Seçilen kriterlere uygun şablon bulunamadı.</p>
            <button onClick={() => { setSearchTerm(''); setActiveCategory('all'); }} className={styles.clearSearchButton}>
              Aramayı Temizle
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default TemplateList;