const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const AdminUser = require('../models/adminUser');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: 'Çok fazla giriş denemesi yaptınız. Güvenlik gereği IP adresiniz 15 dakika kilitlendi.' }
});

router.post('/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;

    const jwtSecretEnv = process.env.JWT_SECRET;
    const jwtExpiresInEnv = process.env.JWT_EXPIRES_IN || '1h';

    if (!jwtSecretEnv) {
        console.error('Admin login config error: JWT_SECRET is missing in .env');
        return res.status(500).json({ message: 'Sunucu yapılandırma hatası.' });
    }
    if (!username || !password) {
        return res.status(400).json({ message: 'Kullanıcı adı ve şifre gereklidir.' });
    }

    try {
        const admin = await AdminUser.findOne({ username: username.toLowerCase() });
        if (!admin) {
            return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre.' });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya şifre.' });
        }

        const payload = {
            user: {
                id: admin._id,
                username: admin.username,
                role: 'admin'
            }
        };

        jwt.sign(payload, jwtSecretEnv, { expiresIn: jwtExpiresInEnv }, (err, token) => {
            if (err) {
                console.error('Error signing JWT:', err);
                return res.status(500).json({ message: 'Token oluşturulurken bir hata oluştu.' });
            }
            res.json({
                success: true,
                message: 'Admin girişi başarılı!',
                token: token,
                user: { id: admin._id, username: admin.username, role: 'admin' }
            });
        });

    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ message: "Giriş sırasında bir sunucu hatası oluştu." });
    }
});

router.post('/change-password', protectAdmin, async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'Tüm alanlar gereklidir: mevcut şifre, yeni şifre, yeni şifre tekrarı.' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Yeni şifreler eşleşmiyor.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Yeni şifre en az 6 karakter olmalıdır.' });
    }

    try {
        const admin = await AdminUser.findOne({ username: req.adminUser.username });
        
        if (!admin) {
            return res.status(404).json({ message: 'Admin kullanıcısı bulunamadı.' });
        }

        const isMatch = await admin.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Mevcut şifre yanlış.' });
        }

        const salt = await bcrypt.genSalt(10);
        admin.passwordHash = await bcrypt.hash(newPassword, salt);
        await admin.save();

        res.json({ success: true, message: 'Şifre başarıyla değiştirildi.' });

    } catch (error) {
        console.error('Error changing admin password:', error);
        res.status(500).json({ message: 'Şifre değiştirilirken bir sunucu hatası oluştu.' });
    }
});

module.exports = router;