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
    name: { type: String, required: true },
    description: { type: String, required: true },
    content: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    fields: [fieldSchema],
    category: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },

    slug: {
        type: String,
        unique: true,
        index: true,
        sparse: true
    }

});

templateSchema.pre('save', async function(next) {
    if (this.isModified('name') || this.isNew) {
        if (this.name) {
            const baseSlug = slugify(this.name, { lower: true, strict: true });
            let uniqueSlug = baseSlug;
            let counter = 1;

            while (true) {
                const existingTemplate = await mongoose.model('Template').findOne({
                    slug: uniqueSlug,
                    _id: { $ne: this._id }
                });

                if (!existingTemplate) {
                    break;
                }

                uniqueSlug = `${baseSlug}-${counter}`;
                counter++;
            }
            this.slug = uniqueSlug;
        } else {
            this.slug = null;
        }
    }
    this.updatedAt = Date.now();
    next();
});

const Template = mongoose.model('Template', templateSchema);

module.exports = Template;