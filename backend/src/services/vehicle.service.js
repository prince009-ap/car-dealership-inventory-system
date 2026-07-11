const { randomUUID } = require("crypto");
const mongoose = require("mongoose");
const Vehicle = require("../models/Vehicle");

const vehicleStore = new Map();

const isMongoConnected = () => mongoose.connection.readyState === 1;

const toVehicleRecord = (vehicleData) => ({
  _id: vehicleData._id,
  make: vehicleData.make,
  model: vehicleData.model,
  category: vehicleData.category,
  price: vehicleData.price,
  quantity: vehicleData.quantity
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
  searchVehicles,
  updateVehicle
};
