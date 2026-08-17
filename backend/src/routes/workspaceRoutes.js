import express from "express";
import {createWorkspace,getMyWorkspaces,getWorkspace,updateWorkspace,deleteWorkspace} from "../controllers/workspaceController.js"
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router=express.Router();


router.post("/createWorkspace",isAuthenticated,createWorkspace);
router.get("/getMyWorkspaces",isAuthenticated,getMyWorkspaces);
router.get("/getWorkspace/:workspaceId",isAuthenticated,getWorkspace);
router.post("/updateWorkspace/:workspaceId",isAuthenticated,updateWorkspace);
router.delete("/deleteWorkspace/:workspaceId",isAuthenticated,deleteWorkspace);
export default router;