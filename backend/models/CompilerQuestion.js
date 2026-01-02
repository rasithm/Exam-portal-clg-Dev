// models/CompilerQuestion.js
import mongoose from 'mongoose';


const TestCaseSchema = new mongoose.Schema({
inputs: [String],
expectedOutput: { type: String, required: true },
hidden: { type: Boolean, default: false }
});

const CompilerQuestionSchema = new mongoose.Schema({
exam: { type: mongoose.Schema.Types.ObjectId, ref: 'CompilerExam', required: true },
title: { type: String, required: true },
shortDescription: { type: String },
longDescription: { type: String },
inputFormat: { type: String },
outputFormat: { type: String },
sampleInput: { type: String },
sampleOutput: { type: String },
testCases: [TestCaseSchema],
evaluationMode: { type: String, enum: ['strict', 'non-strict'], default: 'strict' },
matchType: { type: String, enum: ['exact', 'contains'], default: 'exact' },
marks: { type: Number, default: 0 },
attemptLimit: { type: Number, default: 1 },
timeLimit: { type: Number, default: 3000 }, // in ms
memoryLimit: { type: Number, default: 256 }, // in MB
createdAt: { type: Date, default: Date.now }
});


export default mongoose.model('CompilerQuestion', CompilerQuestionSchema);