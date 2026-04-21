// backend/models/Project.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    content: { type: String, default: '' },
    fields: { type: Array, default: [] },
    settings: {
        isPublic: { type: Boolean, default: false },
        variableTrigger: { type: String, default: '{{' }
    }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);