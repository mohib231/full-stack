import { Router } from "express";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylist,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controllers.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(auth);
router.route("/create").post(createPlaylist);
router.route("/user/:userId").get(getUserPlaylist);
router.route("/:playlistId").get(getPlaylistById).patch(updatePlaylist).delete(deletePlaylist);
router
  .route("/:playlistId/video/:videoId")
  .post(addVideoToPlaylist)
  .patch(removeVideoFromPlaylist);

export default router;
