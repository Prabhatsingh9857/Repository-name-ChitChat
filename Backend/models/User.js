const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        // ========================================
        // USERNAME
        // ========================================

        username: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },

        // ========================================
        // EMAIL
        // ========================================

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
        },

        // ========================================
        // PASSWORD
        // ========================================

        password: {
            type: String,
            required: true,
        },

        // ========================================
        // PROFILE PICTURE
        // ========================================

        profilePicture: {
            type: String,
            default: "",
        },

        // ========================================
        // BIO / ABOUT
        // ========================================

        bio: {
            type: String,
            trim: true,
            maxlength: 150,
            default: "",
        },

        // ========================================
        // ONLINE STATUS
        // ========================================

        isOnline: {
            type: Boolean,
            default: false,
        },

        // ========================================
        // LAST SEEN
        // ========================================

        lastSeen: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model(
    "User",
    userSchema
);

module.exports = User;