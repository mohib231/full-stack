import { v2 as cloudinary } from "cloudinary";
import { cloudinaryCloudName } from "../constants.js";
import fs from "fs";

cloudinary.config({
  cloud_name: cloudinaryCloudName,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (filePath) => {
  try {
    if (!filePath) return null;
    const response = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(filePath)
    return response;
  } catch (error) {
    fs.unlinkSync(filePath);
    return null;
  }
};

export const deleteFromCloudinary = async (filepath)=>{
  try {
    if(!filepath) return null;
    const deleteImage = await cloudinary.uploader.destroy(filepath)
    console.log(deleteImage)
    return deleteImage
  } catch (error) {
    return null;
  }
}
