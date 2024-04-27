import { Router } from "express";
import { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controllers.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth)
router.route('/toggle/video/:videoId').post(toggleVideoLike)
router.route('/toggle/comment/:commentId').post(toggleCommentLike)
router.route('/toggle/tweet/:tweetId').post(toggleTweetLike)
router.route('/videos').get(getLikedVideos)


export default router;