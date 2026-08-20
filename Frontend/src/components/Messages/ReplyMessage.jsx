import React from "react";
import {
    FileText,
    Image as ImageIcon,
} from "lucide-react";

const ReplyMessage = ({ replyTo, isOwn = false }) => {
    if (!replyTo) {
        return null;
    }

    const senderName =
        replyTo.sender?.username ||
        replyTo.sender?.name ||
        "User";

    const getPreviewContent = () => {
        // IMAGE
        if (
            replyTo.messageType === "image" ||
            replyTo.imageUrl
        ) {
            return (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                >
                    <ImageIcon size={14} />
                    <span>Photo</span>
                </div>
            );
        }

        // FILE
        if (
            replyTo.messageType === "file" ||
            replyTo.fileUrl
        ) {
            return (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                >
                    <FileText size={14} />
                    <span>
                        {replyTo.fileName ||
                            "Attached file"}
                    </span>
                </div>
            );
        }

        // TEXT / EMOJI
        return (
            replyTo.text ||
            "Message"
        );
    };

    return (
        <div
            style={{
                marginBottom: "8px",
                padding: "7px 10px",
                borderLeft: `3px solid ${
                    isOwn
                        ? "rgba(255,255,255,0.8)"
                        : "#6366f1"
                }`,
                borderRadius: "6px",
                background: isOwn
                    ? "rgba(255,255,255,0.12)"
                    : "#f3f4f6",
                maxWidth: "100%",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    marginBottom: "3px",
                    color: isOwn
                        ? "#ffffff"
                        : "#4f46e5",
                }}
            >
                {senderName}
            </div>

            <div
                style={{
                    fontSize: "13px",
                    opacity: 0.85,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                }}
                title={
                    replyTo.text ||
                    replyTo.fileName ||
                    "Message"
                }
            >
                {getPreviewContent()}
            </div>
        </div>
    );
};

export default ReplyMessage;