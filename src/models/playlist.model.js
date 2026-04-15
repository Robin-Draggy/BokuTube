import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },

        /**
         * Ordered videos
         */
        videos: [
            {
                video: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Video"
                },
                addedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],

        /**
         * Privacy control
         */
        privacy: {
            type: String,
            enum: ["public", "private", "unlisted"],
            default: "public"
        },

        /**
         * Special system playlist
         */
        isWatchLater: {
            type: Boolean,
            default: false
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

// indexes
playlistSchema.index({ owner: 1 });
playlistSchema.index({ privacy: 1 });

export const Playlist = mongoose.model("Playlist", playlistSchema);