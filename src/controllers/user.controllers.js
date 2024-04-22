import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorHandler } from "../utils/apiErrorHandler.js";
import { emailValidator, passwordValidator } from "../utils/validator.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponseHandler } from "../utils/apiResponseHandler.js";

export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullname, password } = req.body;

  if (
    [username, email, password, fullname].some((field) => field?.trim() === "")
  )
    throw new ApiErrorHandler(400, "field cannot be null");

  if (!emailValidator(email))
    throw new ApiErrorHandler(400, "Please write email in correct form");

  if (!passwordValidator(password))
    return ApiErrorHandler(
      400,
      "Password must contains atleat one lower case character,one upper case and digit as well"
    );

  const existingUser = await User.findOne({
    $or: [{ email: email }, { username: username }],
  });

  if (existingUser) throw new ApiErrorHandler(409, "user already exists");

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

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
    coverImage: coverImage?.url,
  });

  const userExist = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (userExist)
    throw new ApiErrorHandler(
      500,
      "something went wrong while registering user"
    );

  res
    .status(201)
    .json(
      new ApiResponseHandler(200, userExist, "user registered successfully")
    );
});
