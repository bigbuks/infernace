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
    isOutOfStock: {
        type: Boolean,
        default: false
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

//helper to calculate stock status
productSchema.methods.calculateStockStatus = function() {
    this.isOutOfStock = !this.inStock || this.quantity <= 0;
    return this.isOutOfStock;
};

//update the updatedAt field before saving
productSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    this.calculateStockStatus();
    next();
});

//update the updatedAt field before updating
productSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
    this.set({ updatedAt: Date.now() });
    
    const update = this.getUpdate();
    
    // If quantity or inStock are being updated, recalculate isOutOfStock
    if (update.quantity !== undefined || update.inStock !== undefined) {
        const newInStock = update.inStock !== undefined ? update.inStock : true;
        const newQuantity = update.quantity !== undefined ? update.quantity : 0;
        
        this.set({ 
            isOutOfStock: !newInStock || newQuantity <= 0 
        });
    }
    
    next();
});

module.exports = mongoose.model('Product', productSchema);