import React, {
    useRef,
    useState,
} from "react";
import { Paperclip } from "lucide-react";
import { sendFileMessage } from "../../services/fileService";

const FileUploadButton = ({
    conversationId,
    token,
    onFileSent,
}) => {
    const fileInputRef = useRef(null);

    const [uploading, setUploading] =
        useState(false);

    const [error, setError] =
        useState("");

    // ========================================
    // OPEN FILE PICKER
    // ========================================

    const handleClick = () => {
        if (uploading) {
            return;
        }

        fileInputRef.current?.click();
    };

    // ========================================
    // FILE SELECTED
    // ========================================

    const handleFileChange = async (
        event
    ) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        setError("");

        // ====================================
        // MAX 10 MB
        // ====================================

        const maxSize =
            10 * 1024 * 1024;

        if (file.size > maxSize) {
            setError(
                "File size cannot exceed 10 MB."
            );

            event.target.value = "";
            return;
        }

        try {
            setUploading(true);

            const message =
                await sendFileMessage(
                    file,
                    conversationId,
                    token
                );

            if (onFileSent) {
                onFileSent(message);
            }
        } catch (error) {
            console.error(
                "File upload error:",
                error
            );

            setError(
                error.message ||
                    "Failed to upload file."
            );
        } finally {
            setUploading(false);

            // Allow selecting the same
            // file again
            event.target.value = "";
        }
    };

    return (
        <div
            style={{
                position: "relative",
            }}
        >
            <button
                type="button"
                onClick={handleClick}
                disabled={uploading}
                title={
                    uploading
                        ? "Uploading..."
                        : "Attach file"
                }
                className="input-icon"
                style={{
                    opacity:
                        uploading
                            ? 0.5
                            : 1,
                    cursor:
                        uploading
                            ? "not-allowed"
                            : "pointer",
                }}
            >
                {uploading ? (
                    "⏳"
                ) : (
                    <Paperclip
                        size={20}
                    />
                )}
            </button>

            <input
                ref={fileInputRef}
                type="file"
                onChange={
                    handleFileChange
                }
                style={{
                    display: "none",
                }}
            />

            {error && (
                <div
                    style={{
                        position:
                            "absolute",
                        bottom:
                            "45px",
                        left: "0",
                        width: "220px",
                        padding: "8px 10px",
                        borderRadius:
                            "8px",
                        background:
                            "#fee2e2",
                        color:
                            "#b91c1c",
                        fontSize:
                            "12px",
                        zIndex: 100,
                        boxShadow:
                            "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                >
                    {error}
                </div>
            )}
        </div>
    );
};

export default FileUploadButton;