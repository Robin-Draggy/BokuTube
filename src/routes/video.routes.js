import { Router } from "express";
import { jwtVerify } from "../middlewares/auth.middleware.js";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  updateVideo,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

export const router = Router();

router.route("/getAllVideos").get(getAllVideos);
router.route("/publishVideo").post(
  jwtVerify,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishAVideo
);
router.route("/:videoId").get(getVideoById);
router
  .route("/:videoId")
  .patch(jwtVerify, upload.single("thumbnail"), updateVideo);
router.route("/:videoId").delete(jwtVerify, deleteVideo);
