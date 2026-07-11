const jwt = require("jsonwebtoken");

const sendAuthError = (res, statusCode, message) =>
  res.status(statusCode).json({
    success: false,
    message
  });

const extractToken = (authorizationHeader) => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

const authMiddleware = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);

    if (!token) {
      return sendAuthError(res, 401, "Access token is required");
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return sendAuthError(res, 500, "JWT secret is not configured");
    }

    const decoded = jwt.verify(token, jwtSecret);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return sendAuthError(res, 401, "Token expired");
    }

    return sendAuthError(res, 401, "Invalid token");
  }
};

module.exports = authMiddleware;
