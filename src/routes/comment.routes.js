import { Router } from "express";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controllers.js";
import {auth} from '../middlewares/auth.middleware.js'
const router = Router();

router.use(auth)
router.route('/:videoId').post(addComment).get(getVideoComments)
router.route('/:commentId').patch(updateComment).delete(deleteComment)

export default router;