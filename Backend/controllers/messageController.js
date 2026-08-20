const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const fs = require("fs");

// ========================================
// HELPER: DELETE UPLOADED FILE
// ========================================

const deleteUploadedFile = (filePath) => {
    if (!filePath) {
        return;
    }

    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);

            console.log(
                "Uploaded file deleted:",
                filePath
            );
        }
    } catch (error) {
        console.error(
            "Could not delete uploaded file:",
            error
        );
    }
};

// ========================================
// HELPER: CHECK CONVERSATION PARTICIPANT
// ========================================

const checkParticipant = (
    conversation,
    userId
) => {
    if (!conversation || !userId) {
        return false;
    }

    return conversation.participants.some(
        (participant) =>
            participant.toString() ===
            userId.toString()
    );
};

// ========================================
// HELPER: VALIDATE REPLY MESSAGE
// ========================================

const validateReplyMessage = async (
    replyTo,
    conversationId
) => {
    if (!replyTo) {
        return null;
    }

    const originalMessage =
        await Message.findById(replyTo);

    if (!originalMessage) {
        throw new Error(
            "The message you are trying to reply to does not exist."
        );
    }

    if (
        originalMessage.conversationId.toString() !==
        conversationId.toString()
    ) {
        throw new Error(
            "You cannot reply to a message from another conversation."
        );
    }

    return originalMessage._id;
};

// ========================================
// HELPER: POPULATE MESSAGE
// ========================================

const populateMessage = async (
    messageId
) => {
    return await Message.findById(
        messageId
    )
        .populate(
            "sender",
            "username email profilePicture bio"
        )
        .populate({
            path: "replyTo",

            populate: {
                path: "sender",

                select:
                    "username email profilePicture bio",
            },
        })
        .populate(
            "pinnedBy",
            "username email profilePicture"
        )
        .populate(
            "forwardedBy",
            "username email profilePicture"
        );
};

// ========================================
// SEND TEXT MESSAGE
// ========================================

const sendMessage = async (
    req,
    res
) => {
    try {
        const {
            conversationId,
            text,
            replyTo,
        } = req.body;

        const senderId = req.userId;

        // ====================================
        // VALIDATION
        // ====================================

        if (!conversationId) {
            return res.status(400).json({
                success: false,
                message:
                    "Conversation ID is required.",
            });
        }

        if (
            !text ||
            typeof text !== "string" ||
            !text.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Message text is required.",
            });
        }

        if (!senderId) {
            return res.status(401).json({
                success: false,
                message:
                    "User authentication required.",
            });
        }

        // ====================================
        // FIND CONVERSATION
        // ====================================

        const conversation =
            await Conversation.findById(
                conversationId
            );

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message:
                    "Conversation not found.",
            });
        }

        // ====================================
        // CHECK PARTICIPANT
        // ====================================

        if (
            !checkParticipant(
                conversation,
                senderId
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not part of this conversation.",
            });
        }

        // ====================================
        // VALIDATE REPLY
        // ====================================

        let validReplyTo = null;

        try {
            validReplyTo =
                await validateReplyMessage(
                    replyTo,
                    conversationId
                );
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        // ====================================
        // CREATE TEXT MESSAGE
        // ====================================

        const message =
            await Message.create({
                conversationId,
                sender: senderId,

                messageType: "text",

                text: text.trim(),

                imageUrl: null,

                fileUrl: null,

                fileName: null,

                fileSize: null,

                audioUrl: null,

                audioDuration: null,

                replyTo: validReplyTo,

                deleted: false,

                deletedAt: null,

                pinned: false,

                pinnedAt: null,

                pinnedBy: null,

                forwarded: false,

                forwardedFrom: null,

                forwardedBy: null,

                delivered: false,

                deliveredAt: null,

                read: false,

                readAt: null,
            });

        // ====================================
        // UPDATE LAST MESSAGE
        // ====================================

        conversation.lastMessage =
            message._id;

        await conversation.save();

        // ====================================
        // POPULATE
        // ====================================

        const populatedMessage =
            await populateMessage(
                message._id
            );

        // ====================================
        // SOCKET.IO
        // ====================================

        const io =
            req.app.get("io");

        if (io) {
            io.to(
                conversationId.toString()
            ).emit(
                "receiveMessage",
                populatedMessage
            );
        }

        // ====================================
        // RESPONSE
        // ====================================

        return res.status(201).json({
            success: true,

            message:
                "Message sent successfully.",

            data: populatedMessage,
        });
    } catch (error) {
        console.error(
            "Send text message error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Server error while sending message.",
        });
    }
};

