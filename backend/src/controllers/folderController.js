
import mongoose from "mongoose";

import ErrorHandler from "../middlewares/error.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

import User from "../models/user.js";
import Workspace from "../models/workspace.js";
import Folder from "../models/folder.js";
import Document from "../models/document.js";
import Comment from "../models/comment.js";
import Suggestion from "../models/suggestion.js";
import Version from "../models/version.js";
import Notification from "../models/notification.js";
import Activity from "../models/activity.js";

import { getDocumentAccess } from "../utils/documentAccess.js";
import logActivity from "../utils/logActivity.js";

const isValidId = (id) => mongoose.isValidObjectId(id);

const getWorkspace = async (workspaceId, userId) => {
  return Workspace.findOne({
    _id: workspaceId,
    "members.user": userId
  });
};

const canManageFolders = (workspace, userId) => {
  const member = workspace.members.find(
    (item) => String(item.user) === String(userId)
  );

  return member && ["owner", "editor"].includes(member.role);
};

// CREATE FOLDER
export const createFolder = asyncHandler(async (req, res, next) => {
  const { workspaceId } = req.params;
  const { name } = req.body;
  const parentFolder = req.body.parentFolder || null;

  if (!isValidId(workspaceId)) {
    return next(new ErrorHandler("Invalid workspace ID", 400));
  }

  if (!name || typeof name !== "string" || !name.trim()) {
    return next(new ErrorHandler("Folder name is required", 400));
  }

  if (name.trim().length > 50) {
    return next(
      new ErrorHandler("Folder name cannot exceed 50 characters", 400)
    );
  }

  const workspace = await getWorkspace(workspaceId, req.user._id);

  if (!workspace) {
    return next(
      new ErrorHandler("Workspace not found or you are not a member", 404)
    );
  }

  if (!canManageFolders(workspace, req.user._id)) {
    return next(new ErrorHandler("You cannot create folders", 403));
  }

  if (parentFolder) {
    if (!isValidId(parentFolder)) {
      return next(new ErrorHandler("Invalid parent folder ID", 400));
    }

    const parent = await Folder.findOne({
      _id: parentFolder,
      workspace: workspace._id
    });

    if (!parent) {
      return next(new ErrorHandler("Parent folder not found", 404));
    }
  }

  const existingFolder = await Folder.findOne({
    workspace: workspace._id,
    parentFolder,
    name: name.trim()
  });

  if (existingFolder) {
    return next(
      new ErrorHandler("Folder already exists in this location", 409)
    );
  }

  const folder = await Folder.create({
    name: name.trim(),
    workspace: workspace._id,
    parentFolder,
    createdBy: req.user._id
  });

  await Workspace.updateOne(
    { _id: workspace._id },
    { $addToSet: { folders: folder._id } }
  );

  await logActivity({
    workspace: workspace._id,
    user: req.user._id,
    action: "folder_created",
    folder: folder._id,
    metadata: { folderName: folder.name }
  });

  return res.status(201).json({
    success: true,
    message: "Folder created successfully",
    folder
  });
});

// GET ALL WORKSPACE FOLDERS
export const getWorkspaceFolders = asyncHandler(async (req, res, next) => {
  const { workspaceId } = req.params;

  if (!isValidId(workspaceId)) {
    return next(new ErrorHandler("Invalid workspace ID", 400));
  }

  const workspace = await getWorkspace(workspaceId, req.user._id);

  if (!workspace) {
    return next(
      new ErrorHandler("Workspace not found or you are not a member", 404)
    );
  }

  const folders = await Folder.find({
    workspace: workspace._id
  }).sort({ createdAt: 1 });

  return res.status(200).json({
    success: true,
    folders
  });
});

// GET FOLDER CONTENTS
export const getFolder = asyncHandler(async (req, res, next) => {
  const { folderId } = req.params;

  if (!isValidId(folderId)) {
    return next(new ErrorHandler("Invalid folder ID", 400));
  }

  const folder = await Folder.findById(folderId);

  if (!folder) {
    return next(new ErrorHandler("Folder not found", 404));
  }

  const workspace = await getWorkspace(folder.workspace, req.user._id);

  if (!workspace) {
    return next(
      new ErrorHandler("Workspace not found or you are not a member", 404)
    );
  }

  const childFolders = await Folder.find({
    workspace: workspace._id,
    parentFolder: folder._id
  }).sort({ name: 1 });

  const documents = await Document.find({
    workspace: workspace._id,
    folder: folder._id
  }).select("title owner workspace folder collaborators createdAt updatedAt");

  // Only return documents the user explicitly has access to.
  const accessibleDocuments = documents
    .filter(
      (document) =>
        getDocumentAccess(req.user, document, workspace) !== "none"
    )
    .map((document) => ({
      _id: document._id,
      title: document.title,
      owner: document.owner,
      workspace: document.workspace,
      folder: document.folder,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      access: getDocumentAccess(req.user, document, workspace)
    }));

  return res.status(200).json({
    success: true,
    folder,
    childFolders,
    documents: accessibleDocuments
  });
});

