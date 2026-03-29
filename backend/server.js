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
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');
const AdminUser = require('./models/adminUser');
const Transaction = require('./models/transaction');
const bcrypt = require('bcryptjs');

dotenv.config();
const app = express();

app.set('trust proxy', 1); 

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, message: 'Çok fazla istek yaptınız, lütfen daha sonra tekrar deneyin.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const pdfLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Saatlik belge oluşturma sınırına ulaştınız. Lütfen daha sonra tekrar deneyin.' }
});

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

app.use(express.json({ limit: '10mb' })); 

app.use(helmet());
app.use((req, res, next) => {
    if (req.body) mongoSanitize.sanitize(req.body);
    if (req.params) mongoSanitize.sanitize(req.params);
    if (req.query) mongoSanitize.sanitize(req.query);
    next();
});

app.use('/api/', apiLimiter);

app.use(/^\/api\/templates\/.*\/process-payment$/, pdfLimiter);

app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    }
    next();
});

const uri = process.env.ATLAS_URI;
if (!uri) {
    console.error('Hata: ATLAS_URI ortam değişkeni tanımlanmamış!');
    process.exit(1);
}

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('MongoDB Atlas bağlantısı başarılı!');

        try {
            const adminCount = await AdminUser.countDocuments();
            if (adminCount === 0) {
                const adminUser = process.env.ADMIN_USERNAME || 'admin';
                const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(adminPass, salt);
                await AdminUser.create({ username: adminUser, passwordHash: hashedPassword });
                console.log('Sistem: Varsayılan admin kullanıcısı oluşturuldu. (Lütfen production ortamında şifreyi değiştirin!)');
            }
        } catch (err) {
            console.error('Admin oluşturma hatası:', err);
        }

        cron.schedule('0 * * * *', async () => {
            console.log('🧹 [Cron] KVKK temizlik kontrolü başlatıldı...');
            try {
                const expirationDate = new Date();
                expirationDate.setHours(expirationDate.getHours() - 24);

                const result = await Transaction.updateMany(
                    { 
                        createdAt: { $lt: expirationDate },
                        $or: [
                            { formDataSnapshot: { $exists: true } },
                            { editedHtmlSnapshot: { $exists: true } }
                        ]
                    },
                    { 
                        $unset: { formDataSnapshot: 1, editedHtmlSnapshot: 1 } 
                    }
                );

                if (result.modifiedCount > 0) {
                    console.log(`✅ [Cron] ${result.modifiedCount} adet işlemin kişisel verileri KVKK gereği kalıcı olarak silindi.`);
                }
            } catch (err) {
                console.error('❌ [Cron] Temizlik sırasında hata:', err);
            }
        });

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

app.use((err, req, res, next) => {
    console.error("Beklenmeyen Hata:", err.stack || err);
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ message: 'CORS policy violation' });
    }
    res.status(err.status || 500).json({
        message: process.env.NODE_ENV !== 'production' ? err.message : 'Sunucuda bir hata oluştu.',
        error: process.env.NODE_ENV !== 'production' ? err : {}
    });
});