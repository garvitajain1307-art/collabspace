import express from "express";
import {createFolder,getWorkspaceFolders,getFolder,updateFolder,deleteFolder} from "../controllers/folderController.js"
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router=express.Router();


router.post("/createFolder/:workspaceId",isAuthenticated,createFolder);
router.get("/getWorkspaceFolders/:workspaceId",isAuthenticated,getWorkspaceFolders);
router.get("/getFolder/:folderId",isAuthenticated,getFolder);
router.put("/updateFolder/:folderId",isAuthenticated,updateFolder);
router.delete("/deleteFolder/:folderId",isAuthenticated,deleteFolder);

export default router;