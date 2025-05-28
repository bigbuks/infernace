const Product = require('./Product');

//get all product
exports.getAllProduct = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error });
    }
};

//get product by id
exports.singleproduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product', error });
    }
};

//latest collection
exports.latestCollection = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 }).limit(10);
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching latest products', error });
    }
};

//best seller
exports.bestSeller = async (req, res) => {
    try {
        const products = await Product.find().sort({ sold: -1 }).limit(10);
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching best seller products', error });
    }
};

//related product //not yet working after testing circle back
exports.relatedProduct = async (req, res) => {
    try {
        const { category } = req.body;
        const products = await Product.find({ category }).limit(10);
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching related products', error });
    }
};