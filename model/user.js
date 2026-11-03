const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    name: {
        type:String,
        required:true
    }, 
    email:{
        type:String,
        required:true,
        unique:true
    },
    phoneNo:{
        type:Number,

    },
    password:{
        type:String,
        required:true
    }

})

const user = mongoose.model('user' , userSchema); // create model 
module.exports = user;// export model