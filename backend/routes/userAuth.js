// backend/routes/userAuth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { protectUser } = require('../middleware/userAuthMiddleware');
const crypto = require('crypto');
const { sendPasswordResetEmail, sendMfaEmail } = require('../utils/mailer');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '30d' });
};

const generateTempMfaToken = (id) => {
    return jwt.sign({ id, isMfaTemp: true }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '5m' });
};

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        messageKey: 'auth.tooManyFailedAttempts',
        params: { minutes: 15 },
        message: 'Too many failed login attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        messageKey: 'auth.tooManyRegistrations',
        params: { hours: 1 },
        message: 'Too many registration requests. Please try again after 1 hour.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/register', registerLimiter, async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                messageKey: 'auth.requiredFieldsMissing',
                message: 'Please fill in all required fields.'
            });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                messageKey: 'auth.passwordTooWeak',
                message: 'Password must be at least 8 characters and include uppercase, lowercase, and a digit.'
            });
        }

        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(400).json({
                messageKey: 'auth.emailAlreadyUsed',
                message: 'This email address is already in use.'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            email: email.toLowerCase(),
            passwordHash
        });

        await newUser.save();

        res.status(201).json({
            _id: newUser.id,
            fullName: newUser.fullName,
            email: newUser.email,
            token: generateToken(newUser._id),
        });

    } catch (error) {
        console.error("Kayıt hatası:", error);
        res.status(500).json({
            messageKey: 'auth.registrationFailed',
            message: 'An error occurred while creating your account.'
        });
    }
});

router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({
                messageKey: 'auth.invalidCredentials',
                message: 'Invalid email or password.'
            });
        }

        if (user.lockUntil && user.lockUntil > Date.now()) {
            const remainingMs = user.lockUntil - Date.now();
            const remainingMinutes = Math.ceil(remainingMs / 60000);
            return res.status(403).json({
                messageKey: 'auth.accountLocked',
                params: { minutes: remainingMinutes },
                message: `Your account is temporarily locked. Try again after ${remainingMinutes} minutes.`
            });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            user.loginAttempts += 1;
            if (user.loginAttempts >= 5) {
                user.lockUntil = Date.now() + 30 * 60 * 1000;
            }
            await user.save();
            return res.status(401).json({
                messageKey: 'auth.invalidCredentials',
                message: 'Invalid email or password.'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                messageKey: 'auth.accountSuspended',
                message: 'Your account has been suspended.'
            });
        }

        user.loginAttempts = 0;
        user.lockUntil = undefined;

        const testUserEmail = process.env.TEST_USER_EMAIL
            ? process.env.TEST_USER_EMAIL.toLowerCase()
            : null;

        if (process.env.NODE_ENV !== 'production' && testUserEmail && user.email === testUserEmail) {
            await user.save();
            return res.json({
                _id: user.id,
                fullName: user.fullName,
                email: user.email,
                token: generateToken(user._id),
            });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        user.mfaOtp = otpCode;
        user.mfaOtpExpires = Date.now() + 5 * 60 * 1000;
        await user.save();

        await sendMfaEmail(user.email, otpCode);

        res.json({
            requiresMfa: true,
            email: user.email,
            tempToken: generateTempMfaToken(user._id)
        });

    } catch (error) {
        console.error("Giriş hatası:", error);
        res.status(500).json({
            messageKey: 'auth.serverError',
            message: 'Server error.'
        });
    }
});

router.post('/verify-mfa', authLimiter, async (req, res) => {
    try {
        const { tempToken, otp } = req.body;

        if (!tempToken || !otp) {
            return res.status(400).json({
                messageKey: 'auth.missingMfaFields',
                message: 'Missing information.'
            });
        }

        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'secretkey');

        if (!decoded.isMfaTemp) {
            return res.status(401).json({
                messageKey: 'auth.invalidToken',
                message: 'Invalid verification token.'
            });
        }

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({
                messageKey: 'auth.userNotFound',
                message: 'User not found.'
            });
        }

        if (user.mfaOtp !== otp || user.mfaOtpExpires < Date.now()) {
            return res.status(400).json({
                messageKey: 'auth.invalidOtp',
                message: 'Invalid or expired code. Please log in again.'
            });
        }

        user.mfaOtp = undefined;
        user.mfaOtpExpires = undefined;
        user.lastLoginAt = Date.now();
        await user.save();

        res.json({
            _id: user.id,
            fullName: user.fullName,
            email: user.email,
            token: generateToken(user._id),
        });

    } catch (error) {
        console.error("MFA Doğrulama Hatası:", error.message);
        res.status(401).json({
            messageKey: 'auth.mfaSessionExpired',
            message: 'Verification session expired. Please log in again.'
        });
    }
});

router.get('/me', protectUser, async (req, res) => {
    try {
        res.json({
            _id: req.user.id,
            fullName: req.user.fullName,
            email: req.user.email
        });
    } catch (error) {
        res.status(500).json({
            messageKey: 'auth.userInfoFetchFailed',
            message: 'Could not fetch user information.'
        });
    }
});

router.post('/forgot-password', authLimiter, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                messageKey: 'auth.enterEmail',
                message: 'Please enter your email address.'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        const successMessageKey = 'auth.resetLinkSent';
        const successMessage = 'Password reset link sent.';

        if (!user) {
            return res.status(200).json({
                messageKey: successMessageKey,
                message: successMessage
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000;

        await user.save();

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/sifre-belirle?token=${resetToken}`;

        await sendPasswordResetEmail(user.email, resetLink);

        res.status(200).json({
            messageKey: successMessageKey,
            message: successMessage
        });

    } catch (error) {
        console.error("Şifremi unuttum hatası:", error);
        res.status(500).json({
            messageKey: 'auth.forgotPasswordError',
            message: 'An error occurred during the password reset process.'
        });
    }
});

router.post('/set-password', authLimiter, async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                messageKey: 'auth.invalidRequest',
                message: 'Invalid request. Please fill in all fields.'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                messageKey: 'auth.passwordMinLength',
                params: { min: 6 },
                message: 'Password must be at least 6 characters.'
            });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                messageKey: 'auth.resetLinkInvalid',
                message: 'Reset link is invalid or expired.'
            });
        }

        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({
            messageKey: 'auth.passwordSetSuccess',
            message: 'Password has been set successfully. You can now log in.'
        });

    } catch (error) {
        console.error("Şifre belirleme hatası:", error);
        res.status(500).json({
            messageKey: 'auth.passwordUpdateError',
            message: 'An error occurred while updating the password.'
        });
    }
});

router.put('/update-profile', protectUser, async (req, res) => {
    try {
        const { fullName, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                messageKey: 'auth.userNotFound',
                message: 'User not found.'
            });
        }

        if (fullName) {
            user.fullName = fullName;
        }

        if (currentPassword && newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isMatch) {
                return res.status(400).json({
                    messageKey: 'auth.incorrectCurrentPassword',
                    message: 'Current password is incorrect.'
                });
            }

            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(newPassword, salt);
        }

        await user.save();

        res.json({
            _id: user._id,
            email: user.email,
            fullName: user.fullName
        });

    } catch (error) {
        console.error("Profil güncelleme hatası:", error);
        res.status(500).json({
            messageKey: 'auth.profileUpdateFailed',
            message: 'An error occurred while updating profile.'
        });
    }
});

module.exports = router;