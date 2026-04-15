import { Router } from "express";
import { jwtVerify } from "../middlewares/auth.middleware";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  updateVideo,
} from "../controllers/video.controller";

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
router.route("/getVideoByID").get(getVideoById);
router
  .route("/updateVideo")
  .patch(jwtVerify, upload.single("thumbnail"), updateVideo);
router.route("/deleteVideo").delete(jwtVerify, deleteVideo);
