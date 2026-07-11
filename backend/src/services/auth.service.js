const bcrypt = require("bcryptjs");
const User = require("../models/User");

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const registerUser = async ({ name, email, password }) => {
  if (!name || !name.trim()) {
    throw createError("Name is required", 400);
  }

  if (!email || !email.trim()) {
    throw createError("Email is required", 400);
  }

  if (!password) {
    throw createError("Password is required", 400);
  }

  if (password.length < 6) {
    throw createError("Password must be at least 6 characters long", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
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

module.exports = {
  registerUser
};
