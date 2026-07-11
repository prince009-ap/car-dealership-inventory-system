const express = require("express");
const authRoutes = require("./routes/auth.routes");
const healthRoutes = require("./routes/healthRoutes");
const protectedRoutes = require("./routes/protected.routes");

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", healthRoutes);
app.use("/api", protectedRoutes);

module.exports = app;
