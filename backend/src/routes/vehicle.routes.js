const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/authorizeRoles");
const vehicleController = require("../controllers/vehicle.controller");

const router = express.Router();

router.use(authMiddleware);

router.post("/", vehicleController.createVehicle);
router.post("/:id/purchase", vehicleController.purchaseVehicle);
router.post("/:id/restock", authorizeRoles("ADMIN"), vehicleController.restockVehicle);
router.get("/search", vehicleController.searchVehicles);
router.get("/", vehicleController.getVehicles);
router.put("/:id", vehicleController.updateVehicle);
router.delete("/:id", authorizeRoles("ADMIN"), vehicleController.deleteVehicle);

module.exports = router;
