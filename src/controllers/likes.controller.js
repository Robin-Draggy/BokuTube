import { Like } from "../models/likes.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "./notification.controller.js";

// LIKE / UNLIKE VIDEO
export const toggleLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    const existing = await Like.findOne({
        user: req.user._id,
        video: videoId
    });

    if (existing) {
        await existing.deleteOne();

        return res.status(200).json(
            new ApiResponse(200, { liked: false }, "Unliked")
        );
    }

    await Like.create({
        user: req.user._id,
        video: videoId
    });

    // create notification (only when liking, not unliking)
    await createNotification({
        recipient: video.owner,
        sender: req.user._id,
        type: "like",
        video: videoId
    });

    return res.status(200).json(
        new ApiResponse(200, { liked: true }, "Liked")
    );
});


// COUNT LIKE
export const countLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const count = await Like.countDocuments({ video: videoId });

    return res.status(200).json(
        new ApiResponse(200, count, "Count fetched successfully")
    );
});