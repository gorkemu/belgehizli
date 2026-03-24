const mongoose = require('mongoose');
const slugify = require('slugify'); 

// Alt alanlar için şema tanımı 
const subfieldSchema = new mongoose.Schema({
    name: { type: String, required: true },
    label: { type: String, required: true },
    fieldType: { type: String, required: true },
    placeholder: String,
    options: [String],
    required: Boolean,

}, { _id: false }); 

// Ana alanlar için şema tanımı
const fieldSchema = new mongoose.Schema({
    name: { type: String, required: true },
    label: { type: String, required: true },
    fieldType: { type: String, required: true },
    placeholder: String,
    options: [String],
    required: Boolean,
    condition: { // Koşullu alanlar için
        field: String, // Hangi alana bağlı
        value: String  // Hangi değere bağlı

    },
    // --- Tekrarlayan Bloklar İçin Alanlar ---
    blockTitle: String, // Her bloğun başlığı (örn: "Kiracı")
    addLabel: String,   // Ekleme butonu metni (örn: "Yeni Kiracı Ekle")
    removeLabel: String,// Silme butonu metni (örn: "Kiracıyı Sil")
    minInstances: Number, // Minimum blok sayısı
    maxInstances: Number, // Maksimum blok sayısı
    subfields: [subfieldSchema] // Tekrarlayan alanın içindeki alt alanlar

}, { _id: false }); 

// Ana Template Şeması
const templateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    content: { type: String, required: true }, // Handlebars içeriği
    price: { type: Number, required: true, default: 0 },
    fields: [fieldSchema], // Alanların dizisi
    category: String, // Kategori alanı (filtreleme için eklenebilir)
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },

    slug: {
        type: String,
        unique: true, // Slug benzersiz olmalı
        index: true,  // Sorgulamalar için index 
        sparse: true  // Slug'ı olmayan dökümanlar için benzersizlik kontrolünü atla (ileride gerekebilir)
    }

});

// --- Slug Oluşturma Middleware'i ---
templateSchema.pre('save', async function(next) {
    // Eğer 'name' alanı değiştiyse veya döküman yeniyse slug oluştur
    if (this.isModified('name') || this.isNew) {
        if (this.name) {
            // Slugify kullanarak slug oluştur, küçük harf yap ve özel karakterleri temizle
            const baseSlug = slugify(this.name, { lower: true, strict: true });
            let uniqueSlug = baseSlug;
            let counter = 1;

            // Benzersiz slug bulana kadar kontrol et
            // Kendi dökümanını kontrol dışında bırakmak için _id'yi kullan
            while (true) {
                const existingTemplate = await mongoose.model('Template').findOne({
                    slug: uniqueSlug,
                    _id: { $ne: this._id } // Kendi dökümanı hariç tut
                });

                if (!existingTemplate) {
                    break; // Benzersiz slug bulundu
                }

                uniqueSlug = `${baseSlug}-${counter}`;
                counter++;
            }
            this.slug = uniqueSlug;
        } else {
             // İsim yoksa slug'ı boş bırak veya farklı bir varsayılan ata
            this.slug = null; 
        }
    }
    // updatedAt alanını her kayıtta güncelle 
    this.updatedAt = Date.now();
    next();
});

const Template = mongoose.model('Template', templateSchema);

module.exports = Template;