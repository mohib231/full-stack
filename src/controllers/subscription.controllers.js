import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiErrorHandler } from "../utils/apiErrorHandler.js";
import { ApiResponseHandler } from "../utils/apiResponseHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId))
    throw new ApiErrorHandler(200, "id is invalid");

  const subscription = await Subscription.find({ channel: channelId });
  if (!subscription) {
    const toggle = await Subscription.findOneAndUpdate(
      subscription._id,
      {
        $unset: { subscriber: "" },
      },
      { new: true }
    );
    return res
      .status(200)
      .json(new ApiResponseHandler(200, { toggle }, "toggled successfully"));
  }

  subscription.subscriber = req.user._id;

  const toggle = await subscription.save({ validateBeforeSave: true });

  return res
    .status(200)
    .json(new ApiResponseHandler(200, { toggle }, "toggled successfully"));
});

export const getUserChannelSubscriber = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const getSubscriber = await Subscription.aggregate([
    {
      $match: { channel: channelId },
    },
    {
      $group: {
        _id: null,
        $sum: "$subscriber",
      },
    },
  ]);
  if (getSubscriber.length === 0)
    throw new ApiErrorHandler(400, "can't able to get subscriber list");

  return res
    .status(200)
    .json(
      new ApiResponseHandler(
        200,
        { getSubscriber },
        "subscriber fetched successfully"
      )
    );
});

export const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId))
    throw new ApiErrorHandler(400, "id is invalid");

  const getSubscribedChannel = await User.aggregate([
    {
      $match: { _id: subscriberId },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "channels",
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponseHandler(
        200,
        { getSubscribedChannel },
        "channels fetched successfully"
      )
    );
});
