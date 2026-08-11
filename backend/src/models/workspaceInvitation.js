import mongoose from "mongoose";

const workspaceInvitationSchema = new mongoose.Schema(
    {
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true
        },

        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        role: {
            type: String,
            enum: ["admin", "member"],
            default: "member"
        },

        token: {
            type: String,
            required: true,
            unique: true
        },

        status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "expired"],
            default: "pending"
        },

        expiresAt: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const WorkspaceInvitation = mongoose.model(
    "WorkspaceInvitation",
    workspaceInvitationSchema
);

export default WorkspaceInvitation;