import { Router } from "express";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylist, removeFromPlaylist, reorderPlaylist, toggleWatchLater, updatePlaylist } from "../controllers/playlist.controller";
import { jwtVerify } from "../middlewares/auth.middleware";

export const router = Router();

Router.route("/:userId").get(getUserPlaylist)
Router.route("/:playlistId").get(getPlaylistById)

Router.route("/").post(jwtVerify, createPlaylist)
Router.route("/video/:videoId").post(jwtVerify, addVideoToPlaylist)
Router.route("/watch-later/:videoId").post(jwtVerify, toggleWatchLater)

Router.route("/:playlistId").patch(jwtVerify, updatePlaylist)
Router.route("/:playlistId/reorder").patch(jwtVerify, reorderPlaylist)

Router.route("/:playlistId/video/:videoId").delete(jwtVerify, removeFromPlaylist)
Router.route("/:playlistId").delete(jwtVerify, deletePlaylist)