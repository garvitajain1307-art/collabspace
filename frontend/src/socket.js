import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL, {
    withCredentials: true
});

//Socket.IO automatically triggers the "connect" event when the connection is established.

socket.on("connect", () => {
    
    console.log("CONNECTED:", socket.id);

    
});

export const joinDocument = (documentId) => {

    console.log("JOINING DOCUMENT:", documentId);
    socket.emit("joinDocument", documentId);

};


socket.on("joinedDocument", (message) => {
    console.log("JOINED:", message);
});

socket.on("userJoined", (user) => {
    console.log("USER JOINED:", user);
});

socket.on("userLeft",(user)=>{
    console.log("USER LEFT:", user);
    
})

socket.on("onlineUsers", (users) => {
    console.log("ONLINE USERS:", users);
});




socket.on("joinError", (message) => {
    console.log("JOIN ERROR:", message);
});



socket.on("connect_error", (error) => {
    console.log("Socket connection error:", error.message);
});

// window.socket=socket;


export default socket;