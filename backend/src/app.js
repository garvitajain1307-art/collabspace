import express from 'express';
import cors from 'cors';
import {config} from "dotenv";

import authRouter from './routes/userRoutes.js';
import workspaceRouter from './routes/workspaceRoutes.js'
import invitationRouter from './routes/invitationRoutes.js'
import folderRouter from './routes/folderRoutes.js'
import documentRouter from './routes/documentRoutes.js'
import commentRouter from "./routes/commentRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import activityRouter from "./routes/activityRoutes.js";

import cookieParser from "cookie-parser";
import { errorMiddleware } from './middlewares/error.js';

const app=express();

//middleware ko app.use() ke andr likhte hai
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174","https://sarcasm-remember-eastbound.ngrok-free.dev"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true
}));


app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({extended:true})); 

app.use("/api/v1/user",authRouter);
app.use("/api/v1/workspace",workspaceRouter);
app.use("/api/v1/invitation",invitationRouter);
app.use("/api/v1/folder",folderRouter);
app.use("/api/v1/document",documentRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/activity", activityRouter);







app.use(errorMiddleware);

export default app;
