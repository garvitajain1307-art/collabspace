
import express from "express";

import { isAuthenticated } from "../middlewares/authMiddleware.js";

import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", isAuthenticated, getMyNotifications);

router.patch(
  "/read-all",
  isAuthenticated,
  markAllNotificationsAsRead
);

router.patch(
  "/read/:notificationId",
  isAuthenticated,
  markNotificationAsRead
);

router.delete("/all", isAuthenticated, deleteAllNotifications);
router.delete("/:notificationId", isAuthenticated, deleteNotification);

export default router;
