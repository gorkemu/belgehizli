// frontend/src/utils/routeDictionary.js

// Hangi kelimenin hedef dilde neye dönüştüğünü tanımlayan sözlük
const pathTranslations = {
  en: {
    'giris-yap': 'login',
    'kayit-ol': 'register',
    'sablonlar': 'templates',
    'detay': 'detail',
    'hakkimizda': 'about-us',
    'iletisim': 'contact-us',
    'gizlilik-politikasi': 'privacy-policy',
    'kullanim-sartlari': 'terms-of-service',
    'on-bilgilendirme-formu': 'pre-information-form',
    'sifremi-unuttum': 'forgot-password',
    'sifre-belirle': 'set-password',
    'panel': 'dashboard'
  },
  tr: {
    'login': 'giris-yap',
    'register': 'kayit-ol',
    'templates': 'sablonlar',
    'detail': 'detay',
    'about-us': 'hakkimizda',
    'contact-us': 'iletisim',
    'privacy-policy': 'gizlilik-politikasi',
    'terms-of-service': 'kullanim-sartlari',
    'pre-information-form': 'on-bilgilendirme-formu',
    'forgot-password': 'sifremi-unuttum',
    'set-password': 'sifre-belirle',
    'dashboard': 'panel'
  }
};

// URL'i parçalayıp, bilinen kelimeleri çeviren, bilinmeyenleri (örn: is-sozlesmesi) olduğu gibi bırakan akıllı fonksiyon
export const translatePath = (pathname, targetLang) => {
  // Örn: "/tr/sablonlar/detay/is-sozlesmesi" -> ["tr", "sablonlar", "detay", "is-sozlesmesi"]
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return `/${targetLang}`;

  // Eğer dizinin ilk elemanı mevcut dil (tr veya en) ise onu çıkartıyoruz
  if (['tr', 'en'].includes(segments[0])) {
    segments.shift();
  }

  // Kalan parçaları hedef dile göre çevir (Sözlükte yoksa kelimeyi aynen tut)
  const translatedSegments = segments.map(segment => {
    return pathTranslations[targetLang][segment] || segment;
  });

  return `/${targetLang}/${translatedSegments.join('/')}`;
};