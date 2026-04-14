// backend/models/template.js
const mongoose = require('mongoose');
const slugify = require('slugify');

const subfieldSchema = new mongoose.Schema({
    name: { type: String, required: true },
    label: { type: String, required: true },
    fieldType: { type: String, required: true },
    placeholder: String,
    options: [String],
    required: Boolean,
}, { _id: false });

const fieldSchema = new mongoose.Schema({
    name: { type: String, required: true },
    label: { type: String, required: true },
    fieldType: { type: String, required: true },
    placeholder: String,
    options: [String],
    required: Boolean,
    condition: {
        field: String,
        value: String
    },
    blockTitle: String,
    addLabel: String,
    removeLabel: String,
    minInstances: Number,
    maxInstances: Number,
    subfields: [subfieldSchema]
}, { _id: false });

const templateSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        default: null,
        index: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null,
        index: true
    },
    
    name: { type: String, required: true },
    description: { type: String },
    
    content: { type: String, default: '' }, 
    
    category: String,
    order: { type: Number, default: 0 },
    
    fields: [fieldSchema], 
    
    localVariables: {
        type: Map,
        of: String,
        default: {}
    },

    isSystem: {
        type: Boolean,
        default: false, 
        index: true
    },

    editorMode: {
        type: String,
        enum: ['form_builder', 'focus_editor'],
        default: 'form_builder'
    },

    isActive: {
        type: Boolean,
        default: true
    },
    
    slug: {
        type: String,
        unique: true,
        index: true,
        sparse: true
    }
}, { 
    timestamps: true 
});

templateSchema.pre('save', async function (next) {
    if (this.isModified('name') || this.isNew) {
        if (this.name) {
            const baseSlug = slugify(this.name, { lower: true, strict: true });

            if (!this.isSystem) {
                const randomCode = Math.random().toString(36).substring(2, 8);
                this.slug = `${baseSlug}-${randomCode}`;
            } else {
                let uniqueSlug = baseSlug;
                let counter = 1;

                while (true) {
                    const existingTemplate = await mongoose.model('Template').findOne({
                        slug: uniqueSlug,
                        _id: { $ne: this._id }
                    });

                    if (!existingTemplate) break;

                    uniqueSlug = `${baseSlug}-${counter}`;
                    counter++;
                }
                this.slug = uniqueSlug;
            }
        } else {
            this.slug = null;
        }
    }
    next();
});

const Template = mongoose.model('Template', templateSchema);

module.exports = Template;