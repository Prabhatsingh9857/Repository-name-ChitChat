const User = require("../models/User");
const fs = require("fs");
const path = require("path");

// ========================================
// HELPER: EMIT PROFILE UPDATE
// ========================================

const emitProfileUpdate = (req, user) => {
    try {
        const io = req.app.get("io");

        if (!io || !user) {
            return;
        }

        io.emit("profileUpdated", {
            user: user.toObject
                ? user.toObject()
                : user,
        });

        console.log(
            "Profile update emitted:",
            user._id.toString()
        );
    } catch (error) {
        console.error(
            "Profile update socket error:",
            error
        );
    }
};

// ========================================
// SEARCH USERS
// ========================================

const searchUsers = async (req, res) => {
    try {
        const { search } = req.query;

        const currentUserId = req.userId;

        if (!search || !search.trim()) {
            return res.status(200).json({
                users: [],
            });
        }

        const users = await User.find({
            _id: {
                $ne: currentUserId,
            },

            $or: [
                {
                    username: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },

                {
                    email: {
                        $regex: search.trim(),
                        $options: "i",
                    },
                },
            ],
        })
            .select(
                "username email profilePicture bio isOnline lastSeen"
            )
            .limit(10);

        return res.status(200).json({
            users,
        });
    } catch (error) {
        console.error(
            "Search users error:",
            error
        );

        return res.status(500).json({
            message:
                "Server error while searching users",
        });
    }
};

// ========================================
// GET MY PROFILE
// ========================================

const getProfile = async (req, res) => {
    try {
        const userId = req.userId;

        const user =
            await User.findById(userId).select(
                "-password"
            );

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            user,
        });
    } catch (error) {
        console.error(
            "Get profile error:",
            error
        );

        return res.status(500).json({
            message:
                "Server error while getting profile",
        });
    }
};

// ========================================
// UPDATE MY PROFILE
// username + bio
// ========================================

const updateProfile = async (req, res) => {
    try {
        const userId = req.userId;

        const {
            username,
            bio,
        } = req.body;

        // ====================================
        // USERNAME VALIDATION
        // ====================================

        if (
            username === undefined ||
            typeof username !== "string"
        ) {
            return res.status(400).json({
                message:
                    "Username is required.",
            });
        }

        const newUsername =
            username.trim();

        if (!newUsername) {
            return res.status(400).json({
                message:
                    "Username cannot be empty.",
            });
        }

        if (newUsername.length < 3) {
            return res.status(400).json({
                message:
                    "Username must be at least 3 characters.",
            });
        }

        if (newUsername.length > 30) {
            return res.status(400).json({
                message:
                    "Username cannot exceed 30 characters.",
            });
        }

        // ====================================
        // BIO VALIDATION
        // ====================================

        const newBio =
            typeof bio === "string"
                ? bio.trim()
                : "";

        if (newBio.length > 150) {
            return res.status(400).json({
                message:
                    "Bio cannot exceed 150 characters.",
            });
        }

        // ====================================
        // FIND USER
        // ====================================

        const user =
            await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message:
                    "User not found.",
            });
        }

        // ====================================
        // CHECK USERNAME
        // ====================================

        if (
            newUsername !==
            user.username
        ) {
            const existingUser =
                await User.findOne({
                    username:
                        newUsername,

                    _id: {
                        $ne: userId,
                    },
                });

            if (existingUser) {
                return res.status(409).json({
                    message:
                        "Username is already taken.",
                });
            }
        }

        // ====================================
        // UPDATE USERNAME
        // ====================================

        user.username =
            newUsername;

        // ====================================
        // UPDATE BIO
        // ====================================

        user.bio =
            newBio;

        // ====================================
        // SAVE
        // ====================================

        await user.save();

        // ====================================
        // GET UPDATED USER
        // ====================================

        const updatedUser =
            await User.findById(
                userId
            ).select("-password");

        // ====================================
        // REAL-TIME PROFILE UPDATE
        // ====================================

        emitProfileUpdate(
            req,
            updatedUser
        );

        // ====================================
        // RESPONSE
        // ====================================

        return res.status(200).json({
            success: true,

            message:
                "Profile updated successfully.",

            user: updatedUser,
        });
    } catch (error) {
        console.error(
            "================================"
        );

        console.error(
            "UPDATE PROFILE ERROR:"
        );

        console.error(error);

        console.error(
            "================================"
        );

        // ====================================
        // DUPLICATE KEY
        // ====================================

        if (
            error.code === 11000
        ) {
            if (
                error.keyPattern?.username
            ) {
                return res.status(409).json({
                    message:
                        "Username is already taken.",
                });
            }

            if (
                error.keyPattern?.email
            ) {
                return res.status(409).json({
                    message:
                        "Email is already registered.",
                });
            }
        }

        return res.status(500).json({
            message:
                "Server error while updating profile.",
        });
    }
};

