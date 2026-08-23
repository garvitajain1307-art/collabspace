import ErrorHandler from "../middlewares/error.js";
import User from "../models/user.js";
import Workspace from "../models/workspace.js";
import WorkspaceInvitation from "../models/workspaceInvitation.js"
import Folder from "../models/folder.js"

import mongoose from "mongoose";
import crypto from "crypto";

import { asyncHandler } from "../middlewares/asyncHandler.js";

export const createFolder=asyncHandler(async(req,res,next)=>{
    const user=req.user;

    if(!user){
        return next(new ErrorHandler("User not found",404));
    }
    const {workspaceId}=req.params;
    const {name,parentFolder}=req.body;

    if(!workspaceId){
        return next(new ErrorHandler("WorkspaceId is required",400));
    }
    if(!name){
        return next(new ErrorHandler("Folder name is required",400));
    }

    

    const workspace=await Workspace.findOne({_id:workspaceId,"members.user":user._id})

    if(!workspace){
        return next(new ErrorHandler("Workspace not found or you are not a member of this workspace",404));
    }

    if(parentFolder){
        const parent=await Folder.findOne({_id:parentFolder,workspace:workspaceId});

        if(!parent){
            return next(new ErrorHandler("Parent Folder not found",404));
        }
    }

    const existingFolder = await Folder.findOne({
        workspace: workspaceId,
        parentFolder: parentFolder || null,
        name: name.trim()
    });

    if (existingFolder) {
        return next(new ErrorHandler("A folder with this name already exists here",400))
    }

    const folder=await Folder.create({name,workspace:workspaceId,parentFolder:parentFolder||null,createdBy:user._id});

    if(!folder){
        return next(new ErrorHandler("Unable to create folder",400));
    }
    
    workspace.folders.push(folder._id);
    await workspace.save();

    res.status(201).json({
        success: true,
        message: "Folder created successfully",
        folder
    });

})

export const getWorkspaceFolders=asyncHandler(async(req,res,next)=>{
    const user=req.user;

    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const {workspaceId}=req.params;

    if(!workspaceId){
        return next(new ErrorHandler("WorkspaceId is needed",400));
    }

    const workspace=await Workspace.findOne({_id:workspaceId,"members.user": user._id});

    if(!workspace){
        return next(new ErrorHandler("Workspace not found or you are not a member of this workspace",404));
    }

    const folders=await Folder.find({workspace:workspaceId});

    res.status(200).json({
        success: true,
        message: "Workspace folders fetched successfully",
        folders
    })
})

export const getFolder=asyncHandler(async(req,res,next)=>{
    const user=req.user;

    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const {folderId}=req.params;

    if( !folderId){
        return next(new ErrorHandler("folderId is required",400));
    }

    const workspace=await Workspace.findOne({_id: folder.workspace,"members.user":user._id})

    if(!workspace){
        return next(new ErrorHandler("Workspace doesnt exist or you are not the member",404));
    }

    const folder=await Folder.findById(folderId);

    if (!folder) {
        return next(new ErrorHandler("Folder not found", 404));
    }

    res.status(200).json({
        success:true,
        message:"Folder fetched sucessfully",
        folder
    })
})

export const updateFolder=asyncHandler(async(req,res,next)=>{
    const user=req.user;
    if(!user){
        return next(new ErrorHandler("user not found",404));
    }

    const {folderId}=req.params;
     const { name, parentFolder } = req.body;

    if(!folderId){
        return next(new ErrorHandler("FolderId is required"));
    }

    const folder=await Folder.findById(folderId);


    if(!folder){
        return next(new ErrorHandler("Folder not found",404));
    }

    const workspace=await Workspace.findOne({_id:folder.workspace,"members.user":user._id});
    if (!workspace) {
        return next(new ErrorHandler("Workspace doesn't exist or you are not a member",404));
    }

    const newName = name !== undefined ? name.trim() : folder.name;
    const newParentFolder =parentFolder !== undefined ? (parentFolder || null): folder.parentFolder;
    if (!newName) {
        return next(
            new ErrorHandler("Folder name cannot be empty", 400)
        );
    }

    if (newParentFolder && newParentFolder.toString() === folderId) {
        return next(new ErrorHandler("A folder cannot be its own parent",400));
    }

    if (newParentFolder) {
        const parent = await Folder.findOne({_id: newParentFolder,workspace: folder.workspace});
        if (!parent) {
            return next(new ErrorHandler("Parent folder not found",404));
        }
    }

    const existingFolder = await Folder.findOne({
        workspace: folder.workspace,
        parentFolder: newParentFolder,
        name: newName,
        _id: { $ne: folderId }
    });

    if (existingFolder) {
        return next(new ErrorHandler("A folder with this name already exists here",400));
    }

    folder.name = newName;
    folder.parentFolder = newParentFolder;

    await folder.save();

    res.status(200).json({
        success: true,
        message: "Folder updated successfully",
        folder
    });
})

export const deleteFolder=asyncHandler(async(req,res,next)=>{
    const user=req.user;
    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const {folderId}=req.params;
    if(!folderId){
        return next(new ErrorHandler("FolderId is required",400))
    }
    const folder=await Folder.findById(folderId);
    if(!folder){
        return next(new ErrorHandler("Folder not found",404));
    }
    
    const workspace=await Workspace.findOne({_id:folder.workspace,"members.user":user._id});

    if(!workspace){
        return next(new ErrorHandler("Workspace doesn't exist or you are not the member",404));
    }

    const deleteChildren=async(parentId)=>{
        const children=await Folder.find({parentFolder:parentId});

        for(const child of children){
            await deleteChildren(child._id)

            await Folder.findByIdAndDelete(child._id)
        }
    }

    await deleteChildren(folderId);

    await Folder.findByIdAndDelete(folderId);

     const remainingFolders = await Folder.find({
        workspace: folder.workspace
    });

    workspace.folders = remainingFolders.map(folder => folder._id);

    await workspace.save();

    res.status(200).json({
        success: true,
        message: "Folder and all its child folders deleted successfully"
    });
})




