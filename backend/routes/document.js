const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const Transaction = require('../models/transaction');
const Template = require('../models/template');
const { createPdfForTransaction } = require('../utils/documentService');
const { sendPdfEmail } = require('../utils/mailer');

const documentActionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { message: 'Çok fazla belge işlemi denemesi yaptınız. Lütfen biraz bekleyin.' }
});

router.get('/download/:transactionId', documentActionLimiter, async (req, res) => {
    try {
        const transactionId = req.params.transactionId;
        if (!mongoose.Types.ObjectId.isValid(transactionId)) {
            return res.status(400).json({ message: 'Geçersiz işlem ID formatı.' });
        }
        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'İşlem kaydı bulunamadı.' });
        }
        if (!['completed', 'email_sent', 'pdf_generated'].includes(transaction.status)) {
            return res.status(403).json({ message: 'Bu belge için indirme işlemi henüz hazır değil.' });
        }
        const template = await Template.findById(transaction.templateId);
        if (!template) {
            return res.status(404).json({ message: 'İşleme ait şablon bulunamadı.' });
        }
        if (!transaction.formDataSnapshot && !transaction.editedHtmlSnapshot) {
            return res.status(410).json({ 
                message: 'Güvenliğiniz ve veri politikalarımız gereği, bu belgedeki kişisel veriler oluşturulduktan 24 saat sonra sistemimizden kalıcı olarak silinmiştir. Belgeye tekrar ihtiyacınız varsa lütfen yeni bir form doldurarak ücretsiz oluşturun.' 
            });
        }
        let formDataToUse;
        try { formDataToUse = JSON.parse(transaction.formDataSnapshot); }
        catch (e) { return res.status(500).json({ message: 'Form verisi okunamadı.' }); }

        const pdfResult = await createPdfForTransaction(transaction, template, formDataToUse);

        if (pdfResult && pdfResult.pdfBuffer && pdfResult.safeFilename) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
            res.setHeader('Content-Disposition', `attachment; filename="${pdfResult.safeFilename}"`);
            res.send(pdfResult.pdfBuffer);
        } else {
            console.error("Backend /download: pdfResult, pdfBuffer, or safeFilename is missing.");
            res.status(500).json({ message: 'PDF oluşturulurken bir hata oluştu veya dosya adı bilgisi eksik.' });
        }
    } catch (error) {
        console.error(`Error in /document/download/${req.params.transactionId}:`, error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Belge indirilirken bir sunucu hatası oluştu.' });
        }
    }
});

router.post('/resend-email/:transactionId', documentActionLimiter, async (req, res) => {
    try {
        const transactionId = req.params.transactionId;
        if (!mongoose.Types.ObjectId.isValid(transactionId)) {
            return res.status(400).json({ message: 'Geçersiz işlem ID formatı.' });
        }
        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'İşlem kaydı bulunamadı.' });
        }
        if (!transaction.userEmail || transaction.userEmail === 'unknown@example.com') {
            return res.status(400).json({ message: 'Bu işlem için geçerli bir kullanıcı e-postası bulunmuyor.' });
        }
        if (!transaction.formDataSnapshot && !transaction.editedHtmlSnapshot) {
            return res.status(410).json({ 
                message: 'Güvenliğiniz ve veri politikalarımız gereği, bu belgedeki kişisel veriler oluşturulduktan 24 saat sonra sistemimizden kalıcı olarak silinmiştir. Belgeye tekrar ihtiyacınız varsa lütfen yeni bir form doldurarak ücretsiz oluşturun.' 
            });
        }
        const template = await Template.findById(transaction.templateId);
        if (!template) {
            return res.status(404).json({ message: 'İşleme ait şablon bulunamadı, e-posta gönderilemiyor.' });
        }
        let formDataToUse;
        try { formDataToUse = JSON.parse(transaction.formDataSnapshot); }
        catch (e) { return res.status(500).json({ message: 'Kaydedilmiş form verisi okunamadı, e-posta gönderilemiyor.' }); }

        console.log(`Resending email for transaction ${transaction._id} to ${transaction.userEmail}`);
        const pdfResult = await createPdfForTransaction(transaction, template, formDataToUse);

        if (!pdfResult || !pdfResult.pdfBuffer || !pdfResult.safeFilename) {
            console.error(`Resend Email: PDF or safeFilename could not be generated for transaction ${transaction._id}`);
            return res.status(500).json({ message: 'E-posta için PDF veya dosya adı oluşturulamadı.' });
        }

        const emailSubject = `Belge Hızlı - ${template.name || 'Belge'} Belgeniz (Tekrar Gönderim)`;
        const emailHtml = `<p>Merhaba,</p><p>Talebiniz üzerine, Belge Hızlı platformunu kullanarak oluşturduğunuz <strong>${template.name || 'Belge'}</strong> belgesi tekrar ektedir.</p><p>İyi günlerde kullanın!</p><br><p>Saygılarımızla,<br>Belge Hızlı Ekibi</p>`;
        
        await sendPdfEmail(transaction.userEmail, emailSubject, emailHtml, emailHtml, pdfResult.pdfBuffer, pdfResult.safeFilename);
        
        console.log(`Email resent successfully for transaction ${transaction._id}`);
        res.status(200).json({ message: 'E-posta başarıyla tekrar gönderildi.' });

    } catch (error) {
        console.error(`Error in /document/resend-email/${req.params.transactionId}:`, error);
        if (error.code === 'EAUTH' || error.responseCode === 535) {
             return res.status(502).json({ message: 'E-posta sunucusunda kimlik doğrulama hatası.' });
        }
        if (!res.headersSent) {
            res.status(500).json({ message: error.message || 'E-posta tekrar gönderilirken bir sunucu hatası oluştu.' });
        }
    }
});

module.exports = router;