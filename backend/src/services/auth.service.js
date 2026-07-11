const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const sanitizeUser = (user) => ({
  id: user._id?.toString?.() || String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const normalizeEmail = (email) => email.trim().toLowerCase();

const getJwtSecret = () => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw createError("JWT_SECRET is not configured", 500);
  }

  return jwtSecret;
};

const validateName = (name) => {
  if (!name || !name.trim()) {
    throw createError("Name is required", 400);
  }
};

const validateEmail = (email) => {
  if (!email || !email.trim()) {
    throw createError("Email is required", 400);
  }
};

const validatePassword = (password) => {
  if (!password) {
    throw createError("Password is required", 400);
  }

  if (password.length < 6) {
    throw createError("Password must be at least 6 characters long", 400);
  }
};

const registerUser = async ({ name, email, password }) => {
  validateName(name);
  validateEmail(email);
  validatePassword(password);

  const normalizedEmail = normalizeEmail(email);
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw createError("Email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword
  });

  return sanitizeUser(user);
};

const loginUser = async ({ email, password }) => {
  validateEmail(email);
  validatePassword(password);

  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw createError("User not found", 404);
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw createError("Invalid credentials", 401);
  }

  const token = jwt.sign(
    {
      userId: user._id?.toString?.() || String(user._id),
      email: user.email,
      role: user.role
    },
    getJwtSecret(),
    { expiresIn: "1d" }
  );

  return {
    message: "Login successful",
    token,
    user: sanitizeUser(user)
  };
};

module.exports = {
  loginUser,
  registerUser
};
