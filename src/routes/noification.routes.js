import { Router } from "express";
import { jwtVerify } from "../middlewares/auth.middleware.js";

import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from "../controllers/notification.controller.js";

export const router = Router();

router.route("/").get(jwtVerify, getNotifications);
router.route("/:notificationId").patch(jwtVerify, markAsRead);
router.route("/mark-all").patch(jwtVerify, markAllAsRead);
router.route("/:notificationId").delete(jwtVerify, deleteNotification);