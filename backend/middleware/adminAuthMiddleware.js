const jwt = require('jsonwebtoken');
const AdminUser = require('../models/adminUser');

const protectAdmin = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = {
                id: decoded.id,
                username: decoded.username,
                role: decoded.role
            };

            const adminFromDb = await AdminUser.findById(decoded.id).select('-passwordHash');

            if (!adminFromDb) {
                return res.status(401).json({ message: 'Yetkisiz erişim, kullanıcı bulunamadı.' });
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

const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                success: false,
                message: 'Erişim reddedildi: Rol bilgisi bulunamadı.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Yetki Hatası: Bu işlemi yapmak için yeterli izniniz yok.'
            });
        }

        next();
    };
};

module.exports = { protectAdmin, authorizeRole };