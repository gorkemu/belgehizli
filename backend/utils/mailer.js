// backend/utils/mailer.js
const { Resend } = require('resend');

const getResendClient = () => {
    const apiKey = process.env.EMAIL_PASS || process.env.RESEND_API_KEY;

    if (!apiKey) {
        throw new Error("KRİTİK HATA: Resend API Key bulunamadı! Lütfen .env dosyasını kontrol edin.");
    }

    return new Resend(apiKey);
};

// Çoklu Dil Mail Sözlüğü (Dictionary)
const mailTranslations = {
    tr: {
        reset: {
            subject: 'Belge Hızlı - Şifre Sıfırlama Talebiniz',
            title: 'Şifre Sıfırlama Talebi',
            greeting: 'Merhaba,',
            body: 'Hesabınızın şifresini sıfırlamak için bir talepte bulundunuz. Aşağıdaki butona tıklayarak yeni şifrenizi güvenle belirleyebilirsiniz:',
            buttonText: 'Şifremi Sıfırla',
            ignoreWarning: 'Eğer bu talebi siz yapmadıysanız, bu e-postayı güvenle görmezden gelebilirsiniz. Şifreniz siz değiştirene kadar aynı kalacaktır.',
            footerInfo: 'Bu bağlantı güvenlik amacıyla 1 saat sonra geçersiz olacaktır.'
        },
        mfa: {
            subject: 'Belge Hızlı - Giriş Doğrulama Kodunuz',
            title: 'Giriş Doğrulama Kodu',
            body: 'Belge Hızlı hesabınıza giriş yapmak için tek kullanımlık doğrulama kodunuz:',
            footerInfo: 'Bu kodun geçerlilik süresi 5 dakikadır. Eğer giriş yapmaya çalışmıyorsanız, şifrenizi hemen değiştirin.'
        },
        pdf: {
            subject: 'Belgeniz Hazır: {{templateName}}',
            title: 'BELGE <span style="color: #a8a29e;">HIZLI</span>',
            greeting: 'Sayın İlgili,',
            body1: 'Sistemimiz üzerinden başarıyla oluşturduğunuz <strong>"{{templateName}}"</strong> adlı PDF dokümanı ekte tarafınıza sunulmuştur.',
            body2: 'İhtiyacınız halinde kendi şablonlarınızı oluşturmak, çalışma alanınızı yönetmek ve belgelerinizi güvenle saklamak için ücretsiz hesabınızı aktifleştirebilirsiniz.',
            buttonText: 'Ücretsiz Çalışma Alanı Oluştur',
            footer1: 'Bu otomatik bir sistem bildirimdir, lütfen bu mesaja yanıt vermeyiniz.',
            footer2: '© {{year}} Belge Hızlı. Tüm hakları saklıdır.'
        }
    },
    en: {
        reset: {
            subject: 'Belge Hızlı - Password Reset Request',
            title: 'Password Reset Request',
            greeting: 'Hello,',
            body: 'You recently requested to reset the password for your account. Click the button below to securely set your new password:',
            buttonText: 'Reset My Password',
            ignoreWarning: 'If you did not request a password reset, you can safely ignore this email. Your password will remain the same until you change it.',
            footerInfo: 'For security reasons, this link will expire in 1 hour.'
        },
        mfa: {
            subject: 'Belge Hızlı - Login Verification Code',
            title: 'Login Verification Code',
            body: 'Here is your one-time verification code to log in to your Belge Hızlı account:',
            footerInfo: 'This code is valid for 5 minutes. If you did not attempt to log in, please change your password immediately.'
        },
        pdf: {
            subject: 'Your Document is Ready: {{templateName}}',
            title: 'BELGE <span style="color: #a8a29e;">HIZLI</span>',
            greeting: 'Dear User,',
            body1: 'The PDF document named <strong>"{{templateName}}"</strong>, which you successfully generated via our system, is attached to this email.',
            body2: 'If you need to create your own templates, manage your workspace, and securely store your documents, you can activate your free account.',
            buttonText: 'Create Free Workspace',
            footer1: 'This is an automated system notification, please do not reply.',
            footer2: '© {{year}} Belge Hızlı. All rights reserved.'
        }
    }
};

