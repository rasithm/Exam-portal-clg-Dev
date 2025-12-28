//C:\Users\nazeer\Desktop\Exam-edit\Exam-portal\Exam-Portal\backend\middlewares\requireVerifiedAdmin.js
export const requireVerifiedAdmin = (req, res, next) => {
  if (!req.user.personalEmailVerified) {
    return res.status(403).json({ message: "Verify personal email first" });
  }
  next();
};
