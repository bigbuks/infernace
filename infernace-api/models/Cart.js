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
        // isActive: {
        //     type: Boolean,
        //     default: true,
        // },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Cart', CartSchema);
