const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                    default: 1,
                },
                price: {
                    type: Number,
                    required: true,
                    min: 0,
                },
            },
        ],
        totalPrice: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
    },
    { timestamps: true }
);

//index for faster user lookup
CartSchema.index({ user: 1 });

CartSchema.pre('save', function (next) {
    this.totalPrice = this.items.reduce((acc, item) => {
        return acc + item.price * item.quantity;
    }, 0);
    next();
});

module.exports = mongoose.model('Cart', CartSchema);
