const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { 
        type: String, required: true, unique: true, lowercase: true, trim: true
    },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true },
    
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLoginAt: Date,
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);