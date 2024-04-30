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
    fs.unlinkSync(filePath);
    return response;
  } catch (error) {
    fs.unlinkSync(filePath);
    return null;
  }
};

export const deleteFromCloudinary = async (fileUrl) => {
  try {
    if (!fileUrl) return null;
    console.log("fileUrl:", fileUrl);
    const regex = /upload\/(?:v\d+\/)?([^\.]+)/;
    const matches = fileUrl.match(regex);
    let publicId;
    if (matches && matches.length > 1) {
      publicId = matches[1];
    }
    console.log("publicId:", publicId);
    const deleteImage = await cloudinary.uploader.destroy(publicId);
    return deleteImage;
  } catch (error) {
    return null;
  }
};
