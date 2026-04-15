import { Router } from "express";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylist, removeFromPlaylist, updatePlaylist } from "../controllers/playlist.controller";
import { jwtVerify } from "../middlewares/auth.middleware";

export const router = Router();

Router.route("/:userId").get(getUserPlaylist)
Router.route("/:playlistId").get(getPlaylistById)
Router.route("/").post(jwtVerify, createPlaylist)
Router.route("/:playlistId").patch(jwtVerify, updatePlaylist)
Router.route("/:playlistId/video/:videoId").delete(jwtVerify, removeFromPlaylist)
Router.route("/video/:videoId").post(jwtVerify, addVideoToPlaylist)
Router.route("/:playlistId").delete(jwtVerify, deletePlaylist)