import {
    useEffect,
    useRef,
    useState,
} from "react";

import socket from "./socket/socket";
import Login from "./Login";
import Register from "./Register";
import FileMessages from "./components/Messages/FileMessages";

import "./App.css";

// ========================================
// API
// ========================================

const API_URL = "https://chitchat-backend-dpbp.onrender.com";

// ========================================
// IMAGE / FILE URL HELPER
// ========================================

const getFileUrl = (filePath) => {
    if (!filePath) {
        return "";
    }

    if (
        filePath.startsWith("data:") ||
        filePath.startsWith("blob:")
    ) {
        return filePath;
    }

    if (
        filePath.startsWith("http://") ||
        filePath.startsWith("https://")
    ) {
        return filePath;
    }

    if (filePath.startsWith("/")) {
        return `${API_URL}${filePath}`;
    }

    return `${API_URL}/${filePath}`;
};

const getImageUrl = getFileUrl;

// ========================================
// MESSAGE MENU STYLE
// ========================================

const messageMenuItemStyle = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 11px",
    border: "none",
    borderRadius: "9px",
    background: "transparent",
    color: "#111827",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    textAlign: "left",
};


const EMOJI_LIST = [
    "😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃",
    "😉","😍","🥰","😘","😋","😛","😜","🤪","🤨","🤓","😎","🥳",
    "😏","😒","😞","😔","😟","😕","🙁","😣","😖","😫","😩","🥺",
    "😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨",
    "😰","😥","😓","🤗","🤔","🤭","🤫","😶","😐","😑","😬","🙄",
    "😮","😲","🥱","😴","🤤","😪","😵","🤐","🤢","🤮","🤧","😷",
    "🤠","😈","👿","💀","👻","🤖","💩","🔥","❤️","🧡","💛","💚",
    "💙","💜","🖤","🤍","🤎","💔","💕","💞","💓","💗","💖","💘",
    "💝","👍","👎","👏","🙌","🙏","🤝","💪","👌","✌️","🤞","🤟",
    "🤘","👋","🫶","👀","🎉","🎊","✨","⭐","🌟","💯"
];

// ========================================
// APP
// ========================================

