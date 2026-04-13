import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccount,
  updateAvatar,
  updateCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { jwtVerify } from "../middlewares/auth.middleware.js";

export const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(loginUser);

// SECURED ROUTES
router.route("/logout").post(jwtVerify, logoutUser);
router.route("/refreshToken").post(refreshAccessToken);
router.route("/change-password").post(jwtVerify, changeCurrentPassword);
router.route("/current-details").get(jwtVerify, getCurrentUser);
router.route("/update-account").patch(jwtVerify, updateAccount);
router
  .route("/update-avatar")
  .patch(jwtVerify, upload.single("avatar"), updateAvatar);
router
  .route("/update-cover-image")
  .patch(jwtVerify, upload.single("coverImage"), updateCoverImage);
router.route("/c/:username").get(jwtVerify, getUserChannelProfile);
router.route("/history").get(jwtVerify, getWatchHistory);
