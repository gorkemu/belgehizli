// backend/utils/documentService.js
const mongoose = require('mongoose');
const Template = require('../models/template');
const Transaction = require('../models/transaction');
const Invoice = require('../models/invoice'); 
const { generatePdf } = require('../pdf-generator/pdfGenerator');
const { sendPdfEmail } = require('../utils/mailer');
const path = require('path');
const fs = require('fs');
const Handlebars = require('handlebars'); 

const cssFilePath = path.join(__dirname, '..', 'styles', 'pdfStyles.css');
let pdfStyles = '';
try {
    const cssContent = fs.readFileSync(cssFilePath, 'utf8');
    pdfStyles = `<style>\n${cssContent}\n</style>`;
} catch (error) {
    console.error(`documentService: PDF stilleri CSS dosyasını okuma hatası: ${cssFilePath}`, error);
}

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

Handlebars.registerHelper('formatDate', function(dateString) {
    if (!dateString || typeof dateString !== 'string') return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    } catch (e) { return dateString; }
});

const createPdfForTransaction = async (transaction, template, formDataKullanilacak) => {
    try {
        let fullHtml = "";

        if (transaction.editedHtmlSnapshot) {
            const content = transaction.editedHtmlSnapshot;

            fullHtml = `
                <!DOCTYPE html><html><head><meta charset="utf-8" /><title>${template.name || 'Document'}</title>${pdfStyles}</head>
                <body><div>${content}</div></body></html>`;
        } 
        else {
            const compiledTemplate = Handlebars.compile(template.content || '');
            const htmlContent = compiledTemplate(formDataKullanilacak);

            fullHtml = `
                <!DOCTYPE html><html><head><meta charset="utf-8" /><title>${template.name || 'Document'}</title>${pdfStyles}</head>
                <body><div>${htmlContent}</div></body></html>`;
        }

        const pdfBuffer = await generatePdf(fullHtml);
        const safeFilename = turkceToLatin(template.name || 'Belge') + '.pdf';
        return { pdfBuffer, safeFilename };
    } catch (error) {
        console.error(`createPdfForTransaction: Error generating PDF for transaction ${transaction._id}:`, error);

        if (transaction) {
            transaction.errorMessage = (transaction.errorMessage || '') + '; PDF oluşturma hatası: ' + error.message;
            await transaction.save();
        }
        return null;
    }
};

