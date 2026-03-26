// backend/models/adminUser.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminUserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        default: 'admin'
    },
    passwordHash: {
        type: String,
        required: true,
    }
}, {
    timestamps: true
});

AdminUserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model('AdminUser', AdminUserSchema);