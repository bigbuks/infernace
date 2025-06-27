const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    guestDetails: {
      firstName: { type: String },
      lastName: { type: String },
      email: { type: String },
      phone: { type: String },
    },
    isGuestOrder: {
      type: Boolean,
      default: false,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ["paystack"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentDetails: {
      reference: String,
      authorizationCode: String,
      channel: String,
      currency: { type: String, default: "NGN" },
      ipAddress: String,
      fees: Number,
      paidAt: Date,
    },
    orderStatus: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled"],
      default: "processing",
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    placedAt: {
      type: Date,
      default: Date.now,
    },
    deliveredAt: Date,
    sessionId: String,
    orderTrackingId: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined,
    },
  },
  { timestamps: true }
);

// ✅ Guest tracking ID middleware
OrderSchema.pre('save', function (next) {
    if (this.isGuestOrder && !this.orderTrackingId) {
        this.orderTrackingId = 'GUEST-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    next();
});

// For authenticated orders
OrderSchema.post('save', async function (doc, next) {
    if (!doc.isGuestOrder && !doc.orderTrackingId) {
        try {
            doc.orderTrackingId = `USER-${doc._id.toString()}`; // use _id as tracking
            await doc.save(); // second save to persist
        } catch (err) {
            console.error('Failed to assign tracking ID to auth order:', err.message);
        }
    }
    next();
});


module.exports = mongoose.model('Order', OrderSchema);
