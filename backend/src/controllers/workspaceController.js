import ErrorHandler from "../middlewares/error.js";
import User from "../models/user.js";
import Workspace from "../models/workspace.js";
import mongoose from "mongoose";
import { asyncHandler } from "../middlewares/asyncHandler.js";

import { check, validationResult } from "express-validator";


export const createWorkspace =asyncHandler(async(req,res,next)=>{
    
    const user=req.user;
    if(!user){
        return next(new ErrorHandler("User not found",404));
    }
    const {name,description}=req.body;

    const workspace=await Workspace.create({name,description,owner:user._id,members: [
        {
            user: user._id,
            role: "owner"
        }
    ]});

    if(!workspace){
        return next(new ErrorHandler("Unable to create workspace",400));
    }

    user.workspaces.push(workspace._id);
    await user.save();

    res.status(201).json({
        success:true,
        message:"Workspace created successfully",
        workspace
    });
    
    
})

export const getMyWorkspaces=asyncHandler(async(req,res,next)=>{
    const user=req.user;

    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const workspaces=await Workspace.find({ "members.user": user._id});

    res.status(200).json({
        success:true,
        workspaces
    });
})

export const getWorkspace=asyncHandler(async(req,res,next)=>{
    const user=req.user;
    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const {workspaceId}=req.params;

    if(!workspaceId){
        return next(new ErrorHandler("Workspace Id is required",400));
    }

    const workspace = await Workspace.findOne({ _id: workspaceId,"members.user": user._id});
    if(!workspace){
        return next(new ErrorHandler("Workspace not found",404));
    }

    return res.status(200).json({
        success:true,
        workspace
    })
})

export const updateWorkspace=asyncHandler(async(req,res,next)=>{
    const user=req.user;
    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const workspaceId=req.params.workspaceId;
    if(!workspaceId){
        return next(new ErrorHandler("Workspace Id is required",400));
    }

    const workspace=await Workspace.findById({_id:workspaceId,owner:user._id});
    if(!workspace){
        return next(new ErrorHandler("Workspace not found",404));
    }

    const {name,description}=req.body;

    if(name!==undefined){
        workspace.name=name;
    }

    if(description!==undefined){
        workspace.description=description;
    }

    await workspace.save();

    return res.status(200).json({
        success:true,
        message:"Workspace updated successfully",
        workspace
    })


})

export const deleteWorkspace=asyncHandler(async(req,res,next)=>{
    const user=req.user;
    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const workspaceId=req.params.workspaceId;
    if(!workspaceId){
        return next(new ErrorHandler("Workspace Id is required",400));
    }

    const workspace=await Workspace.findOne({_id:workspaceId,owner:user._id});
    if(!workspace){
        return next(new ErrorHandler("Workspace not found",404));
    }

    

    await Workspace.findByIdAndDelete(workspaceId);

    await User.updateMany({ workspaces: workspaceId },{
        $pull: {
            workspaces: workspaceId
        }
    }
    );

    res.status(200).json({
        success: true,
        message: "Workspace deleted successfully"
    });
    
})

export const removeMemberFromWorkspace=asyncHandler(async(req,res,next)=>{
    const user=req.user;
    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const {workspaceId,memberId}=req.params;
    if(!workspaceId || !memberId){
        return next(new ErrorHandler("Workspace and memberId are required",400))
    }
    const workspace=await Workspace.findOne({_id:workspaceId,owner:user._id});

    if(!workspace){
        return next(new ErrorHandler("Workspace not found or you are not the owner",404));
    }

    if(workspace.owner.toString()===memberId){
        return next(new ErrorHandler("Owner cannot be removed from the workspace",400));
    }

    const member=await User.findOne({_id:memberId,workspaces:workspaceId});

    if(!member){
        return next(new ErrorHandler("Member not found",404));
    }

    workspace.members = workspace.members.filter(
        member => member.user.toString() !== memberId
    );
    await workspace.save();

    await User.findByIdAndUpdate(memberId, {
        $pull: {
            workspaces: workspaceId
        }
    });

    res.status(200).json({
        success: true,
        message: "Member removed successfully"
    });

    
})

export const leaveWorkspace=asyncHandler(async(req,res,next)=>{
    const user=req.user;
    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const {workspaceId}=req.params;
    if(!workspaceId ){
        return next(new ErrorHandler("WorkspaceId is required",400))
    }
    const workspace=await Workspace.findById(workspaceId);

    if(!workspace){
        return next(new ErrorHandler("Workspace not found or you are not the owner",404));
    }

    if(workspace.owner.toString()===user._id.toString()){
        return next(new ErrorHandler("Owner cannot leave the workspace",400));
    }

    const member=await User.findOne({_id:user._id,workspaces:workspaceId});

    if(!member){
        return next(new ErrorHandler("You are not a member of this workspace",404));
    }

    workspace.members = workspace.members.filter(
        member => member.user.toString() !== user._id.toString()
    );
    
    await workspace.save();

    await User.findByIdAndUpdate(user._id, {
        $pull: {
            workspaces: workspaceId
        }
    });

    res.status(200).json({
        success: true,
        message: "You left the workspace successfully"
    });

    
})