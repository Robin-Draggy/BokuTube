import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

/**
 * GET ALL VIDEOS (search + filter + pagination + sort)
 */
export const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
    query = "",
    userId,
  } = req.query;

  const matchStage = {
    isPublished: true,
  };

  // Searching by query (regex is searching)
  if (query) {
    matchStage.title = { $regex: query, $options: "i" };
  }

  if (userId && isValidObjectId(userId)) {
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  }

  const sortStage = {
    [sortBy]: sortType === "asc" ? 1 : -1,
  };

  const aggregate = Video.aggregate([
    { $match: matchStage },
    { $sort: sortStage },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$owner" },
  ]);

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const videos = await Video.aggregatePaginate(aggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

/**
 * PUBLISH VIDEO
 */
export const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if(!title && !description){
        throw new ApiError(400, "Title & description are required")
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if(!videoLocalPath && !thumbnailLocalPath){
        throw new ApiError(400, "Video file and thumbnail are required")
    }

    const uploadedVideo = await uploadOnCloudinary(videoLocalPath)
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!uploadedVideo?.url && !uploadedThumbnail?.url){
        throw new ApiError(400, "File upload failed")
    }

    const video = await Video.create({
        title,
        description,
        videoFile: uploadedVideo.url,
        thumbnail: uploadedThumbnail.url,
        duration: uploadedVideo.duration || 0,
        owner: req.user?._id
    })

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            video,
            "Video published successfully"
        )
    )
})

/**
 * GET VIDEO BY ID
 */
export const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId).populate("owner", "username avatar");

    if(!video){
        throw new ApiError(400, "Video not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video fetched successfully"
        )
    )
})

/**
 * UPDATE VIDEO
 */
export const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400, "Video not found")
    }

    // ownership check 
    if(video.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "Unauthorized")
    }

    // thumbnail update if new thumbnail is provided
    if(req.file?.path){
        const uploadedThumbnail = await uploadOnCloudinary(req.file.path);
        video.thumbnail = uploadedThumbnail.url;
    }

    if(title) video.title = title;
    if(description) video.description = description;

    await video.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video updated successfully"
        )
    )
})

/**
 * DELETE VIDEO
 */
export const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId);
    
    // ownership check 
    if(video.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "Unauthorized")
    }

    await video.deleteOne();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Video deleted successfully"
        )
    )
})

/**
 * TOGGLE PUBLISH STATUS
 */
export const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Unauthorized");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Publish status toggled"));
});

