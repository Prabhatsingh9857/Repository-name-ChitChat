const API_URL =
    "https://chitchat-backend-dpbp.onrender.com";

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

    // ========================================
    // CREATE FORM DATA
    // ========================================

    const formData = new FormData();

    formData.append(
        "conversationId",
        conversationId
    );

    formData.append(
        "file",
        file
    );

    // ========================================
    // SEND FILE TO BACKEND
    // ========================================

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

    // ========================================
    // READ SERVER RESPONSE
    // ========================================

    let data;

    try {
        data = await response.json();
    } catch (error) {
        console.error(
            "Invalid server response:",
            error
        );

        throw new Error(
            "Server returned an invalid response."
        );
    }

    // ========================================
    // HANDLE SERVER ERROR
    // ========================================

    if (!response.ok) {
        console.error(
            "File upload failed:",
            data
        );

        throw new Error(
            data?.message ||
                data?.error ||
                "Failed to send file."
        );
    }

    // ========================================
    // CHECK RESPONSE DATA
    // ========================================

    if (!data?.data) {
        console.error(
            "File uploaded but message data is missing:",
            data
        );

        throw new Error(
            "File uploaded, but message information was not returned."
        );
    }

    // ========================================
    // RETURN MESSAGE
    // ========================================

    console.log(
        "File message created successfully:",
        data.data
    );

    return data.data;
};