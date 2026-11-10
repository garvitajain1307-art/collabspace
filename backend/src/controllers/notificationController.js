
import mongoose from "mongoose";

import ErrorHandler from "../middlewares/error.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

import Notification from "../models/notification.js";

// GET MY NOTIFICATIONS
export const getMyNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(req.query.limit, 10) || 10)
  );

  const skip = (page - 1) * limit;

  const [notifications, totalCount, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user._id })
      .populate("actor", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Notification.countDocuments({
      recipient: req.user._id
    }),

    Notification.countDocuments({
      recipient: req.user._id,
      read: false
    })
  ]);

  return res.status(200).json({
    success: true,
    message: "Notifications fetched successfully",
    notifications,
    totalCount,
    unreadCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit)
  });
});

// MARK ONE NOTIFICATION AS READ
export const markNotificationAsRead = asyncHandler(
  async (req, res) => {
    const { notificationId } = req.params;

    if (!mongoose.isValidObjectId(notificationId)) {
      throw new ErrorHandler("Invalid notification ID", 400);
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipient: req.user._id
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      throw new ErrorHandler("Notification not found", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification
    });
  }
);

// MARK ALL NOTIFICATIONS AS READ
export const markAllNotificationsAsRead = asyncHandler(
  async (req, res) => {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        read: false
      },
      { read: true }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });
  }
);

// DELETE ONE NOTIFICATION
export const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  if (!mongoose.isValidObjectId(notificationId)) {
    throw new ErrorHandler("Invalid notification ID", 400);
  }

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: req.user._id
  });

  if (!notification) {
    throw new ErrorHandler("Notification not found", 404);
  }

  return res.status(200).json({
    success: true,
    message: "Notification deleted successfully"
  });
});

// DELETE ALL MY NOTIFICATIONS
export const deleteAllNotifications = asyncHandler(
  async (req, res) => {
    await Notification.deleteMany({
      recipient: req.user._id
    });

    return res.status(200).json({
      success: true,
      message: "All notifications deleted successfully"
    });
  }
);
