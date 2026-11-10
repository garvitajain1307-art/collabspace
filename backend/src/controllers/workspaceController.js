
import mongoose from "mongoose";

import ErrorHandler from "../middlewares/error.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

import User from "../models/user.js";
import Workspace from "../models/workspace.js";
import WorkspaceInvitation from "../models/workspaceInvitation.js";
import Folder from "../models/folder.js";
import Document from "../models/document.js";
import Activity from "../models/activity.js";
import Comment from "../models/comment.js";
import Suggestion from "../models/suggestion.js";
import Notification from "../models/notification.js";
import Version from "../models/version.js";

import logActivity from "../utils/logActivity.js";

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getWorkspaceAsMember = async (workspaceId, userId) => {
    return Workspace.findOne({
        _id: workspaceId,
        "members.user": userId
    });
};

const removeMemberAccess = async (workspace, memberId) => {
    // Remove explicit document collaborator access for this member.
    await Document.updateMany(
        { workspace: workspace._id },
        {
            $pull: {
                collaborators: { user: memberId }
            }
        }
    );

    // Remove the workspace reference from the user's account.
    await User.updateOne(
        { _id: memberId },
        {
            $pull: {
                workspaces: workspace._id
            }
        }
    );

    // Remove the member from the workspace.
    workspace.members = workspace.members.filter(
        (member) => String(member.user) !== String(memberId)
    );

    await workspace.save();
};

// CREATE WORKSPACE
export const createWorkspace = asyncHandler(async (req, res, next) => {
    const user = req.user;

    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    const { name, description = "" } = req.body;

    if (typeof name !== "string" || !name.trim()) {
        return next(new ErrorHandler("Workspace name is required", 400));
    }

    if (name.trim().length > 50) {
        return next(
            new ErrorHandler("Workspace name cannot exceed 50 characters", 400)
        );
    }

    if (typeof description !== "string" || description.length > 200) {
        return next(
            new ErrorHandler("Description cannot exceed 200 characters", 400)
        );
    }

    const workspace = await Workspace.create({
        name: name.trim(),
        description: description.trim(),
        owner: user._id,
        members: [
            {
                user: user._id,
                role: "owner"
            }
        ]
    });

    await User.updateOne(
        { _id: user._id },
        {
            $addToSet: {
                workspaces: workspace._id
            }
        }
    );

    await logActivity({
        workspace: workspace._id,
        user: user._id,
        action: "workspace_created",
        metadata: {
            workspaceName: workspace.name
        }
    });

    return res.status(201).json({
        success: true,
        message: "Workspace created successfully",
        workspace
    });
});

// GET ALL WORKSPACES OF LOGGED-IN USER
export const getMyWorkspaces = asyncHandler(async (req, res, next) => {
    const user = req.user;

    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    const workspaces = await Workspace.find({
        "members.user": user._id
    })
        .populate("owner", "name email avatar")
        .sort({ updatedAt: -1 });

    return res.status(200).json({
        success: true,
        workspaces
    });
});

// GET SINGLE WORKSPACE
export const getWorkspace = asyncHandler(async (req, res, next) => {
    const user = req.user;
    const { workspaceId } = req.params;

    if (!validateObjectId(workspaceId)) {
        return next(new ErrorHandler("Invalid workspace ID", 400));
    }

    const workspace = await Workspace.findOne({
        _id: workspaceId,
        "members.user": user._id
    })
        .populate("owner", "name email avatar")
        .populate("members.user", "name email avatar");

    if (!workspace) {
        return next(
            new ErrorHandler(
                "Workspace not found or you are not a member",
                404
            )
        );
    }

    return res.status(200).json({
        success: true,
        message: "Workspace fetched successfully",
        workspace
    });
});

