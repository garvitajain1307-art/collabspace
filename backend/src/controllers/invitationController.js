
import crypto from "crypto";
import mongoose from "mongoose";

import ErrorHandler from "../middlewares/error.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

import User from "../models/user.js";
import Workspace from "../models/workspace.js";
import WorkspaceInvitation from "../models/workspaceInvitation.js";
import Activity from "../models/activity.js";

const isValidObjectId = (id) => mongoose.isValidObjectId(id);

const createActivity = async (data, session = null) => {
  if (session) {
    await Activity.create([data], { session });
    return;
  }

  await Activity.create(data);
};

// Create an invitation. Only the workspace owner can invite members.
export const createInvitation = asyncHandler(async (req, res, next) => {
  const { workspaceId } = req.params;
  const { email, role = "viewer" } = req.body;

  if (!isValidObjectId(workspaceId)) {
    return next(new ErrorHandler("Invalid workspace ID", 400));
  }

  if (!email || typeof email !== "string") {
    return next(new ErrorHandler("Email is required", 400));
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return next(new ErrorHandler("Please provide a valid email", 400));
  }

  if (!["editor", "viewer"].includes(role)) {
    return next(new ErrorHandler("Invalid invitation role", 400));
  }

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    return next(new ErrorHandler("Workspace not found", 404));
  }

  if (String(workspace.owner) !== String(req.user._id)) {
    return next(
      new ErrorHandler("Only the workspace owner can invite members", 403)
    );
  }

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (
    existingUser &&
    workspace.members.some(
      (member) => String(member.user) === String(existingUser._id)
    )
  ) {
    return next(
      new ErrorHandler("This user is already a workspace member", 409)
    );
  }

  const now = new Date();

  // Expire old pending invitations before checking for duplicates.
  await WorkspaceInvitation.updateMany(
    {
      workspace: workspace._id,
      email: normalizedEmail,
      status: "pending",
      expiresAt: { $lte: now }
    },
    { $set: { status: "expired" } }
  );

  const existingInvitation = await WorkspaceInvitation.findOne({
    workspace: workspace._id,
    email: normalizedEmail,
    status: "pending",
    expiresAt: { $gt: now }
  });

  if (existingInvitation) {
    return next(
      new ErrorHandler("A pending invitation already exists for this email", 409)
    );
  }

  const invitation = await WorkspaceInvitation.create({
    workspace: workspace._id,
    invitedBy: req.user._id,
    email: normalizedEmail,
    role,
    token: crypto.randomBytes(32).toString("hex"),
    status: "pending",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  await createActivity({
    workspace: workspace._id,
    user: req.user._id,
    action: "member_invited",
    metadata: {
      email: normalizedEmail,
      role,
      invitationId: invitation._id
    }
  });

  return res.status(201).json({
    success: true,
    message: "Invitation created successfully",
    invitation: {
      _id: invitation._id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      workspace: invitation.workspace,
      invitedBy: invitation.invitedBy
    }
  });
});

// Get invitations addressed to the currently logged-in user.
export const getMyInvitations = asyncHandler(async (req, res, next) => {
  const now = new Date();

  await WorkspaceInvitation.updateMany(
    {
      email: req.user.email.toLowerCase(),
      status: "pending",
      expiresAt: { $lte: now }
    },
    { $set: { status: "expired" } }
  );

  const invitations = await WorkspaceInvitation.find({
    email: req.user.email.toLowerCase(),
    status: "pending",
    expiresAt: { $gt: now }
  })
    .populate("workspace", "name description owner")
    .populate("invitedBy", "name email avatar")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    invitations
  });
});

