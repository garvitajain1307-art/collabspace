
import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
    {
        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
            index: true
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
                "workspace_updated",

                "member_joined",
                "member_invited",
                "member_removed",
                "member_left",
                "member_role_updated",

                "invitation_cancelled",

                "folder_created",
                "folder_updated",
                "folder_deleted",

                "document_created",
                "document_updated",
                "document_deleted",
                "document_shared",
                "document_collaborator_removed",

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

activitySchema.index({
    workspace: 1,
    createdAt: -1
});

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;
