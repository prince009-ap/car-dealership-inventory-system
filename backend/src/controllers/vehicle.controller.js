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

const searchVehicles = async (req, res) => {
  const vehicles = await vehicleService.searchVehicles(req.query);

  return res.status(200).json(vehicles);
};

const purchaseVehicle = async (req, res) => {
  try {
    const vehicle = await vehicleService.purchaseVehicle(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Vehicle purchased successfully",
      quantity: vehicle.quantity,
      vehicle
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
      ...(error.statusCode === 400 && error.message === "Vehicle is out of stock"
        ? { quantity: 0 }
        : {})
    });
  }
};

const restockVehicle = async (req, res) => {
  try {
    const vehicle = await vehicleService.restockVehicle(req.params.id, req.body.quantity, req.user.role);

    return res.status(200).json({
      success: true,
      message: "Vehicle restocked successfully",
      quantity: vehicle.quantity,
      vehicle
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
      ...(error.quantity !== undefined ? { quantity: error.quantity } : {})
    });
  }
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
  purchaseVehicle,
  restockVehicle,
  searchVehicles,
  updateVehicle
};
