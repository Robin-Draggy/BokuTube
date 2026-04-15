import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// CREATE PLAYLIST

export const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if(!name){
        throw new ApiError(400, "Playlist name is required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            playlist,
            "Playlist created successfully"
        )
    )
})


// GET USER PLAYLIST

export const getUserPlaylist = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user ID")
    }

    const playlists = await Playlist.find({ owner: userId})
    .populate("videos", "title thumbnail")
    .sort({ createdAt: -1})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlists,
            "Playlist fetched successfully"
        )
    )
})


// GET PLAYLIST BY ID

export const getPlaylistById = asyncHandler(async (req, red) => {
    const { playlistId } = req.params;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)
    .populate("videos")
    .populate("owner", "username avatar")

    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    // privacy enforcement
    if (
        playlist.privacy === "private" &&
        playlist.owner._id.toString() !== req.user?._id?.toString()
    ) {
        throw new ApiError(403, "Private playlist");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Playlist fetched successfully"
        )
    )
})


// ADD VIDEO TO PLAYLIST

export const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid ID's")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    if(playlist.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "Unauthorized")
    }

    if(playlist.videos.includes(videoId)){
        throw new ApiError(400, "Video already in playlist")
    }

    playlist.videos.push(videoId)

    await playlist.save()

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Video added to playlist"
        )
    )
})


// REMOVE A VIDEO FROM PLAYLIST

export const removeFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid ID's")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    if(playlist.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "Unauthorized")
    }

    playlist.videos = playlist.videos.filter((v) => v.toString() != videoId)

    await playlist.save()

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Video removed from playlist"
        )
    )
})


// UPDATE PLAYLIST

export const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID")
    }

    if(!name){
        throw new ApiError(400, "Playlist name is required")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    if(playlist.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "Unauthorized")
    }

    if(name) playlist.name = name
    if(description) playlist.description = description

    await playlist.save()

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Playlist updated successfully"
        )
    )
})


// DELETE PLAYLIST

export const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    if(playlist.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "Unauthorized")
    }

    await playlist.deleteOne()

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Playlist deleted successfully"
        )
    )
})


// RE-ORDER PLAYLIST

export const reorderPlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { orderedVideoIds } = req.body; // array of videoIds

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) throw new ApiError(404, "Playlist not found");

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized");
    }

    const newVideos = orderedVideoIds.map((id) => {
        const existing = playlist.videos.find(
            (v) => v.video.toString() === id
        );

        if (!existing) {
            throw new ApiError(400, "Invalid video in reorder list");
        }

        return existing;
    });

    playlist.videos = newVideos;

    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist reordered")
    );
});


// WATCH LATER

export const toggleWatchLater = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    let playlist = await Playlist.findOne({
        owner: req.user._id,
        isWatchLater: true
    });

    // create if not exists
    if (!playlist) {
        playlist = await Playlist.create({
            name: "Watch Later",
            isWatchLater: true,
            privacy: "private",
            owner: req.user._id
        });
    }

    const exists = playlist.videos.some(
        (v) => v.video.toString() === videoId
    );

    if (exists) {
        playlist.videos = playlist.videos.filter(
            (v) => v.video.toString() !== videoId
        );
    } else {
        playlist.videos.push({ video: videoId });
    }

    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "Watch later updated")
    );
});