import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  try {
    //GET TOKEN FROM HEADER
    const token = req.header("Authorization")?.replace("Bearer", "");
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No authentication token, access denied",
      });
    }
    //VERIFY TOKEN
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //ADD USER INFO TO REQUEST
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: "Token is not valid",
    });
  }
};

export default authMiddleware;
