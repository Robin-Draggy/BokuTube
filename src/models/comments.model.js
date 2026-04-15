import mongoose, { trusted } from "mongoose";
import { Video } from "./video.model";

const commentsSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    videos: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps: true})

export const Comment = mongoose.model("Comment", commentsSchema)