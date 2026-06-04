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
        if (!name) {
            return res.status(400).json({
                messageKey: 'projects.requiredName',
                message: 'Document name is required.'
            });
        }

        const newProject = new Project({
            userId: req.user._id,
            name,
            description: description || '',
            content: '',
            fields: []
        });
        await newProject.save();

        res.status(201).json({
            ...newProject.toObject(),
            messageKey: 'projects.createdSuccess',
            message: 'Template created successfully.'
        });
    } catch (error) {
        res.status(500).json({
            messageKey: 'projects.createError',
            message: 'An error occurred while creating the document.'
        });
    }
});

// ŞABLONU ÇOĞALT (DUPLICATE)
router.post('/:id/duplicate', protectUser, async (req, res) => {
    try {
        const originalProject = await Project.findOne({ _id: req.params.id, userId: req.user._id });
        if (!originalProject) {
            return res.status(404).json({
                messageKey: 'projects.notFound',
                message: 'Document not found or you do not have permission.'
            });
        }

        // Frontend'den gelen çevrilmiş ismi kullan, yoksa varsayılan bir isim bekle
        const newName = req.body.name || `${originalProject.name} (Kopya)`;

        const newProject = new Project({
            userId: req.user._id,
            name: newName,
            description: originalProject.description,
            content: originalProject.content,
            fields: originalProject.fields,
            settings: originalProject.settings,
            category: originalProject.category
        });

        await newProject.save();

        res.status(201).json(newProject);
    } catch (error) {
        res.status(500).json({
            messageKey: 'projects.duplicateError',
            message: 'An error occurred while duplicating the document.'
        });
    }
});

// KULLANICININ TÜM ŞABLONLARINI GETİR
router.get('/my-projects', protectUser, async (req, res) => {
    try {
        const projects = await Project.find({ userId: req.user._id }).sort({ updatedAt: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({
            messageKey: 'projects.fetchError',
            message: 'An error occurred while fetching documents.'
        });
    }
});

// TEKİL ŞABLON DETAYINI GETİR
router.get('/:id', protectUser, async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
        if (!project) {
            return res.status(404).json({
                messageKey: 'projects.notFound',
                message: 'Document not found or you do not have permission.'
            });
        }
        res.json(project);
    } catch (error) {
        res.status(500).json({
            messageKey: 'projects.fetchDetailError',
            message: 'An error occurred while fetching document details.'
        });
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
        if (!updatedProject) {
            return res.status(404).json({
                messageKey: 'projects.notFound',
                message: 'Document not found or you do not have permission.'
            });
        }
        res.json({
            ...updatedProject.toObject(),
            messageKey: 'projects.updatedSuccess',
            message: 'Template updated successfully.'
        });
    } catch (error) {
        res.status(500).json({
            messageKey: 'projects.updateError',
            message: 'An error occurred while updating the document.'
        });
    }
});

// ŞABLONU SİL
router.delete('/:id', protectUser, async (req, res) => {
    try {
        const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!project) {
            return res.status(404).json({
                messageKey: 'projects.notFound',
                message: 'Document not found or you do not have permission.'
            });
        }
        res.json({
            messageKey: 'projects.deletedSuccess',
            message: 'Document successfully deleted.'
        });
    } catch (error) {
        res.status(500).json({
            messageKey: 'projects.deleteError',
            message: 'An error occurred while deleting the document.'
        });
    }
});

// PDF OLUŞTURMA
router.post('/:id/generate-pdf', protectUser, async (req, res) => {
    try {
        const { html, documentName } = req.body;
        const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8" />${pdfStyles}</head><body><div class="preview-document">${html}</div></body></html>`;
        const pdfBuffer = await generatePdf(fullHtml);
        const safeName = (documentName || 'Document').replace(/[^a-zA-Z0-9_\-]/g, '_');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).json({
            messageKey: 'projects.pdfGenerationError',
            message: 'PDF could not be generated.'
        });
    }
});

// PUBLIC LİNK GETİR
router.get('/public/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({
                messageKey: 'projects.notFound',
                message: 'Document not found.'
            });
        }
        res.json({ project });
    } catch (error) {
        res.status(500).json({
            messageKey: 'projects.loadError',
            message: 'An error occurred while loading the document.'
        });
    }
});

// PUBLIC FORM TAMAMLAMA VE PDF OLUŞTURMA
router.post('/public/:id/complete', async (req, res) => {
    try {
        const { html } = req.body;
        const projectId = req.params.id;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                messageKey: 'projects.notFound',
                message: 'Document not found.'
            });
        }
        if (!html) {
            return res.status(400).json({
                messageKey: 'projects.htmlMissing',
                message: 'HTML content is missing for PDF generation.'
            });
        }

        const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8" /><link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Comic+Neue&display=swap" rel="stylesheet">${pdfStyles}</head><body><div class="preview-document">${html}</div></body></html>`;
        const pdfBuffer = await generatePdf(fullHtml);
        const safeName = (project.name || 'Document').replace(/[^a-zA-Z0-9_\-]/g, '_');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error("Public PDF üretim hatası:", error);
        res.status(500).json({
            messageKey: 'projects.serverError',
            message: 'A server error occurred.'
        });
    }
});

module.exports = router;