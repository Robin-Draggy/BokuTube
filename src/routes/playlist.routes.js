import { Router } from "express";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getRecommendedVideos, getUserPlaylist, removeFromPlaylist, reorderPlaylist, toggleWatchLater, updatePlaylist } from "../controllers/playlist.controller";
import { jwtVerify } from "../middlewares/auth.middleware";

export const router = Router();

router.route("/:userId").get(getUserPlaylist)
router.route("/:playlistId").get(getPlaylistById)
router.route("/recommended").get(getRecommendedVideos)

router.route("/").post(jwtVerify, createPlaylist)
router.route("/video/:videoId").post(jwtVerify, addVideoToPlaylist)
router.route("/watch-later/:videoId").post(jwtVerify, toggleWatchLater)

router.route("/:playlistId").patch(jwtVerify, updatePlaylist)
router.route("/:playlistId/reorder").patch(jwtVerify, reorderPlaylist)

router.route("/:playlistId/video/:videoId").delete(jwtVerify, removeFromPlaylist)
router.route("/:playlistId").delete(jwtVerify, deletePlaylist)