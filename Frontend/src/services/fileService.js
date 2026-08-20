const API_URL = "http://localhost:5000";

// ========================================
// SEND FILE MESSAGE
// ========================================

export const sendFileMessage = async (
    file,
    conversationId,
    token
) => {
    if (!file) {
        throw new Error("Please select a file.");
    }

    if (!conversationId) {
        throw new Error(
            "Conversation ID is required."
        );
    }

    if (!token) {
        throw new Error(
            "Authentication token is missing."
        );
    }

    // ====================================
    // CREATE FORM DATA
    // ====================================

    const formData = new FormData();

    formData.append(
        "conversationId",
        conversationId
    );

    formData.append(
        "file",
        file
    );

    // ====================================
    // SEND TO BACKEND
    // ====================================

    const response = await fetch(
        `${API_URL}/api/messages/file`,
        {
            method: "POST",

            headers: {
                Authorization: `Bearer ${token}`,
            },

            body: formData,
        }
    );

    // ====================================
    // READ RESPONSE
    // ====================================

    let data;

    try {
        data = await response.json();
    } catch (error) {
        throw new Error(
            "Server returned an invalid response."
        );
    }

    // ====================================
    // HANDLE ERROR
    // ====================================

    if (!response.ok) {
        throw new Error(
            data.message ||
                "Failed to send file."
        );
    }

    // ====================================
    // RETURN MESSAGE
    // ====================================

    return data.data;
};