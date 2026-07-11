const express = require("express");
const authRoutes = require("./routes/auth.routes");
const healthRoutes = require("./routes/healthRoutes");

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", healthRoutes);

module.exports = app;
