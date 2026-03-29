const { Resend } = require('resend');

const resend = new Resend(process.env.EMAIL_PASS);

const sendPdfEmail = async (to, subject, text, html, pdfBuffer, pdfFilename) => {
    try {
        console.log(`Resend HTTP API üzerinden e-posta gönderimi başlatılıyor: ${to}`);

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: to,
            subject: subject,
            text: text,
            html: html,
            attachments: [
                {
                    filename: pdfFilename,
                    content: pdfBuffer,
                },
            ],
        });

        if (error) {
            console.error('Resend API Hatası:', error);
            throw new Error(error.message);
        }

        console.log('E-posta başarıyla gönderildi. ID:', data.id);
        return data;
    } catch (error) {
        console.error('E-posta gönderim sırasında beklenmedik hata:', error);
        throw error;
    }
};

module.exports = { sendPdfEmail };