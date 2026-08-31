import { config } from "dotenv";
import {createServer} from "http";
import {Server} from "socket.io"


config();



const { connectDb } = await import("./src/config/db.js");

const { default: app } = await import("./src/app.js");


await connectDb()


const PORT=process.env.PORT || 4000;

const httpServer=createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true
    }
});

//Whenever a client connects to our Socket.IO server, execute this function.

io.on("connection", (socket) => {  //socket represents that particular client's connection.
    console.log("User connected:", socket.id);

    
    // socket.on("joinRoom",(roomId)=>{
    //     socket.join(roomId);
    //     console.log(`${socket.id} joined room: ${roomId}`);

    //     // io.to(roomId).emit("roomMessage", `User ${socket.id} joined ${roomId}`);
    // })

    // socket.on("sendRoomMessage", ({ roomId, message }) => {
    //     console.log(`Message in ${roomId}:`, message);

    //     io.to(roomId).emit("receiveRoomMessage", message);
    // });


    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

httpServer.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})



process.on("unhandledRejection",(err)=>{
    console.error(`UnhandledRejection:${err.message} `);
    httpServer.close(()=>process.exit(1));

}); 



process.on("uncaughtException",(err)=>{
    console.error(`UncaughtException:${err.message} `);
    process.exit(1);

}); //server ekdum se hi bnd ho jaaega, concurrent servers ka wait ni krega to complete

export default httpServer;