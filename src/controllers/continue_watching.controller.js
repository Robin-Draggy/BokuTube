import { ContinueWatching } from "../models/continueWatching.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


//  UPDATE WATCH PROGRESS

export const updateProgress = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { progress, duration } = req.body;

    let record = await ContinueWatching.findOne({
        user: req.user._id,
        video: videoId
    });

    if (!record) {
        record = await ContinueWatching.create({
            user: req.user._id,
            video: videoId,
            progress,
            duration
        });
    } else {
        record.progress = progress;
        record.duration = duration;
        record.updatedAt = new Date();

        await record.save();
    }

    return res.status(200).json(
        new ApiResponse(200, record, "Progress updated")
    );
});

// CONTINUE WATCH LIST
export const getContinueWatching = asyncHandler(async (req, res) => {
    const list = await ContinueWatching.find({
        user: req.user._id
    })
        .sort({ updatedAt: -1 })
        .populate("video", "title thumbnail duration");

    return res.status(200).json(
        new ApiResponse(200, list, "Continue watching fetched")
    );
});