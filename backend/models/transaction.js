// backend/models/transaction.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    templateId: {
        type: Schema.Types.ObjectId,
        ref: 'Template',
        required: true,
        index: true
    },
    templateName: {
        type: String,
        required: true
    },
    userEmail: { // İşlemi başlatan e-posta 
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    status: {
        type: String,
        required: true,
        enum: ['initiated', 'payment_pending', 'payment_successful', 'payment_failed', 'pdf_generated', 'email_sent', 'completed', 'failed'],
        default: 'initiated'
    },
    amount: {
        type: Number,
        required: true,
        default: 0
    },
    currency: {
        type: String,
        required: true,
        default: 'TRY'
    },
    paymentGatewayRef: {
        type: String,
        sparse: true,
        index: true
    },
    invoiceId: {
        type: Schema.Types.ObjectId,
        ref: 'Invoice',
        sparse: true,
        index: true
    },
    // --- Snapshot Alanları ---
    formDataSnapshot: { // Belge formu verilerinin JSON string'i
        type: String,
        required: true // Belge oluşturmak için bu veri zorunlu
    },
    billingInfoSnapshot: { // Fatura bilgilerinin JSON string'i (varsa)
        type: String,
        sparse: true 
    },

    errorMessage: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);