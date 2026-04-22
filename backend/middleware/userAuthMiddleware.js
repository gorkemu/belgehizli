// backend/middleware/userAuthMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protectUser = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

            req.user = await User.findById(decoded.id).select('-passwordHash');

            if (!req.user || !req.user.isActive) {
                return res.status(401).json({ message: 'Kullanıcı bulunamadı veya aktif değil.' });
            }
            
            next();
            
        } catch (error) {
            console.error("Auth Middleware Hatası:", error.message);
            res.status(401).json({ message: 'Yetkilendirme başarısız, geçersiz veya süresi dolmuş token.' });
        }
    } else {
        res.status(401).json({ message: 'Yetkilendirme başarısız, token bulunamadı.' });
    }
};

module.exports = { protectUser };