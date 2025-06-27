const express = require('express'); //to require express
const mongoose = require('mongoose'); //to require mongoose
const cors = require('cors'); //to require cors
require('dotenv').config(); //to require dotenv

//connection to my env file 
const dbUrl = process.env.MONGODB_URL;

//importing routes
const productRoute = require('./modules/product/productRoute');
const adminRoutes = require('./modules/admin/adminRoutes');
const userRoutes = require('./modules/user/userRoutes');
const cartRoutes = require('./modules/cart/cartRoutes');
const newsletterRoutes = require('./modules/newsletter/newsletterRoute');
const orderRoutes = require('./modules/order/orderRoutes');
const paymentRoutes = require('./modules/payment/paymentRoute');

//to connect to the mongodb server
mongoose.connect(dbUrl).then(() => {
    console.log('MongoDB connected');
    const app = express(); //to create an instance of express
    const port = process.env.PORT || 5000;  //to set the port 
    


//middleware
app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

//mounting api routes
app.use('/api', productRoute);
app.use('/api', adminRoutes);
app.use('/api', userRoutes);
app.use('/api', cartRoutes);
app.use('/api', newsletterRoutes);
app.use('/api', orderRoutes);
app.use('/api', paymentRoutes)

app.get('/', (req, res) => {
    res.send('API is running');
});

app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
});
})
.catch((err) => {
    console.log('MongoDB connection error:', err);
});







