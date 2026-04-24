// backend/routes/userAuth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { protectUser } = require('../middleware/userAuthMiddleware');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/mailer');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '30d' });
};

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 10,
    message: { success: false, message: 'Çok fazla başarısız deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 saat
    max: 3,
    message: { success: false, message: 'Çok fazla hesap oluşturma isteği. Lütfen bir saat sonra tekrar deneyin.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/register', registerLimiter, async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'Lütfen zorunlu alanları doldurun.' });
        }

        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanımda.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            email: email.toLowerCase(),
            passwordHash
        });

        await newUser.save();

        res.status(201).json({
            _id: newUser.id,
            fullName: newUser.fullName,
            email: newUser.email,
            token: generateToken(newUser._id),
        });

    } catch (error) {
        console.error("Kayıt hatası:", error);
        res.status(500).json({ message: 'Hesabınız oluşturulurken sistemsel bir hata meydana geldi.' });
    }
});

router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({ message: 'Geçersiz e-posta veya şifre.' });
        }

        // 1. KONTROL: Hesap Kilitli mi?
        // lockUntil değeri var mı ve şu anki zamandan büyük mü?
        if (user.lockUntil && user.lockUntil > Date.now()) {
            return res.status(403).json({ message: 'Hesabınız çok fazla hatalı giriş denemesi nedeniyle geçici olarak kilitlendi. Lütfen 30 dakika sonra tekrar deneyin.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            // 2. KONTROL: Şifre yanlışsa deneme sayacını artır
            user.loginAttempts += 1;
            
            // 5 kez yanlış girildiyse hesabı 30 dakika kilitle
            if (user.loginAttempts >= 5) {
                user.lockUntil = Date.now() + 30 * 60 * 1000; // Şu an + 30 dakika
            }
            
            await user.save();
            return res.status(401).json({ message: 'Geçersiz e-posta veya şifre.' });
        }

        // 3. KONTROL: Şifre doğruysa sayaçları sıfırla ve içeri al
        if (!user.isActive) {
            return res.status(403).json({ message: 'Hesabınız askıya alınmış.' });
        }

        // Başarılı giriş: Kilidi ve sayacı temizle
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        res.json({
            _id: user.id,
            fullName: user.fullName,
            email: user.email,
            token: generateToken(user._id),
        });

    } catch (error) {
        console.error("Giriş hatası:", error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

router.get('/me', protectUser, async (req, res) => {
    try {
        res.json({
            _id: req.user.id,
            fullName: req.user.fullName,
            email: req.user.email
        });
    } catch (error) {
        res.status(500).json({ message: 'Kullanıcı bilgileri alınamadı.' });
    }
});

router.post('/forgot-password', authLimiter, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Lütfen e-posta adresinizi girin.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        const successMessage = 'Şifre sıfırlama bağlantısı gönderildi';

        if (!user) {
            return res.status(200).json({ message: successMessage });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000;
        
        await user.save();

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/sifre-belirle?token=${resetToken}`;

        // MAİL GÖNDERME İŞLEMİ
        await sendPasswordResetEmail(user.email, resetLink);

        res.status(200).json({ message: successMessage });

    } catch (error) {
        console.error("Şifremi unuttum hatası:", error);
        res.status(500).json({ message: 'İşlem sırasında bir hata oluştu.' });
    }
});

router.post('/set-password', authLimiter, async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Geçersiz istek. Lütfen tüm alanları doldurun.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Şifreniz en az 6 karakter olmalıdır.' });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() } 
        });

        if (!user) {
            return res.status(400).json({ message: 'Sıfırlama bağlantınız geçersiz veya süresi dolmuş.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ message: 'Şifreniz başarıyla oluşturuldu. Artık giriş yapabilirsiniz.' });

    } catch (error) {
        console.error("Şifre belirleme hatası:", error);
        res.status(500).json({ message: 'Şifre güncellenirken bir hata oluştu.' });
    }
});

router.put('/update-profile', protectUser, async (req, res) => {
    try {
        const { fullName, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        if (fullName) {
            user.fullName = fullName;
        }

        if (currentPassword && newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isMatch) {
                return res.status(400).json({ message: 'Mevcut şifreniz hatalı.' });
            }
            
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(newPassword, salt);
        }

        await user.save();

        res.json({
            _id: user._id,
            email: user.email,
            fullName: user.fullName
        });

    } catch (error) {
        console.error("Profil güncelleme hatası:", error);
        res.status(500).json({ message: 'Profil güncellenirken bir hata oluştu.' });
    }
});

module.exports = router;