const generateAndDeliverDocument = async (transactionId) => {
    let transaction;
    let template;
    let userEmailForDelivery = null;
    let formDataToUse = null; 
    let billingInfoToUse = null; 

    try {
        if (!mongoose.Types.ObjectId.isValid(transactionId)) {
            console.error(`documentService: Geçersiz transactionId formatı: ${transactionId}`);
            return { success: false, message: 'Geçersiz işlem ID formatı.' };
        }

        transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return { success: false, message: 'İşlem bulunamadı.' };
        }

        if (transaction.status !== 'payment_successful') {
             if (['pdf_generated', 'email_sent', 'completed', 'failed'].includes(transaction.status)) {
                return { success: true, message: `İşlem daha önce işlenmiş. Durum: ${transaction.status}`, status: transaction.status };
             }
             return { success: false, message: `İşlem ödeme bekliyor veya başarısız: ${transaction.status}` };
        }

        template = await Template.findById(transaction.templateId);
        if (!template) {
            transaction.status = 'failed';
            transaction.errorMessage = 'Belge şablonu bulunamadı (servis).';
            await transaction.save();
            return { success: false, message: 'Belge şablonu bulunamadı.' };
        }

        if (!transaction.formDataSnapshot) {
            transaction.status = 'failed';
            transaction.errorMessage = 'Belge oluşturmak için form verisi (snapshot) bulunamadı.';
            await transaction.save();
            return { success: false, message: 'Belge oluşturmak için gerekli form verisi eksik.' };
        }
        try {
            formDataToUse = JSON.parse(transaction.formDataSnapshot);
        } catch (parseError) {
            transaction.status = 'failed';
            transaction.errorMessage = 'Form verisi parse edilemedi.';
            await transaction.save();
            return { success: false, message: 'Kaydedilmiş form verisi bozuk.' };
        }

        if (transaction.billingInfoSnapshot) {
            try {
                billingInfoToUse = JSON.parse(transaction.billingInfoSnapshot);
            } catch (parseError) {
                transaction.errorMessage = (transaction.errorMessage || '') + '; Fatura bilgisi parse edilemedi.';
            }
        }

        // İngilizce ve Türkçe email değişkenlerini kontrol et
        userEmailForDelivery = billingInfoToUse?.email || formDataToUse?.belge_email || formDataToUse?.document_email || transaction.userEmail;

        const pdfResult = await createPdfForTransaction(transaction, template, formDataToUse);

        if (!pdfResult || !pdfResult.pdfBuffer) {
            return { success: false, message: 'PDF oluşturulamadı.' };
        }
        transaction.status = 'pdf_generated';
        await transaction.save();

        if (userEmailForDelivery && userEmailForDelivery !== 'unknown@example.com' && pdfResult.pdfBuffer) {
            console.log(`documentService: Initiating PDF email dispatch for transaction ${transaction._id}`);
            try {
                const lang = template.language || 'tr';
                
                await sendPdfEmail(
                    userEmailForDelivery, 
                    template.name, 
                    pdfResult.pdfBuffer, 
                    pdfResult.safeFilename, 
                    lang
                );
                
                transaction.status = 'email_sent';
                await transaction.save();
            } catch (emailError) {
                console.error(`documentService: Error during PDF email dispatch:`, emailError);
                transaction.errorMessage = (transaction.errorMessage ? transaction.errorMessage + '; ' : '') + 'E-posta gönderim hatası: ' + emailError.message;
                await transaction.save();
            }
        }

        if (billingInfoToUse && Object.keys(billingInfoToUse).length > 0 && billingInfoToUse.email && !transaction.invoiceId) {
            try {
                const newInvoice = new Invoice({
                    transactionId: transaction._id,
                    templateName: template.name || 'İsimsiz Şablon',
                    status: 'pending_creation',
                    amount: transaction.amount,
                    currency: transaction.currency,
                    billingType: billingInfoToUse.billingType,
                    customerName: billingInfoToUse.billingType === 'bireysel' ? billingInfoToUse.name : undefined,
                    customerTckn: billingInfoToUse.billingType === 'bireysel' ? billingInfoToUse.tckn : undefined,
                    companyName: billingInfoToUse.billingType === 'kurumsal' ? billingInfoToUse.companyName : undefined,
                    taxOffice: billingInfoToUse.billingType === 'kurumsal' ? billingInfoToUse.taxOffice : undefined,
                    taxId: billingInfoToUse.billingType === 'kurumsal' ? billingInfoToUse.vkn : undefined,
                    customerAddress: billingInfoToUse.address,
                    customerEmail: billingInfoToUse.email,
                });
                await newInvoice.save();
                transaction.invoiceId = newInvoice._id;
                await transaction.save();
            } catch (invoiceError) {
                console.error(`documentService: Error creating invoice record:`, invoiceError);
                transaction.errorMessage = (transaction.errorMessage ? transaction.errorMessage + '; ' : '') + 'Fatura kaydı oluşturma hatası: ' + invoiceError.message;
                await transaction.save();
            }
        }

        if (transaction.status !== 'failed') {
             transaction.status = 'completed';
             await transaction.save();
        }

        return { success: true, message: 'Belge başarıyla işlendi.', status: transaction.status };

    } catch (error) {
        console.error(`documentService: General error processing document:`, error);
        if (transaction && transaction._id && transaction.status !== 'failed') {
            try {
                 transaction.status = 'failed';
                 transaction.errorMessage = (transaction.errorMessage ? transaction.errorMessage + '; ' : '') + 'Belge işleme genel hata: ' + error.message;
                 await transaction.save();
            } catch (dbError) {
                 console.error(`documentService: Error updating transaction failed status:`, dbError);
            }
        }
        return { success: false, message: error.message || 'Belge işlenirken bir sunucu hatası oluştu.' };
    }
};

module.exports = { generateAndDeliverDocument, createPdfForTransaction };