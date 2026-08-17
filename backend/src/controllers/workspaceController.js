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

    const workspace=await Workspace.create({name,description,owner:user._id,members:[user._id]});

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

    const workspaces=await Workspace.find({members:user._id});

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

    const workspace=await Workspace.findById({_id:workspaceId,members:user._id});
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

// export const removeMemberFromWorkspace=asyncHandler(async(req,res,next)=>{
//     const user=req.user;
//     if(!user){
//         return next(new ErrorHandler("User not found",404));
//     }

//     const {workspaceId}=req.params.workspaceId;
//     const workspace=Workspace.findOne({_id:workspaceId,owner:user._id});

//     if(!workspace){
//         return next(new ErrorHandler("Workspace not found",404));
//     }

//     const memberId=req.params.memberId;

    
// })