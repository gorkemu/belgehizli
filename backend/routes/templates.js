// backend/routes/templates.js
const express = require('express');
const router = express.Router();
const Template = require('../models/template');
const Transaction = require('../models/transaction');
const Invoice = require('../models/invoice');
const ConsentLog = require('../models/consentLog');
const LegalDocument = require('../models/LegalDocument');
const { generatePdf } = require('../pdf-generator/pdfGenerator');
const { sendPdfEmail } = require('../utils/mailer');
const { sanitizeHtmlForPdf } = require('../utils/sanitizer');
const { createTemplate, updateTemplate, deleteTemplate } = require('../controllers/templateController');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const { verifyToken, authorizeRole } = require('../middleware/adminAuthMiddleware');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Handlebars = require('handlebars');
const { format } = require('date-fns');

function formatDateHelper(dateString) {
    if (!dateString || typeof dateString !== 'string') return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    } catch (e) { return dateString; }
}

Handlebars.registerHelper('math', function (lvalue, operator, rvalue, options) {
    lvalue = parseFloat(lvalue);
    rvalue = parseFloat(rvalue);
    return {
        '+': lvalue + rvalue, '-': lvalue - rvalue,
        '*': lvalue * rvalue, '/': lvalue / rvalue,
        '%': lvalue % rvalue
    }[operator];
});

Handlebars.registerHelper('eq', function (a, b) {
    return String(a) == String(b);
});

Handlebars.registerHelper('gt', function (a, b) {
    return parseFloat(a) > parseFloat(b);
});

Handlebars.registerHelper('default', function (value, defaultValue) {
    return value !== undefined && value !== null && value !== '' ? value : defaultValue;
});

Handlebars.registerHelper('formatDate', formatDateHelper);

function turkceToLatin(text) {
    if (!text) return 'document';
    return text
        .replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ş/g, 'S')
        .replace(/I/g, 'I').replace(/İ/g, 'I').replace(/Ö/g, 'O')
        .replace(/Ç/g, 'C').replace(/ğ/g, 'g').replace(/ü/g, 'u')
        .replace(/ş/g, 's').replace(/ı/g, 'i').replace(/i/g, 'i')
        .replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-zA-Z0-9._-]/g, '_');
}

const cssFilePath = path.join(__dirname, '..', 'styles', 'pdfStyles.css');
let pdfStyles = '';
try {
    const cssContent = fs.readFileSync(cssFilePath, 'utf8');
    pdfStyles = `<style>\n${cssContent}\n</style>`;
    console.log('PDF stilleri CSS dosyası başarıyla yüklendi.');
} catch (error) {
    console.error(`PDF stilleri CSS dosyasını okuma hatası: ${cssFilePath}`, error);
    console.warn('UYARI: PDF stilleri yüklenemedi. PDF\'ler varsayılan stillerle oluşturulacak.');
}

const oldIdToSlugMapPath = path.join(__dirname, '..', 'old-id-to-slug-map.json');
let oldIdToSlugMap = {};
try {
    const mapData = fs.readFileSync(oldIdToSlugMapPath, 'utf8');
    oldIdToSlugMap = JSON.parse(mapData);
    console.log(`Successfully loaded old ID to slug map from ${oldIdToSlugMapPath}`);
} catch (error) {
    console.error(`Failed to load old ID to slug map from ${oldIdToSlugMapPath}:`, error.message);
}

// ─── GET /sablonlar ────────────────────────────────────────────────
router.get('/sablonlar', async (req, res) => {
    try {
        const lang = req.query.lang || 'tr';
        const templates = await Template.find(
            { isSystem: true, isActive: true, language: lang },
            '_id name description price slug language'
        );
        res.json({templates });
    } catch (error) {
        console.error('Şablonlar alınırken hata oluştu:', error);
        res.status(500).json({
            messageKey: 'templates.fetchAllError',
            message: 'An error occurred while fetching templates.'
        });
    }
});

// ─── GET /sablonlar/detay/:slug ────────────────────────────────────
router.get('/sablonlar/detay/:slug', async (req, res) => {
    try {
        const template = await Template.findOne({ slug: req.params.slug });
        if (!template) {
            return res.status(404).json({
                messageKey: 'templates.notFoundBySlug',
                message: 'Template not found'
            });
        }
        res.json(template);
    } catch (error) {
        console.error('Şablon detayı (slug ile) alınırken hata oluştu:', error);
        res.status(500).json({
            messageKey: 'templates.fetchDetailError',
            message: 'An error occurred while fetching template details.'
        });
    }
});

// ─── GET /sablonlar/:id (ID ile direkt erişim) ─────────────────────
router.get('/sablonlar/:id', async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) {
            return res.status(404).json({
                messageKey: 'templates.notFoundById',
                message: 'Template not found'
            });
        }
        res.json(template);
    } catch (error) {
        console.error('Şablon detayı (ID ile) alınırken hata oluştu:', error);
        res.status(500).json({
            messageKey: 'templates.fetchDetailError',
            message: 'An error occurred while fetching template details.'
        });
    }
});

