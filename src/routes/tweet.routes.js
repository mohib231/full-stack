import { Router } from "express";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controllers.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth)
router.route('/tweet').post(createTweet)
router.route('/user-tweets').get(getUserTweets);
router.route("/tweet/:tweetId").patch(updateTweet);
router.route("/tweet/:tweetId").delete(deleteTweet);




export default router