const sendPdfEmail = async (to, templateName, pdfBuffer, pdfFilename, lang = 'tr') => {
    try {
        const resend = getResendClient();
        const t = mailTranslations[lang] || mailTranslations['tr'];
        const currentYear = new Date().getFullYear();
        
        const safeTemplateName = templateName || 'Belge / Document';
        const subject = t.pdf.subject.replace('{{templateName}}', safeTemplateName);

        const htmlContent = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1c1917; max-width: 560px; margin: 0 auto; border: 1px solid #e7e5e4; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
                <div style="background-color: #f5f5f4; padding: 24px; border-bottom: 1px solid #e7e5e4; text-align: left;">
                    <span style="font-size: 16px; font-weight: 800; color: #1c1917; letter-spacing: -0.02em;">${t.pdf.title}</span>
                </div>
                <div style="padding: 32px 24px;">
                    <p style="font-size: 15px; line-height: 1.6; color: #57534e; margin-top: 0;">${t.pdf.greeting}</p>
                    <p style="font-size: 15px; line-height: 1.6; color: #57534e;">
                        ${t.pdf.body1.replace('{{templateName}}', safeTemplateName)}
                    </p>
                    <p style="font-size: 15px; line-height: 1.6; color: #57534e;">
                        ${t.pdf.body2}
                    </p>
                    <div style="margin: 32px 0 16px 0;">
                        <a href="https://www.belgehizli.com" target="_blank" rel="noopener noreferrer" 
                           style="display: inline-block; background-color: #1c1917; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                           ${t.pdf.buttonText}
                        </a>
                    </div>
                </div>
                <div style="background-color: #fafaf9; padding: 16px 24px; border-top: 1px solid #e7e5e4;">
                    <p style="font-size: 12px; color: #a8a29e; margin: 0; line-height: 1.5;">
                        ${t.pdf.footer1}<br>
                        ${t.pdf.footer2.replace('{{year}}', currentYear)}
                    </p>
                </div>
            </div>
        `;

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: to,
            subject: subject,
            html: htmlContent,
            attachments: [
                {
                    filename: pdfFilename,
                    content: pdfBuffer,
                },
            ],
        });

        if (error) throw new Error(error.message);

        console.log(`PDF e-postası başarıyla gönderildi (${lang}). İşlem ID:`, data.id);
        return data;
    } catch (error) {
        console.error('PDF e-postası gönderim hatası:', error.message);
        throw error;
    }
};

const sendPasswordResetEmail = async (to, resetLink, lang = 'tr') => {
    try {
        const resend = getResendClient();
        const t = mailTranslations[lang] || mailTranslations['tr'];

        const htmlContent = `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e7e5e4; border-radius: 12px;">
                <h2 style="color: #1c1917; margin-bottom: 20px;">${t.reset.title}</h2>
                <p style="color: #57534e; font-size: 16px; line-height: 1.5;">${t.reset.greeting}</p>
                <p style="color: #57534e; font-size: 16px; line-height: 1.5;">${t.reset.body}</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">${t.reset.buttonText}</a>
                </div>
                
                <p style="color: #57534e; font-size: 14px; line-height: 1.5;">${t.reset.ignoreWarning}</p>
                <p style="color: #a8a29e; font-size: 12px; margin-top: 30px; text-align: center;">${t.reset.footerInfo}</p>
            </div>
        `;

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: to,
            subject: t.reset.subject,
            html: htmlContent,
        });

        if (error) throw new Error(error.message);

        console.log(`Şifre sıfırlama e-postası başarıyla gönderildi (${lang}). İşlem ID:`, data.id);
        return data;
    } catch (error) {
        console.error('Şifre sıfırlama e-postası gönderim hatası:', error.message);
        throw error;
    }
};

const sendMfaEmail = async (to, otpCode, lang = 'tr') => {
    try {
        const resend = getResendClient();
        const t = mailTranslations[lang] || mailTranslations['tr'];

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e7e5e4; border-radius: 12px; text-align: center;">
                <h2 style="color: #1c1917; margin-bottom: 20px;">${t.mfa.title}</h2>
                <p style="color: #57534e; font-size: 16px;">${t.mfa.body}</p>
                <div style="margin: 30px 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">
                    ${otpCode}
                </div>
                <p style="color: #a8a29e; font-size: 14px;">${t.mfa.footerInfo}</p>
            </div>
        `;

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: to,
            subject: t.mfa.subject,
            html: htmlContent,
        });

        if (error) throw new Error(error.message);
        console.log(`MFA e-postası başarıyla gönderildi (${lang}) [${otpCode}]. İşlem ID:`, data.id);
        return data;
    } catch (error) {
        console.error('MFA e-postası gönderim hatası:', error.message);
        throw error;
    }
};

module.exports = { sendPdfEmail, sendPasswordResetEmail, sendMfaEmail };