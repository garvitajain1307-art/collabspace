import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "comment_mention",
        "document_shared",
        "workspace_invite",
        "suggestion_created",
        "suggestion_accepted",
        "suggestion_rejected",
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [300, "Message cannot exceed 300 characters"],
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      default: null,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    read: {
      type: Boolean,
      default: false,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
  },
  {
    timestamps: true,
  },
);

const Notification = mongoose.model("Notification",notificationSchema);
export default Notification;