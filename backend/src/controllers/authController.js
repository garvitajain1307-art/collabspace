
import ErrorHandler from "../middlewares/error.js";
import User from "../models/user.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import bcrypt from "bcrypt";
import { check, validationResult } from "express-validator";
import { generateToken } from "../utils/generateToken.js";

const handleValidationErrors = (req, res, fields) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Please correct the validation errors",
            errors: errors.array().map((error) => error.msg),
            oldInput: fields
        });
    }

    return null;
};

export const registerUser = [
    check("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ max: 30 })
        .withMessage("Name cannot exceed 30 characters")
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage("Name can only contain letters and spaces"),

    check("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please enter a valid email address")
        .normalizeEmail(),

    check("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long")
        .matches(/[a-z]/)
        .withMessage("Password must contain at least one lowercase letter")
        .matches(/[A-Z]/)
        .withMessage("Password must contain at least one uppercase letter")
        .matches(/[0-9]/)
        .withMessage("Password must contain at least one digit")
        .matches(/[!@#$%^&*(),.?":{}|<>/]/)
        .withMessage("Password must contain at least one special character"),

    check("confirmPassword")
        .notEmpty()
        .withMessage("Please confirm your password")
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error("Passwords do not match");
            }

            return true;
        }),

    asyncHandler(async (req, res, next) => {
        const { name, email, password } = req.body;

        const validationResponse = handleValidationErrors(
            req,
            res,
            { name, email }
        );

        if (validationResponse) {
            return validationResponse;
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return next(
                new ErrorHandler("User already exists", 400)
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        if (!user) {
            return next(
                new ErrorHandler("Unable to create user", 500)
            );
        }

        return generateToken(
            user,
            201,
            "User registered successfully",
            res
        );
    })
];

export const login = [
    check("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Please enter a valid email address")
        .normalizeEmail(),

    check("password")
        .notEmpty()
        .withMessage("Password is required"),

    asyncHandler(async (req, res, next) => {
        const { email, password } = req.body;

        const validationResponse = handleValidationErrors(
            req,
            res,
            { email }
        );

        if (validationResponse) {
            return validationResponse;
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return next(
                new ErrorHandler("Invalid credentials", 401)
            );
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return next(
                new ErrorHandler("Invalid credentials", 401)
            );
        }

        return generateToken(
            user,
            200,
            "Login successful",
            res
        );
    })
];

export const logout = asyncHandler(async (req, res) => {
    const isProduction = process.env.NODE_ENV === "production";

    res.clearCookie("token", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/"
    });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
});

export const getMe = asyncHandler(async (req, res) => {
    const user = req.user;

    return res.status(200).json({
        success: true,
        message: "User found",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            workspaces: user.workspaces,
            ownedDocuments: user.ownedDocuments
        }
    });
});
