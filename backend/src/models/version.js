
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

versionSchema.index(
    {
        document: 1,
        versionNumber: 1
    },
    {
        unique: true
    }
);

const Version = mongoose.model("Version", versionSchema);

export default Version;
