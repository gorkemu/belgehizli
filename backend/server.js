process.on('uncaughtException', (error) => {
	console.error('UNCAUGHT EXCEPTION! Shutting down...');
	console.error(error.stack || error);
	process.exit(1); 
});

process.on('unhandledRejection', (reason, promise) => {
	console.error('UNHANDLED REJECTION! Reason:', reason);
	console.error(promise);

});


const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const path = require('path'); 
const AdminUser = require('./models/adminUser'); 
const bcrypt = require('bcryptjs');  

dotenv.config();
const app = express();

// --- CORS Ayarları  ---
const allowedOrigins = [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'https://www.belgehizli.com',
    'https://belgehizli.com',
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL 
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200,
    exposedHeaders: ['X-Total-Count'] 
};
app.use(cors(corsOptions));
app.use(express.json());

// Basit loglama middleware'i 
app.use((req, res, next) => {
	// Sadece production'da değilse logla veya daha gelişmiş bir logger kullan
	if (process.env.NODE_ENV !== 'production') {
		console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
	}
	next();
});


// MongoDB Atlas bağlantısı
const uri = process.env.ATLAS_URI;
if (!uri) {
	console.error('Hata: ATLAS_URI ortam değişkeni tanımlanmamış!');
	process.exit(1); // URI yoksa uygulamayı durdur
}

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }) 
    .then(async () => {
        console.log('MongoDB Atlas bağlantısı başarılı!');

        // --- İLK ADMİN KULLANICISINI OLUŞTUR ---
        try {
            const adminCount = await AdminUser.countDocuments();
            if (adminCount === 0) {
                const adminUser = process.env.ADMIN_USERNAME || 'admin';
                const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(adminPass, salt);
                await AdminUser.create({ username: adminUser, passwordHash: hashedPassword });
                console.log('Sistem: Varsayılan admin kullanıcısı oluşturuldu.');
            }
        } catch (err) { console.error('Admin oluşturma hatası:', err); }

        const templateRoutes = require('./routes/templates'); 
        const adminAuthRoutes = require('./routes/adminAuth');
        const adminDataRoutes = require('./routes/adminData');
        const documentRoutes = require('./routes/document');

        app.use('/api', templateRoutes); 
        app.use('/api/admin', adminAuthRoutes);
        app.use('/api/admin-data', adminDataRoutes);
        app.use('/api/document', documentRoutes);

        const port = process.env.PORT || 8080;
        app.listen(port, '0.0.0.0', () => {
            console.log(`Server is running on port: ${port}`);
        });
    })
    .catch((error) => {
		console.error('MongoDB bağlantı hatası:', error);
		process.exit(1); 
	});

// --- Hata Yönetimi Middleware'i ---
app.use((err, req, res, next) => {
	console.error("Beklenmeyen Hata:", err.stack || err); 
	// CORS hatası ise özel mesaj gönder
	if (err.message === 'Not allowed by CORS') {
		return res.status(403).json({ message: 'CORS policy violation' });
	}
	// Diğer hatalar için genel bir mesaj gönder
	res.status(err.status || 500).json({
		message: err.message || 'Sunucuda bir hata oluştu.',
		// Production'da hata detayını client'a gönderme
		error: process.env.NODE_ENV !== 'production' ? err : {}
	});
});
