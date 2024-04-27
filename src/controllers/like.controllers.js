import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorHandler } from "../utils/apiErrorHandler.js";
import { ApiResponseHandler } from "../utils/apiResponseHandler.js";

export const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId))
    throw new ApiErrorHandler(400, "video id is incorrect");

  const like = await Like.findOne({ video: videoId });
  if (!like) {
    const likedVideo = await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });

    if (!likedVideo) throw new ApiErrorHandler(401, "like not created");
    return res
      .status(200)
      .json(
        new ApiResponseHandler(200, { likedVideo }, "video liked successfully")
      );
  }
  const deleteLike = await Like.findByIdAndDelete(like._id);

  if (!deleteLike) throw new ApiErrorHandler(401, "like not removed");

  return res
    .status(200)
    .json(
      new ApiResponseHandler(200, { deleteLike }, "like deleted successfully")
    );
});

export const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId))
    throw new ApiErrorHandler(401, "comment id is not valid");

  const like = await Like.findOne({ comment: commentId });
  if (!like) {
    const likedComment = await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });

    if (!likedComment) throw new ApiErrorHandler(401, "like not created");
    return res
      .status(200)
      .json(
        new ApiResponseHandler(
          200,
          { likedComment },
          "comment liked successfully"
        )
      );
  }
  const deleteLike = await Like.findByIdAndDelete(like._id);

  if (!deleteLike) throw new ApiErrorHandler(401, "like not removed");

  return res
    .status(200)
    .json(
      new ApiResponseHandler(200, { deleteLike }, "like deleted successfully")
    );
});

export const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId))
    throw new ApiErrorHandler(401, "tweet id is invalid");

  const like = await Like.findOne({ tweet: tweetId });
  if (!like) {
    const likedTweet = await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
    });

    if (!likedTweet) throw new ApiErrorHandler(401, "like not created");
    return res
      .status(200)
      .json(
        new ApiResponseHandler(200, { likedTweet }, "tweet liked successfully")
      );
  }
  const deleteLike = await Like.findByIdAndDelete(like._id);

  if (!deleteLike) throw new ApiErrorHandler(401, "like not removed");

  return res
    .status(200)
    .json(
      new ApiResponseHandler(200, { deleteLike }, "like deleted successfully")
    );
});

export const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.aggregate([
    {
      $match: { likedBy: req.user?._id },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "Liked_video_by_one_user",
      },
    },
  ]);
  if (!likedVideos)
    return res
      .status(200)
      .json(
        new ApiResponseHandler(200, { likedVideos }, "nothing in like section")
      );

  return res
    .status(200)
    .json(
      new ApiResponseHandler(
        200,
        { likedVideos },
        "liked video fetched successfully"
      )
    );
});
