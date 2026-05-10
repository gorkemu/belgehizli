// backend\controllers\templateController.js
const Template = require('../models/template');

// Dile göre public (sistem) şablonları listeleme
exports.getPublicTemplates = async (req, res) => {
    try {
        // Frontend'deki api.js interceptor'ından gelen dil bilgisini al
        const userLang = req.headers['accept-language']?.startsWith('en') ? 'en' : 'tr';
        
        // Sadece sistem şablonlarını, aktif olanları ve gelen dile uygun olanları çek
        const templates = await Template.find({ 
            isSystem: true, 
            isActive: true,
            language: userLang 
        }).sort({ order: 1, createdAt: -1 });

        res.json({ success: true, templates });
    } catch (error) {
        console.error('Şablon listeleme hatası:', error);
        res.status(500).json({ success: false, message: 'Şablonlar getirilemedi.' });
    }
};

exports.createTemplate = async (req, res) => {
    try {
        const newTemplate = new Template(req.body);
        await newTemplate.save();
        res.status(201).json({ success: true, message: 'Şablon başarıyla oluşturuldu.', template: newTemplate });
    } catch (error) {
        console.error('Şablon ekleme hatası:', error);
        res.status(500).json({ success: false, message: 'Şablon eklenirken bir hata oluştu.', error: error.message });
    }
};

exports.updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedTemplate = await Template.findByIdAndUpdate(id, req.body, { 
            new: true, 
            runValidators: true 
        });

        if (!updatedTemplate) {
            return res.status(404).json({ success: false, message: 'Güncellenecek şablon bulunamadı.' });
        }

        res.json({ success: true, message: 'Şablon başarıyla güncellendi.', template: updatedTemplate });
    } catch (error) {
        console.error('Şablon güncelleme hatası:', error);
        res.status(500).json({ success: false, message: 'Şablon güncellenirken bir hata oluştu.', error: error.message });
    }
};

exports.deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedTemplate = await Template.findByIdAndDelete(id);

        if (!deletedTemplate) {
            return res.status(404).json({ success: false, message: 'Silinecek şablon bulunamadı.' });
        }

        res.json({ success: true, message: 'Şablon kalıcı olarak silindi.' });
    } catch (error) {
        console.error('Şablon silme hatası:', error);
        res.status(500).json({ success: false, message: 'Şablon silinirken bir hata oluştu.' });
    }
};