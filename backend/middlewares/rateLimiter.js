import rateLimit from "express-rate-limit";

export const rateLimiterStrict = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 mins
  max: 5,
  message: { message: "Too many setup attempts, try later." },
});
