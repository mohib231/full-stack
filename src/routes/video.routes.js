import express, { Router } from "express";
import { upload } from "../middlewares/multer.middlerware.js";
import { auth } from "../middlewares/auth.middleware.js";
import {
  deleteVideoByID,
  getAllVideos,
  getVideoByID,
  postVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controllers.js";

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
router.route("/video").get(getAllVideos);
router
  .route("/video/:videoId")
  .get(getVideoByID)
  .patch(
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
    updateVideo
  )
  .delete(deleteVideoByID);

router.route("/video/publish-status/:videoId").post(togglePublishStatus);

export default router;
