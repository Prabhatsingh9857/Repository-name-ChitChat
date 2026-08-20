const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        // ========================================
        // CONVERSATION
        // ========================================

        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },

        // ========================================
        // SENDER
        // ========================================

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // ========================================
        // REPLY TO
        // ========================================

        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },

        // ========================================
        // MESSAGE TYPE
        // ========================================

        messageType: {
            type: String,
            enum: [
                "text",
                "image",
                "file",
                "audio",
            ],
            default: "text",
        },

        // ========================================
        // TEXT MESSAGE
        // ========================================

        text: {
            type: String,
            default: "",
            trim: true,
        },

        // ========================================
        // IMAGE MESSAGE
        // ========================================

        imageUrl: {
            type: String,
            default: null,
        },

        // ========================================
        // FILE MESSAGE
        // ========================================

        fileUrl: {
            type: String,
            default: null,
        },

        fileName: {
            type: String,
            default: null,
        },

        fileSize: {
            type: Number,
            default: null,
        },

        // ========================================
        // AUDIO MESSAGE
        // ========================================

        audioUrl: {
            type: String,
            default: null,
        },

        audioDuration: {
            type: Number,
            default: null,
        },

        // ========================================
        // DELETE MESSAGE
        // ========================================

        deleted: {
            type: Boolean,
            default: false,
        },

        deletedAt: {
            type: Date,
            default: null,
        },

        // ========================================
        // PIN MESSAGE
        // ========================================

        pinned: {
            type: Boolean,
            default: false,
        },

        pinnedAt: {
            type: Date,
            default: null,
        },

        pinnedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // ========================================
        // FORWARDED MESSAGE
        // ========================================

        forwarded: {
            type: Boolean,
            default: false,
        },

        forwardedFrom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },

        forwardedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // ========================================
        // DELIVERY STATUS
        // ========================================

        delivered: {
            type: Boolean,
            default: false,
        },

        deliveredAt: {
            type: Date,
            default: null,
        },

        // ========================================
        // READ STATUS
        // ========================================

        read: {
            type: Boolean,
            default: false,
        },

        readAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Message = mongoose.model(
    "Message",
    messageSchema
);

module.exports = Message;