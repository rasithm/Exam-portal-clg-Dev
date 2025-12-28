// models/Admin.js
import mongoose from 'mongoose';


const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }, // login email
  password: { type: String, required: true },
  collegeName: String,
  
  collegeTag: String,
  department: String,
  name : String,
  adminPhone_no:String,
  adminWhatsapp_no : String, 

  personalEmail: { type: String, lowercase: true },
  personalEmailVerified: { type: Boolean, default: false },

  profileImage: String
}, { timestamps: true });



export default mongoose.model('Admin', adminSchema);
