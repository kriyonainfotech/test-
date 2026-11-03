require('dotenv').config()
const express = require('express');
const jwt = require('jsonwebtoken');
const verifyUserToken = (req , res , next) => {
   try{
        const token = req.header('authorization')?.split(" ")[1];
        console.log(req.headers.authorization,"token");

        if(!token){
            return res.status(401).json({
                message: "unauthorized user"
            })

        }
         const decoded = jwt.verify(
            token , process.env.JWT_SECRET
         )
         req.user = decoded ;
         console.log(decoded,"user");
         next();
   }
   catch(err){
    console.log(err,"err")
    return res.status(500).json({
        success:false,
        message :"server error"
    });
 }
}
module.exports = verifyUserToken;