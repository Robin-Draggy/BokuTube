import { Router } from "express";
import {jwtVerify} from "../middlewares/auth.middleware.js"
import { getChannelSubscribers, getSubscribedChannels, getSubscribedFeed, getSubscriberCount, toggleSubscription } from "../controllers/subscriptions.controller.js";


export const router = Router();

router.route("/toggle/:channelId").post(jwtVerify, toggleSubscription)
router.route("/channel/:channelId").get(getChannelSubscribers)
router.route("/:userId").get(getSubscribedChannels)
router.route("/channel/:channelId/count").get(getSubscriberCount)
router.route("/subscribed-feed").get(getSubscribedFeed)

