import mongoose from "mongoose"


const subscriptionsSchema = new mongoose.Schema({
    subscriber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {timestamps: true})

/**
 * Prevent duplicate subscriptions
 * (same user subscribing same channel multiple times)
 */
subscriptionsSchema.index(
    {subscriber: 1, channel: 1},
    {unique: true}
)

/**
 * ⚡ Optimize queries (important for scale)
 */
subscriptionsSchema.index({ channel: 1 });
subscriptionsSchema.index({ subscriber: 1 });

export const Subscription = mongoose.model("Subscription", subscriptionsSchema)