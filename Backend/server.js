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
// PORT
// ========================================

const PORT = process.env.PORT || 5000;

// ========================================
// FRONTEND URLS
// ========================================

const defaultFrontendUrls = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://chitchat-frontend-vr5y.onrender.com",
];

// ========================================
// BUILD FRONTEND URL LIST
// ========================================

const environmentFrontendUrls =
    process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL
              .split(",")
              .map((url) => url.trim())
              .filter(Boolean)
        : [];

const frontendUrls = [
    ...defaultFrontendUrls,
    ...environmentFrontendUrls,
].filter(
    (url, index, array) =>
        array.indexOf(url) === index
);

// ========================================
// CORS ORIGIN CHECK
// ========================================

const corsOrigin = (origin, callback) => {
    // ------------------------------------
    // Requests without Origin
    // ------------------------------------
    //
    // Allows:
    // - Postman
    // - server-to-server requests
    // - some mobile/native requests
    //

    if (!origin) {
        return callback(null, true);
    }

    // ------------------------------------
    // LOCALHOST
    // ------------------------------------

    if (
        origin === "http://localhost:5173" ||
        origin === "http://localhost:5174" ||
        origin.startsWith("http://localhost:")
    ) {
        return callback(null, true);
    }

    // ------------------------------------
    // PRODUCTION FRONTEND
    // ------------------------------------

    if (
        origin ===
        "https://chitchat-frontend-vr5y.onrender.com"
    ) {
        return callback(null, true);
    }

    // ------------------------------------
    // FRONTEND_URL FROM RENDER
    // ------------------------------------

    if (
        process.env.FRONTEND_URL
    ) {
        const allowedUrls =
            process.env.FRONTEND_URL
                .split(",")
                .map((url) => url.trim())
                .filter(Boolean);

        if (
            allowedUrls.includes(origin)
        ) {
            return callback(null, true);
        }
    }

    // ------------------------------------
    // CHECK DEFAULT URL LIST
    // ------------------------------------

    if (
        frontendUrls.includes(origin)
    ) {
        return callback(null, true);
    }

    // ------------------------------------
    // BLOCK UNKNOWN ORIGIN
    // ------------------------------------

    console.log(
        "CORS blocked origin:",
        origin
    );

    return callback(
        new Error(
            `Not allowed by CORS: ${origin}`
        )
    );
};

// ========================================
// CORS OPTIONS
// ========================================

const corsOptions = {
    origin: corsOrigin,

    credentials: true,

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],

    allowedHeaders: [
        "Content-Type",
        "Authorization",
    ],

    optionsSuccessStatus: 204,
};

// ========================================
// EXPRESS CORS
// ========================================

app.use(cors(corsOptions));

// ========================================
// BODY PARSERS
// ========================================

app.use(
    express.json({
        limit: "10mb",
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb",
    })
);

// ========================================
// UPLOAD DIRECTORIES
// ========================================

const uploadsDirectory = path.join(
    __dirname,
    "uploads"
);

