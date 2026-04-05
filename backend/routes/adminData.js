// backend/routes/adminData.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Transaction = require('../models/transaction');
const Invoice = require('../models/invoice');
const ConsentLog = require('../models/consentLog');
const { buildMongoFilters } = require('../utils/filterUtils'); 
const mapSortKey = (key) => (key === 'id' ? '_id' : key);
const AdminUser = require('../models/adminUser');
const bcrypt = require('bcryptjs');
const { protectAdmin, authorizeRole } = require('../middleware/adminAuthMiddleware');

const transactionResourceFields = {
    userEmail: 'string_like',
    templateName: 'string_like',
    status: 'exact_match',
    createdAt: 'date_range',
    q_fields: ['userEmail', 'templateName', 'paymentGatewayRef', 'errorMessage'] 
};

const invoiceResourceFields = {
    customerEmail: 'string_like',
    invoiceNumber: 'string_like',
    status: 'exact_match',
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

const handleListRequest = async (req, res, Model, resourceName, resourceSchemaFields, populateOptions = null) => {
    try {
        const { 
            sort: sortQuery, range: rangeQuery, filter: filterObjectQuery, 
            id: idFromQuery, ...otherPotentialFilters 
        } = req.query;

        const [sortField, sortOrderStr] = sortQuery ? JSON.parse(sortQuery) : ['createdAt', 'DESC'];
        let [start, end] = rangeQuery ? JSON.parse(rangeQuery) : 
                             (req.query._start && req.query._end ? [parseInt(req.query._start, 10), parseInt(req.query._end, 10) -1 ] : [0, 9]);
        
        if (end < start) end = start + 9;
        if (end - start + 1 > 1000) end = start + 999;

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

        if (populateOptions && !idFromQuery) {
            query = query.populate(populateOptions);
        }
        
        const documents = await query.lean();
        const formattedDocuments = documents.map(doc => {
            const formattedDoc = { ...doc, id: doc._id.toString() };
            if (populateOptions && !idFromQuery) {
                (Array.isArray(populateOptions) ? populateOptions : [populateOptions]).forEach(pop => {
                    const path = typeof pop === 'string' ? pop : pop.path;
                    if (formattedDoc[path] && typeof formattedDoc[path] === 'object' && formattedDoc[path] !== null && formattedDoc[path]._id) {
                        formattedDoc[path].id = formattedDoc[path]._id.toString();
                    }
                });
            }
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

router.get('/transactions', (req, res) => {
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
        const { sort: sortQuery, range: rangeQuery, filter: filterObjectQuery } = req.query;

        const [sortField, sortOrderStr] = sortQuery ? JSON.parse(sortQuery) : ['createdAt', 'ASC'];
        const [start, end] = rangeQuery ? JSON.parse(rangeQuery) : [0, 24];
        
        const limit = end - start + 1;
        const skip = start;
        const sortOrder = sortOrderStr.toLowerCase() === 'asc' ? 1 : -1;
        const mappedSortField = mapSortKey(sortField);

        const query = {
            status: { $in: ['payment_successful', 'completed', 'email_sent', 'pdf_generated'] },
        };

        let potentialTransactions = await Transaction.find(query)
            .sort({ [mappedSortField]: sortOrder })
            .lean();

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
        const paginatedTransactions = transactionsPendingInvoice.slice(skip, skip + limit);

        const formattedTransactions = paginatedTransactions.map(t => ({ 
            ...t, 
            id: t._id.toString(),
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

router.get('/invoices', (req, res) => {
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

        const { status, invoiceNumber, errorMessage } = req.body;
        
        const updateData = {};
        if (status) {
            const validStatuses = Invoice.schema.path('status').enumValues;
            if (validStatuses.includes(status)) {
                updateData.status = status;
            } else {
                return res.status(400).json({ message: `Geçersiz fatura durumu: ${status}` });
            }
        }
        if (typeof invoiceNumber === 'string') {
            updateData.invoiceNumber = invoiceNumber;
        }
        if (typeof errorMessage === 'string') {
            updateData.errorMessage = errorMessage;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'Güncellenecek veri bulunamadı.' });
        }

        const updatedInvoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).lean();

        if (!updatedInvoice) {
            return res.status(404).json({ message: 'Güncellenecek fatura bulunamadı.' });
        }

        res.json({ ...updatedInvoice, id: updatedInvoice._id.toString() });

    } catch (error) {
        console.error('Error updating invoice for admin:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Fatura güncelleme validasyon hatası: ' + error.message });
        }
        res.status(500).json({ message: 'Fatura güncellenirken bir sunucu hatası oluştu.' });
    }
});

router.get('/consent-logs', (req, res) => {
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
        res.json({ ...consentLog, id: consentLog._id.toString() });
    } catch (error) {
        console.error('Error fetching single consent log for admin:', error);
        res.status(500).json({ message: 'Onay log detayı alınırken hata oluştu.' });
    }
});

router.get('/dashboard-stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const totalTransactions = await Transaction.countDocuments();

        const todayTransactions = await Transaction.countDocuments({
            createdAt: {
                $gte: today,
                $lt: tomorrow,
            },
        });

        const totalInvoices = await Invoice.countDocuments();

        const pendingInvoices = await Invoice.countDocuments({
            status: 'pending_creation',
        });

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

// [GET] List Admin Users (only SUPER_ADMIN) for react-admin
router.get('/admin-users', protectAdmin, authorizeRole('SUPER_ADMIN'), async (req, res) => {
    try {
        const users = await AdminUser.find().select('-passwordHash'); 
        
        res.set('X-Total-Count', users.length);
        
        const mappedUsers = users.map(u => ({
            id: u._id,
            username: u.username,
            role: u.role,
            createdAt: u.createdAt
        }));
        
        res.json(mappedUsers);
    } catch (error) {
        console.error('Kullanıcı listeleme hatası:', error);
        res.status(500).json({ message: 'Kullanıcılar alınamadı.' });
    }
});

// [POST] C
router.post('/admin-users', protectAdmin, authorizeRole('SUPER_ADMIN'), async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({ message: 'Kullanıcı adı, şifre ve rol zorunludur.' });
        }

        const existing = await AdminUser.findOne({ username: username.toLowerCase() });
        if (existing) {
            return res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanılıyor.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = new AdminUser({ 
            username: username.toLowerCase(), 
            passwordHash, 
            role 
        });
        
        await newUser.save();

        res.status(201).json({ 
            id: newUser._id, 
            username: newUser.username, 
            role: newUser.role 
        });

    } catch (error) {
        console.error('Kullanıcı oluşturma hatası:', error);
        res.status(500).json({ message: 'Kullanıcı oluşturulurken bir hata meydana geldi.' });
    }
});

module.exports = router;