// ========================================
// SEND IMAGE MESSAGE
// ========================================

const sendImageMessage = async (
    req,
    res
) => {
    try {
        const {
            conversationId,
            replyTo,
        } = req.body;

        const senderId = req.userId;

        // ====================================
        // CHECK CONVERSATION
        // ====================================

        if (!conversationId) {
            deleteUploadedFile(
                req.file?.path
            );

            return res.status(400).json({
                success: false,
                message:
                    "Conversation ID is required.",
            });
        }

        // ====================================
        // CHECK AUTH
        // ====================================

        if (!senderId) {
            deleteUploadedFile(
                req.file?.path
            );

            return res.status(401).json({
                success: false,
                message:
                    "User authentication required.",
            });
        }

        // ====================================
        // CHECK IMAGE
        // ====================================

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message:
                    "Please select an image.",
            });
        }

        // ====================================
        // CHECK MIME TYPE
        // ====================================

        if (
            !req.file.mimetype.startsWith(
                "image/"
            )
        ) {
            deleteUploadedFile(
                req.file.path
            );

            return res.status(400).json({
                success: false,
                message:
                    "Only image files are allowed.",
            });
        }

        // ====================================
        // FIND CONVERSATION
        // ====================================

        const conversation =
            await Conversation.findById(
                conversationId
            );

        if (!conversation) {
            deleteUploadedFile(
                req.file.path
            );

            return res.status(404).json({
                success: false,
                message:
                    "Conversation not found.",
            });
        }

        // ====================================
        // CHECK PARTICIPANT
        // ====================================

        if (
            !checkParticipant(
                conversation,
                senderId
            )
        ) {
            deleteUploadedFile(
                req.file.path
            );

            return res.status(403).json({
                success: false,
                message:
                    "You are not part of this conversation.",
            });
        }

        // ====================================
        // VALIDATE REPLY
        // ====================================

        let validReplyTo = null;

        try {
            validReplyTo =
                await validateReplyMessage(
                    replyTo,
                    conversationId
                );
        } catch (error) {
            deleteUploadedFile(
                req.file.path
            );

            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        // ====================================
        // IMAGE URL
        // ====================================

        const imageUrl =
            `/uploads/files/${req.file.filename}`;

        // ====================================
        // CREATE IMAGE MESSAGE
        // ====================================

        const message =
            await Message.create({
                conversationId,
                sender: senderId,

                messageType: "image",

                text: "",

                imageUrl,

                fileUrl: null,

                fileName: null,

                fileSize: null,

                audioUrl: null,

                audioDuration: null,

                replyTo: validReplyTo,

                deleted: false,

                deletedAt: null,

                pinned: false,

                pinnedAt: null,

                pinnedBy: null,

                forwarded: false,

                forwardedFrom: null,

                forwardedBy: null,

                delivered: false,

                deliveredAt: null,

                read: false,

                readAt: null,
            });

        // ====================================
        // UPDATE LAST MESSAGE
        // ====================================

        conversation.lastMessage =
            message._id;

        await conversation.save();

        // ====================================
        // POPULATE
        // ====================================

        const populatedMessage =
            await populateMessage(
                message._id
            );

        // ====================================
        // SOCKET.IO
        // ====================================

        const io =
            req.app.get("io");

        if (io) {
            io.to(
                conversationId.toString()
            ).emit(
                "receiveMessage",
                populatedMessage
            );
        }

        // ====================================
        // RESPONSE
        // ====================================

        return res.status(201).json({
            success: true,

            message:
                "Image sent successfully.",

            data: populatedMessage,
        });
    } catch (error) {
        console.error(
            "Send image message error:",
            error
        );

        deleteUploadedFile(
            req.file?.path
        );

        return res.status(500).json({
            success: false,

            message:
                "Server error while sending image.",
        });
    }
};

// ========================================
// SEND FILE MESSAGE
// ========================================

