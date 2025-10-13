import mongoose from 'mongoose';

const TempQuestionFileSchema = new mongoose.Schema({
  fileName: String,
  category: String,
  subCategory: String,
  uploaderEmail: String,
  questionCount: Number,
  extension: { type: String, default: 'xlsx' },
}, { timestamps: true });

export default mongoose.model('TempQuestionFile', TempQuestionFileSchema);
