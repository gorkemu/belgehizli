// backend/routes/adminData.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Transaction = require('../models/transaction');
const Invoice = require('../models/invoice');
const ConsentLog = require('../models/consentLog');
const { buildMongoFilters } = require('../utils/filterUtils'); 
const mapSortKey = (key) => (key === 'id' ? '_id' : key);

// --- Kaynaklara Özel Şema Alanı Tanımları (Filtreleme için) ---
const transactionResourceFields = {
    userEmail: 'string_like',
    templateName: 'string_like',
    status: 'exact_match',
    createdAt: 'date_range',
    // q için aranacak alanlar (eğer frontend q filtresi gönderirse)
    q_fields: ['userEmail', 'templateName', 'paymentGatewayRef', 'errorMessage'] 
};

const invoiceResourceFields = {
    customerEmail: 'string_like',
    invoiceNumber: 'string_like',
    status: 'exact_match', // pending_manual, invoice_sent vb.
    createdAt: 'date_range',
    transactionId: 'objectId',
    q_fields: ['customerEmail', 'invoiceNumber', 'customerName', 'notes']
};

const consentLogResourceFields = {
    userEmail: 'string_like',
    documentVersion: 'string_like',
    ipAddress: 'string_like',
    createdAt: 'date_range',
    transactionId: 'objectId',
    documentType: 'exact_match',
    q_fields: ['userEmail', 'documentVersion', 'ipAddress']
};

// --- GENEL LISTELEME FONKSİYONU İÇİN YARDIMCI ---
const handleListRequest = async (req, res, Model, resourceName, resourceSchemaFields, populateOptions = null) => {
    try {
        const { 
            sort: sortQuery, range: rangeQuery, filter: filterObjectQuery, 
            id: idFromQuery, ...otherPotentialFilters 
        } = req.query;

        const [sortField, sortOrderStr] = sortQuery ? JSON.parse(sortQuery) : ['createdAt', 'DESC'];
        let [start, end] = rangeQuery ? JSON.parse(rangeQuery) : 
                             (req.query._start && req.query._end ? [parseInt(req.query._start, 10), parseInt(req.query._end, 10) -1 ] : [0, 9]);
        
        // Güvenlik: end'in start'tan küçük olmamasını sağla ve makul bir limit
        if (end < start) end = start + 9;
        if (end - start + 1 > 1000) end = start + 999; // Max 1000 kayıt gibi bir sınır

        const limit = end - start + 1;
        const skip = start;
        const sortOrder = sortOrderStr.toLowerCase() === 'asc' ? 1 : -1;
        const mappedSortField = mapSortKey(sortField);

        let finalMongoFilters = {};
        if (idFromQuery) { 
            const idsToQuery = Array.isArray(idFromQuery) ? idFromQuery : [idFromQuery];
            finalMongoFilters._id = { $in: idsToQuery.map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null).filter(Boolean) };
        } else {
            let actualFiltersToProcess = {...otherPotentialFilters};
            if (filterObjectQuery) {
                try { const parsedFilter = JSON.parse(filterObjectQuery); actualFiltersToProcess = {...actualFiltersToProcess, ...parsedFilter}; }
                catch(e) { console.warn(`[${resourceName.toUpperCase()}] Could not parse filterObjectQuery`, e); }
            }
            const userDefinedFilters = {};
            const reactAdminKeys = ['_sort', '_order', '_start', '_end', 'sort', 'range', 'filter', 'id'];
            for (const key in actualFiltersToProcess) {
                if (actualFiltersToProcess.hasOwnProperty(key) && !reactAdminKeys.includes(key)) {
                    userDefinedFilters[key] = actualFiltersToProcess[key];
                }
            }
            finalMongoFilters = buildMongoFilters(userDefinedFilters, resourceSchemaFields);
        }
        
        const total = await Model.countDocuments(finalMongoFilters);
        let query = Model.find(finalMongoFilters)
            .sort({ [mappedSortField]: sortOrder })
            .skip(idFromQuery ? 0 : skip)
            .limit(idFromQuery ? total : limit);

        if (populateOptions && !idFromQuery) { // Sadece normal listelemede populate et, GET_MANY için değil
            query = query.populate(populateOptions);
        }
        
        const documents = await query.lean();
        // formattedDocuments artık id alanını her zaman içerecek
        const formattedDocuments = documents.map(doc => {
            const formattedDoc = { ...doc, id: doc._id.toString() };
            // Populate edilmiş alanlar için de 'id' ekle (eğer obje ise ve _id'si varsa)
            if (populateOptions && !idFromQuery) { // Sadece populate edildiyse
                (Array.isArray(populateOptions) ? populateOptions : [populateOptions]).forEach(pop => {
                    const path = typeof pop === 'string' ? pop : pop.path;
                    if (formattedDoc[path] && typeof formattedDoc[path] === 'object' && formattedDoc[path] !== null && formattedDoc[path]._id) {
                        formattedDoc[path].id = formattedDoc[path]._id.toString();
                    }
                });
            }
            // ReferenceField'ın doğru çalışması için, referans yapılan alanın (örn: transactionId)
            // populate edilmemiş ham ID değerini içermesi gerekir.
            // Eğer populateOptions transactionId'yi içeriyorsa, bu frontend'de sorun yaratır.
            // Bu yüzden, eğer ReferenceField kullanacaksak, populate etmemek en iyisi.
            return formattedDoc;
        });

        res.setHeader('X-Total-Count', total.toString());
        res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');
        res.json(formattedDocuments);

    } catch (error) {
        console.error(`Error fetching ${resourceName} for admin:`, error);
        res.status(500).json({ message: `${resourceName} listesi alınırken hata oluştu.` });
    }
};

