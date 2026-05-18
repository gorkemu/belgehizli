// frontend/src/pages/HomePage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import styles from './HomePage.module.css';
import { SEOHead } from '../components/SEOHead';
import {
  FileText, Search, Home as HomeIcon, Car, Gavel, Sparkles, Zap,
  Building2, Briefcase, Scale,
  GraduationCap, Heart, ShoppingCart,
  Type, Calendar, Hash, Wand2, ChevronDown
} from 'lucide-react';
import Button from '../components/ui/Button';

const getPopularChips = (t, currentLang) => {
  const slugs = {
    tr: { lease: 'konut-kira-sozlesmesi', resignation: 'istifa-dilekcesi-isci-tarafindan-fesih', vehicle: 'arac-satis-sozlesmesi', notice: 'genel-ihtarname' },
    en: { lease: 'residential-lease-agreement', resignation: 'letter-of-resignation', vehicle: 'motor-vehicle-bill-of-sale', notice: 'formal-demand-letter-legal-notice' },
  };

  const activeSlugs = slugs[currentLang] || slugs['en'];

  return [
    { name: t('homePage.chips.leaseAgreement'), slug: activeSlugs.lease, icon: <HomeIcon size={13} /> },
    { name: t('homePage.chips.resignationLetter'), slug: activeSlugs.resignation, icon: <FileText size={13} /> },
    { name: t('homePage.chips.vehicleSale'), slug: activeSlugs.vehicle, icon: <Car size={13} /> },
    { name: t('homePage.chips.legalNotice'), slug: activeSlugs.notice, icon: <Gavel size={13} /> },
  ];
};

