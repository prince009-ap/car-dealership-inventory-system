const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (allowedRoles.includes(req.user.role)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied. Admin only."
    ,...(req.body && req.body.quantity !== undefined ? { quantity: req.body.quantity } : {})
  });
};

module.exports = authorizeRoles;