// Accept an invitation. Membership is added, but document access is not.
export const acceptInvitation = asyncHandler(async (req, res, next) => {
  const { invitationId } = req.params;

  if (!isValidObjectId(invitationId)) {
    return next(new ErrorHandler("Invalid invitation ID", 400));
  }

  const session = await mongoose.startSession();

  let acceptedWorkspace = null;

  try {
    await session.withTransaction(async () => {
      const invitation = await WorkspaceInvitation.findById(invitationId)
        .session(session);

      if (!invitation) {
        throw new ErrorHandler("Invitation not found", 404);
      }

      if (invitation.email !== req.user.email.toLowerCase()) {
        throw new ErrorHandler(
          "This invitation was not sent to your account",
          403
        );
      }

      if (invitation.status !== "pending") {
        throw new ErrorHandler("This invitation is no longer pending", 400);
      }

        if (invitation.expiresAt <= new Date()) {
            throw new ErrorHandler("This invitation has expired", 400);
      }

      const workspace = await Workspace.findById(invitation.workspace)
        .session(session);

      if (!workspace) {
        throw new ErrorHandler("Workspace no longer exists", 404);
      }

      const alreadyMember = workspace.members.some(
        (member) => String(member.user) === String(req.user._id)
      );

      if (alreadyMember) {
        throw new ErrorHandler("You are already a workspace member", 409);
      }

      const workspaceUpdate = await Workspace.updateOne(
        {
          _id: workspace._id,
          "members.user": { $ne: req.user._id }
        },
        {
          $push: {
            members: {
              user: req.user._id,
              role: invitation.role,
              joinedAt: new Date()
            }
          }
        },
        { session }
      );

      if (workspaceUpdate.modifiedCount !== 1) {
        throw new ErrorHandler(
          "Could not add you to this workspace. Please try again",
          409
        );
      }

      await User.updateOne(
        { _id: req.user._id },
        { $addToSet: { workspaces: workspace._id } },
        { session }
      );

      const invitationUpdate = await WorkspaceInvitation.updateOne(
        {
          _id: invitation._id,
          status: "pending",
          expiresAt: { $gt: new Date() }
        },
        { $set: { status: "accepted" } },
        { session }
      );

      if (invitationUpdate.modifiedCount !== 1) {
        throw new ErrorHandler(
          "This invitation has already been processed or expired",
          409
        );
      }

      await createActivity(
        {
          workspace: workspace._id,
          user: req.user._id,
          action: "member_joined",
          metadata: {
            role: invitation.role,
            invitationId: invitation._id
          }
        },
        session
      );

      acceptedWorkspace = workspace;
    });
  }  catch (error) {
    await WorkspaceInvitation.updateOne(
      {
        _id: invitationId,
        status: "pending",
        expiresAt: { $lte: new Date() }
      },
      { $set: { status: "expired" } }
    );

    throw error;
  } finally {
    await session.endSession();
  }

  const populatedWorkspace = await Workspace.findById(acceptedWorkspace._id)
    .populate("owner", "name email avatar")
    .populate("members.user", "name email avatar");

  return res.status(200).json({
    success: true,
    message: "Invitation accepted successfully",
    workspace: populatedWorkspace
  });
});

// Reject an invitation.
export const rejectInvitation = asyncHandler(async (req, res, next) => {
  const { invitationId } = req.params;

  if (!isValidObjectId(invitationId)) {
    return next(new ErrorHandler("Invalid invitation ID", 400));
  }

  const invitation = await WorkspaceInvitation.findById(invitationId);

  if (!invitation) {
    return next(new ErrorHandler("Invitation not found", 404));
  }

  if (invitation.email !== req.user.email.toLowerCase()) {
    return next(
      new ErrorHandler("This invitation was not sent to your account", 403)
    );
  }

  if (invitation.status !== "pending") {
    return next(new ErrorHandler("This invitation is no longer pending", 400));
  }

  if (invitation.expiresAt <= new Date()) {
    invitation.status = "expired";
    await invitation.save();

    return next(new ErrorHandler("This invitation has expired", 400));
  }

  invitation.status = "rejected";
  await invitation.save();

  return res.status(200).json({
    success: true,
    message: "Invitation rejected successfully"
  });
});

// Cancel an invitation. Only the workspace owner can cancel it.
export const cancelInvitation = asyncHandler(async (req, res, next) => {
  const { invitationId } = req.params;

  if (!isValidObjectId(invitationId)) {
    return next(new ErrorHandler("Invalid invitation ID", 400));
  }

  const invitation = await WorkspaceInvitation.findById(invitationId);

  if (!invitation) {
    return next(new ErrorHandler("Invitation not found", 404));
  }

  const workspace = await Workspace.findById(invitation.workspace);

  if (!workspace) {
    return next(new ErrorHandler("Workspace not found", 404));
  }

  if (String(workspace.owner) !== String(req.user._id)) {
    return next(
      new ErrorHandler("Only the workspace owner can cancel invitations", 403)
    );
  }

  if (invitation.status !== "pending") {
    return next(new ErrorHandler("This invitation is no longer pending", 400));
  }

  await WorkspaceInvitation.deleteOne({
    _id: invitation._id,
    status: "pending"
  });

  await createActivity({
    workspace: workspace._id,
    user: req.user._id,
    action: "invitation_cancelled",
    metadata: {
      email: invitation.email,
      invitationId: invitation._id
    }
  });

  return res.status(200).json({
    success: true,
    message: "Invitation cancelled successfully"
  });
});

// Get all invitations for a workspace. Only the owner can view this list.
export const getWorkspaceInvitations = asyncHandler(
  async (req, res, next) => {
    const { workspaceId } = req.params;

    if (!isValidObjectId(workspaceId)) {
      return next(new ErrorHandler("Invalid workspace ID", 400));
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return next(new ErrorHandler("Workspace not found", 404));
    }

    if (String(workspace.owner) !== String(req.user._id)) {
      return next(
        new ErrorHandler("Only the workspace owner can view invitations", 403)
      );
    }

    const now = new Date();

    await WorkspaceInvitation.updateMany(
      {
        workspace: workspace._id,
        status: "pending",
        expiresAt: { $lte: now }
      },
      { $set: { status: "expired" } }
    );

    const invitations = await WorkspaceInvitation.find({
      workspace: workspace._id
    })
      .populate("invitedBy", "name email avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      invitations
    });
  }
);
