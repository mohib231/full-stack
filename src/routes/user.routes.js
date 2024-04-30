import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  changeCurrentPassword,
  getCurrentUser,
  updateFields,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlerware.js";
import { auth } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/logout").post(auth, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(auth, changeCurrentPassword);
router.route("/current-user").get(auth, getCurrentUser);
router.route("/update-account").patch(auth, updateFields);
router
  .route("/update-avatar")
  .patch(auth, upload.single("avatar"), updateAvatar);
router
  .route("/update-cover-image")
  .patch(auth, upload.single("coverImage"), updateCoverImage);
router.route("/watch-history").get(auth, getUserWatchHistory);
router.route("/channel/:username").get(auth, getUserChannelProfile);

export default router;
