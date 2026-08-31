import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL, {
    withCredentials: true
});

//Socket.IO automatically triggers the "connect" event when the connection is established.

socket.on("connect", () => {
    
    console.log("CONNECTED:", socket.id);

    // socket.emit("joinRoom", "document456");

    // socket.emit("sendRoomMessage", {
    //     roomId: "document456",
    //     message: `Hello from ${socket.id}`
    // });
});


// socket.on("roomMessage", (message) => {
//     console.log("ROOM MESSAGE:", message);
// });

// socket.on("receiveRoomMessage", (message) => {
//     console.log("ROOM MESSAGE RECEIVED:", message);
// });

socket.on("connect_error", (error) => {
    console.log("Socket connection error:", error.message);
});

// window.socket=socket;


export default socket;