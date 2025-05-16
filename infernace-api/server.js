const express = require('express'); //to require express
const mongoose = require('mongoose'); //to require mongoose
const cors = require('cors'); //to require cors
require('dotenv').config(); //to require dotenv

//connection to my env file 
const dbUrl = process.env.MONGODB_URL;

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







