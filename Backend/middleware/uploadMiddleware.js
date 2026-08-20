const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ========================================
// UPLOAD DIRECTORY
// ========================================

const uploadDirectory = path.join(
    __dirname,
    "..",
    "uploads",
    "files"
);

// ========================================
// CREATE UPLOAD DIRECTORY
// ========================================

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
        const extension =
            path.extname(
                file.originalname
            );

        const originalName =
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
            `${originalName}-${Date.now()}-${Math.round(
                Math.random() * 1e9
            )}${extension}`;

        cb(null, filename);
    },
});

// ========================================
// ALLOWED FILE TYPES
// ========================================

const allowedTypes = [
    // ====================================
    // IMAGES
    // ====================================

    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",

    // ====================================
    // PDF
    // ====================================

    "application/pdf",

    // ====================================
    // MICROSOFT WORD
    // ====================================

    "application/msword",

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    // ====================================
    // MICROSOFT EXCEL
    // ====================================

    "application/vnd.ms-excel",

    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    // ====================================
    // MICROSOFT POWERPOINT
    // ====================================

    "application/vnd.ms-powerpoint",

    "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    // ====================================
    // TEXT
    // ====================================

    "text/plain",

    "text/csv",

    // ====================================
    // ZIP
    // ====================================

    "application/zip",

    "application/x-zip-compressed",

    // ====================================
    // AUDIO
    // ====================================

    "audio/mpeg",

    "audio/wav",

    "audio/ogg",

    "audio/webm",

    "audio/webm;codecs=opus",

    "audio/mp4",

    "audio/aac",

    // ====================================
    // VIDEO
    // ====================================

    "video/mp4",

    "video/webm",

    "video/quicktime",
];

// ========================================
// FILE FILTER
// ========================================

const fileFilter = (
    req,
    file,
    cb
) => {
    console.log(
        "========================================"
    );

    console.log(
        "Uploading file:",
        file.originalname
    );

    console.log(
        "MIME type:",
        file.mimetype
    );

    console.log(
        "========================================"
    );

    // ------------------------------------
    // ALLOW KNOWN TYPES
    // ------------------------------------

    if (
        allowedTypes.includes(
            file.mimetype
        )
    ) {
        cb(null, true);

        return;
    }

    // ------------------------------------
    // ALSO ALLOW AUDIO MIME TYPES
    // ------------------------------------
    //
    // Some browsers can send slightly
    // different WebM/Opus MIME strings.
    //
    // ------------------------------------

    if (
        file.mimetype &&
        file.mimetype.startsWith(
            "audio/"
        )
    ) {
        cb(null, true);

        return;
    }

    // ------------------------------------
    // REJECT
    // ------------------------------------

    console.log(
        "Rejected file type:",
        file.mimetype
    );

    cb(
        new Error(
            `File type "${file.mimetype}" is not supported.`
        ),
        false
    );
};

// ========================================
// MULTER
// ========================================

const upload = multer({
    storage,

    fileFilter,

    limits: {
        // =================================
        // MAXIMUM FILE SIZE
        // =================================
        //
        // 10 MB
        //
        // =================================

        fileSize:
            10 * 1024 * 1024,
    },
});

// ========================================
// EXPORT
// ========================================

module.exports = upload;