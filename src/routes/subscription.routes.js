import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscriber,
  toggleSubscription,
} from "../controllers/subscription.controllers.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(auth);
router.route("/toggle/:channelId").post(toggleSubscription);
router.route("/get-user-subscriber/:channelId").get(getUserChannelSubscriber);
router.route("/subscribed-channels/:subscriberId").get(getSubscribedChannels);
export default router;
