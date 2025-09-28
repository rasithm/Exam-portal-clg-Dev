// config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  if (!process.env.MONGO_URL) throw new Error("MONGO_URL missing");
  await mongoose.connect(process.env.MONGO_URL, { });
  console.log("MongoDB connected");
};

export default connectDB;
