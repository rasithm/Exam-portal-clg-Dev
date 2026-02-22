// middlewares/developerAuth.js
import jwt from "jsonwebtoken";
import Developer from "../models/Developer.js";

export const developerProtect = async (req, res, next) => {
  try {
    const token =
      req.cookies?.developerToken ||
      req.headers.authorization?.split(" ")[1];

    if (!token)
      return res.status(401).json({ message: "Not authorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "developer")
      return res.status(403).json({ message: "Forbidden" });

    const dev = await Developer.findById(decoded.id).select("-password");
    if (!dev)
      return res.status(404).json({ message: "Developer not found" });

    req.developer = dev;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};