// ─── GET /templates/:id (eski rotadan slug'a yönlendirme) ─────────
router.get('/templates/:id', async (req, res) => {
    try {
        const oldId = req.params.id;
        if (oldIdToSlugMap[oldId]) {
            const currentSlug = oldIdToSlugMap[oldId];
            return res.redirect(301, `/sablonlar/detay/${currentSlug}`);
        }
        const template = await Template.findById(oldId);
        if (template && template.slug) {
            return res.redirect(301, `/sablonlar/detay/${template.slug}`);
        } else if (template && !template.slug) {
            return res.status(404).json({
                messageKey: 'templates.noSlugAssigned',
                message: 'Template found but no slug assigned.'
            });
        }
        return res.status(404).json({
            messageKey: 'templates.notFound',
            message: 'Template not found.'
        });
    } catch (error) {
        console.error('Eski ID rotası (/templates/:id) işlenirken hata oluştu:', error);
        res.status(500).json({
            messageKey: 'templates.redirectError',
            message: 'An error occurred while processing the old ID route.'
        });
    }
});

// ─── POST /templates/:id/generate-document ─────────────────────────
router.post('/templates/:id/generate-document', async (req, res) => {
    let pdfBuffer = null;
    let template = null;
    let newTransaction = null;
    let newConsentLog = null;

    try {
        template = await Template.findById(req.params.id);
        if (!template) {
            return res.status(404).json({
                messageKey: 'templates.notFound',
                message: 'Template not found'
            });
        }

        const { formData, editedHtml, consentTimestamp } = req.body;
        const userEmailForLog = formData?.belge_email || 'unknown@example.com';

        if (!consentTimestamp) {
            return res.status(400).json({
                messageKey: 'templates.consentMissing',
                message: 'User consent information is missing.'
            });
        }

        newTransaction = new Transaction({
            templateId: template._id,
            templateName: template.name || 'İsimsiz Şablon',
            userEmail: userEmailForLog,
            status: 'completed',
            amount: 0,
            currency: 'TRY',
            formDataSnapshot: JSON.stringify(formData),
            editedHtmlSnapshot: editedHtml || null
        });
        await newTransaction.save();

        const [activeKSTerms, activeOBFTerms, activeGizlilik] = await Promise.all([
            LegalDocument.findOne({ type: 'kullanim_sartlari', isActive: true }),
            LegalDocument.findOne({ type: 'on_bilgilendirme', isActive: true }),
            LegalDocument.findOne({ type: 'gizlilik_politikasi', isActive: true })
        ]);

        const ksVersion = activeKSTerms ? activeKSTerms.version : 'v_Bilinmiyor';
        const obfVersion = activeOBFTerms ? activeOBFTerms.version : 'v_Bilinmiyor';
        const gizlilikVersion = activeGizlilik ? activeGizlilik.version : 'v_Bilinmiyor';

        const dynamicDocumentVersion = `KS:${ksVersion}_OBF:${obfVersion}_Gizlilik:${gizlilikVersion}`;

        newConsentLog = new ConsentLog({
            transactionId: newTransaction._id,
            userEmail: userEmailForLog,
            ipAddress: req.ip || req.socket?.remoteAddress || 'N/A',
            userAgent: req.headers['user-agent'] || 'N/A',
            documentType: 'LEGAL_TERMS_AGREEMENT',
            documentVersion: dynamicDocumentVersion,
            consentTimestampClient: new Date(consentTimestamp)
        });
        await newConsentLog.save();

        let rawHtmlContent = "";

        if (editedHtml) {
            rawHtmlContent = editedHtml;
            console.log("Kullanıcının özel olarak düzenlediği HTML kullanılarak PDF hazırlanıyor.");
        } else {
            const compiledTemplate = Handlebars.compile(template.content || '');
            rawHtmlContent = compiledTemplate(formData);
            console.log("Standart Form verisi (Handlebars) kullanılarak PDF hazırlanıyor.");
        }

        const cleanHtmlContent = sanitizeHtmlForPdf(rawHtmlContent);

        const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                ${pdfStyles}
            </head>
            <body>
                ${cleanHtmlContent}
            </body>
            </html>
        `;

        pdfBuffer = await generatePdf(fullHtml);
        const safeFilename = turkceToLatin(template.name || 'Belge') + '.pdf';

        if (userEmailForLog !== 'unknown@example.com' && pdfBuffer) {
            // Kullanıcının dilini header'dan al (Varsayılan 'tr')
            const userLang = req.headers['accept-language']?.startsWith('en') ? 'en' : 'tr';

            // HTML/Text oluşturma satırlarının hepsini sildik. Sadece gerekli verileri mailer'a gönderiyoruz.
            sendPdfEmail(userEmailForLog, template.name, pdfBuffer, safeFilename, userLang)
                .catch(err => console.error("E-posta gönderilemedi:", err));
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error("İşlem Hatası:", error);

        if (newTransaction) {
            newTransaction.status = 'failed';
            newTransaction.errorMessage = error.message;
            await newTransaction.save();
        }

        if (!res.headersSent) {
            res.status(500).json({
                messageKey: 'templates.generateError',
                message: 'A server error occurred while generating the document.'
            });
        }
    }
});

router.post('/admin/sablonlar', protectAdmin, authorizeRole('SUPER_ADMIN', 'TEMPLATE_EDITOR'), createTemplate);

router.put('/admin/sablonlar/:id', protectAdmin, authorizeRole('SUPER_ADMIN', 'TEMPLATE_EDITOR'), updateTemplate);

router.delete('/admin/sablonlar/:id', protectAdmin, authorizeRole('SUPER_ADMIN'), deleteTemplate);

module.exports = router;