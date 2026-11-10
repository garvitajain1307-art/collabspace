
import { asyncHandler } from "./asyncHandler.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const isAuthenticated = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        return next(
            new ErrorHandler("Please login to access this resource", 401)
        );
    }

    if (!process.env.JWT_SECRET) {
        return next(
            new ErrorHandler("Server authentication configuration error", 500)
        );
    }

    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return next(
            new ErrorHandler("Invalid or expired token", 401)
        );
    }

    if (!decoded?.id) {
        return next(
            new ErrorHandler("Invalid authentication token", 401)
        );
    }

    const user = await User.findById(decoded.id);

    if (!user) {
        return next(
            new ErrorHandler("User not found. Please login again", 401)
        );
    }

    req.user = user;

    next();
});
