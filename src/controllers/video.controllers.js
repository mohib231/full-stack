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
    Array.isArray(req.files.videoFile) &&
    req.files.videoFile.length > 0
  )
    videoFilePath = req.files.videoFile[0].path;
  let thumbnailPath;
  if (
    req.files &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  )
    thumbnailPath = req.files.thumbnail[0].path;

  const { title, description } = req.body;

  if ([title, description].some((things) => things === null))
    throw new ApiErrorHandler(400, "all these fields are required");

  const CloudinaryVideoFile = await uploadOnCloudinary(videoFilePath);
  const CloudinaryThumbnail = await uploadOnCloudinary(thumbnailPath);

  if (!CloudinaryVideoFile)
    throw new ApiErrorHandler(409, "video is not uploaded on cloudinary");

  if (!CloudinaryVideoFile.duration)
    throw new ApiErrorHandler(400, "please upload video");

  if (!CloudinaryThumbnail)
    throw new ApiErrorHandler(409, "thumbnail is not uploaded on cloudinary");

  const video = await Video.create({
    title,
    description,
    duration: CloudinaryVideoFile.duration,
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

  if (!isValidObjectId(videoId))
    throw new ApiErrorHandler(400, "id is invalid");

  let videoFilePath;
  if (
    req.files &&
    Array.isArray(req.files.videoFile) &&
    req.files.videoFile.length > 0
  )
    videoFilePath = req.files.videoFile[0].path;
  let thumbnailPath;
  if (
    req.files &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  )
    thumbnailPath = req.files.thumbnail[0].path;

  if (!videoFilePath && !thumbnailPath)
    throw new ApiErrorHandler(400, "file is requied");

  let video;
  let thumbnail;
  if (!thumbnailPath) {
    video = await uploadOnCloudinary(videoFilePath);
    if (!video.duration) throw new ApiErrorHandler(400, "please upload video");
    const videoDetails = await Video.findOne({ _id: videoId });
    const oldVideo = videoDetails.videoFile;
    const updateVideoDetail = await Video.findByIdAndUpdate(
      videoDetails._id,
      {
        videoFile: video.url,
      },
      {
        new: true,
      }
    );
    const deleteOldVideo = await deleteFromCloudinary(oldVideo);
    if (!deleteOldVideo)
      throw new ApiErrorHandler(401, "video is not deleted from cloudinary");

    return res
      .status(200)
      .json(
        new ApiResponseHandler(
          200,
          { updateVideoDetail },
          "video updated successfully"
        )
      );
  } else if (!videoFilePath) {
    thumbnail = await uploadOnCloudinary(thumbnailPath);
    const videoDetails = await Video.findById(videoId);
    const oldthumbnail = videoDetails.thumbnail;
    const updateVideoDetail = await Video.findByIdAndUpdate(
      videoDetails._id,
      {
        thumbnail: thumbnail.url,
      },
      {
        new: true,
      }
    );
    const deleteOldThumbnail = await deleteFromCloudinary(oldthumbnail);
    if (!deleteOldThumbnail)
      throw new ApiErrorHandler(
        401,
        "thumbnail is not deleted from cloudinary"
      );

    return res
      .status(200)
      .json(
        new ApiResponseHandler(
          200,
          { updateVideoDetail },
          "video updated successfully"
        )
      );
  } else {
    video = await uploadOnCloudinary(videoFilePath);
    thumbnail = await uploadOnCloudinary(thumbnailPath);
    if (!video.duration) throw new ApiErrorHandler(400, "please upload video");
    const videoDetails = await Video.findOne({ _id: videoId });
    const oldVideo = videoDetails.videoFile;
    const oldthumbnail = videoDetails.thumbnail;

    const updateVideoDetail = await Video.findByIdAndUpdate(
      videoDetails._id,
      {
        videoFile: video.url,
      },
      {
        new: true,
      }
    );
    const deleteOldVideo = await deleteFromCloudinary(oldVideo);
    if (!deleteOldVideo)
      throw new ApiErrorHandler(401, "video is not deleted from cloudinary");

    const deleteOldThumbnail = await deleteFromCloudinary(oldthumbnail);

    if (!deleteOldThumbnail)
      throw new ApiErrorHandler(
        201,
        "thumbnail is not deleted from cloudinary"
      );

    if (!videoDetails)
      throw new ApiErrorHandler(400, "u are not owner of this video");

    return res
      .status(200)
      .json(
        new ApiResponseHandler(
          200,
          { updateVideoDetail },
          "video updated successfully"
        )
      );
  }
});

export const getVideoByID = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId))
    throw new ApiErrorHandler(400, "id is invalid");

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

  if (!isValidObjectId(videoId))
    throw new ApiErrorHandler(400, "id is invalid");

    console.log(videoId)
  const videoDetails = await Video.findById(videoId);

  console.log(videoDetails);
  if (!videoDetails) throw new ApiErrorHandler(400, "video not found");

  const videoToBeDeletedFromCloudinary = videoDetails.videoFile;

  const thumbnailToBeDeletedFromCloudinary = videoDetails.thumbnail;

  const deleteVideo = await Video.findByIdAndDelete(videoDetails._id);

  if (!deleteVideo) throw new ApiErrorHandler(401, "video not deleted");

  const deleteThumbnail = await deleteFromCloudinary(thumbnailToBeDeletedFromCloudinary);

  const deleteVideoFile = await deleteFromCloudinary(videoToBeDeletedFromCloudinary);

  if (!deleteVideoFile)
    throw new ApiErrorHandler(401, "video is not deleted from cloudinary");

  if (!deleteThumbnail)
    throw new ApiErrorHandler(401, "thumbnail is not deleted from cloudinary");

  res.status(200).json(new ApiResponseHandler(200, {}, "deleted successfully"));
});

export const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId))
    throw new ApiErrorHandler(400, "id is invalid");

  const videoDetails = await Video.findById(videoId);

  if (!videoDetails) throw new ApiErrorHandler(404, "video not found");

  if (videoDetails.isPublished === true) videoDetails.isPublished = false;
  else videoDetails.isPublished = true;

  await videoDetails.save({ validateBeforeSave: true });

  res
    .status(200)
    .json(
      new ApiResponseHandler(
        200,
        { publish: videoDetails.isPublished },
        "toggled successfully"
      )
    );
});

export const getAllVideos = asyncHandler(async (req, res) => {
  0;
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  let dbQuery;
  let dbObject = {};

  if (query) {
    dbObject.title = { $regex: query, $options: "i" };
  }

  if (userId) {
    dbObject.owner = userId;
  }

  dbQuery = Video.find(dbObject);

  if (sortBy) {
    const sortDirection = sortType === "desc" ? -1 : 1;
    dbQuery = dbQuery.sort({ [sortBy]: sortDirection });
  }

  dbQuery = dbQuery.skip(skip).limit(parseInt(limit));

  dbQuery = await dbQuery.exec();
  return res
    .status(200)
    .json(new ApiResponseHandler(200, { dbQuery }, "fetched successfulyy"));
});
