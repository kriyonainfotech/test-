require('dotenv').config();
const mongoose = require('mongoose');
const MONGO_URL = process.env.MONGO_URL;
console.log(MONGO_URL,'MONGO_URL');

const connectDB = async () => {
    try {
        const data = await mongoose.connect(MONGO_URL,{})
            console.log(MONGO_URL,'Database connected successfully')
        }
    catch (err) {
        console.log(err, 'Database connection failed');
         process.exit(1); // stop because of error
    }
}

module.exports = connectDB;





    