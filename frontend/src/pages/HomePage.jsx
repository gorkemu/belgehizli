// frontend/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './HomePage.module.css';
import { Helmet } from 'react-helmet-async';
import {
  FileText, Search, Home as HomeIcon, Car, Gavel, Sparkles, Zap,
  Check, Heading1, Bold, Italic, Palette,
  Highlighter, Building2, Briefcase, Scale, Moon,
  Heading3, GraduationCap, Heart, ShoppingCart,
  Maximize, Keyboard, List, Type, Calendar, Hash, Wand2, ChevronDown
} from 'lucide-react';

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
    vars: ['kiralayan_isim', 'kiralayan_tc', 'kiralayan_adres', 'kiraci_isim', 'kiraci_tc'],
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
      {
        type: 'para', parts: [
          { t: 'Kiralayanın tebligat adresi: ' }, { t: '{kiralayan_adres}', var: true },
          { t: ' olarak belirlenmiştir.' },
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
    theme: 'ink',
    tag: 'Ticari Sözleşme',
    trigger: '<< >>',
    title: 'Ticari Alım Satım Sözleşmesi',
    vars: ['satici_firma', 'alici_firma', 'teslim_sekli', 'teslim_suresi'],
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
    bubbleMenu: { state: 'input', inputText: 'Ceza Şart Oranı', fieldType: 'Sayı' },
  },
  {
    theme: 'dark',
    tag: 'Teknik Sözleşme',
    trigger: '{{ }}',
    title: 'Yazılım Geliştirme Sözleşmesi',
    vars: ['proje_adi', 'gelistirici_unvan', 'musteri_unvan', 'proje_dili'],
    body: [
      { type: 'heading', text: 'YAZILIM GELİŞTİRME VE LİSANS SÖZLEŞMESİ' },
      { type: 'label', text: '1. Proje Tanımı' },
      {
        type: 'para', parts: [
          { t: 'Bu sözleşme, ' }, { t: '{{musteri_unvan}}', var: true },
          { t: ' için ' }, { t: '{{gelistirici_unvan}}', var: true },
          { t: ' tarafından kodlanacak olan ' }, { t: '{{proje_adi}}', var: true },
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
    theme: 'glacier',
    tag: 'Dilekçe',
    trigger: '@',
    title: 'Genel İhtarname',
    vars: ['ihtar_eden', 'ihtar_eden_tc', 'muhatap_unvan', 'muhatap_adres'],
    body: [
      { type: 'heading', text: 'İHTARNAMEDİR' },
      {
        type: 'para', parts: [
          { t: 'İHTAR EDEN: ' }, { t: '@ihtar_eden', var: true }, { t: ' (TC: ' }, { t: '@ihtar_eden_tc', var: true }, { t: ')' },
        ],
      },
      {
        type: 'para', parts: [
          { t: 'MUHATAP: ' }, { t: '@muhatap_unvan', var: true }, { t: ' | ADRES: ' }, { t: '@muhatap_adres', var: true },
        ],
      },
      { type: 'label', text: 'Konu ve Açıklamalar' },
      {
        type: 'para', parts: [
          { t: 'Tarafınızla ' }, { t: '15.04.2025', highlightTrigger: true },
          { t: ' tarihinde imzaladığımız sözleşme kapsamında ödemelerinizi vadesinde gerçekleştirmediğiniz tespit edilmiştir.' },
        ],
      },
    ],
    bubbleMenu: { state: 'input', inputText: 'Sözleşme Tarihi', fieldType: 'Tarih' },
  },
  {
    theme: 'forest',
    tag: 'Sağlık & Klinik',
    trigger: '[ ]',
    title: 'Aydınlatılmış Onam Formu',
    vars: ['hasta_adi_soyadi', 'hasta_tc', 'doktor_adi', 'klinik_adi'],
    body: [
      { type: 'heading', text: 'AYDINLATILMIŞ ONAM VE RIZA BELGESİ' },
      { type: 'label', text: 'I. Hasta Bilgileri' },
      {
        type: 'para', parts: [
          { t: 'Ben, ' }, { t: '[hasta_adi_soyadi]', var: true }, { t: ' (TC: ' }, { t: '[hasta_tc]', var: true }, { t: '), ' },
          { t: '[klinik_adi]', var: true }, { t: ' bünyesinde ' }, { t: '[doktor_adi]', var: true },
          { t: ' tarafından gerçekleştirilecek olan ' }, { t: 'Ortopedik Cerrahi', highlightTrigger: true },
          { t: ' operasyonuna onay veriyorum.' },
        ],
      },
    ],
    bubbleMenu: { state: 'button' },
  },
  {
    theme: 'amber',
    tag: 'Hizmet Alımı',
    trigger: '<< >>',
    title: 'Freelance Danışmanlık Sözleşmesi',
    vars: ['danisman_adi', 'hizmet_alan_unvan', 'hizmet_kapsami', 'baslangic_tarihi'],
    body: [
      { type: 'heading', text: 'FREELANCE DANIŞMANLIK SÖZLEŞMESİ' },
      { type: 'label', text: 'Madde 1 - Taraflar' },
      {
        type: 'para', parts: [
          { t: 'Bağımsız Danışman ' }, { t: '<<danisman_adi>>', var: true },
          { t: ' ile Hizmet Alan ' }, { t: '<<hizmet_alan_unvan>>', var: true }, { t: ' arasında akdedilmiştir.' },
        ],
      },
      { type: 'label', text: 'Madde 2 - Ücretlendirme' },
      {
        type: 'para', parts: [
          { t: 'Aylık danışmanlık bedeli net ' }, { t: '25.000 TL', highlightTrigger: true },
          { t: ' olarak belirlenmiştir.' },
        ],
      },
    ],
    bubbleMenu: { state: 'input', inputText: 'Aylık Bedel', fieldType: 'Sayı' },
  },
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
        <title>Belge Hızlı — Sade ve İşlevsel Belge Hazırlama Aracı</title>
        <meta name="description" content="Sözleşme, dilekçe veya resmi yazılarınızı kolayca hazırlayabileceğiniz, dikkatinizi dağıtmayan temiz bir belge çalışma alanı." />
      </Helmet>

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <div className={styles.badge}>
              <FileText size={13} />
              <span>Odaklanmış, dinamik ve akıllı çalışma alanı</span>
            </div>
            <h1 className={styles.heroTitle}>
              Belge ve sözleşmeleri hazırlamanın<br />
              <span className={styles.heroAccent}>farklı bir yolu</span>
            </h1>
            <p className={styles.heroSub}>
              Resmî bir dilekçe, sık kullandığınız bir sözleşme, blog yazısı veya teknik döküman...
              Ne yazıyor olursanız olun, değişkenler sayesinde tekrarı ortadan kaldıran, yalın bir çalışma alanı.
            </p>
            <div className={styles.heroStats}>
              <div className={styles.stat}><strong>8</strong><span>Tema ve atmosfer</span></div>
              <div className={styles.statDivider} />
              <div className={styles.stat}><strong>/</strong><span>Hızlı komut menüsü</span></div>
              <div className={styles.statDivider} />
              <div className={styles.stat}><strong>{slide.trigger}</strong><span>Akıllı değişkenler</span></div>
            </div>
            <div className={styles.heroCtas}>
              <Link to="/kayit-ol" className={styles.ctaPrimary}>Araçları Deneyin</Link>
              <a href="sablonlar" className={styles.ctaSecondary}>Hazır Şablonlar</a>
            </div>
            <p className={styles.microNote}>Kullanım tamamen ücretsizdir, kredi kartı gerekmez.</p>
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
                                <div className={styles.bubbleFormatGroup}>
                                  <div className={styles.bubbleActionBtn}><Bold size={12} /></div>
                                  <div className={styles.bubbleActionBtn}><Italic size={12} /></div>
                                  <div className={styles.bubbleDivider} />
                                  <div className={styles.bubbleActionBtn}><Palette size={12} /></div>
                                  <div className={styles.bubbleActionBtn}><Highlighter size={12} /></div>
                                </div>
                                <div className={styles.bubbleDivider} />
                                {slide.bubbleMenu.state === 'button' ? (
                                  <div className={styles.bubbleMagicBtn}>
                                    <Sparkles size={12} color="#fde047" /> Soruya Dönüştür
                                  </div>
                                ) : (
                                  <div className={styles.bubbleInputRow}>
                                    <div className={styles.bubbleInput}>{slide.bubbleMenu.inputText}</div>
                                    <div className={styles.bubbleSelect}>{slide.bubbleMenu.fieldType}</div>
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
                    İşbu sözleşme, bir tarafta mülk sahibi ile diğer tarafta kiracı sıfatıyla <span className={styles.mvVar}>{'{{'}kiraci_adi{'}}'}</span> (TC: <span className={styles.mvVar}>{'{{'}tc_kimlik{'}}'}</span>) arasında akdedilmiştir.
                  </div>
                  <div className={styles.mvPara}> 
                    Sözleşme <span className={styles.mvVar}>{'{{'}baslangic_tarihi{'}}'}</span> tarihinde yürürlüğe girecek olup, aylık kira bedeli <span className={styles.mvVar}>{'{{'}kira_bedeli{'}}'}</span> TL olarak belirlenmiştir.
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.magicText}>
            <div className={styles.sectionEyebrow}>Evrensel Uyumluluk</div>
            <h2>Saniyeler içinde form oluşturun</h2>
            <p>Zaten hazırladığınız bir Word veya PDF taslağınız mı var? Metni çalışma alanına yapıştırın ve <strong>"Tümünü Algıla"</strong> butonuna tıklayın. Sistem, metninizdeki tüm değişkenleri otomatik bulur ve formunuzu sizin yerinize kurar.</p>
            <ul className={styles.bubbleFeatureList}>
              <li><Check size={16} className={styles.checkIcon} /> <code className={styles.inlineCode}>{'{{ }}'}</code>, <code className={styles.inlineCode}>{'[ ]'}</code> veya özel karakter desteği.</li>
              <li><Check size={16} className={styles.checkIcon} /> Aynı değişkenin kopyalarını otomatik gruplama yeteneği.</li>
              <li><Check size={16} className={styles.checkIcon} /> Yüzlerce boşluğu tek tıklamayla akıllı sorulara dönüştürme.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.bubbleSection}>
        <div className={styles.bubbleInner}>
          <div className={styles.bubbleText}>
            <div className={styles.sectionEyebrow}>Akıcı İş Akışı</div>
            <h2>Metni seçin, soruya dönüşsün</h2>
            <p>Karmaşık form oluşturucularla zaman kaybetmeyin. İhtiyacınız olan araçlar, tam olarak imlecinizin ucunda belirir. Değişecek kelimeyi farenizle seçin ve tek tıkla dinamik bir form sorusuna çevirin.</p>
            <ul className={styles.bubbleFeatureList}>
              <li><Check size={16} className={styles.checkIcon} /> Kesintiye uğramadan metin üzerinde çalışın.</li>
              <li><Check size={16} className={styles.checkIcon} /> Biçimlendirme ve form yapılandırması aynı menüde.</li>
              <li><Check size={16} className={styles.checkIcon} /> Saniyeler içinde kendi akıllı şablonunuzu oluşturun.</li>
            </ul>
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
                <div className={styles.bvFormatGroup}>
                  <div className={styles.bvBtn}><Bold size={14} /></div>
                  <div className={styles.bvBtn}><Italic size={14} /></div>
                  <div className={styles.bvDivider} />
                  <div className={styles.bvBtn}><Palette size={14} /></div>
                  <div className={styles.bvBtn}><Highlighter size={14} /></div>
                </div>
                <div className={styles.bvDivider} />
                <div className={styles.bvMagicBtn}><Sparkles size={14} color="#fde047" /> Soruya Dönüştür</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.logicSection}>
        <div className={styles.logicInner}>
          <div className={styles.logicText}>
            <div className={styles.sectionEyebrow}>Akıllı Belge Mantığı</div>
            <h2>Sorulara göre şekillenen belgeler</h2>
            <p>Her müşteri veya durum için ayrı sözleşme taslakları hazırlamanıza gerek yok. "Şartlı Bloklar" sayesinde, formdaki bir cevaba göre belgenizin belirli bölümlerini otomatik olarak gizleyin veya gösterin.</p>
            <ul className={styles.bubbleFeatureList}>
              <li><Check size={16} className={styles.checkIcon} /> Form yanıtlarına göre beliren veya kaybolan dinamik paragraflar.</li>
              <li><Check size={16} className={styles.checkIcon} /> Yüzlerce farklı senaryoyu tek bir ana şablonda birleştirme imkanı.</li>
              <li><Check size={16} className={styles.checkIcon} /> Sıfır kodlama ile kolayca "Eğer - İse" (If-Else) mantığı kurma.</li>
            </ul>
          </div>
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
        </div>
      </section>

      <section className={styles.focusSection}>
        <div className={styles.focusInner}>
          <div className={styles.focusVisual}>
            <div className={styles.fmWindow}>
              <div className={styles.fmBar}>
                <div className={styles.fmDots}><span /><span /><span /></div>
                <div className={styles.fmTitle}>Odak Modu (Metin Editörü)</div>
              </div>
              <div className={styles.fmBody}>
                <h3 className={styles.fmH1}>TİCARİ GİZLİLİK SÖZLEŞMESİ</h3>
                <div className={styles.fmPara}>Sözleşme kapsamında yer alan tarafların yükümlülükleri aşağıda listelenmiştir.</div> 
                <div className={styles.fmSlashMock}>
                  <span className={styles.fmSlashCmd}>/</span>
                  <div className={styles.fmSlashMenu}>
                    <div className={styles.fmSlashItem}><Heading1 size={12} /> Büyük Başlık</div>
                    <div className={styles.fmSlashItem}><Heading3 size={12} /> Küçük Başlık</div>
                    <div className={styles.fmSlashItemActive}><List size={12} /> Madde İmleri</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.focusText}>
            <div className={styles.sectionEyebrow}>Kesintisiz Deneyim</div>
            <h2>Sadece kelimelerinize odaklanın</h2>
            <p>Araç çubuklarını, yan menüleri ve form alanlarını tek tıkla gizleyin. Odak moduna geçtiğinizde ekranınız tamamen kelimelerinize kalır.</p>
            <ul className={styles.bubbleFeatureList}>
              <li><Moon size={16} className={styles.checkIcon} /> Ruh halinize uygun 8 farklı atmosfer teması.</li>
              <li><Maximize size={16} className={styles.checkIcon} /> Dikkat dağıtan tüm ögeleri kaldıran tam ekran görünümü.</li>
              <li><Keyboard size={16} className={styles.checkIcon} /> Fareye dokunmadan <strong>/</strong> komutlarıyla uçtan uca kontrol.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.useCasesSection}>
        <div className={styles.useCasesInner}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionEyebrow}>Kullanım Alanları</div>
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
            <div className={styles.sectionEyebrow}>Açık Kütüphane</div>
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
            <p>Araçları test etmek ve kendi şablonlarınızı buluta kaydetmek için ücretsiz hesabınızı açın.</p>
            <Link to="/kayit-ol" className={styles.ctaPrimaryLg}>Ücretsiz Başlayın</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;