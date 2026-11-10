
import mongoose from "mongoose";

import ErrorHandler from "../middlewares/error.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

import User from "../models/user.js";
import Workspace from "../models/workspace.js";
import Document from "../models/document.js";
import Folder from "../models/folder.js";
import Comment from "../models/comment.js";
import Suggestion from "../models/suggestion.js";
import Version from "../models/version.js";
import Notification from "../models/notification.js";
import Activity from "../models/activity.js";

import { getDocumentAccess } from "../utils/documentAccess.js";
import logActivity from "../utils/logActivity.js";

const isValidId = (id) => mongoose.isValidObjectId(id);

const canManageWorkspaceDocuments = (workspace, userId) => {
  const member = workspace.members.find(
    (item) => String(item.user) === String(userId)
  );

  return member && ["owner", "editor"].includes(member.role);
};

const isDocumentOwner = (document, userId) => {
  return String(document.owner) === String(userId);
};

const getWorkspaceForUser = async (document, userId) => {
  return Workspace.findOne({
    _id: document.workspace,
    "members.user": userId
  });
};

// CREATE DOCUMENT
export const createDocument = asyncHandler(async (req, res, next) => {
  const { workspaceId } = req.params;
  const { title, content, folderId } = req.body;

  if (!isValidId(workspaceId)) {
    return next(new ErrorHandler("Invalid workspace ID", 400));
  }

  if (typeof title !== "string" || !title.trim()) {
    return next(new ErrorHandler("Document title is required", 400));
  }

  const workspace = await Workspace.findOne({
    _id: workspaceId,
    "members.user": req.user._id
  });

  if (!workspace) {
    return next(
      new ErrorHandler("Workspace not found or you are not a member", 404)
    );
  }

  if (!canManageWorkspaceDocuments(workspace, req.user._id)) {
    return next(
      new ErrorHandler("You cannot create documents in this workspace", 403)
    );
  }

  let selectedFolder = null;

  if (folderId) {
    if (!isValidId(folderId)) {
      return next(new ErrorHandler("Invalid folder ID", 400));
    }

    selectedFolder = await Folder.findOne({
      _id: folderId,
      workspace: workspace._id
    });

    if (!selectedFolder) {
      return next(
        new ErrorHandler("Folder not found in this workspace", 404)
      );
    }
  }

  const document = await Document.create({
    title: title.trim(),
    content: content === undefined ? {} : content,
    owner: req.user._id,
    workspace: workspace._id,
    folder: selectedFolder?._id || null,
    createdBy: req.user._id
  });

  workspace.documents.addToSet(document._id);
  await workspace.save();

  await User.updateOne(
    { _id: req.user._id },
    { $addToSet: { ownedDocuments: document._id } }
  );

  await logActivity({
    workspace: workspace._id,
    user: req.user._id,
    action: "document_created",
    document: document._id,
    metadata: { documentTitle: document.title }
  });

  return res.status(201).json({
    success: true,
    message: "Document created successfully",
    document
  });
});

// GET WORKSPACE DOCUMENTS
export const getWorkspaceDocuments = asyncHandler(
  async (req, res, next) => {
    const { workspaceId } = req.params;

    if (!isValidId(workspaceId)) {
      return next(new ErrorHandler("Invalid workspace ID", 400));
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": req.user._id
    });

    if (!workspace) {
      return next(
        new ErrorHandler("Workspace not found or you are not a member", 404)
      );
    }

    const documents = await Document.find({
      workspace: workspace._id
    }).populate("owner", "name email");

    const accessibleDocuments = documents
      .map((document) => {
        const access = getDocumentAccess(req.user, document, workspace);

        if (access === "none") {
          return null;
        }

        return {
          ...document.toObject(),
          access
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      message: "Documents fetched successfully",
      documents: accessibleDocuments
    });
  }
);

// GET SINGLE DOCUMENT
export const getDocument = asyncHandler(async (req, res, next) => {
  const { documentId } = req.params;

  if (!isValidId(documentId)) {
    return next(new ErrorHandler("Invalid document ID", 400));
  }

  const document = await Document.findById(documentId).populate(
    "owner",
    "name email"
  );

  if (!document) {
    return next(new ErrorHandler("Document not found", 404));
  }

  const workspace = await getWorkspaceForUser(document, req.user._id);

  if (!workspace) {
    return next(
      new ErrorHandler("Workspace not found or you are not a member", 404)
    );
  }

  const access = getDocumentAccess(req.user, document, workspace);

  if (access === "none") {
    return next(
      new ErrorHandler("You do not have access to this document", 403)
    );
  }

  return res.status(200).json({
    success: true,
    message: "Document fetched successfully",
    document,
    access
  });
});

