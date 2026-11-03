const express = require('express');
const router = express.Router();


const {createUser , getAllUsers , getUserById , deleteUserById , updateUserById ,registerUser , addUser , loginUser } = require('../controller/userController.js');
const verifyUserToken = require('../middleware/verifyUserToken.js')
router.post('/create' , createUser);
router.get('/all' , getAllUsers);
router.get('/singleuser/:id' , getUserById);
router.delete('/delete/:id' ,verifyUserToken, deleteUserById);
router.put('/update/:id', updateUserById);
router.post('/register' , registerUser);
router.post('/adduser' , addUser);
router.post('/login' , loginUser)


module.exports = router;    