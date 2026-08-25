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

export const addCollaborator=asyncHandler(async(req,res,next)=>{
    const user=req.user;
    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const {documentId}=req.params;
    const {userId,permission}=req.body;

    if(!documentId || !userId|| !permission){
        return next(new ErrorHandler("DocumentId, UserId and permissions are required",400));
    }

    if(permission !== "editor" && permission !=="viewer"){
        return next(new ErrorHandler("Permission must be editor or viewer",400));
    }

    const document= await Document.findById(documentId);

    if(!document){
        return next(new ErrorHandler("Document not found",404));
    }


    if(document.owner.toString()!==user._id.toString()){
        return next(new ErrorHandler("Only document owner can add collaborators",403));
    }

    const member=await User.findById(userId);

    if(!member){
        return next(new ErrorHandler("Collaborator not found",404))
    }

    const workspace=await Workspace.findOne({_id:document.workspace,"members.user":userId});

    if(!workspace){
        return next(new ErrorHandler("Collaborator is not a member of this workspace",400));
    }

    if(document.owner.toString()===userId.toString()){
        return next(new ErrorHandler("Document Owner cannot be added as collaborator",400));
    }

    const existingCollaborator=document.collaborators.find(collaborator=>collaborator.user.toString()===userId.toString());

    if(existingCollaborator){
        return next(new ErrorHandler("User is already a collaborator",400));

    }

    document.collaborators.push({
        user:userId,
        permission:permission
    })

    await document.save();
    
    res.status(200).json({
        success: true,
        message: "Collaborator added successfully",
        document
    });



})

export const getCollaborators=asyncHandler(async(req,res,next)=>{
    const user=req.user;
    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const {documentId}=req.params;
    if(!documentId){
        return next(new ErrorHandler("DocumentId is required",400));
    }

    const document=await Document.findById(documentId);
    if(!document){
        return next(new ErrorHandler("Document not found",404));
    }

    const workspace=await Workspace.findOne({_id:document.workspace,"members.user":user._id});

    if(!workspace){
        return next(new ErrorHandler("Workspace not found or you are not the member",404));
    }

    const hasAccess=document.owner.toString()===user._id.toString()||document.collaborators.some(collaborator=>collaborator.user.toString()===user._id.toString());
    if(!hasAccess){
        return next(new ErrorHandler("You don't have access to this resource",403));

    }

    const collaborators=await Document.findById(documentId).select("collaborators").populate("collaborators.user","name email");
    res.status(200).json({
        success: true,
        message: "Collaborators fetched successfully",
        collaborators: collaborators.collaborators
    });
})

export const updateCollaboratorPermission=asyncHandler(async(req,res,next)=>{
    const user=req.user;
    if(!user){
        return next(new ErrorHandler("User not found",404))
    }

    const {documentId,userId}=req.params;
    const {permission}=req.body;
    if(!documentId||!userId||!permission){
        return next(new ErrorHandler("DocumentId, userId and permission are required",400));
    }

    if (!["editor", "viewer"].includes(permission)) {
        return next(new ErrorHandler("Permission must be editor or viewer",400));
    }

    const document=await Document.findById(documentId);

    

    if(!document){
        return next(new ErrorHandler("document not found",404));
    }

    const workspace=await Workspace.findOne({_id:document.workspace, "members.user":user._id});

    if(!workspace){
        return next(new ErrorHandler("Workspace not found or you are not the member",404));
    }

    if(document.owner.toString()!==user._id.toString()){
        return next(new ErrorHandler("Only document owner can update permissions",403));
    }

    const collaborator=document.collaborators.find(collaborator=>collaborator.user.toString()===userId.toString());

    if(!collaborator){
        return next(new ErrorHandler("Collaborator not found",404));
    }

    collaborator.permission=permission;

    await document.save();

    res.status(200).json({
        success:true,
        message:"permission of collaborator updated successfully",
        document

    })
})

export const removeCollaborator=asyncHandler(async(req,res,next)=>{
    const user=req.user;

    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const {documentId,userId}=req.params;

    if(!documentId || !userId){
        return next(new ErrorHandler("documentId and userId are required",400));
    }

    const document=await Document.findById(documentId);

    if(!document){
        return next(new ErrorHandler("Document not found",404));
    }

    const workspace=await Workspace.findOne({_id:document.workspace,"members.user":user._id});

    if(!workspace){
        return next(new ErrorHandler("Workspace not found or you are not a member",404));
    }

    if(document.owner.toString()!==user._id.toString()){
        return next(new ErrorHandler("Only document owner can remove collaborators",403));
    }

    if(document.owner.toString()===userId.toString()){
        return next(new ErrorHandler("Document owner cannot be removed remove",400));
    }

    const collaborator=document.collaborators.find(collaborator => collaborator.user.toString()===userId.toString());

    if(!collaborator){
        return next(new ErrorHandler("collaborator not found",404));
    }

    document.collaborators.pull(userId);

    await document.save();

    res.status(200).json({
        success: true,
        message: "Collaborator removed successfully",
        document
    });




})