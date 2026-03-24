// backend/models/invoice.js
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['pending_manual', 'invoice_sent', 'no_invoice_needed'],
        default: 'pending_manual'
    },
    invoiceNumber: { type: String, default: '' }, // Manuel girdiğin fatura no
    amount: { type: Number, required: true },
    customerEmail: { type: String, required: true },
    customerName: { type: String }, // Shopier'den gelen isim
    notes: { type: String } // "X kullanıcısı 2 kahve ısmarladı" gibi notlar
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);