import mongoose from "mongoose";

const versionSchema = new mongoose.Schema(
    {
        document: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Document",
            required: true
        },

        versionNumber: {
            type: Number,
            required: true,
            min: 1
        },

        content: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Version = mongoose.model("Version", versionSchema);

export default Version;