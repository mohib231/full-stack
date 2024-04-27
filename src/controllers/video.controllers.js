import { ApiErrorHandler } from "../utils/apiErrorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponseHandler } from "../utils/apiResponseHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { isValidObjectId } from "mongoose";

export const postVideo = asyncHandler(async (req, res) => {
  let videoFilePath;
  if (
    req.files &&
    Array.isArray(req.file.videoFile) &&
    req.file.videoFile.length > 0
  )
    videoFilePath = req.files.videoFile.path;
  let thumbnailPath;
  if (
    req.files &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  )
    thumbnailPath = req.files.thumbnail.path;

  const { title, description } = req.body;

  if ([title, description].some((things) => things === null))
    throw new ApiErrorHandler(400, "all these fields are required");

  const CloudinaryVideoFile = await uploadOnCloudinary(videoFilePath);
  const CloudinaryThumbnail = await uploadOnCloudinary(thumbnailPath);

  if (!CloudinaryVideoFile)
    throw new ApiErrorHandler(409, "video is not uploaded on cloudinary");

  if (!videoFile.duration)
    throw new ApiErrorHandler(400, "please upload video");

  if (!CloudinaryThumbnail)
    throw new ApiErrorHandler(409, "thumbnail is not uploaded on cloudinary");

  const video = await Video.create({
    title,
    description,
    duration: videoFile.duration,
    owner: req.user?._id,
    thumbnail: CloudinaryThumbnail.url,
    videoFile: CloudinaryVideoFile.url,
  });

  res
    .status(201)
    .json(
      new ApiResponseHandler(201, { video }, "video uploaded successfully")
    );
});

export const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  let videoFilePath;
  if (
    req.files &&
    Array.isArray(req.file.videoFile) &&
    req.file.videoFile.length > 0
  )
    videoFilePath = req.files.videoFile.path;
  let thumbnailPath;
  if (
    req.files &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  )
    thumbnailPath = req.files.thumbnail.path;
  if (!videoPathFile) throw new ApiErrorHandler(400, "video is required");

  if (!thumbnailPath) throw new ApiErrorHandler(400, "thumbnail is required");

  const video = uploadOnCloudinary(videoPath);
  const thumbnail = uploadOnCloudinary(thumbnailPath);

  if (!video.duration) throw new ApiErrorHandler(400, "please upload video");

  const videoDetails = await Video.findOne({ _id: videoId });
  if (!videoDetails)
    throw new ApiErrorHandler(400, "u are not owner of this video");

  const oldVideo = videoDetails.videoFile;
  const oldthumbnail = videoDetails.thumbnail;
  const updateVideoDetail = await Video.findByIdAndUpdate(
    videoDetails._id,
    {
      videoFile: video.url,
      thumbnail: thumbnail.url,
    },
    {
      new: true,
    }
  );

  const deleteOldVideo = await deleteFromCloudinary(oldVideo);
  const deleteOldThumbnail = await deleteFromCloudinary(oldthumbnail);

  if (!deleteOldVideo)
    throw new ApiErrorHandler(401, "video is not deleted from cloudinary");

  if (!deleteOldThumbnail)
    throw new ApiErrorHandler(401, "thumbnail is not deleted from cloudinary");

  res
    .status(200)
    .json(
      new ApiResponseHandler(
        200,
        { updateVideoDetail },
        "video updated successfully"
      )
    );
});

export const getVideoByID = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const videoDetails = await Video.findById(videoId);
  if (!videoDetails) throw new ApiErrorHandler(404, "video not found");
  return res
    .status(200)
    .json(
      new ApiResponseHandler(
        200,
        { videoDetails },
        "video successfully fetched"
      )
    );
});

export const deleteVideoByID = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const videoDetails = await Video.findById(videoId);

  if (!videoDetails) throw new ApiErrorHandler(400, "video not found");

  const videoToBeDeletedFromCloudinary = videoDetails.videoFile;

  const deleteVideo = await Video.findByIdAndDelete(videoDetails._id);

  if (!deleteVideo) throw new ApiErrorHandler(401, "video not deleted");

  const deleteFromCloudinary = deleteFromCloudinary(
    videoToBeDeletedFromCloudinary
  );

  if (deleteFromCloudinary)
    throw new ApiErrorHandler(401, "video is not deleted from cloudinary");

  res.status(200).json(new ApiResponseHandler(200, {}, "deleted successfully"));
});

export const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const videoDetails = await Video.findById(videoId);

  if (!videoDetails) throw new ApiErrorHandler(404, "video not found");

  if (videoDetails.publish === true) videoDetails.publish = false;
  else videoDetails.publish = true;

  await videoDetails.save({ validateBeforeSave: true });

  res
    .status(200)
    .json(
      new ApiResponseHandler(
        200,
        { publish: videoDetails.publish },
        "toggled successfully"
      )
    );
});

export const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const skip = parseInt(page) - 1 * parseInt(limit);

  let dbQuery;

  if (query) {
    dbQuery = dbQuery.find({ title: { $regex: query, $options: "i" } });
  }

  if (userId) {
    dbQuery = dbQuery.find({ owner: userId });
  }

  if (sortBy) {
    const sortDirection = sortType === "desc" ? -1 : 1;
    dbQuery = dbQuery.sort({ [sortBy]: sortDirection });
  }

  dbQuery = dbQuery.skip(skip).limit(limit);

  dbQuery.exec((err, results) => {
    if (err) {
      throw new ApiErrorHandler(500, err.message);
    }
    res
      .status(200)
      .json(new ApiResponseHandler(200, { results }, "fetched successfully"));
  });
});
