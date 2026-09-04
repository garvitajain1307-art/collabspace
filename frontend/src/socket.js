import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL, {
    withCredentials: true
});

//Socket.IO automatically triggers the "connect" event when the connection is established.

socket.on("connect", () => {
    
    console.log("CONNECTED:", socket.id);

    socket.emit("joinDocument", "6a8bea47e04e876cf8ce68d7");

   
});


socket.on("joinedDocument", (message) => {
    console.log("JOINED:", message);
});

socket.on("joinError", (message) => {
    console.log("JOIN ERROR:", message);
});

socket.on("connect_error", (error) => {
    console.log("Socket connection error:", error.message);
});

// window.socket=socket;


export default socket;