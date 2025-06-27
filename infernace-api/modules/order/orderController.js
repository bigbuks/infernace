const Order = require('./Order');
const Product = require('../product/Product');
const { initializePaystackPayment } = require('../payment/payment');

async function validateOrderData(items, shippingAddress) {
    if (!items || !Array.isArray(items) || items.length === 0) {
        return { success: false, message: 'Order items are required' };
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || 
        !shippingAddress.state || !shippingAddress.country) {
        return { success: false, message: 'Complete shipping address is required' };
    }

    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product) {
            return { 
                success: false, 
                message: `Product with ID ${item.product} not found` 
            };
        }

        if (!product.inStock || product.isOutOfStock || product.quantity < item.quantity) {
            return { 
                success: false, 
                message: `${product.name} is out of stock or insufficient quantity available` 
            };
        }

        const price = parseFloat(product.price);
        const itemTotal = price * item.quantity;
        totalAmount += itemTotal;

        validatedItems.push({
            product: product._id,
            quantity: item.quantity,
            price: itemTotal
        });
    }

    return {
        success: true,
        validatedItems,
        totalAmount
    };
}


const validateGuestDetails = (guestDetails) => {
    if (!guestDetails) {
        return { isValid: false, message: 'Guest details are required' };
    }

    const { firstName, lastName, email } = guestDetails;
    
    if (!firstName || !lastName) {
        return { isValid: false, message: 'First name and last name are required' };
    }

    if (!email) {
        return { isValid: false, message: 'Email is required' };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, message: 'Please provide a valid email address' };
    }

    return { isValid: true };
};


///////   ------- CREATE ORDER ---------  ///////////////
exports.createOrder = async (req, res) => {
    console.log('Order request body:', req.body);
    console.log('User ID:', req.user._id);
    try {
        const { items, shippingAddress, paymentMethod } = req.body;
        const userId = req.user._id;

        const validationResult = await validateOrderData(items, shippingAddress);
        if (!validationResult.success) {
            return res.status(400).json(validationResult);
        }

        const newOrder = new Order({
            user: userId,
            isGuestOrder: false,
            items: validationResult.validatedItems,
            shippingAddress,
            paymentMethod: paymentMethod || 'paystack',
            totalAmount: validationResult.totalAmount
        });

        const savedOrder = await newOrder.save();

        if (savedOrder.paymentMethod === 'paystack') {
            const paymentInit = await initializePaystackPayment(savedOrder, req.user.email);
            if (!paymentInit.success) {
                return res.status(400).json(paymentInit);
            }

            return res.status(201).json({
                success: true,
                message: 'Order created and payment initialized',
                order: savedOrder,
                payment: {
                    authorizationUrl: paymentInit.authorizationUrl,
                    reference: paymentInit.reference
                }
            });
        }

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: savedOrder
        });

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
            error: error.message
        });
    }
};

exports.createGuestOrder = async (req, res) => {
    console.log('Guest order request body:', req.body);
    try {
        const { items, shippingAddress, paymentMethod, guestDetails } = req.body;

        console.log('Guest order request body:', req.body);

        const guestValidation = validateGuestDetails(guestDetails);
        if (!guestValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: guestValidation.message
            });
        }

        const validationResult = await validateOrderData(items, shippingAddress);
        if (!validationResult.success) {
            return res.status(400).json(validationResult);
        }

        const newOrder = new Order({
            isGuestOrder: true,
            guestDetails,
            items: validationResult.validatedItems,
            shippingAddress,
            paymentMethod: paymentMethod || 'paystack',
            totalAmount: validationResult.totalAmount
        });

        const savedOrder = await newOrder.save();

        if (savedOrder.paymentMethod === 'paystack') {
            const paymentInit = await initializePaystackPayment(savedOrder, guestDetails.email);
            if (!paymentInit.success) {
                return res.status(400).json(paymentInit);
            }

            return res.status(201).json({
                success: true,
                message: 'Guest order created and payment initialized',
                order: savedOrder,
                payment: {
                    authorizationUrl: paymentInit.authorizationUrl,
                    reference: paymentInit.reference
                }
            });
        }

        res.status(201).json({
            success: true,
            message: 'Guest order created successfully',
            order: savedOrder
        });

    } catch (error) {
        console.error('Guest order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
            error: error.message
        });
    }
};


exports.getGuestOrderByTrackingId = async (req, res) => {
    try {
        const { trackingId } = req.params;
        const { email } = req.query; //additional verification

        if (!trackingId) {
            return res.status(400).json({
                success: false,
                message: 'Tracking ID is required'
            });
        }

        //build query
        const query = { 
            orderTrackingId: trackingId, 
            isGuestOrder: true 
        };

        if (email) {
            query['guestDetails.email'] = email; //additional verification
        }

        //find the order
        const order = await Order.findOne(query)
            .populate('items.product', 'name price images description')

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found. Please check the tracking ID and email.'
            });
        }

        res.status(200).json({
            success: true,
            order
        });

    } catch (error) {
        console.error('Get guest order by tracking ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
            error: error.message
        });
    }
};

//get all orders for a user
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;

        const orders = await Order.find({ user: userId })
            .populate('items.product', 'name price images')
            .populate('user', 'username email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            orders
        });

    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
            error: error.message
        });
    }
};

//get a specific order by ID
exports.getOrdersById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await Order.findOne({ _id: orderId, user: userId})
            .populate('items.product', 'name price images description')
            .populate('user', 'username email');

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            res.status(200).json({
                success: true,
                order
            });
        } catch (error) {
            console.error('Get order by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error. Please try again later.',
                error: error.message
            });
        }
};

//cancel an order (only if payment is pending and order is processing )
exports.cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await Order.findOne({ _id: orderId, user: userId });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if order can be cancelled
        if (order.paymentStatus === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel a paid order. Please contact us for refund'
            });
        }

        if (order.orderStatus === 'shipped' || order.orderStatus === 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel an order that has already been shipped or delivered'
            });
        }

        if (order.orderStatus === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Order is already cancelled'
            });
        }

        //update order status
        order.orderStatus = 'cancelled';
        await order.save();

        // Restore product quantities
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: {
                    quantity: item.quantity,
                    sold: -item.quantity
                }
            });
        }

        res.status(200).json({
            success: true,
            message: 'Order canceled successfully',
            order
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
            error: error.message
        });
    }
};

// Admin Endpoints:

//get all orders
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('items.product', 'name price')
            .populate('user', 'username email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            orders
        });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
            error: error.message
        });
    }
};

//update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { orderStatus, paymentStatus } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Update fields if provided
        if (orderStatus) {
            order.orderStatus = orderStatus;
            
            // Set delivered date if status is delivered
            if (orderStatus === 'delivered') {
                order.deliveredAt = new Date();
            }
        }

        if (paymentStatus) {
            order.paymentStatus = paymentStatus;
            
            // Set paid date if payment is confirmed
            if (paymentStatus === 'paid' && !order.paymentDetails.paidAt) {
                order.paymentDetails.paidAt = new Date();
            }
        }

        await order.save();

        const updatedOrder = await Order.findById(orderId)
            .populate('user', 'username email')
            .populate('items.product', 'name price');

        res.status(200).json({
            success: true,
            message: 'Order updated successfully',
            order: updatedOrder
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating order',
            error: error.message
        });
    }
};