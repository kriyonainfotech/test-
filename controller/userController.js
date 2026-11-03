require('dotenv').config();
const user = require('../model/user.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.createUser = async (req, res) => {
    try {
        const { name, email, phoneNo, password } = req.body;
        const newUser = await user.create({
            name, email, phoneNo, password
        })
        res.status(200).json({
            success: true,
            message: "User created successfully",
            data: newUser
        })

    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to create user"
        })
    }
}

exports.getAllUsers = async (req, res) => {
    try {
        const users = await user.find();
        res.status(200).json({
            success: true,
            message: " all users retrived successfully",
            data: users
        })
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to retrive all users"
        })
    }
}


exports.getUserById = async (req, res) => {

    try {
        // const id = req.params.id;
        const { id } = req.params;
        const singleUser = await user.findById(id);
        if (!singleUser) {
            res.status(404).json({
                success: false,
                message: "user not found"
            })
        }
        res.status(200).json({
            success: true,
            message: "user retrived successfully",
            data: singleUser
        })
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to retrive user"
        })
    }


}


exports.deleteUserById = async (req, res) => {
    try {
        const id = req.params.id;
        const deleteUser = await user.findByIdAndDelete(id);
        if (!deleteUser) {
            res.status(404).json({
                success: false,
                message: "user not found for deletion"
            })
        }
        res.status(200).json({
            success: true,
            message: "user deleted successfully"
        })

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to delete user"
        })
    }
}


exports.updateUserById = async (req, res) => {
    try {
        const id = req.params.id;
        const updatedUser = await user.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedUser) {
            res.status(404).json({
                success: false,
                message: "user not found for updation"
            })
        }
        res.status(200).json({
            success: true,
            message: "user updated successfully",
            data: updatedUser
        })
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: "failed to update user"
        })
    }
}


exports.registerUser = async (req, res) => {
    try {
        const { name, email, phoneNo, password } = req.body;
        const existingUser = await user.findOne({ email })
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "user with this email already exists"
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await user.create({
            name, email, phoneNo, password: hashedPassword
        });
        return res.status(201).json({
            success: true,
            message: "user registered successfully",
            data: newUser
        })
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: " Failed to register user"
        })
    }
}


exports.addUser = async (req, res) => {
    try {
        console.log(req.body);
        const { name, email, phoneNo, password } = req.body
        const existedUser = await user.findOne({ email: email })
        if (existedUser) {
            return res.status(400).json({
                success: false,
                message: "user with this email already exists"
            })
        }

        const hashedPass = bcrypt.hash(password, 10, async function (err, hash) {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    success: false,
                    message: "password hashing error"
                })
            }
            const newUser = await user.create({
                name, email, phoneNo, password: hashedPass

            })
        })
        return res.status(200).json({
            success: true,
            message: "user added successfully "
        })
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: "server error "
        })
    }

}


exports.loginUser = async (req, res) => {
    try {
        const { password, email } = req.body
        console.log(req.body);
        const existedUser = await user.findOne({ email: email })
        console.log(existedUser)
        if (!existedUser) {
            return res.status(401).json({
                message: "invalid email or password"
            })
        }
        const match = await bcrypt.compare(
            password, existedUser.password
        )
        console.log(match);
        console.log(password, existedUser.password)
        if (!match) {
            return res.status(401).json({
                message: "invalid email or password"
            })
        }
        const accessToken = jwt.sign({
            id: existedUser._id,
            email: existedUser.email

        }, process.env.JWT_SECRET, { expiresIn: "365d" }
        )
        console.log(accessToken)
        return res.status(200).json({
            success: true,
            message: "login successfully",
            token: accessToken,
            User: {
                id: existedUser._id,
                name: existedUser.name,
                email: existedUser.email
            }
        })
    }
    catch (err) {
        console.log(err)
        return res.status(500).json({
            message: "server error "
        })

    }
}
