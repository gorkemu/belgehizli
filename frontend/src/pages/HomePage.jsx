import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './HomePage.module.css';
import { Helmet } from 'react-helmet-async';
import {
  FileText, Search, Home as HomeIcon, Car, Gavel, Sparkles, Zap,
  Check, Bold, Italic, Palette,
  Highlighter, Building2, Briefcase, Scale,
  GraduationCap, Heart, ShoppingCart,
  Type, Calendar, Hash, Wand2, ChevronDown, ArrowLeft
} from 'lucide-react';
import Button from '../components/ui/Button';

const POPULAR_CHIPS = [
  { name: 'Kira Sözleşmesi', slug: 'konut-kira-sozlesmesi', icon: <HomeIcon size={13} /> },
  { name: 'İstifa Dilekçesi', slug: 'istifa-dilekcesi', icon: <FileText size={13} /> },
  { name: 'Araç Satış', slug: 'arac-satis-sozlesmesi', icon: <Car size={13} /> },
  { name: 'İhtarname', slug: 'genel-ihtarname', icon: <Gavel size={13} /> },
];

const HERO_SLIDES = [
  {
    theme: 'default',
    tag: 'Hukuki Sözleşme',
    trigger: '{ }',
    title: 'Konut Kira Sözleşmesi',
    vars: ['kiralayan_isim', 'kiralayan_tc', 'kiraci_isim', 'kiraci_tc'],
    body: [
      { type: 'heading', text: 'KONUT KİRA SÖZLEŞMESİ' },
      { type: 'label', text: 'Madde 1 - Taraflar' },
      {
        type: 'para', parts: [
          { t: 'Bir tarafta kiralayan sıfatıyla ' }, { t: '{kiralayan_isim}', var: true },
          { t: ' (TC: ' }, { t: '{kiralayan_tc}', var: true }, { t: ') ile diğer tarafta kiracı sıfatıyla ' },
          { t: '{kiraci_isim}', var: true }, { t: ' (TC: ' }, { t: '{kiraci_tc}', var: true }, { t: ') arasında işbu sözleşme akdedilmiştir.' },
        ],
      },
      { type: 'label', text: 'Madde 2 - Kapsam ve Bedel' },
      {
        type: 'para', parts: [
          { t: 'Aylık kira bedeli net ' }, { t: '50.000', highlightTrigger: true },
          { t: ' TL olup, her ayın 5. günü ilgili banka hesabına peşin olarak yatırılacaktır.' },
        ],
      },
    ],
    bubbleMenu: { state: 'button' },
  },
  {
    theme: 'default',
    tag: 'Hukuki Sözleşme',
    trigger: '{ }',
    title: 'Konut Kira Sözleşmesi',
    vars: ['kiralayan_isim', 'kiralayan_tc', 'kiraci_isim', 'kiraci_tc'],
    body: [
      { type: 'heading', text: 'KONUT KİRA SÖZLEŞMESİ' },
      { type: 'label', text: 'Madde 1 - Taraflar' },
      {
        type: 'para', parts: [
          { t: 'Bir tarafta kiralayan sıfatıyla ' }, { t: '{kiralayan_isim}', var: true },
          { t: ' (TC: ' }, { t: '{kiralayan_tc}', var: true }, { t: ') ile diğer tarafta kiracı sıfatıyla ' },
          { t: '{kiraci_isim}', var: true }, { t: ' (TC: ' }, { t: '{kiraci_tc}', var: true }, { t: ') arasında işbu sözleşme akdedilmiştir.' },
        ],
      },
      { type: 'label', text: 'Madde 2 - Kapsam ve Bedel' },
      {
        type: 'para', parts: [
          { t: 'Aylık kira bedeli net ' }, { t: '50.000', highlightTrigger: true },
          { t: ' TL olup, her ayın 5. günü ilgili banka hesabına peşin olarak yatırılacaktır.' },
        ],
      },
    ],
    bubbleMenu: { state: 'input', inputText: 'Kira Bedeli' },
  },
  {
    theme: 'ink',
    tag: 'Ticari Sözleşme',
    trigger: '<< >>',
    title: 'Ticari Alım Satım Sözleşmesi',
    vars: ['satici_firma', 'alici_firma', 'teslim_sekli'],
    body: [
      { type: 'heading', text: 'TİCARİ MAL ALIM SATIM SÖZLEŞMESİ' },
      { type: 'label', text: 'Madde 1 - Sözleşmenin Konusu' },
      {
        type: 'para', parts: [
          { t: 'İşbu sözleşme, satıcı ' }, { t: '<<satici_firma>>', var: true },
          { t: ' ile alıcı ' }, { t: '<<alici_firma>>', var: true },
          { t: ' arasında emtianın alım satım şartlarını düzenler.' },
        ],
      },
      { type: 'label', text: 'Madde 2 - Gecikme Cezası' },
      {
        type: 'para', parts: [
          { t: 'Gecikilen her gün için toplam sipariş bedelinin %' },
          { t: '0.5', highlightTrigger: true },
          { t: '\'i oranında cezai şart ödenir.' },
        ],
      },
    ],
    bubbleMenu: { state: 'button' },
  },
  {
    theme: 'ink',
    tag: 'Ticari Sözleşme',
    trigger: '<< >>',
    title: 'Ticari Alım Satım Sözleşmesi',
    vars: ['satici_firma', 'alici_firma', 'teslim_sekli'],
    body: [
      { type: 'heading', text: 'TİCARİ MAL ALIM SATIM SÖZLEŞMESİ' },
      { type: 'label', text: 'Madde 1 - Sözleşmenin Konusu' },
      {
        type: 'para', parts: [
          { t: 'İşbu sözleşme, satıcı ' }, { t: '<<satici_firma>>', var: true },
          { t: ' ile alıcı ' }, { t: '<<alici_firma>>', var: true },
          { t: ' arasında emtianın alım satım şartlarını düzenler.' },
        ],
      },
      { type: 'label', text: 'Madde 2 - Gecikme Cezası' },
      {
        type: 'para', parts: [
          { t: 'Gecikilen her gün için toplam sipariş bedelinin %' },
          { t: '0.5', highlightTrigger: true },
          { t: '\'i oranında cezai şart ödenir.' },
        ],
      },
    ],
    bubbleMenu: { state: 'input', inputText: 'Ceza Şart Oranı' },
  },
  {
    theme: 'dark',
    tag: 'Teknik Sözleşme',
    trigger: '@',
    title: 'Yazılım Geliştirme Sözleşmesi',
    vars: ['proje_adi', 'gelistirici_unvan', 'musteri_unvan'],
    body: [
      { type: 'heading', text: 'YAZILIM GELİŞTİRME VE LİSANS SÖZLEŞMESİ' },
      { type: 'label', text: '1. Proje Tanımı' },
      {
        type: 'para', parts: [
          { t: 'Bu sözleşme, ' }, { t: '@musteri_unvan', var: true },
          { t: ' için ' }, { t: '@gelistirici_unvan', var: true },
          { t: ' tarafından kodlanacak olan ' }, { t: '@proje_adi', var: true },
          { t: ' sisteminin şartlarını belirler.' },
        ],
      },
      { type: 'label', text: '2. Bakım ve Destek' },
      {
        type: 'para', parts: [
          { t: 'Canlıya alımın ardından ' }, { t: '6 Ay', highlightTrigger: true },
          { t: ' boyunca yazılımsal hatalar ücretsiz giderilir.' },
        ],
      },
    ],
    bubbleMenu: { state: 'button' },
  },
  {
    theme: 'dark',
    tag: 'Teknik Sözleşme',
    trigger: '@',
    title: 'Yazılım Geliştirme Sözleşmesi',
    vars: ['proje_adi', 'gelistirici_unvan', 'musteri_unvan'],
    body: [
      { type: 'heading', text: 'YAZILIM GELİŞTİRME VE LİSANS SÖZLEŞMESİ' },
      { type: 'label', text: '1. Proje Tanımı' },
      {
        type: 'para', parts: [
          { t: 'Bu sözleşme, ' }, { t: '@musteri_unvan', var: true },
          { t: ' için ' }, { t: '@gelistirici_unvan', var: true },
          { t: ' tarafından kodlanacak olan ' }, { t: '@proje_adi', var: true },
          { t: ' sisteminin şartlarını belirler.' },
        ],
      },
      { type: 'label', text: '2. Bakım ve Destek' },
      {
        type: 'para', parts: [
          { t: 'Canlıya alımın ardından ' }, { t: '6 Ay', highlightTrigger: true },
          { t: ' boyunca yazılımsal hatalar ücretsiz giderilir.' },
        ],
      },
    ],
    bubbleMenu: { state: 'input', inputText: 'Bakım Süresi' },
  },
  {
    theme: 'forest',
    tag: 'Sağlık & Klinik',
    trigger: '[ ]',
    title: 'Aydınlatılmış Onam Formu',
    vars: ['hasta_adi_soyadi', 'hasta_tc', 'doktor_adi'],
    body: [
      { type: 'heading', text: 'AYDINLATILMIŞ ONAM VE RIZA BELGESİ' },
      { type: 'label', text: 'I. Hasta Bilgileri' },
      {
        type: 'para', parts: [
          { t: 'Ben, ' }, { t: '[hasta_adi_soyadi]', var: true }, { t: ' (TC: ' }, { t: '[hasta_tc]', var: true },
          { t: '), hastaneniz bünyesinde ' }, { t: '[doktor_adi]', var: true },
          { t: ' tarafından gerçekleştirilecek olan ' }, { t: 'Ortopedik Cerrahi', highlightTrigger: true },
          { t: ' operasyonuna onay veriyorum.' },
        ],
      },
    ],
    bubbleMenu: { state: 'button' },
  },
  {
    theme: 'forest',
    tag: 'Sağlık & Klinik',
    trigger: '[ ]',
    title: 'Aydınlatılmış Onam Formu',
    vars: ['hasta_adi_soyadi', 'hasta_tc', 'doktor_adi'],
    body: [
      { type: 'heading', text: 'AYDINLATILMIŞ ONAM VE RIZA BELGESİ' },
      { type: 'label', text: 'I. Hasta Bilgileri' },
      {
        type: 'para', parts: [
          { t: 'Ben, ' }, { t: '[hasta_adi_soyadi]', var: true }, { t: ' (TC: ' }, { t: '[hasta_tc]', var: true },
          { t: '), hastaneniz bünyesinde ' }, { t: '[doktor_adi]', var: true },
          { t: ' tarafından gerçekleştirilecek olan ' }, { t: 'Ortopedik Cerrahi', highlightTrigger: true },
          { t: ' operasyonuna onay veriyorum.' },
        ],
      },
    ],
    bubbleMenu: { state: 'input', inputText: 'Operasyon Adı' },
  }
];

