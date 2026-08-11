import mongoose from "mongoose";

const workspaceSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Workspace name is required"],
        trim:true,
        maxlength:[50,"Length cannot exceed 50 characters"]


    },

    description:{
        type:String,
        trim:true,
        maxLength:[200,"Length cannot exceed 200 characters"]
    },

    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true


    },
    members:[
        {
            user:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User",
                required:true

            },
            role:{
                type:String,
                enum:["owner","admin","member"],
                default:"member"
            },
            joinedAt: {
                type: Date,
                default: Date.now
            }

            
        }   
    ],
    folders:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Folder"
        }
    ],
    documents:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Document"

        }
    ]

},{
    timestamps:true
});

const Workspace=mongoose.model("Workspace",workspaceSchema);
export default Workspace;