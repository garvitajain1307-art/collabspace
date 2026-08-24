import express from "express";
import {createDocument,getWorkspaceDocuments,getDocument,updateDocument,deleteDocument} from "../controllers/documentController.js"
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router=express.Router();


router.post("/createDocument/:workspaceId",isAuthenticated,createDocument);
router.get("/getWorkspaceDocuments/:workspaceId",isAuthenticated,getWorkspaceDocuments);
router.get("/getDocument/:documentId",isAuthenticated,getDocument);
router.put("/updateDocument/:documentId",isAuthenticated,updateDocument);
router.delete("/deleteDocument/:documentId",isAuthenticated,deleteDocument);

export default router;