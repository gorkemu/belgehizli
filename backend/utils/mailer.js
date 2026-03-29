const nodemailer = require('nodemailer');

const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.zoho.eu',
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
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false
    },
    connectionTimeout: 30000,
    greetingTimeout: 20000,
    socketTimeout: 45000
});

transporter.verify((error, success) => {
    if (error) {
        console.error(`!!! MAİLER BAĞLANTI HATASI (${emailConfig.port}):`, error.message);
    } else {
        console.log(`+++ MAİLER BAŞARILI: Zoho ${emailConfig.port} portu üzerinden hazır.`);
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