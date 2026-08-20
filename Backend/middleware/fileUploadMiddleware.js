const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ========================================
// UPLOAD DIRECTORY
// ========================================

const uploadDirectory = path.join(
    __dirname,
    "../uploads/files"
);

// Create directory automatically
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true,
    });
}

// ========================================
// STORAGE
// ========================================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(
            file.originalname
        );

        const safeName =
            path
                .basename(
                    file.originalname,
                    extension
                )
                .replace(
                    /[^a-zA-Z0-9-_]/g,
                    "_"
                );

        const filename =
            `${safeName}-${Date.now()}-${Math.round(
                Math.random() * 1e9
            )}${extension}`;

        cb(null, filename);
    },
});

// ========================================
// FILE FILTER
// ========================================

const fileFilter = (req, file, cb) => {
    // Allow common documents/files
    const allowedTypes = [
        // PDF
        "application/pdf",

        // Microsoft Word
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

        // Microsoft Excel
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        // Microsoft PowerPoint
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",

        // Text
        "text/plain",
        "text/csv",

        // ZIP
        "application/zip",
        "application/x-zip-compressed",

        // Images
        "image/jpeg",
        "image/png",
        "image/webp",

        // Common audio
        "audio/mpeg",
        "audio/wav",

        // Common video
        "video/mp4",
        "video/webm",
    ];

    if (
        allowedTypes.includes(
            file.mimetype
        )
    ) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "This file type is not supported."
            ),
            false
        );
    }
};

// ========================================
// MULTER
// ========================================

const uploadFile = multer({
    storage,

    fileFilter,

    limits: {
        // Maximum file size: 10 MB
        fileSize: 10 * 1024 * 1024,
    },
});

module.exports = uploadFile;