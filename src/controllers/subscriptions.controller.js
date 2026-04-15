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