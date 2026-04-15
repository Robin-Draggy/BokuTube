import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscriptions.model.js";


// TOGGLE SUBSCRIPTION

export const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel ID")
    }

    // Ownership check
    if(channelId !== req.user?._id.toString()){
        throw new ApiError(400, "You cannot subscribe to yourself")
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    // unsubscribe
    if(existingSubscription){
        await existingSubscription.deleteOne();

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { subscribed: false },
                "Unsubscribed"
            )
        )
    }

    // subscribe
    await Subscription.create({
        subscriber: req.user._id,
        channel: channelId
    })

    return res
    .status(200)
        .json(
            new ApiResponse(
                200,
                { subscribed: true },
                "Subscribed"
            )
        )

    
})


// GET ALL SUBSCRIBER OF A CHANNEL

export const getChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel ID")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {$unwind: "$subscriber"}
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscribers,
            "Subscribers fetched successfully"
        )
    )
})

// GET ALL CHANNEL USER SUBSCRIBED TO

export const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user ID")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {$unwind: "$channel"}
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscribers,
            "Channel fetched successfully"
        )
    )
})

// SUBSCRIBER COUNT

export const getSubscriberCount = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user ID")
    }

    const count = await Subscription.countDocuments({
        channel: channelId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            count,
            "Subscriber count fetched successfully"
        )
    )
})

// SUBSCRIBED FEED

export const getSubscribedFeed = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // 1. get subscribed channels
    const subscriptions = await Subscription.find({
        subscriber: userId
    }).select("channel");

    const channelIds = subscriptions.map(sub => sub.channel);

    // 2. fetch videos
    const videos = await Video.aggregate([
        {
            $match: {
                owner: { $in: channelIds },
                isPublished: true
            }
        },
        {
            $addFields: {
                score: {
                    $add: [
                        { $multiply: ["$views", 0.7] },
                        {
                            $divide: [
                                1,
                                {
                                    $add: [
                                        {
                                            $divide: [
                                                { $subtract: [new Date(), "$createdAt"] },
                                                1000 * 60 * 60 // hours
                                            ]
                                        },
                                        1
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }
        },
        { $sort: { score: -1 } },
        { $limit: 50 },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    { $project: { username: 1, avatar: 1 } }
                ]
            }
        },
        { $unwind: "$owner" }
    ]);

    return res.status(200).json(
        new ApiResponse(200, videos, "Subscribed feed fetched")
    );
});

