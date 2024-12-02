import jwt from "jsonwebtoken";
import { config } from "dotenv";

config();

const verifyToken = async (req, res, next) => {
  const token =
    req.body.token || req.query.token || req.headers["x-access-token"];

  if (!token || token === "null" || token === "undefined" || token === false) {
    return res.status(401).json({
      success: false,
      message: "A token is required for authentication",
    });
  }

  try {
    const decode = await jwt.verify(token, process.env.SECRET_KEY);
    req.user = decode;
    console.log(decode);
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired",
      });
    }
    return res.status(401).json({
      success: false,
      message: "invalid token",
    });
  }
};

export default verifyToken;
