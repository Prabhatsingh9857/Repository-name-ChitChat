import React from "react";
import { Edit3, Reply, Trash2 } from "lucide-react";

const MessageActions = ({
    message,
    isOwn,
    onReply,
    onEdit,
    onDelete,
}) => {
    if (!message) {
        return null;
    }

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "4px",
                boxShadow:
                    "0 4px 12px rgba(0,0,0,0.10)",
            }}
        >
            {/* REPLY */}
            <button
                type="button"
                onClick={() => onReply?.(message)}
                title="Reply"
                style={{
                    width: "32px",
                    height: "32px",
                    border: "none",
                    background: "transparent",
                    borderRadius: "7px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#374151",
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
                <Reply size={17} />
            </button>

            {/* EDIT - OWN MESSAGES ONLY */}
            {isOwn && (
                <button
                    type="button"
                    onClick={() => onEdit?.(message)}
                    title="Edit"
                    style={{
                        width: "32px",
                        height: "32px",
                        border: "none",
                        background: "transparent",
                        borderRadius: "7px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#374151",
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
                    <Edit3 size={16} />
                </button>
            )}

            {/* DELETE - OWN MESSAGES ONLY */}
            {isOwn && (
                <button
                    type="button"
                    onClick={() => onDelete?.(message)}
                    title="Delete"
                    style={{
                        width: "32px",
                        height: "32px",
                        border: "none",
                        background: "transparent",
                        borderRadius: "7px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ef4444",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                            "#fef2f2";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                            "transparent";
                    }}
                >
                    <Trash2 size={16} />
                </button>
            )}
        </div>
    );
};

export default MessageActions;