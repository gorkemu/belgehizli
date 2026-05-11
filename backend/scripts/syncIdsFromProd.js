// backend/scripts/syncIdsFromProd.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Template = require('../models/template');
const templatesDir = path.join(__dirname, '../data/templates');

// ÖNEMLİ: Bu betik çalışırken geçici .env dosyasındaki ATLAS_URI PROD (Canlı) veritabanı olmalıdır
const uri = process.env.ATLAS_URI;

if (!uri) {
    console.error('❌ HATA: MongoDB URI bulunamadı. Lütfen .env dosyanızı kontrol edin.');
    process.exit(1);
}

async function syncIdsFromProd() {
    try {
        console.log('🔗 Canlı (Prod) veritabanına bağlanılıyor...');
        await mongoose.connect(uri);
        console.log('✅ Bağlantı başarılı.\n');

        console.log('📥 Canlı veritabanından ID\'ler çekiliyor...');
        const dbTemplates = await Template.find({}, '_id slug');
        
        const dbTemplateMap = {};
        dbTemplates.forEach(t => {
            dbTemplateMap[t.slug] = t._id.toString();
        });

        console.log(`✅ Veritabanında ${dbTemplates.length} adet şablon bulundu.\n`);

        console.log('📂 Yerel JSON dosyaları güncelleniyor...');
        const files = fs.readdirSync(templatesDir).filter(file => file.endsWith('.json'));

        let updatedCount = 0;
        let notFoundCount = 0;

        for (const file of files) {
            const filePath = path.join(templatesDir, file);
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const templateData = JSON.parse(fileContent);

            const slug = templateData.slug;
            
            if (dbTemplateMap[slug]) {
                const prodId = dbTemplateMap[slug];

                const newData = {
                    _id: { "$oid": prodId },
                    ...templateData 
                };

                if (templateData._id && templateData._id["$oid"] === prodId) {
                    console.log(`⏩ [ATLANDI] ${file} (Zaten senkronize)`);
                    continue;
                }

                fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf-8');
                console.log(`🔄 [GÜNCELLENDİ] ${file} -> Yeni ID: ${prodId}`);
                updatedCount++;
            } else {
                console.log(`⚠️ [BULUNAMADI] ${file} için canlı veritabanında eşleşen slug yok!`);
                notFoundCount++;
            }
        }

        console.log(`\n🎉 İşlem Tamamlandı! ${updatedCount} dosya güncellendi, ${notFoundCount} dosya bulunamadı.`);

    } catch (error) {
        console.error('❌ HATA OLUŞTU:', error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}

syncIdsFromProd();