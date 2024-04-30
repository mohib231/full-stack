import mongoose, { isValidObjectId, Schema } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiErrorHandler } from "../utils/apiErrorHandler.js";
import { ApiResponseHandler } from "../utils/apiResponseHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId))
    throw new ApiErrorHandler(200, "id is invalid");

  const subscription = await Subscription.findOne({
    channel: new mongoose.Types.ObjectId(channelId),
  });

  if (!subscription) {
    const toggle = await Subscription.create({
      channel: channelId,
    });
    return res
      .status(200)
      .json(new ApiResponseHandler(200, { toggle }, "created successfully"));
  }
  if (req.user?._id === channelId)
    throw new ApiErrorHandler(400, "You can't subscribe yourself");

  if (!subscription.subscriber) subscription.subscriber = req.user._id;
  else subscription.subscriber = null;

  if (
    subscription.subscriber &&
    subscription.subscriber.equals(new mongoose.Types.ObjectId(channelId))
  )
    throw new ApiErrorHandler(400, "you cannot subscribe yourself");
  const toggle = await subscription.save({ validateBeforeSave: true });

  return res
    .status(200)
    .json(new ApiResponseHandler(200, { toggle }, "toggled successfully"));
});

export const getUserChannelSubscriber = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const getSubscriber = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
        subscriber: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$subscriber",
        results: {
          $sum: 1,
        },
      },
    },
  ]);

  if (!getSubscriber.length)
    return res
      .status(200)
      .json(new ApiResponseHandler(200, {}, "nobody subscribe yet"));

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

  const getSubscribedChannel = await Subscription.aggregate([
    {
      $match: { _id: subscriberId },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
      },
    },
  ]);

  if (!getSubscribedChannel.length)
    throw new ApiErrorHandler(401, "subscribed channel not found");

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