const filesDirectory = path.join(
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
// ALSO SERVE /uploads/files
// ========================================

app.use(
    "/uploads/files",
    express.static(
        filesDirectory
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

            let filePath =
                path.join(
                    filesDirectory,
                    safeFilename
                );

            // --------------------------------
            // FALLBACK
            // --------------------------------

            if (
                !fs.existsSync(
                    filePath
                )
            ) {
                const fallbackPath =
                    path.join(
                        uploadsDirectory,
                        safeFilename
                    );

                if (
                    fs.existsSync(
                        fallbackPath
                    )
                ) {
                    filePath =
                        fallbackPath;
                }
            }

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
// HEALTH CHECK
// ========================================

app.get(
    "/health",
    (req, res) => {
        return res.status(200).json({
            success: true,

            message:
                "Chit Chat server is healthy.",

            database:
                mongoose.connection
                    .readyState === 1
                    ? "connected"
                    : "disconnected",

            timestamp:
                new Date().toISOString(),
        });
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
                "Chit Chat server is running.",
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
            origin: corsOrigin,

            credentials: true,

            methods: [
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS",
            ],
        },

        transports: [
            "websocket",
            "polling",
        ],
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
// ========================================
//
// userId -> Set(socketId)
//

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
            if (
                !fileUrl.startsWith(
                    "/uploads/"
                )
            ) {
                return;
            }

            const relativePath =
                fileUrl.replace(
                    /^\/uploads[\\/]/,
                    ""
                );

            let filePath =
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
            // FALLBACK
            // --------------------------------

            if (
                !fs.existsSync(
                    filePath
                ) &&
                relativePath.startsWith(
                    "files" +
                        path.sep
                )
            ) {
                const fallbackName =
                    relativePath.replace(
                        /^files[\\/]/,
                        ""
                    );

                const fallbackPath =
                    path.resolve(
                        uploadsDirectory,
                        fallbackName
                    );

                if (
                    fallbackPath.startsWith(
                        uploadsRoot +
                            path.sep
                    ) &&
                    fs.existsSync(
                        fallbackPath
                    )
                ) {
                    filePath =
                        fallbackPath;
                }
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

        if (
            !fileUrl.startsWith(
                "/uploads/"
            )
        ) {
            return fileUrl;
        }

        try {
            const relativePath =
                fileUrl.replace(
                    /^\/uploads[\\/]/,
                    ""
                );

            let sourcePath =
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
                console.error(
                    "Blocked unsafe forwarding path:",
                    sourcePath
                );

                return null;
            }

            // --------------------------------
            // FALLBACK
            // --------------------------------

            if (
                !fs.existsSync(
                    sourcePath
                ) &&
                relativePath.startsWith(
                    "files" +
                        path.sep
                )
            ) {
                const fallbackName =
                    relativePath.replace(
                        /^files[\\/]/,
                        ""
                    );

                const fallbackPath =
                    path.resolve(
                        uploadsDirectory,
                        fallbackName
                    );

                if (
                    fallbackPath.startsWith(
                        uploadsRoot +
                            path.sep
                    ) &&
                    fs.existsSync(
                        fallbackPath
                    )
                ) {
                    sourcePath =
                        fallbackPath;
                }
            }

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
                    Math.random() *
                        1000000000
                )}${extension}`;

            const destinationPath =
                path.join(
                    filesDirectory,
                    newName
                );

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
                    if (!userId) {
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
                replyTo = null,
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

                    conversation.lastMessage =
                        newMessage._id;

                    await conversation.save();

                    let populatedMessage =
                        await populateMessage(
                            newMessage._id
                        );

                    const room =
                        conversationId.toString();

                    io.to(
                        room
                    ).emit(
                        "receiveMessage",
                        populatedMessage
                    );

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

                    if (
                        message.audioUrl
                    ) {
                        deleteUploadedFile(
                            message.audioUrl
                        );
                    }

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

                    // --------------------------------
                    // IMAGE
                    // --------------------------------

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

                    // --------------------------------
                    // FILE
                    // --------------------------------

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

                    // --------------------------------
                    // AUDIO
                    // --------------------------------

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

                    // --------------------------------
                    // CREATE
                    // --------------------------------

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

                    targetConversation.lastMessage =
                        forwardedMessage._id;

                    await targetConversation.save();

                    let populatedMessage =
                        await populateMessage(
                            forwardedMessage._id
                        );

                    const room =
                        targetConversationId.toString();

                    io.to(
                        room
                    ).emit(
                        "receiveMessage",
                        populatedMessage
                    );

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
                    "Unable to process request.",
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

const startServer =
    async () => {
        try {
            // --------------------------------
            // CHECK ENVIRONMENT VARIABLES
            // --------------------------------

            if (
                !process.env.MONGO_URI
            ) {
                throw new Error(
                    "MONGO_URI is missing from environment variables."
                );
            }

            if (
                !process.env.JWT_SECRET
            ) {
                throw new Error(
                    "JWT_SECRET is missing from environment variables."
                );
            }

            console.log(
                "========================================"
            );

            console.log(
                "Starting Chit Chat server..."
            );

            console.log(
                "Environment:",
                process.env.NODE_ENV ||
                    "development"
            );

            console.log(
                "Port:",
                PORT
            );

            console.log(
                "Frontend allowed:",
                frontendUrls.join(
                    ", "
                )
            );

            console.log(
                "========================================"
            );

            // --------------------------------
            // CONNECT TO MONGODB
            // --------------------------------

            console.log(
                "Connecting to MongoDB..."
            );

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
            // START HTTP SERVER
            // --------------------------------
            //
            // IMPORTANT:
            // ONLY ONE server.listen()
            //

            server.listen(
                PORT,
                "0.0.0.0",
                () => {
                    console.log(
                        "========================================"
                    );

                    console.log(
                        `🚀 Chit Chat server running on port ${PORT}`
                    );

                    console.log(
                        `🌐 Frontend allowed: ${frontendUrls.join(
                            ", "
                        )}`
                    );

                    console.log(
                        "📁 Uploads enabled"
                    );

                    console.log(
                        "🔌 Socket.IO enabled"
                    );

                    console.log(
                        "❤️ Health check: /health"
                    );

                    console.log(
                        "========================================"
                    );
                }
            );
        } catch (error) {
            console.error(
                "========================================"
            );

            console.error(
                "MongoDB/server startup error:"
            );

            console.error(
                error.message
            );

            console.error(
                "========================================"
            );

            process.exit(
                1
            );
        }
    };

// ========================================
// GRACEFUL SHUTDOWN
// ========================================

const shutdown =
    async (
        signal
    ) => {
        console.log(
            `\n${signal} received. Shutting down...`
        );

        try {
            await mongoose.connection.close();

            server.close(
                () => {
                    console.log(
                        "Server closed."
                    );

                    process.exit(
                        0
                    );
                }
            );
        } catch (error) {
            console.error(
                "Shutdown error:",
                error
            );

            process.exit(
                1
            );
        }
    };

process.on(
    "SIGTERM",
    () =>
        shutdown(
            "SIGTERM"
        )
);

process.on(
    "SIGINT",
    () =>
        shutdown(
            "SIGINT"
        )
);

// ========================================
// RUN APPLICATION
// ========================================

startServer();