
import { config } from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import * as Y from "yjs";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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
        origin: [
            "http://localhost:5173",
            "http://localhost:5174",
            "https://sarcasm-remember-eastbound.ngrok-free.dev"
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Socket authentication
io.use(async (socket, next) => {
    try {
        const cookies = cookie.parse(
            socket.handshake.headers.cookie || ""
        );

        const token = cookies.token;

        if (!token) {
            return next(new Error("Authentication error: Token not found"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.id) {
            return next(new Error("Invalid authentication token"));
        }

        const user = await User.findById(decoded.id);

        if (!user) {
            return next(new Error("Authentication error: User not found"));
        }

        socket.user = user;
        socket.data.userId = user._id.toString();

        next();
    } catch (error) {
        console.log("Socket authentication failed:", error.message);
        next(new Error("Authentication failed"));
    }
});

const documentUsers = new Map();
const documentYDocs = new Map();
const documentUpdateQueues = new Map();

// Get authorized document
const getAuthorizedDocument = async (user, documentId) => {
    if (!mongoose.isValidObjectId(documentId)) {
        return null;
    }

    const document = await Document.findById(documentId);

    if (!document) {
        return null;
    }

    const workspace = await Workspace.findOne({
        _id: document.workspace,
        "members.user": user._id
    });

    if (!workspace) {
        return null;
    }

    const access = getDocumentAccess(user, document, workspace);

    if (access === "none") {
        return null;
    }

    return { document, workspace, access };
};

// Get current online users
const getOnlineUsers = (documentId) => {
    const users = documentUsers.get(documentId);

    return users
        ? Array.from(users.values()).map(user => ({
            userId: user.userId,
            name: user.name
        }))
        : [];
};

// Add document user
const addDocumentUser = (documentId, socket) => {
    if (!documentUsers.has(documentId)) {
        documentUsers.set(documentId, new Map());
    }

    const users = documentUsers.get(documentId);
    const userId = socket.user._id.toString();

    let isNewUser = false;

    if (!users.has(userId)) {
        users.set(userId, {
            userId: socket.user._id,
            name: socket.user.name,
            sockets: new Set()
        });

        isNewUser = true;
    }

    users.get(userId).sockets.add(socket.id);

    return {
        isNewUser,
        onlineUsers: getOnlineUsers(documentId)
    };
};

// Remove document user
const removeDocumentUser = (documentId, socket) => {
    const users = documentUsers.get(documentId);

    if (!users) return;

    const userId = socket.user._id.toString();
    const user = users.get(userId);

    if (!user) return;

    user.sockets.delete(socket.id);

    if (user.sockets.size === 0) {
        users.delete(userId);

        socket.to(documentId).emit("userLeft", {
            userId: socket.user._id,
            name: socket.user.name
        });
    }

    socket.to(documentId).emit(
        "onlineUsers",
        getOnlineUsers(documentId)
    );

    if (users.size === 0) {
        documentUsers.delete(documentId);
    }
};

// Remove presence for a disconnected/revoked socket
const removePresenceBySocket = (documentId, userId, socketId) => {
    const users = documentUsers.get(documentId);

    if (!users) return;

    const user = users.get(userId);

    if (!user) return;

    user.sockets.delete(socketId);

    if (user.sockets.size === 0) {
        users.delete(userId);

        io.to(documentId).emit("userLeft", {
            userId: user.userId,
            name: user.name
        });
    }

    io.to(documentId).emit(
        "onlineUsers",
        getOnlineUsers(documentId)
    );

    if (users.size === 0) {
        documentUsers.delete(documentId);
    }
};

// Check recipient permissions before broadcasting
const broadcastToAuthorizedUsers = async (
    documentId,
    event,
    data,
    senderSocketId
) => {
    const sockets = await io.in(documentId).fetchSockets();

    for (const recipient of sockets) {
        if (recipient.id === senderSocketId) continue;

        const userId = recipient.data.userId;
        const user = await User.findById(userId);

        if (!user) {
            recipient.emit("accessRevoked", {
                message: "Your document access is no longer available"
            });

            await recipient.leave(documentId);
            removePresenceBySocket(documentId, userId, recipient.id);

            continue;
        }

        const authorized = await getAuthorizedDocument(
            user,
            documentId
        );

        if (!authorized) {
            recipient.emit("accessRevoked", {
                message: "Your document access is no longer available"
            });

            await recipient.leave(documentId);
            removePresenceBySocket(documentId, userId, recipient.id);

            continue;
        }

        recipient.emit(event, data);
    }
};

// Load Yjs document from MongoDB
const getYDocument = (documentId, document) => {
    if (!documentYDocs.has(documentId)) {
        const ydoc = new Y.Doc();

        if (document.content?.update) {
            const savedUpdate = new Uint8Array(
                document.content.update
            );

            Y.applyUpdate(ydoc, savedUpdate);
        }

        documentYDocs.set(documentId, ydoc);
    }

    return documentYDocs.get(documentId);
};

// Socket connections
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.documentId = null;

    // Join document
    socket.on("joinDocument", async (requestedDocumentId) => {
        try {
            const documentId = String(requestedDocumentId || "");

            console.log(
                `${socket.user._id} wants to join document: ${documentId}`
            );

            const authorized = await getAuthorizedDocument(
                socket.user,
                documentId
            );

            if (!authorized) {
                socket.emit(
                    "joinError",
                    "You don't have access to this document"
                );

                return;
            }

            const document = authorized.document;
            const access = authorized.access;

            const ydoc = getYDocument(documentId, document);
            const state = Y.encodeStateAsUpdate(ydoc);

            // Already in this document: send initial state again.
            if (socket.documentId === documentId) {
                socket.emit("yjsSync", {
                    documentId,
                    update: Array.from(state),
                    access
                });

                socket.emit(
                    "onlineUsers",
                    getOnlineUsers(documentId)
                );

                socket.emit(
                    "joinedDocument",
                    `Successfully joined document ${documentId}`
                );

                return;
            }

            // Leave previous document
            if (socket.documentId) {
                const previousDocumentId = socket.documentId;

                socket.leave(previousDocumentId);
                removeDocumentUser(previousDocumentId, socket);

                socket.documentId = null;
            }

            await socket.join(documentId);

            socket.documentId = documentId;

            // Send initial Yjs state
            socket.emit("yjsSync", {
                documentId,
                update: Array.from(state),
                access
            });

            // Update presence
            const presence = addDocumentUser(documentId, socket);

            socket.emit("onlineUsers", presence.onlineUsers);

            if (presence.isNewUser) {
                socket.to(documentId).emit("userJoined", {
                    userId: socket.user._id,
                    name: socket.user.name
                });
            }

            socket.emit(
                "joinedDocument",
                `Successfully joined document ${documentId}`
            );

            console.log(
                `${socket.user._id} joined document room: ${documentId}`
            );

        } catch (error) {
            console.log("Join document error:", error.message);

            socket.emit(
                "joinError",
                "Unable to join document"
            );
        }
    });

    // Leave document
    socket.on("leaveDocument", (documentId) => {
        if (!socket.documentId) return;

        if (
            documentId &&
            String(documentId) !== String(socket.documentId)
        ) {
            return;
        }

        const currentDocumentId = socket.documentId;

        socket.leave(currentDocumentId);
        removeDocumentUser(currentDocumentId, socket);

        socket.documentId = null;

        console.log(
            `${socket.user._id} left document room: ${currentDocumentId}`
        );
    });

    // Receive Yjs updates
    socket.on("yjsUpdate", async (data) => {
        const documentId = socket.documentId;

        if (!documentId || !Array.isArray(data?.update)) {
            return;
        }

        const previousUpdate =
            documentUpdateQueues.get(documentId) || Promise.resolve();

        const currentUpdate = previousUpdate
            .catch(() => {})
            .then(async () => {
                const authorized = await getAuthorizedDocument(
                    socket.user,
                    documentId
                );

                if (!authorized) {
                    socket.emit("accessRevoked", {
                        message: "Your document access is no longer available"
                    });

                    socket.leave(documentId);
                    removeDocumentUser(documentId, socket);
                    socket.documentId = null;

                    return;
                }

                if (
                    authorized.access !== "owner" &&
                    authorized.access !== "editor"
                ) {
                    console.log("Update rejected: User is VIEWER");
                    return;
                }

                const ydoc = documentYDocs.get(documentId);

                if (!ydoc) return;

                const update = new Uint8Array(data.update);

                Y.applyUpdate(ydoc, update);

                const state = Y.encodeStateAsUpdate(ydoc);

                authorized.document.content = {
                    update: Array.from(state)
                };

                await authorized.document.save();

                console.log("DOCUMENT SAVED TO MONGODB");

                await broadcastToAuthorizedUsers(
                    documentId,
                    "yjsUpdate",
                    {
                        documentId,
                        update: data.update
                    },
                    socket.id
                );
            });

        documentUpdateQueues.set(documentId, currentUpdate);

        try {
            await currentUpdate;
        } catch (error) {
            console.log("YJS UPDATE ERROR:", error.message);
        } finally {
            if (
                documentUpdateQueues.get(documentId) === currentUpdate
            ) {
                documentUpdateQueues.delete(documentId);
            }
        }
    });

    // Awareness updates
    socket.on("awarenessUpdate", async (data) => {
        try {
            const documentId = socket.documentId;

            if (!documentId || !Array.isArray(data?.update)) {
                return;
            }

            const authorized = await getAuthorizedDocument(
                socket.user,
                documentId
            );

            if (!authorized) {
                socket.emit("accessRevoked", {
                    message: "Your document access is no longer available"
                });

                socket.leave(documentId);
                removeDocumentUser(documentId, socket);
                socket.documentId = null;

                return;
            }

            await broadcastToAuthorizedUsers(
                documentId,
                "awarenessUpdate",
                {
                    documentId,
                    update: data.update
                },
                socket.id
            );

        } catch (error) {
            console.log("AWARENESS UPDATE ERROR:", error.message);
        }
    });

    // Disconnect cleanup
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);

        if (socket.documentId) {
            const documentId = socket.documentId;

            removeDocumentUser(documentId, socket);
            socket.documentId = null;
        }
    });
});

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
    console.error(`UnhandledRejection: ${err.message}`);

    httpServer.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
    console.error(`UncaughtException: ${err.message}`);

    process.exit(1);
});

export default httpServer;