function App() {
    // ========================================
    // CURRENT USER
    // ========================================

    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const savedUser =
                localStorage.getItem("user") ||
                sessionStorage.getItem("user");

            return savedUser
                ? JSON.parse(savedUser)
                : null;
        } catch (error) {
            console.error(
                "User data error:",
                error
            );

            return null;
        }
    });

    // ========================================
    // AUTH
    // ========================================

    const [showRegister, setShowRegister] =
        useState(false);

    // ========================================
    // SOCKET
    // ========================================

    const [connected, setConnected] =
        useState(false);

    // ========================================
    // MESSAGE
    // ========================================

    const [message, setMessage] =
        useState("");

    // ========================================
    // EMOJI PICKER
    // ========================================

    const [showEmojiPicker, setShowEmojiPicker] =
        useState(false);

    const [messages, setMessages] =
        useState([]);

    // ========================================
    // REPLY
    // ========================================

    const [replyingTo, setReplyingTo] =
        useState(null);

    // ========================================
    // FORWARD MESSAGE
    // ========================================

    const [forwardingMessage, setForwardingMessage] =
        useState(null);

    const [forwarding, setForwarding] =
        useState(false);

    // ========================================
    // MESSAGE OPTIONS MENU
    // ========================================

    const [openMessageMenuId, setOpenMessageMenuId] =
        useState(null);

    const [starredMessageIds, setStarredMessageIds] =
        useState([]);

    const [selectedMessageIds, setSelectedMessageIds] =
        useState([]);

    // ========================================
    // ATTACHMENT
    // ========================================

    const [selectedFile, setSelectedFile] =
        useState(null);

    const [filePreview, setFilePreview] =
        useState("");

    const [fileUploading, setFileUploading] =
        useState(false);

    // ========================================
    // CAMERA
    // ========================================

    const [showCamera, setShowCamera] =
        useState(false);

    const [cameraStream, setCameraStream] =
        useState(null);

    const [cameraError, setCameraError] =
        useState("");

    // ========================================
    // VOICE RECORDING
    // ========================================

    const [isRecording, setIsRecording] =
        useState(false);

    const [recordingTime, setRecordingTime] =
        useState(0);

    const [audioUploading, setAudioUploading] =
        useState(false);

    const [recordingError, setRecordingError] =
        useState("");

    const mediaRecorderRef =
        useRef(null);

    const recordingStreamRef =
        useRef(null);

    const recordingChunksRef =
        useRef([]);

    const recordingTimerRef =
        useRef(null);

    const fileInputRef =
        useRef(null);

    // ========================================
    // CONVERSATIONS
    // ========================================

    const [conversations, setConversations] =
        useState([]);

    const [
        selectedConversation,
        setSelectedConversation,
    ] = useState(null);

    // ========================================
    // LOADING
    // ========================================

    const [
        loadingConversations,
        setLoadingConversations,
    ] = useState(true);

    const [
        loadingMessages,
        setLoadingMessages,
    ] = useState(false);

    // ========================================
    // TYPING
    // ========================================

    const [typingUser, setTypingUser] =
        useState("");

    // ========================================
    // ONLINE USERS
    // ========================================

    const [onlineUserIds, setOnlineUserIds] =
        useState([]);

    // ========================================
    // UNREAD
    // ========================================

    const [unreadCounts, setUnreadCounts] =
        useState({});

    // ========================================
    // SEARCH
    // ========================================

    const [searchText, setSearchText] =
        useState("");

    const [searchResults, setSearchResults] =
        useState([]);

    const [searchLoading, setSearchLoading] =
        useState(false);

    // ========================================
    // PROFILE
    // ========================================

    const [showProfile, setShowProfile] =
        useState(false);

    const [editingProfile, setEditingProfile] =
        useState(false);

    const [profileUsername, setProfileUsername] =
        useState("");

    const [profileBio, setProfileBio] =
        useState("");

    const [profilePicture, setProfilePicture] =
        useState("");

    const [profileFile, setProfileFile] =
        useState(null);

    const [profilePreview, setProfilePreview] =
        useState("");

    const [profileLoading, setProfileLoading] =
        useState(false);

    const [profileError, setProfileError] =
        useState("");

    const [profileSuccess, setProfileSuccess] =
        useState("");

    const [
        removeCurrentPicture,
        setRemoveCurrentPicture,
    ] = useState(false);

    // ========================================
    // REFS
    // ========================================

    const messagesEndRef =
        useRef(null);

    const typingTimeoutRef =
        useRef(null);

    const emojiPickerRef =
        useRef(null);

    const cameraVideoRef =
        useRef(null);

    const cameraCanvasRef =
        useRef(null);

    // ========================================
    // TOKEN
    // ========================================

    const getToken = () => {
        return (
            localStorage.getItem("token") ||
            sessionStorage.getItem("token")
        );
    };

    // ========================================
    // CURRENT USER ID
    // ========================================

    const getCurrentUserId = () => {
        return (
            currentUser?.id?.toString() ||
            currentUser?._id?.toString() ||
            ""
        );
    };

    // ========================================
    // SAVE USER
    // ========================================

    const saveUser = (user) => {
        if (!user) {
            return;
        }

        setCurrentUser(user);

        const savedUser =
            JSON.stringify(user);

        if (localStorage.getItem("token")) {
            localStorage.setItem(
                "user",
                savedUser
            );
        }

        if (sessionStorage.getItem("token")) {
            sessionStorage.setItem(
                "user",
                savedUser
            );
        }
    };

    // ========================================
    // PROFILE REFRESH
    // ========================================

    useEffect(() => {
        if (!currentUser) {
            return;
        }

        const loadCurrentProfile =
            async () => {
                try {
                    const token =
                        getToken();

                    if (!token) {
                        return;
                    }

                    const response =
                        await fetch(
                            `${API_URL}/api/users/profile`,
                            {
                                method: "GET",
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`,
                                    "Content-Type":
                                        "application/json",
                                },
                            }
                        );

                    const data =
                        await response.json();

                    if (
                        response.ok &&
                        data.user
                    ) {
                        saveUser(
                            data.user
                        );
                    }
                } catch (error) {
                    console.error(
                        "Profile loading error:",
                        error
                    );
                }
            };

        loadCurrentProfile();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser?._id]);

    // ========================================
    // OTHER PARTICIPANT
    // ========================================

    const getOtherParticipant = (
        conversation
    ) => {
        if (
            !conversation ||
            !Array.isArray(
                conversation.participants
            )
        ) {
            return null;
        }

        const currentUserId =
            getCurrentUserId();

        return (
            conversation.participants.find(
                (participant) => {
                    const id =
                        participant?._id?.toString();

                    return (
                        id &&
                        id !== currentUserId
                    );
                }
            ) || null
        );
    };

    // ========================================
    // LOAD CONVERSATIONS
    // ========================================

    useEffect(() => {
        if (!currentUser) {
            setLoadingConversations(false);
            return;
        }

        const loadConversations =
            async () => {
                try {
                    setLoadingConversations(
                        true
                    );

                    const token =
                        getToken();

                    if (!token) {
                        setLoadingConversations(
                            false
                        );

                        return;
                    }

                    const response =
                        await fetch(
                            `${API_URL}/api/conversations`,
                            {
                                method: "GET",
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`,
                                    "Content-Type":
                                        "application/json",
                                },
                            }
                        );

                    const data =
                        await response.json();

                    if (!response.ok) {
                        console.error(
                            "Conversation loading error:",
                            data
                        );

                        return;
                    }

                    const loaded =
                        Array.isArray(
                            data.conversations
                        )
                            ? data.conversations
                            : [];

                    setConversations(
                        loaded
                    );

                    if (
                        loaded.length > 0
                    ) {
                        setSelectedConversation(
                            (previous) =>
                                previous
                                    ? loaded.find(
                                          (
                                              item
                                          ) =>
                                              item?._id?.toString() ===
                                              previous?._id?.toString()
                                      ) ||
                                      loaded[0]
                                    : loaded[0]
                        );
                    } else {
                        setSelectedConversation(
                            null
                        );
                    }
                } catch (error) {
                    console.error(
                        "Conversation loading error:",
                        error
                    );
                } finally {
                    setLoadingConversations(
                        false
                    );
                }
            };

        loadConversations();
    }, [currentUser]);

    // ========================================
    // SELECTED CONVERSATION
    // ========================================

    const conversationId =
        selectedConversation?._id?.toString() ||
        null;

    const otherUser =
        getOtherParticipant(
            selectedConversation
        );

    const otherUserId =
        otherUser?._id?.toString() ||
        null;

    // ========================================
    // CLEAR ATTACHMENT
    // ========================================

    const clearSelectedFile = () => {
        setSelectedFile(null);
        setFilePreview("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // ========================================
    // CAMERA - OPEN
    // ========================================

    const openCamera = async () => {
        if (
            !selectedConversation ||
            loadingMessages ||
            fileUploading
        ) {
            return;
        }

        // Always release any previous camera stream first.
        if (cameraStream) {
            cameraStream.getTracks().forEach((track) => {
                track.stop();
            });

            setCameraStream(null);
        }

        setCameraError("");
        setShowCamera(true);

        try {
            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {
                setCameraError(
                    "Camera is not supported by this browser."
                );

                return;
            }

            console.log("Requesting camera permission...");

            // Keep the request simple so the browser can choose
            // the available camera instead of forcing a device.
            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false,
                });

            const videoTrack =
                stream.getVideoTracks()[0];

            if (!videoTrack) {
                stream.getTracks().forEach((track) => {
                    track.stop();
                });

                setCameraError(
                    "No video camera was found on this computer."
                );

                return;
            }

            console.log(
                "Camera opened successfully:",
                videoTrack.label
            );

            setCameraStream(stream);
        } catch (error) {
            console.error(
                "Camera opening error:",
                error
            );

            if (
                error?.name ===
                "NotAllowedError"
            ) {
                setCameraError(
                    "Camera permission was denied. Allow camera access for localhost and try again."
                );
            } else if (
                error?.name ===
                "NotFoundError"
            ) {
                setCameraError(
                    "No camera was found on this computer."
                );
            } else if (
                error?.name ===
                "NotReadableError"
            ) {
                setCameraError(
                    "The camera is currently being used by another application. Close Windows Camera, Zoom, Teams, Google Meet, WhatsApp, OBS, or another browser tab using the camera, then try again."
                );
            } else if (
                error?.name ===
                "SecurityError"
            ) {
                setCameraError(
                    "The browser blocked camera access for security reasons."
                );
            } else {
                setCameraError(
                    `Unable to open camera: ${
                        error?.message ||
                        "Unknown error"
                    }`
                );
            }
        }
    };

    // ========================================
    // CAMERA - CONNECT VIDEO STREAM
    // ========================================

    useEffect(() => {
        if (
            !showCamera ||
            !cameraStream ||
            !cameraVideoRef.current
        ) {
            return;
        }

        const video =
            cameraVideoRef.current;

        video.srcObject =
            cameraStream;

        video.play().catch(() => {});

        return () => {
            if (
                video.srcObject ===
                cameraStream
            ) {
                video.srcObject = null;
            }
        };
    }, [
        showCamera,
        cameraStream,
    ]);

    // ========================================
    // CAMERA - CLOSE
    // ========================================

    const closeCamera = () => {
        console.log("Closing camera...");

        if (cameraStream) {
            cameraStream.getTracks().forEach((track) => {
                console.log(
                    "Stopping camera track:",
                    track.label
                );

                track.stop();
            });
        }

        if (cameraVideoRef.current) {
            cameraVideoRef.current.pause();
            cameraVideoRef.current.srcObject = null;
        }

        setCameraStream(null);
        setShowCamera(false);
        setCameraError("");
    };

    // ========================================
    // CAMERA - CAPTURE PHOTO
    // ========================================

    const capturePhoto = () => {
        const video =
            cameraVideoRef.current;

        const canvas =
            cameraCanvasRef.current;

        if (
            !video ||
            !canvas
        ) {
            return;
        }

        if (
            video.videoWidth <= 0 ||
            video.videoHeight <= 0
        ) {
            alert(
                "Camera is not ready yet. Please wait a moment and try again."
            );

            return;
        }

        canvas.width =
            video.videoWidth;

        canvas.height =
            video.videoHeight;

        const context =
            canvas.getContext("2d");

        if (!context) {
            alert(
                "Unable to capture the photo."
            );

            return;
        }

        // Mirror the captured photo when
        // using the front camera, matching
        // the preview users see.
        context.save();
        context.translate(
            canvas.width,
            0
        );
        context.scale(-1, 1);

        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );

        context.restore();

        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    alert(
                        "Unable to capture the photo."
                    );

                    return;
                }

                const file =
                    new File(
                        [
                            blob,
                        ],
                        `camera-${Date.now()}.jpg`,
                        {
                            type:
                                "image/jpeg",
                            lastModified:
                                Date.now(),
                        }
                    );

                // Put the captured photo into
                // the same selected-file flow
                // already used by attachments.
                setSelectedFile(file);

                const reader =
                    new FileReader();

                reader.onload = () => {
                    setFilePreview(
                        reader.result
                    );
                };

                reader.onerror = () => {
                    setFilePreview("");
                };

                reader.readAsDataURL(file);

                closeCamera();
            },
            "image/jpeg",
            0.9
        );
    };

    // ========================================
    // CAMERA - CLEANUP
    // ========================================

    useEffect(() => {
        return () => {
            if (cameraStream) {
                cameraStream
                    .getTracks()
                    .forEach((track) => {
                        track.stop();
                    });
            }
        };
    }, [cameraStream]);

    // ========================================
    // LOAD MESSAGES + SOCKET
    // ========================================

    useEffect(() => {
        if (
            !currentUser ||
            !conversationId
        ) {
            setMessages([]);
            setLoadingMessages(false);
            setTypingUser("");

            return;
        }

        let mounted = true;

        const token = getToken();

        setMessages([]);
        setLoadingMessages(true);
        setTypingUser("");
        clearSelectedFile();

        // ====================================
        // LOAD OLD MESSAGES
        // ====================================

        const loadMessages =
            async () => {
                try {
                    if (!token) {
                        return;
                    }

                    const response =
                        await fetch(
                            `${API_URL}/api/messages/${conversationId}`,
                            {
                                method: "GET",
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`,
                                    "Content-Type":
                                        "application/json",
                                },
                            }
                        );

                    const data =
                        await response.json();

                    if (!response.ok) {
                        console.error(
                            "Message loading error:",
                            data
                        );

                        return;
                    }

                    if (mounted) {
                        setMessages(
                            Array.isArray(
                                data.messages
                            )
                                ? data.messages
                                : []
                        );
                    }
                } catch (error) {
                    console.error(
                        "Messages loading error:",
                        error
                    );
                } finally {
                    if (mounted) {
                        setLoadingMessages(
                            false
                        );
                    }
                }
            };

        loadMessages();

        // ====================================
        // SOCKET CONNECT
        // ====================================

        socket.connect();

        // ====================================
        // CONNECT
        // ====================================

        const handleConnect =
            () => {
                console.log(
                    "Socket connected:",
                    socket.id
                );

                const userId =
                    getCurrentUserId();

                if (!userId) {
                    return;
                }

                socket.emit(
                    "authenticate",
                    userId
                );

                socket.emit(
                    "joinConversation",
                    conversationId
                );

                socket.emit(
                    "markConversationRead",
                    {
                        conversationId,
                    }
                );

                setConnected(true);
            };

        // ====================================
        // ONLINE USERS
        // ====================================

        const handleOnlineUsers =
            (userIds) => {
                if (
                    !Array.isArray(
                        userIds
                    )
                ) {
                    return;
                }

                setOnlineUserIds(
                    userIds.map(
                        (id) =>
                            id.toString()
                    )
                );
            };

        // ====================================
        // RECEIVE MESSAGE
        // ====================================

        const handleReceiveMessage =
            (receivedMessage) => {
                if (
                    !mounted ||
                    !receivedMessage
                ) {
                    return;
                }

                const receivedConversationId =
                    receivedMessage
                        ?.conversationId
                        ?.toString();

                if (
                    receivedConversationId &&
                    receivedConversationId !==
                        conversationId
                ) {
                    return;
                }

                setTypingUser("");

                setMessages(
                    (previous) => {
                        const exists =
                            previous.some(
                                (msg) =>
                                    msg?._id?.toString() ===
                                    receivedMessage?._id?.toString()
                            );

                        if (exists) {
                            return previous;
                        }

                        return [
                            ...previous,
                            receivedMessage,
                        ];
                    }
                );

                setConversations(
                    (previous) =>
                        previous.map(
                            (
                                conversation
                            ) => {
                                if (
                                    conversation?._id?.toString() !==
                                    receivedConversationId
                                ) {
                                    return conversation;
                                }

                                return {
                                    ...conversation,
                                    lastMessage:
                                        receivedMessage,
                                    updatedAt:
                                        receivedMessage.createdAt,
                                };
                            }
                        )
                );

                const senderId =
                    receivedMessage
                        ?.sender?._id
                        ?.toString();

                const myId =
                    getCurrentUserId();

                if (
                    senderId &&
                    senderId !== myId
                ) {
                    socket.emit(
                        "markConversationRead",
                        {
                            conversationId,
                        }
                    );
                }
            };

        // ====================================
        // NOTIFICATION
        // ====================================

        const handleNewMessageNotification =
            (receivedMessage) => {
                if (
                    !receivedMessage
                ) {
                    return;
                }

                const id =
                    receivedMessage
                        ?.conversationId
                        ?.toString();

                if (!id) {
                    return;
                }

                if (
                    id ===
                    conversationId
                ) {
                    return;
                }

                setUnreadCounts(
                    (previous) => ({
                        ...previous,
                        [id]:
                            (previous[id] ||
                                0) + 1,
                    })
                );

                setConversations(
                    (previous) => {
                        const index =
                            previous.findIndex(
                                (conversation) =>
                                    conversation?._id?.toString() ===
                                    id
                            );

                        if (
                            index === -1
                        ) {
                            return previous;
                        }

                        const updated = {
                            ...previous[index],
                            lastMessage:
                                receivedMessage,
                            updatedAt:
                                receivedMessage.createdAt,
                        };

                        return [
                            updated,
                            ...previous.filter(
                                (
                                    conversation
                                ) =>
                                    conversation?._id?.toString() !==
                                    id
                            ),
                        ];
                    }
                );
            };

        // ====================================
        // TYPING
        // ====================================

        const handleUserTyping =
            ({
                userId,
                username,
            } = {}) => {
                if (!userId) {
                    return;
                }

                const id =
                    userId.toString();

                if (
                    id ===
                    getCurrentUserId()
                ) {
                    return;
                }

                if (
                    otherUserId &&
                    id !== otherUserId
                ) {
                    return;
                }

                setTypingUser(
                    username ||
                        otherUser?.username ||
                        "Someone"
                );
            };

        // ====================================
        // STOP TYPING
        // ====================================

        const handleUserStoppedTyping =
            ({
                userId,
            } = {}) => {
                if (
                    userId &&
                    userId.toString() ===
                        getCurrentUserId()
                ) {
                    return;
                }

                setTypingUser("");
            };

        // ====================================
        // USER ONLINE
        // ====================================

        const handleUserOnline =
            ({
                userId,
            } = {}) => {
                if (!userId) {
                    return;
                }

                const id =
                    userId.toString();

                setOnlineUserIds(
                    (previous) => {
                        if (
                            previous.includes(
                                id
                            )
                        ) {
                            return previous;
                        }

                        return [
                            ...previous,
                            id,
                        ];
                    }
                );
            };

        // ====================================
        // USER OFFLINE
        // ====================================

        const handleUserOffline =
            ({
                userId,
            } = {}) => {
                if (!userId) {
                    return;
                }

                const id =
                    userId.toString();

                setOnlineUserIds(
                    (previous) =>
                        previous.filter(
                            (
                                existingId
                            ) =>
                                existingId !==
                                id
                        )
                );

                if (
                    id ===
                    otherUserId
                ) {
                    setTypingUser("");
                }
            };

        // ====================================
        // PROFILE UPDATED
        // ====================================

        const handleProfileUpdated =
            ({
                user,
            } = {}) => {
                if (!user?._id) {
                    return;
                }

                const updatedUserId =
                    user._id.toString();

                if (
                    updatedUserId ===
                    getCurrentUserId()
                ) {
                    saveUser(user);

                    setProfileUsername(
                        user.username ||
                            ""
                    );

                    setProfileBio(
                        user.bio || ""
                    );

                    setProfilePicture(
                        user.profilePicture ||
                            ""
                    );

                    setProfilePreview(
                        getImageUrl(
                            user.profilePicture
                        )
                    );
                }

                setConversations(
                    (previous) =>
                        previous.map(
                            (
                                conversation
                            ) => {
                                if (
                                    !Array.isArray(
                                        conversation.participants
                                    )
                                ) {
                                    return conversation;
                                }

                                return {
                                    ...conversation,
                                    participants:
                                        conversation.participants.map(
                                            (
                                                participant
                                            ) => {
                                                const participantId =
                                                    participant?._id?.toString();

                                                if (
                                                    participantId !==
                                                    updatedUserId
                                                ) {
                                                    return participant;
                                                }

                                                return {
                                                    ...participant,
                                                    ...user,
                                                };
                                            }
                                        ),
                                };
                            }
                        )
                );

                setSelectedConversation(
                    (previous) => {
                        if (
                            !previous ||
                            !Array.isArray(
                                previous.participants
                            )
                        ) {
                            return previous;
                        }

                        return {
                            ...previous,
                            participants:
                                previous.participants.map(
                                    (
                                        participant
                                    ) => {
                                        const participantId =
                                            participant?._id?.toString();

                                        if (
                                            participantId !==
                                            updatedUserId
                                        ) {
                                            return participant;
                                        }

                                        return {
                                            ...participant,
                                            ...user,
                                        };
                                    }
                                ),
                        };
                    }
                );

                setSearchResults(
                    (previous) =>
                        previous.map(
                            (
                                searchUser
                            ) =>
                                searchUser?._id?.toString() ===
                                updatedUserId
                                    ? {
                                          ...searchUser,
                                          ...user,
                                      }
                                    : searchUser
                        )
                );

                setMessages(
                    (previous) =>
                        previous.map(
                            (msg) => {
                                const senderId =
                                    msg?.sender?._id?.toString();

                                if (
                                    senderId !==
                                    updatedUserId
                                ) {
                                    return msg;
                                }

                                return {
                                    ...msg,
                                    sender: {
                                        ...msg.sender,
                                        ...user,
                                    },
                                };
                            }
                        )
                );
            };

        // ====================================
        // MESSAGE DELETED
        // ====================================

        const handleMessageDeleted =
            ({
                messageId,
                conversationId:
                    deletedConversationId,
            } = {}) => {
                if (!messageId) {
                    return;
                }

                if (
                    deletedConversationId &&
                    deletedConversationId.toString() !==
                        conversationId.toString()
                ) {
                    return;
                }

                setMessages(
                    (previous) =>
                        previous.filter(
                            (msg) =>
                                msg?._id?.toString() !==
                                messageId.toString()
                        )
                );
            };

        // ====================================
        // MESSAGE PINNED
        // ====================================

        const handleMessagePinned =
            ({
                messageId,
                conversationId:
                    pinnedConversationId,
                pinnedAt,
                pinnedBy,
            } = {}) => {
                if (!messageId) {
                    return;
                }

                if (
                    pinnedConversationId &&
                    pinnedConversationId.toString() !==
                        conversationId.toString()
                ) {
                    return;
                }

                setMessages(
                    (previous) =>
                        previous.map(
                            (msg) =>
                                msg?._id?.toString() ===
                                messageId.toString()
                                    ? {
                                          ...msg,
                                          pinned: true,
                                          pinnedAt:
                                              pinnedAt ||
                                              new Date().toISOString(),
                                          pinnedBy:
                                              pinnedBy ||
                                              null,
                                      }
                                    : msg
                        )
                );
            };

        // ====================================
        // MESSAGE UNPINNED
        // ====================================

        const handleMessageUnpinned =
            ({
                messageId,
                conversationId:
                    unpinnedConversationId,
            } = {}) => {
                if (!messageId) {
                    return;
                }

                if (
                    unpinnedConversationId &&
                    unpinnedConversationId.toString() !==
                        conversationId.toString()
                ) {
                    return;
                }

                setMessages(
                    (previous) =>
                        previous.map(
                            (msg) =>
                                msg?._id?.toString() ===
                                messageId.toString()
                                    ? {
                                          ...msg,
                                          pinned: false,
                                          pinnedAt: null,
                                          pinnedBy: null,
                                      }
                                    : msg
                        )
                );
            };

        // ====================================
        // MESSAGE FORWARDED
        // ====================================

        const handleMessageForwarded =
            ({
                originalMessageId,
                newMessage,
                targetConversationId,
            } = {}) => {
                if (!newMessage?._id) {
                    setForwarding(false);
                    return;
                }

                const targetId =
                    targetConversationId?.toString() ||
                    newMessage?.conversationId?.toString();

                if (!targetId) {
                    setForwarding(false);
                    return;
                }

                // Update the conversation preview/order.
                setConversations((previous) => {
                    const index = previous.findIndex(
                        (item) =>
                            item?._id?.toString() === targetId
                    );

                    if (index === -1) {
                        return previous;
                    }

                    const updatedConversation = {
                        ...previous[index],
                        lastMessage: newMessage,
                        updatedAt:
                            newMessage.createdAt ||
                            new Date().toISOString(),
                    };

                    return [
                        updatedConversation,
                        ...previous.filter(
                            (item) =>
                                item?._id?.toString() !== targetId
                        ),
                    ];
                });

                // If the target conversation is NOT currently open,
                // increment its unread count because the server does
                // not send newMessageNotification back to the sender.
                if (
                    targetId !==
                    conversationId?.toString()
                ) {
                    setUnreadCounts((previous) => ({
                        ...previous,
                        [targetId]:
                            (previous[targetId] || 0) + 1,
                    }));
                }

                setForwarding(false);
                setForwardingMessage(null);

                console.log(
                    "Message forwarded successfully:",
                    originalMessageId,
                    "->",
                    targetId
                );
            };

        // ====================================
        // FORWARD ERROR
        // ====================================

        const handleForwardMessageError =
            ({ message } = {}) => {
                setForwarding(false);

                alert(
                    message ||
                        "Unable to forward message."
                );
            };

        // ====================================
        // DELIVERED
        // ====================================

        const handleMessageDelivered =
            ({
                messageId,
                deliveredAt,
            } = {}) => {
                if (!messageId) {
                    return;
                }

                setMessages(
                    (previous) =>
                        previous.map(
                            (msg) =>
                                msg?._id?.toString() ===
                                messageId.toString()
                                    ? {
                                          ...msg,
                                          delivered:
                                              true,
                                          deliveredAt,
                                      }
                                    : msg
                        )
                );
            };

        // ====================================
        // READ
        // ====================================

        const handleMessageRead =
            ({
                messageId,
                readAt,
            } = {}) => {
                if (!messageId) {
                    return;
                }

                setMessages(
                    (previous) =>
                        previous.map(
                            (msg) =>
                                msg?._id?.toString() ===
                                messageId.toString()
                                    ? {
                                          ...msg,
                                          read: true,
                                          readAt,
                                          delivered:
                                              true,
                                          deliveredAt:
                                              msg.deliveredAt ||
                                              readAt,
                                      }
                                    : msg
                        )
                );
            };

        // ====================================
        // CONVERSATION READ
        // ====================================

        const handleConversationRead =
            ({
                conversationId:
                    readConversationId,
            } = {}) => {
                if (
                    !readConversationId
                ) {
                    return;
                }

                const id =
                    readConversationId.toString();

                setUnreadCounts(
                    (previous) => {
                        const updated = {
                            ...previous,
                        };

                        delete updated[id];

                        return updated;
                    }
                );
            };

        // ====================================
        // DISCONNECT
        // ====================================

        const handleDisconnect =
            () => {
                setConnected(false);
                setTypingUser("");
            };

        // ====================================
        // LISTENERS
        // ====================================

        socket.on(
            "connect",
            handleConnect
        );

        socket.on(
            "onlineUsers",
            handleOnlineUsers
        );

        socket.on(
            "receiveMessage",
            handleReceiveMessage
        );

        socket.on(
            "newMessageNotification",
            handleNewMessageNotification
        );

        socket.on(
            "userTyping",
            handleUserTyping
        );

        socket.on(
            "userStoppedTyping",
            handleUserStoppedTyping
        );

        socket.on(
            "userOnline",
            handleUserOnline
        );

        socket.on(
            "userOffline",
            handleUserOffline
        );

        socket.on(
            "profileUpdated",
            handleProfileUpdated
        );

        socket.on(
            "messageDeleted",
            handleMessageDeleted
        );

        socket.on(
            "messagePinned",
            handleMessagePinned
        );

        socket.on(
            "messageUnpinned",
            handleMessageUnpinned
        );

        socket.on(
            "messageForwarded",
            handleMessageForwarded
        );

        socket.on(
            "forwardMessageError",
            handleForwardMessageError
        );

        socket.on(
            "messageDelivered",
            handleMessageDelivered
        );

        socket.on(
            "messageRead",
            handleMessageRead
        );

        socket.on(
            "conversationRead",
            handleConversationRead
        );

        socket.on(
            "disconnect",
            handleDisconnect
        );

        // ====================================
        // CLEANUP
        // ====================================

        return () => {
            mounted = false;

            if (
                typingTimeoutRef.current
            ) {
                clearTimeout(
                    typingTimeoutRef.current
                );

                typingTimeoutRef.current =
                    null;
            }

            socket.emit(
                "stopTyping",
                {
                    conversationId,
                }
            );

            socket.off(
                "connect",
                handleConnect
            );

            socket.off(
                "onlineUsers",
                handleOnlineUsers
            );

            socket.off(
                "receiveMessage",
                handleReceiveMessage
            );

            socket.off(
                "newMessageNotification",
                handleNewMessageNotification
            );

            socket.off(
                "userTyping",
                handleUserTyping
            );

            socket.off(
                "userStoppedTyping",
                handleUserStoppedTyping
            );

            socket.off(
                "userOnline",
                handleUserOnline
            );

            socket.off(
                "userOffline",
                handleUserOffline
            );

            socket.off(
                "profileUpdated",
                handleProfileUpdated
            );

            socket.off(
                "messageDeleted",
                handleMessageDeleted
            );

            socket.off(
                "messagePinned",
                handleMessagePinned
            );

            socket.off(
                "messageUnpinned",
                handleMessageUnpinned
            );

            socket.off(
                "messageForwarded",
                handleMessageForwarded
            );

            socket.off(
                "forwardMessageError",
                handleForwardMessageError
            );

            socket.off(
                "messageDelivered",
                handleMessageDelivered
            );

            socket.off(
                "messageRead",
                handleMessageRead
            );

            socket.off(
                "conversationRead",
                handleConversationRead
            );

            socket.off(
                "disconnect",
                handleDisconnect
            );

            socket.disconnect();

            setConnected(false);
        };
    }, [
        currentUser,
        conversationId,
        otherUserId,
    ]);

    // ========================================
    // CLOSE EMOJI PICKER ON OUTSIDE CLICK
    // ========================================

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(
                    event.target
                )
            ) {
                setShowEmojiPicker(false);
            }
        };

        if (showEmojiPicker) {
            document.addEventListener(
                "mousedown",
                handleOutsideClick
            );
        }

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
        };
    }, [showEmojiPicker]);

    // ========================================
    // CLOSE MESSAGE OPTIONS MENU ON OUTSIDE CLICK
    // ========================================

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                !event.target.closest(
                    ".message-options-container"
                )
            ) {
                setOpenMessageMenuId(null);
            }
        };

        if (openMessageMenuId) {
            document.addEventListener(
                "mousedown",
                handleOutsideClick
            );
        }

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
        };
    }, [openMessageMenuId]);

    // ========================================
    // AUTO SCROLL
    // ========================================

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [
        messages,
        typingUser,
    ]);

    // ========================================
    // SEARCH USERS
    // ========================================

    useEffect(() => {
        if (!currentUser) {
            return;
        }

        const search =
            searchText.trim();

        if (!search) {
            setSearchResults([]);
            setSearchLoading(false);

            return;
        }

        const timer =
            setTimeout(
                async () => {
                    try {
                        setSearchLoading(
                            true
                        );

                        const token =
                            getToken();

                        if (!token) {
                            return;
                        }

                        const response =
                            await fetch(
                                `${API_URL}/api/users/search?search=${encodeURIComponent(
                                    search
                                )}`,
                                {
                                    method: "GET",
                                    headers: {
                                        Authorization:
                                            `Bearer ${token}`,
                                        "Content-Type":
                                            "application/json",
                                    },
                                }
                            );

                        const data =
                            await response.json();

                        if (
                            !response.ok
                        ) {
                            console.error(
                                "Search error:",
                                data
                            );

                            return;
                        }

                        setSearchResults(
                            Array.isArray(
                                data.users
                            )
                                ? data.users
                                : []
                        );
                    } catch (error) {
                        console.error(
                            "User search error:",
                            error
                        );
                    } finally {
                        setSearchLoading(
                            false
                        );
                    }
                },
                350
            );

        return () =>
            clearTimeout(timer);
    }, [
        searchText,
        currentUser,
    ]);

    // ========================================
    // MESSAGE TYPING
    // ========================================

    const handleMessageChange = (
        e
    ) => {
        const value =
            e.target.value;

        setMessage(value);

        if (
            !connected ||
            !conversationId
        ) {
            return;
        }

        if (!value.trim()) {
            socket.emit(
                "stopTyping",
                {
                    conversationId,
                }
            );

            return;
        }

        socket.emit(
            "typing",
            {
                conversationId,
                username:
                    currentUser?.username ||
                    "Someone",
            }
        );

        if (
            typingTimeoutRef.current
        ) {
            clearTimeout(
                typingTimeoutRef.current
            );
        }

        typingTimeoutRef.current =
            setTimeout(() => {
                socket.emit(
                    "stopTyping",
                    {
                        conversationId,
                    }
                );
            }, 1200);
    };

    // ========================================
    // FILE TYPE HELPERS
    // ========================================

    const isImageFile = (file) => {
        return file?.type?.startsWith(
            "image/"
        );
    };

    const isAllowedFile = (file) => {
        if (!file) {
            return false;
        }

        const allowedMimeTypes = [
            "application/pdf",

            "application/msword",

            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

            "application/vnd.ms-excel",

            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

            "application/vnd.ms-powerpoint",

            "application/vnd.openxmlformats-officedocument.presentationml.presentation",

            "text/plain",

            "text/csv",

            "application/zip",

            "application/x-zip-compressed",

            "image/jpeg",

            "image/jpg",

            "image/png",

            "image/webp",

            "image/gif",

            "audio/mpeg",

            "audio/wav",

            "audio/x-wav",

            "video/mp4",

            "video/webm",
        ];

        return (
            allowedMimeTypes.includes(
                file.type
            ) ||
            /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|jpg|jpeg|png|webp|gif|mp3|wav|mp4|webm)$/i.test(
                file.name
            )
        );
    };

    // ========================================
    // SELECT FILE
    // ========================================

    const handleFileChange = (e) => {
        const file =
            e.target.files?.[0];

        if (!file) {
            return;
        }

        // ----------------------------
        // MAX SIZE
        // ----------------------------

        const maxSize =
            10 * 1024 * 1024;

        if (file.size > maxSize) {
            alert(
                "File must be smaller than 10 MB."
            );

            clearSelectedFile();

            return;
        }

        // ----------------------------
        // TYPE
        // ----------------------------

        if (!isAllowedFile(file)) {
            alert(
                "This file type is not supported."
            );

            clearSelectedFile();

            return;
        }

        setSelectedFile(file);

        // ----------------------------
        // IMAGE PREVIEW
        // ----------------------------

        if (isImageFile(file)) {
            const reader =
                new FileReader();

            reader.onload = () => {
                setFilePreview(
                    reader.result
                );
            };

            reader.onerror = () => {
                setFilePreview("");
            };

            reader.readAsDataURL(file);
        } else {
            setFilePreview("");
        }
    };

    // ========================================
    // FORMAT FILE SIZE
    // ========================================

    const formatFileSize = (
        bytes
    ) => {
        if (!bytes) {
            return "0 Bytes";
        }

        const units = [
            "Bytes",
            "KB",
            "MB",
            "GB",
        ];

        const index = Math.floor(
            Math.log(bytes) /
                Math.log(1024)
        );

        return `${(
            bytes /
            Math.pow(
                1024,
                index
            )
        ).toFixed(
            index === 0 ? 0 : 2
        )} ${units[index]}`;
    };

    // ========================================
    // REPLY HELPERS
    // ========================================

    const handleReply = (msg) => {
        if (!msg) {
            return;
        }

        setReplyingTo(msg);

        setTimeout(() => {
            const input =
                document.querySelector(
                    ".message-input-area input[type='text']"
                );

            input?.focus();
        }, 50);
    };

    // ========================================
    // DELETE MESSAGE
    // ========================================

    const handleDeleteMessage = (msg) => {
        if (
            !msg?._id ||
            !conversationId ||
            !connected
        ) {
            return;
        }

        if (!isMyMessage(msg)) {
            return;
        }

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this message?"
            );

        if (!confirmed) {
            return;
        }

        socket.emit(
            "deleteMessage",
            {
                messageId:
                    msg._id.toString(),

                conversationId:
                    conversationId.toString(),
            }
        );
    };

    // ========================================
    // PIN / UNPIN MESSAGE
    // ========================================

    const handlePinMessage = (msg) => {
        if (
            !msg?._id ||
            !conversationId ||
            !connected
        ) {
            return;
        }

        socket.emit(
            msg?.pinned
                ? "unpinMessage"
                : "pinMessage",
            {
                messageId:
                    msg._id.toString(),

                conversationId:
                    conversationId.toString(),
            }
        );
    };

    // ========================================
    // OPEN FORWARD DIALOG
    // ========================================

    const handleForwardMessage = (msg) => {
        if (
            !msg?._id ||
            !connected
        ) {
            return;
        }

        if (msg?.deleted) {
            return;
        }

        setForwardingMessage(msg);
    };

    // ========================================
    // FORWARD MESSAGE TO CONVERSATION
    // ========================================

    const forwardMessageToConversation = (
        targetConversation
    ) => {
        if (
            !forwardingMessage?._id ||
            !targetConversation?._id ||
            !connected ||
            forwarding
        ) {
            return;
        }

        const targetId =
            targetConversation._id.toString();

        if (
            targetId ===
            conversationId?.toString()
        ) {
            const confirmed =
                window.confirm(
                    "Forward this message to the current conversation?"
                );

            if (!confirmed) {
                return;
            }
        }

        setForwarding(true);

        socket.emit(
            "forwardMessage",
            {
                messageId:
                    forwardingMessage._id.toString(),

                targetConversationId:
                    targetId,
            }
        );
    };

    const closeForwardDialog = () => {
        if (forwarding) {
            return;
        }

        setForwardingMessage(null);
    };

    const cancelReply = () => {
        setReplyingTo(null);
    };

    const getReplyText = (msg) => {
        if (!msg) {
            return "";
        }

        if (msg?.text || msg?.message) {
            return msg.text || msg.message;
        }

        if (
            msg?.messageType === "image" ||
            msg?.imageUrl ||
            msg?.image
        ) {
            return "📷 Image";
        }

        if (
            msg?.messageType === "file" ||
            msg?.fileUrl
        ) {
            return `📎 ${msg?.fileName || "File"}`;
        }

        return "";
    };

    // ========================================
    // MESSAGE OPTIONS MENU
    // ========================================

    const toggleMessageMenu = (messageId) => {
        if (!messageId) {
            return;
        }

        setOpenMessageMenuId((currentId) =>
            currentId === messageId.toString()
                ? null
                : messageId.toString()
        );
    };

    const closeMessageMenu = () => {
        setOpenMessageMenuId(null);
    };

    const handleCopyMessage = async (msg) => {
        const textToCopy = getMessageText(msg);

        if (!textToCopy) {
            closeMessageMenu();
            return;
        }

        try {
            await navigator.clipboard.writeText(textToCopy);
        } catch (error) {
            console.error("Copy message error:", error);
        }

        closeMessageMenu();
    };

    const handleMessageInfo = (msg) => {
        if (!msg) {
            return;
        }

        const senderName =
            msg?.sender?.username || "User";

        const sentAt = msg?.createdAt
            ? new Date(msg.createdAt).toLocaleString()
            : "Unknown";

        const readStatus = isMyMessage(msg)
            ? msg?.read
                ? "Read"
                : msg?.delivered
                ? "Delivered"
                : "Sent"
            : "Received";

        window.alert(
            `Message info\\n\\nSender: ${senderName}\\nTime: ${sentAt}\\nStatus: ${readStatus}`
        );

        closeMessageMenu();
    };

    const handleStarMessage = (msg) => {
        if (!msg?._id) {
            return;
        }

        const id = msg._id.toString();

        setStarredMessageIds((previous) =>
            previous.includes(id)
                ? previous.filter((item) => item !== id)
                : [...previous, id]
        );

        closeMessageMenu();
    };

    const handleSelectMessage = (msg) => {
        if (!msg?._id) {
            return;
        }

        const id = msg._id.toString();

        setSelectedMessageIds((previous) =>
            previous.includes(id)
                ? previous.filter((item) => item !== id)
                : [...previous, id]
        );

        closeMessageMenu();
    };

    const handleSaveMessage = async (msg) => {
        if (!msg) {
            closeMessageMenu();
            return;
        }

        const mediaPath =
            getMessageImage(msg) || msg?.fileUrl || "";

        if (!mediaPath) {
            await handleCopyMessage(msg);
            return;
        }

        try {
            const link = document.createElement("a");
            link.href = getFileUrl(mediaPath);
            link.download =
                msg?.fileName ||
                (msg?.messageType === "image"
                    ? "image"
                    : "file");
            link.target = "_blank";
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Save message error:", error);
        }

        closeMessageMenu();
    };

    const handleShareMessage = async (msg) => {
        const textToShare = getMessageText(msg);

        try {
            if (navigator.share) {
                await navigator.share({
                    title: "Chit Chat message",
                    text: textToShare || "Shared from Chit Chat",
                });
            } else if (textToShare) {
                await navigator.clipboard.writeText(textToShare);
                window.alert("Message copied because sharing is not supported in this browser.");
            }
        } catch (error) {
            if (error?.name !== "AbortError") {
                console.error("Share message error:", error);
            }
        }

        closeMessageMenu();
    };

    // ========================================
    // VOICE RECORDING
    // ========================================

    const formatRecordingTime = (seconds) => {
        const safeSeconds = Math.max(0, Number(seconds) || 0);
        const minutes = Math.floor(safeSeconds / 60);
        const remainingSeconds = safeSeconds % 60;

        return `${String(minutes).padStart(2, "0")}:${String(
            remainingSeconds
        ).padStart(2, "0")}`;
    };

    const stopRecordingStream = () => {
        if (recordingStreamRef.current) {
            recordingStreamRef.current
                .getTracks()
                .forEach((track) => track.stop());

            recordingStreamRef.current = null;
        }
    };

    const startVoiceRecording = async () => {
        if (
            !selectedConversation ||
            !connected ||
            loadingMessages ||
            fileUploading ||
            audioUploading ||
            isRecording
        ) {
            return;
        }

        try {
            setRecordingError("");

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia ||
                typeof MediaRecorder === "undefined"
            ) {
                setRecordingError(
                    "Voice recording is not supported by this browser."
                );
                return;
            }

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });

            recordingStreamRef.current = stream;
            recordingChunksRef.current = [];

            const mimeTypes = [
                "audio/webm;codecs=opus",
                "audio/webm",
                "audio/ogg;codecs=opus",
                "audio/mp4",
            ];

            const supportedMimeType =
                mimeTypes.find((type) =>
                    MediaRecorder.isTypeSupported(type)
                );

            const recorder = supportedMimeType
                ? new MediaRecorder(stream, {
                      mimeType: supportedMimeType,
                  })
                : new MediaRecorder(stream);

            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordingChunksRef.current.push(event.data);
                }
            };

            recorder.onerror = (event) => {
                console.error("MediaRecorder error:", event);
                setRecordingError("Unable to record audio.");
            };

            recorder.onstop = async () => {
                const chunks = recordingChunksRef.current;
                const actualMimeType =
                    recorder.mimeType ||
                    supportedMimeType ||
                    "audio/webm";

                recordingChunksRef.current = [];
                mediaRecorderRef.current = null;
                stopRecordingStream();

                if (!chunks.length) {
                    return;
                }

                const audioBlob = new Blob(chunks, {
                    type: actualMimeType,
                });

                if (audioBlob.size === 0) {
                    return;
                }

                await sendVoiceMessage(
                    audioBlob,
                    actualMimeType
                );
            };

            recorder.start(250);

            setIsRecording(true);
            setRecordingTime(0);

            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }

            recordingTimerRef.current = setInterval(() => {
                setRecordingTime((previous) => previous + 1);
            }, 1000);
        } catch (error) {
            console.error("Voice recording error:", error);

            stopRecordingStream();
            mediaRecorderRef.current = null;
            recordingChunksRef.current = [];

            if (error?.name === "NotAllowedError") {
                setRecordingError(
                    "Microphone permission was denied. Allow microphone access and try again."
                );
            } else if (error?.name === "NotFoundError") {
                setRecordingError("No microphone was found.");
            } else {
                setRecordingError(
                    error?.message ||
                        "Unable to start voice recording."
                );
            }
        }
    };

    const stopVoiceRecording = () => {
        if (!mediaRecorderRef.current || !isRecording) {
            return;
        }

        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }

        setIsRecording(false);

        if (mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
    };

    const cancelVoiceRecording = () => {
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }

        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.ondataavailable = null;
            mediaRecorderRef.current.onstop = null;

            if (mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
        }

        mediaRecorderRef.current = null;
        recordingChunksRef.current = [];
        stopRecordingStream();

        setIsRecording(false);
        setRecordingTime(0);
        setRecordingError("");
    };

    const sendVoiceMessage = async (audioBlob, mimeType) => {
        if (
            !audioBlob ||
            !conversationId ||
            !currentUser ||
            audioUploading
        ) {
            return;
        }

        const token = getToken();

        if (!token) {
            return;
        }

        try {
            setAudioUploading(true);
            setRecordingError("");

            socket.emit("stopTyping", {
                conversationId,
            });

            const extension =
                mimeType?.includes("ogg")
                    ? "ogg"
                    : mimeType?.includes("mp4")
                    ? "mp4"
                    : "webm";

            const audioFile = new File(
                [audioBlob],
                `voice-${Date.now()}.${extension}`,
                {
                    type: mimeType || "audio/webm",
                }
            );

            const formData = new FormData();

            formData.append(
                "conversationId",
                conversationId
            );

            formData.append(
                "audio",
                audioFile
            );

            if (replyingTo?._id) {
                formData.append(
                    "replyTo",
                    replyingTo._id.toString()
                );
            }

            formData.append(
                "audioDuration",
                String(recordingTime)
            );

            const response = await fetch(
                `${API_URL}/api/messages/audio`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                        "Failed to send voice message."
                );
            }

            const sentMessage =
                data?.data ||
                data?.messageData ||
                null;

            // The server emits receiveMessage through Socket.IO.
            // This fallback prevents the sender UI from staying empty
            // if the socket event is missed.
            if (sentMessage?._id) {
                setMessages((previous) => {
                    const exists = previous.some(
                        (item) =>
                            item?._id?.toString() ===
                            sentMessage?._id?.toString()
                    );

                    return exists
                        ? previous
                        : [...previous, sentMessage];
                });
            }

            setReplyingTo(null);
            setRecordingTime(0);
        } catch (error) {
            console.error(
                "Send voice message error:",
                error
            );

            setRecordingError(
                error?.message ||
                    "Unable to send voice message."
            );
        } finally {
            setAudioUploading(false);
        }
    };

    // ========================================
    // CLEAN UP VOICE RECORDING
    // ========================================

    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }

            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.ondataavailable = null;
                mediaRecorderRef.current.onstop = null;

                if (mediaRecorderRef.current.state !== "inactive") {
                    try {
                        mediaRecorderRef.current.stop();
                    } catch (error) {
                        console.error(
                            "Recorder cleanup error:",
                            error
                        );
                    }
                }
            }

            stopRecordingStream();
        };
    }, []);

    // ========================================
    // SEND MESSAGE
    // ========================================

    const sendMessage = async () => {
        // ------------------------------------
        // FILE
        // ------------------------------------

        if (selectedFile) {
            await sendFileMessage();

            return;
        }

        // ------------------------------------
        // TEXT
        // ------------------------------------

        const text =
            message.trim();

        if (
            !text ||
            !connected ||
            !conversationId
        ) {
            return;
        }

        socket.emit(
            "stopTyping",
            {
                conversationId,
            }
        );

        socket.emit(
            "sendMessage",
            {
                conversationId,
                message: text,
                replyTo: replyingTo?._id || null,
            }
        );

        setMessage("");
        setReplyingTo(null);
    };

    // ========================================
    // SEND FILE MESSAGE
    // ========================================

    const sendFileMessage =
        async () => {
            if (
                !selectedFile ||
                !conversationId ||
                !currentUser ||
                fileUploading
            ) {
                return;
            }

            const token =
                getToken();

            if (!token) {
                return;
            }

            try {
                setFileUploading(true);

                socket.emit(
                    "stopTyping",
                    {
                        conversationId,
                    }
                );

                const formData =
                    new FormData();

                formData.append(
                    "conversationId",
                    conversationId
                );

                formData.append(
                    "file",
                    selectedFile
                );

                // --------------------------------
                // IMAGE
                // --------------------------------

                const endpoint =
                    isImageFile(
                        selectedFile
                    )
                        ? `${API_URL}/api/messages/image`
                        : `${API_URL}/api/messages/file`;

                // --------------------------------
                // IMAGE FIELD NAME
                // --------------------------------

                if (
                    isImageFile(
                        selectedFile
                    )
                ) {
                    // Replace "file" with "image"
                    // for image endpoint.
                    formData.delete(
                        "file"
                    );

                    formData.append(
                        "image",
                        selectedFile
                    );
                }

                const response =
                    await fetch(
                        endpoint,
                        {
                            method: "POST",

                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },

                            body: formData,
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    console.error(
                        "File upload error:",
                        data
                    );

                    alert(
                        data.message ||
                            "Failed to send file."
                    );

                    return;
                }

                // --------------------------------
                // ADD HTTP MESSAGE
                // --------------------------------

                const uploadedMessage =
                    data.data ||
                    data.messageData;

                if (
                    uploadedMessage?._id
                ) {
                    setMessages(
                        (previous) => {
                            const exists =
                                previous.some(
                                    (
                                        msg
                                    ) =>
                                        msg?._id?.toString() ===
                                        uploadedMessage?._id?.toString()
                                );

                            if (exists) {
                                return previous;
                            }

                            return [
                                ...previous,
                                uploadedMessage,
                            ];
                        }
                    );

                    setConversations(
                        (previous) =>
                            previous.map(
                                (
                                    conversation
                                ) =>
                                    conversation?._id?.toString() ===
                                    conversationId
                                        ? {
                                              ...conversation,
                                              lastMessage:
                                                  uploadedMessage,
                                              updatedAt:
                                                  uploadedMessage.createdAt,
                                          }
                                        : conversation
                            )
                    );
                }

                // --------------------------------
                // SEND TEXT AFTER FILE
                // --------------------------------

                const text =
                    message.trim();

                clearSelectedFile();

                if (
                    text &&
                    connected
                ) {
                    socket.emit(
                        "sendMessage",
                        {
                            conversationId,
                            message: text,
                            replyTo:
                                replyingTo?._id ||
                                null,
                        }
                    );

                    setMessage("");
                    setReplyingTo(null);
                }
            } catch (error) {
                console.error(
                    "Send file error:",
                    error
                );

                alert(
                    "Unable to send file. Please try again."
                );
            } finally {
                setFileUploading(false);
            }
        };

    // ========================================
    // MESSAGE HELPERS
    // ========================================

    const getSenderId = (
        msg
    ) => {
        if (msg?.sender?._id) {
            return msg.sender._id.toString();
        }

        if (msg?.sender?.id) {
            return msg.sender.id.toString();
        }

        if (msg?.senderId) {
            return msg.senderId.toString();
        }

        return "";
    };

    const getMessageText = (
        msg
    ) => {
        if (
            msg?.text ||
            msg?.message
        ) {
            return (
                msg?.text ||
                msg?.message ||
                ""
            );
        }

        if (
            msg?.messageType ===
            "image"
        ) {
            return "📷 Image";
        }

        if (
            msg?.messageType ===
            "file"
        ) {
            return (
                `📎 ${
                    msg?.fileName ||
                    "File"
                }`
            );
        }

        if (
            msg?.messageType ===
            "audio"
        ) {
            return "🎤 Voice message";
        }

        if (
            msg?.imageUrl ||
            msg?.image
        ) {
            return "📷 Image";
        }

        if (
            msg?.fileUrl ||
            msg?.attachment?.url
        ) {
            return (
                `📎 ${
                    msg?.fileName ||
                    "File"
                }`
            );
        }

        return "";
    };

    const getMessageImage = (
        msg
    ) => {
        if (
            msg?.messageType ===
            "image"
        ) {
            return (
                msg?.imageUrl ||
                msg?.image ||
                ""
            );
        }

        if (
            msg?.imageUrl
        ) {
            return msg.imageUrl;
        }

        if (
            msg?.image
        ) {
            return msg.image;
        }

        return "";
    };

    const isMyMessage = (
        msg
    ) => {
        return (
            getSenderId(msg) ===
            getCurrentUserId()
        );
    };

    const formatTime = (
        date
    ) => {
        if (!date) {
            return "";
        }

        const parsed =
            new Date(date);

        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {
            return "";
        }

        return parsed.toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    // ========================================
    // START CONVERSATION
    // ========================================

    const startConversation =
        async (user) => {
            try {
                const token =
                    getToken();

                if (!token) {
                    return;
                }

                const response =
                    await fetch(
                        `${API_URL}/api/conversations`,
                        {
                            method: "POST",
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                                "Content-Type":
                                    "application/json",
                            },
                            body: JSON.stringify({
                                userId:
                                    user._id,
                            }),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    console.error(
                        "Conversation creation error:",
                        data
                    );

                    return;
                }

                const conversation =
                    data.conversation;

                if (!conversation) {
                    return;
                }

                setSearchText("");
                setSearchResults([]);

                const conversationsResponse =
                    await fetch(
                        `${API_URL}/api/conversations`,
                        {
                            method: "GET",
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                                "Content-Type":
                                    "application/json",
                            },
                        }
                    );

                const conversationsData =
                    await conversationsResponse.json();

                if (
                    conversationsResponse.ok &&
                    Array.isArray(
                        conversationsData.conversations
                    )
                ) {
                    setConversations(
                        conversationsData.conversations
                    );

                    const matching =
                        conversationsData.conversations.find(
                            (item) =>
                                item?._id?.toString() ===
                                conversation?._id?.toString()
                        );

                    setSelectedConversation(
                        matching ||
                            conversation
                    );
                } else {
                    setSelectedConversation(
                        conversation
                    );
                }
            } catch (error) {
                console.error(
                    "Start conversation error:",
                    error
                );
            }
        };

    // ========================================
    // SELECT CONVERSATION
    // ========================================

    const selectConversation =
        (conversation) => {
            if (!conversation) {
                return;
            }

            setSelectedConversation(
                conversation
            );

            setOpenMessageMenuId(null);

            setMessages([]);
            setMessage("");
            setReplyingTo(null);
            setForwardingMessage(null);
            setForwarding(false);
            setShowEmojiPicker(false);
            closeCamera();
            clearSelectedFile();
            setTypingUser("");

            const id =
                conversation?._id?.toString();

            if (!id) {
                return;
            }

            setUnreadCounts(
                (previous) => {
                    const updated = {
                        ...previous,
                    };

                    delete updated[id];

                    return updated;
                }
            );

            if (socket.connected) {
                socket.emit(
                    "markConversationRead",
                    {
                        conversationId:
                            id,
                    }
                );
            }
        };

    // ========================================
    // PROFILE FUNCTIONS
    // ========================================

    const openProfile = () => {
        setProfileUsername(
            currentUser?.username ||
                ""
        );

        setProfileBio(
            currentUser?.bio || ""
        );

        setProfilePicture(
            currentUser?.profilePicture ||
                ""
        );

        setProfileFile(null);

        setProfilePreview(
            getImageUrl(
                currentUser?.profilePicture
            )
        );

        setRemoveCurrentPicture(false);

        setProfileError("");
        setProfileSuccess("");
        setEditingProfile(false);
        setShowProfile(true);
    };

    const startEditingProfile =
        () => {
            setProfileUsername(
                currentUser?.username ||
                    ""
            );

            setProfileBio(
                currentUser?.bio ||
                    ""
            );

            setProfilePicture(
                currentUser?.profilePicture ||
                    ""
            );

            setProfileFile(null);

            setProfilePreview(
                getImageUrl(
                    currentUser?.profilePicture
                )
            );

            setRemoveCurrentPicture(false);

            setProfileError("");
            setProfileSuccess("");

            setEditingProfile(true);
        };

    const handleProfileFileChange =
        (e) => {
            const file =
                e.target.files?.[0];

            if (!file) {
                return;
            }

            const allowedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/webp",
            ];

            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {
                setProfileError(
                    "Only JPG, JPEG, PNG and WEBP images are allowed."
                );

                e.target.value = "";

                return;
            }

            if (
                file.size >
                5 * 1024 * 1024
            ) {
                setProfileError(
                    "Profile picture must be smaller than 5 MB."
                );

                e.target.value = "";

                return;
            }

            setProfileError("");
            setProfileSuccess("");
            setProfileFile(file);
            setRemoveCurrentPicture(false);

            const reader =
                new FileReader();

            reader.onload = () => {
                setProfilePreview(
                    reader.result
                );
            };

            reader.readAsDataURL(file);
        };

    const removeProfileImage = () => {
        setProfileFile(null);
        setProfilePicture("");
        setProfilePreview("");
        setRemoveCurrentPicture(true);

        const input =
            document.getElementById(
                "profile-picture-input"
            );

        if (input) {
            input.value = "";
        }
    };

    // ========================================
    // UPDATE PROFILE
    // ========================================

    const updateProfile =
        async () => {
            try {
                setProfileLoading(true);
                setProfileError("");
                setProfileSuccess("");

                const token =
                    getToken();

                if (!token) {
                    setProfileError(
                        "You are not logged in."
                    );

                    return;
                }

                const username =
                    profileUsername.trim();

                const bio =
                    profileBio.trim();

                if (!username) {
                    setProfileError(
                        "Username cannot be empty."
                    );

                    return;
                }

                if (
                    username.length < 3
                ) {
                    setProfileError(
                        "Username must be at least 3 characters."
                    );

                    return;
                }

                if (
                    username.length > 30
                ) {
                    setProfileError(
                        "Username cannot exceed 30 characters."
                    );

                    return;
                }

                if (
                    bio.length > 150
                ) {
                    setProfileError(
                        "Bio cannot exceed 150 characters."
                    );

                    return;
                }

                const profileBody = {
                    username,
                    bio,
                };

                if (
                    removeCurrentPicture &&
                    !profileFile
                ) {
                    profileBody.profilePicture =
                        "";
                }

                const profileResponse =
                    await fetch(
                        `${API_URL}/api/users/profile`,
                        {
                            method: "PUT",

                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                                "Content-Type":
                                    "application/json",
                            },

                            body: JSON.stringify(
                                profileBody
                            ),
                        }
                    );

                const profileData =
                    await profileResponse.json();

                if (
                    !profileResponse.ok
                ) {
                    setProfileError(
                        profileData.message ||
                            "Failed to update profile."
                    );

                    return;
                }

                let updatedUser =
                    profileData.user;

                if (profileFile) {
                    const formData =
                        new FormData();

                    formData.append(
                        "profilePicture",
                        profileFile
                    );

                    const pictureResponse =
                        await fetch(
                            `${API_URL}/api/users/profile/picture`,
                            {
                                method: "PUT",

                                headers: {
                                    Authorization:
                                        `Bearer ${token}`,
                                },

                                body: formData,
                            }
                        );

                    const pictureData =
                        await pictureResponse.json();

                    if (
                        !pictureResponse.ok
                    ) {
                        setProfileError(
                            pictureData.message ||
                                "Profile text updated, but image upload failed."
                        );

                        saveUser(
                            updatedUser
                        );

                        return;
                    }

                    if (
                        pictureData.user
                    ) {
                        updatedUser =
                            pictureData.user;
                    }
                }

                saveUser(updatedUser);

                if (socket.connected) {
                    socket.emit(
                        "profileUpdated",
                        updatedUser
                    );
                }

                setProfileUsername(
                    updatedUser.username ||
                        ""
                );

                setProfileBio(
                    updatedUser.bio ||
                        ""
                );

                setProfilePicture(
                    updatedUser.profilePicture ||
                        ""
                );

                setProfilePreview(
                    getImageUrl(
                        updatedUser.profilePicture
                    )
                );

                setProfileFile(null);
                setRemoveCurrentPicture(
                    false
                );

                setProfileSuccess(
                    "Profile updated successfully!"
                );

                setEditingProfile(false);
            } catch (error) {
                console.error(
                    "Update profile error:",
                    error
                );

                setProfileError(
                    "Unable to connect to server."
                );
            } finally {
                setProfileLoading(
                    false
                );
            }
        };

    // ========================================
    // LOGOUT
    // ========================================

    const logout = () => {
        if (
            typingTimeoutRef.current
        ) {
            clearTimeout(
                typingTimeoutRef.current
            );

            typingTimeoutRef.current =
                null;
        }

        if (socket.connected) {
            socket.disconnect();
        }

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        cancelVoiceRecording();

        setCurrentUser(null);
        setConnected(false);
        setMessages([]);
        setConversations([]);
        setSelectedConversation(null);
        setUnreadCounts({});
        setOnlineUserIds([]);
        setSearchText("");
        setSearchResults([]);
        setMessage("");
        setReplyingTo(null);
        setOpenMessageMenuId(null);
        setForwardingMessage(null);
        setForwarding(false);
        closeCamera();
        clearSelectedFile();
        setTypingUser("");
        setShowProfile(false);
        setEditingProfile(false);
        setShowRegister(false);
    };

    // ========================================
    // AUTH SCREEN
    // ========================================

    if (!currentUser) {
        if (showRegister) {
            return (
                <Register
                    onRegister={(user) => {
                        if (user) {
                            saveUser(user);
                        }

                        setShowRegister(
                            false
                        );
                    }}
                    onGoToLogin={() => {
                        setShowRegister(
                            false
                        );
                    }}
                />
            );
        }

        return (
            <Login
                onLogin={(user) => {
                    saveUser(user);
                }}
                onGoToRegister={() => {
                    setShowRegister(
                        true
                    );
                }}
            />
        );
    }

    // ========================================
    // ONLINE
    // ========================================

    const isOtherUserOnline =
        otherUserId
            ? onlineUserIds.includes(
                  otherUserId
              )
            : false;

    const currentUserInitial = (
        currentUser?.username ||
        currentUser?.email ||
        "U"
    )
        .charAt(0)
        .toUpperCase();

    // ========================================
    // UI
    // ========================================

    return (
        <div className="chat-app">

            {/* =================================
                SIDEBAR
            ================================= */}

            <aside className="sidebar">

                {/* BRAND */}

                <div className="brand">
                    <img
                        src="/logo.png"
                        alt="Chit Chat"
                        className="brand-logo"
                    />

                    <div>
                        <h1>
                            Chit Chat
                        </h1>

                        <span>
                            Real-time messaging
                        </span>
                    </div>
                </div>

                {/* SEARCH */}

                <div className="search-box">
                    <span>⌕</span>

                    <input
                        type="text"
                        value={
                            searchText
                        }
                        onChange={(e) =>
                            setSearchText(
                                e.target.value
                            )
                        }
                        placeholder="Search users..."
                    />

                    {searchText && (
                        <button
                            type="button"
                            className="clear-search"
                            onClick={() => {
                                setSearchText(
                                    ""
                                );

                                setSearchResults(
                                    []
                                );
                            }}
                        >
                            ×
                        </button>
                    )}
                </div>

                {/* SEARCH RESULTS */}

                {searchText.trim() && (
                    <div className="search-results">
                        {searchLoading ? (
                            <div className="search-message">
                                Searching...
                            </div>
                        ) : searchResults.length ===
                          0 ? (
                            <div className="search-message">
                                No users found.
                            </div>
                        ) : (
                            searchResults.map(
                                (user) => (
                                    <div
                                        key={
                                            user._id
                                        }
                                        className="search-user"
                                        onClick={() =>
                                            startConversation(
                                                user
                                            )
                                        }
                                    >
                                        {user.profilePicture ? (
                                            <img
                                                src={getImageUrl(
                                                    user.profilePicture
                                                )}
                                                alt={
                                                    user.username
                                                }
                                                className="search-avatar"
                                            />
                                        ) : (
                                            <div className="search-avatar">
                                                {(
                                                    user.username ||
                                                    "U"
                                                )
                                                    .charAt(
                                                        0
                                                    )
                                                    .toUpperCase()}
                                            </div>
                                        )}

                                        <div className="search-user-info">
                                            <strong>
                                                {
                                                    user.username
                                                }
                                            </strong>

                                            <span>
                                                {
                                                    user.email
                                                }
                                            </span>

                                            {user.isOnline && (
                                                <small>
                                                    Online
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                )
                            )
                        )}
                    </div>
                )}

                {/* TITLE */}

                <div className="conversation-title">
                    <span>
                        Messages
                    </span>

                    <span className="message-count">
                        {
                            conversations.length
                        }
                    </span>
                </div>

                {/* CONVERSATIONS */}

                <div className="conversation-list">
                    {loadingConversations ? (
                        <div className="list-message">
                            Loading...
                        </div>
                    ) : conversations.length ===
                      0 ? (
                        <div className="list-message">
                            No conversations yet.
                            <br />
                            Search for a user above.
                        </div>
                    ) : (
                        conversations.map(
                            (
                                conversation
                            ) => {
                                const participant =
                                    getOtherParticipant(
                                        conversation
                                    );

                                if (
                                    !participant
                                ) {
                                    return null;
                                }

                                const active =
                                    selectedConversation?._id?.toString() ===
                                    conversation?._id?.toString();

                                const participantOnline =
                                    onlineUserIds.includes(
                                        participant?._id?.toString()
                                    );

                                const unread =
                                    unreadCounts[
                                        conversation?._id?.toString()
                                    ] || 0;

                                return (
                                    <div
                                        key={
                                            conversation._id
                                        }
                                        className={`conversation ${
                                            active
                                                ? "active"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            selectConversation(
                                                conversation
                                            )
                                        }
                                    >
                                        <div className="avatar conversation-avatar">
                                            {participant.profilePicture ? (
                                                <img
                                                    src={getImageUrl(
                                                        participant.profilePicture
                                                    )}
                                                    alt={
                                                        participant.username
                                                    }
                                                    style={{
                                                        width:
                                                            "100%",
                                                        height:
                                                            "100%",
                                                        borderRadius:
                                                            "50%",
                                                        objectFit:
                                                            "cover",
                                                    }}
                                                />
                                            ) : (
                                                (
                                                    participant.username ||
                                                    "U"
                                                )
                                                    .charAt(
                                                        0
                                                    )
                                                    .toUpperCase()
                                            )}

                                            {participantOnline && (
                                                <span className="mini-online-dot" />
                                            )}
                                        </div>

                                        <div className="conversation-info">
                                            <div className="conversation-top">
                                                <strong>
                                                    {
                                                        participant.username
                                                    }
                                                </strong>

                                                <div className="conversation-meta">
                                                    <span className="conversation-time">
                                                        {
                                                            conversation.lastMessage
                                                                ? formatTime(
                                                                      conversation
                                                                          .lastMessage
                                                                          .createdAt
                                                                  )
                                                                : ""
                                                        }
                                                    </span>

                                                    {unread >
                                                        0 && (
                                                        <span className="unread-badge">
                                                            {unread >
                                                            99
                                                                ? "99+"
                                                                : unread}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <p
                                                className={
                                                    unread >
                                                    0
                                                        ? "unread-preview"
                                                        : ""
                                                }
                                            >
                                                {conversation.lastMessage
                                                    ? getMessageText(
                                                          conversation.lastMessage
                                                      )
                                                    : "Start a conversation"}
                                            </p>
                                        </div>
                                    </div>
                                );
                            }
                        )
                    )}
                </div>

                {/* PROFILE */}

                <div className="sidebar-bottom">
                    <div
                        className="profile"
                        onClick={
                            openProfile
                        }
                        style={{
                            cursor:
                                "pointer",
                        }}
                    >
                        {currentUser.profilePicture ? (
                            <img
                                src={getImageUrl(
                                    currentUser.profilePicture
                                )}
                                alt={
                                    currentUser.username
                                }
                                className="avatar profile-avatar"
                                style={{
                                    objectFit:
                                        "cover",
                                }}
                            />
                        ) : (
                            <div className="avatar profile-avatar">
                                {
                                    currentUserInitial
                                }
                            </div>
                        )}

                        <div>
                            <strong>
                                {
                                    currentUser.username
                                }
                            </strong>

                            <span>
                                {connected
                                    ? "Online"
                                    : "Offline"}
                            </span>
                        </div>
                    </div>

                    <button
                        className="logout-button"
                        onClick={
                            logout
                        }
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* =================================
                CHAT
            ================================= */}

            <main className="chat-container">

                {/* HEADER */}

                <header className="chat-header">
                    {otherUser ? (
                        <div className="chat-user">
                            <div className="avatar large-avatar">
                                {otherUser.profilePicture ? (
                                    <img
                                        src={getImageUrl(
                                            otherUser.profilePicture
                                        )}
                                        alt={
                                            otherUser.username
                                        }
                                        style={{
                                            width:
                                                "100%",
                                            height:
                                                "100%",
                                            borderRadius:
                                                "50%",
                                            objectFit:
                                                "cover",
                                        }}
                                    />
                                ) : (
                                    (
                                        otherUser.username ||
                                        "U"
                                    )
                                        .charAt(
                                            0
                                        )
                                        .toUpperCase()
                                )}

                                <span
                                    className={`online-dot ${
                                        isOtherUserOnline
                                            ? "online"
                                            : ""
                                    }`}
                                />
                            </div>

                            <div>
                                <h2>
                                    {
                                        otherUser.username
                                    }
                                </h2>

                                <p
                                    className={
                                        typingUser
                                            ? "typing-status"
                                            : ""
                                    }
                                >
                                    {typingUser
                                        ? `${typingUser} is typing...`
                                        : isOtherUserOnline
                                        ? "Online"
                                        : "Offline"}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="chat-user">
                            <div>
                                <h2>
                                    Chit Chat
                                </h2>

                                <p>
                                    Select a conversation
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="header-actions">
                        <button
                            type="button"
                            title="Search"
                        >
                            ⌕
                        </button>

                        <button
                            type="button"
                            title="More"
                        >
                            ⋮
                        </button>
                    </div>
                </header>

                {/* =================================
                    MESSAGES
                ================================= */}

                <section className="messages-area">
                    {!selectedConversation ? (
                        <div className="empty-chat">
                            <div className="empty-icon">
                                💬
                            </div>

                            <h3>
                                Select a conversation
                            </h3>

                            <p>
                                Search for a user or
                                choose a conversation
                                from the sidebar.
                            </p>
                        </div>
                    ) : loadingMessages ? (
                        <div className="empty-chat">
                            <div className="empty-icon">
                                💬
                            </div>

                            <h3>
                                Loading messages...
                            </h3>

                            <p>
                                Please wait.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="chat-date">
                                <span>
                                    Today
                                </span>
                            </div>

                            {messages.length ===
                            0 ? (
                                <div className="empty-chat">
                                    <div className="empty-icon">
                                        💬
                                    </div>

                                    <h3>
                                        No messages yet
                                    </h3>

                                    <p>
                                        Start a conversation
                                        with{" "}
                                        {
                                            otherUser?.username
                                        }
                                    </p>
                                </div>
                            ) : (
                                messages.map(
                                    (
                                        msg,
                                        index
                                    ) => {
                                        const mine =
                                            isMyMessage(
                                                msg
                                            );

                                        const imageUrl =
                                            getMessageImage(
                                                msg
                                            );

                                        const isAudio =
                                            msg?.messageType ===
                                                "audio" ||
                                            Boolean(
                                                msg?.audioUrl
                                            );

                                        const isFile =
                                            !isAudio &&
                                            (msg?.messageType ===
                                                "file" ||
                                                Boolean(
                                                    msg?.fileUrl
                                                ));

                                        const isImage =
                                            msg?.messageType ===
                                                "image" ||
                                            Boolean(
                                                imageUrl
                                            );

                                        return (
                                            <div
                                                key={
                                                    msg?._id ||
                                                    index
                                                }
                                                className={`message-row ${
                                                    mine
                                                        ? "mine"
                                                        : "theirs"
                                                }`}
                                            >
                                                {!mine && (
                                                    <div className="small-avatar">
                                                        {otherUser?.profilePicture ? (
                                                            <img
                                                                src={getImageUrl(
                                                                    otherUser.profilePicture
                                                                )}
                                                                alt={
                                                                    otherUser.username
                                                                }
                                                                style={{
                                                                    width:
                                                                        "100%",
                                                                    height:
                                                                        "100%",
                                                                    borderRadius:
                                                                        "50%",
                                                                    objectFit:
                                                                        "cover",
                                                                }}
                                                            />
                                                        ) : (
                                                            (
                                                                otherUser?.username ||
                                                                "U"
                                                            )
                                                                .charAt(
                                                                    0
                                                                )
                                                                .toUpperCase()
                                                        )}
                                                    </div>
                                                )}

                                                <div
                                                    className={`message-bubble ${
                                                        mine
                                                            ? "my-bubble"
                                                            : "their-bubble"
                                                    }`}
                                                    style={{
                                                        position:
                                                            "relative",
                                                    }}
                                                >
                                                    {/* ================================
                                                        MESSAGE OPTIONS
                                                    ================================= */}

                                                    <div
                                                        className="message-options-container"
                                                        style={{
                                                            position: "absolute",
                                                            top: "-14px",
                                                            right: mine ? "8px" : "8px",
                                                            zIndex: 20,
                                                        }}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                toggleMessageMenu(msg?._id);
                                                            }}
                                                            title="More options"
                                                            aria-label="More options"
                                                            style={{
                                                                width: "36px",
                                                                height: "36px",
                                                                border: "1px solid #e5e7eb",
                                                                background: "#ffffff",
                                                                color: "#4f46e5",
                                                                borderRadius: "50%",
                                                                fontSize: "20px",
                                                                fontWeight: "700",
                                                                cursor: "pointer",
                                                                boxShadow: "0 3px 10px rgba(0,0,0,0.10)",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                lineHeight: 1,
                                                            }}
                                                        >
                                                            ⋮
                                                        </button>

                                                        {openMessageMenuId ===
                                                            msg?._id?.toString() && (
                                                            <div
                                                                onClick={(event) =>
                                                                    event.stopPropagation()
                                                                }
                                                                style={{
                                                                    position: "absolute",
                                                                    top: "42px",
                                                                    right: mine ? "0" : "auto",
                                                                    left: mine ? "auto" : "0",
                                                                    width: "220px",
                                                                    maxWidth: "calc(100vw - 30px)",
                                                                    background: "#ffffff",
                                                                    border: "1px solid #e5e7eb",
                                                                    borderRadius: "14px",
                                                                    padding: "7px",
                                                                    boxShadow: "0 12px 35px rgba(0,0,0,0.16)",
                                                                    overflow: "hidden",
                                                                }}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleMessageInfo(msg);
                                                                    }}
                                                                    style={messageMenuItemStyle}
                                                                >
                                                                    <span>ⓘ</span>
                                                                    <span>Message info</span>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleReply(msg);
                                                                        closeMessageMenu();
                                                                    }}
                                                                    style={messageMenuItemStyle}
                                                                >
                                                                    <span>↩</span>
                                                                    <span>Reply</span>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleCopyMessage(msg);
                                                                    }}
                                                                    style={messageMenuItemStyle}
                                                                >
                                                                    <span>▣</span>
                                                                    <span>Copy</span>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleForwardMessage(msg);
                                                                        closeMessageMenu();
                                                                    }}
                                                                    style={messageMenuItemStyle}
                                                                >
                                                                    <span>↗</span>
                                                                    <span>Forward</span>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handlePinMessage(msg);
                                                                        closeMessageMenu();
                                                                    }}
                                                                    style={messageMenuItemStyle}
                                                                >
                                                                    <span>📌</span>
                                                                    <span>
                                                                        {msg?.pinned
                                                                            ? "Unpin"
                                                                            : "Pin"}
                                                                    </span>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleStarMessage(msg);
                                                                    }}
                                                                    style={messageMenuItemStyle}
                                                                >
                                                                    <span>☆</span>
                                                                    <span>
                                                                        {starredMessageIds.includes(
                                                                            msg?._id?.toString()
                                                                        )
                                                                            ? "Unstar"
                                                                            : "Star"}
                                                                    </span>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleSelectMessage(msg);
                                                                    }}
                                                                    style={messageMenuItemStyle}
                                                                >
                                                                    <span>☑</span>
                                                                    <span>
                                                                        {selectedMessageIds.includes(
                                                                            msg?._id?.toString()
                                                                        )
                                                                            ? "Unselect"
                                                                            : "Select"}
                                                                    </span>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleSaveMessage(msg);
                                                                    }}
                                                                    style={messageMenuItemStyle}
                                                                >
                                                                    <span>⇩</span>
                                                                    <span>Save as</span>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleShareMessage(msg);
                                                                    }}
                                                                    style={messageMenuItemStyle}
                                                                >
                                                                    <span>↗</span>
                                                                    <span>Share</span>
                                                                </button>

                                                                {mine && (
                                                                    <>
                                                                        <div
                                                                            style={{
                                                                                height: "1px",
                                                                                background: "#e5e7eb",
                                                                                margin: "6px 0",
                                                                            }}
                                                                        />

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                handleDeleteMessage(msg);
                                                                                closeMessageMenu();
                                                                            }}
                                                                            style={{
                                                                                ...messageMenuItemStyle,
                                                                                color: "#dc2626",
                                                                            }}
                                                                        >
                                                                            <span>🗑</span>
                                                                            <span>Delete</span>
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* ================================
                                                        PINNED INDICATOR
                                                    ================================= */}

                                                    {msg?.pinned && (
                                                        <div
                                                            style={{
                                                                marginBottom:
                                                                    "6px",
                                                                fontSize:
                                                                    "11px",
                                                                fontWeight:
                                                                    "700",
                                                                color:
                                                                    mine
                                                                        ? "rgba(255,255,255,0.9)"
                                                                        : "#4f46e5",
                                                            }}
                                                        >
                                                            📌 Pinned message
                                                        </div>
                                                    )}

                                                    {/* ================================
                                                        REPLIED MESSAGE
                                                    ================================= */}

                                                    {msg?.replyTo && (
                                                        <div
                                                            style={{
                                                                marginBottom:
                                                                    "8px",
                                                                padding:
                                                                    "7px 9px",
                                                                borderLeft:
                                                                    "3px solid #6366f1",
                                                                borderRadius:
                                                                    "7px",
                                                                background:
                                                                    mine
                                                                        ? "rgba(255,255,255,0.16)"
                                                                        : "#f3f4f6",
                                                                fontSize:
                                                                    "12px",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    fontWeight:
                                                                        "700",
                                                                    marginBottom:
                                                                        "2px",
                                                                    opacity:
                                                                        0.85,
                                                                }}
                                                            >
                                                                {msg
                                                                    ?.replyTo
                                                                    ?.sender
                                                                    ?.username ||
                                                                    msg
                                                                        ?.replyTo
                                                                        ?.username ||
                                                                    "Message"}
                                                            </div>

                                                            <div
                                                                style={{
                                                                    opacity:
                                                                        0.75,
                                                                    overflow:
                                                                        "hidden",
                                                                    textOverflow:
                                                                        "ellipsis",
                                                                    whiteSpace:
                                                                        "nowrap",
                                                                    maxWidth:
                                                                        "230px",
                                                                }}
                                                            >
                                                                {getReplyText(
                                                                    msg?.replyTo
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {!mine && (
                                                        <strong>
                                                            {
                                                                msg?.sender?.username ||
                                                                otherUser?.username ||
                                                                "User"
                                                            }
                                                        </strong>
                                                    )}

                                                    {/* ================================
                                                        IMAGE
                                                    ================================= */}

                                                    {isImage &&
                                                        imageUrl && (
                                                            <img
                                                                src={getImageUrl(
                                                                    imageUrl
                                                                )}
                                                                alt="Sent"
                                                                style={{
                                                                    display:
                                                                        "block",
                                                                    width:
                                                                        "min(280px, 100%)",
                                                                    maxWidth:
                                                                        "280px",
                                                                    maxHeight:
                                                                        "360px",
                                                                    objectFit:
                                                                        "cover",
                                                                    borderRadius:
                                                                        "12px",
                                                                    marginBottom:
                                                                        "8px",
                                                                }}
                                                                onError={(
                                                                    e
                                                                ) => {
                                                                    e.currentTarget.style.display =
                                                                        "none";
                                                                }}
                                                            />
                                                        )}

                                                    {/* ================================
                                                        AUDIO / VOICE MESSAGE
                                                    ================================= */}

                                                    {isAudio &&
                                                        msg?.audioUrl && (
                                                            <div
                                                                style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "8px",
                                                                    minWidth: "230px",
                                                                    maxWidth: "280px",
                                                                    marginBottom: "8px",
                                                                }}
                                                            >
                                                                <span
                                                                    style={{
                                                                        fontSize: "20px",
                                                                    }}
                                                                >
                                                                    🎤
                                                                </span>

                                                                <audio
                                                                    controls
                                                                    preload="metadata"
                                                                    src={getFileUrl(
                                                                        msg.audioUrl
                                                                    )}
                                                                    style={{
                                                                        width: "100%",
                                                                        maxWidth: "240px",
                                                                        height: "38px",
                                                                    }}
                                                                />
                                                            </div>
                                                        )}

                                                    {/* ================================
                                                        FILE
                                                    ================================= */}

                                                    {isFile &&
                                                        !isImage &&
                                                        !isAudio && (
                                                            <FileMessages
                                                                message={
                                                                    msg
                                                                }
                                                                isOwn={
                                                                    mine
                                                                }
                                                            />
                                                        )}

                                                    {/* ================================
                                                        TEXT
                                                    ================================= */}

                                                    {!isFile &&
                                                        !isImage &&
                                                        !isAudio &&
                                                        getMessageText(
                                                            msg
                                                        ) && (
                                                            <p>
                                                                {getMessageText(
                                                                    msg
                                                                )}
                                                            </p>
                                                        )}

                                                    {/* ================================
                                                        TIME
                                                    ================================= */}

                                                    <span>
                                                        {formatTime(
                                                            msg?.createdAt
                                                        )}

                                                        {mine && (
                                                            <span
                                                                style={{
                                                                    marginLeft:
                                                                        "6px",
                                                                    fontSize:
                                                                        "11px",
                                                                }}
                                                            >
                                                                {msg?.read
                                                                    ? "✓✓"
                                                                    : msg?.delivered
                                                                    ? "✓✓"
                                                                    : "✓"}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }
                                )
                            )}

                            {typingUser && (
                                <div className="typing-indicator">
                                    <span className="typing-dots">
                                        <i></i>
                                        <i></i>
                                        <i></i>
                                    </span>

                                    <span>
                                        {
                                            typingUser
                                        }{" "}
                                        is typing...
                                    </span>
                                </div>
                            )}

                            <div
                                ref={
                                    messagesEndRef
                                }
                            />
                        </>
                    )}
                </section>

                {/* =================================
                    SELECTED FILE PREVIEW
                ================================= */}

                {selectedFile && (
                    <div
                        style={{
                            display:
                                "flex",
                            alignItems:
                                "center",
                            gap:
                                "12px",
                            padding:
                                "10px 16px",
                            borderTop:
                                "1px solid #e5e7eb",
                            background:
                                "#ffffff",
                        }}
                    >
                        {filePreview ? (
                            <img
                                src={
                                    filePreview
                                }
                                alt="Selected file"
                                style={{
                                    width:
                                        "70px",
                                    height:
                                        "70px",
                                    objectFit:
                                        "cover",
                                    borderRadius:
                                        "10px",
                                    border:
                                        "1px solid #e5e7eb",
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width:
                                        "70px",
                                    height:
                                        "70px",
                                    borderRadius:
                                        "10px",
                                    background:
                                        "#eef2ff",
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    justifyContent:
                                        "center",
                                    fontSize:
                                        "28px",
                                    flexShrink:
                                        0,
                                }}
                            >
                                📎
                            </div>
                        )}

                        <div
                            style={{
                                flex:
                                    1,
                                minWidth:
                                    0,
                            }}
                        >
                            <strong
                                style={{
                                    display:
                                        "block",
                                    fontSize:
                                        "13px",
                                    color:
                                        "#374151",
                                    overflow:
                                        "hidden",
                                    textOverflow:
                                        "ellipsis",
                                    whiteSpace:
                                        "nowrap",
                                }}
                                title={
                                    selectedFile.name
                                }
                            >
                                {
                                    selectedFile.name
                                }
                            </strong>

                            <span
                                style={{
                                    display:
                                        "block",
                                    marginTop:
                                        "4px",
                                    fontSize:
                                        "11px",
                                    color:
                                        "#9ca3af",
                                }}
                            >
                                {formatFileSize(
                                    selectedFile.size
                                )}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={
                                clearSelectedFile
                            }
                            disabled={
                                fileUploading
                            }
                            style={{
                                width:
                                    "32px",
                                height:
                                    "32px",
                                border:
                                    "none",
                                borderRadius:
                                    "50%",
                                background:
                                    "#f3f4f6",
                                color:
                                    "#6b7280",
                                fontSize:
                                    "18px",
                                cursor:
                                    fileUploading
                                        ? "not-allowed"
                                        : "pointer",
                            }}
                            title="Remove attachment"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* =================================
                    REPLY PREVIEW
                ================================= */}

                {replyingTo && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px 16px",
                            borderTop: "1px solid #e5e7eb",
                            background: "#ffffff",
                        }}
                    >
                        <div
                            style={{
                                width: "3px",
                                height: "42px",
                                borderRadius: "3px",
                                background: "#6366f1",
                                flexShrink: 0,
                            }}
                        />

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
                                    color: "#4f46e5",
                                    marginBottom: "3px",
                                }}
                            >
                                Replying to{" "}
                                {replyingTo?.sender?.username ||
                                    "message"}
                            </div>

                            <div
                                style={{
                                    fontSize: "13px",
                                    color: "#6b7280",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {getReplyText(replyingTo)}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={cancelReply}
                            title="Cancel reply"
                            style={{
                                width: "30px",
                                height: "30px",
                                border: "none",
                                borderRadius: "50%",
                                background: "#f3f4f6",
                                color: "#6b7280",
                                fontSize: "18px",
                                cursor: "pointer",
                                flexShrink: 0,
                            }}
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* =================================
                    INPUT
                ================================= */}

                <footer className="message-input-area">

                    {/* FILE INPUT */}

                    <input
                        ref={
                            fileInputRef
                        }
                        type="file"

                        /*
                         * IMPORTANT:
                         * Do NOT use image/* here.
                         *
                         * This allows PDF, DOCX,
                         * XLSX, ZIP, images,
                         * audio and video.
                         */
                        accept="
                            .pdf,
                            .doc,
                            .docx,
                            .xls,
                            .xlsx,
                            .ppt,
                            .pptx,
                            .txt,
                            .csv,
                            .zip,
                            .jpg,
                            .jpeg,
                            .png,
                            .webp,
                            .gif,
                            .mp3,
                            .wav,
                            .ogg,
                            .m4a,
                            .aac,
                            .mp4,
                            .webm,
                            application/pdf,
                            application/msword,
                            application/vnd.openxmlformats-officedocument.wordprocessingml.document,
                            application/vnd.ms-excel,
                            application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
                            application/vnd.ms-powerpoint,
                            application/vnd.openxmlformats-officedocument.presentationml.presentation,
                            text/plain,
                            text/csv,
                            application/zip,
                            image/jpeg,
                            image/png,
                            image/webp,
                            image/gif,
                            audio/mpeg,
                            audio/wav,
                            video/mp4,
                            video/webm
                        "
                        onChange={
                            handleFileChange
                        }
                        style={{
                            display:
                                "none",
                        }}
                    />

                    {/* CAMERA */}

                    <button
                        type="button"
                        className="input-icon"
                        title="Camera"
                        onClick={
                            openCamera
                        }
                        disabled={
                            !selectedConversation ||
                            loadingMessages ||
                            fileUploading
                        }
                    >
                        📷
                    </button>

                    {/* =================================
                        MICROPHONE / VOICE MESSAGE
                    ================================= */}

                    {!isRecording ? (
                        <button
                            type="button"
                            className="input-icon"
                            title="Record voice message"
                            onClick={startVoiceRecording}
                            disabled={
                                !selectedConversation ||
                                !connected ||
                                loadingMessages ||
                                fileUploading ||
                                audioUploading
                            }
                        >
                            🎤
                        </button>
                    ) : (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "7px",
                            }}
                        >
                            <button
                                type="button"
                                className="input-icon"
                                title="Cancel recording"
                                onClick={cancelVoiceRecording}
                            >
                                ❌
                            </button>

                            <span
                                style={{
                                    color: "#ef4444",
                                    fontWeight: 700,
                                    fontSize: "13px",
                                    minWidth: "48px",
                                    textAlign: "center",
                                }}
                            >
                                🔴 {formatRecordingTime(recordingTime)}
                            </span>

                            <button
                                type="button"
                                className="send-button"
                                title="Send voice message"
                                onClick={stopVoiceRecording}
                            >
                                ➤
                            </button>
                        </div>
                    )}

                    {/* ATTACHMENT */}

                    <button
                        type="button"
                        className="input-icon"
                        title="Attach file"
                        onClick={() =>
                            fileInputRef.current?.click()
                        }
                        disabled={
                            !selectedConversation ||
                            loadingMessages ||
                            fileUploading
                        }
                    >
                        📎
                    </button>

                    {/* EMOJI PICKER */}

                    <div
                        ref={emojiPickerRef}
                        style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <button
                            type="button"
                            className="input-icon"
                            title="Emoji"
                            onClick={() =>
                                setShowEmojiPicker(
                                    (previous) => !previous
                                )
                            }
                            disabled={
                                !selectedConversation ||
                                loadingMessages ||
                                fileUploading
                            }
                        >
                            😊
                        </button>

                        {showEmojiPicker && (
                            <div
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    bottom: "52px",
                                    width: "320px",
                                    maxHeight: "300px",
                                    overflowY: "auto",
                                    padding: "12px",
                                    background: "#ffffff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "16px",
                                    boxShadow:
                                        "0 15px 40px rgba(0,0,0,0.18)",
                                    zIndex: 100,
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(8, 1fr)",
                                    gap: "4px",
                                }}
                            >
                                {EMOJI_LIST.map(
                                    (emoji, index) => (
                                        <button
                                            key={`${emoji}-${index}`}
                                            type="button"
                                            onClick={() => {
                                                setMessage(
                                                    (previous) =>
                                                        previous +
                                                        emoji
                                                );
                                                setShowEmojiPicker(
                                                    false
                                                );
                                            }}
                                            style={{
                                                border: "none",
                                                background:
                                                    "transparent",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                fontSize: "23px",
                                                width: "34px",
                                                height: "34px",
                                                display: "flex",
                                                alignItems:
                                                    "center",
                                                justifyContent:
                                                    "center",
                                                padding: 0,
                                            }}
                                            title={`Add ${emoji}`}
                                        >
                                            {emoji}
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                    </div>

                    {/* TEXT */}

                    <input
                        type="text"
                        value={
                            message
                        }
                        onChange={
                            handleMessageChange
                        }
                        onKeyDown={(e) => {
                            if (
                                e.key ===
                                "Enter"
                            ) {
                                e.preventDefault();

                                sendMessage();
                            }
                        }}
                        placeholder={
                            selectedConversation
                                ? fileUploading
                                    ? "Uploading file..."
                                    : "Type a message..."
                                : "Select a conversation..."
                        }
                        disabled={
                            !selectedConversation ||
                            loadingMessages ||
                            fileUploading
                        }
                    />

                    {/* SEND */}

                    <button
                        type="button"
                        className="send-button"
                        onClick={
                            sendMessage
                        }
                        disabled={
                            !connected ||
                            !selectedConversation ||
                            loadingMessages ||
                            fileUploading ||
                            isRecording ||
                            audioUploading ||
                            (!message.trim() &&
                                !selectedFile)
                        }
                    >
                        {fileUploading
                            ? "..."
                            : "➤"}
                    </button>
                </footer>
            </main>

            {/* =================================
                CAMERA MODAL
            ================================= */}

            {showCamera && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 1200,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                        background:
                            "rgba(0,0,0,0.78)",
                    }}
                    onClick={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeCamera();
                        }
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            maxWidth: "720px",
                            background:
                                "#111827",
                            borderRadius:
                                "20px",
                            padding: "18px",
                            boxShadow:
                                "0 20px 70px rgba(0,0,0,0.45)",
                        }}
                    >
                        {/* HEADER */}

                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "space-between",
                                marginBottom:
                                    "14px",
                            }}
                        >
                            <h2
                                style={{
                                    margin: 0,
                                    color:
                                        "#ffffff",
                                    fontSize:
                                        "20px",
                                    fontWeight:
                                        "700",
                                }}
                            >
                                Camera
                            </h2>

                            <button
                                type="button"
                                onClick={
                                    closeCamera
                                }
                                aria-label="Close camera"
                                title="Close"
                                style={{
                                    width:
                                        "38px",
                                    height:
                                        "38px",
                                    border:
                                        "none",
                                    borderRadius:
                                        "50%",
                                    background:
                                        "rgba(255,255,255,0.12)",
                                    color:
                                        "#ffffff",
                                    fontSize:
                                        "26px",
                                    cursor:
                                        "pointer",
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    justifyContent:
                                        "center",
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* CAMERA PREVIEW */}

                        <div
                            style={{
                                width:
                                    "100%",
                                background:
                                    "#000000",
                                borderRadius:
                                    "16px",
                                overflow:
                                    "hidden",
                                position:
                                    "relative",
                                minHeight:
                                    "280px",
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "center",
                            }}
                        >
                            {cameraStream &&
                            !cameraError ? (
                                <video
                                    ref={
                                        cameraVideoRef
                                    }
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{
                                        display:
                                            "block",
                                        width:
                                            "100%",
                                        maxHeight:
                                            "65vh",
                                        objectFit:
                                            "cover",
                                        transform:
                                            "scaleX(-1)",
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        minHeight:
                                            "280px",
                                        width:
                                            "100%",
                                        display:
                                            "flex",
                                        alignItems:
                                            "center",
                                        justifyContent:
                                            "center",
                                        textAlign:
                                            "center",
                                        padding:
                                            "30px",
                                        color:
                                            "#ffffff",
                                        fontSize:
                                            "15px",
                                        lineHeight:
                                            "1.5",
                                    }}
                                >
                                    {cameraError ||
                                        "Opening camera..."}
                                </div>
                            )}
                        </div>

                        {/* HIDDEN CANVAS */}

                        <canvas
                            ref={
                                cameraCanvasRef
                            }
                            style={{
                                display:
                                    "none",
                            }}
                        />

                        {/* CONTROLS */}

                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "center",
                                gap:
                                    "18px",
                                marginTop:
                                    "18px",
                            }}
                        >
                            <button
                                type="button"
                                onClick={
                                    closeCamera
                                }
                                style={{
                                    minWidth:
                                        "100px",
                                    padding:
                                        "11px 18px",
                                    border:
                                        "1px solid rgba(255,255,255,0.2)",
                                    borderRadius:
                                        "11px",
                                    background:
                                        "rgba(255,255,255,0.08)",
                                    color:
                                        "#ffffff",
                                    cursor:
                                        "pointer",
                                    fontSize:
                                        "14px",
                                    fontWeight:
                                        "600",
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={
                                    capturePhoto
                                }
                                disabled={
                                    !cameraStream ||
                                    !!cameraError
                                }
                                aria-label="Take photo"
                                title="Take photo"
                                style={{
                                    width:
                                        "68px",
                                    height:
                                        "68px",
                                    borderRadius:
                                        "50%",
                                    border:
                                        "5px solid #ffffff",
                                    background:
                                        "#ffffff",
                                    boxShadow:
                                        "0 4px 20px rgba(0,0,0,0.35)",
                                    cursor:
                                        !cameraStream ||
                                        cameraError
                                            ? "not-allowed"
                                            : "pointer",
                                    opacity:
                                        !cameraStream ||
                                        cameraError
                                            ? 0.5
                                            : 1,
                                }}
                            />
                        </div>

                        <p
                            style={{
                                margin:
                                    "12px 0 0",
                                textAlign:
                                    "center",
                                color:
                                    "#9ca3af",
                                fontSize:
                                    "12px",
                            }}
                        >
                            Take a photo and it will
                            appear in the message box
                            ready to send.
                        </p>
                    </div>
                </div>
            )}

            {/* =================================
                FORWARD MESSAGE MODAL
            ================================= */}

            {forwardingMessage && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 1100,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                        background:
                            "rgba(15,23,42,0.45)",
                    }}
                    onClick={closeForwardDialog}
                >
                    <div
                        style={{
                            width: "100%",
                            maxWidth: "430px",
                            maxHeight: "80vh",
                            overflowY: "auto",
                            background: "#ffffff",
                            borderRadius: "20px",
                            padding: "24px",
                            boxShadow:
                                "0 20px 60px rgba(0,0,0,0.18)",
                        }}
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent:
                                    "space-between",
                                marginBottom: "18px",
                            }}
                        >
                            <div>
                                <h2
                                    style={{
                                        margin: 0,
                                        color: "#111827",
                                        fontSize: "20px",
                                    }}
                                >
                                    Forward message
                                </h2>

                                <p
                                    style={{
                                        margin:
                                            "5px 0 0",
                                        color: "#6b7280",
                                        fontSize: "12px",
                                    }}
                                >
                                    Choose a conversation
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeForwardDialog}
                                disabled={forwarding}
                                style={{
                                    width: "34px",
                                    height: "34px",
                                    border: "none",
                                    borderRadius: "50%",
                                    background:
                                        "#f3f4f6",
                                    fontSize: "20px",
                                    cursor: forwarding
                                        ? "not-allowed"
                                        : "pointer",
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div
                            style={{
                                padding: "10px 12px",
                                marginBottom: "15px",
                                borderRadius: "10px",
                                background: "#f8fafc",
                                border:
                                    "1px solid #e5e7eb",
                                fontSize: "13px",
                                color: "#4b5563",
                                overflow: "hidden",
                                textOverflow:
                                    "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                            title={getMessageText(
                                forwardingMessage
                            )}
                        >
                            {getMessageText(
                                forwardingMessage
                            )}
                        </div>

                        {conversations.length === 0 ? (
                            <div
                                style={{
                                    padding: "25px 10px",
                                    textAlign: "center",
                                    color: "#6b7280",
                                }}
                            >
                                No conversations available.
                            </div>
                        ) : (
                            conversations.map(
                                (targetConversation) => {
                                    const participant =
                                        getOtherParticipant(
                                            targetConversation
                                        );

                                    if (!participant) {
                                        return null;
                                    }

                                    const targetId =
                                        targetConversation?._id?.toString();

                                    const isCurrent =
                                        targetId ===
                                        conversationId?.toString();

                                    return (
                                        <button
                                            key={
                                                targetId
                                            }
                                            type="button"
                                            onClick={() =>
                                                forwardMessageToConversation(
                                                    targetConversation
                                                )
                                            }
                                            disabled={
                                                forwarding
                                            }
                                            style={{
                                                width: "100%",
                                                display:
                                                    "flex",
                                                alignItems:
                                                    "center",
                                                gap: "12px",
                                                padding:
                                                    "10px",
                                                marginBottom:
                                                    "8px",
                                                border:
                                                    "1px solid #e5e7eb",
                                                borderRadius:
                                                    "12px",
                                                background:
                                                    "#ffffff",
                                                cursor:
                                                    forwarding
                                                        ? "not-allowed"
                                                        : "pointer",
                                                textAlign:
                                                    "left",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width:
                                                        "42px",
                                                    height:
                                                        "42px",
                                                    borderRadius:
                                                        "50%",
                                                    background:
                                                        "#6366f1",
                                                    color:
                                                        "#ffffff",
                                                    display:
                                                        "flex",
                                                    alignItems:
                                                        "center",
                                                    justifyContent:
                                                        "center",
                                                    flexShrink: 0,
                                                    overflow:
                                                        "hidden",
                                                    fontWeight:
                                                        "700",
                                                }}
                                            >
                                                {participant.profilePicture ? (
                                                    <img
                                                        src={getImageUrl(
                                                            participant.profilePicture
                                                        )}
                                                        alt={
                                                            participant.username
                                                        }
                                                        style={{
                                                            width:
                                                                "100%",
                                                            height:
                                                                "100%",
                                                            objectFit:
                                                                "cover",
                                                        }}
                                                    />
                                                ) : (
                                                    (
                                                        participant.username ||
                                                        "U"
                                                    )
                                                        .charAt(
                                                            0
                                                        )
                                                        .toUpperCase()
                                                )}
                                            </div>

                                            <div
                                                style={{
                                                    minWidth:
                                                        0,
                                                    flex: 1,
                                                }}
                                            >
                                                <strong
                                                    style={{
                                                        display:
                                                            "block",
                                                        color:
                                                            "#111827",
                                                        fontSize:
                                                            "14px",
                                                    }}
                                                >
                                                    {
                                                        participant.username
                                                    }
                                                </strong>

                                                <span
                                                    style={{
                                                        display:
                                                            "block",
                                                        marginTop:
                                                            "2px",
                                                        color:
                                                            "#9ca3af",
                                                        fontSize:
                                                            "11px",
                                                    }}
                                                >
                                                    {isCurrent
                                                        ? "Current conversation"
                                                        : "Send here"}
                                                </span>
                                            </div>

                                            <span
                                                style={{
                                                    color:
                                                        "#4f46e5",
                                                    fontWeight:
                                                        "700",
                                                    fontSize:
                                                        "12px",
                                                }}
                                            >
                                                {forwarding
                                                    ? "..."
                                                    : "Forward"}
                                            </span>
                                        </button>
                                    );
                                }
                            )
                        )}
                    </div>
                </div>
            )}

            {/* =================================
                PROFILE MODAL
            ================================= */}

            {showProfile && (
                <div
                    style={{
                        position:
                            "fixed",
                        inset: 0,
                        zIndex: 1000,
                        display:
                            "flex",
                        alignItems:
                            "center",
                        justifyContent:
                            "center",
                        padding: "20px",
                        background:
                            "rgba(15,23,42,0.45)",
                    }}
                    onClick={() =>
                        setShowProfile(
                            false
                        )
                    }
                >
                    <div
                        style={{
                            width: "100%",
                            maxWidth:
                                "430px",
                            maxHeight:
                                "90vh",
                            overflowY:
                                "auto",
                            background:
                                "#ffffff",
                            borderRadius:
                                "20px",
                            padding:
                                "30px",
                            boxShadow:
                                "0 20px 60px rgba(0,0,0,0.18)",
                        }}
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >
                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "space-between",
                                marginBottom:
                                    "25px",
                            }}
                        >
                            <h2
                                style={{
                                    margin: 0,
                                    color:
                                        "#111827",
                                }}
                            >
                                My Profile
                            </h2>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowProfile(
                                        false
                                    )
                                }
                                style={{
                                    width:
                                        "34px",
                                    height:
                                        "34px",
                                    border:
                                        "none",
                                    borderRadius:
                                        "50%",
                                    background:
                                        "#f3f4f6",
                                    fontSize:
                                        "20px",
                                    cursor:
                                        "pointer",
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div
                            style={{
                                display:
                                    "flex",
                                flexDirection:
                                    "column",
                                alignItems:
                                    "center",
                                marginBottom:
                                    "24px",
                            }}
                        >
                            {profilePreview ? (
                                <img
                                    src={
                                        profilePreview
                                    }
                                    alt="Profile"
                                    style={{
                                        width:
                                            "100px",
                                        height:
                                            "100px",
                                        borderRadius:
                                            "50%",
                                        objectFit:
                                            "cover",
                                        border:
                                            "4px solid #eef2ff",
                                        marginBottom:
                                            "12px",
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width:
                                            "100px",
                                        height:
                                            "100px",
                                        borderRadius:
                                            "50%",
                                        display:
                                            "flex",
                                        alignItems:
                                            "center",
                                        justifyContent:
                                            "center",
                                        background:
                                            "#6366f1",
                                        color:
                                            "#ffffff",
                                        fontSize:
                                            "36px",
                                        fontWeight:
                                            "700",
                                    }}
                                >
                                    {
                                        currentUserInitial
                                    }
                                </div>
                            )}
                        </div>

                        {profileError && (
                            <div
                                style={{
                                    padding:
                                        "11px",
                                    marginBottom:
                                        "15px",
                                    borderRadius:
                                        "10px",
                                    background:
                                        "#fee2e2",
                                    color:
                                        "#dc2626",
                                    fontSize:
                                        "13px",
                                }}
                            >
                                {
                                    profileError
                                }
                            </div>
                        )}

                        {profileSuccess && (
                            <div
                                style={{
                                    padding:
                                        "11px",
                                    marginBottom:
                                        "15px",
                                    borderRadius:
                                        "10px",
                                    background:
                                        "#dcfce7",
                                    color:
                                        "#16a34a",
                                    fontSize:
                                        "13px",
                                }}
                            >
                                {
                                    profileSuccess
                                }
                            </div>
                        )}

                        {!editingProfile ? (
                            <>
                                <div
                                    style={{
                                        textAlign:
                                            "center",
                                        marginBottom:
                                            "18px",
                                    }}
                                >
                                    <h3
                                        style={{
                                            margin:
                                                "0 0 5px",
                                            color:
                                                "#111827",
                                        }}
                                    >
                                        {
                                            currentUser.username
                                        }
                                    </h3>

                                    <p
                                        style={{
                                            margin:
                                                0,
                                            color:
                                                "#9ca3af",
                                            fontSize:
                                                "14px",
                                        }}
                                    >
                                        {
                                            currentUser.email
                                        }
                                    </p>
                                </div>

                                <div
                                    style={{
                                        padding:
                                            "15px",
                                        borderRadius:
                                            "12px",
                                        background:
                                            "#f8fafc",
                                        marginBottom:
                                            "20px",
                                        textAlign:
                                            "center",
                                    }}
                                >
                                    <p
                                        style={{
                                            margin:
                                                0,
                                            color:
                                                "#6b7280",
                                            fontSize:
                                                "14px",
                                        }}
                                    >
                                        {currentUser.bio ||
                                            "No bio added yet."}
                                    </p>
                                </div>

                                <div
                                    style={{
                                        display:
                                            "flex",
                                        justifyContent:
                                            "center",
                                        gap:
                                            "7px",
                                        marginBottom:
                                            "20px",
                                        color:
                                            "#22c55e",
                                        fontSize:
                                            "13px",
                                        fontWeight:
                                            "600",
                                    }}
                                >
                                    <span
                                        style={{
                                            width:
                                                "8px",
                                            height:
                                                "8px",
                                            borderRadius:
                                                "50%",
                                            background:
                                                "#22c55e",
                                        }}
                                    />

                                    {connected
                                        ? "Online"
                                        : "Offline"}
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        startEditingProfile
                                    }
                                    style={{
                                        width:
                                            "100%",
                                        padding:
                                            "13px",
                                        border:
                                            "none",
                                        borderRadius:
                                            "10px",
                                        background:
                                            "#6366f1",
                                        color:
                                            "#ffffff",
                                        fontWeight:
                                            "600",
                                        cursor:
                                            "pointer",
                                    }}
                                >
                                    ✏️ Edit Profile
                                </button>
                            </>
                        ) : (
                            <>
                                <label
                                    style={{
                                        display:
                                            "block",
                                        marginBottom:
                                            "7px",
                                        fontWeight:
                                            "600",
                                        color:
                                            "#111827",
                                    }}
                                >
                                    Username
                                </label>

                                <input
                                    type="text"
                                    value={
                                        profileUsername
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setProfileUsername(
                                            e.target.value
                                        )
                                    }
                                    maxLength={
                                        30
                                    }
                                    style={{
                                        width:
                                            "100%",
                                        boxSizing:
                                            "border-box",
                                        padding:
                                            "12px",
                                        marginBottom:
                                            "16px",
                                        border:
                                            "1px solid #dfe3eb",
                                        borderRadius:
                                            "10px",
                                        outline:
                                            "none",
                                    }}
                                />

                                <label
                                    style={{
                                        display:
                                            "block",
                                        marginBottom:
                                            "7px",
                                        fontWeight:
                                            "600",
                                        color:
                                            "#111827",
                                    }}
                                >
                                    Bio
                                </label>

                                <textarea
                                    value={
                                        profileBio
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setProfileBio(
                                            e.target.value
                                        )
                                    }
                                    maxLength={
                                        150
                                    }
                                    rows={4}
                                    placeholder="Tell people something about you..."
                                    style={{
                                        width:
                                            "100%",
                                        boxSizing:
                                            "border-box",
                                        padding:
                                            "12px",
                                        marginBottom:
                                            "5px",
                                        border:
                                            "1px solid #dfe3eb",
                                        borderRadius:
                                            "10px",
                                        resize:
                                            "vertical",
                                        outline:
                                            "none",
                                    }}
                                />

                                <div
                                    style={{
                                        textAlign:
                                            "right",
                                        marginBottom:
                                            "18px",
                                        color:
                                            "#9ca3af",
                                        fontSize:
                                            "11px",
                                    }}
                                >
                                    {
                                        profileBio.length
                                    }
                                    /150
                                </div>

                                <label
                                    style={{
                                        display:
                                            "block",
                                        marginBottom:
                                            "8px",
                                        fontWeight:
                                            "600",
                                        color:
                                            "#111827",
                                    }}
                                >
                                    Profile Picture
                                </label>

                                <div
                                    style={{
                                        border:
                                            "1px dashed #c7d2fe",
                                        borderRadius:
                                            "12px",
                                        padding:
                                            "16px",
                                        background:
                                            "#f8faff",
                                        marginBottom:
                                            "20px",
                                        textAlign:
                                            "center",
                                    }}
                                >
                                    <input
                                        id="profile-picture-input"
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        onChange={
                                            handleProfileFileChange
                                        }
                                        style={{
                                            display:
                                                "none",
                                        }}
                                    />

                                    <label
                                        htmlFor="profile-picture-input"
                                        style={{
                                            display:
                                                "inline-block",
                                            padding:
                                                "10px 18px",
                                            borderRadius:
                                                "9px",
                                            background:
                                                "#6366f1",
                                            color:
                                                "#ffffff",
                                            fontWeight:
                                                "600",
                                            fontSize:
                                                "13px",
                                            cursor:
                                                "pointer",
                                        }}
                                    >
                                        📷 Choose Photo
                                    </label>

                                    <p
                                        style={{
                                            margin:
                                                "10px 0 0",
                                            color:
                                                "#6b7280",
                                            fontSize:
                                                "12px",
                                        }}
                                    >
                                        JPG, PNG or WEBP
                                        <br />
                                        Maximum 5 MB
                                    </p>

                                    {profileFile && (
                                        <div
                                            style={{
                                                marginTop:
                                                    "10px",
                                                fontSize:
                                                    "12px",
                                                color:
                                                    "#4b5563",
                                            }}
                                        >
                                            Selected:{" "}
                                            {
                                                profileFile.name
                                            }
                                        </div>
                                    )}

                                    {(profilePreview ||
                                        profilePicture) && (
                                        <button
                                            type="button"
                                            onClick={
                                                removeProfileImage
                                            }
                                            style={{
                                                marginTop:
                                                    "10px",
                                                border:
                                                    "none",
                                                background:
                                                    "transparent",
                                                color:
                                                    "#dc2626",
                                                fontSize:
                                                    "12px",
                                                cursor:
                                                    "pointer",
                                            }}
                                        >
                                            Remove photo
                                        </button>
                                    )}
                                </div>

                                <div
                                    style={{
                                        display:
                                            "flex",
                                        gap:
                                            "10px",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingProfile(
                                                false
                                            );

                                            setProfileError(
                                                ""
                                            );

                                            setProfileSuccess(
                                                ""
                                            );

                                            setProfileFile(
                                                null
                                            );

                                            setRemoveCurrentPicture(
                                                false
                                            );

                                            setProfilePreview(
                                                getImageUrl(
                                                    currentUser?.profilePicture
                                                )
                                            );
                                        }}
                                        style={{
                                            flex: 1,
                                            padding:
                                                "12px",
                                            border:
                                                "1px solid #e5e7eb",
                                            borderRadius:
                                                "10px",
                                            background:
                                                "#ffffff",
                                            cursor:
                                                "pointer",
                                        }}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            updateProfile
                                        }
                                        disabled={
                                            profileLoading
                                        }
                                        style={{
                                            flex: 1,
                                            padding:
                                                "12px",
                                            border:
                                                "none",
                                            borderRadius:
                                                "10px",
                                            background:
                                                "#6366f1",
                                            color:
                                                "#ffffff",
                                            fontWeight:
                                                "600",
                                            cursor:
                                                profileLoading
                                                    ? "not-allowed"
                                                    : "pointer",
                                            opacity:
                                                profileLoading
                                                    ? 0.7
                                                    : 1,
                                        }}
                                    >
                                        {profileLoading
                                            ? "Uploading..."
                                            : "Save Changes"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;