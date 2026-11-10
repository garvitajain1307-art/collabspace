
import express from "express";

import { isAuthenticated } from "../middlewares/authMiddleware.js";

import {
  getWorkspaceActivities
} from "../controllers/activityController.js";

const router = express.Router();

router.get("/:workspaceId", isAuthenticated, getWorkspaceActivities);

export default router;
