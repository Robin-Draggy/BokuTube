import { Router } from "express";
import {jwtVerify} from "../middlewares/auth.middleware.js"
import { getChannelSubscribers, getSubscribedChannels, getSubscriberCount, toggleSubscription } from "../controllers/subscriptions.controller";


export const router = Router();

Router.route("/toggle/:channelId").post(jwtVerify, toggleSubscription)
Router.route("/channel/:channelId").get(getChannelSubscribers)
Router.route("/users/:userId").get(getSubscribedChannels)
Router.route("/channel/:channelId/count").get(getSubscriberCount)