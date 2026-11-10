
import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Document title is required"],
      trim: true,
      maxlength: [100, "Length cannot exceed 100 characters"],
    },

    content: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },

    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        permission: {
          type: String,
          enum: ["editor", "viewer"],
          default: "viewer",
          required: true,
        },

        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    currentVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Version",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Document = mongoose.model("Document", documentSchema);

export default Document;
