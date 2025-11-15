// backend/controllers/studentProfileController.js
import Student from "../models/Student.js";
import bcrypt from "bcrypt";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10}$/;

export const getProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user._id).select("-password -__v");
    if (!student) return res.status(404).json({ message: "Student not found" });
    return res.json(student);
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user._id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const {
      name,
      email,
      phone_no,
      whatsapp_no,
      dateOfBirth,
      collegeName,
      academicYear, 
      year
    } = req.body;

    // ✅ Required field validation
    if (
      !name ||
      !email ||
      !phone_no ||
      !whatsapp_no ||
      !dateOfBirth ||
      !collegeName ||
      !academicYear || 
      !year
    ) {
      return res.status(400).json({
        message:
          "All fields (name, email, phone_no, whatsapp_no, dateOfBirth, collegeName, academicYear) are required",
      });
    }

    if (!emailRegex.test(email))
      return res.status(400).json({ message: "Invalid email format" });

    if (!phoneRegex.test(phone_no))
      return res.status(400).json({ message: "Phone number must be 10 digits" });

    if (!phoneRegex.test(whatsapp_no))
      return res.status(400).json({ message: "WhatsApp number must be 10 digits" });

    // ✅ Update allowed fields
    student.name = name.trim();
    student.email = email.trim();
    student.phone_no = phone_no.trim();
    student.whatsapp_no = whatsapp_no.trim();
    student.dateOfBirth = dateOfBirth.trim();
    student.collegeName = collegeName.trim();
    student.academicYear = academicYear.trim();
    student.year = year.trim();

    student.isProfileUpdated = true;

    // ✅ Handle Cloudinary upload
    if (req.file) {
      const fileUrl =
        req.file.path ||
        req.file.url ||
        req.file.secure_url ||
        req.file.filename;
      if (fileUrl) student.profileImage = fileUrl;
    }else {
      // If no image uploaded, do NOT mark updated
      if (!student.profileImage) {
        return res.status(400).json({ message: "Profile image is required" });
      } 
    }

    await student.save();

    const updated = await Student.findById(req.user._id).select("-password -__v");
    return res.json({
      message: "Profile updated successfully",
      student: updated,
    });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res
        .status(400)
        .json({ message: "Both current and new password are required" });

    // ✅ Strong password validation
    if (
      newPassword.length < 8 ||
      !/[a-z]/.test(newPassword) ||
      !/\d/.test(newPassword)
    ) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and include lowercase and number",
      });
    }

    const student = await Student.findById(req.user._id).select("+password");
    if (!student)
      return res.status(404).json({ message: "Student not found" });

    const isMatch = await bcrypt.compare(currentPassword, student.password);
    if (!isMatch)
      return res.status(400).json({ message: "Current password is incorrect" });

    student.password = await bcrypt.hash(newPassword, 10);
    await student.save();

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("updatePassword error:", err);
    return res.status(500).json({ message: "Failed to change password" });
  }
};

