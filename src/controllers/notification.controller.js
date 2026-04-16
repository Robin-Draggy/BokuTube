import { Notification } from "../models/notification.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * CREATE NOTIFICATION (internal use)
 */
export const createNotification = async ({
    recipient,
    sender,
    type,
    video = null,
    comment = null
}) => {
    if (recipient.toString() === sender.toString()) return;

    await Notification.create({
        recipient,
        sender,
        type,
        video,
        comment
    });
};


/**
 * GET USER NOTIFICATIONS (paginated)
 */
const getNotifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const notifications = await Notification.find({
        recipient: req.user._id
    })
        .populate("sender", "username avatar")
        .populate("video", "title thumbnail")
        .populate("comment", "content")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    return res.json(
        new ApiResponse(200, notifications, "Notifications fetched")
    );
});


/**
 * MARK AS READ (single)
 */
const markAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    await Notification.findByIdAndUpdate(notificationId, {
        isRead: true
    });

    return res.json(
        new ApiResponse(200, {}, "Marked as read")
    );
});


/**
 * MARK ALL AS READ
 */
const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { isRead: true }
    );

    return res.json(
        new ApiResponse(200, {}, "All marked as read")
    );
});


/**
 * DELETE NOTIFICATION
 */
const deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    await Notification.findByIdAndDelete(notificationId);

    return res.json(
        new ApiResponse(200, {}, "Deleted")
    );
});

export {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};