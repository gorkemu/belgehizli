const express = require('express');
const router = express.Router();
const Template = require('../models/template');
const Transaction = require('../models/transaction');
const Invoice = require('../models/invoice');
const ConsentLog = require('../models/consentLog');
const { generatePdf } = require('../pdf-generator/pdfGenerator');
const { sendPdfEmail } = require('../utils/mailer');
const { sanitizeHtmlForPdf } = require('../utils/sanitizer');
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
        const templates = await Template.find({}, '_id name description price slug');
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

router.post('/templates/:id/process-payment', async (req, res) => {
    let pdfBuffer = null;
    let template = null;
    let newTransaction = null;
    let newConsentLog = null;

    try {
        template = await Template.findById(req.params.id);
        if (!template) return res.status(404).json({ message: 'Şablon bulunamadı' });

        const { formData, editedHtml, consentTimestamp, documentVersion } = req.body;
        const userEmailForLog = formData?.belge_email || 'unknown@example.com';

        if (!consentTimestamp || !documentVersion) {
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

        newConsentLog = new ConsentLog({
            transactionId: newTransaction._id,
            userEmail: userEmailForLog,
            ipAddress: req.ip || req.socket?.remoteAddress || 'N/A',
            userAgent: req.headers['user-agent'] || 'N/A',
            documentType: 'LEGAL_TERMS_AGREEMENT',
            documentVersion: documentVersion,
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
            const emailSubject = `Belge Hızlı - ${template.name} Belgeniz 🎉`;

            const emailHtml = `
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                
                <div style="background-color: #2563eb; padding: 24px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Belgeniz Hazır!</h1>
                </div>
                
                <div style="padding: 32px; background-color: #ffffff;">
                  <p style="font-size: 16px; line-height: 1.6; color: #334155;">Merhaba,</p>
                  <p style="font-size: 16px; line-height: 1.6; color: #334155;">
                    Belge Hızlı kullanarak oluşturduğunuz <strong>${template.name || 'Belge'}</strong> başarıyla hazırlandı ve ekte tarafınıza sunuldu.
                  </p>
                  
                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
                  
                  <div style="background-color: #ffffff; border: 2px solid #fde68a; border-radius: 16px; padding: 32px 24px; text-align: center;">
                    
                    <div style="display: inline-block; background-color: #fffbeb; width: 64px; height: 64px; border-radius: 50%; line-height: 64px; font-size: 28px; margin-bottom: 16px;">
                      ☕
                    </div>
                    
                    <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px; font-weight: 800;">Bu Projeye Destek Olun 🎉</h3>
                    
                    <p style="font-size: 15px; color: #475569; margin-bottom: 24px; line-height: 1.6;">
                      Belge Hızlı'yı reklamsız, aboneliksiz ve tamamen ücretsiz tutmak için çalışıyorum. 
                      Eğer bu belge işinizi çözdüyse ve bu amme hizmetinin devam etmesini isterseniz, 
                      bana bir kahve ısmarlayarak destek olabilirsiniz. 💛
                    </p>
                    
                    <a href="https://www.shopier.com/belgehizli/45489886" 
                       style="display: inline-block; background-color: #fffbeb; color: #b45309; border: 1px solid #fcd34d; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">
                       Bana Bir Kahve Ismarla
                    </a>
                    
                  </div>
                </div>
                
                <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="font-size: 12px; color: #94a3b8; margin: 0;">© ${new Date().getFullYear()} Belge Hızlı - Hızlı, Güvenilir, Ücretsiz.</p>
                  
                  <span style="display: none !important; opacity: 0; font-size: 0px; color: #f8fafc; max-height: 0; line-height: 0; overflow: hidden;">
                    ${Date.now()}
                  </span>
                </div>
                
              </div>
            `;

            const emailText = `Merhaba, ${template.name} belgeniz ektedir. Geliştiriciye destek olmak için: https://www.shopier.com/belgehizli/45489886`;

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

router.get('/sitemap.xml', async (req, res) => {
    try {
        const templates = await Template.find({}, 'slug updatedAt').lean();
        let xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        const staticUrls = [
            { loc: 'https://www.belgehizli.com/', changefreq: 'weekly', priority: '1.0' },
            { loc: 'https://www.belgehizli.com/sablonlar', changefreq: 'daily', priority: '0.9' },
            { loc: 'https://www.belgehizli.com/hakkimizda', changefreq: 'monthly', priority: '0.7' },
            { loc: 'https://www.belgehizli.com/iletisim', changefreq: 'monthly', priority: '0.7' },
            { loc: 'https://www.belgehizli.com/gizlilik-politikasi', changefreq: 'monthly', priority: '0.5' },
            { loc: 'https://www.belgehizli.com/kullanim-sartlari', changefreq: 'monthly', priority: '0.5' },
            { loc: 'https://www.belgehizli.com/on-bilgilendirme-formu', changefreq: 'monthly', priority: '0.5' },
        ];

        staticUrls.forEach(url => {
            xml += `<url><loc>${url.loc}</loc><changefreq>${url.changefreq}</changefreq><priority>${url.priority}</priority></url>`;
        });

        templates.forEach(template => {
            if (template.slug) {
                const lastMod = template.updatedAt ? format(new Date(template.updatedAt), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
                const loc = `https://www.belgehizli.com/sablonlar/detay/${template.slug}`;
                xml += `<url><loc>${loc}</loc><lastmod>${lastMod}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`;
            }
        });

        xml += `</urlset>`;
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (error) {
        console.error('Sitemap oluşturulurken hata oluştu:', error);
        res.status(500).send('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
    }
});

module.exports = router;