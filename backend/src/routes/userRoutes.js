import express from "express";
import {registerUser,login,logout,getUser} from "../controllers/authController.js"
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router=express.Router();

router.post("/register",registerUser);
router.post("/login",login);
router.get("/logout",isAuthenticated,logout);
router.get("/getMe",isAuthenticated,getUser);


export default router;