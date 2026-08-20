import React from "react";
import {
    X,
    Reply,
    FileText,
    Image as ImageIcon,
} from "lucide-react";

const ReplyPreview = ({
    message,
    onCancel,
}) => {
    if (!message) {
        return null;
    }

    const senderName =
        message.sender?.username ||
        message.sender?.name ||
        "User";

    const getPreview = () => {
        // IMAGE
        if (
            message.messageType === "image" ||
            message.imageUrl
        ) {
            return (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                >
                    <ImageIcon size={15} />
                    <span>Photo</span>
                </div>
            );
        }

        // FILE
        if (
            message.messageType === "file" ||
            message.fileUrl
        ) {
            return (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                >
                    <FileText size={15} />
                    <span>
                        {message.fileName ||
                            "Attached file"}
                    </span>
                </div>
            );
        }

        // TEXT / EMOJI
        return (
            message.text ||
            "Message"
        );
    };

    return (
        <div
            style={{
                width: "100%",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 14px",
                background: "#ffffff",
                borderTop:
                    "1px solid #e5e7eb",
                borderBottom:
                    "1px solid #e5e7eb",
            }}
        >
            {/* REPLY ICON */}

            <div
                style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    background: "#eef2ff",
                    color: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                <Reply size={18} />
            </div>

            {/* CONTENT */}

            <div
                style={{
                    flex: 1,
                    minWidth: 0,
                }}
            >
                <div
                    style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#6366f1",
                        marginBottom: "2px",
                    }}
                >
                    Replying to {senderName}
                </div>

                <div
                    style={{
                        fontSize: "13px",
                        color: "#6b7280",
                        overflow: "hidden",
                        textOverflow:
                            "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                    title={
                        message.text ||
                        message.fileName ||
                        "Message"
                    }
                >
                    {getPreview()}
                </div>
            </div>

            {/* CANCEL */}

            <button
                type="button"
                onClick={onCancel}
                title="Cancel reply"
                style={{
                    width: "32px",
                    height: "32px",
                    border: "none",
                    background:
                        "transparent",
                    borderRadius: "50%",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#6b7280",
                    flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                        "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                        "transparent";
                }}
            >
                <X size={18} />
            </button>
        </div>
    );
};

export default ReplyPreview;