// ========================================
// UPLOAD PROFILE PICTURE
// ========================================

const uploadProfilePicture = async (
    req,
    res
) => {
    try {
        const userId = req.userId;

        // ====================================
        // CHECK FILE
        // ====================================

        if (!req.file) {
            return res.status(400).json({
                message:
                    "Please select an image.",
            });
        }

        // ====================================
        // FIND USER
        // ====================================

        const user =
            await User.findById(userId);

        if (!user) {
            if (req.file.path) {
                fs.unlink(
                    req.file.path,
                    () => {}
                );
            }

            return res.status(404).json({
                message:
                    "User not found.",
            });
        }

        // ====================================
        // DELETE OLD PROFILE PICTURE
        // ====================================

        if (
            user.profilePicture &&
            user.profilePicture.startsWith(
                "/uploads/"
            )
        ) {
            const oldFilename =
                path.basename(
                    user.profilePicture
                );

            const oldFilePath =
                path.join(
                    __dirname,
                    "../uploads",
                    oldFilename
                );

            if (
                fs.existsSync(
                    oldFilePath
                )
            ) {
                try {
                    fs.unlinkSync(
                        oldFilePath
                    );
                } catch (deleteError) {
                    console.error(
                        "Could not delete old profile picture:",
                        deleteError
                    );
                }
            }
        }

        // ====================================
        // SAVE NEW PROFILE PICTURE
        // ====================================

        user.profilePicture =
            `/uploads/${req.file.filename}`;

        await user.save();

        // ====================================
        // GET UPDATED USER
        // ====================================

        const updatedUser =
            await User.findById(
                userId
            ).select("-password");

        // ====================================
        // REAL-TIME PROFILE UPDATE
        // ====================================

        emitProfileUpdate(
            req,
            updatedUser
        );

        // ====================================
        // RESPONSE
        // ====================================

        return res.status(200).json({
            success: true,

            message:
                "Profile picture updated successfully.",

            user: updatedUser,
        });
    } catch (error) {
        console.error(
            "Upload profile picture error:",
            error
        );

        // ====================================
        // DELETE FAILED UPLOAD
        // ====================================

        if (req.file?.path) {
            try {
                if (
                    fs.existsSync(
                        req.file.path
                    )
                ) {
                    fs.unlinkSync(
                        req.file.path
                    );
                }
            } catch (deleteError) {
                console.error(
                    "Could not delete uploaded file:",
                    deleteError
                );
            }
        }

        return res.status(500).json({
            message:
                "Server error while uploading profile picture.",
        });
    }
};

// ========================================
// GET USER BY ID
// ========================================

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user =
            await User.findById(id).select(
                "username email profilePicture bio isOnline lastSeen"
            );

        if (!user) {
            return res.status(404).json({
                message:
                    "User not found",
            });
        }

        return res.status(200).json({
            user,
        });
    } catch (error) {
        console.error(
            "Get user by ID error:",
            error
        );

        return res.status(500).json({
            message:
                "Server error while getting user",
        });
    }
};

// ========================================
// EXPORT
// ========================================

module.exports = {
    searchUsers,
    getProfile,
    updateProfile,
    uploadProfilePicture,
    getUserById,
};