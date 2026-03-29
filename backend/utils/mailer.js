// backend/utils/mailer.js
const nodemailer = require('nodemailer');

const emailHost = process.env.EMAIL_HOST;
const emailPort = process.env.EMAIL_PORT; 
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const emailFrom = process.env.EMAIL_FROM; 

if (!emailHost || !emailPort || !emailUser || !emailPass || !emailFrom) {
  console.error('Hata: E-posta yapılandırması için gerekli ortam değişkenleri eksik! (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM)');

}

let transporter = null;
if (emailHost && emailPort && emailUser && emailPass && emailFrom) {
    transporter = nodemailer.createTransport({
        host: emailHost,
        port: parseInt(emailPort, 10),
        secure: parseInt(emailPort, 10) === 465, 
        auth: {
            user: emailUser,
            pass: emailPass,
        },
        tls: {
            rejectUnauthorized: false 
        },
        connectionTimeout: 10000, 
        greetingTimeout: 5000,
        socketTimeout: 15000
    });

    transporter.verify(function(error, success) {
        if (error) {
            console.error("E-posta taşıyıcı bağlantı hatası:", error);
        } else {
            console.log("E-posta taşıyıcı başarıyla yapılandırıldı ve hazır.");
        }
    });

} else {
  console.warn("E-posta gönderimi devre dışı: Eksik yapılandırma.");
}

const sendPdfEmail = async (to, subject, text, html, pdfBuffer, pdfFilename) => {
  if (!transporter) {
      console.error("E-posta gönderilemedi: Taşıyıcı yapılandırılamadı.");
      return; 
  }

  const mailOptions = {
      from: emailFrom,
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