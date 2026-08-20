const express = require("express");

const protect = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

const {
    sendMessage,
    sendImageMessage,
    sendFileMessage,
    sendAudioMessage,
    getMessages,
} = require("../controllers/messageController");

const router = express.Router();

// ========================================
// TEXT MESSAGE
// ========================================

router.post(
    "/",
    protect,
    sendMessage
);

// ========================================
// IMAGE MESSAGE
// ========================================

router.post(
    "/image",
    protect,
    upload.single("image"),
    sendImageMessage
);

// ========================================
// FILE MESSAGE
// ========================================

router.post(
    "/file",
    protect,
    upload.single("file"),
    sendFileMessage
);

// ========================================
// AUDIO / VOICE MESSAGE
// ========================================

router.post(
    "/audio",
    protect,
    upload.single("audio"),
    sendAudioMessage
);

// ========================================
// GET MESSAGES
// ========================================

router.get(
    "/:conversationId",
    protect,
    getMessages
);

// ========================================
// EXPORT
// ========================================

module.exports = router;