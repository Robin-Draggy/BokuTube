import { Router } from "express";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getRecommendedVideos,
  getUserPlaylist,
  getWatchLater,
  removeFromPlaylist,
  reorderPlaylist,
  toggleWatchLater,
  updatePlaylist
} from "../controllers/playlist.controller.js";
import { jwtVerify } from "../middlewares/auth.middleware.js";

export const router = Router();

// static
router.route("/create").post(jwtVerify, createPlaylist);
router.route("/recommended").get(getRecommendedVideos);
router.route("/watch-later").get(jwtVerify, getWatchLater);
router.route("/watch-later/:videoId").post(jwtVerify, toggleWatchLater);
router.route("/:playlistId/video/:videoId").post(jwtVerify, addVideoToPlaylist);

// user playlists
router.route("/user/:userId").get(getUserPlaylist);

// playlist specific
router.route("/:playlistId").get(getPlaylistById);
router.route("/:playlistId").patch(jwtVerify, updatePlaylist);
router.route("/:playlistId").delete(jwtVerify, deletePlaylist);

// actions
router.route("/:playlistId/reorder").patch(jwtVerify, reorderPlaylist);
router.route("/:playlistId/video/:videoId").delete(jwtVerify, removeFromPlaylist);