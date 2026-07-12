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
  console.log("updateVehicle - request payload params:", req.params);
  console.log("updateVehicle - req.body:", req.body);
  console.log("updateVehicle - req.file:", req.file);

  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.imageUrl = req.file.path;
      updateData.imagePublicId = req.file.filename;
    }
    const vehicle = await vehicleService.updateVehicle(req.params.id, updateData);

    console.log("updateVehicle - MongoDB update result:", vehicle);

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
  } catch (error) {
    console.error("updateVehicle - Error during vehicle update:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
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

const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please upload an image file"
    });
  }

  return res.status(200).json({
    success: true,
    message: "Image uploaded successfully",
    url: req.file.path,
    publicId: req.file.filename
  });
};

module.exports = {
  createVehicle,
  deleteVehicle,
  getVehicles,
  purchaseVehicle,
  restockVehicle,
  searchVehicles,
  updateVehicle,
  uploadImage
};
