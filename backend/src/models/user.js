
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxlength: [30, "Length cannot exceed 30 characters"]
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
            maxlength: [254, "Email cannot exceed 254 characters"],
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Please enter a valid email address"
            ]
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            select: false,
            minlength: [8, "Password must be at least 8 characters"]
        },

        resetPasswordToken: {
            type: String,
            select: false
        },

        resetPasswordExpire: {
            type: Date,
            select: false
        },

        avatar: {
            type: String,
            default: ""
        },

        workspaces: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Workspace"
            }
        ],

        ownedDocuments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Document"
            }
        ]
    },
    {
        timestamps: true
    }
);

userSchema.methods.generateToken = function () {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }

    return jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE || "7d"
        }
    );
};

const User = mongoose.model("User", userSchema);

export default User;
