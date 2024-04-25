import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  changeCurrentPassword,
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
router.route("/changeCurrentPassword").post(auth, changeCurrentPassword);

export default router;
