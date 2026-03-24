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
        default: 'admin' // Varsayılan ve tek kullanıcı için
    },
    passwordHash: {
        type: String,
        required: true,
    }
}, {
    timestamps: true
});

// Şifreyi kaydetmeden önce hash'le (eğer değiştirilmişse)
// Bu pre-save hook'u şifre her değiştiğinde çalışır.
// Ancak biz şifreyi doğrudan hash'lenmiş olarak set edeceğiz.
// Bu yüzden bu hook'a şimdilik gerek yok, ama ileride kullanıcı oluşturma formu olursa faydalı olur.
/*
AdminUserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) { // Eğer 'password' alanı varsa ve değişmişse
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.passwordHash = await bcrypt.hash(this.password, salt); // 'password' diye bir alanımız olmayacak
        // this.password = undefined; // Ham şifreyi sil
        next();
    } catch (error) {
        next(error);
    }
});
*/

// Şifre karşılaştırma metodu
AdminUserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model('AdminUser', AdminUserSchema);