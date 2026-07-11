const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/authorizeRoles");
const vehicleController = require("../controllers/vehicle.controller");

const uploadDir = path.join(__dirname, "../../public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

const router = express.Router();

router.use(authMiddleware);

router.post("/upload", authorizeRoles("ADMIN"), upload.single("image"), vehicleController.uploadImage);
router.post("/", vehicleController.createVehicle);
router.post("/:id/purchase", vehicleController.purchaseVehicle);
router.post("/:id/restock", authorizeRoles("ADMIN"), vehicleController.restockVehicle);
router.get("/search", vehicleController.searchVehicles);
router.get("/", vehicleController.getVehicles);
router.put("/:id", vehicleController.updateVehicle);
router.delete("/:id", authorizeRoles("ADMIN"), vehicleController.deleteVehicle);

module.exports = router;
