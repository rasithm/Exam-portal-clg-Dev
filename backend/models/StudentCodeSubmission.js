// models/StudentCodeSubmission.js
import mongoose from 'mongoose';


const StudentCodeSubmissionSchema = new mongoose.Schema({
studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
examId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompilerExam' },
questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompilerQuestion' },
language: { type: String },
code: { type: String },
results: [
{
inputs: [String],
expectedOutput: String,
actualOutput: String,
passed: Boolean
}
],
score: Number,
submittedAt: { type: Date, default: Date.now },
status: { type: String, enum: ['passed', 'failed', 'partial'], default: 'failed' }
});

StudentCodeSubmissionSchema.index({ submittedAt: 1 }, { expireAfterSeconds: 2592000 });


export default mongoose.model('StudentCodeSubmission', StudentCodeSubmissionSchema);