function HomePage() {
  const { t } = useTranslation();
  const { lang } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fade, setFade] = useState(false);
  const currentLang = lang || 'tr';
  const popularChips = getPopularChips(t, currentLang);
  const registerRoute = currentLang === 'tr' ? 'kayit-ol' : 'register';
  const libraryRoute = currentLang === 'tr' ? 'sablonlar' : 'templates';
  const detailRoute = currentLang === 'tr' ? 'sablonlar/detay' : 'templates/detail';

  useEffect(() => {
    const id = setInterval(() => {
      setFade(true);
      setTimeout(() => {
        setCurrentSlide(p => (p + 1) % heroSlides.length);
        setFade(false);
      }, 350);
    }, 5500);
    return () => clearInterval(id);
  }, []);

  const handleSearch = e => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/${currentLang}/${libraryRoute}?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  /* ---------- Hero Slides ---------- */
  const heroSlides = useMemo(() => {
    const getVars = (key) => t(`homePage.slides.${key}.vars`, { returnObjects: true }) || [];

    const makeSlide = (key, bubbleState) => ({
      theme: key,
      tag: t(`homePage.slides.${key}.tag`),
      trigger: t(`homePage.slides.${key}.trigger`),
      title: t(`homePage.slides.${key}.title`),
      vars: getVars(key),
      body: t(`homePage.slides.${key}.body`, { returnObjects: true }) || [],
      bubbleMenu: bubbleState
        ? { state: 'input', inputText: t(`homePage.slides.${key}.bubbleInput`) }
        : { state: 'button' },
    });

    return [
      makeSlide('default', false),
      makeSlide('default', true),
      makeSlide('ink', false),
      makeSlide('ink', true),
      makeSlide('dark', false),
      makeSlide('dark', true),
      makeSlide('forest', false),
      makeSlide('forest', true),
    ];
  }, [t]);

  const slide = heroSlides[currentSlide];

  /* ---------- Yardımcı: renderSlideBody ---------- */
  const renderSlideBody = (block, idx) => {
    if (block.type === 'heading') return <div key={idx} className={styles.mockH1}>{block.text}</div>;
    if (block.type === 'label') return <div key={idx} className={styles.mockLabel}>{block.text}</div>;
    if (block.type === 'para') {
      return (
        <div key={idx} className={styles.mockPara}>
          {block.parts.map((part, j) =>
            part.highlightTrigger ? (
              <div key={j} className={styles.mockHighlightTrigger}>
                {part.t}
                {slide.bubbleMenu && (
                  <div className={styles.mockCombinedBubble}>
                    {slide.bubbleMenu.state === 'button' ? (
                      <div className={styles.bubbleMagicBtn}>
                        <Sparkles size={12} color="#fde047" /> {t('homePage.convertToQuestion')}
                      </div>
                    ) : (
                      <div className={styles.bubbleInputRow}>
                        <div className={styles.bubbleInput}>{slide.bubbleMenu.inputText}</div>
                        <div className={styles.bubbleConfirmBtn}>{t('homePage.add')}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : part.var ? (
              <mark key={j} className={styles.mockHighlight}>{part.t}</mark>
            ) : (
              <span key={j}>{part.t}</span>
            )
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.pageWrapper}>
      <SEOHead
        titleKey="homePage.pageTitle"
        descKey="homePage.metaDescription"
      />

      {/* ======================= HERO ======================= */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              <Trans
                i18nKey="homePage.hero"
                components={{
                  1: <span className={styles.heroAccent} />,
                }}
              />
            </h1>
            <p className={styles.heroSub}>{t('homePage.heroSub')}</p>
            <div className={styles.heroCtas}>
              <Button variant="primary" size="lg" onClick={() => navigate(`/${currentLang}/${registerRoute}`)}>
                <span>{t('homePage.startNow')}</span>
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate(`/${currentLang}/${libraryRoute}`)}>
                <span>{t('homePage.readyTemplates')}</span>
              </Button>
            </div>
          </div>

          <div className={styles.heroMockup} data-theme={slide.theme}>
            <div className={styles.mockBar}>
              <div className={styles.mockDots}><span /><span /><span /></div>
              <div className={styles.mockFileName}>{t('homePage.mockFileName')}</div>
              <div className={styles.mockTag}>{slide.tag}</div>
            </div>

            <div className={styles.mockBody}>
              <div className={styles.mockSidebar}>
                <div className={styles.mockSideSection}>
                  <div className={styles.mockSideLabel}>{t('homePage.variables')}</div>
                  {slide.vars.map(v => (
                    <div key={v} className={styles.mockVar}>
                      <span className={styles.mockVarBadge}>{slide.trigger.split(' ')[0]}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${styles.mockPaper} ${fade ? styles.paperFadeOut : styles.paperFadeIn}`}>
                {slide.body.map(renderSlideBody)}
              </div>
            </div>

            <div className={styles.mockIndicators}>
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.mockDot} ${i === currentSlide ? styles.mockDotActive : ''}`}
                  onClick={() => setCurrentSlide(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======================= MAGIC (Create forms in seconds) ======================= */}
      <section className={styles.magicSection}>
        <div className={styles.magicInner}>
          <div className={styles.magicVisual}>
            <div className={styles.mvWindow}>
              <div className={styles.mvSidebar}>
                <div className={styles.mvSidebarHeader}>{t('homePage.magicSidebarTitle')}</div>
                <div className={styles.mvFieldList}>
                  <div className={styles.mvEmptyState}>{t('homePage.magicEmptyState')}</div>
                  {['magicField1', 'magicField2', 'magicField3', 'magicField4'].map((key, idx) => (
                    <div key={key} className={`${styles.mvField} ${styles[`mvField${idx + 1}`]}`}>
                      {idx === 2 ? <Calendar size={12} /> : idx === 3 ? <Hash size={12} /> : <Type size={12} />}
                      {t(`homePage.${key}`)}
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.mvPaperArea}>
                <div className={styles.mvToolbar}>
                  <div className={styles.mvMagicBtn}>
                    <Wand2 size={13} /> {t('homePage.detectAll')}
                    <div className={styles.mvCursor}></div>
                  </div>
                </div>
                <div className={styles.mvPaper}>
                  <h3 className={styles.mvTitle}>{t('homePage.magicPaperTitle')}</h3>
                  <div className={styles.mvPara}>
                    {t('homePage.magicPaperPara1')} <span className={styles.mvVar}>{t('homePage.magicVarLessee')}</span> (TC: <span className={styles.mvVar}>{t('homePage.magicVarLesseeId')}</span>) {t('homePage.magicPaperPara1Suffix')}
                  </div>
                  <div className={styles.mvPara}>
                    {t('homePage.magicPaperPara2a')} <span className={styles.mvVar}>{t('homePage.magicVarStartDate')}</span> {t('homePage.magicPaperPara2b')} <span className={styles.mvVar}>{t('homePage.magicVarRent')}</span> {t('homePage.magicPaperPara2Suffix')}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.magicText}>
            <h2>{t('homePage.magicTitle')}</h2>
            <p>{t('homePage.magicDescription')}</p>
          </div>
        </div>
      </section>

      {/* ======================= BUBBLE (Select text) ======================= */}
      <section className={styles.bubbleSection}>
        <div className={styles.bubbleInner}>
          <div className={styles.bubbleText}>
            <h2>{t('homePage.bubbleTitle')}</h2>
            <p>{t('homePage.bubbleDescription')}</p>
          </div>
          <div className={styles.bubbleVisual}>
            <div className={styles.bvPaper}>
              <h3 className={styles.bvTitle}>{t('homePage.bubblePaperTitle')}</h3>
              <p>{t('homePage.bubblePaperArticle')}</p>
              <div className={styles.bvPara}>
                {t('homePage.bubblePaperPara1')}{' '}
                <span className={styles.bvSelection}>{t('homePage.bubblePaperSelection')}</span>{' '}
                {t('homePage.bubblePaperPara2')}
              </div>
              <div className={styles.bvBubbleMenu}>
                <div className={styles.bvMagicBtn}><Sparkles size={14} color="#fde047" /> {t('homePage.convertToQuestion')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================= LOGIC (Conditional blocks) ======================= */}
      <section className={styles.logicSection}>
        <div className={styles.logicInner}>
          <div className={styles.logicVisual}>
            <div className={styles.lvWindow}>
              <div className={styles.lvSidebar}>
                <div className={styles.lvHeader}>
                  <div className={styles.lvDots}><span /><span /><span /></div>
                  <span className={styles.lvTitle}>{t('homePage.logicSidebarTitle')}</span>
                </div>
                <div className={styles.lvFormGroup}>
                  <label>{t('homePage.logicQuestion')}</label>
                  <div className={styles.lvSelectMock}>
                    <span className={styles.valNo}>{t('homePage.no')}</span>
                    <span className={styles.valYes}>{t('homePage.yes')}</span>
                    <ChevronDown size={14} className={styles.lvChevron} />
                    <div className={styles.lvCursor}></div>
                  </div>
                </div>
                <div className={styles.lvFormGroupPlaceholder}></div>
                <div className={styles.lvFormGroupPlaceholder} style={{ width: '70%' }}></div>
              </div>
              <div className={styles.lvPaperArea}>
                <div className={styles.lvPaper}>
                  <div className={styles.lvH1}>{t('homePage.logicPaperTitle')}</div>
                  <div className={styles.lvPara}>{t('homePage.logicPaperPara1')}</div>
                  <div className={styles.lvCondBlock}>
                    <div className={styles.lvPara}>{t('homePage.logicConditionPara')}</div>
                  </div>
                  <div className={styles.lvPara}>{t('homePage.logicPaperPara2')}</div>
                  <div className={styles.lvSpacer}></div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.logicText}>
            <h2>{t('homePage.logicTitle')}</h2>
            <p>{t('homePage.logicDescription')}</p>
          </div>
        </div>
      </section>

      {/* ======================= USE CASES ======================= */}
      <section className={styles.useCasesSection}>
        <div className={styles.useCasesInner}>
          <div className={styles.sectionHead}>
            <h2>{t('homePage.useCasesTitle')}</h2>
            <p>{t('homePage.useCasesDescription')}</p>
          </div>
          <div className={styles.useCasesGrid}>
            {[
              { icon: <Briefcase size={24} />, titleKey: 'homePage.useCases.hr', descKey: 'homePage.useCases.hrDesc' },
              { icon: <Scale size={24} />, titleKey: 'homePage.useCases.legal', descKey: 'homePage.useCases.legalDesc' },
              { icon: <Building2 size={24} />, titleKey: 'homePage.useCases.freelancer', descKey: 'homePage.useCases.freelancerDesc' },
              { icon: <GraduationCap size={24} />, titleKey: 'homePage.useCases.education', descKey: 'homePage.useCases.educationDesc' },
              { icon: <Heart size={24} />, titleKey: 'homePage.useCases.health', descKey: 'homePage.useCases.healthDesc' },
              { icon: <ShoppingCart size={24} />, titleKey: 'homePage.useCases.ecommerce', descKey: 'homePage.useCases.ecommerceDesc' },
            ].map(c => (
              <div key={c.titleKey} className={styles.useCaseCard}>
                <div className={styles.ucIcon}>{c.icon}</div>

                <div className={styles.ucContent}>
                  <h3>{t(c.titleKey)}</h3>
                  <p>{t(c.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= SEARCH ======================= */}
      <section id="sablonlar" className={styles.searchSection}>
        <div className={styles.searchInner}>
          <div className={styles.sectionHead}>
            <h2>{t('homePage.searchTitle')}</h2>
            <p>{t('homePage.searchDescription')}</p>
          </div>
          <form className={styles.searchBar} onSubmit={handleSearch}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder={t('homePage.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button type="submit">{t('homePage.findTemplate')}</button>
          </form>
          <div className={styles.chips}>
            <span className={styles.chipsLabel}>{t('homePage.frequentlyUsed')}:</span>
            {popularChips.map(chip => (
              <button
                key={chip.slug}
                onClick={() => navigate(`/${currentLang}/${detailRoute}/${chip.slug}`)}
                className={styles.chip}
                type="button"
              >
                {chip.icon} {chip.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= CTA ======================= */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <div className={styles.ctaContent}>
            <h2>{t('homePage.ctaTitle')}</h2>
            <p>{t('homePage.ctaDescription')}</p>
            <Button variant="primary" size="lg" onClick={() => navigate(`/${currentLang}/${registerRoute}`)}>
              <span>{t('homePage.startNow')}</span>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;