function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fade, setFade] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const id = setInterval(() => {
      setFade(true);
      setTimeout(() => {
        setCurrentSlide(p => (p + 1) % HERO_SLIDES.length);
        setFade(false);
      }, 350);
    }, 5500);
    return () => clearInterval(id);
  }, []);

  const handleSearch = e => {
    e.preventDefault();
    if (searchTerm.trim()) navigate(`/sablonlar?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  const slide = HERO_SLIDES[currentSlide];

  return (
    <div className={styles.pageWrapper}>
      <Helmet>
        <title>Belge Hızlı — Akıllı Form ve Sözleşme Oluşturucu</title>
        <meta name="description" content="Sözleşme, dilekçe veya resmi yazılarınızı kolayca hazırlayabileceğiniz, akıllı form altyapısına sahip temiz belge çalışma alanı." />
      </Helmet>

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              Belge ve sözleşmeleri hazırlamanın<br />
              <span className={styles.heroAccent}>akıllı yolu</span>
            </h1>
            <p className={styles.heroSub}>
              Sık kullandığınız bir sözleşme, ihtarname veya teknik bir döküman...
              Ne yazıyor olursanız olun, metninizi saniyeler içinde doldurulabilir bir akıllı forma dönüştürün.
            </p>
            <div className={styles.heroCtas}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/kayit-ol')}
              >
                <span>Hemen Başlayın</span>
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/sablonlar')}
              >
                <span>Hazır Şablonlar</span>
              </Button>
            </div>
          </div>

          <div className={styles.heroMockup} data-theme={slide.theme}>
            <div className={styles.mockBar}>
              <div className={styles.mockDots}><span /><span /><span /></div>
              <div className={styles.mockFileName}>belge_taslak</div>
              <div className={styles.mockTag}>{slide.tag}</div>
            </div>

            <div className={styles.mockBody}>
              <div className={styles.mockSidebar}>
                <div className={styles.mockSideSection}>
                  <div className={styles.mockSideLabel}>Değişkenler</div>
                  {slide.vars.map(v => (
                    <div key={v} className={styles.mockVar}>
                      <span className={styles.mockVarBadge}>{slide.trigger.split(' ')[0]}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${styles.mockPaper} ${fade ? styles.paperFadeOut : styles.paperFadeIn}`}>
                {slide.body.map((block, i) => {
                  if (block.type === 'heading') return <div key={i} className={styles.mockH1}>{block.text}</div>;
                  if (block.type === 'label') return <div key={i} className={styles.mockLabel}>{block.text}</div>;
                  if (block.type === 'para') return (
                    <div key={i} className={styles.mockPara}>
                      {block.parts.map((part, j) =>
                        part.highlightTrigger ? (
                          <div key={j} className={styles.mockHighlightTrigger}>
                            {part.t}
                            {slide.bubbleMenu && (
                              <div className={styles.mockCombinedBubble}>
                                {slide.bubbleMenu.state === 'button' ? (
                                  <div className={styles.bubbleMagicBtn}>
                                    <Sparkles size={12} color="#fde047" /> Soruya Dönüştür
                                  </div>
                                ) : (
                                  <div className={styles.bubbleInputRow}>
                                    <div className={styles.bubbleInput}>{slide.bubbleMenu.inputText}</div>
                                    <div className={styles.bubbleConfirmBtn}>Ekle</div>
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
                  return null;
                })}
              </div>
            </div>

            <div className={styles.mockIndicators}>
              {HERO_SLIDES.map((_, i) => (
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

      <section className={styles.magicSection}>
        <div className={styles.magicInner}>
          <div className={styles.magicVisual}>
            <div className={styles.mvWindow}>
              <div className={styles.mvSidebar}>
                <div className={styles.mvSidebarHeader}>Form Soruları</div>
                <div className={styles.mvFieldList}>
                  <div className={styles.mvEmptyState}>Henüz soru yok</div>
                  <div className={`${styles.mvField} ${styles.mvField1}`}><Type size={12} /> Kiracı Adı</div>
                  <div className={`${styles.mvField} ${styles.mvField2}`}><Type size={12} /> TC Kimlik</div>
                  <div className={`${styles.mvField} ${styles.mvField3}`}><Calendar size={12} /> Başlangıç Tarihi</div>
                  <div className={`${styles.mvField} ${styles.mvField4}`}><Hash size={12} /> Kira Bedeli</div>
                </div>
              </div>
              <div className={styles.mvPaperArea}>
                <div className={styles.mvToolbar}>
                  <div className={styles.mvMagicBtn}>
                    <Wand2 size={13} /> Tümünü Algıla
                    <div className={styles.mvCursor}></div>
                  </div>
                </div>
                <div className={styles.mvPaper}>
                  <h3 className={styles.mvTitle}>KİRA SÖZLEŞMESİ</h3>
                  <div className={styles.mvPara}>
                    İşbu sözleşme, bir tarafta mülk sahibi ile diğer tarafta kiracı sıfatıyla <span className={styles.mvVar}>{'@'}kiraci_adi</span> (TC: <span className={styles.mvVar}>{'@'}tc_kimlik</span>) arasında akdedilmiştir.
                  </div>
                  <div className={styles.mvPara}>
                    Sözleşme <span className={styles.mvVar}>{'@'}baslangic_tarihi</span> tarihinde yürürlüğe girecek olup, aylık kira bedeli <span className={styles.mvVar}>{'@'}kira_bedeli</span> TL olarak belirlenmiştir.
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.magicText}>
            <h2>Saniyeler içinde form oluşturun</h2>
            <p>
              Zaten hazırladığınız bir taslağınız mı var? Metni çalışma alanına yapıştırın veya sürükleyerek bırakın.{' '}
              <span
                className={styles.mvMagicBtn}
                style={{ display: 'inline-flex', animation: 'none' }}
              >
                <Wand2 size={13} />
                Tümünü Algıla
              </span>{' '}
              butonu ile sistem, metninizdeki tüm değişkenleri otomatik bulur ve formunuzu sizin yerinize kurar.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.bubbleSection}>
        <div className={styles.bubbleInner}>
          <div className={styles.bubbleText}>
            <h2>Metni seçin, soruya dönüşsün</h2>
            <p>Her belgede değişecek olan kelimeleri seçin ve tek tıkla dinamik bir form sorusuna çevirin.</p>
          </div>
          <div className={styles.bubbleVisual}>
            <div className={styles.bvPaper}>
              <h3 className={styles.bvTitle}>HİZMET SÖZLEŞMESİ</h3>
              <p>Madde 1</p>
              <div className={styles.bvPara}>
                İşbu hizmet sözleşmesi, bir tarafta hizmet sağlayıcı konumundaki{' '}
                <span className={styles.bvSelection}>Ahmet Yılmaz</span>{' '}
                ile diğer tarafta hizmet alıcı konumundaki TechBrand arasında...
              </div>
              <div className={styles.bvBubbleMenu}>
                <div className={styles.bvMagicBtn}><Sparkles size={14} color="#fde047" /> Soruya Dönüştür</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.logicSection}>
        <div className={styles.logicInner}>
          
          <div className={styles.logicVisual}>
            <div className={styles.lvWindow}>
              <div className={styles.lvSidebar}>
                <div className={styles.lvHeader}>
                  <div className={styles.lvDots}><span /><span /><span /></div>
                  <span className={styles.lvTitle}>Test Formu</span>
                </div>
                <div className={styles.lvFormGroup}>
                  <label>Evcil Hayvan İzni</label>
                  <div className={styles.lvSelectMock}>
                    <span className={styles.valNo}>Hayır</span>
                    <span className={styles.valYes}>Evet</span>
                    <ChevronDown size={14} className={styles.lvChevron} />
                    <div className={styles.lvCursor}></div>
                  </div>
                </div>
                <div className={styles.lvFormGroupPlaceholder}></div>
                <div className={styles.lvFormGroupPlaceholder} style={{ width: '70%' }}></div>
              </div>
              <div className={styles.lvPaperArea}>
                <div className={styles.lvPaper}>
                  <div className={styles.lvH1}>KİRA SÖZLEŞMESİ</div>
                  <div className={styles.lvPara}>Kiracı, kiralayanın yazılı izni olmadan demirbaşlarda değişiklik yapamaz. Yapılan tüm masraflar kiracıya aittir.</div>
                  <div className={styles.lvCondBlock}>
                    <div className={styles.lvCondTag}><Zap size={10} /> Eğer "Evcil Hayvan" = "Evet" ise göster</div>
                    <div className={styles.lvPara} style={{ color: '#1e40af' }}>Kiracı, evcil hayvanının apartman ortak alanlarında yaratabileceği her türlü rahatsızlık ve zarardan şahsen sorumludur. Gerekli hijyen kurallarına uyulacaktır.</div>
                  </div>
                  <div className={styles.lvPara}>İşbu sözleşme tarafların karşılıklı iradesi ile imza altına alınmış ve birer nüshası teslim edilmiştir.</div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.logicText}>
            <h2>Sorulara göre şekillenen belgeler</h2>
            <p>Her müşteri veya durum için ayrı sözleşme taslakları hazırlamanıza gerek yok. "Şartlı Bloklar" sayesinde, formdaki bir cevaba göre belgenizin belirli bölümlerini otomatik olarak gizleyin veya gösterin.</p>
          </div>
        </div>
      </section>

      <section className={styles.useCasesSection}>
        <div className={styles.useCasesInner}>
          <div className={styles.sectionHead}>
            <h2>Her Sektöre Uygun Çözümler</h2>
            <p>Değişkenler ve formlar sayesinde hangi alanda olursanız olun operasyonel yükünüzü hafifletin.</p>
          </div>
          <div className={styles.useCasesGrid}>
            {[
              { icon: <Briefcase size={24} />, title: 'İnsan Kaynakları', desc: 'İş sözleşmeleri, referans mektupları, iş teklifleri ve yan haklar bildirimlerini anında özelleştirin.' },
              { icon: <Scale size={24} />, title: 'Hukuk & Emlak', desc: 'İhtarnameler, kira sözleşmeleri, vekaletnameler ve gayrimenkul alım satım taahhütlerini dinamik olarak oluşturun.' },
              { icon: <Building2 size={24} />, title: 'Freelancer & Ajanslar', desc: 'Proje teklifleri, gizlilik sözleşmeleri ve hizmet bedeli anlaşmalarını saniyeler içinde kişiselleştirin.' },
              { icon: <GraduationCap size={24} />, title: 'Eğitim & Akademi', desc: 'Öğrenci kabul mektupları, staj sözleşmeleri ve tez danışmanlık formlarını otomatikleştirin.' },
              { icon: <Heart size={24} />, title: 'Sağlık & Klinik', desc: 'Hasta bilgilendirme formları, rıza belgeleri ve muayene raporlarını hızlıca kişiselleştirin.' },
              { icon: <ShoppingCart size={24} />, title: 'E-ticaret & Perakende', desc: 'Tedarikçi sözleşmeleri, iade politikaları ve bayi anlaşmalarını dinamik olarak oluşturun.' },
            ].map(c => (
              <div key={c.title} className={styles.useCaseCard}>
                <div className={styles.ucIcon}>{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="sablonlar" className={styles.searchSection}>
        <div className={styles.searchInner}>
          <div className={styles.sectionHead}>
            <h2>Hazır bir taslak mı arıyorsunuz?</h2>
            <p>Sıfırdan başlamak istemiyorsanız, önceden hazırlanmış genel geçer şablonlarımıza göz atıp anında PDF çıktısı alabilirsiniz.</p>
          </div>
          <form className={styles.searchBar} onSubmit={handleSearch}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Örn: Kira sözleşmesi, istifa dilekçesi, ihtarname..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button type="submit">Şablon Bul</button>
          </form>
          <div className={styles.chips}>
            <span className={styles.chipsLabel}>Sık kullanılanlar:</span>
            {POPULAR_CHIPS.map(chip => (
              <button key={chip.slug} onClick={() => navigate(`/sablonlar/detay/${chip.slug}`)} className={styles.chip} type="button">
                {chip.icon} {chip.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <div className={styles.ctaContent}>
            <h2>Çalışma alanınızı oluşturun</h2>
            <p>Kendi şablonlarınızı oluşturup kaydetmek için hesap açın.</p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/kayit-ol')}
            >
              <span>Hemen Başlayın</span>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;