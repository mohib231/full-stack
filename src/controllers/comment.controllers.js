import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorHandler } from "../utils/apiErrorHandler.js";
import { ApiResponseHandler } from "../utils/apiResponseHandler.js";
import { Comment } from "../models/comment.model.js";
import mongoose, { isValidObjectId } from "mongoose";

export const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId))
    throw new ApiErrorHandler(400, "video id not found");

  const { content } = req.body;

  if (!content?.trim())
    throw new ApiErrorHandler(400, "please enter your content");

  const comment = await Comment.create({
    content: content?.trim(),
    video: videoId,
    owner: req.user._id,
  });

  if (!comment) throw new ApiErrorHandler(401, "comment not created");

  res
    .status(200)
    .json(
      new ApiResponseHandler(200, { comment }, "comment created successfully")
    );
});

export const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId))
    throw new ApiErrorHandler(400, "comment id not found");

  const { content } = req.body;
  if (!content.trim())
    throw new ApiErrorHandler(400, "please type your content");

  const comment = await Comment.findByIdAndUpdate(commentId, {
    content: content?.trim(),
  });
  if (!comment) throw new ApiErrorHandler(401, "comment not updated");

  res
    .status(200)
    .json(
      new ApiResponseHandler(200, { comment }, "comment updated successfully")
    );
});

export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId))
    throw new ApiErrorHandler(400, "comment id not found");

  const deleteComment = await Comment.findByIdAndDelete(commentId);
  if (!deleteComment) throw new ApiErrorHandler(401, "comment not deleted");

  res.status(200).json(new ApiResponseHandler(200, {}, "deleted successfully"));
});

export const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  console.log(page);
  console.log(limit);
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const VideoComments = await Comment.aggregate([
    {
      $match: { video: videoId },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoComments",
      },
    },
  ])
    .skip(skip)
    .limit(parseInt(limit))
    .exec((err, document) => {
      if (err) throw new ApiErrorHandler(500, err.message);
      return res.status(200).json(new ApiResponseHandler(200,{document},'video comments'))
    });
});
