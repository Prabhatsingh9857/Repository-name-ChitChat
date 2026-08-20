const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ========================================
// REGISTER
// ========================================

const register = async (req, res) => {
    try {
        const {
            username,
            email,
            password,
        } = req.body;

        // ====================================
        // VALIDATION
        // ====================================

        if (
            !username ||
            !email ||
            !password
        ) {
            return res.status(400).json({
                message:
                    "Username, email and password are required",
            });
        }

        const cleanUsername =
            username.trim();

        const cleanEmail =
            email.trim().toLowerCase();

        if (!cleanUsername) {
            return res.status(400).json({
                message:
                    "Username is required",
            });
        }

        if (!cleanEmail) {
            return res.status(400).json({
                message:
                    "Email is required",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message:
                    "Password must be at least 6 characters",
            });
        }

        // ====================================
        // CHECK EXISTING EMAIL
        // ====================================

        const existingEmail =
            await User.findOne({
                email: cleanEmail,
            });

        if (existingEmail) {
            return res.status(409).json({
                message:
                    "An account with this email already exists",
            });
        }

        // ====================================
        // CHECK EXISTING USERNAME
        // ====================================

        const existingUsername =
            await User.findOne({
                username: cleanUsername,
            });

        if (existingUsername) {
            return res.status(409).json({
                message:
                    "Username is already taken",
            });
        }

        // ====================================
        // HASH PASSWORD
        // ====================================

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        // ====================================
        // CREATE USER
        // ====================================

        const user = await User.create({
            username: cleanUsername,
            email: cleanEmail,
            password: hashedPassword,
        });

        // ====================================
        // RESPONSE
        // ====================================

        return res.status(201).json({
            message:
                "Registration successful",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture:
                    user.profilePicture ||
                    null,
            },
        });
    } catch (error) {
        console.error(
            "Register error:",
            error
        );

        // MongoDB duplicate key
        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "Email or username already exists",
            });
        }

        return res.status(500).json({
            message:
                "Server error during registration",
        });
    }
};

// ========================================
// LOGIN
// ========================================

const login = async (req, res) => {
    try {
        const {
            email,
            password,
        } = req.body;

        // ====================================
        // VALIDATION
        // ====================================

        if (!email || !password) {
            return res.status(400).json({
                message:
                    "Email and password are required",
            });
        }

        const cleanEmail =
            email.trim().toLowerCase();

        // ====================================
        // FIND USER
        // ====================================

        const user =
            await User.findOne({
                email: cleanEmail,
            });

        if (!user) {
            return res.status(401).json({
                message:
                    "Invalid email or password",
            });
        }

        // ====================================
        // CHECK PASSWORD
        // ====================================

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatch) {
            return res.status(401).json({
                message:
                    "Invalid email or password",
            });
        }

        // ====================================
        // JWT
        // ====================================

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message:
                    "JWT_SECRET is missing from .env",
            });
        }

        const token =
            jwt.sign(
                {
                    userId:
                        user._id.toString(),
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "7d",
                }
            );

        // ====================================
        // RESPONSE
        // ====================================

        return res.status(200).json({
            message:
                "Login successful",

            token,

            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture:
                    user.profilePicture ||
                    null,
            },
        });
    } catch (error) {
        console.error(
            "Login error:",
            error
        );

        return res.status(500).json({
            message:
                "Server error during login",
        });
    }
};

module.exports = {
    register,
    login,
};