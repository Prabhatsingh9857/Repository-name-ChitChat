import React, { useState } from "react";
import {
    Download,
    FileText,
    ExternalLink,
    Loader2,
} from "lucide-react";

import { formatFileSize } from "../../utils/formatFileSize";

const BACKEND_URL = "http://localhost:5000";

const FileMessages = ({ message, isOwn }) => {
    const [downloading, setDownloading] =
        useState(false);

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
    // FILE URL
    // ========================================

    const fullFileUrl =
        message.fileUrl.startsWith("http")
            ? message.fileUrl
            : `${BACKEND_URL}${message.fileUrl}`;

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
    // GET FILENAME FROM URL
    // ========================================

    const getServerFilename = () => {
        try {
            const cleanUrl =
                message.fileUrl.split("?")[0];

            const filename =
                cleanUrl.split("/").pop();

            return decodeURIComponent(
                filename
            );
        } catch (error) {
            console.error(
                "Filename extraction error:",
                error
            );

            return fileName;
        }
    };

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

            const serverFilename =
                getServerFilename();

            const downloadUrl =
                `${BACKEND_URL}/api/files/download/${encodeURIComponent(
                    serverFilename
                )}`;

            // --------------------------------
            // FETCH FILE WITH TOKEN
            // --------------------------------

            const response = await fetch(
                downloadUrl,
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

            // --------------------------------
            // CONVERT RESPONSE TO BLOB
            // --------------------------------

            const blob =
                await response.blob();

            const blobUrl =
                window.URL.createObjectURL(
                    blob
                );

            // --------------------------------
            // OPEN BLOB
            // --------------------------------

            window.open(
                blobUrl,
                "_blank",
                "noopener,noreferrer"
            );

            // --------------------------------
            // CLEANUP
            // --------------------------------

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

            const serverFilename =
                getServerFilename();

            console.log(
                "Downloading:",
                serverFilename
            );

            // --------------------------------
            // PROTECTED DOWNLOAD URL
            // --------------------------------

            const downloadUrl =
                `${BACKEND_URL}/api/files/download/${encodeURIComponent(
                    serverFilename
                )}`;

            console.log(
                "Download URL:",
                downloadUrl
            );

            // --------------------------------
            // REQUEST FILE
            // --------------------------------

            const response = await fetch(
                downloadUrl,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            // --------------------------------
            // HANDLE ERROR
            // --------------------------------

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
                    // Server may have returned non-JSON
                }

                throw new Error(
                    errorMessage
                );
            }

            // --------------------------------
            // GET BLOB
            // --------------------------------

            const blob =
                await response.blob();

            if (!blob || blob.size === 0) {
                throw new Error(
                    "Downloaded file is empty."
                );
            }

            // --------------------------------
            // CREATE TEMPORARY URL
            // --------------------------------

            const blobUrl =
                window.URL.createObjectURL(
                    blob
                );

            // --------------------------------
            // CREATE DOWNLOAD LINK
            // --------------------------------

            const link =
                document.createElement("a");

            link.href = blobUrl;

            link.download = fileName;

            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);

            // --------------------------------
            // CLEANUP
            // --------------------------------

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
    // RENDER
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
            {/* ====================================
                FILE ICON
            ==================================== */}

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

            {/* ====================================
                FILE INFORMATION
            ==================================== */}

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

            {/* ====================================
                OPEN BUTTON
            ==================================== */}

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

            {/* ====================================
                DOWNLOAD BUTTON
            ==================================== */}

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