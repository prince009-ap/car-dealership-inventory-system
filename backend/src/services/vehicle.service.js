const vehicles = [];
let nextVehicleId = 1;

const createVehicle = async (vehicleData) => {
  const vehicle = {
    _id: `vehicle-${nextVehicleId++}`,
    make: vehicleData.make,
    model: vehicleData.model,
    category: vehicleData.category,
    price: vehicleData.price,
    quantity: vehicleData.quantity
  };

  vehicles.push(vehicle);
  return vehicle;
};

const getVehicles = async () => vehicles;

const updateVehicle = async (vehicleId, updateData) => {
  const vehicle = vehicles.find((item) => item._id === vehicleId);

  if (!vehicle) {
    return {
      _id: vehicleId,
      ...updateData
    };
  }

  Object.assign(vehicle, updateData);
  return vehicle;
};

const deleteVehicle = async (vehicleId) => {
  const index = vehicles.findIndex((item) => item._id === vehicleId);

  if (index === -1) {
    return {
      _id: vehicleId
    };
  }

  const [deletedVehicle] = vehicles.splice(index, 1);
  return deletedVehicle;
};

module.exports = {
  createVehicle,
  deleteVehicle,
  getVehicles,
  updateVehicle
};
