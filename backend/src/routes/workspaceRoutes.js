import express from "express";
import {createWorkspace,getMyWorkspaces,getWorkspace,updateWorkspace,deleteWorkspace,removeMemberFromWorkspace,leaveWorkspace,updateWorkspaceMemberRole} from "../controllers/workspaceController.js"
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router=express.Router();


router.post("/createWorkspace",isAuthenticated,createWorkspace);
router.get("/getMyWorkspaces",isAuthenticated,getMyWorkspaces);
router.get("/getWorkspace/:workspaceId",isAuthenticated,getWorkspace);
router.put("/updateWorkspace/:workspaceId",isAuthenticated,updateWorkspace);
router.delete("/deleteWorkspace/:workspaceId",isAuthenticated,deleteWorkspace);
router.delete("/deleteMember/:workspaceId/members/:memberId",isAuthenticated,removeMemberFromWorkspace);
router.delete("/leaveWorkspace/:workspaceId",isAuthenticated,leaveWorkspace);
router.put("/updateMemberRole/:workspaceId/members/:memberId",isAuthenticated,updateWorkspaceMemberRole);
export default router;