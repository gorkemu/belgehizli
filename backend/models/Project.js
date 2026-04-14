const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, default: 'general' },
    
    content: { type: String, default: '' },
    variables: { type: mongoose.Schema.Types.Mixed, default: {} },
    
    settings: {
        variableTrigger: { type: String, default: '{{' },
        isPublic: { type: Boolean, default: false } 
    }

}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);