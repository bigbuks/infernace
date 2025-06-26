const Product = require('../product/Product');
const Admin = require('./Admin');
const { cloudinary } = require('../../config/cloudinary');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Add product to the database
exports.addproduct = async (req, res) => {
    try {
        const { name, description, price, category, subCategory, inStock, quantity } = req.body;

        // Validate required fields
        if (!name || !price || !category || !subCategory || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Name, price, category, subCategory, and quantity are required'
            });
        }

         // Validate price format (should be a valid number string)
        const priceValue = parseFloat(price);
        if (isNaN(priceValue) || priceValue < 0) {
            return res.status(400).json({
                success: false,
                message: 'Price must be a valid positive number'
            });
        }

        // Handle image uploads
        const uploadedImages = [];
        const imageFields = ['image1', 'image2', 'image3'];

        for (const field of imageFields) {
            if (req.files?.[field]?.[0]) {
                try {
                    const result = await cloudinary.uploader.upload(req.files[field][0].path, {
                        folder: 'infernace/products',
                        transformation: [
                            { width: 800, height: 800, crop: 'fill' },
                            { quality: 'auto', fetch_format: 'auto' }
                        ]
                    });
                    uploadedImages.push(result.secure_url);
                } catch (uploadError) {
                    console.error(`Error uploading ${field}:`, uploadError);
                    return res.status(500).json({
                        success: false,
                        message: `Error uploading ${field}: ${uploadError.message}`
                    });
                }
            }
        }

        const stockStatus = inStock !== undefined ? inStock : true;
        const quantityValue = quantity ? parseInt(quantity) : 0;

        // Create new product
        const newProduct = new Product({
            name: name.trim(),
            description: description ? description.trim() : '',
            price: priceValue.toString(),
            category,
            subCategory,
            inStock: stockStatus,
            quantity: quantityValue,
            isOutOfStock: !stockStatus || quantityValue <= 0,
            images: uploadedImages.length > 0 ? uploadedImages : [] // Store as array
        });

        const savedProduct = await newProduct.save();

        res.status(201).json({
            success: true,
            message: 'Product added successfully',
            product: savedProduct
        });

    } catch (error) {
        console.error('Error adding product:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error while adding product'
        });
    }
};

// Update product
exports.updateproduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category, subCategory, inStock, quantity } = req.body;

        // Check if product exists
        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Prepare update data
        const updateData = {};
        if (name) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description.trim();
        // Handle price update with validation
        if (price) {
            const priceValue = parseFloat(price);
            if (isNaN(priceValue) || priceValue < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Price must be a valid positive number'
                });
            }
            updateData.price = price.toString(); // Store as string
        }
        if (category) updateData.category = category;
        if (subCategory) updateData.subCategory = subCategory;
        if (inStock !== undefined) updateData.inStock = inStock;
        if (quantity !== undefined) updateData.quantity = parseInt(quantity);

        // Auto-calculate isOutOfStock based on inStock and quantity
        const finalInStock = inStock !== undefined ? inStock : existingProduct.inStock;
        const finalQuantity = quantity !== undefined ? parseInt(quantity) : existingProduct.quantity;
        updateData.isOutOfStock = !finalInStock || finalQuantity <= 0;

        // Handle new image uploads
        const newImages = [];
        const imageFields = ['image1', 'image2', 'image3'];

        for (const field of imageFields) {
            if (req.files && req.files[field] && req.files[field][0]) {
                try {
                    const result = await cloudinary.uploader.upload(req.files[field][0].path, {
                        folder: 'infernace/products',
                        transformation: [
                            { width: 800, height: 800, crop: 'fill' },
                            { quality: 'auto', fetch_format: 'auto' }
                        ]
                    });
                    newImages.push(result.secure_url);
                } catch (uploadError) {
                    console.error(`Error uploading ${field}:`, uploadError);
                }
            }
        }

        // If new images are uploaded, replace old ones
        if (newImages.length > 0) {
            // Delete old images from Cloudinary
            if (existingProduct.images && Array.isArray(existingProduct.images)) {
                for (const imageUrl of existingProduct.images) {
                    try {
                        // Extract public_id from URL
                        const urlParts = imageUrl.split('/');
                        const fileName = urlParts[urlParts.length - 1];
                        const publicId = `infernace/products/${fileName.split('.')[0]}`;
                        await cloudinary.uploader.destroy(publicId);
                    } catch (deleteError) {
                        console.error('Error deleting old image:', deleteError);
                    }
                }
            }
            updateData.images = newImages;
        }

        // Update product
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            product: updatedProduct
        });

    } catch (error) {
        console.error('Error updating product:', error);

        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error while updating product'
        });
    }
};

// Delete product
exports.deleteproduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Find and delete product
        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Delete associated images from Cloudinary
        if (product.images && Array.isArray(product.images)) {
            for (const imageUrl of product.images) {
                try {
                    // Extract public_id from URL
                    const urlParts = imageUrl.split('/');
                    const fileName = urlParts[urlParts.length - 1];
                    const publicId = `infernace/products/${fileName.split('.')[0]}`;
                    // Delete image from Cloudinary
                    await cloudinary.uploader.destroy(publicId);
                } catch (deleteError) {
                    console.error('Error deleting image from Cloudinary:', deleteError);
                    return res.status(500).json({
                        success: false,
                        message: 'Error deleting image from Cloudinary'
                    });
                }
            }
        }

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully',
            deletedProduct: {
                id: product._id,
                name: product.name
            }
        });

    } catch (error) {
        console.error('Error deleting product:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting product'
        });
    }
};

// Generate JWT token
const generateToken = (id) => {
    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not set');
    }

    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
};

// Admin registration
exports.adminRegister = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email, and password are required'
            });
        }

        // Validate password strength (minimum 8 characters)
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({
            $or: [{ email: email.toLowerCase() }, { username }]
        });

        if (existingAdmin) {
            return res.status(409).json({
                success: false,
                message: 'Admin with this email or username already exists'
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new admin
        const newAdmin = new Admin({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword
        });

        const savedAdmin = await newAdmin.save();

        // Generate token
        const token = generateToken(savedAdmin._id);

        res.status(201).json({
            success: true,
            message: 'Admin registered successfully',
            admin: {
                id: savedAdmin._id,
                username: savedAdmin.username,
                email: savedAdmin.email,
                createdAt: savedAdmin.createdAt
            },
            token
        });

    } catch (error) {
        console.error('Error registering admin:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({
                success: false,
                message: `Admin with this ${field} already exists`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error while registering admin'
        });
    }
};

// Admin login
exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find admin by email
        const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, admin.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(admin._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                createdAt: admin.createdAt
            },
            token
        });

    } catch (error) {
        console.error('Error logging in admin:', error);

        res.status(500).json({
            success: false,
            message: 'Internal server error while logging in'
        });
    }
};

// Admin logout
exports.adminLogout = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Logout successful. Please remove the token from your client.'
        });

    } catch (error) {
        console.error('Error logging out admin:', error);

        res.status(500).json({
            success: false,
            message: 'Internal server error while logging out'
        });
    }
};