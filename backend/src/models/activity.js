import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
    {
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        action: {
            type: String,
            enum: [
                "workspace_created",
                "member_joined",
                "member_invited",
                "folder_created",
                "document_created",
                "document_updated",
                "document_shared",
                "comment_added",
                "suggestion_created",
                "suggestion_accepted",
                "suggestion_rejected"
            ],
            required: true
        },

        document: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Document",
            default: null
        },

        folder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Folder",
            default: null
        },

        targetUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;