const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const healthRoutes = require("./routes/healthRoutes");
const protectedRoutes = require("./routes/protected.routes");
const vehicleRoutes = require("./routes/vehicle.routes");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
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
