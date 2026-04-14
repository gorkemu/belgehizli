// backend/routes/projects.js
const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Template = require('../models/template'); 
const { protectUser } = require('../middleware/userAuthMiddleware');
const fs = require('fs');
const path = require('path');
const { generatePdf } = require('../pdf-generator/pdfGenerator');

const cssFilePath = path.join(__dirname, '..', 'styles', 'pdfStyles.css');
let pdfStyles = '';
try {
    const cssContent = fs.readFileSync(cssFilePath, 'utf8');
    pdfStyles = `<style>\n${cssContent}\n</style>`;
} catch (error) {
    console.error('PDF CSS yüklenemedi', error);
}

router.post('/create', protectUser, async (req, res) => {
    try {
        const { name, description, category, variables, settings } = req.body;

        if (!name) return res.status(400).json({ message: 'Belge adı zorunludur.' });

        const newProject = new Project({
            userId: req.user._id, 
            name,
            description,
            category: category || 'authoring',
            variables: variables || {},
            settings: {
                isPublic: settings?.isPublic || false,
                defaultLanguage: settings?.defaultLanguage || 'tr',
                variableTrigger: settings?.variableTrigger || '{{',
                mode: settings?.mode || 'FREE' 
            }
        });

        await newProject.save();
        res.status(201).json(newProject);

    } catch (error) {
        console.error("Belge oluşturma hatası:", error);
        res.status(500).json({ message: 'Belge oluşturulurken bir hata meydana geldi.' });
    }
});

router.get('/my-projects', protectUser, async (req, res) => {
    try {
        const projects = await Project.find({ userId: req.user._id })
                                      .sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        console.error("Belgeleri getirme hatası:", error);
        res.status(500).json({ message: 'Belgeler alınırken bir hata oluştu.' });
    }
});

router.get('/:id', protectUser, async (req, res) => {
    try {
        const project = await Project.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!project) return res.status(404).json({ message: 'Belge bulunamadı veya yetkiniz yok.' });

        // Belgeye ait alt bölümler
        const documents = await Template.find({ 
            projectId: project._id,
            isSystem: false
        })
        .select('_id name editorMode createdAt updatedAt slug order') 
        .sort({ order: 1, createdAt: 1 });

        res.json({ project, documents });

    } catch (error) {
        console.error("Belge detay hatası:", error);
        res.status(500).json({ message: 'Belge detayları alınırken bir hata oluştu.' });
    }
});

router.put('/:id', protectUser, async (req, res) => {
    try {
        const { name, description, variables, settings } = req.body;

        const updatedProject = await Project.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { $set: { name, description, variables, settings } },
            { new: true, runValidators: true }
        );

        if (!updatedProject) return res.status(404).json({ message: 'Güncellenecek belge bulunamadı.' });

        res.json(updatedProject);
    } catch (error) {
        console.error("Belge güncelleme hatası:", error);
        res.status(500).json({ message: 'Belge güncellenirken bir hata oluştu.' });
    }
});

router.delete('/:id', protectUser, async (req, res) => {
    try {
        const project = await Project.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!project) return res.status(404).json({ message: 'Silinecek belge bulunamadı.' });

        await Template.deleteMany({ projectId: project._id });

        res.json({ message: 'Belge ve içindeki bölümler başarıyla silindi.' });
    } catch (error) {
        console.error("Belge silme hatası:", error);
        res.status(500).json({ message: 'Belge silinirken bir hata oluştu.' });
    }
});

router.post('/:id/documents', protectUser, async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
        if (!project) return res.status(404).json({ message: 'Bağlı belge bulunamadı.' });

        const { name } = req.body;
        const mode = project.category === 'authoring' ? 'focus_editor' : 'form_builder';

        const newDocument = new Template({
            userId: req.user._id, // 
            name: name || 'Yeni Bölüm',
            content: '',
            projectId: project._id,
            editorMode: mode,
            isSystem: false
        });

        await newDocument.save();
        res.status(201).json(newDocument);
    } catch (error) {
        console.error("Bölüm oluşturma hatası:", error);
        res.status(500).json({ message: 'Bölüm oluşturulurken bir hata meydana geldi.' });
    }
});

router.patch('/:id/documents/reorder', protectUser, async (req, res) => {
    try {
        const { orderedIds } = req.body;
        if (!orderedIds || !Array.isArray(orderedIds)) return res.status(400).json({ message: 'Geçersiz sıralama verisi.' });

        const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
        if (!project) return res.status(404).json({ message: 'Belge bulunamadı veya yetkiniz yok.' });

        const bulkOps = orderedIds.map((docId, index) => ({
            updateOne: {
                filter: { _id: docId, projectId: project._id },
                update: { $set: { order: index } }
            }
        }));

        if (bulkOps.length > 0) await Template.bulkWrite(bulkOps);

        res.json({ message: 'Sıralama başarıyla kaydedildi.' });
    } catch (error) {
        console.error("Sıralama güncelleme hatası:", error);
        res.status(500).json({ message: 'Sıralama güncellenirken bir hata oluştu.' });
    }
});

router.post('/:id/generate-pdf', protectUser, async (req, res) => {
    try {
        const { html, documentName } = req.body;
        if (!html) return res.status(400).json({ message: 'PDF oluşturmak için HTML içeriği gereklidir.' });

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
        const safeName = (documentName || 'Belge').replace(/[^a-zA-Z0-9_\-]/g, '_');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error("Focus Editor PDF Hatası:", error);
        res.status(500).json({ message: 'Belge oluşturulurken bir sunucu hatası meydana geldi.' });
    }
});

router.get('/public/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Belge bulunamadı veya yayından kaldırıldı.' });

        const documents = await Template.find({ projectId: project._id, isSystem: false }).sort({ order: 1, createdAt: 1 });
        res.json({ project, documents });
    } catch (error) {
        console.error("Public belge getirme hatası:", error);
        res.status(500).json({ message: 'Belge yüklenirken hata oluştu.' });
    }
});

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


router.post('/generate-pdf', protectUser, async (req, res) => {
    try {
        const { html, documentName } = req.body;
        
        if (!html) return res.status(400).json({ message: 'HTML içeriği eksik.' });

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
        const safeName = (documentName || 'Belge').replace(/[^a-zA-Z0-9_\-]/g, '_');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error("Universal PDF Generator Hatası:", error);
        res.status(500).json({ message: 'PDF oluşturulamadı.' });
    }
});

module.exports = router;