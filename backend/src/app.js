require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/auth.routes");
const healthRoutes = require("./routes/healthRoutes");
const protectedRoutes = require("./routes/protected.routes");
const vehicleRoutes = require("./routes/vehicle.routes");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175","https://car-dealership-inventory-system-chi.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", healthRoutes);
app.use("/api", protectedRoutes);
app.use("/api/vehicles", vehicleRoutes);

module.exports = app;