// UPDATE DOCUMENT
export const updateDocument = asyncHandler(async (req, res, next) => {
  const { documentId } = req.params;
  const { title, content, folderId } = req.body;

  if (!isValidId(documentId)) {
    return next(new ErrorHandler("Invalid document ID", 400));
  }

  const document = await Document.findById(documentId);

  if (!document) {
    return next(new ErrorHandler("Document not found", 404));
  }

  const workspace = await getWorkspaceForUser(document, req.user._id);

  if (!workspace) {
    return next(
      new ErrorHandler("Workspace not found or you are not a member", 404)
    );
  }

  const access = getDocumentAccess(req.user, document, workspace);

  if (access !== "owner" && access !== "editor") {
    return next(
      new ErrorHandler("You do not have permission to edit this document", 403)
    );
  }

  const previousTitle = document.title;
  const previousFolder = document.folder;

  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      return next(new ErrorHandler("Document title cannot be empty", 400));
    }

    document.title = title.trim();
  }

  if (content !== undefined) {
    document.content = content;
  }

  if (folderId !== undefined) {
    if (folderId === null || folderId === "") {
      document.folder = null;
    } else {
      if (!isValidId(folderId)) {
        return next(new ErrorHandler("Invalid folder ID", 400));
      }

      const folder = await Folder.findOne({
        _id: folderId,
        workspace: document.workspace
      });

      if (!folder) {
        return next(
          new ErrorHandler("Folder not found in this workspace", 404)
        );
      }

      document.folder = folder._id;
    }
  }

  await document.save();

  await logActivity({
    workspace: workspace._id,
    user: req.user._id,
    action: "document_updated",
    document: document._id,
    metadata: {
      previousTitle,
      newTitle: document.title,
      previousFolder,
      newFolder: document.folder
    }
  });

  return res.status(200).json({
    success: true,
    message: "Document updated successfully",
    document
  });
});

// DELETE DOCUMENT
export const deleteDocument = asyncHandler(async (req, res, next) => {
  const { documentId } = req.params;

  if (!isValidId(documentId)) {
    return next(new ErrorHandler("Invalid document ID", 400));
  }

  const document = await Document.findById(documentId);

  if (!document) {
    return next(new ErrorHandler("Document not found", 404));
  }

  const workspace = await getWorkspaceForUser(document, req.user._id);

  if (!workspace) {
    return next(
      new ErrorHandler("Workspace not found or you are not a member", 404)
    );
  }

  if (!canManageWorkspaceDocuments(workspace, req.user._id)) {
    return next(
      new ErrorHandler("You cannot delete this document", 403)
    );
  }

  const documentTitle = document.title;

  // Find comments so their related notifications can also be deleted.
  const comments = await Comment.find({
    document: document._id
  }).select("_id");

  const commentIds = comments.map((comment) => comment._id);

  await Comment.deleteMany({ document: document._id });
  await Suggestion.deleteMany({ document: document._id });
  await Version.deleteMany({ document: document._id });

  await Notification.deleteMany({
    $or: [
      { document: document._id },
      { comment: { $in: commentIds } }
    ]
  });

  // Remove old activity entries before recording the deletion.
  await Activity.deleteMany({
    document: document._id
  });

  await Document.findByIdAndDelete(document._id);

  workspace.documents.pull(document._id);
  await workspace.save();

  await User.updateMany(
    { ownedDocuments: document._id },
    { $pull: { ownedDocuments: document._id } }
  );

  await logActivity({
    workspace: workspace._id,
    user: req.user._id,
    action: "document_deleted",
    metadata: {
      documentTitle,
      deletedDocumentId: String(document._id)
    }
  });

  return res.status(200).json({
    success: true,
    message: "Document deleted successfully"
  });
});

// ADD COLLABORATOR
export const addCollaborator = asyncHandler(async (req, res, next) => {
  const { documentId } = req.params;
  const { userId, permission } = req.body;

  if (!isValidId(documentId) || !isValidId(userId)) {
    return next(new ErrorHandler("Invalid document or user ID", 400));
  }

  if (!["editor", "viewer"].includes(permission)) {
    return next(
      new ErrorHandler("Permission must be editor or viewer", 400)
    );
  }

  const document = await Document.findById(documentId);

  if (!document) {
    return next(new ErrorHandler("Document not found", 404));
  }

  const workspace = await getWorkspaceForUser(document, req.user._id);

  if (!workspace) {
    return next(
      new ErrorHandler("Workspace not found or you are not a member", 404)
    );
  }

  if (getDocumentAccess(req.user, document, workspace) !== "owner") {
    return next(
      new ErrorHandler(
        "Only the document owner can manage collaborators",
        403
      )
    );
  }

  const targetIsMember = workspace.members.some(
    (member) => String(member.user) === String(userId)
  );

  if (!targetIsMember) {
    return next(
      new ErrorHandler("Collaborator must be a workspace member", 400)
    );
  }

  if (isDocumentOwner(document, userId)) {
    return next(
      new ErrorHandler("Document owner cannot be added as a collaborator", 400)
    );
  }

  const member = await User.findById(userId);

  if (!member) {
    return next(new ErrorHandler("Collaborator not found", 404));
  }

  const alreadyAdded = document.collaborators.some(
    (item) => String(item.user) === String(userId)
  );

  if (alreadyAdded) {
    return next(new ErrorHandler("User is already a collaborator", 409));
  }

  document.collaborators.push({
    user: userId,
    permission
  });

  await document.save();

  await logActivity({
    workspace: workspace._id,
    user: req.user._id,
    action: "document_shared",
    document: document._id,
    targetUser: userId,
    metadata: {
      collaboratorName: member.name,
      permission
    }
  });

  return res.status(200).json({
    success: true,
    message: "Collaborator added successfully",
    document
  });
});

