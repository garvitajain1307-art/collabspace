
import mongoose from "mongoose";

import ErrorHandler from "../middlewares/error.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

import Activity from "../models/activity.js";
import Workspace from "../models/workspace.js";
import Document from "../models/document.js";

import { getDocumentAccess } from "../utils/documentAccess.js";

// GET WORKSPACE ACTIVITIES
export const getWorkspaceActivities = asyncHandler(
  async (req, res) => {
    const { workspaceId } = req.params;

    if (!mongoose.isValidObjectId(workspaceId)) {
      throw new ErrorHandler("Invalid workspace ID", 400);
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": req.user._id
    });

    if (!workspace) {
      throw new ErrorHandler(
        "Workspace not found or you are not a member",
        404
      );
    }

    const page = Math.max(
      1,
      parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const skip = (page - 1) * limit;

    // Find only documents this user can access.
    const documents = await Document.find({
      workspace: workspace._id
    }).select("_id owner collaborators");

    const accessibleDocumentIds = documents
      .filter((document) => {
        return (
          getDocumentAccess(req.user, document, workspace) !== "none"
        );
      })
      .map((document) => document._id);

    // Hide document-specific activity for documents the user
    // cannot access. Also hide deletion entries that no longer
    // have an associated document.
    const activityFilter = {
      workspace: workspace._id,
      $or: [
        {
          document: { $in: accessibleDocumentIds }
        },
        {
          document: null,
          action: { $ne: "document_deleted" }
        }
      ]
    };

    const [activities, totalCount] = await Promise.all([
      Activity.find(activityFilter)
        .populate("user", "name avatar")
        .populate("targetUser", "name avatar")
        .populate("document", "title")
        .populate("folder", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Activity.countDocuments(activityFilter)
    ]);

    return res.status(200).json({
      success: true,
      message: "Workspace activities fetched successfully",
      activities,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    });
  }
);