const sendFileMessage = async (
    req,
    res
) => {
    try {
        const {
            conversationId,
            replyTo,
        } = req.body;

        const senderId = req.userId;

        // ====================================
        // VALIDATION
        // ====================================

        if (!conversationId) {
            deleteUploadedFile(
                req.file?.path
            );

            return res.status(400).json({
                success: false,
                message:
                    "Conversation ID is required.",
            });
        }

        if (!senderId) {
            deleteUploadedFile(
                req.file?.path
            );

            return res.status(401).json({
                success: false,
                message:
                    "User authentication required.",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message:
                    "Please select a file.",
            });
        }

        // ====================================
        // FIND CONVERSATION
        // ====================================

        const conversation =
            await Conversation.findById(
                conversationId
            );

        if (!conversation) {
            deleteUploadedFile(
                req.file.path
            );

            return res.status(404).json({
                success: false,
                message:
                    "Conversation not found.",
            });
        }

        // ====================================
        // CHECK PARTICIPANT
        // ====================================

        if (
            !checkParticipant(
                conversation,
                senderId
            )
        ) {
            deleteUploadedFile(
                req.file.path
            );

            return res.status(403).json({
                success: false,
                message:
                    "You are not part of this conversation.",
            });
        }

        // ====================================
        // VALIDATE REPLY
        // ====================================

        let validReplyTo = null;

        try {
            validReplyTo =
                await validateReplyMessage(
                    replyTo,
                    conversationId
                );
        } catch (error) {
            deleteUploadedFile(
                req.file.path
            );

            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        // ====================================
        // FILE URL
        // ====================================

        const fileUrl =
            `/uploads/files/${req.file.filename}`;

        // ====================================
        // CREATE FILE MESSAGE
        // ====================================

        const message =
            await Message.create({
                conversationId,
                sender: senderId,

                messageType: "file",

                text: "",

                imageUrl: null,

                fileUrl,

                fileName:
                    req.file.originalname,

                fileSize:
                    req.file.size,

                audioUrl: null,

                audioDuration: null,

                replyTo: validReplyTo,

                deleted: false,

                deletedAt: null,

                pinned: false,

                pinnedAt: null,

                pinnedBy: null,

                forwarded: false,

                forwardedFrom: null,

                forwardedBy: null,

                delivered: false,

                deliveredAt: null,

                read: false,

                readAt: null,
            });

        // ====================================
        // UPDATE LAST MESSAGE
        // ====================================

        conversation.lastMessage =
            message._id;

        await conversation.save();

        // ====================================
        // POPULATE
        // ====================================

        const populatedMessage =
            await populateMessage(
                message._id
            );

        // ====================================
        // SOCKET.IO
        // ====================================

        const io =
            req.app.get("io");

        if (io) {
            io.to(
                conversationId.toString()
            ).emit(
                "receiveMessage",
                populatedMessage
            );
        }

        // ====================================
        // RESPONSE
        // ====================================

        return res.status(201).json({
            success: true,

            message:
                "File sent successfully.",

            data: populatedMessage,
        });
    } catch (error) {
        console.error(
            "Send file message error:",
            error
        );

        deleteUploadedFile(
            req.file?.path
        );

        return res.status(500).json({
            success: false,

            message:
                "Server error while sending file.",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined,
        });
    }
};

// ========================================
// SEND AUDIO MESSAGE
// ========================================

const sendAudioMessage = async (
    req,
    res
) => {
    try {
        const {
            conversationId,
            replyTo,
            audioDuration,
        } = req.body;

        const senderId = req.userId;

        console.log(
            "========================================"
        );

        console.log(
            "SEND AUDIO MESSAGE"
        );

        console.log(
            "Conversation ID:",
            conversationId
        );

        console.log(
            "User ID:",
            senderId
        );

        if (req.file) {
            console.log(
                "Audio file:",
                req.file.originalname
            );

            console.log(
                "Audio MIME:",
                req.file.mimetype
            );

            console.log(
                "Audio size:",
                req.file.size
            );
        }

        console.log(
            "Audio duration:",
            audioDuration
        );

        console.log(
            "========================================"
        );

        // ====================================
        // CHECK CONVERSATION ID
        // ====================================

        if (!conversationId) {
            deleteUploadedFile(
                req.file?.path
            );

            return res.status(400).json({
                success: false,
                message:
                    "Conversation ID is required.",
            });
        }

        // ====================================
        // CHECK AUTHENTICATION
        // ====================================

        if (!senderId) {
            deleteUploadedFile(
                req.file?.path
            );

            return res.status(401).json({
                success: false,
                message:
                    "User authentication required.",
            });
        }

        // ====================================
        // CHECK AUDIO FILE
        // ====================================

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message:
                    "Audio recording is required.",
            });
        }

        // ====================================
        // CHECK AUDIO MIME TYPE
        // ====================================

        if (
            !req.file.mimetype.startsWith(
                "audio/"
            )
        ) {
            deleteUploadedFile(
                req.file.path
            );

            return res.status(400).json({
                success: false,
                message:
                    "Only audio files are allowed.",
            });
        }

        // ====================================
        // FIND CONVERSATION
        // ====================================

        const conversation =
            await Conversation.findById(
                conversationId
            );

        if (!conversation) {
            deleteUploadedFile(
                req.file.path
            );

            return res.status(404).json({
                success: false,
                message:
                    "Conversation not found.",
            });
        }

        // ====================================
        // CHECK PARTICIPANT
        // ====================================

        if (
            !checkParticipant(
                conversation,
                senderId
            )
        ) {
            deleteUploadedFile(
                req.file.path
            );

            return res.status(403).json({
                success: false,
                message:
                    "You are not part of this conversation.",
            });
        }

        // ====================================
        // VALIDATE REPLY
        // ====================================

        let validReplyTo = null;

        try {
            validReplyTo =
                await validateReplyMessage(
                    replyTo,
                    conversationId
                );
        } catch (error) {
            deleteUploadedFile(
                req.file.path
            );

            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        // ====================================
        // AUDIO URL
        // ====================================

        const audioUrl =
            `/uploads/files/${req.file.filename}`;

        // ====================================
        // AUDIO DURATION
        // ====================================

        let duration = Number(
            audioDuration
        );

        if (
            !Number.isFinite(duration) ||
            duration < 0
        ) {
            duration = 0;
        }

        // ====================================
        // CREATE AUDIO MESSAGE
        // ====================================

        const message =
            await Message.create({
                conversationId,

                sender: senderId,

                messageType: "audio",

                text: "",

                imageUrl: null,

                fileUrl: null,

                fileName: null,

                fileSize: null,

                audioUrl,

                audioDuration:
                    duration,

                replyTo: validReplyTo,

                deleted: false,

                deletedAt: null,

                pinned: false,

                pinnedAt: null,

                pinnedBy: null,

                forwarded: false,

                forwardedFrom: null,

                forwardedBy: null,

                delivered: false,

                deliveredAt: null,

                read: false,

                readAt: null,
            });

        console.log(
            "Audio message saved:",
            message._id.toString()
        );

        // ====================================
        // UPDATE LAST MESSAGE
        // ====================================

        conversation.lastMessage =
            message._id;

        await conversation.save();

        // ====================================
        // POPULATE MESSAGE
        // ====================================

        const populatedMessage =
            await populateMessage(
                message._id
            );

        // ====================================
        // SOCKET.IO
        // ====================================

        const io =
            req.app.get("io");

        if (io) {
            io.to(
                conversationId.toString()
            ).emit(
                "receiveMessage",
                populatedMessage
            );

            console.log(
                "Audio message emitted:",
                message._id.toString()
            );
        }

        // ====================================
        // RESPONSE
        // ====================================

        return res.status(201).json({
            success: true,

            message:
                "Voice message sent successfully.",

            data: populatedMessage,
        });
    } catch (error) {
        console.error(
            "Send audio message error:",
            error
        );

        deleteUploadedFile(
            req.file?.path
        );

        return res.status(500).json({
            success: false,

            message:
                "Server error while sending audio message.",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined,
        });
    }
};

