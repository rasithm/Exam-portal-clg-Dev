//C:\Users\nazeer\Desktop\Exam-edit\Exam-portal\Exam-Portal\backend\middlewares\upload.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "examportal/profiles",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

export const uploadProfile = multer({ storage });
