import { Router } from "express";
import { jwtVerify } from "../middlewares/auth.middleware.js";
import { getContinueWatching, updateProgress } from "../controllers/continue_watching.controller.js";

export const router = Router();

router.route("/").get(jwtVerify, getContinueWatching)
router.route("/progress/:videoId").post(jwtVerify, updateProgress)