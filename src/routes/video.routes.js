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
import { countLike, toggleLike } from "../controllers/likes.controller.js";
import { addComment, deleteComment, getComments, getReplies, toggleCommentLike, updateComment } from "../controllers/comment.controller.js";

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


// likes
router.route("/:videoId").get(jwtVerify, toggleLike);
router.route("/:videoId").get(countLike)

// comments
router.route("/video/:videoId").post(jwtVerify, addComment);
router.route("/video/:videoId").get(getComments);
router.route("/:commentId").patch(jwtVerify, updateComment);
router.route("/:commentId").delete(jwtVerify, deleteComment);
router.route("/like/:commentId").post(jwtVerify, toggleCommentLike);
router.route("/replies/:commentId").get(getReplies);