import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorHandler } from "../utils/apiErrorHandler.js";
import { emailValidator, passwordValidator } from "../utils/validator.js";
import { User } from "../models/user.model.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponseHandler } from "../utils/apiResponseHandler.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateRefreshAndAccessToken = async function (userId) {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
    throw new ApiErrorHandler(500, "something went wrong", null, error);
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullname, password } = req.body;

  if (
    [username, email, password, fullname].some((field) => field?.trim() === "")
  )
    throw new ApiErrorHandler(400, "field cannot be null");

  if (!emailValidator(email))
    throw new ApiErrorHandler(400, "Please write email in correct form");

  if (!passwordValidator(password))
    throw new ApiErrorHandler(
      400,
      "Password must contains atleat one lower case character,one upper case and digit as well"
    );

  const existingUser = await User.findOne({
    $or: [{ email: email }, { username: username }],
  });

  if (existingUser) throw new ApiErrorHandler(409, "user already exists");

  let avatarLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  )
    avatarLocalPath = req.files?.avatar[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  )
    coverImageLocalPath = req.files.coverImage[0].path;

  if (!avatarLocalPath) throw new ApiErrorHandler(400, "avatar is required");

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) throw new ApiErrorHandler(400, "avatar is required");

  const user = await User.create({
    fullname,
    password,
    email,
    username,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const userExist = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!userExist)
    throw new ApiErrorHandler(
      500,
      "something went wrong while registering user"
    );

  return res
    .status(201)
    .json(
      new ApiResponseHandler(200, userExist, "user registered successfully")
    );
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    throw new ApiErrorHandler(400, "these field can'\t be null");

  const user = await User.findOne({ email: email });
  if (!user) throw new ApiErrorHandler(404, "user does not exist");

  const isPasswordValid = await user.isPasswordCorrect(password);
  console.log(isPasswordValid);
  if (!isPasswordValid) throw new ApiErrorHandler(400, "password is incorrect");

  const { refreshToken, accessToken } = await generateRefreshAndAccessToken(
    user._id
  );

  const isUserLoggedIn = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponseHandler(
        200,
        {
          user: isUserLoggedIn,
          refreshToken: refreshToken,
          accessToken: accessToken,
        },
        "User logged In"
      )
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  const { user } = req;
  await User.findByIdAndUpdate(
    user._id,
    { refreshToken: undefined },
    { new: true }
  );

  const option = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponseHandler(200, "user successfully logout"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRequestToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRequestToken) throw new ApiErrorHandler(401, "unauthorized");

  const encodedToken = jwt.verify(
    incomingRequestToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  if (!encodedToken) throw new ApiErrorHandler(401, "token is not verified");

  const user = await User.findById(encodedToken._id);

  if (!user) throw new ApiErrorHandler(401, "token is invalid");

  if (incomingRequestToken !== user.refreshToken)
    throw new ApiErrorHandler(401, "unauthorized token");

  const option = {
    httpOnly: true,
    secure: true,
  };
  const { refreshToken, accessToken } = await generateRefreshAndAccessToken(
    user._id
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponseHandler(
        200,
        { accessToken: accessToken, refreshToken: refreshToken },
        "sent successfully"
      )
    );
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (newPassword !== confirmPassword)
    throw new ApiErrorHandler(409, "password do not match");

  const user = await User.findById(req.user?._id);

  if (!user) throw new ApiErrorHandler(401, "you are not logged in");
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  

  if (!isPasswordValid) throw new ApiErrorHandler(409, "password is not valid");

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponseHandler(200, {}, "user logged in"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponseHandler(200, { user: req.user }));
});

export const updateFields = asyncHandler(async (req, res) => {
  const { username, email, fullname, password } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) throw new ApiErrorHandler(409, "password is not valid");

  await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        username: username ?? req.user.username,
        email: email ?? req.user.email,
        fullname: fullname ?? req.user.fullname,
      },
    },
    { new: true }
  ).select("-password");

  user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponseHandler(200, {}, "fields are updated successfully"));
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const avatarPath = req.file?.path;
  if (!avatarPath) throw new ApiErrorHandler(200, "avatar is missing");

  const avatar = await uploadOnCloudinary(avatarPath);
  if (!avatar?.url)
    throw new ApiErrorHandler(
      401,
      "avatar not successfully uploaded on cloudinary"
    );

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  );

  await user.save({ validateBeforeSave: false });

  if (!user) throw new ApiErrorHandler(401, "unauthorized");

  const deleteOldAvatar = await deleteFromCloudinary(req.user?.avatar);

  if (!deleteOldAvatar)
    throw new ApiErrorHandler(409, "old avatar is not deleted");

  return res
    .status(200)
    .json(
      new ApiResponseHandler(
        200,
        { avatar: user.avatar },
        "image updated successfully"
      )
    );
});

export const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImagePath = req.file?.path;
  if (!coverImagePath) throw new ApiErrorHandler(400, "cover image in missing");
  const coverImage = await uploadOnCloudinary(coverImagePath);

  if (!coverImage?.url)
    throw new ApiErrorHandler(401, "image not uploaded on cloudinary");

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  if (!user) throw new ApiErrorHandler(409, "user not logged in");

  // await user.save({ validateBeforeSave: false });

  const deleteOldCoverImage = await deleteFromCloudinary(req.user?.avatar);

  if (!deleteOldCoverImage)
    throw new ApiErrorHandler(409, "old cover image is not deleted");

  return res
    .status(200)
    .json(
      new ApiResponseHandler(
        200,
        { user: user },
        "cover Image updated successfully"
      )
    );
});

export const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) throw new ApiErrorHandler(400, "username is missing");

  const channel = await User.aggregate([
    {
      $match: { username: username?.toLowerCase() },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subcribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscriberCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length)
    throw new ApiErrorHandler(404, "channel does not exist");

  console.log(channel);
  res
    .status(200)
    .json(
      new ApiResponseHandler(200, channel[0], "channel fetched succesfully")
    );
});

export const getUserWatchHistory = asyncHandler(async (req, res) => {
  const userID = req.user?._id;

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userID),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    owner: 1,
                    fullname: 1,
                    avatar: 1,
                    coverImagw: 1,
                    email: 1,
                    username: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  if (!user?.length)
    throw new ApiErrorHandler(404, "nothing in history");

  res
    .status(200)
    .json(
      new ApiResponseHandler(
        200,
        { watchHistory: user[0].watchHistory },
        "watch history fetched successfully"
      )
    );
});
