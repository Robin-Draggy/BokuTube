import { Router } from "express";
import { jwtVerify } from "../middlewares/auth.middleware";
import { getContinueWatching, updateProgress } from "../controllers/continue_watching.controller";

const router = Router();

router.route("/").get(jwtVerify, getContinueWatching)
router.route("/progress/:videoId").post(jwtVerify, updateProgress)