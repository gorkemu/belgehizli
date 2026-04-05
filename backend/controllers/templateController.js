const Template = require('../models/template');

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