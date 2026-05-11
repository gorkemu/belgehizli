// backend/scripts/syncTemplates.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Template = require('../models/template');
const templatesDir = path.join(__dirname, '../data/templates');

const uri = process.env.ATLAS_URI;
if (!uri) {
    console.error('❌ Hata: ATLAS_URI ortam değişkeni tanımlanmamış!');
    console.error('Infisical üzerinden secret enjeksiyonunu kontrol edin veya betiği "infisical run" ile çalıştırın.');
    process.exit(1);
}

async function syncTemplates() {
    try {
        console.log('Veritabanına bağlanılıyor...');
        await mongoose.connect(uri);
        console.log('✅ Bağlantı başarılı.\n');
        // 1. ADIM: Eski şablonların dilini TR olarak güncelle (şu anki veritabanında language alanı olmayan tüm şablonlar için) 
        console.log('1. Eski şablonlar "tr" dili ile güncelleniyor...');
        const updateResult = await Template.updateMany(
            { language: { $exists: false } },
            { $set: { language: 'tr' } }
        );
        console.log(`✅ ${updateResult.modifiedCount} adet eski şablon 'tr' olarak işaretlendi.\n`);

        // 2. ADIM: JSON dosyalarını oku ve veritabanına aktar
        console.log('2. Yeni ve güncellenmiş şablonlar senkronize ediliyor...');
        const files = fs.readdirSync(templatesDir).filter(file => file.endsWith('.json'));

        for (const file of files) {
            const filePath = path.join(templatesDir, file);
            let templateData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            if (templateData._id && templateData._id.$oid) {
                templateData._id = templateData._id.$oid;
            }

            if (templateData.createdAt && templateData.createdAt.$date) {
                templateData.createdAt = templateData.createdAt.$date;
            }
            if (templateData.updatedAt && templateData.updatedAt.$date) {
                templateData.updatedAt = templateData.updatedAt.$date;
            }

            const query = templateData._id ? { _id: templateData._id } : { slug: templateData.slug };

            const updatedTemplate = await Template.findOneAndUpdate(
                query,
                { $set: templateData },
                { new: true, upsert: true, runValidators: true }
            );

            console.log(`- [${(updatedTemplate.language || 'tr').toUpperCase()}] Senkronize edildi: ${updatedTemplate.name}`);
        }

        console.log('\n🎉 Senkronizasyon işlemi kusursuz tamamlandı!');
    } catch (error) {
        console.error('❌ HATA OLUŞTU:', error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}

syncTemplates();