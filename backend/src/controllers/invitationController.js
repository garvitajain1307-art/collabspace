import ErrorHandler from "../middlewares/error.js";
import User from "../models/user.js";
import Workspace from "../models/workspace.js";
import WorkspaceInvitation from "../models/workspaceInvitation.js"
import mongoose from "mongoose";
import crypto from "crypto";

import { asyncHandler } from "../middlewares/asyncHandler.js";

export const createInvitation=asyncHandler(async(req,res,next)=>{
    const user=req.user;

    if(!user){
        return next(new(ErrorHandler("User not found",404)));
    }

    const {workspaceId}=req.params;
    const {email,role}=req.body;

     if(!workspaceId || !email){
        return next(new ErrorHandler("WorkspaceId and email are required",400));
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return next(new ErrorHandler("Please provide a valid email", 400));
    }

    const workspace=await Workspace.findOne({_id:workspaceId,owner:user._id});
    if(!workspace){
        return next(new ErrorHandler("Either workspace doesn't exist or you are not the owner",404));
    }

    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000
    );

    const invitation = await WorkspaceInvitation.create({
        workspace: workspaceId,
        invitedBy: user._id,
        email,
        role,
        token,
        expiresAt
    });

    res.status(201).json({
        success: true,
        message: "Invitation created successfully",
        invitation
    });

})

export const getMyInvitations=asyncHandler(async(req,res,next)=>{
    const user=req.user;

    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const invitations=await WorkspaceInvitation.find({email:user.email,status:"pending"});
    res.status(200).json({
        success: true,
        message: "Invitations fetched successfully",
        invitations
    });
    
    
})

export const acceptInvitation=asyncHandler(async(req,res,next)=>{
    const user=req.user;

    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const {invitationId}=req.params;

    if(!invitationId){
        return next(new ErrorHandler("InvitationId is required",400));
    }

    const invitation=await WorkspaceInvitation.findOne({_id:invitationId,email:user.email});

    if(!invitation){
        return next(new ErrorHandler("Invitation not found",404));

    }

    if(invitation.status!=="pending"){
        return next(new ErrorHandler("You can't accept this invitation",400))
    }

    if (invitation.expiresAt < new Date()) {
        return next(new ErrorHandler("Invitation has expired", 400));
    }

    const workspace=await Workspace.findById(invitation.workspace);

    if (!workspace) {
        return next(new ErrorHandler("Workspace not found", 404));
    }

    const member = await User.findOne({
        _id: user._id,
        workspaces: workspace._id
    });

    if (member) {
        return next(
            new ErrorHandler("You are already a member of this workspace", 400)
        );
    }

    workspace.members.push({
        user: user._id,
        role: invitation.role
    });

    await workspace.save();

    user.workspaces.push(workspace._id);
    await user.save();



    invitation.status="accepted";
    await invitation.save();

    res.status(200).json({
        success: true,
        message: "Invitation accepted successfully",
        workspace
    });

    
})

export const rejectInvitation=asyncHandler(async(req,res,next)=>{
    const user=req.user;
    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const {invitationId}=req.params;

    if(!invitationId){
        return next(new ErrorHandler("InvitationId is required",400));
    }

    const invitation=await WorkspaceInvitation.findOne({_id:invitationId,email:user.email});

    if(!invitation){
        return next(new ErrorHandler("Invitation not found",404));

    }

    if(invitation.status!=="pending"){
        return next(new ErrorHandler("You can't reject this invitation",400))
    }

    if (invitation.expiresAt < new Date()) {
        return next(new ErrorHandler("Invitation has expired", 400));
    }


    invitation.status="rejected";
    await invitation.save();

    res.status(200).json({
        success: true,
        message: "Invitation rejected successfully",
        
    });



})

export const cancelInvitation=asyncHandler(async(req,res,next)=>{
    const user=req.user;
    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const {invitationId}=req.params;

    if(!invitationId){
        return next(new ErrorHandler("InvitationId is required",400));
    }

    const invitation=await WorkspaceInvitation.findOne({_id:invitationId,invitedBy:user._id});

    if(!invitation){
        return next(new ErrorHandler("Invitation not found",404));

    }

    if(invitation.status!=="pending"){
        return next(new ErrorHandler("Only pending invitations can be cancelled",400))
    }
    const workspace = await Workspace.findOne({
        _id: invitation.workspace,
        owner: user._id
    });

    if (!workspace) {
        return next(
            new ErrorHandler(
                "Workspace not found or you are not the owner",
                403
            )
        );
    }
    await WorkspaceInvitation.findByIdAndDelete(invitationId);

    res.status(200).json({
        success: true,
        message: "Invitation cancelled successfully",
        
    });

    


})

export const getWorkspaceInvitations=asyncHandler(async(req,res,next)=>{
    const user=req.user;

    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const {workspaceId}=req.params;

    if(!workspaceId){
        return next(new ErrorHandler("WorkspaceId is required",400));
    }

    const workspace= await Workspace.findOne({_id:workspaceId,owner:user._id});

    if(!workspace){
        return next(new ErrorHandler("Either workspace doesn't exist or you are not the owner",404));
    }

    const invitations=await WorkspaceInvitation.find({workspace:workspaceId,invitedBy:user._id});

    res.status(200).json({
        success:true,
        message:"invitations of this workspace fetched successfully",
        invitations
    })
})



