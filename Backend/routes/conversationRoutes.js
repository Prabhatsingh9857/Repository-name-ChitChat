const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
    createConversation,
    getMyConversations,
} = require("../controllers/conversationController");

const router = express.Router();

// Create or get a conversation
router.post("/", protect, createConversation);

// Get all conversations of logged-in user
router.get("/", protect, getMyConversations);

module.exports = router;