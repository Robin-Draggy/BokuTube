import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "./notification.controller.js";
import { Comment } from "../models/comments.model.js";
import { Like } from "../models/likes.model.js";


// ADD COMMENT / REPLY
export const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content, parentId } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Content is required");
    }

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id,
        parent: parentId || null
    });

    // reply notification
    if (parentId) {
        const parentComment = await Comment.findById(parentId);

        if (parentComment) {
            await createNotification({
                recipient: parentComment.owner,
                sender: req.user._id,
                type: "reply",
                video: videoId,
                comment: comment._id
            });
        }
    } 
    // normal comment notification
    else {
        await createNotification({
            recipient: video.owner,
            sender: req.user._id,
            type: "comment",
            video: videoId,
            comment: comment._id
        });
    }

    return res.status(201).json(
        new ApiResponse(201, comment, "Comment added")
    );
});


// UPDATE COMMENT
export const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Content required");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) throw new ApiError(404, "Comment not found");

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized");
    }

    comment.content = content;
    await comment.save();

    return res.json(
        new ApiResponse(200, comment, "Comment updated")
    );
});


// SOFT DELETE COMMENT
export const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid ID");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) throw new ApiError(404, "Not found");

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized");
    }

    comment.content = "[deleted]";
    await comment.save();

    return res.json(
        new ApiResponse(200, {}, "Comment deleted")
    );
});


// TOGGLE COMMENT LIKE
export const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid ID");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");

    const existing = await Like.findOne({
        user: req.user._id,
        comment: commentId
    });

    if (existing) {
        await existing.deleteOne();

        return res.json(
            new ApiResponse(200, { liked: false }, "Unliked")
        );
    }

    await Like.create({
        user: req.user._id,
        comment: commentId
    });

    // notify comment owner
    await createNotification({
        recipient: comment.owner,
        sender: req.user._id,
        type: "like",
        comment: commentId
    });

    return res.json(
        new ApiResponse(200, { liked: true }, "Liked")
    );
});


// GET COMMENTS
export const getComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const skip = (page - 1) * limit;

    const comments = await Comment.aggregate([
        { $match: { video: new mongoose.Types.ObjectId(videoId), parent: null } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) },

        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [{ $project: { username: 1, avatar: 1 } }]
            }
        },
        { $unwind: "$owner" },

        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                likeCount: { $size: "$likes" },
                isLiked: { $in: [req.user?._id, "$likes.user"] }
            }
        },

        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "parent",
                as: "replies",
                pipeline: [
                    { $sort: { createdAt: -1 } },
                    { $limit: 3 }
                ]
            }
        }
    ]);

    return res.json(
        new ApiResponse(200, comments, "Comments fetched")
    );
});


// GET REPLIES
export const getReplies = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { page = 1, limit = 5 } = req.query;

    const skip = (page - 1) * limit;

    const replies = await Comment.find({ parent: commentId })
        .populate("owner", "username avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    return res.json(
        new ApiResponse(200, replies, "Replies fetched")
    );
});