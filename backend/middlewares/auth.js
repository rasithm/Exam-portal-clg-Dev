// middlewares/auth.js
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Student from '../models/Student.js';

export const getTokenFromRequest = (req) => {
  // prefer cookie then Authorization header
  return req.cookies?.token || (req.headers.authorization?.split(' ')[1]);
};

export const protect = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const token = getTokenFromRequest(req);
      if (!token) return res.status(401).json({ message: 'Not authorized' });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // attach user
      if (decoded.role === 'admin') {
        req.user = await Admin.findById(decoded.id).select('-password');
      } else if (decoded.role === 'student') {
        req.user = await Student.findById(decoded.id).select('-password');
      } else if (decoded.role === 'creator') {
          req.user = { role: 'creator', email: decoded.email };
      }else {
        return res.status(403).json({ message: 'Invalid role' });
      }
      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      req.tokenPayload = decoded;
      next();
    } catch (err) {
      console.error(err);
      return res.status(401).json({ message: 'Token invalid or expired' });
    }
  };
};
