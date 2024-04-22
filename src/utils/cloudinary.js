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

    console.log("file uploaded successfully", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(filePath);
    return null;
  }
};