// GET COLLABORATORS
export const getCollaborators = asyncHandler(async (req, res, next) => {
  const { documentId } = req.params;

  if (!isValidId(documentId)) {
    return next(new ErrorHandler("Invalid document ID", 400));
  }

  const document = await Document.findById(documentId);

  if (!document) {
    return next(new ErrorHandler("Document not found", 404));
  }

  const workspace = await getWorkspaceForUser(document, req.user._id);

  if (!workspace) {
    return next(
      new ErrorHandler("Workspace not found or you are not a member", 404)
    );
  }

  if (getDocumentAccess(req.user, document, workspace) === "none") {
    return next(
      new ErrorHandler("You do not have access to this document", 403)
    );
  }

  await document.populate("collaborators.user", "name email");

  return res.status(200).json({
    success: true,
    message: "Collaborators fetched successfully",
    collaborators: document.collaborators
  });
});

// UPDATE COLLABORATOR PERMISSION
export const updateCollaboratorPermission = asyncHandler(
  async (req, res, next) => {
    const { documentId, userId } = req.params;
    const { permission } = req.body;

    if (!isValidId(documentId) || !isValidId(userId)) {
      return next(new ErrorHandler("Invalid document or user ID", 400));
    }

    if (!["editor", "viewer"].includes(permission)) {
      return next(
        new ErrorHandler("Permission must be editor or viewer", 400)
      );
    }

    const document = await Document.findById(documentId);

    if (!document) {
      return next(new ErrorHandler("Document not found", 404));
    }

    const workspace = await getWorkspaceForUser(document, req.user._id);

    if (!workspace) {
      return next(
        new ErrorHandler("Workspace not found or you are not a member", 404)
      );
    }

    if (getDocumentAccess(req.user, document, workspace) !== "owner") {
      return next(
        new ErrorHandler(
          "Only the document owner can manage collaborators",
          403
        )
      );
    }

    const collaborator = document.collaborators.find(
      (item) => String(item.user) === String(userId)
    );

    if (!collaborator) {
      return next(new ErrorHandler("Collaborator not found", 404));
    }

    const previousPermission = collaborator.permission;
    collaborator.permission = permission;

    await document.save();

    await logActivity({
      workspace: workspace._id,
      user: req.user._id,
      action: "document_shared",
      document: document._id,
      targetUser: userId,
      metadata: {
        event: "collaborator_permission_updated",
        previousPermission,
        newPermission: permission
      }
    });

    return res.status(200).json({
      success: true,
      message: "Collaborator permission updated successfully",
      document
    });
  }
);

// REMOVE COLLABORATOR
export const removeCollaborator = asyncHandler(async (req, res, next) => {
  const { documentId, userId } = req.params;

  if (!isValidId(documentId) || !isValidId(userId)) {
    return next(new ErrorHandler("Invalid document or user ID", 400));
  }

  const document = await Document.findById(documentId);

  if (!document) {
    return next(new ErrorHandler("Document not found", 404));
  }

  const workspace = await getWorkspaceForUser(document, req.user._id);

  if (!workspace) {
    return next(
      new ErrorHandler("Workspace not found or you are not a member", 404)
    );
  }

  if (getDocumentAccess(req.user, document, workspace) !== "owner") {
    return next(
      new ErrorHandler(
        "Only the document owner can manage collaborators",
        403
      )
    );
  }

  if (isDocumentOwner(document, userId)) {
    return next(
      new ErrorHandler("Document owner cannot be removed", 400)
    );
  }

  const collaborator = document.collaborators.find(
    (item) => String(item.user) === String(userId)
  );

  if (!collaborator) {
    return next(new ErrorHandler("Collaborator not found", 404));
  }

  const removedPermission = collaborator.permission;

  document.collaborators.pull({ user: userId });
  await document.save();

  await logActivity({
    workspace: workspace._id,
    user: req.user._id,
    action: "document_collaborator_removed",
    document: document._id,
    targetUser: userId,
    metadata: { removedPermission }
  });

  return res.status(200).json({
    success: true,
    message: "Collaborator removed successfully",
    document
  });
});
