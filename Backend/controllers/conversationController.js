const Conversation = require("../models/Conversation");

// ========================================
// CREATE OR GET CONVERSATION
// ========================================

const createConversation = async (req, res) => {
    try {
        const { userId } = req.body;

        const currentUserId = req.userId;

        // -------------------------------
        // Validate user ID
        // -------------------------------

        if (!userId) {
            return res.status(400).json({
                message: "User ID is required",
            });
        }

        // -------------------------------
        // Prevent chatting with yourself
        // -------------------------------

        if (
            currentUserId.toString() ===
            userId.toString()
        ) {
            return res.status(400).json({
                message:
                    "You cannot create a conversation with yourself",
            });
        }

        // -------------------------------
        // Check if conversation already exists
        // -------------------------------

        let conversation =
            await Conversation.findOne({
                participants: {
                    $all: [
                        currentUserId,
                        userId,
                    ],
                },
            });

        // -------------------------------
        // Create if it doesn't exist
        // -------------------------------

        if (!conversation) {
            conversation =
                await Conversation.create({
                    participants: [
                        currentUserId,
                        userId,
                    ],
                });
        }

        // -------------------------------
        // Populate participants
        // -------------------------------

        conversation =
            await Conversation.findById(
                conversation._id
            )
                .populate(
                    "participants",
                    "username email profilePicture isOnline lastSeen"
                )
                .populate({
                    path: "lastMessage",
                    populate: {
                        path: "sender",
                        select:
                            "username email profilePicture",
                    },
                });

        // -------------------------------
        // Response
        // -------------------------------

        return res.status(200).json({
            message: "Conversation ready",
            conversation,
        });
    } catch (error) {
        console.error(
            "Create conversation error:",
            error
        );

        return res.status(500).json({
            message:
                "Server error while creating conversation",
        });
    }
};

// ========================================
// GET MY CONVERSATIONS
// ========================================

const getMyConversations = async (req, res) => {
    try {
        const currentUserId = req.userId;

        const conversations =
            await Conversation.find({
                participants: currentUserId,
            })
                .populate(
                    "participants",
                    "username email profilePicture isOnline lastSeen"
                )
                .populate({
                    path: "lastMessage",
                    populate: {
                        path: "sender",
                        select:
                            "username email profilePicture",
                    },
                })
                .sort({
                    updatedAt: -1,
                });

        return res.status(200).json({
            conversations,
        });
    } catch (error) {
        console.error(
            "Get conversations error:",
            error
        );

        return res.status(500).json({
            message:
                "Server error while getting conversations",
        });
    }
};

module.exports = {
    createConversation,
    getMyConversations,
};