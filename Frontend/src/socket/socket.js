import { io } from "socket.io-client";

const socket = io("https://chitchat-backend-dpbp.onrender.com", {
    autoConnect: false,
});

export default socket;