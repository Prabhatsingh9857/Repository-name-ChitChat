import React, { useEffect, useState } from "react";
import {
    Download,
    FileText,
    ExternalLink,
    Loader2,
    Image as ImageIcon,
} from "lucide-react";

import { formatFileSize } from "../../utils/formatFileSize";

const BACKEND_URL =
    "https://chitchat-backend-dpbp.onrender.com";

const FileMessages = ({ message, isOwn }) => {
    const [downloading, setDownloading] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState("");

    if (!message || !message.fileUrl) {
        return null;
    }

    // ========================================
    // FILE INFORMATION
    // ========================================

    const fileName =
        message.fileName || "Attached file";

    const fileSize = message.fileSize
        ? formatFileSize(message.fileSize)
        : "";

    // ========================================
    // CHECK WHETHER FILE IS AN IMAGE
    // ========================================

    const isImage =
        message.fileType?.startsWith("image/") ||
        /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(
            fileName
        );

    // ========================================
    // GET TOKEN
    // ========================================

    const getToken = () => {
        return (
            localStorage.getItem("token") ||
            sessionStorage.getItem("token")
        );
    };

    // ========================================
    // GET SERVER FILENAME
    // ========================================

    const getServerFilename = () => {
        try {
            const cleanUrl =
                message.fileUrl.split("?")[0];

            const filename =
                cleanUrl.split("/").pop();

            return decodeURIComponent(filename);
        } catch (error) {
            console.error(
                "Filename extraction error:",
                error
            );

            return fileName;
        }
    };

    // ========================================
    // GET PROTECTED DOWNLOAD URL
    // ========================================

    const getDownloadUrl = () => {
        const serverFilename =
            getServerFilename();

        return `${BACKEND_URL}/api/files/download/${encodeURIComponent(
            serverFilename
        )}`;
    };

    // ========================================
    // LOAD IMAGE
    // ========================================

    useEffect(() => {
        if (!isImage) {
            return;
        }

        let objectUrl = null;
        let cancelled = false;

        const loadImage = async () => {
            try {
                setImageLoading(true);
                setImageError("");

                const token = getToken();

                if (!token) {
                    throw new Error(
                        "Authentication token is missing."
                    );
                }

                const response = await fetch(
                    getDownloadUrl(),
                    {
                        method: "GET",
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    let errorMessage =
                        "Unable to load image.";

                    try {
                        const data =
                            await response.json();

                        if (data?.message) {
                            errorMessage =
                                data.message;
                        }
                    } catch {
                        // Ignore JSON parsing error
                    }

                    throw new Error(
                        errorMessage
                    );
                }

                const blob =
                    await response.blob();

                if (!blob || blob.size === 0) {
                    throw new Error(
                        "Image file is empty."
                    );
                }

                objectUrl =
                    window.URL.createObjectURL(
                        blob
                    );

                if (!cancelled) {
                    setImageUrl(objectUrl);
                }
            } catch (error) {
                console.error(
                    "Image loading error:",
                    error
                );

                if (!cancelled) {
                    setImageError(
                        error.message ||
                            "Unable to load image."
                    );
                }
            } finally {
                if (!cancelled) {
                    setImageLoading(false);
                }
            }
        };

        loadImage();

        return () => {
            cancelled = true;

            if (objectUrl) {
                window.URL.revokeObjectURL(
                    objectUrl
                );
            }
        };
    }, [
        message.fileUrl,
        message.fileName,
        message.fileType,
    ]);

    // ========================================
    // OPEN FILE
    // ========================================

    const handleOpen = async () => {
        try {
            const token = getToken();

            if (!token) {
                alert(
                    "Your login session has expired. Please login again."
                );

                return;
            }

            const response = await fetch(
                getDownloadUrl(),
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                let errorMessage =
                    "Unable to open file.";

                try {
                    const data =
                        await response.json();

                    if (data?.message) {
                        errorMessage =
                            data.message;
                    }
                } catch {
                    // Ignore JSON parsing error
                }

                throw new Error(
                    errorMessage
                );
            }

            const blob =
                await response.blob();

            if (!blob || blob.size === 0) {
                throw new Error(
                    "The file is empty."
                );
            }

            const blobUrl =
                window.URL.createObjectURL(
                    blob
                );

            window.open(
                blobUrl,
                "_blank",
                "noopener,noreferrer"
            );

            setTimeout(() => {
                window.URL.revokeObjectURL(
                    blobUrl
                );
            }, 60000);
        } catch (error) {
            console.error(
                "Open file error:",
                error
            );

            alert(
                error.message ||
                    "Unable to open this file."
            );
        }
    };

    // ========================================
    // DOWNLOAD FILE
    // ========================================

    const handleDownload = async () => {
        if (downloading) {
            return;
        }

        try {
            setDownloading(true);

            const token = getToken();

            if (!token) {
                throw new Error(
                    "Your login session has expired. Please login again."
                );
            }

            const response = await fetch(
                getDownloadUrl(),
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                let errorMessage =
                    "Unable to download this file.";

                try {
                    const data =
                        await response.json();

                    if (data?.message) {
                        errorMessage =
                            data.message;
                    }
                } catch {
                    // Ignore parsing error
                }

                throw new Error(
                    errorMessage
                );
            }

            const blob =
                await response.blob();

            if (!blob || blob.size === 0) {
                throw new Error(
                    "Downloaded file is empty."
                );
            }

            const blobUrl =
                window.URL.createObjectURL(
                    blob
                );

            const link =
                document.createElement("a");

            link.href = blobUrl;

            link.download = fileName;

            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);

            setTimeout(() => {
                window.URL.revokeObjectURL(
                    blobUrl
                );
            }, 1000);

            console.log(
                "File downloaded successfully:",
                fileName
            );
        } catch (error) {
            console.error(
                "Download error:",
                error
            );

            alert(
                error.message ||
                    "Unable to download this file."
            );
        } finally {
            setDownloading(false);
        }
    };

    // ========================================
    // IMAGE MESSAGE
    // ========================================

    if (isImage) {
        return (
            <div
                style={{
                    maxWidth: "360px",
                    borderRadius: "14px",
                    overflow: "hidden",
                    background: isOwn
                        ? "rgba(255,255,255,0.12)"
                        : "#f3f4f6",
                    color: isOwn
                        ? "#ffffff"
                        : "#111827",
                }}
            >
                {/* IMAGE */}

                {imageLoading && (
                    <div
                        style={{
                            width: "320px",
                            height: "240px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: isOwn
                                ? "rgba(255,255,255,0.1)"
                                : "#e5e7eb",
                        }}
                    >
                        <Loader2
                            size={30}
                            style={{
                                animation:
                                    "spin 1s linear infinite",
                            }}
                        />
                    </div>
                )}

                {!imageLoading &&
                    imageError && (
                        <div
                            style={{
                                width: "320px",
                                minHeight: "120px",
                                display: "flex",
                                flexDirection:
                                    "column",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "center",
                                gap: "8px",
                                padding: "20px",
                                textAlign: "center",
                                background:
                                    isOwn
                                        ? "rgba(255,255,255,0.1)"
                                        : "#f3f4f6",
                            }}
                        >
                            <ImageIcon
                                size={30}
                            />

                            <span
                                style={{
                                    fontSize:
                                        "13px",
                                }}
                            >
                                Unable to load
                                image
                            </span>

                            <button
                                type="button"
                                onClick={
                                    handleOpen
                                }
                                style={{
                                    border: "none",
                                    borderRadius:
                                        "7px",
                                    padding:
                                        "6px 12px",
                                    cursor:
                                        "pointer",
                                    background:
                                        "#6366f1",
                                    color:
                                        "#ffffff",
                                }}
                            >
                                Open Image
                            </button>
                        </div>
                    )}

                {!imageLoading &&
                    !imageError &&
                    imageUrl && (
                        <img
                            src={imageUrl}
                            alt={fileName}
                            onClick={
                                handleOpen
                            }
                            style={{
                                display: "block",
                                width: "100%",
                                maxHeight:
                                    "360px",
                                objectFit:
                                    "contain",
                                cursor:
                                    "pointer",
                                background:
                                    "#000000",
                            }}
                            title="Click to open image"
                        />
                    )}

                {/* IMAGE FOOTER */}

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 10px",
                    }}
                >
                    <ImageIcon
                        size={16}
                    />

                    <div
                        style={{
                            flex: 1,
                            minWidth: 0,
                        }}
                    >
                        <div
                            style={{
                                fontSize:
                                    "13px",
                                fontWeight:
                                    "600",
                                overflow:
                                    "hidden",
                                textOverflow:
                                    "ellipsis",
                                whiteSpace:
                                    "nowrap",
                            }}
                            title={fileName}
                        >
                            {fileName}
                        </div>

                        {fileSize && (
                            <div
                                style={{
                                    fontSize:
                                        "11px",
                                    opacity:
                                        0.7,
                                }}
                            >
                                {fileSize}
                            </div>
                        )}
                    </div>

                    {/* OPEN */}

                    <button
                        type="button"
                        onClick={
                            handleOpen
                        }
                        title="Open image"
                        style={{
                            border: "none",
                            background:
                                "transparent",
                            cursor:
                                "pointer",
                            padding: "5px",
                            color: "inherit",
                            display:
                                "flex",
                            alignItems:
                                "center",
                            justifyContent:
                                "center",
                        }}
                    >
                        <ExternalLink
                            size={18}
                        />
                    </button>

                    {/* DOWNLOAD */}

                    <button
                        type="button"
                        onClick={
                            handleDownload
                        }
                        disabled={
                            downloading
                        }
                        title={
                            downloading
                                ? "Downloading..."
                                : "Download image"
                        }
                        style={{
                            border: "none",
                            background:
                                "transparent",
                            cursor:
                                downloading
                                    ? "not-allowed"
                                    : "pointer",
                            padding: "5px",
                            color: "inherit",
                            display:
                                "flex",
                            alignItems:
                                "center",
                            justifyContent:
                                "center",
                            opacity:
                                downloading
                                    ? 0.6
                                    : 1,
                        }}
                    >
                        {downloading ? (
                            <Loader2
                                size={18}
                                style={{
                                    animation:
                                        "spin 1s linear infinite",
                                }}
                            />
                        ) : (
                            <Download
                                size={18}
                            />
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // ========================================
    // NORMAL FILE MESSAGE
    // ========================================

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                minWidth: "260px",
                maxWidth: "340px",
                borderRadius: "12px",
                background: isOwn
                    ? "rgba(255,255,255,0.15)"
                    : "#f3f4f6",
                color: isOwn
                    ? "#ffffff"
                    : "#111827",
            }}
        >
            {/* FILE ICON */}

            <div
                style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isOwn
                        ? "rgba(255,255,255,0.2)"
                        : "#e5e7eb",
                    flexShrink: 0,
                }}
            >
                <FileText size={23} />
            </div>

            {/* FILE INFORMATION */}

            <div
                style={{
                    flex: 1,
                    minWidth: 0,
                }}
            >
                <div
                    style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        overflow: "hidden",
                        textOverflow:
                            "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                    title={fileName}
                >
                    {fileName}
                </div>

                {fileSize && (
                    <div
                        style={{
                            fontSize: "12px",
                            marginTop: "4px",
                            opacity: 0.7,
                        }}
                    >
                        {fileSize}
                    </div>
                )}
            </div>

            {/* OPEN */}

            <button
                type="button"
                onClick={handleOpen}
                title="Open file"
                style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: "6px",
                    color: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                <ExternalLink size={20} />
            </button>

            {/* DOWNLOAD */}

            <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                title={
                    downloading
                        ? "Downloading..."
                        : "Download file"
                }
                style={{
                    border: "none",
                    background: "transparent",
                    cursor: downloading
                        ? "not-allowed"
                        : "pointer",
                    padding: "6px",
                    color: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    opacity: downloading
                        ? 0.6
                        : 1,
                }}
            >
                {downloading ? (
                    <Loader2
                        size={21}
                        style={{
                            animation:
                                "spin 1s linear infinite",
                        }}
                    />
                ) : (
                    <Download size={21} />
                )}
            </button>
        </div>
    );
};

export default FileMessages;