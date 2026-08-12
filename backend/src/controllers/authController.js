import ErrorHandler from "../middlewares/error.js";
import User from "../models/user.js";
import mongoose from "mongoose";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import bcrypt from "bcrypt";
import { check, validationResult } from "express-validator";
import { generateToken } from "../utils/generateToken.js";



export const registerUser=[
    check('name')
    .notEmpty()
    .withMessage('Name is required')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters')
    ,
    check('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()

    ,
    

    ,
    check('password')
    .isLength({min:8})
    .withMessage("Password must be atleast 8 characters long")
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage("Password must contain atleast one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain atleast one digit")
    .matches(/[!@#$%^&*(),.?":{}|<>/]/)
    .withMessage("Password must contain atleast one special character")
    .trim()
    ,
    check('confirmPassword')
             .trim()
             .custom((value,{req})=>{
                if(value!==req.body.password){
                        throw new Error('Passwords do not match')

                }
                return true
                })
    ,
    
    asyncHandler(async(req,res,next)=>{
        const {name,email,password}=req.body;
        
        const errors=validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({
                errors:errors.array().map(err=>err.msg),
                oldInput:{name,email}
            });
        }

        const existingUser= await User.findOne({email});
        if(existingUser){
            return next(new ErrorHandler("User already exists",400));
        }

        const hashedPassword=await bcrypt.hash(password,12);
        const user=await User.create({name,email,password:hashedPassword});

        if(!user){
            return next(new ErrorHandler("Unable to create User",400));
        }

        generateToken(user,201,"User registered successfully",res);



    })

]

export const login=[
    check('email')
    .notEmpty()
    .withMessage('Email is required')
    
    ,
    check('password')
    .notEmpty()
    .withMessage('Password is required')

    ,
    asyncHandler(async(req,res,next)=>{
    

    const {email,password}=req.body;

    const errors=validationResult(req);
        if(!errors.isEmpty()){
            return res.status(422).json({
               errors: errors.array().map(err => err.msg),
               oldInput: { email}

             })
        }
        
    const user = await User.findOne({ email }).select("+password");
    if(!user){
        return next(new ErrorHandler("Invalid credentials",401));

    }
    const isMatch=await bcrypt.compare(password,user.password);
    if(isMatch===false){
        return next(new ErrorHandler("Invalid credentials",401));
    }
    
    
    generateToken(user,200,"Login successfull",res);
    


})

]

export const logout = asyncHandler(async (req, res, next) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});


export const getUser = asyncHandler(async (req, res, next) => {
    const user = req.user;

    res.status(200).json({
        success: true,
        message: "User found",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            workspaces: user.workspaces,
            ownedDocuments: user.ownedDocuments
        }
    });
});