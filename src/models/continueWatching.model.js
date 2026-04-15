import mongoose from "mongoose";

const continueWatchingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
            required: true
        },
        progress: {
            type: Number,
            default: 0 // seconds watched
        },
        duration: {
            type: Number,
            default: 0
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// prevent duplicates
continueWatchingSchema.index(
    { user: 1, video: 1 },
    { unique: true }
);

export const ContinueWatching = mongoose.model(
    "ContinueWatching",
    continueWatchingSchema
);