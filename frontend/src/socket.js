
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL, {
    withCredentials: true
});

socket.on("connect", () => {
    console.log("CONNECTED:", socket.id);
});

export const joinDocument = (documentId) => {

    if (!documentId) return;

    console.log("JOINING DOCUMENT:", documentId);

    socket.emit("joinDocument", documentId);
};

export const leaveDocument = (documentId) => {

    if (!documentId) return;

    console.log("LEAVING DOCUMENT:", documentId);

    socket.emit("leaveDocument", documentId);
};

socket.on("joinedDocument", (message) => {
    console.log("JOINED:", message);
});

socket.on("userJoined", (user) => {
    console.log("USER JOINED:", user);
});

socket.on("userLeft", (user) => {
    console.log("USER LEFT:", user);
});

socket.on("onlineUsers", (users) => {
    console.log("ONLINE USERS:", users);
});

socket.on("joinError", (message) => {
    console.log("JOIN ERROR:", message);
});

socket.on("accessRevoked", (data) => {

    console.log("DOCUMENT ACCESS REVOKED:", data.message);

});

socket.on("connect_error", (error) => {
    console.log("Socket connection error:", error.message);
});

export default socket;
