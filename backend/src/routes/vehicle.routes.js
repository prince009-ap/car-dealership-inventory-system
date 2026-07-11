const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const vehicleController = require("../controllers/vehicle.controller");

const router = express.Router();

router.use(authMiddleware);

router.post("/", vehicleController.createVehicle);
router.get("/", vehicleController.getVehicles);
router.put("/:id", vehicleController.updateVehicle);
router.delete("/:id", vehicleController.deleteVehicle);

module.exports = router;
