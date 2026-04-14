// backend/routes/userTemplates.js
const express = require('express');
const router = express.Router();
const Template = require('../models/template'); 
const { protectUser } = require('../middleware/userAuthMiddleware');

router.post('/', protectUser, async (req, res) => {
    try {
        const { name, description, content, fields, category, editorMode } = req.body;

        const newTemplate = new Template({
            userId: req.user._id, 
            name: name || 'İsimsiz Bölüm',
            description: description || '',
            content: content || '',
            fields: fields || [],
            category: category || 'general',
            editorMode: editorMode || 'form_builder',
            isSystem: false
        });

        await newTemplate.save();
        res.status(201).json(newTemplate);
    } catch (error) {
        console.error("Şablon oluşturma hatası:", error);
        res.status(500).json({ message: 'Şablon oluşturulurken hata meydana geldi.' });
    }
});

router.get('/:id', protectUser, async (req, res) => {
    try {
        const template = await Template.findOne({ 
            _id: req.params.id,
            $or: [{ userId: req.user._id }, { isSystem: true }]
        });

        if (!template) {
            return res.status(404).json({ message: 'Bölüm/Şablon bulunamadı.' });
        }

        res.json(template);
    } catch (error) {
        console.error("Şablon getirme hatası:", error);
        res.status(500).json({ message: 'Şablon alınırken hata oluştu.' });
    }
});

router.put('/:id', protectUser, async (req, res) => {
    try {
        const template = await Template.findOne({ _id: req.params.id, userId: req.user._id });
        
        if (!template) {
            return res.status(404).json({ message: 'Bölüm bulunamadı veya düzenleme yetkiniz yok.' });
        }

        const { name, description, content, fields, category, isActive } = req.body;

        if (name !== undefined) template.name = name;
        if (description !== undefined) template.description = description;
        if (content !== undefined) template.content = content;
        if (fields !== undefined) template.fields = fields;
        if (category !== undefined) template.category = category;
        if (isActive !== undefined) template.isActive = isActive;

        await template.save();
        res.json(template);

    } catch (error) {
        console.error("Şablon güncelleme hatası:", error);
        res.status(500).json({ message: 'Bölüm güncellenirken hata oluştu.' });
    }
});

router.delete('/:id', protectUser, async (req, res) => {
    try {
        const template = await Template.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!template) {
            return res.status(404).json({ message: 'Silinecek bölüm bulunamadı veya yetkiniz yok.' });
        }

        res.json({ message: 'Bölüm başarıyla silindi.' });
    } catch (error) {
        console.error("Şablon silme hatası:", error);
        res.status(500).json({ message: 'Bölüm silinirken hata oluştu.' });
    }
});

module.exports = router;