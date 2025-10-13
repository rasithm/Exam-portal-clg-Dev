// models/CategoryMap.js
import mongoose from "mongoose";

const categoryMapSchema = new mongoose.Schema({
  mainCategory: { type: String, required: true },
  subcategories: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
}, { timestamps: true });

export default mongoose.model("CategoryMap", categoryMapSchema);