// ========================================
// GET MESSAGES
// ========================================

const getMessages = async (
    req,
    res
) => {
    try {
        const {
            conversationId,
        } = req.params;

        const userId = req.userId;

        // ====================================
        // VALIDATION
        // ====================================

        if (!conversationId) {
            return res.status(400).json({
                success: false,
                message:
                    "Conversation ID is required.",
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "User authentication required.",
            });
        }

        // ====================================
        // FIND CONVERSATION
        // ====================================

        const conversation =
            await Conversation.findById(
                conversationId
            );

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message:
                    "Conversation not found.",
            });
        }

        // ====================================
        // CHECK PARTICIPANT
        // ====================================

        if (
            !checkParticipant(
                conversation,
                userId
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not part of this conversation.",
            });
        }

        // ====================================
        // GET MESSAGES
        // ====================================

        const messages =
            await Message.find({
                conversationId,
            })
                .populate(
                    "sender",
                    "username email profilePicture bio"
                )
                .populate({
                    path: "replyTo",

                    populate: {
                        path: "sender",

                        select:
                            "username email profilePicture bio",
                    },
                })
                .populate(
                    "pinnedBy",
                    "username email profilePicture"
                )
                .populate(
                    "forwardedBy",
                    "username email profilePicture"
                )
                .sort({
                    createdAt: 1,
                });

        // ====================================
        // RESPONSE
        // ====================================

        return res.status(200).json({
            success: true,

            messages,
        });
    } catch (error) {
        console.error(
            "Get messages error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Server error while getting messages.",
        });
    }
};

// ========================================
// EXPORT
// ========================================

module.exports = {
    sendMessage,
    sendImageMessage,
    sendFileMessage,
    sendAudioMessage,
    getMessages,
};