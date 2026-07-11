const vehicleService = require("../services/vehicle.service");

const createVehicle = async (req, res) => {
  const vehicle = await vehicleService.createVehicle(req.body);

  return res.status(201).json({
    success: true,
    message: "Vehicle created successfully",
    vehicle
  });
};

const getVehicles = async (req, res) => {
  const vehicles = await vehicleService.getVehicles();

  return res.status(200).json({
    success: true,
    vehicles
  });
};

const updateVehicle = async (req, res) => {
  const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);

  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: "Vehicle not found"
    });
  }

  return res.status(200).json({
    success: true,
    message: "Vehicle updated successfully",
    vehicle
  });
};

const deleteVehicle = async (req, res) => {
  const vehicle = await vehicleService.deleteVehicle(req.params.id);

  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: "Vehicle not found"
    });
  }

  return res.status(200).json({
    success: true,
    message: "Vehicle deleted successfully"
  });
};

module.exports = {
  createVehicle,
  deleteVehicle,
  getVehicles,
  updateVehicle
};
