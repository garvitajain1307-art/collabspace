import express from "express";
import {registerUser,login,logout,getMe} from "../controllers/authController.js"
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router=express.Router();

router.post("/register",registerUser);
router.post("/login",login);
router.get("/logout",isAuthenticated,logout);
router.get("/getMe",isAuthenticated,getMe);


export default router;