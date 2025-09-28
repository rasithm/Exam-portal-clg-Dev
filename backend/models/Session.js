// models/Session.js
import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  role: { type: String, enum: ['creator','admin','student'], required: true },
  sessionId: { type: String, required: true, unique: true },
  socketId: { type: String },
  deviceInfo: { type: Object },
  active: { type: Boolean, default: true },
  lastHeartbeat: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Session', sessionSchema);
