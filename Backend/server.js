const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const dns = require("dns");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { Server } = require("socket.io");

dotenv.config();

// ========================================
// MONGODB ATLAS DNS
// ========================================

dns.setServers([
    "8.8.8.8",
    "1.1.1.1",
]);

// ========================================
// ROUTES
// ========================================

const authRoutes = require("./routes/authRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");

// ========================================
// MIDDLEWARE
// ========================================

const protect = require("./middleware/authMiddleware");

// ========================================
// MODELS
// ========================================

const Message = require("./models/Message");
const Conversation = require("./models/Conversation");
const User = require("./models/User");

// ========================================
// EXPRESS + HTTP SERVER
// ========================================

const app = express();
const server = http.createServer(app);

// ========================================
// FRONTEND URL
// ========================================

const FRONTEND_URL =
    "http://localhost:5174";

// ========================================
// CORS
// ========================================

app.use(
    cors({
        origin: FRONTEND_URL,

        credentials: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],
    })
);

// ========================================
// BODY PARSERS
// ========================================

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true,
    })
);

// ========================================
// UPLOAD DIRECTORIES
// ========================================

const uploadsDirectory =
    path.join(
        __dirname,
        "uploads"
    );

const filesDirectory =
    path.join(
        uploadsDirectory,
        "files"
    );

// ========================================
// CREATE UPLOAD DIRECTORIES
// ========================================

if (
    !fs.existsSync(
        uploadsDirectory
    )
) {
    fs.mkdirSync(
        uploadsDirectory,
        {
            recursive: true,
        }
    );
}

if (
    !fs.existsSync(
        filesDirectory
    )
) {
    fs.mkdirSync(
        filesDirectory,
        {
            recursive: true,
        }
    );
}

// ========================================
// SERVE UPLOADED FILES
// ========================================

app.use(
    "/uploads",
    express.static(
        uploadsDirectory
    )
);

// ========================================
// API ROUTES
// ========================================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/conversations",
    conversationRoutes
);

app.use(
    "/api/messages",
    messageRoutes
);

app.use(
    "/api/users",
    userRoutes
);

// ========================================
// PROTECTED FILE DOWNLOAD
// ========================================

app.get(
    "/api/files/download/:filename",
    protect,
    (req, res) => {
        try {
            const {
                filename,
            } = req.params;

            if (!filename) {
                return res.status(400).json({
                    success: false,

                    message:
                        "Filename is required.",
                });
            }

            // --------------------------------
            // SECURITY
            // --------------------------------

            const safeFilename =
                path.basename(
                    filename
                );

            const filePath =
                path.join(
                    filesDirectory,
                    safeFilename
                );

            console.log(
                "Download requested:",
                safeFilename
            );

            console.log(
                "Download path:",
                filePath
            );

            // --------------------------------
            // CHECK FILE
            // --------------------------------

            if (
                !fs.existsSync(
                    filePath
                )
            ) {
                return res.status(404).json({
                    success: false,

                    message:
                        "File not found.",
                });
            }

            // --------------------------------
            // DOWNLOAD
            // --------------------------------

            return res.download(
                filePath,
                safeFilename,
                (error) => {
                    if (error) {
                        console.error(
                            "File download error:",
                            error
                        );

                        if (
                            !res.headersSent
                        ) {
                            return res
                                .status(500)
                                .json({
                                    success:
                                        false,

                                    message:
                                        "Unable to download file.",
                                });
                        }
                    }
                }
            );
        } catch (error) {
            console.error(
                "Download route error:",
                error
            );

            if (
                !res.headersSent
            ) {
                return res.status(500).json({
                    success: false,

                    message:
                        "Server error while downloading file.",
                });
            }
        }
    }
);

// ========================================
// TEST ROUTE
// ========================================

app.get(
    "/",
    (req, res) => {
        return res.status(200).json({
            success: true,

            message:
                "Chit Chat server is running",
        });
    }
);

// ========================================
// SOCKET.IO
// ========================================

const io = new Server(
    server,
    {
        cors: {
            origin:
                FRONTEND_URL,

            credentials:
                true,

            methods: [
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
            ],
        },
    }
);

// ========================================
// MAKE IO AVAILABLE TO CONTROLLERS
// ========================================

app.set(
    "io",
    io
);

// ========================================
// ONLINE USERS
//
// userId -> Set(socketId)
// ========================================

const onlineUsers =
    new Map();

// ========================================
// ONLINE USER IDS
// ========================================

const getOnlineUserIds =
    () => {
        return Array.from(
            onlineUsers.keys()
        );
    };

// ========================================
// EMIT TO SPECIFIC USER
// ========================================

const emitToUser = (
    userId,
    event,
    data
) => {
    if (!userId) {
        return;
    }

    const sockets =
        onlineUsers.get(
            userId.toString()
        );

    if (!sockets) {
        return;
    }

    sockets.forEach(
        (socketId) => {
            io.to(
                socketId
            ).emit(
                event,
                data
            );
        }
    );
};

