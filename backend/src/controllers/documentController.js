import ErrorHandler from "../middlewares/error.js";
import User from "../models/user.js";
import Workspace from "../models/workspace.js";
import WorkspaceInvitation from "../models/workspaceInvitation.js"
import Document from "../models/document.js";
import Folder from "../models/folder.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

import mongoose from "mongoose";
import crypto from "crypto";

export const createDocument=asyncHandler(async(req,res,next)=>{
    const user=req.user;
    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const {workspaceId}=req.params;
    const {title,content,folderId}=req.body;

    if(!workspaceId ||!title){
        return next(new ErrorHandler("WorkspaceId and title are required",400));
    }

    const workspace=await Workspace.findOne({_id:workspaceId,"members.user":user._id});

    if(!workspace){
        return next(new ErrorHandler("Workspace not found or you are not a member",404));
    }

    if(folderId){
        const folder=await Folder.findOne({_id:folderId,workspace:workspaceId});

        if(!folder){
            return next(new ErrorHandler("Folder not found in this workspace",404));
        }
    }

    const document=await Document.create({
        title:title.trim(),
        content:content||"",
        owner:user._id,
        workspace:workspaceId,
        folder:folderId||null,
        createdBy:user._id
    })

    if(!document){
        return next(new ErrorHandler("Unable to create document",400));
    }

    workspace.documents.push(document._id);
    await workspace.save();

    user.ownedDocuments.push(document._id);
    
    await user.save();

    res.status(201).json({
        success:true,
        message:"document created successfully",
        document
    })
})

export const getWorkspaceDocuments=asyncHandler(async(req,res,next)=>{
    const user=req.user;

    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const {workspaceId}=req.params;

    if(!workspaceId){
        return next(new ErrorHandler("WorkspaceId is required",400))
    }

    const workspace=await Workspace.findOne({_id:workspaceId,"members.user":user._id});

    if(!workspace){
        return next(new ErrorHandler("workspace not found or you are not a member",404));
    }

    const documents=await Document.find({workspace:workspaceId});

    res.status(200).json({
        success:true,
        message:"documents for this workspace fetched successfully",
        documents
    })
})

export const getDocument=asyncHandler(async(req,res,next)=>{
    const user=req.user;

    if(!user){
        return next(new ErrorHandler("user not found",404));
    }

    const {documentId}=req.params;

    if(!documentId){
        return next(new ErrorHandler("documentId is required",400));

    }

    const document=await Document.findById(documentId);

    if(!document){
        return next(new ErrorHandler("Document not found",404));
    }

    const workspace=await Workspace.findOne({_id:document.workspace,"members.user":user._id});
    if(!workspace){
        return next(new ErrorHandler("workspace not found or you are not a member",404));
    }

    res.status(200).json({
        success:true,
        message:"Document fetched successfully",
        document
    })

})

export const updateDocument=asyncHandler(async(req,res,next)=>{
    const user=req.user;

    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const {documentId}=req.params;
    const {title,content,folderId}=req.body;

    if(!documentId){
        return next(new ErrorHandler("documentId is requires",400));
    }

    const document=await Document.findById(documentId);
    if(!document){
        return next(new ErrorHandler("Document not found",404));
    }

    const workspace=await Workspace.findOne({_id:document.workspace,"members.user":user._id});

    if(!workspace){
        return next(new ErrorHandler("workspace not found or you are not the member",404));
    }

    if(title!==undefined){
        if(!title.trim()){
            return next(new ErrorHandler("Title cannot be empty",400));
        }

        document.title=title.trim();
    }

    if(content!==undefined){
        document.content=content;
    }

    if(folderId!==undefined){
        if(folderId===null || folderId===""){
            document.folder=null;
        }else{
            const folder=await Folder.findOne({_id:folderId,workspace:document.workspace});

            if(!folder){
                return next(new ErrorHandler("Folder not found in this workspace",404));
            }

            document.folder=folderId;
        }
    }

    await document.save();

    res.status(200).json({
        success:true,
        message:"Document updated successfully",
        document
    })
})

export const deleteDocument=asyncHandler(async(req,res,next)=>{
    const user=req.user;

    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const {documentId}=req.params;

    if(!documentId){
        return next(new ErrorHandler("DocumentId id required",400));
    }

    const document=await Document.findById(documentId);

    if(!document){
        return next(new ErrorHandler("Document not found",404));
    }

    const workspace=await Workspace.findOne({_id:document.workspace,"members.user":user._id});

    if(!workspace){
        return next(new ErrorHandler("Workspace not found or you are not the member",404));
    }

    await Document.findByIdAndDelete(documentId);

   
    workspace.documents.pull(documentId);
    await workspace.save();

   
    await User.findByIdAndUpdate(document.owner, {
        $pull: {
            ownedDocuments: documentId
        }
    });

    res.status(200).json({
        success: true,
        message: "Document deleted successfully"
    });

})


