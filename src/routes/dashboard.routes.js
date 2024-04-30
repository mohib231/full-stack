import { Router } from "express";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controllers.js";
import {auth} from '../middlewares/auth.middleware.js'
const router = Router();

router.use(auth)
router.route('/').get(getChannelStats)
router.route('/videos').get(getChannelVideos)


export default router;