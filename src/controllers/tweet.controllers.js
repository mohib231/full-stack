import mongoose, { isValidObjectId } from "mongoose";
import { ApiErrorHandler } from "../utils/apiErrorHandler.js";
import { ApiResponseHandler } from "../utils/apiResponseHandler.js";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) throw new ApiErrorHandler(401, "content is missing");
  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
  });

  if (!tweet) throw new ApiErrorHandler(401, "tweet not created");

  res
    .status(201)
    .json(new ApiResponseHandler(201, { tweet }, "created successfully"));
});

export const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId))
    throw new ApiErrorHandler(401, "tweet id not found");

  const { content } = req.body;

  if(!content.trim()) throw new ApiErrorHandler(400,'content is missing')

  const tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );
  if (!tweet) throw new ApiErrorHandler(401, "tweet not updated successfully");

  res
    .status(200)
    .json(new ApiResponseHandler(200, { tweet }, "tweet updated successfully"));
});

export const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId))
    throw new ApiErrorHandler(401, "tweet id is not found");

  const tweet = await Tweet.findByIdAndDelete(tweetId);
  if (!tweet) throw new ApiErrorHandler(401, "tweet not deleted");

  res
    .status(200)
    .json(new ApiResponseHandler(200, { tweet }, "tweet deleted successfully"));
});

export const getUserTweets = asyncHandler(async (req, res) => {
  const userTweet = await User.aggregate([
    {
      $match: { _id: req.user?._id },
    },
    {
      $lookup: {
        from: "tweets",
        localField: "_id",
        foreignField: "owner",
        as: "userTweets",
      },
    }
  ]);

  if (!userTweet)
    throw new ApiErrorHandler(
      200,
      "not able to fetch user tweet "
    );

    res.status(200).json(new ApiResponseHandler(200,{userTweet},'user tweets fetched successfully'))
});