// ========================================
// CHECK CONVERSATION PARTICIPANT
// ========================================

const isConversationParticipant =
    (
        conversation,
        userId
    ) => {
        if (
            !conversation ||
            !userId
        ) {
            return false;
        }

        return conversation.participants.some(
            (
                participantId
            ) =>
                participantId.toString() ===
                userId.toString()
        );
    };

// ========================================
// DELETE PHYSICAL UPLOADED FILE
// ========================================

const deleteUploadedFile =
    (
        fileUrl
    ) => {
        if (!fileUrl) {
            return;
        }

        try {
            // --------------------------------
            // ONLY OUR UPLOADS
            // --------------------------------

            if (
                !fileUrl.startsWith(
                    "/uploads/"
                )
            ) {
                return;
            }

            // --------------------------------
            // REMOVE /uploads/
            // --------------------------------

            const relativePath =
                fileUrl.replace(
                    /^\/uploads[\\/]/,
                    ""
                );

            // --------------------------------
            // BUILD ABSOLUTE PATH
            // --------------------------------

            const filePath =
                path.resolve(
                    uploadsDirectory,
                    relativePath
                );

            const uploadsRoot =
                path.resolve(
                    uploadsDirectory
                );

            // --------------------------------
            // SECURITY
            // --------------------------------

            if (
                !filePath.startsWith(
                    uploadsRoot +
                        path.sep
                )
            ) {
                console.error(
                    "Blocked unsafe file deletion:",
                    filePath
                );

                return;
            }

            // --------------------------------
            // DELETE
            // --------------------------------

            if (
                fs.existsSync(
                    filePath
                )
            ) {
                fs.unlinkSync(
                    filePath
                );

                console.log(
                    "Uploaded file deleted:",
                    filePath
                );
            } else {
                console.log(
                    "Uploaded file already missing:",
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
// COPY UPLOADED FILE FOR FORWARDING
// ========================================

const copyUploadedFile =
    (
        fileUrl
    ) => {
        if (!fileUrl) {
            return null;
        }

        // External URL
        if (
            !fileUrl.startsWith(
                "/uploads/"
            )
        ) {
            return fileUrl;
        }

        try {
            // --------------------------------
            // REMOVE /uploads/
            // --------------------------------

            const relativePath =
                fileUrl.replace(
                    /^\/uploads[\\/]/,
                    ""
                );

            // --------------------------------
            // SOURCE
            // --------------------------------

            const sourcePath =
                path.resolve(
                    uploadsDirectory,
                    relativePath
                );

            const uploadsRoot =
                path.resolve(
                    uploadsDirectory
                );

            // --------------------------------
            // SECURITY
            // --------------------------------

            if (
                !sourcePath.startsWith(
                    uploadsRoot +
                        path.sep
                )
            ) {
                return null;
            }

            // --------------------------------
            // CHECK
            // --------------------------------

            if (
                !fs.existsSync(
                    sourcePath
                )
            ) {
                console.error(
                    "Forward source file not found:",
                    sourcePath
                );

                return null;
            }

            // --------------------------------
            // CREATE NEW NAME
            // --------------------------------

            const originalName =
                path.basename(
                    sourcePath
                );

            const extension =
                path.extname(
                    originalName
                );

            const baseName =
                path.basename(
                    originalName,
                    extension
                );

            const newName =
                `${baseName}-forwarded-${Date.now()}-${Math.round(
                    Math.random() * 1000000000
                )}${extension}`;

            // --------------------------------
            // DESTINATION
            // --------------------------------

            const destinationPath =
                path.join(
                    filesDirectory,
                    newName
                );

            // --------------------------------
            // COPY
            // --------------------------------

            fs.copyFileSync(
                sourcePath,
                destinationPath
            );

            console.log(
                "Forwarded file copied:",
                destinationPath
            );

            return `/uploads/files/${newName}`;
        } catch (error) {
            console.error(
                "Could not copy forwarded file:",
                error
            );

            return null;
        }
    };

// ========================================
// POPULATE MESSAGE
// ========================================

const populateMessage =
    async (
        messageId
    ) => {
        return await Message.findById(
            messageId
        )
            .populate(
                "sender",
                "username email profilePicture bio"
            )
            .populate(
                "pinnedBy",
                "username email profilePicture bio"
            )
            .populate(
                "forwardedBy",
                "username email profilePicture bio"
            )
            .populate({
                path: "replyTo",

                select:
                    "text messageType imageUrl fileUrl fileName fileSize audioUrl audioDuration sender createdAt deleted pinned pinnedAt",

                populate: {
                    path: "sender",

                    select:
                        "username email profilePicture bio",
                },
            });
    };

// ========================================
// SOCKET CONNECTION
// ========================================

io.on(
    "connection",
    (socket) => {
        console.log(
            "Socket connected:",
            socket.id
        );

        // ====================================
        // AUTHENTICATE
        // ====================================

        socket.on(
            "authenticate",
            async (
                userId
            ) => {
                try {
                    if (
                        !userId
                    ) {
                        return;
                    }

                    const id =
                        userId.toString();

                    socket.userId =
                        id;

                    if (
                        !onlineUsers.has(
                            id
                        )
                    ) {
                        onlineUsers.set(
                            id,
                            new Set()
                        );
                    }

                    onlineUsers
                        .get(id)
                        .add(
                            socket.id
                        );

                    await User.findByIdAndUpdate(
                        id,
                        {
                            isOnline:
                                true,

                            lastSeen:
                                null,
                        }
                    );

                    socket.emit(
                        "onlineUsers",
                        getOnlineUserIds()
                    );

                    io.emit(
                        "userOnline",
                        {
                            userId:
                                id,
                        }
                    );

                    console.log(
                        "User authenticated:",
                        id
                    );
                } catch (error) {
                    console.error(
                        "Socket authentication error:",
                        error
                    );
                }
            }
        );

        // ====================================
        // PROFILE UPDATED
        // ====================================

        socket.on(
            "profileUpdated",
            (
                updatedUser
            ) => {
                try {
                    if (
                        !updatedUser ||
                        !updatedUser._id
                    ) {
                        return;
                    }

                    io.emit(
                        "profileUpdated",
                        {
                            user:
                                updatedUser,
                        }
                    );
                } catch (error) {
                    console.error(
                        "Profile update socket error:",
                        error
                    );
                }
            }
        );

        // ====================================
        // JOIN CONVERSATION
        // ====================================

        socket.on(
            "joinConversation",
            (
                conversationId
            ) => {
                try {
                    if (
                        !conversationId
                    ) {
                        return;
                    }

                    const room =
                        conversationId.toString();

                    socket.join(
                        room
                    );

                    console.log(
                        "User joined conversation:",
                        socket.userId ||
                            "unknown",
                        room
                    );
                } catch (error) {
                    console.error(
                        "Join conversation error:",
                        error
                    );
                }
            }
        );

        // ====================================
        // TYPING
        // ====================================

        socket.on(
            "typing",
            ({
                conversationId,
                username,
            } = {}) => {
                try {
                    if (
                        !conversationId ||
                        !socket.userId
                    ) {
                        return;
                    }

                    socket
                        .to(
                            conversationId.toString()
                        )
                        .emit(
                            "userTyping",
                            {
                                userId:
                                    socket.userId,

                                username:
                                    username ||
                                    "Someone",
                            }
                        );
                } catch (error) {
                    console.error(
                        "Typing error:",
                        error
                    );
                }
            }
        );

        // ====================================
        // STOP TYPING
        // ====================================

        socket.on(
            "stopTyping",
            ({
                conversationId,
            } = {}) => {
                try {
                    if (
                        !conversationId ||
                        !socket.userId
                    ) {
                        return;
                    }

                    socket
                        .to(
                            conversationId.toString()
                        )
                        .emit(
                            "userStoppedTyping",
                            {
                                userId:
                                    socket.userId,
                            }
                        );
                } catch (error) {
                    console.error(
                        "Stop typing error:",
                        error
                    );
                }
            }
        );

        // ====================================
        // SEND TEXT MESSAGE
        // ====================================

        socket.on(
            "sendMessage",
            async ({
                conversationId,
                message,
                replyTo =
                    null,
            } = {}) => {
                try {
                    if (
                        !conversationId ||
                        !message ||
                        typeof message !==
                            "string" ||
                        !message.trim() ||
                        !socket.userId
                    ) {
                        return;
                    }

                    const conversation =
                        await Conversation.findById(
                            conversationId
                        );

                    if (
                        !conversation
                    ) {
                        return;
                    }

                    if (
                        !isConversationParticipant(
                            conversation,
                            socket.userId
                        )
                    ) {
                        return;
                    }

                    // ----------------------------
                    // REPLY VALIDATION
                    // ----------------------------

                    let replyMessageId =
                        null;

                    if (
                        replyTo
                    ) {
                        const originalMessage =
                            await Message.findById(
                                replyTo
                            );

                        if (
                            !originalMessage
                        ) {
                            return;
                        }

                        if (
                            originalMessage
                                .conversationId
                                .toString() !==
                            conversationId.toString()
                        ) {
                            return;
                        }

                        if (
                            originalMessage.deleted
                        ) {
                            return;
                        }

                        replyMessageId =
                            originalMessage._id;
                    }

                    // ----------------------------
                    // CREATE
                    // ----------------------------

                    const newMessage =
                        await Message.create({
                            conversationId,

                            sender:
                                socket.userId,

                            replyTo:
                                replyMessageId,

                            messageType:
                                "text",

                            text:
                                message.trim(),

                            imageUrl:
                                null,

                            fileUrl:
                                null,

                            fileName:
                                null,

                            fileSize:
                                null,

                            audioUrl:
                                null,

                            audioDuration:
                                null,

                            deleted:
                                false,

                            deletedAt:
                                null,

                            pinned:
                                false,

                            pinnedAt:
                                null,

                            pinnedBy:
                                null,

                            forwarded:
                                false,

                            forwardedFrom:
                                null,

                            forwardedBy:
                                null,

                            delivered:
                                false,

                            deliveredAt:
                                null,

                            read:
                                false,

                            readAt:
                                null,
                        });

                    // ----------------------------
                    // LAST MESSAGE
                    // ----------------------------

                    conversation.lastMessage =
                        newMessage._id;

                    await conversation.save();

                    // ----------------------------
                    // POPULATE
                    // ----------------------------

                    let populatedMessage =
                        await populateMessage(
                            newMessage._id
                        );

                    const room =
                        conversationId.toString();

                    // ----------------------------
                    // ROOM
                    // ----------------------------

                    io.to(
                        room
                    ).emit(
                        "receiveMessage",
                        populatedMessage
                    );

                    // ----------------------------
                    // RECIPIENTS
                    // ----------------------------

                    const recipientIds =
                        conversation.participants
                            .map(
                                (
                                    id
                                ) =>
                                    id.toString()
                            )
                            .filter(
                                (
                                    id
                                ) =>
                                    id !==
                                    socket.userId
                            );

                    // ----------------------------
                    // DELIVERY
                    // ----------------------------

                    const recipientOnline =
                        recipientIds.some(
                            (
                                id
                            ) =>
                                onlineUsers.has(
                                    id
                                )
                        );

                    if (
                        recipientOnline
                    ) {
                        const deliveredAt =
                            new Date();

                        await Message.findByIdAndUpdate(
                            newMessage._id,
                            {
                                delivered:
                                    true,

                                deliveredAt,
                            }
                        );

                        populatedMessage =
                            await populateMessage(
                                newMessage._id
                            );

                        io.to(
                            room
                        ).emit(
                            "messageDelivered",
                            {
                                messageId:
                                    newMessage._id.toString(),

                                conversationId:
                                    room,

                                deliveredAt,
                            }
                        );
                    }

                    // ----------------------------
                    // NOTIFICATION
                    // ----------------------------

                    recipientIds.forEach(
                        (
                            recipientId
                        ) => {
                            emitToUser(
                                recipientId,
                                "newMessageNotification",
                                populatedMessage
                            );
                        }
                    );

                    // ----------------------------
                    // STOP TYPING
                    // ----------------------------

                    io.to(
                        room
                    ).emit(
                        "userStoppedTyping",
                        {
                            userId:
                                socket.userId,
                        }
                    );

                    console.log(
                        "Text message sent:",
                        newMessage._id.toString()
                    );
                } catch (error) {
                    console.error(
                        "Send message error:",
                        error
                    );
                }
            }
        );

        // ====================================
        // DELETE MESSAGE
        // ====================================

        socket.on(
            "deleteMessage",
            async ({
                messageId,
                conversationId,
            } = {}) => {
                try {
                    if (
                        !messageId ||
                        !conversationId ||
                        !socket.userId
                    ) {
                        return;
                    }

                    if (
                        !mongoose.Types.ObjectId.isValid(
                            messageId
                        ) ||
                        !mongoose.Types.ObjectId.isValid(
                            conversationId
                        )
                    ) {
                        return;
                    }

                    const message =
                        await Message.findById(
                            messageId
                        );

                    if (
                        !message
                    ) {
                        return;
                    }

                    if (
                        message.conversationId.toString() !==
                        conversationId.toString()
                    ) {
                        return;
                    }

                    if (
                        message.sender.toString() !==
                        socket.userId.toString()
                    ) {
                        return;
                    }

                    const conversation =
                        await Conversation.findById(
                            conversationId
                        );

                    if (
                        !conversation
                    ) {
                        return;
                    }

                    if (
                        !isConversationParticipant(
                            conversation,
                            socket.userId
                        )
                    ) {
                        return;
                    }

                    // ----------------------------
                    // DELETE MEDIA
                    // ----------------------------

                    if (
                        message.fileUrl
                    ) {
                        deleteUploadedFile(
                            message.fileUrl
                        );
                    }

                    if (
                        message.imageUrl
                    ) {
                        deleteUploadedFile(
                            message.imageUrl
                        );
                    }

                    // IMPORTANT:
                    // AUDIO WAS MISSING BEFORE
                    // ----------------------------

                    if (
                        message.audioUrl
                    ) {
                        deleteUploadedFile(
                            message.audioUrl
                        );
                    }

                    // ----------------------------
                    // SOFT DELETE
                    // ----------------------------

                    message.deleted =
                        true;

                    message.deletedAt =
                        new Date();

                    message.text =
                        "";

                    message.imageUrl =
                        null;

                    message.fileUrl =
                        null;

                    message.fileName =
                        null;

                    message.fileSize =
                        null;

                    message.audioUrl =
                        null;

                    message.audioDuration =
                        null;

                    message.pinned =
                        false;

                    message.pinnedAt =
                        null;

                    message.pinnedBy =
                        null;

                    await message.save();

                    // ----------------------------
                    // LAST MESSAGE
                    // ----------------------------

                    if (
                        conversation.lastMessage &&
                        conversation.lastMessage.toString() ===
                            messageId.toString()
                    ) {
                        const previousMessage =
                            await Message.findOne(
                                {
                                    conversationId,

                                    deleted:
                                        false,
                                }
                            )
                                .sort({
                                    createdAt:
                                        -1,
                                })
                                .select(
                                    "_id"
                                );

                        conversation.lastMessage =
                            previousMessage
                                ? previousMessage._id
                                : null;

                        await conversation.save();
                    }

                    // ----------------------------
                    // SOCKET
                    // ----------------------------

                    io.to(
                        conversationId.toString()
                    ).emit(
                        "messageDeleted",
                        {
                            messageId:
                                messageId.toString(),

                            conversationId:
                                conversationId.toString(),

                            deletedBy:
                                socket.userId,

                            deletedAt:
                                message.deletedAt,
                        }
                    );

                    console.log(
                        "Message deleted:",
                        messageId
                    );
                } catch (error) {
                    console.error(
                        "Delete message error:",
                        error
                    );
                }
            }
        );

        // ====================================
        // PIN MESSAGE
        // ====================================

        socket.on(
            "pinMessage",
            async ({
                messageId,
                conversationId,
            } = {}) => {
                try {
                    if (
                        !messageId ||
                        !conversationId ||
                        !socket.userId
                    ) {
                        return;
                    }

                    if (
                        !mongoose.Types.ObjectId.isValid(
                            messageId
                        ) ||
                        !mongoose.Types.ObjectId.isValid(
                            conversationId
                        )
                    ) {
                        return;
                    }

                    const conversation =
                        await Conversation.findById(
                            conversationId
                        );

                    if (
                        !conversation
                    ) {
                        return;
                    }

                    if (
                        !isConversationParticipant(
                            conversation,
                            socket.userId
                        )
                    ) {
                        return;
                    }

                    const message =
                        await Message.findById(
                            messageId
                        );

                    if (
                        !message
                    ) {
                        return;
                    }

                    if (
                        message.conversationId.toString() !==
                        conversationId.toString()
                    ) {
                        return;
                    }

                    if (
                        message.deleted ||
                        message.pinned
                    ) {
                        return;
                    }

                    const pinnedAt =
                        new Date();

                    message.pinned =
                        true;

                    message.pinnedAt =
                        pinnedAt;

                    message.pinnedBy =
                        socket.userId;

                    await message.save();

                    const populatedMessage =
                        await populateMessage(
                            message._id
                        );

                    io.to(
                        conversationId.toString()
                    ).emit(
                        "messagePinned",
                        {
                            messageId:
                                messageId.toString(),

                            conversationId:
                                conversationId.toString(),

                            pinnedBy:
                                socket.userId.toString(),

                            pinnedAt,

                            message:
                                populatedMessage,
                        }
                    );

                    console.log(
                        "Message pinned:",
                        messageId
                    );
                } catch (error) {
                    console.error(
                        "Pin message error:",
                        error
                    );
                }
            }
        );

        // ====================================
        // UNPIN MESSAGE
        // ====================================

        socket.on(
            "unpinMessage",
            async ({
                messageId,
                conversationId,
            } = {}) => {
                try {
                    if (
                        !messageId ||
                        !conversationId ||
                        !socket.userId
                    ) {
                        return;
                    }

                    if (
                        !mongoose.Types.ObjectId.isValid(
                            messageId
                        ) ||
                        !mongoose.Types.ObjectId.isValid(
                            conversationId
                        )
                    ) {
                        return;
                    }

                    const conversation =
                        await Conversation.findById(
                            conversationId
                        );

                    if (
                        !conversation
                    ) {
                        return;
                    }

                    if (
                        !isConversationParticipant(
                            conversation,
                            socket.userId
                        )
                    ) {
                        return;
                    }

                    const message =
                        await Message.findById(
                            messageId
                        );

                    if (
                        !message
                    ) {
                        return;
                    }

                    if (
                        message.conversationId.toString() !==
                        conversationId.toString()
                    ) {
                        return;
                    }

                    if (
                        !message.pinned
                    ) {
                        return;
                    }

                    message.pinned =
                        false;

                    message.pinnedAt =
                        null;

                    message.pinnedBy =
                        null;

                    await message.save();

                    io.to(
                        conversationId.toString()
                    ).emit(
                        "messageUnpinned",
                        {
                            messageId:
                                messageId.toString(),

                            conversationId:
                                conversationId.toString(),

                            unpinnedBy:
                                socket.userId,

                            unpinnedAt:
                                new Date(),
                        }
                    );

                    console.log(
                        "Message unpinned:",
                        messageId
                    );
                } catch (error) {
                    console.error(
                        "Unpin message error:",
                        error
                    );
                }
            }
        );

        // ====================================
        // TOGGLE PIN
        // ====================================

        socket.on(
            "togglePinMessage",
            async ({
                messageId,
                conversationId,
            } = {}) => {
                try {
                    if (
                        !messageId ||
                        !conversationId ||
                        !socket.userId
                    ) {
                        return;
                    }

                    const message =
                        await Message.findById(
                            messageId
                        );

                    if (
                        !message
                    ) {
                        return;
                    }

                    if (
                        message.pinned
                    ) {
                        socket.emit(
                            "requestUnpinMessage",
                            {
                                messageId,
                                conversationId,
                            }
                        );
                    } else {
                        socket.emit(
                            "requestPinMessage",
                            {
                                messageId,
                                conversationId,
                            }
                        );
                    }
                } catch (error) {
                    console.error(
                        "Toggle pin error:",
                        error
                    );
                }
            }
        );

        // ====================================
        // FORWARD MESSAGE
        // ====================================

        socket.on(
            "forwardMessage",
            async ({
                messageId,
                targetConversationId,
            } = {}) => {
                try {
                    if (
                        !messageId ||
                        !targetConversationId ||
                        !socket.userId
                    ) {
                        return;
                    }

                    if (
                        !mongoose.Types.ObjectId.isValid(
                            messageId
                        ) ||
                        !mongoose.Types.ObjectId.isValid(
                            targetConversationId
                        )
                    ) {
                        return;
                    }

                    // ----------------------------
                    // ORIGINAL
                    // ----------------------------

                    const originalMessage =
                        await Message.findById(
                            messageId
                        );

                    if (
                        !originalMessage
                    ) {
                        return;
                    }

                    if (
                        originalMessage.deleted
                    ) {
                        return;
                    }

                    // ----------------------------
                    // SOURCE
                    // ----------------------------

                    const sourceConversation =
                        await Conversation.findById(
                            originalMessage.conversationId
                        );

                    if (
                        !sourceConversation
                    ) {
                        return;
                    }

                    if (
                        !isConversationParticipant(
                            sourceConversation,
                            socket.userId
                        )
                    ) {
                        return;
                    }

                    // ----------------------------
                    // TARGET
                    // ----------------------------

                    const targetConversation =
                        await Conversation.findById(
                            targetConversationId
                        );

                    if (
                        !targetConversation
                    ) {
                        return;
                    }

                    if (
                        !isConversationParticipant(
                            targetConversation,
                            socket.userId
                        )
                    ) {
                        return;
                    }

                    // ----------------------------
                    // IMAGE
                    // ----------------------------

                    let forwardedImageUrl =
                        originalMessage.imageUrl;

                    if (
                        originalMessage.imageUrl
                    ) {
                        forwardedImageUrl =
                            copyUploadedFile(
                                originalMessage.imageUrl
                            );

                        if (
                            !forwardedImageUrl
                        ) {
                            return;
                        }
                    }

                    // ----------------------------
                    // FILE
                    // ----------------------------

                    let forwardedFileUrl =
                        originalMessage.fileUrl;

                    if (
                        originalMessage.fileUrl
                    ) {
                        forwardedFileUrl =
                            copyUploadedFile(
                                originalMessage.fileUrl
                            );

                        if (
                            !forwardedFileUrl
                        ) {
                            return;
                        }
                    }

                    // ----------------------------
                    // AUDIO
                    // ----------------------------

                    let forwardedAudioUrl =
                        originalMessage.audioUrl;

                    if (
                        originalMessage.audioUrl
                    ) {
                        forwardedAudioUrl =
                            copyUploadedFile(
                                originalMessage.audioUrl
                            );

                        if (
                            !forwardedAudioUrl
                        ) {
                            return;
                        }
                    }

                    // ----------------------------
                    // CREATE FORWARDED
                    // ----------------------------

                    const forwardedMessage =
                        await Message.create({
                            conversationId:
                                targetConversationId,

                            sender:
                                socket.userId,

                            replyTo:
                                null,

                            messageType:
                                originalMessage.messageType,

                            text:
                                originalMessage.text ||
                                "",

                            imageUrl:
                                forwardedImageUrl ||
                                null,

                            fileUrl:
                                forwardedFileUrl ||
                                null,

                            fileName:
                                originalMessage.fileName ||
                                null,

                            fileSize:
                                originalMessage.fileSize ??
                                null,

                            audioUrl:
                                forwardedAudioUrl ||
                                null,

                            audioDuration:
                                originalMessage.audioDuration ??
                                null,

                            deleted:
                                false,

                            deletedAt:
                                null,

                            pinned:
                                false,

                            pinnedAt:
                                null,

                            pinnedBy:
                                null,

                            forwarded:
                                true,

                            forwardedFrom:
                                originalMessage._id,

                            forwardedBy:
                                socket.userId,

                            delivered:
                                false,

                            deliveredAt:
                                null,

                            read:
                                false,

                            readAt:
                                null,
                        });

                    // ----------------------------
                    // LAST MESSAGE
                    // ----------------------------

                    targetConversation.lastMessage =
                        forwardedMessage._id;

                    await targetConversation.save();

                    // ----------------------------
                    // POPULATE
                    // ----------------------------

                    let populatedMessage =
                        await populateMessage(
                            forwardedMessage._id
                        );

                    const room =
                        targetConversationId.toString();

                    // ----------------------------
                    // SEND
                    // ----------------------------

                    io.to(
                        room
                    ).emit(
                        "receiveMessage",
                        populatedMessage
                    );

                    // ----------------------------
                    // RECIPIENTS
                    // ----------------------------

                    const recipientIds =
                        targetConversation.participants
                            .map(
                                (
                                    id
                                ) =>
                                    id.toString()
                            )
                            .filter(
                                (
                                    id
                                ) =>
                                    id !==
                                    socket.userId
                            );

                    // ----------------------------
                    // DELIVERY
                    // ----------------------------

                    const recipientOnline =
                        recipientIds.some(
                            (
                                id
                            ) =>
                                onlineUsers.has(
                                    id
                                )
                        );

                    if (
                        recipientOnline
                    ) {
                        const deliveredAt =
                            new Date();

                        await Message.findByIdAndUpdate(
                            forwardedMessage._id,
                            {
                                delivered:
                                    true,

                                deliveredAt,
                            }
                        );

                        populatedMessage =
                            await populateMessage(
                                forwardedMessage._id
                            );

                        io.to(
                            room
                        ).emit(
                            "messageDelivered",
                            {
                                messageId:
                                    forwardedMessage._id.toString(),

                                conversationId:
                                    room,

                                deliveredAt,
                            }
                        );
                    }

                    // ----------------------------
                    // NOTIFICATIONS
                    // ----------------------------

                    recipientIds.forEach(
                        (
                            recipientId
                        ) => {
                            emitToUser(
                                recipientId,
                                "newMessageNotification",
                                populatedMessage
                            );
                        }
                    );

                    // ----------------------------
                    // CONFIRM
                    // ----------------------------

                    socket.emit(
                        "messageForwarded",
                        {
                            originalMessageId:
                                messageId.toString(),

                            newMessage:
                                populatedMessage,

                            targetConversationId:
                                targetConversationId.toString(),
                        }
                    );

                    console.log(
                        "Message forwarded:",
                        messageId,
                        "->",
                        targetConversationId
                    );
                } catch (error) {
                    console.error(
                        "Forward message error:",
                        error
                    );

                    socket.emit(
                        "forwardMessageError",
                        {
                            message:
                                "Unable to forward message.",
                        }
                    );
                }
            }
        );

        // ====================================
        // MARK SINGLE MESSAGE READ
        // ====================================

        socket.on(
            "markMessageRead",
            async ({
                messageId,
                conversationId,
            } = {}) => {
                try {
                    if (
                        !messageId ||
                        !conversationId ||
                        !socket.userId
                    ) {
                        return;
                    }

                    const message =
                        await Message.findById(
                            messageId
                        );

                    if (
                        !message
                    ) {
                        return;
                    }

                    if (
                        message.conversationId.toString() !==
                        conversationId.toString()
                    ) {
                        return;
                    }

                    if (
                        message.sender.toString() ===
                        socket.userId
                    ) {
                        return;
                    }

                    const conversation =
                        await Conversation.findById(
                            conversationId
                        );

                    if (
                        !conversation
                    ) {
                        return;
                    }

                    if (
                        !isConversationParticipant(
                            conversation,
                            socket.userId
                        )
                    ) {
                        return;
                    }

                    if (
                        message.read
                    ) {
                        return;
                    }

                    const readAt =
                        new Date();

                    message.read =
                        true;

                    message.readAt =
                        readAt;

                    message.delivered =
                        true;

                    if (
                        !message.deliveredAt
                    ) {
                        message.deliveredAt =
                            readAt;
                    }

                    await message.save();

                    io.to(
                        conversationId.toString()
                    ).emit(
                        "messageRead",
                        {
                            messageId:
                                message._id.toString(),

                            conversationId:
                                conversationId.toString(),

                            readAt,
                        }
                    );
                } catch (error) {
                    console.error(
                        "Mark message read error:",
                        error
                    );
                }
            }
        );

        // ====================================
        // MARK WHOLE CONVERSATION READ
        // ====================================

        socket.on(
            "markConversationRead",
            async ({
                conversationId,
            } = {}) => {
                try {
                    if (
                        !conversationId ||
                        !socket.userId
                    ) {
                        return;
                    }

                    const conversation =
                        await Conversation.findById(
                            conversationId
                        );

                    if (
                        !conversation
                    ) {
                        return;
                    }

                    if (
                        !isConversationParticipant(
                            conversation,
                            socket.userId
                        )
                    ) {
                        return;
                    }

                    const readAt =
                        new Date();

                    await Message.updateMany(
                        {
                            conversationId,

                            sender: {
                                $ne:
                                    socket.userId,
                            },

                            read:
                                false,
                        },
                        {
                            $set: {
                                read:
                                    true,

                                readAt,

                                delivered:
                                    true,

                                deliveredAt:
                                    readAt,
                            },
                        }
                    );

                    io.to(
                        conversationId.toString()
                    ).emit(
                        "conversationRead",
                        {
                            conversationId:
                                conversationId.toString(),

                            userId:
                                socket.userId,

                            readAt,
                        }
                    );
                } catch (error) {
                    console.error(
                        "Mark conversation read error:",
                        error
                    );
                }
            }
        );

        // ====================================
        // DISCONNECT
        // ====================================

        socket.on(
            "disconnect",
            async () => {
                try {
                    if (
                        !socket.userId
                    ) {
                        return;
                    }

                    const sockets =
                        onlineUsers.get(
                            socket.userId
                        );

                    if (
                        !sockets
                    ) {
                        return;
                    }

                    sockets.delete(
                        socket.id
                    );

                    // --------------------------------
                    // ONLY OFFLINE WHEN NO SOCKETS
                    // --------------------------------

                    if (
                        sockets.size ===
                        0
                    ) {
                        onlineUsers.delete(
                            socket.userId
                        );

                        const lastSeen =
                            new Date();

                        await User.findByIdAndUpdate(
                            socket.userId,
                            {
                                isOnline:
                                    false,

                                lastSeen,
                            }
                        );

                        io.emit(
                            "userOffline",
                            {
                                userId:
                                    socket.userId,

                                lastSeen,
                            }
                        );
                    }

                    console.log(
                        "User disconnected:",
                        socket.userId
                    );

                    console.log(
                        "Socket disconnected:",
                        socket.id
                    );
                } catch (error) {
                    console.error(
                        "Disconnect error:",
                        error
                    );
                }
            }
        );
    }
);

// ========================================
// MULTER / UPLOAD ERROR HANDLER
// ========================================

app.use(
    (
        error,
        req,
        res,
        next
    ) => {
        // --------------------------------
        // MULTER ERROR
        // --------------------------------

        if (
            error instanceof
            multer.MulterError
        ) {
            console.error(
                "Multer error:",
                error
            );

            if (
                error.code ===
                "LIMIT_FILE_SIZE"
            ) {
                return res.status(400).json({
                    success: false,

                    message:
                        "File is too large. Maximum allowed size is 10 MB.",
                });
            }

            return res.status(400).json({
                success: false,

                message:
                    error.message ||
                    "File upload error.",
            });
        }

        // --------------------------------
        // CUSTOM UPLOAD ERROR
        // --------------------------------

        if (
            error
        ) {
            console.error(
                "Upload/server error:",
                error
            );

            return res.status(400).json({
                success: false,

                message:
                    error.message ||
                    "Unable to upload file.",
            });
        }

        next();
    }
);

// ========================================
// 404 HANDLER
// ========================================

app.use(
    (
        req,
        res
    ) => {
        return res.status(404).json({
            success: false,

            message:
                `Route not found: ${req.method} ${req.originalUrl}`,
        });
    }
);

// ========================================
// GLOBAL ERROR HANDLER
// ========================================

app.use(
    (
        error,
        req,
        res,
        next
    ) => {
        console.error(
            "Global server error:",
            error
        );

        if (
            res.headersSent
        ) {
            return next(
                error
            );
        }

        return res.status(500).json({
            success: false,

            message:
                "Internal server error.",
        });
    }
);

// ========================================
// START SERVER
// ========================================

const PORT =
    process.env.PORT ||
    5000;

const startServer =
    async () => {
        try {
            // --------------------------------
            // CHECK MONGO URI
            // --------------------------------

            if (
                !process.env.MONGO_URI
            ) {
                throw new Error(
                    "MONGO_URI is missing from .env"
                );
            }

            console.log(
                "Connecting to MongoDB..."
            );

            // --------------------------------
            // CONNECT
            // --------------------------------

            await mongoose.connect(
                process.env.MONGO_URI,
                {
                    serverSelectionTimeoutMS:
                        10000,
                }
            );

            console.log(
                "MongoDB connected successfully"
            );

            // --------------------------------
            // START
            // --------------------------------

            server.listen(
                PORT,
                () => {
                    console.log(
                        `🚀 Chit Chat server running on http://localhost:${PORT}`
                    );

                    console.log(
                        `📁 Uploaded files: http://localhost:${PORT}/uploads`
                    );

                    console.log(
                        `📁 Upload directory: ${filesDirectory}`
                    );
                }
            );
        } catch (error) {
            console.error(
                "MongoDB connection error:",
                error.message
            );

            process.exit(
                1
            );
        }
    };

// ========================================
// RUN APPLICATION
// ========================================

startServer();