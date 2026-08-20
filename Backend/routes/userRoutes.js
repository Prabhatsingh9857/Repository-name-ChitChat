const express = require("express");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
    searchUsers,
    getProfile,
    updateProfile,
    uploadProfilePicture,
    getUserById,
} = require("../controllers/userController");

const router = express.Router();

// ========================================
// SEARCH USERS
// ========================================

router.get(
    "/search",
    protect,
    searchUsers
);

// ========================================
// MY PROFILE
// ========================================

router.get(
    "/profile",
    protect,
    getProfile
);

// ========================================
// UPDATE PROFILE
// ========================================

router.put(
    "/profile",
    protect,
    updateProfile
);

// ========================================
// UPLOAD PROFILE PICTURE
// ========================================

router.put(
    "/profile/picture",
    protect,
    upload.single("profilePicture"),
    uploadProfilePicture
);

// ========================================
// GET USER BY ID
// ========================================

router.get(
    "/:id",
    protect,
    getUserById
);

module.exports = router;