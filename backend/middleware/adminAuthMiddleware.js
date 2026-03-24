// backend/middleware/adminAuthMiddleware.js
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/adminUser'); 

const protectAdmin = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Token'dan alınan kullanıcı ID'si ile admin kullanıcısını bul
            // Şifre değiştirme gibi işlemler için güncel kullanıcı bilgisi önemli olabilir
            // Veya sadece token geçerliyse ve payload'da admin rolü varsa devam et
            req.adminUser = await AdminUser.findById(decoded.user.id).select('-passwordHash'); // Şifre hash'ini dışarıda bırak

            if (!req.adminUser || decoded.user.role !== 'admin') {
                return res.status(401).json({ message: 'Yetkisiz erişim, token geçersiz veya admin değil.' });
            }
            
            next();
        } catch (error) {
            console.error('Admin auth middleware error:', error.message);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Oturum süresi dolmuş, lütfen tekrar giriş yapın.' });
            }
            return res.status(401).json({ message: 'Yetkisiz erişim, token doğrulanamadı.' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Yetkisiz erişim, token bulunamadı.' });
    }
};

module.exports = { protectAdmin };