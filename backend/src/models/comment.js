import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      maxlength: [500, "Length cannot exceed 500 characters"],
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
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        
      },
    ],
    resolved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const Comment=mongoose.model("Comment",commentSchema);
export default Comment;


