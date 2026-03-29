// backend/utils/mailer.js

const { Resend } = require('resend');

const resend = new Resend(process.env.EMAIL_PASS);

const sendPdfEmail = async (to, subject, text, html, pdfBuffer, pdfFilename) => {
    try {
        const maskedEmail = to.replace(/^(.)(.*)(.@.*)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c);
        
        console.log(`Resend HTTP API üzerinden e-posta gönderimi başlatılıyor...`);

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: to,
            subject: subject,
            html: html,
            attachments: [
                {
                    filename: pdfFilename,
                    content: pdfBuffer,
                },
            ],
        });

        if (error) throw new Error(error.message);
        
        console.log('E-posta başarıyla gönderildi. İşlem ID:', data.id);
        return data;
    } catch (error) {
        console.error('E-posta gönderim hatası oluştu:', error.message);
        throw error;
    }
};

module.exports = { sendPdfEmail };