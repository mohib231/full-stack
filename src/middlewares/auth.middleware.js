import { User } from "../models/user.model.js";
import { ApiErrorHandler } from "../utils/apiErrorHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'


export const auth = asyncHandler(async(req,_,next)=>{
const token = req.cookies?.accessToken || req.Headers('Authorization')?.replace('Bearer ','')
// console.log(token)
if(!token) throw new ApiErrorHandler(401,'can\'t find token')

const jwtVerification = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

if(!jwtVerification)
throw new ApiErrorHandler(401,'unauthorized request')

const user = await User.findById(jwtVerification._id).select('-password -refreshToken');
if(!user) throw new ApiErrorHandler(400,'invalid access token')

req.user = user;
next()
})