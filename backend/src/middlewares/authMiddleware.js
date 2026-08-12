import { asyncHandler } from "./asyncHandler.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const isAuthenticated=asyncHandler(async (req,res,next) => {
    const token=req.cookies.token;
    if(!token){
        return next(new ErrorHandler("Please login to access this resource",401));
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(new ErrorHandler("Invalid or expired token", 401));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ErrorHandler("User not found with this id", 401));
    }
    req.user = user;
    next();
    
    
})