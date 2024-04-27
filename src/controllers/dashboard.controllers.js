import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorHandler } from "../utils/apiErrorHandler.js";
import { ApiResponseHandler } from "../utils/apiResponseHandler.js";
import { Like } from "../models/like.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Video } from "../models/video.model.js";

export const getChannelStats = asyncHandler(async (req, res) => {
  const getTotalViews = await Video.aggregate([
    {
      $match: { owner: req.user?._id },
    },
    {
      $group: { _id: null, totalViews: { $sum: "$views" } },
    },
  ]);

  const getTotalSubscriber = await Subscription.countDocuments({
    channel: req.user._id,
  });

  const getTotalVideos = await Video.countDocuments({ owner: req.user._id });

  const getTotalLikes = await Like.aggregate([
    {
      $match: { video: { $in: req.user._id } },
    },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: 1 },
      },
    },
  ]);

  const channelStats = {
    totalViews: getTotalViews.length > 0 ? getTotalViews[0].totalViews : 0,
    getTotalSubscriber,
    getTotalVideos,
    totalLikes: getTotalLikes.length > 0 ? getTotalLikes[0].totalLikes : 0,
  };

  return res
    .status(200)
    .json(
      new ApiResponseHandler(
        200,
        { channelStats },
        "channel fetched successfully"
      )
    );
});

export const getChannelVideos = asyncHandler((async (req, res) => {
    const channelVideos = await Video.find({ owner: req.user._id });
    if (!channelVideos)
      throw new ApiErrorHandler(404, "channel videos not found");
    return res
      .status(200)
      .json(
        new ApiResponseHandler(
          200,
          { channelVideos },
          "channel videos fetched successfully"
        )
      );
  })
);
