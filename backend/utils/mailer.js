const { Resend } = require('resend');
const resend = new Resend(process.env.EMAIL_PASS);

const sendPdfEmail = async (to, subject, text, html, pdfBuffer, pdfFilename) => {
    try {
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
        console.log('E-posta başarıyla gönderildi:', data.id);
        return data;
    } catch (error) {
        console.error('Gönderim hatası:', error);
        throw error;
    }
};

module.exports = { sendPdfEmail };