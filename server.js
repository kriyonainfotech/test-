require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const connectDB = require('./config/db.js');
const MONGO_URL = process.env.MONGO_URL;
const userRoute = require('./routes/indexRoute');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Connect Database
connectDB(MONGO_URL);

// API Routes
app.use('/api', userRoute);

// Fallback to index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
    console.log(`Frontend UI accessible at http://localhost:${PORT}`);
});
