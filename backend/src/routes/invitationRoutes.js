import express from "express";
import {createInvitation,getMyInvitations,acceptInvitation,rejectInvitation,cancelInvitation,getWorkspaceInvitations} from "../controllers/invitationController.js"
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router=express.Router();


router.post("/createInvitation/:workspaceId",isAuthenticated,createInvitation);
router.get("/getMyInvitations",isAuthenticated,getMyInvitations);
router.put("/acceptInvitation/:invitationId",isAuthenticated,acceptInvitation);
router.put("/rejectInvitation/:invitationId",isAuthenticated,rejectInvitation);
router.put("/cancelInvitation/:invitationId",isAuthenticated,cancelInvitation);
router.get("/getWorkspaceInvitations/:workspaceId",isAuthenticated,getWorkspaceInvitations);

export default router;