// UPDATE FOLDER
export const updateFolder = asyncHandler(async (req, res, next) => {
  const { folderId } = req.params;
  const { name, parentFolder } = req.body;

  if (!isValidId(folderId)) {
    return next(new ErrorHandler("Invalid folder ID", 400));
  }

  const folder = await Folder.findById(folderId);

  if (!folder) {
    return next(new ErrorHandler("Folder not found", 404));
  }

  const workspace = await getWorkspace(folder.workspace, req.user._id);

  if (!workspace) {
    return next(
      new ErrorHandler("Workspace not found or you are not a member", 404)
    );
  }

  if (!canManageFolders(workspace, req.user._id)) {
    return next(new ErrorHandler("You cannot update folders", 403));
  }

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return next(new ErrorHandler("Folder name is required", 400));
    }

    if (name.trim().length > 50) {
      return next(
        new ErrorHandler("Folder name cannot exceed 50 characters", 400)
      );
    }

    folder.name = name.trim();
  }

  if (parentFolder !== undefined) {
    const newParent = parentFolder || null;

    if (newParent) {
      if (!isValidId(newParent)) {
        return next(new ErrorHandler("Invalid parent folder ID", 400));
      }

      if (String(newParent) === String(folder._id)) {
        return next(
          new ErrorHandler("Folder cannot be its own parent", 400)
        );
      }

      const parent = await Folder.findOne({
        _id: newParent,
        workspace: workspace._id
      });

      if (!parent) {
        return next(new ErrorHandler("Parent folder not found", 404));
      }

      // Prevent moving a folder inside one of its descendants.
      let current = parent;

      while (current && current.parentFolder) {
        if (String(current.parentFolder) === String(folder._id)) {
          return next(
            new ErrorHandler(
              "Folder cannot be moved inside its own descendant",
              400
            )
          );
        }

        current = await Folder.findById(current.parentFolder);
      }
    }

    folder.parentFolder = newParent;
  }

  const duplicate = await Folder.findOne({
    _id: { $ne: folder._id },
    workspace: workspace._id,
    parentFolder: folder.parentFolder,
    name: folder.name
  });

  if (duplicate) {
    return next(
      new ErrorHandler("Folder already exists in this location", 409)
    );
  }

  await folder.save();

  await logActivity({
    workspace: workspace._id,
    user: req.user._id,
    action: "folder_updated",
    folder: folder._id,
    metadata: { folderName: folder.name }
  });

  return res.status(200).json({
    success: true,
    message: "Folder updated successfully",
    folder
  });
});

// DELETE FOLDER AND ITS CHILD FOLDERS
export const deleteFolder = asyncHandler(async (req, res, next) => {
  const { folderId } = req.params;

  if (!isValidId(folderId)) {
    return next(new ErrorHandler("Invalid folder ID", 400));
  }

  const folder = await Folder.findById(folderId);

  if (!folder) {
    return next(new ErrorHandler("Folder not found", 404));
  }

  const workspace = await getWorkspace(folder.workspace, req.user._id);

  if (!workspace) {
    return next(
      new ErrorHandler("Workspace not found or you are not a member", 404)
    );
  }

  if (!canManageFolders(workspace, req.user._id)) {
    return next(new ErrorHandler("You cannot delete folders", 403));
  }

  // Find all nested folders.
  const folderIds = [folder._id];
  let index = 0;

  while (index < folderIds.length) {
    const children = await Folder.find({
      workspace: workspace._id,
      parentFolder: folderIds[index]
    }).select("_id");

    for (const child of children) {
      if (!folderIds.some((id) => String(id) === String(child._id))) {
        folderIds.push(child._id);
      }
    }

    index++;
  }

  const documents = await Document.find({
    workspace: workspace._id,
    folder: { $in: folderIds }
  }).select("_id");

  const documentIds = documents.map((doc) => doc._id);

  const comments = await Comment.find({
    document: { $in: documentIds }
  }).select("_id");

  const commentIds = comments.map((comment) => comment._id);

  // Delete associated data before deleting the documents.
  await Comment.deleteMany({ document: { $in: documentIds } });

  await Suggestion.deleteMany({ document: { $in: documentIds } });

  await Version.deleteMany({ document: { $in: documentIds } });

  await Notification.deleteMany({
    $or: [
      { document: { $in: documentIds } },
      { comment: { $in: commentIds } }
    ]
  });

  await Activity.deleteMany({
    $or: [
      { document: { $in: documentIds } },
      { folder: { $in: folderIds } }
    ]
  });

  await Document.deleteMany({
    _id: { $in: documentIds },
    workspace: workspace._id
  });

  await Folder.deleteMany({
    _id: { $in: folderIds },
    workspace: workspace._id
  });

  await User.updateMany(
    { ownedDocuments: { $in: documentIds } },
    { $pull: { ownedDocuments: { $in: documentIds } } }
  );

  await Workspace.updateOne(
    { _id: workspace._id },
    {
      $pull: {
        folders: { $in: folderIds },
        documents: { $in: documentIds }
      }
    }
  );

  await logActivity({
    workspace: workspace._id,
    user: req.user._id,
    action: "folder_deleted",
    metadata: {
      folderName: folder.name,
      deletedFolderCount: folderIds.length,
      deletedDocumentCount: documentIds.length
    }
  });

  return res.status(200).json({
    success: true,
    message: "Folder and its contents deleted successfully",
    deletedFolders: folderIds.length,
    deletedDocuments: documentIds.length
  });
});
