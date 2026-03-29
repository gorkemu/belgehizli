const nodemailer = require('nodemailer');

const emailConfig = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM
};

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, 
    port: 465,
    secure: true, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false
    },
    connectionTimeout: 20000, 
    greetingTimeout: 20000,
    socketTimeout: 30000,
});

transporter.verify((error, success) => {
    if (error) {
        console.error("!!! MAİLER BAĞLANTI HATASI (587):", error.message);
    } else {
        console.log("+++ MAİLER BAŞARILI: Zoho 587 portu üzerinden hazır.");
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