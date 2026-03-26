// backend/models/consentLog.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const consentLogSchema = new Schema({
    transactionId: {
        type: Schema.Types.ObjectId,
        ref: 'Transaction',
        index: true,
        
    },
    userEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    },
    documentType: {
        type: String,
        required: true,
        default: 'LEGAL_TERMS_AGREEMENT' 
    },
    documentVersion: {
        type: String,
        required: true 
    },
    consentTimestampClient: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ConsentLog', consentLogSchema);