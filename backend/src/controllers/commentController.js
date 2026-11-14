
import mongoose from "mongoose";

import ErrorHandler from "../middlewares/error.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

import Document from "../models/document.js";
import Workspace from "../models/workspace.js";
import Comment from "../models/comment.js";
import Notification from "../models/notification.js";

import { getDocumentAccess } from "../utils/documentAccess.js";
import logActivity from "../utils/logActivity.js";

const isValidId = (id) => mongoose.isValidObjectId(id);

const getAuthorizedDocument = async (documentId, userId) => {
  const document = await Document.findById(documentId);

  if (!document) {
    throw new ErrorHandler("Document not found", 404);
  }

  const workspace = await Workspace.findOne({
    _id: document.workspace,
    "members.user": userId
  });

  if (!workspace) {
    throw new ErrorHandler(
      "Workspace not found or you are not a member",
      404
    );
  }

  const access = getDocumentAccess(
    { _id: userId },
    document,
    workspace
  );

  if (access === "none") {
    throw new ErrorHandler(
      "You do not have access to this document",
      403
    );
  }

  return { document, workspace, access };
};

const canManageComments = (access) => {
  return access === "owner" || access === "editor";
};

// CREATE COMMENT
export const createComment = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const { content, position, parentComment, mentions = [] } = req.body;

  if (!isValidId(documentId)) {
    throw new ErrorHandler("Invalid document ID", 400);
  }

  const { document, workspace } = await getAuthorizedDocument(
    documentId,
    req.user._id
  );

  if (
    typeof content !== "string" ||
    !content.trim() ||
    content.trim().length > 500
  ) {
    throw new ErrorHandler(
      "Comment must contain between 1 and 500 characters",
      400
    );
  }

  if (
    !position ||
    !Number.isInteger(position.start) ||
    !Number.isInteger(position.end) ||
    position.start < 0 ||
    position.end < position.start
  ) {
    throw new ErrorHandler("Invalid comment position", 400);
  }

  if (!Array.isArray(mentions)) {
    throw new ErrorHandler("Mentions must be an array", 400);
  }

  let parent = null;

  if (parentComment) {
    if (!isValidId(parentComment)) {
      throw new ErrorHandler("Invalid parent comment ID", 400);
    }

    parent = await Comment.findOne({
      _id: parentComment,
      document: document._id
    });

    if (!parent) {
      throw new ErrorHandler(
        "Parent comment not found in this document",
        404
      );
    }
  }

  const uniqueMentions = [...new Set(mentions.map(String))];

  const validMentionIds = [];

  for (const id of uniqueMentions) {
    if (!isValidId(id)) {
      throw new ErrorHandler("Invalid mentioned user ID", 400);
    }

    if (String(id) === String(req.user._id)) {
      continue;
    }

    const memberAccess = await getAuthorizedDocument(
      document._id,
      id
    ).catch(() => null);

    if (memberAccess) {
      validMentionIds.push(id);
    }
  }

  const comment = await Comment.create({
    document: document._id,
    user: req.user._id,
    content: content.trim(),
    position: {
      start: position.start,
      end: position.end,
      selectedText: position.selectedText || ""
    },
    parentComment: parent?._id || null,
    mentions: validMentionIds
  });

  if (validMentionIds.length > 0) {
    await Notification.insertMany(
      validMentionIds.map((recipient) => ({
        recipient,
        type: "comment_mention",
        message: `${req.user.name} mentioned you in a comment`,
        workspace: workspace._id,
        document: document._id,
        comment: comment._id,
        actor: req.user._id
      }))
    );
  }

  await logActivity({
    workspace: workspace._id,
    user: req.user._id,
    action: "comment_added",
    document: document._id,
    metadata: {
      commentId: String(comment._id),
      isReply: Boolean(parent)
    }
  });

  await comment.populate([
    { path: "user", select: "name email" },
    { path: "mentions", select: "name email" }
  ]);

  return res.status(201).json({
    success: true,
    message: "Comment added successfully",
    comment
  });
});

// GET DOCUMENT COMMENTS
export const getDocumentComments = asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  if (!isValidId(documentId)) {
    throw new ErrorHandler("Invalid document ID", 400);
  }

  await getAuthorizedDocument(documentId, req.user._id);

  const comments = await Comment.find({
    document: documentId
  })
    .populate("user", "name email")
    .populate("mentions", "name email")
    .sort({ createdAt: 1 });

  return res.status(200).json({
    success: true,
    comments
  });
});

// UPDATE OWN COMMENT
export const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidId(commentId)) {
    throw new ErrorHandler("Invalid comment ID", 400);
  }

  if (
    typeof content !== "string" ||
    !content.trim() ||
    content.trim().length > 500
  ) {
    throw new ErrorHandler(
      "Comment must contain between 1 and 500 characters",
      400
    );
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ErrorHandler("Comment not found", 404);
  }

  await getAuthorizedDocument(comment.document, req.user._id);

  if (String(comment.user) !== String(req.user._id)) {
    throw new ErrorHandler("You can only edit your own comments", 403);
  }

  comment.content = content.trim();
  await comment.save();

  await comment.populate([
    { path: "user", select: "name email" },
    { path: "mentions", select: "name email" }
  ]);

  return res.status(200).json({
    success: true,
    message: "Comment updated successfully",
    comment
  });
});

// DELETE COMMENT
export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidId(commentId)) {
    throw new ErrorHandler("Invalid comment ID", 400);
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ErrorHandler("Comment not found", 404);
  }

  const { document, workspace, access } =
    await getAuthorizedDocument(comment.document, req.user._id);

  const isCommentAuthor =
    String(comment.user) === String(req.user._id);

  if (!isCommentAuthor && !canManageComments(access)) {
    throw new ErrorHandler("You cannot delete this comment", 403);
  }

  // Keep replies, but detach them from the deleted parent.
  await Comment.updateMany(
    { parentComment: comment._id },
    { $set: { parentComment: null } }
  );

  await Notification.deleteMany({ comment: comment._id });
  await Comment.findByIdAndDelete(comment._id);

  return res.status(200).json({
    success: true,
    message: "Comment deleted successfully"
  });
});

// RESOLVE / REOPEN COMMENT
export const toggleCommentResolved = asyncHandler(
  async (req, res) => {
    const { commentId } = req.params;
    const { resolved } = req.body;

    if (!isValidId(commentId)) {
      throw new ErrorHandler("Invalid comment ID", 400);
    }

    if (typeof resolved !== "boolean") {
      throw new ErrorHandler("Resolved must be true or false", 400);
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new ErrorHandler("Comment not found", 404);
    }

    const { access } = await getAuthorizedDocument(
      comment.document,
      req.user._id
    );

    if (!canManageComments(access)) {
      throw new ErrorHandler(
        "Only document owners and editors can resolve comments",
        403
      );
    }

    comment.resolved = resolved;
    await comment.save();

    await comment.populate([
      { path: "user", select: "name email" },
      { path: "mentions", select: "name email" }
    ]);

    return res.status(200).json({
      success: true,
      message: resolved
        ? "Comment resolved successfully"
        : "Comment reopened successfully",
      comment
    });
  }
);
