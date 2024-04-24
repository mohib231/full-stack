import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorHandler } from "../utils/apiErrorHandler.js";
import { emailValidator, passwordValidator } from "../utils/validator.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponseHandler } from "../utils/apiResponseHandler.js";

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

  res
    .status(201)
    .json(
      new ApiResponseHandler(200, userExist, "user registered successfully")
    );
});

export const loginUser = asyncHandler(async (req, res) => {
  // we will take email and password from the user and we will generate access token
  //if email and password are correct then we will show his data
  const { email, password } = req.body;
  if (email === null || password === null)
    throw new ApiErrorHandler(400, "these field can'\t be null");

  const user = await User.findOne({ email: email });
  if (!user) throw new ApiErrorHandler(404, "user does not exist");

  const isPasswordValid = user.isPasswordCorrect(password);
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

  res
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
  res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json( 
      new ApiResponseHandler(200,'user successfully logout'));
});
