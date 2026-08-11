import mongoose from "mongoose";

const suggestionsSchema=new mongoose.Schema(
    {
    document:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Document",
        required:true
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true

    },
    type:{
        type: String,
        enum:["user","ai"],
        required:true
    },
    action:{
        type:String,
        enum:["rewrite","grammar","summarize","meeting_notes","custom"],
        required:true
    },
    originalText:{
        type: String,
        required: true

    },
    suggestedText:{
        type: String,
        required: true
    },
    position: {
      start: {
        type: Number,
        required: true,
      },
      end: {
        type: Number,
        required: true,
      },
      selectedText: {
        type: String,
        default: "",
      },
    },

    status:{
        type:String,
        enum:["pending","accepted","rejected"],
        default:"pending"
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    reviewedAt: {
        type: Date,
        default: null
    }


},
    {
        timestamps:true
    }

)

const Suggestion=mongoose.model("Suggestion",suggestionsSchema);
export default Suggestion;