// --- TRANSACTIONS ---
router.get('/transactions', (req, res) => {
    // Transactions listesi için populate gerekmiyor (kendi başına bir kaynak)
    handleListRequest(req, res, Transaction, 'transactions', transactionResourceFields);
});

router.get('/transactions/:id', async (req, res) => { 
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Geçersiz Transaction ID formatı.' });
        }
        const transaction = await Transaction.findById(req.params.id).lean();
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction bulunamadı.' });
        }
        res.json({ ...transaction, id: transaction._id.toString() });
    } catch (error) {
        console.error('Error fetching single transaction for admin:', error);
        res.status(500).json({ message: 'Transaction detayı alınırken hata oluştu.' });
    }
});

router.get('/transactions-pending-invoice', async (req, res) => {
    try {
        // React Admin'den gelen sayfalama ve sıralama parametreleri
        const { sort: sortQuery, range: rangeQuery, filter: filterObjectQuery } = req.query;

        const [sortField, sortOrderStr] = sortQuery ? JSON.parse(sortQuery) : ['createdAt', 'ASC']; // Eskiden yeniye sırala
        const [start, end] = rangeQuery ? JSON.parse(rangeQuery) : [0, 24]; // Varsayılan olarak ilk 25
        
        const limit = end - start + 1;
        const skip = start;
        const sortOrder = sortOrderStr.toLowerCase() === 'asc' ? 1 : -1;
        const mappedSortField = mapSortKey(sortField); // mapSortKey'in tanımlı olduğunu varsayıyoruz

        // Faturalanacakları bulmak için kriterler:
        // 1. Transaction durumu 'payment_successful' VEYA 'completed' VEYA 'email_sent' VEYA 'pdf_generated'
        //    (yani ödeme alınmış ve işlem bir şekilde ilerlemiş)
        // 2. Transaction'ın 'invoiceId' alanı YOK (null veya undefined) 
        //    VEYA 'invoiceId' VAR ama ilişkili Invoice'un durumu 'pending_creation'
        
        const query = {
            status: { $in: ['payment_successful', 'completed', 'email_sent', 'pdf_generated'] },
            // invoiceId alanı olmayanları veya olanların invoice durumunu kontrol etmemiz gerekecek.
            // Bu, MongoDB aggregation ile daha verimli yapılabilir.
        };

        // Basit Yöntem (Performans çok fazla kayıt için ideal olmayabilir):
        // Önce potansiyel transaction'ları çek, sonra invoice durumlarını kontrol et.
        let potentialTransactions = await Transaction.find(query)
            .sort({ [mappedSortField]: sortOrder })
            // Sayfalamayı tüm potansiyel sonuçlar üzerinden değil, filtrelenmiş sonuçlar üzerinden yapmak daha doğru.
            // Bu yüzden önce tümünü çekip sonra filtreleyip sonra sayfalayacağız ya da aggregation kullanacağız.
            .lean(); // Populate etmeden çekelim, invoice'a ayrıca bakarız.

        let transactionsPendingInvoice = [];
        for (const trans of potentialTransactions) {
            if (!trans.invoiceId) {
                transactionsPendingInvoice.push(trans);
            } else {
                const invoice = await Invoice.findById(trans.invoiceId).select('status').lean();
                if (invoice && invoice.status === 'pending_creation') {
                    transactionsPendingInvoice.push(trans);
                }
            }
        }

        const total = transactionsPendingInvoice.length;
        // Sayfalamayı manuel yap
        const paginatedTransactions = transactionsPendingInvoice.slice(skip, skip + limit);

        const formattedTransactions = paginatedTransactions.map(t => ({ 
            ...t, 
            id: t._id.toString(),
            // billingInfoSnapshot'ı da gönderelim ki fatura bilgileri listede görünsün
            billingInfo: t.billingInfoSnapshot ? JSON.parse(t.billingInfoSnapshot) : null 
        }));

        res.setHeader('X-Total-Count', total.toString());
        res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');
        res.json(formattedTransactions);

    } catch (error) {
        console.error('Error fetching transactions pending invoice:', error);
        res.status(500).json({ message: 'Faturalanacak işlemler alınırken hata oluştu.' });
    }
});

