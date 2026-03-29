const nodemailer = require('nodemailer');

const emailConfig = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 465,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM
};

let transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.port === 465,
    auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
    },
    connectionTimeout: 30000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
    tls: {
        rejectUnauthorized: false
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error("MAİLER HATASI (Bağlantı Kurulamadı):", error);
    } else {
        console.log("MAİLER BAŞARILI: Zoho sunucusuna bağlanıldı.");
    }
});

const sendPdfEmail = async (to, subject, text, html, pdfBuffer, pdfFilename) => {
    if (!transporter) {
        console.error("E-posta gönderilemedi: Taşıyıcı yapılandırılamadı.");
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
        console.log(`Sending PDF email to user...`);
        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully. Message ID: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = { sendPdfEmail };