import express from 'express';
import cors from 'cors';
import {config} from "dotenv";

import cookieParser from "cookie-parser";
import { errorMiddleware } from './middlewares/error.js';





const app=express();


//middleware ko app.use() ke andr likhte hai
app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true
}));



app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({extended:true})); 

app.use(errorMiddleware);

export default app;
