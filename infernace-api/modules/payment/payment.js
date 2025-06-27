const axios = require("axios");
const Order = require("../order/Order");
const Cart = require("../cart/Cart");
const Product = require("../product/Product");

exports.initializePaystackPayment = async (order, email) => {
  try {
    const paystackResponse = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: order.totalAmount * 100, // Convert to kobo
        callback_url: `${process.env.FRONTEND_URL}/order-success`,
        metadata: {
          orderId: order._id.toString(),
          custom_fields: [
            {
              display_name: "Order ID",
              variable_name: "order_id",
              value: order._id.toString(),
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (paystackResponse.data.status) {
      // Update order with payment reference
      order.paymentDetails = {
        reference: paystackResponse.data.data.reference,
        currency: "NGN", // Default currency
      };
      await order.save();

      return {
        success: true,
        authorizationUrl: paystackResponse.data.data.authorization_url,
        reference: paystackResponse.data.data.reference,
      };
    } else {
      return {
        success: false,
        message: "Failed to initialize payment",
      };
    }
  } catch (error) {
    console.error("Paystack initialization error:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

exports.verifyPaystackTransaction = async (reference, orderId) => {
  try {
    if (!reference || !orderId) {
      return { success: false, message: "Reference and orderId required" };
    }

    console.log("E reach here")
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (
      paystackResponse.data.status &&
      paystackResponse.data.data.status === "success"
    ) {
      const order = await Order.findById(orderId);

      // Replace the payment update with this:
      order.paymentDetails = {
        ...order.paymentDetails, // Preserve existing details
        authorizationCode:
          paystackResponse.data.data.authorization?.authorization_code,
        channel: paystackResponse.data.data.channel,
        ipAddress: paystackResponse.data.data.ip_address,
        fees: paystackResponse.data.data.fees / 100, // Convert from kobo
        paidAt: new Date(paystackResponse.data.data.paid_at),
      };
      order.paymentStatus = "paid";
      await order.save();

      return {
        success: true,
        message: "Transaction verified and order updated",
        order,
      };
    } else {
      return { success: false, message: "Transaction verification failed" };
    }
  } catch (error) {
    console.error("Paystack verification error:", error);
    return { success: false, message: error.message };
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { reference, orderId } = req.params;



    const verificationResult = await this.verifyPaystackTransaction(
      reference,
      orderId
    );

    console.log("Verification Result:", verificationResult);

    if (!verificationResult.success) {
      return res.status(400).json(verificationResult);
    }

    // Update stock after successful payment
    for (const item of verificationResult.order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          quantity: -item.quantity,
          sold: item.quantity,
        },
      });
    }

    // Clear cart if authenticated user
    if (verificationResult.order.user) {
      await Cart.findOneAndUpdate(
        { user: verificationResult.order.user },
        {
          items: [],
          totalItems: 0,
          totalPrice: 0,
        }
      );
    }

    res.status(200).json(verificationResult);
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
