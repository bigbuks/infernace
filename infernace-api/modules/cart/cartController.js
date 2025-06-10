const Cart = require('./Cart');
const Product = require('../product/Product');

//helper function to validate quantity against stock
const validateQuantityAgainstStock = (product, requestedQuantity, currentCartQuantity = 0) => {
    const totalRequiredQuantity = currentCartQuantity + requestedQuantity;
    

    if (product.isOutOfStock) {
        return {
            isValid: false,
            message: 'Product is currently out of stock'
        };
    }

    if (!product.inStock) {
        return {
            isValid: false,
            message: 'Product is currently out of stock'
        };
    }
    
    if (product.quantity < requestedQuantity) {
        return {
            isValid: false,
            message: `Only ${product.quantity} items available in stock`
        };
    }
    
    if (product.quantity < totalRequiredQuantity) {
        return {
            isValid: false,
            message: `Cannot add ${requestedQuantity} items. Only ${product.quantity - currentCartQuantity} more items can be added (${product.quantity} total available, ${currentCartQuantity} already in cart)`
        };
    }
    
    return {
        isValid: true,
        message: 'Quantity is valid'
    };
};


// Get user's cart
exports.getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product', 'name price images quantity isOutOfStock inStock');

        if (!cart) {
            return res.status(200).json({
                success: true,
                message: 'Cart is empty',
                data: {
                    items: [],
                    totalAmount: 0,
                    totalItems: 0
                }
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cart retrieved successfully',
            data: cart
        });

    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve cart'
        });
    }
};

// Add item to cart
exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        if (quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1'
            });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Find or create cart
        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            cart = new Cart({
                user: req.user._id,
                items: []
            });
        }

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        let currentCartQuantity = 0;
        if (existingItemIndex > -1) {
            currentCartQuantity = cart.items[existingItemIndex].quantity;
        }

        // Validate quantity against stock with explicit messaging
        const quantityValidation = validateQuantityAgainstStock(product, quantity, currentCartQuantity);
        if (!quantityValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: quantityValidation.message
            });
        }

        // Get current price from product 
        const currentPrice = parseFloat(product.price);

        if (existingItemIndex > -1) {
            // Update quantity and price for existing item
            cart.items[existingItemIndex].quantity += quantity;
            cart.items[existingItemIndex].price = currentPrice;
        } else {
            // Add new item to cart with current price
            cart.items.push({
                product: productId,
                quantity: quantity,
                price: currentPrice
            });
        }

        await cart.save();

        // Populate the cart before sending response
        await cart.populate('items.product', 'name price images quantity isOutOfStock inStock');

        res.status(200).json({
            success: true,
            message: 'Item added to cart successfully',
            data: cart
        });

    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add item to cart'
        });
    }
};

// Update item quantity in cart
exports.updateCartItem = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Product ID and quantity are required'
            });
        }

        if (quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1'
            });
        }

        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        // Check product availability and get current price
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Validate quantity against stock with explicit messaging
        const quantityValidation = validateQuantityAgainstStock(product, quantity, 0);
        if (!quantityValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: quantityValidation.message
            });
        }

        // Update quantity and always use current price from product
        cart.items[itemIndex].quantity = quantity;
        cart.items[itemIndex].price = parseFloat(product.price);

        await cart.save();

        // Populate the cart before sending response
        await cart.populate('items.product', 'name price images quantity isOutOfStock inStock');

        res.status(200).json({
            success: true,
            message: 'Cart item updated successfully',
            data: cart
        });

    } catch (error) {
        console.error('Update cart item error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update cart item'
        });
    }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        // Remove item from cart
        cart.items.splice(itemIndex, 1);

        await cart.save();

        // Populate the cart before sending response
        await cart.populate('items.product', 'name price images quantity isOutOfStock inStock');

        res.status(200).json({
            success: true,
            message: 'Item removed from cart successfully',
            data: cart
        });

    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove item from cart'
        });
    }
};

// Clear entire cart
exports.clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.items = [];
        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully',
            data: cart
        });

    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear cart'
        });
    }
};
