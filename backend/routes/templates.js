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

router.get('/sablonlar', async (req, res) => {
    try {
        const templates = await Template.find(
            { 
                isSystem: true, 
                isActive: true 
            }, 
            '_id name description price slug'
        );
        
        res.json(templates);
    } catch (error) {
        console.error('Şablonlar alınırken hata oluştu:', error);
        res.status(500).json({ message: 'Şablonlar alınırken bir hata oluştu.' });
    }
});

router.get('/sablonlar/detay/:slug', async (req, res) => {
    try {
        const template = await Template.findOne({ slug: req.params.slug });
        if (!template) {
            return res.status(404).json({ message: 'Şablon bulunamadı' });
        }
        res.json(template);
    } catch (error) {
        console.error('Şablon detayı (slug ile) alınırken hata oluştu:', error);
        res.status(500).json({ message: 'Şablon detayı alınırken bir hata oluştu.' });
    }
});

router.get('/sablonlar/:id', async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ message: 'Şablon bulunamadı' });
        }
        res.json(template);
    } catch (error) {
        console.error('Şablon detayı (ID ile) alınırken hata oluştu:', error);
        res.status(500).json({ message: 'Şablon detayı alınırken bir hata oluştu.' });
    }
});

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
            return res.status(404).json({ message: 'Şablon bulundu ancak slug atanmamış.' });
        }
        return res.status(404).json({ message: 'Şablon bulunamadı.' });
    } catch (error) {
        console.error('Eski ID rotası (/templates/:id) işlenirken hata oluştu:', error);
        res.status(500).json({ message: 'Şablon detayı alınırken bir sunucu hatası oluştu.' });
    }
});

router.post('/templates/:id/generate-document', async (req, res) => {
    let pdfBuffer = null;
    let template = null;
    let newTransaction = null;
    let newConsentLog = null;

    try {
        template = await Template.findById(req.params.id);
        if (!template) return res.status(404).json({ message: 'Şablon bulunamadı' });

        const { formData, editedHtml, consentTimestamp } = req.body;
        const userEmailForLog = formData?.belge_email || 'unknown@example.com';

        if (!consentTimestamp) {
            return res.status(400).json({ message: 'Kullanıcı onayı bilgileri eksik.' });
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
            const emailSubject = `[Sistem Bildirimi] Belgeniz Hazır: ${template.name}`;

            const emailHtml = `
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1c1917; max-width: 560px; margin: 0 auto; border: 1px solid #e7e5e4; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
                
                <div style="background-color: #f5f5f4; padding: 24px; border-bottom: 1px solid #e7e5e4; text-align: left;">
                  <span style="font-size: 16px; font-weight: 800; color: #1c1917; letter-spacing: -0.02em;">BELGE <span style="color: #a8a29e;">HIZLI</span></span>
                </div>
                
                <div style="padding: 32px 24px;">
                  <p style="font-size: 15px; line-height: 1.6; color: #57534e; margin-top: 0;">Sayın İlgili,</p>
                  
                  <p style="font-size: 15px; line-height: 1.6; color: #57534e;">
                    Sistemimiz üzerinden başarıyla oluşturduğunuz <strong>"${template.name || 'Belge'}"</strong> adlı PDF dokümanı ekte tarafınıza sunulmuştur.
                  </p>
                  
                  <p style="font-size: 15px; line-height: 1.6; color: #57534e;">
                    İhtiyacınız halinde kendi şablonlarınızı oluşturmak, çalışma alanınızı yönetmek ve belgelerinizi güvenle saklamak için ücretsiz hesabınızı aktifleştirebilirsiniz.
                  </p>
                  
                  <div style="margin: 32px 0 16px 0;">
                    <a href="https://www.belgehizli.com/kayit-ol" 
                       style="display: inline-block; background-color: #1c1917; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                       Ücretsiz Çalışma Alanı Oluştur
                    </a>
                  </div>
                </div>
                
                <div style="background-color: #fafaf9; padding: 16px 24px; border-top: 1px solid #e7e5e4;">
                  <p style="font-size: 12px; color: #a8a29e; margin: 0; line-height: 1.5;">
                    Bu otomatik bir sistem bildirimdir, lütfen bu mesaja yanıt vermeyiniz.<br>
                    © ${new Date().getFullYear()} Belge Hızlı. Tüm hakları saklıdır.
                  </p>
                </div>
                
              </div>
            `;

            const emailText = `Sayın İlgili, "${template.name}" adlı belgeniz ekte yer almaktadır. Kendi şablonlarınızı oluşturmak için platformumuzu ücretsiz deneyebilirsiniz: https://www.belgehizli.com/kayit-ol`;

            sendPdfEmail(userEmailForLog, emailSubject, emailText, emailHtml, pdfBuffer, safeFilename)
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
            res.status(500).json({ message: 'Belge oluşturulurken bir sunucu hatası meydana geldi.' });
        }
    }
});

router.post('/admin/sablonlar', protectAdmin, authorizeRole('SUPER_ADMIN', 'TEMPLATE_EDITOR'), createTemplate);

router.put('/admin/sablonlar/:id', protectAdmin, authorizeRole('SUPER_ADMIN', 'TEMPLATE_EDITOR'), updateTemplate);

router.delete('/admin/sablonlar/:id', protectAdmin, authorizeRole('SUPER_ADMIN'), deleteTemplate);

module.exports = router;