import express, { Router } from "express";
import { upload } from "../middlewares/multer.middlerware.js";
import { auth } from "../middlewares/auth.middleware.js";
import { postVideo } from "../controllers/video.controllers.js";

const router = Router();
router.use(auth);
router.route("/upload").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  postVideo
);

export default router;
