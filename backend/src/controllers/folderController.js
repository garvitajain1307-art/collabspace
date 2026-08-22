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

    const {workspaceId,folderId}=req.params;

    if(!workspaceId || !folderId){
        return next(new ErrorHandler("WorkspaceId and folderId are required",400));
    }

    const workspace=await Workspace.findOne({_id:workspaceId,"members.user":user._id})

    if(!workspace){
        return next(new ErrorHandler("Workspace doesnt exist or you are not the member",404));
    }

    const folder=await Folder.findOne({_id:folderId,workspace:workspaceId});

    if (!folder) {
        return next(new ErrorHandler("Folder not found", 404));
    }

    res.status(200).json({
        success:true,
        message:"Folder fetched sucessfully",
        folder
    })
})



