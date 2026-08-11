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
            maxlength: [50, "Length cannot exceed 50 characters"],
            lowercase: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                "Please enter a valid email address"
            ]
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            select: false,
            minlength: [8, "Password must be at least 8 characters"]
        },

        resetPasswordToken: String,

        resetPasswordExpire: Date,

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
    return jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE
        }
    );
};

const User = mongoose.model("User", userSchema);

export default User;