// UPDATE WORKSPACE
export const updateWorkspace = asyncHandler(async (req, res, next) => {
    const user = req.user;
    const { workspaceId } = req.params;
    const { name, description } = req.body;

    if (!validateObjectId(workspaceId)) {
        return next(new ErrorHandler("Invalid workspace ID", 400));
    }

    const workspace = await Workspace.findOne({
        _id: workspaceId,
        owner: user._id
    });

    if (!workspace) {
        return next(
            new ErrorHandler("Workspace not found or you are not the owner", 403)
        );
    }

    if (name !== undefined) {
        if (typeof name !== "string" || !name.trim()) {
            return next(new ErrorHandler("Workspace name cannot be empty", 400));
        }

        if (name.trim().length > 50) {
            return next(
                new ErrorHandler("Workspace name cannot exceed 50 characters", 400)
            );
        }

        workspace.name = name.trim();
    }

    if (description !== undefined) {
        if (typeof description !== "string" || description.length > 200) {
            return next(
                new ErrorHandler("Description cannot exceed 200 characters", 400)
            );
        }

        workspace.description = description.trim();
    }

    await workspace.save();

    await logActivity({
        workspace: workspace._id,
        user: user._id,
        action: "workspace_updated",
        metadata: {
            workspaceName: workspace.name
        }
    });

    return res.status(200).json({
        success: true,
        message: "Workspace updated successfully",
        workspace
    });
});

// DELETE WORKSPACE
export const deleteWorkspace = asyncHandler(async (req, res, next) => {
    const user = req.user;
    const { workspaceId } = req.params;

    if (!validateObjectId(workspaceId)) {
        return next(new ErrorHandler("Invalid workspace ID", 400));
    }

    const workspace = await Workspace.findOne({
        _id: workspaceId,
        owner: user._id
    });

    if (!workspace) {
        return next(
            new ErrorHandler("Workspace not found or you are not the owner", 403)
        );
    }

    const documents = await Document.find({
        workspace: workspace._id
    }).select("_id");

    const documentIds = documents.map((document) => document._id);

    const comments = await Comment.find({
        document: { $in: documentIds }
    }).select("_id");

    const commentIds = comments.map((comment) => comment._id);

    // Remove dependent records before deleting their parent documents.
    const [
        invitationResult,
        commentResult,
        suggestionResult,
        versionResult,
        notificationResult,
        documentResult,
        folderResult
    ] = await Promise.all([
        WorkspaceInvitation.deleteMany({
            workspace: workspace._id
        }),

        Comment.deleteMany({
            document: { $in: documentIds }
        }),

        Suggestion.deleteMany({
            document: { $in: documentIds }
        }),

        Version.deleteMany({
            document: { $in: documentIds }
        }),

        Notification.deleteMany({
            $or: [
                { workspace: workspace._id },
                { document: { $in: documentIds } },
                { comment: { $in: commentIds } }
            ]
        }),

        Document.deleteMany({
            workspace: workspace._id
        }),

        Folder.deleteMany({
            workspace: workspace._id
        })
    ]);

    await User.updateMany(
        { workspaces: workspace._id },
        {
            $pull: {
                workspaces: workspace._id
            }
        }
    );

    if (documentIds.length > 0) {
        await User.updateMany(
            { ownedDocuments: { $in: documentIds } },
            {
                $pull: {
                    ownedDocuments: {
                        $in: documentIds
                    }
                }
            }
        );
    }

    const activityResult = await Activity.deleteMany({
        workspace: workspace._id
    });

    const workspaceResult = await Workspace.deleteOne({
        _id: workspace._id,
        owner: user._id
    });

    if (workspaceResult.deletedCount !== 1) {
        return next(new ErrorHandler("Workspace could not be deleted", 500));
    }

    return res.status(200).json({
        success: true,
        message: "Workspace and associated data deleted successfully",
        deleted: {
            workspace: workspaceResult.deletedCount,
            documents: documentResult.deletedCount,
            folders: folderResult.deletedCount,
            invitations: invitationResult.deletedCount,
            comments: commentResult.deletedCount,
            suggestions: suggestionResult.deletedCount,
            versions: versionResult.deletedCount,
            notifications: notificationResult.deletedCount,
            activities: activityResult.deletedCount
        }
    });
});

