const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return !isNaN(parseFloat(v)) && parseFloat(v) >= 0;
            },
            message: 'price must be a positive number'
        }
    },
    category: {
        type: String,
        enum: ['men', 'women', 'unisex'],
        trim: true
    },
    subCategory: {
        type: String,
        enum: ['shirt', 'sweat shirt', 'hoodies', 'jacket', 'pants'],
        trim: true
    },
    inStock: {
        type: Boolean,
        default: true
    },
    quantity: {
        type: Number,
        default: 0,
        min: 0
    },
    sold: {
        type: Number,
        default: 0
    },
    images: [ {
        type: String,
        trim: true
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }, 
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

//update the updatedAt field before saving
productSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

//update the updatedAt field before updating
productSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

module.exports = mongoose.model('Product', productSchema);