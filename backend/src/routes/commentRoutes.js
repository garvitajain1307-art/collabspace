
import express from "express";

import { isAuthenticated } from "../middlewares/authMiddleware.js";

import {
  createComment,
  getDocumentComments,
  updateComment,
  deleteComment,
  toggleCommentResolved
} from "../controllers/commentController.js";

const router = express.Router();

router.post("/:documentId", isAuthenticated, createComment);
router.get("/:documentId", isAuthenticated, getDocumentComments);

router.put("/update/:commentId", isAuthenticated, updateComment);
router.delete("/delete/:commentId", isAuthenticated, deleteComment);

router.patch(
  "/resolve/:commentId",
  isAuthenticated,
  toggleCommentResolved
);

export default router;