// --- INVOICES ---
router.get('/invoices', (req, res) => {
    // InvoiceList'te transactionId için ReferenceField kullanıyorsak, burada populate ETMEMELİYİZ.
    // ReferenceField kendi GET_MANY isteğini yapacak.
    // Eğer populate edilmiş veriyi doğrudan göstermek isteseydik (FunctionField ile), o zaman populate ederdik.
    handleListRequest(req, res, Invoice, 'invoices', invoiceResourceFields); 
});

router.get('/invoices/:id', async (req, res) => {
     try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Geçersiz Invoice ID formatı.' });
        }
        const invoice = await Invoice.findById(req.params.id)
            .lean();
        if (!invoice) {
            return res.status(404).json({ message: 'Fatura bulunamadı.' });
        }
        // transactionId artık sadece ID olarak dönecek
        res.json({ ...invoice, id: invoice._id.toString() });
    } catch (error) {
        console.error('Error fetching single invoice for admin:', error);
        res.status(500).json({ message: 'Fatura detayı alınırken hata oluştu.' });
    }
});

router.put('/invoices/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Geçersiz Invoice ID formatı.' });
        }

        const { status, invoiceNumber, errorMessage } = req.body; // Güncellenecek alanları al
        
        // Sadece izin verilen alanların güncellenmesini sağla
        const updateData = {};
        if (status) {
            const validStatuses = Invoice.schema.path('status').enumValues;
            if (validStatuses.includes(status)) {
                updateData.status = status;
            } else {
                return res.status(400).json({ message: `Geçersiz fatura durumu: ${status}` });
            }
        }
        if (typeof invoiceNumber === 'string') { // invoiceNumber boş string de olabilir (silmek için)
            updateData.invoiceNumber = invoiceNumber;
        }
        if (typeof errorMessage === 'string') { // errorMessage boş string de olabilir
            updateData.errorMessage = errorMessage;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'Güncellenecek veri bulunamadı.' });
        }

        // new: true -> güncellenmiş dokümanı döndürür
        // runValidators: true -> Mongoose şema validasyonlarını çalıştırır
        const updatedInvoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).lean();

        if (!updatedInvoice) {
            return res.status(404).json({ message: 'Güncellenecek fatura bulunamadı.' });
        }

        // React Admin update yanıtında güncellenmiş kaydın tamamını id ile bekler
        res.json({ ...updatedInvoice, id: updatedInvoice._id.toString() });

    } catch (error) {
        console.error('Error updating invoice for admin:', error);
        // Mongoose validasyon hatası olabilir
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Fatura güncelleme validasyon hatası: ' + error.message });
        }
        res.status(500).json({ message: 'Fatura güncellenirken bir sunucu hatası oluştu.' });
    }
});

// --- CONSENT LOGS ---
router.get('/consent-logs', (req, res) => {
    // ConsentLogList'te transactionId için ReferenceField kullanıyorsak, burada populate ETMEMELİYİZ.
    handleListRequest(req, res, ConsentLog, 'consent-logs', consentLogResourceFields); 
});

router.get('/consent-logs/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Geçersiz ConsentLog ID formatı.' });
        }
        const consentLog = await ConsentLog.findById(req.params.id)
            .lean();
        if (!consentLog) {
            return res.status(404).json({ message: 'Onay logu bulunamadı.' });
        }
        // transactionId artık sadece ID olarak dönecek
        res.json({ ...consentLog, id: consentLog._id.toString() });
    } catch (error) {
        console.error('Error fetching single consent log for admin:', error);
        res.status(500).json({ message: 'Onay log detayı alınırken hata oluştu.' });
    }
});

// --- DASHBOARD İSTATİSTİKLERİ ENDPOINT'İ ---
// GET /api/admin-data/dashboard-stats
router.get('/dashboard-stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Günün başlangıcı

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1); // Yarının başlangıcı

        // 1. Toplam Transaction Sayısı
        const totalTransactions = await Transaction.countDocuments();

        // 2. Bugün Oluşturulan Transaction Sayısı
        const todayTransactions = await Transaction.countDocuments({
            createdAt: {
                $gte: today,
                $lt: tomorrow,
            },
        });

        // 3. Toplam Fatura Kaydı Sayısı
        const totalInvoices = await Invoice.countDocuments();

        // 4. Durumu 'pending_creation' Olan Fatura Sayısı
        const pendingInvoices = await Invoice.countDocuments({
            status: 'pending_creation',
        });
        // Alternatif: "Faturalanacak İşlem Sayısı" (biraz daha karmaşık, önceki logic'e benzer)
        // Bu, status: payment_successful olup da invoiceId'si olmayan veya invoice.status: pending_creation olan Transaction'ları sayar.
        // Şimdilik sadece pending_creation Invoice sayısını alalım.

        // 5. Toplam Onay Logu Sayısı
        const totalConsentLogs = await ConsentLog.countDocuments();

        res.json({
            totalTransactions,
            todayTransactions,
            totalInvoices,
            pendingInvoices,
            totalConsentLogs,
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Dashboard istatistikleri alınırken bir hata oluştu.' });
    }
});



module.exports = router;