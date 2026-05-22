const mongoose = require('mongoose');

const legalDocumentSchema = new mongoose.Schema({
    type: { 
        type: String, 
        required: true, 
        enum: ['kullanim_sartlari', 'on_bilgilendirme', 'gizlilik_politikasi', 'on_bilgilendirme_en', 
        'gizlilik_politikasi_en', 
        'kullanim_sartlari_en'] 
    },
    version: { 
        type: String, 
        required: true 
    },
    content: { 
        type: String, 
        required: true 
    },
    isActive: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

legalDocumentSchema.index({ type: 1, isActive: 1 });

module.exports = mongoose.model('LegalDocument', legalDocumentSchema);