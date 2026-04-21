// backend/routes/projects.js
const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { protectUser } = require('../middleware/userAuthMiddleware');
const fs = require('fs');
const path = require('path');
const { generatePdf } = require('../pdf-generator/pdfGenerator');

const cssFilePath = path.join(__dirname, '..', 'styles', 'pdfStyles.css');
let pdfStyles = '';
try {
    const cssContent = fs.readFileSync(cssFilePath, 'utf8');
    pdfStyles = `<style>\n${cssContent}\n</style>`;
} catch (error) { console.error('PDF CSS yüklenemedi', error); }

// YENİ ŞABLON OLUŞTUR
router.post('/create', protectUser, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ message: 'Belge adı zorunludur.' });

        const newProject = new Project({
            userId: req.user._id, 
            name,
            description: description || '',
            content: '',
            fields: []
        });

        await newProject.save();
        res.status(201).json(newProject);
    } catch (error) {
        res.status(500).json({ message: 'Belge oluşturulurken bir hata meydana geldi.' });
    }
});

// KULLANICININ TÜM ŞABLONLARINI GETİR
router.get('/my-projects', protectUser, async (req, res) => {
    try {
        const projects = await Project.find({ userId: req.user._id }).sort({ updatedAt: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Belgeler alınırken bir hata oluştu.' });
    }
});

// TEKİL ŞABLON DETAYINI GETİR (Tasarımcı ve Frontend için)
router.get('/:id', protectUser, async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
        if (!project) return res.status(404).json({ message: 'Belge bulunamadı veya yetkiniz yok.' });
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Belge detayları alınırken bir hata oluştu.' });
    }
});

// ŞABLONU GÜNCELLE 
router.put('/:id', protectUser, async (req, res) => {
    try {
        const { name, description, content, fields, settings } = req.body;
        const updatedProject = await Project.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { $set: { name, description, content, fields, settings } },
            { new: true, runValidators: true }
        );
        if (!updatedProject) return res.status(404).json({ message: 'Güncellenecek belge bulunamadı.' });
        res.json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: 'Belge güncellenirken bir hata oluştu.' });
    }
});

// ŞABLONU SİL
router.delete('/:id', protectUser, async (req, res) => {
    try {
        const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!project) return res.status(404).json({ message: 'Silinecek belge bulunamadı.' });
        res.json({ message: 'Belge başarıyla silindi.' });
    } catch (error) {
        res.status(500).json({ message: 'Belge silinirken bir hata oluştu.' });
    }
});

// PDF OLUŞTURMA 
router.post('/:id/generate-pdf', protectUser, async (req, res) => {
    try {
        const { html, documentName } = req.body;
        const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8" />${pdfStyles}</head><body><div class="preview-document">${html}</div></body></html>`;
        const pdfBuffer = await generatePdf(fullHtml);
        const safeName = (documentName || 'Belge').replace(/[^a-zA-Z0-9_\-]/g, '_');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).json({ message: 'PDF oluşturulamadı.' });
    }
});

// 7. PUBLIC LİNK GETİR (HostedForm /f/:id)
router.get('/public/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Belge bulunamadı.' });
        res.json({ project }); 
    } catch (error) {
        res.status(500).json({ message: 'Belge yüklenirken hata oluştu.' });
    }
});

// PUBLIC FORM TAMAMLAMA VE PDF OLUŞTURMA (HostedForm Submit)
router.post('/public/:id/complete', async (req, res) => {
    try {
        const { html } = req.body; 
        const projectId = req.params.id;

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Belge bulunamadı.' });

        if (!html) return res.status(400).json({ message: 'PDF oluşturmak için HTML içeriği eksik.' });

        const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Comic+Neue&display=swap" rel="stylesheet">
                ${pdfStyles}
            </head>
            <body>
                <div class="preview-document">${html}</div>
            </body>
            </html>
        `;

        const pdfBuffer = await generatePdf(fullHtml);
        const safeName = (project.name || 'Belge').replace(/[^a-zA-Z0-9_\-]/g, '_');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Public PDF üretim hatası:", error);
        res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
});

module.exports = router;