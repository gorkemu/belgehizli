// backend/utils/mailer.js
const { Resend } = require('resend');

const getResendClient = () => {
    const apiKey = process.env.EMAIL_PASS || process.env.RESEND_API_KEY;

    if (!apiKey) {
        throw new Error("KRİTİK HATA: Resend API Key bulunamadı! Lütfen .env dosyasını kontrol edin.");
    }

    return new Resend(apiKey);
};

const sendPdfEmail = async (to, subject, text, html, pdfBuffer, pdfFilename) => {
    try {
        const maskedEmail = to.replace(/^(.)(.*)(.@.*)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c);
        console.log(`Resend HTTP API üzerinden e-posta gönderimi başlatılıyor...`);

        const resend = getResendClient();

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

const sendPasswordResetEmail = async (to, resetLink) => {
    try {
        const resend = getResendClient();

        // E-posta tasarımı (HTML)
        const htmlContent = `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e7e5e4; border-radius: 12px;">
                <h2 style="color: #1c1917; margin-bottom: 20px;">Şifre Sıfırlama Talebi</h2>
                <p style="color: #57534e; font-size: 16px; line-height: 1.5;">Merhaba,</p>
                <p style="color: #57534e; font-size: 16px; line-height: 1.5;">Hesabınızın şifresini sıfırlamak için bir talepte bulundunuz. Aşağıdaki butona tıklayarak yeni şifrenizi güvenle belirleyebilirsiniz:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Şifremi Sıfırla</a>
                </div>
                
                <p style="color: #57534e; font-size: 14px; line-height: 1.5;">Eğer bu talebi siz yapmadıysanız, bu e-postayı güvenle görmezden gelebilirsiniz. Şifreniz siz değiştirene kadar aynı kalacaktır.</p>
                <p style="color: #a8a29e; font-size: 12px; margin-top: 30px; text-align: center;">Bu bağlantı güvenlik amacıyla 1 saat sonra geçersiz olacaktır.</p>
            </div>
        `;

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: to,
            subject: 'Belge Hızlı - Şifre Sıfırlama Talebiniz',
            html: htmlContent,
        });

        if (error) throw new Error(error.message);

        console.log('Şifre sıfırlama e-postası başarıyla gönderildi. İşlem ID:', data.id);
        return data;
    } catch (error) {
        console.error('Şifre sıfırlama e-postası gönderim hatası:', error.message);
        throw error;
    }
};

const sendMfaEmail = async (to, otpCode) => {
    try {
        const resend = getResendClient();
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e7e5e4; border-radius: 12px; text-align: center;">
                <h2 style="color: #1c1917; margin-bottom: 20px;">Giriş Doğrulama Kodu</h2>
                <p style="color: #57534e; font-size: 16px;">Belge Hızlı hesabınıza giriş yapmak için tek kullanımlık doğrulama kodunuz:</p>
                <div style="margin: 30px 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">
                    ${otpCode}
                </div>
                <p style="color: #a8a29e; font-size: 14px;">Bu kodun geçerlilik süresi 5 dakikadır. Eğer giriş yapmaya çalışmıyorsanız, şifrenizi hemen değiştirin.</p>
            </div>
        `;

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: to,
            subject: 'Belge Hızlı - Giriş Doğrulama Kodunuz',
            html: htmlContent,
        });

        if (error) throw new Error(error.message);
        console.log(`MFA e-postası başarıyla gönderildi (${otpCode}). İşlem ID:`, data.id);
        return data;
    } catch (error) {
        console.error('MFA e-postası gönderim hatası:', error.message);
        throw error;
    }
};

module.exports = { sendPdfEmail, sendPasswordResetEmail, sendMfaEmail };