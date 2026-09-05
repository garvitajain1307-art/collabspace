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

socket.on("userJoined", (user) => {
    console.log("USER JOINED:", user);
});

socket.on("userLeft",(user)=>{
    console.log("USER LEFT:", user);
    
})

socket.on("onlineUsers", (users) => {
    console.log("ONLINE USERS:", users);
});


let lastSent=0;

document.addEventListener("mousemove",(event)=>{
    //  console.log("MOUSE MOVED");
    const now=Date.now();
    if(now-lastSent<50){
        return;
    }
    lastSent=now;
    // console.log("SENDING CURSOR:", event.clientX, event.clientY);
    socket.emit("cursorMove", {
        x: event.clientX,
        y: event.clientY
    });
    
})


socket.on("cursorMove", (data) => {
    console.log("CURSOR MOVE:", data);
});

socket.on("joinError", (message) => {
    console.log("JOIN ERROR:", message);
});



socket.on("connect_error", (error) => {
    console.log("Socket connection error:", error.message);
});

// window.socket=socket;


export default socket;