import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorHandler } from "../utils/apiErrorHandler.js";
import { ApiResponseHandler } from "../utils/apiResponseHandler.js";
import { Playlist } from "../models/playlist.model.js";
import mongoose, { isValidObjectId, mongo } from "mongoose";

export const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) throw new ApiErrorHandler(400, "name is required");

  if (!description) throw new ApiErrorHandler(400, "description is required");

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  if (!playlist) throw new ApiErrorHandler(401, "playlist is not created");

  res
    .status(201)
    .json(new ApiResponseHandler(201, { playlist }, "playlist is created"));
});

export const getUserPlaylist = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) throw new ApiErrorHandler(401, "id is invalid");

  const userPlaylists = await Playlist.find({
    owner: new mongoose.Types.ObjectId(userId),
  });

  if (!userPlaylists.length)
    throw new ApiErrorHandler(404, "playlist not found");
  return res
    .status(200)
    .json(
      new ApiResponseHandler(
        200,
        { userPlaylists },
        "playlist fetched successfully"
      )
    );
});

export const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId))
    throw new ApiErrorHandler(401, "playlist id is invalid");

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) throw new ApiErrorHandler(404, "can't find playlist");

  return res
    .status(200)
    .json(
      new ApiResponseHandler(200, { playlist }, "playlist fetched successfully")
    );
});

export const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) && !isValidObjectId(videoId))
    throw new ApiErrorHandler(400, "id is invalid");

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) throw new ApiErrorHandler(401, "can't  find playlist");

  playlist.videos = videoId;

  const addedVideo = await playlist.save({ validateBeforeSave: true });

  if (!addedVideo)
    throw new ApiErrorHandler(401, "can't able to save playlist");

  return res
    .status(200)
    .json(
      new ApiResponseHandler(200, { addedVideo }, "video added successfully")
    );
});

export const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId) && !isValidObjectId(videoId))
    throw new ApiErrorHandler(400, "id is invalid");

  const playlist = await Playlist.findByIdAndUpdate(
    { _id: playlistId },
    { $pull: { videos: videoId } },
    {
      new: true,
    }
  );

  if (!playlist) throw new ApiErrorHandler(404, "playlist not found");

  return res
    .status(200)
    .json(
      new ApiResponseHandler(200, { playlist }, "video removed successfully")
    );
});

export const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId))
    throw new ApiErrorHandler(400, "playlist not found");

  const playlist = await Playlist.findByIdAndDelete(playlistId);

  if (!playlist) throw new ApiErrorHandler(401, "playlist not deleted");

  return res
    .status(200)
    .json(
      new ApiResponseHandler(200, { playlist }, "playlist deleted successfully")
    );
});

export const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId))
    throw new ApiErrorHandler(400, "is is invalid");

  if (!name && !description)
    throw new ApiErrorHandler(400, "field is required");

  let updatePlaylist;
  if (!name)
    updatePlaylist =await Playlist.findByIdAndUpdate(
      playlistId,
      {
        description: description,
      },
      { new: true }
    );
  else if (!description)
    updatePlaylist =await Playlist.findByIdAndUpdate(
      playlistId,
      {
        name: name,
      },
      { new: true }
    );
  else
    updatePlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        name: name,
        description: description,
      },
      { new: true }
    );

  if (!updatePlaylist)
    throw new ApiErrorHandler(401, "playlist is not created");

  return res
    .status(200)
    .json(
      new ApiResponseHandler(
        200,
        { updatePlaylist },
        "playlist updated successfully"
      )
    );
});