// REMOVE MEMBER (OWNER ONLY)
export const removeMemberFromWorkspace = asyncHandler(
    async (req, res, next) => {
        const user = req.user;
        const { workspaceId, memberId } = req.params;

        if (
            !validateObjectId(workspaceId) ||
            !validateObjectId(memberId)
        ) {
            return next(new ErrorHandler("Invalid workspace or member ID", 400));
        }

        const workspace = await Workspace.findOne({
            _id: workspaceId,
            owner: user._id
        });

        if (!workspace) {
            return next(
                new ErrorHandler(
                    "Workspace not found or you are not the owner",
                    403
                )
            );
        }

        if (String(workspace.owner) === String(memberId)) {
            return next(
                new ErrorHandler("Workspace owner cannot be removed", 400)
            );
        }

        const member = await User.findById(memberId);

        const isMember = workspace.members.some(
            (item) => String(item.user) === String(memberId)
        );

        if (!member || !isMember) {
            return next(
                new ErrorHandler("Member not found in this workspace", 404)
            );
        }

        await removeMemberAccess(workspace, memberId);

        await logActivity({
            workspace: workspace._id,
            user: user._id,
            action: "member_removed",
            targetUser: memberId,
            metadata: {
                memberName: member.name,
                memberEmail: member.email
            }
        });

        return res.status(200).json({
            success: true,
            message: "Member removed successfully"
        });
    }
);

// LEAVE WORKSPACE
export const leaveWorkspace = asyncHandler(async (req, res, next) => {
    const user = req.user;
    const { workspaceId } = req.params;

    if (!validateObjectId(workspaceId)) {
        return next(new ErrorHandler("Invalid workspace ID", 400));
    }

    const workspace = await getWorkspaceAsMember(workspaceId, user._id);

    if (!workspace) {
        return next(
            new ErrorHandler("Workspace not found or you are not a member", 404)
        );
    }

    if (String(workspace.owner) === String(user._id)) {
        return next(
            new ErrorHandler(
                "Workspace owner cannot leave. Transfer ownership first.",
                400
            )
        );
    }

    await removeMemberAccess(workspace, user._id);

    await logActivity({
        workspace: workspace._id,
        user: user._id,
        action: "member_left",
        targetUser: user._id,
        metadata: {
            memberName: user.name,
            memberEmail: user.email
        }
    });

    return res.status(200).json({
        success: true,
        message: "You left the workspace successfully"
    });
});

// UPDATE MEMBER ROLE (OWNER ONLY)
export const updateWorkspaceMemberRole = asyncHandler(
    async (req, res, next) => {
        const user = req.user;
        const { workspaceId, memberId } = req.params;
        const { role } = req.body;

        if (
            !validateObjectId(workspaceId) ||
            !validateObjectId(memberId)
        ) {
            return next(new ErrorHandler("Invalid workspace or member ID", 400));
        }

        if (!["editor", "viewer"].includes(role)) {
            return next(
                new ErrorHandler("Role must be editor or viewer", 400)
            );
        }

        const workspace = await Workspace.findOne({
            _id: workspaceId,
            owner: user._id
        });

        if (!workspace) {
            return next(
                new ErrorHandler(
                    "Workspace not found or you are not the owner",
                    403
                )
            );
        }

        if (String(workspace.owner) === String(memberId)) {
            return next(
                new ErrorHandler("Workspace owner's role cannot be changed", 400)
            );
        }

        const member = workspace.members.find(
            (item) => String(item.user) === String(memberId)
        );

        if (!member) {
            return next(
                new ErrorHandler("Member not found in this workspace", 404)
            );
        }

        const previousRole = member.role;

        if (previousRole === role) {
            return res.status(200).json({
                success: true,
                message: "Member already has this role",
                workspace
            });
        }

        member.role = role;
        await workspace.save();

        await logActivity({
            workspace: workspace._id,
            user: user._id,
            action: "member_role_updated",
            targetUser: memberId,
            metadata: {
                previousRole,
                newRole: role
            }
        });

        await workspace.populate("owner", "name email avatar");
        await workspace.populate("members.user", "name email avatar");

        return res.status(200).json({
            success: true,
            message: "Workspace member role updated successfully",
            workspace,
            updatedMember: workspace.members.find(
                (item) =>
                    String(item.user?._id || item.user) === String(memberId)
            )
        });
    }
);
