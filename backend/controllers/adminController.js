// controllers/adminController.js
import Student from '../models/Student.js';
import csv from 'csvtojson';
import fs from 'fs';

export const createStudent = async (req, res) => {
  const { rollNumber, name, password, email, domain } = req.body;
  const hashed = await import('bcrypt').then(m => m.default.hash(password, 10));
  const s = await Student.create({ rollNumber, name, password: hashed, email, domain });
  res.json({ message: 'Student created', id: s._id });
};

export const uploadStudentsCSV = async (req, res) => {
  // multer places file at req.file.path
  if (!req.file) return res.status(400).json({ message: 'CSV required' });
  const path = req.file.path;
  const json = await csv().fromFile(path);
  const created = [];
  for (const row of json) {
    // expect columns: RollNo, Name, Password, Email, Domain
    try {
      const hashed = await import('bcrypt').then(m => m.default.hash(row.Password || 'changeme123', 10));
      const st = await Student.create({
        rollNumber: row.RollNo,
        name: row.Name,
        password: hashed,
        email: row.Email,
        domain: row.Domain || 'Technical'
      });
      created.push(st.rollNumber);
    } catch(e) {
      console.warn('row error', e);
    }
  }
  // remove file
  fs.unlinkSync(path);
  res.json({ message: 'CSV processed', createdCount: created.length, created });
};
