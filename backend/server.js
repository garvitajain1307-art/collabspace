import { config } from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import User from "./src/models/user.js";
import Document from "./src/models/document.js";
import Workspace from "./src/models/workspace.js";
import { getDocumentAccess } from "./src/utils/documentAccess.js";

config();

const { connectDb } = await import("./src/config/db.js");

const { default: app } = await import("./src/app.js");

await connectDb();

const PORT = process.env.PORT || 4000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

//socket.IO middleware.

io.use(async (socket, next) => {
  console.log("Socket authentication middleware running");
  try {
    const cookies = cookie.parse(socket.handshake.headers.cookie || ""); //gets the cookies sent by browser
    const token = cookies.token;
    if (!token) {
      return next(new Error("Authentication error: Token not found"));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }
    socket.user = user;
    console.log("Authenticated user:", socket.user);
    next();
  } catch (error) {
    console.log("Socket authentication failed:", error.message);

    return next(new Error("Authentication failed"));
  }
});

//Whenever a client connects to our Socket.IO server, execute this function.

io.on("connection", (socket) => {
  //socket represents that particular client's connection.
  console.log("User connected:", socket.id);

  socket.on("joinDocument", async (documentId) => {
    try {
      console.log(`${socket.user._id} wants to join document: ${documentId}`);
      const document = await Document.findById(documentId);
      if (!document) {
        return socket.emit("joinError", "Document not found");
      }

      const workspace = await Workspace.findOne({
        _id: document.workspace,
        "members.user": socket.user._id,
      });
      if (!workspace) {
        return socket.emit(
          "joinError",
          "you are not a member of this workspace",
        );
      }

      console.log("USER ID:", socket.user._id.toString());

      console.log(
        "COLLABORATORS:",
        document.collaborators.map((c) => ({
          user: c.user?.toString(),
          permission: c.permission,
        })),
      );

      const access = getDocumentAccess(socket.user, document, workspace);

      console.log("ACCESS:", access);

    //   const access = getDocumentAccess(socket.user, document, workspace);
      console.log(access);

      if (access === "none") {
        return socket.emit(
          "joinError",
          "You don't have access to this document",
        );
      }

      socket.join(documentId);
      console.log(`${socket.user._id} joined document room: ${documentId} `);
      socket.emit(
        "joinedDocument",
        `Successfully joined document ${documentId}`,
      );
    } catch (error) {
      console.log("Join document error:", error.message);
      return socket.emit("joinError", "Unable to join document");
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error(`UnhandledRejection:${err.message} `);
  httpServer.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  console.error(`UncaughtException:${err.message} `);
  process.exit(1);
}); //server ekdum se hi bnd ho jaaega, concurrent servers ka wait ni krega to complete

export default httpServer;
