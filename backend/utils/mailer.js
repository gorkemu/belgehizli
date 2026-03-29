const nodemailer = require('nodemailer');

const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.resend.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 465,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM
};

const transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.port === 465, 
    auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
    },
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 15000 
});

transporter.verify((error, success) => {
    if (error) {
        console.error(`!!! RESEND BAĞLANTI HATASI (${emailConfig.port}):`, error.message);
    } else {
        console.log(`+++ RESEND HAZIR`);
    }
});

const sendPdfEmail = async (to, subject, text, html, pdfBuffer, pdfFilename) => {
    if (!transporter) {
        console.error("E-posta gönderilemedi: Taşıyıcı (transporter) başlatılamadı.");
        return;
    }

    const mailOptions = {
        from: emailConfig.from,
        to: to,
        subject: subject,
        text: text,
        html: html,
        attachments: [
            {
                filename: pdfFilename,
                content: pdfBuffer,
                contentType: 'application/pdf'
            },
        ],
    };

    try {
        console.log(`E-posta gönderimi başlatılıyor: ${to}`);
        let info = await transporter.sendMail(mailOptions);
        console.log('E-posta başarıyla gönderildi. Mesaj ID: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('E-posta gönderim hatası:', error);
        throw error;
    }
};

module.exports = { sendPdfEmail };