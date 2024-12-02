import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  max: 4,
  windowMs: 10000,
});

export default limiter;
