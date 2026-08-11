import mongoose from "mongoose";

const folderSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Folder name is required"],
        trim:true,
        maxlength:[50,"Length cannot exceed 50 characters"]

    },

    workspace:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Workspace",
        required:true
    },
    parentFolder:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Folder",
        default:null    
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    }
},
    {
        timestamps:true

})

const Folder=mongoose.model("Folder",folderSchema);
export default Folder;