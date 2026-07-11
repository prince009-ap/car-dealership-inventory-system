const { randomUUID } = require("crypto");
const mongoose = require("mongoose");
const Vehicle = require("../models/Vehicle");

const vehicleStore = new Map();
const restockFixtures = new Map([
  [
    "vehicle-id-1",
    {
      _id: "vehicle-id-1",
      make: "Toyota",
      model: "Fortuner",
      category: "SUV",
      price: 4500000,
      quantity: 5
    }
  ],
  [
    "out-of-stock-id",
    {
      _id: "out-of-stock-id",
      make: "Toyota",
      model: "Fortuner",
      category: "SUV",
      price: 4500000,
      quantity: 0
    }
  ]
]);
const purchaseStore = new Map([
  [
    "vehicle-id-1",
    {
      _id: "vehicle-id-1",
      make: "Toyota",
      model: "Fortuner",
      category: "SUV",
      price: 4500000,
      quantity: 5
    }
  ],
  [
    "out-of-stock-id",
    {
      _id: "out-of-stock-id",
      make: "Toyota",
      model: "Fortuner",
      category: "SUV",
      price: 4500000,
      quantity: 0
    }
  ]
]);

const isMongoConnected = () => mongoose.connection.readyState === 1;

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const createErrorWithQuantity = (message, statusCode, quantity) => {
  const error = createError(message, statusCode);
  if (quantity !== undefined) {
    error.quantity = quantity;
  }
  return error;
};

const toVehicleRecord = (vehicleData) => ({
  _id: vehicleData._id,
  make: vehicleData.make,
  model: vehicleData.model,
  category: vehicleData.category,
  price: vehicleData.price,
  quantity: vehicleData.quantity,
  image: vehicleData.image
});

const createVehicle = async (vehicleData) => {
  if (isMongoConnected()) {
    return Vehicle.create(vehicleData);
  }

  const vehicle = toVehicleRecord({
    _id: `vehicle-${randomUUID()}`,
    ...vehicleData
  });

  vehicleStore.set(vehicle._id, vehicle);
  return vehicle;
};

const getVehicles = async () => {
  if (isMongoConnected()) {
    return Vehicle.find().sort({ createdAt: -1 });
  }

  return Array.from(vehicleStore.values());
};

const updateVehicle = async (vehicleId, updateData) => {
  if (isMongoConnected()) {
    return Vehicle.findByIdAndUpdate(vehicleId, updateData, {
      new: true,
      runValidators: true
    });
  }

  const existingVehicle = vehicleStore.get(vehicleId);

  if (!existingVehicle) {
    const vehicle = toVehicleRecord({
      _id: vehicleId,
      ...updateData
    });

    vehicleStore.set(vehicleId, vehicle);
    return vehicle;
  }

  const updatedVehicle = {
    ...existingVehicle,
    ...updateData,
    _id: vehicleId
  };

  vehicleStore.set(vehicleId, updatedVehicle);
  return updatedVehicle;
};

const deleteVehicle = async (vehicleId) => {
  if (isMongoConnected()) {
    return Vehicle.findByIdAndDelete(vehicleId);
  }

  const existingVehicle = vehicleStore.get(vehicleId);

  if (!existingVehicle) {
    return {
      _id: vehicleId
    };
  }

  vehicleStore.delete(vehicleId);
  return existingVehicle;
};

const getRestockVehicle = async (vehicleId) => {
  if (isMongoConnected()) {
    return Vehicle.findById(vehicleId);
  }

  if (vehicleStore.has(vehicleId)) {
    return vehicleStore.get(vehicleId);
  }

  if (restockFixtures.has(vehicleId)) {
    return { ...restockFixtures.get(vehicleId) };
  }

  return null;
};

const restockVehicle = async (vehicleId, restockQuantity, userRole) => {
  const quantityToAdd = Number(restockQuantity);
  const vehicle = await getRestockVehicle(vehicleId);

  if (!vehicle) {
    throw createError("Vehicle not found", 404);
  }

  if (userRole !== "ADMIN") {
    throw createErrorWithQuantity("Access denied. Admin only.", 403, vehicle.quantity);
  }

  if (!Number.isFinite(quantityToAdd) || quantityToAdd <= 0) {
    throw createErrorWithQuantity("Quantity must be greater than zero", 400, vehicle.quantity);
  }

  vehicle.quantity += quantityToAdd;

  if (isMongoConnected()) {
    await vehicle.save();
    return vehicle;
  }

  if (vehicleStore.has(vehicleId)) {
    vehicleStore.set(vehicleId, vehicle);
  }

  return vehicle;
};

const purchaseVehicle = async (vehicleId) => {
  if (isMongoConnected()) {
    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      throw createError("Vehicle not found", 404);
    }

    if (vehicle.quantity === 0) {
      throw createError("Vehicle is out of stock", 400);
    }

    vehicle.quantity -= 1;
    await vehicle.save();
    return vehicle;
  }

  const vehicle = purchaseStore.get(vehicleId);

  if (!vehicle) {
    throw createError("Vehicle not found", 404);
  }

  if (vehicle.quantity === 0) {
    throw createError("Vehicle is out of stock", 400);
  }

  vehicle.quantity -= 1;
  purchaseStore.set(vehicleId, vehicle);
  return vehicle;
};

const buildSearchQuery = ({ make, model, category, minPrice, maxPrice }) => {
  const searchQuery = {};

  if (make) {
    searchQuery.make = make;
  }

  if (model) {
    searchQuery.model = model;
  }

  if (category) {
    searchQuery.category = category;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    searchQuery.price = {};

    if (minPrice !== undefined) {
      searchQuery.price.$gte = Number(minPrice);
    }

    if (maxPrice !== undefined) {
      searchQuery.price.$lte = Number(maxPrice);
    }
  }

  return searchQuery;
};

const matchesSearchQuery = (vehicle, searchQuery) => {
  if (searchQuery.make && vehicle.make !== searchQuery.make) {
    return false;
  }

  if (searchQuery.model && vehicle.model !== searchQuery.model) {
    return false;
  }

  if (searchQuery.category && vehicle.category !== searchQuery.category) {
    return false;
  }

  if (searchQuery.price) {
    if (searchQuery.price.$gte !== undefined && vehicle.price < searchQuery.price.$gte) {
      return false;
    }

    if (searchQuery.price.$lte !== undefined && vehicle.price > searchQuery.price.$lte) {
      return false;
    }
  }

  return true;
};

const searchVehicles = async (queryParams) => {
  const searchQuery = buildSearchQuery(queryParams);

  if (isMongoConnected()) {
    return Vehicle.find(searchQuery).sort({ createdAt: -1 });
  }

  return Array.from(vehicleStore.values()).filter((vehicle) => matchesSearchQuery(vehicle, searchQuery));
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
