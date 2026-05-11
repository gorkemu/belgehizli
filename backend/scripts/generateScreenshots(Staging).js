// backend/scripts/generateScreenshots(Staging).js
const puppeteer = require('puppeteer');
const sharp = require('sharp');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const Template = require('../models/template');

const ATLAS_URI = process.env.ATLAS_URI;
const FRONTEND_URL = 'http://localhost:5173';
const LANG = 'en';
const OUTPUT_DIR = path.join(__dirname, '../../frontend/public/template-previews');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
    if (!ATLAS_URI) {
        console.error('❌ HATA: ATLAS_URI ortam değişkeni tanımlanmamış!');
        console.error('Bu betik Infisical üzerinden secret enjeksiyonu gerektirir.');
        console.error('Lütfen şu komutla çalıştırın: infisical run -- node scripts/generateScreenshots(Staging).js');
        process.exit(1);
    }

    console.log('📦 Veritabanına bağlanılıyor...');
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Bağlantı başarılı.');

    const templates = await Template.find({ isActive: true });
    console.log(`📄 Toplam ${templates.length} şablon bulundu. Ekran görüntüleri alınıyor...\n`);

    const browser = await puppeteer.launch({
        headless: "new", 
        defaultViewport: { width: 1200, height: 1000 }
    });

    const page = await browser.newPage();

    for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        const id = template._id.toString();
        const slug = template.slug;
        const outputPath = path.join(OUTPUT_DIR, `${id}.webp`);

        if (fs.existsSync(outputPath)) {
            console.log(`⏩ [Atlandı] ${template.name} (${id}.webp zaten var)`);
            continue;
        }

        try {
            console.log(`📸 [${i + 1}/${templates.length}] Çekiliyor: ${template.name}...`);
            
            const url = `${FRONTEND_URL}/${LANG}/templates/detail/${slug}`;
            await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

            console.log('   🛠️ İstenmeyen elemanlar gizleniyor...');
            await page.evaluate(() => {
                // 1. Header'ı gizle. 
                const header = document.querySelector('[class*="appHeader"]'); 
                if (header) header.style.display = 'none';

                // 2. Cookie banner'ı gizle. 
                const cookieConsent = document.querySelector('[class*="CookieConsent"]');
                if (cookieConsent) cookieConsent.style.display = 'none';
                
            });


            const selector = '[data-testid="template-preview-box"]';

            await page.waitForSelector(selector, { timeout: 10000 });

            const element = await page.$(selector);

            const imageBuffer = await element.screenshot();

            await sharp(imageBuffer)
                .webp({ quality: 80 })
                .resize({ width: 800 })
                .toFile(outputPath);

            console.log(`   ✅ Kaydedildi: ${id}.webp`);

        } catch (error) {
            console.error(`   ❌ HATA (${template.name}):`, error.message);
        }
    }

    console.log('\n🎉 Tüm işlemler tamamlandı!');

    await browser.close();
    await mongoose.connection.close();
    process.exit(0);
}

run();