const express = require('express');
const router = express.Router();
const LegalDocument = require('../models/LegalDocument');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');

router.get('/:type/latest', async (req, res) => {
    try {
        const doc = await LegalDocument.findOne({ type: req.params.type, isActive: true })
                                      .sort({ createdAt: -1 });
        if (!doc) return res.status(404).json({ message: 'Metin bulunamadı.' });
        res.json(doc);
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

router.post('/add', protectAdmin, async (req, res) => {
    const { type, version, content, isActive } = req.body;
    try {
        if (isActive) {
            await LegalDocument.updateMany({ type }, { isActive: false });
        }
        const newDoc = new LegalDocument({ type, version, content, isActive });
        await newDoc.save();
        res.status(201).json(newDoc);
    } catch (error) {
        res.status(400).json({ message: 'Ekleme başarısız.' });
    }
});

router.get('/:type/history', protectAdmin, async (req, res) => {
    try {
        const docs = await LegalDocument.find({ type: req.params.type })
                                      .sort({ createdAt: -1 });
        res.json(docs);
    } catch (error) {
        console.error("Geçmiş versiyonlar çekilemedi:", error);
        res.status(500).json({ message: 'Geçmiş versiyonlar getirilemedi.' });
    }
});

module.exports = router;