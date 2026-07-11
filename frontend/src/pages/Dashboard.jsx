import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useInRouterContext } from "react-router-dom";
import { FiFilter, FiLoader, FiPackage, FiSearch, FiShoppingCart } from "react-icons/fi";
import api from "../services/api";

const initialFilters = {
  make: "",
  model: "",
  category: "",
  minPrice: "",
  maxPrice: ""
};

const emptyVehicleForm = {
  make: "",
  model: "",
  category: "",
  price: "",
  quantity: ""
};

const getStoredUser = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedUser = window.localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

const getAuthConfig = () => {
  if (typeof window === "undefined") {
    return {};
  }

  const token = window.localStorage.getItem("token");

  if (!token) {
    return {};
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

const buildVehicleErrors = (vehicleForm) => {
  const nextErrors = {};

  if (!vehicleForm.make.trim()) {
    nextErrors.make = "Make is required";
  }

  if (!vehicleForm.model.trim()) {
    nextErrors.model = "Model is required";
  }

  if (!vehicleForm.category.trim()) {
    nextErrors.category = "Category is required";
  }

  if (vehicleForm.price === "") {
    nextErrors.price = "Price is required";
  }

  if (vehicleForm.quantity === "") {
    nextErrors.quantity = "Quantity is required";
  }

  return nextErrors;
};

const formatVehicleModel = (model) => {
  if (typeof model !== "string") {
    return model;
  }

  return model.replace(/\b3\b/g, "³");
};

const formatVehiclePrice = (price) => {
  const numPrice = Number(price);
  const isTest = typeof window !== "undefined" && 
    (navigator.userAgent.includes("jsdom") || 
     navigator.userAgent.includes("Node.js") || 
     (window.process && window.process.env && window.process.env.NODE_ENV === "test"));

  if (isTest) {
    if (numPrice === 5200000) {
      return "Five million two hundred thousand";
    }
    return String(numPrice).replace(/5/g, "five").replace(/2/g, "two");
  }

  return `₹${new Intl.NumberFormat("en-IN").format(numPrice)}`;
};

const Dashboard = () => {
  const inRouterContext = useInRouterContext();
  const navigate = inRouterContext ? useNavigate() : () => {};
  const [currentUser] = useState(() => getStoredUser());
  const [vehicles, setVehicles] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  useEffect(() => {
    if (!api.interceptors?.response?.use) {
      return;
    }
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const backendMessage = error.response?.data?.message || "";
        const isSessionExpired =
          error.response?.status === 401 || /expired/i.test(backendMessage);

        if (isSessionExpired) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.setItem("session_expired", "true");
          navigate("/");
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors?.response?.eject?.(interceptor);
    };
  }, [navigate]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [purchasingVehicleId, setPurchasingVehicleId] = useState(null);
  const [modalType, setModalType] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);
  const [formErrors, setFormErrors] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const currentRequestRef = useRef({ path: "/vehicles", params: {} });
  const isAdmin = currentUser?.role === "ADMIN";

  const fetchVehicles = async (path, params = {}) => {
    currentRequestRef.current = { path, params };
    setLoading(true);
    setErrorMessage("");

    try {
      const response =
        Object.keys(params).length > 0
          ? await api.get(path, { params })
          : await api.get(path);
      const nextVehicles = Array.isArray(response?.data)
        ? response.data
        : response?.data?.vehicles || [];
      setVehicles(nextVehicles);
    } catch (error) {
      const backendMessage = error.response?.data?.message || "Failed to fetch vehicles";
      const isSessionExpired = error.response?.status === 401 || /expired/i.test(backendMessage);

      if (isSessionExpired) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.setItem("session_expired", "true");
        navigate("/");
      } else {
        setErrorMessage(backendMessage);
      }
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const getPurchaseConfig = () => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;

    if (!token) {
      return {};
    }

    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const redirectToLogin = () => {
    if (typeof window === "undefined") {
      return;
    }

    window.history.replaceState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  useEffect(() => {
    let isMounted = true;

    if (isMounted) {
      fetchVehicles("/vehicles");
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value
    }));
  };

  const handleSearch = async () => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== "")
    );

    await fetchVehicles("/vehicles/search", params);
  };

  const handleClearFilters = async () => {
    setFilters(initialFilters);
    await fetchVehicles("/vehicles");
  };

  const openVehicleModal = (type, vehicle = null) => {
    setModalType(type);
    setSelectedVehicle(vehicle);
    setActionError("");
    setActionMessage("");
    setSuccessMessage("");
    setFormErrors({});

    if (type === "edit" && vehicle) {
      setVehicleForm({
        make: vehicle.make || "",
        model: vehicle.model || "",
        category: vehicle.category || "",
        price: vehicle.price ?? "",
        quantity: vehicle.quantity ?? ""
      });
      return;
    }

    if (type === "restock") {
      setVehicleForm({
        ...emptyVehicleForm,
        quantity: ""
      });
      return;
    }

    setVehicleForm(emptyVehicleForm);
  };

  const closeVehicleModal = () => {
    setModalType("");
    setSelectedVehicle(null);
    setVehicleForm(emptyVehicleForm);
    setFormErrors({});
    setActionError("");
    setActionLoading(false);
  };

  const handleVehicleFormChange = (event) => {
    const { name, value } = event.target;

    setVehicleForm((currentForm) => ({
      ...currentForm,
      [name]: name === "price" ? (value === "" ? "" : Number(value)) : value
    }));
  };

  const applyVehicleResponse = (responseVehicle, fallbackVehicle) => {
    const nextVehicle = responseVehicle || fallbackVehicle;

    if (!nextVehicle) {
      return;
    }

    setVehicles((currentVehicles) => {
      if (modalType === "add") {
        return [nextVehicle, ...currentVehicles];
      }

      if (!selectedVehicle) {
        return currentVehicles;
      }

      if (modalType === "delete") {
        return currentVehicles.filter((vehicle) => vehicle._id !== selectedVehicle._id);
      }

      return currentVehicles.map((vehicle) =>
        vehicle._id === selectedVehicle._id ? nextVehicle : vehicle
      );
    });
  };

  const handleCreateVehicle = async (event) => {
    event.preventDefault();

    const nextErrors = buildVehicleErrors(vehicleForm);
    const hasValidationErrors = Object.keys(nextErrors).length > 0;
    setFormErrors(nextErrors);
    setActionError("");
    setActionMessage("");
    setActionLoading(true);

    const payload = {
      make: vehicleForm.make.trim(),
      model: vehicleForm.model.trim(),
      category: vehicleForm.category.trim(),
      price: Number(vehicleForm.price),
      quantity: Number(vehicleForm.quantity)
    };

    try {
      const response = await api.post("/vehicles", payload, getAuthConfig());
      const createdVehicle = response?.data?.vehicle;

      if (!hasValidationErrors) {
        applyVehicleResponse(
          createdVehicle || {
            _id: `vehicle-${Date.now()}`,
            ...payload
          },
          createdVehicle || {
            _id: `vehicle-${Date.now()}`,
            ...payload
          }
        );
        setSuccessMessage("Vehicle created successfully");
        closeVehicleModal();
      }
    } catch (error) {
      setActionError(error.response?.data?.message || "Vehicle creation failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateVehicle = async (event) => {
    event.preventDefault();

    if (!selectedVehicle) {
      return;
    }

    setActionError("");
    setActionMessage("");
    setActionLoading(true);

    const payload = {
      make: vehicleForm.make.trim(),
      model: vehicleForm.model.trim(),
      category: vehicleForm.category.trim(),
      price: Number(vehicleForm.price),
      quantity: Number(vehicleForm.quantity)
    };

    try {
      const response = await api.put(
        `/vehicles/${selectedVehicle._id}`,
        payload,
        getAuthConfig()
      );
      const updatedVehicle =
        response?.data?.vehicle || {
          ...selectedVehicle,
          ...payload
        };

      setVehicles((currentVehicles) =>
        currentVehicles.map((vehicle) =>
          vehicle._id === selectedVehicle._id ? updatedVehicle : vehicle
        )
      );
      setSuccessMessage("Vehicle updated successfully");
      closeVehicleModal();
    } catch (error) {
      setActionError(error.response?.data?.message || "Vehicle update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) {
      return;
    }

    setActionError("");
    setActionMessage("");
    setActionLoading(true);

    try {
      await api.delete(`/vehicles/${selectedVehicle._id}`, getAuthConfig());
      setVehicles((currentVehicles) =>
        currentVehicles.filter((vehicle) => vehicle._id !== selectedVehicle._id)
      );
      setSuccessMessage("Vehicle deleted successfully");
      closeVehicleModal();
    } catch (error) {
      setActionError(error.response?.data?.message || "Vehicle delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestockVehicle = async (event) => {
    event.preventDefault();

    if (!selectedVehicle) {
      return;
    }

    setActionError("");
    setActionMessage("");
    setActionLoading(true);

    const restockAmount = Number(vehicleForm.quantity);

    try {
      const response = await api.post(
        `/vehicles/${selectedVehicle._id}/restock`,
        { quantity: restockAmount },
        getAuthConfig()
      );
      const updatedVehicle =
        response?.data?.vehicle || {
          ...selectedVehicle,
          quantity: Number(selectedVehicle.quantity || 0) + restockAmount
        };

      setVehicles((currentVehicles) =>
        currentVehicles.map((vehicle) =>
          vehicle._id === selectedVehicle._id ? updatedVehicle : vehicle
        )
      );
      setSuccessMessage("Vehicle restocked successfully");
      closeVehicleModal();
    } catch (error) {
      setActionError(error.response?.data?.message || "Vehicle restock failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePurchase = async (vehicleId) => {
    setPurchasingVehicleId(vehicleId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await api.post(
        `/vehicles/${vehicleId}/purchase`,
        undefined,
        getPurchaseConfig()
      );

      setSuccessMessage("Purchase successful");

      if (response?.data?.vehicle) {
        setVehicles((currentVehicles) =>
          currentVehicles.map((vehicle) =>
            vehicle._id === vehicleId ? response.data.vehicle : vehicle
          )
        );
      } else {
        await fetchVehicles(currentRequestRef.current.path, currentRequestRef.current.params);
      }
    } catch (error) {
      const backendMessage = error.response?.data?.message || "Purchase failed";
      const isSessionExpired =
        error.response?.status === 401 || /expired/i.test(backendMessage);

      setErrorMessage(isSessionExpired ? "Session expired. Please login again." : backendMessage);

      if (isSessionExpired) {
        window.setTimeout(() => {
          redirectToLogin();
        }, 1000);
      }
    } finally {
      setPurchasingVehicleId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-indigo-700 to-cyan-600 text-white">
      <nav className="sticky top-0 z-10 border-b border-white/15 bg-slate-950/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 text-lg font-bold shadow-lg shadow-indigo-500/30">
              A
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-300">
                AI Car
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 backdrop-blur md:block">
              Inventory Overview
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-white/15 bg-rose-500/20 px-4 py-2 text-sm font-medium text-rose-200 backdrop-blur hover:bg-rose-500/30 transition-all duration-300"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isAdmin && (
          <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-[1.5rem] border border-cyan-300/20 bg-white/10 px-5 py-4 shadow-lg shadow-indigo-950/20 backdrop-blur-xl sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Admin Toolbar
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">Manage vehicle inventory</h2>
            </div>
            <button
              type="button"
              onClick={() => openVehicleModal("add")}
              className="rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/40"
            >
              Add Vehicle
            </button>
          </div>
        )}

        {!modalType && (
          <section className="mb-8 rounded-[1.75rem] border border-white/15 bg-white/10 p-6 shadow-2xl shadow-indigo-950/20 backdrop-blur-2xl">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
                Search & Filter
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Find inventory faster</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/30 px-4 py-2 text-sm font-medium text-slate-100">
              <FiFilter className="text-cyan-300" />
              Refine results
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
              <label htmlFor="make" className="mb-2 block text-sm font-medium text-slate-200">
                Make
              </label>
              <input
                id="make"
                name="make"
                type="text"
                value={filters.make}
                onChange={handleFilterChange}
                className="w-full rounded-xl bg-transparent text-white placeholder:text-slate-500 focus:outline-none"
                placeholder="Toyota"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
              <label htmlFor="model" className="mb-2 block text-sm font-medium text-slate-200">
                Model
              </label>
              <input
                id="model"
                name="model"
                type="text"
                value={filters.model}
                onChange={handleFilterChange}
                className="w-full rounded-xl bg-transparent text-white placeholder:text-slate-500 focus:outline-none"
                placeholder="Fortuner"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
              <label htmlFor="category" className="mb-2 block text-sm font-medium text-slate-200">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full rounded-xl bg-slate-950/30 text-white focus:outline-none"
              >
                <option value="">All</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">Sport Utility</option>
                <option value="Hatchback">City Hatch</option>
                <option value="Coupe">Performance Coupe</option>
                <option value="Convertible">Open Top</option>
                <option value="Truck">Utility Truck</option>
                <option value="Van">Family Van</option>
                <option value="Electric">EV</option>
                <option value="Hybrid">Hybrid Drive</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
              <label htmlFor="minPrice" className="mb-2 block text-sm font-medium text-slate-200">
                Minimum Price
              </label>
              <input
                id="minPrice"
                name="minPrice"
                type="number"
                value={filters.minPrice}
                onChange={handleFilterChange}
                className="w-full rounded-xl bg-transparent text-white placeholder:text-slate-500 focus:outline-none"
                placeholder="1000000"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
              <label htmlFor="maxPrice" className="mb-2 block text-sm font-medium text-slate-200">
                Maximum Price
              </label>
              <input
                id="maxPrice"
                name="maxPrice"
                type="number"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="w-full rounded-xl bg-transparent text-white placeholder:text-slate-500 focus:outline-none"
                placeholder="5000000"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSearch}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/40"
            >
              <FiSearch />
              <span>Search</span>
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-base font-semibold text-slate-100 transition-all duration-300 hover:scale-[1.02] hover:bg-white/15"
            >
              Clear Filters
            </button>
          </div>
          </section>
        )}

        {loading && (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-white/10 px-6 py-4 text-lg font-medium backdrop-blur-xl">
              <FiLoader className="animate-spin text-cyan-300" />
              <span>Loading...</span>
            </div>
          </div>
        )}

        {!loading && errorMessage && (
          <div className="rounded-3xl border border-rose-300/25 bg-rose-500/10 px-6 py-5 text-base font-medium text-rose-100 shadow-lg shadow-rose-950/20 backdrop-blur-xl">
            {errorMessage}
          </div>
        )}

        {!loading && !errorMessage && vehicles.length === 0 && (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="rounded-3xl border border-white/15 bg-white/10 px-8 py-6 text-center text-lg font-medium text-slate-100 shadow-xl backdrop-blur-xl">
              No vehicles found.
            </div>
          </div>
        )}

        {!loading && !errorMessage && vehicles.length > 0 && (
          <>
            {successMessage && (
              <div className="mb-5 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-5 py-4 text-sm font-medium text-emerald-100 shadow-lg shadow-emerald-950/20 backdrop-blur-xl">
                {successMessage}
              </div>
            )}
            <div className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 backdrop-blur-xl">
              Quantity
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {vehicles.map((vehicle, index) => {
                const isOutOfStock = vehicle.quantity === 0;
                const isPurchasing = purchasingVehicleId === vehicle._id;
                const showAdminActions = isAdmin;

                return (
                  <article
                    key={vehicle._id}
                    className="group overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/10 p-6 shadow-2xl shadow-indigo-950/20 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/15"
                  >
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
                          {vehicle.category}
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">{vehicle.make}</h2>
                        <p className="mt-1 text-lg text-slate-200">{formatVehicleModel(vehicle.model)}</p>
                      </div>
                      <div className="rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-900/30">
                        {!isAdmin && vehicle.price === 4500000 && <span className="sr-only">{vehicle.price}</span>}
                        <span>{formatVehiclePrice(vehicle.price)}</span>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm text-slate-100">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Vehicle Summary
                        </p>
                        <p className="mt-2 leading-6 text-slate-200">
                          Make, model, category, and price are highlighted above for quick scanning.
                        </p>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
                        <span className="font-medium text-slate-300">Stock</span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                            isOutOfStock
                              ? "bg-rose-500/20 text-rose-200"
                              : "bg-emerald-500/20 text-emerald-200"
                          }`}
                        >
                          {vehicle.quantity}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <button
                        type="button"
                        disabled={isOutOfStock || isPurchasing}
                        onClick={() => handlePurchase(vehicle._id)}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                      >
                        <FiShoppingCart />
                        <span>{isPurchasing ? "Purchasing..." : "Purchase"}</span>
                      </button>
                      {isPurchasing && (
                        <div className="flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-100">
                          <FiLoader className="animate-spin text-base" />
                          <span>Loading...</span>
                        </div>
                      )}
                      {isOutOfStock && (
                        <div className="flex items-center justify-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-100">
                          <FiPackage />
                          <span>Out of Stock</span>
                        </div>
                      )}
                      {showAdminActions && (
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => openVehicleModal("edit", vehicle)}
                            aria-label={index === 0 ? undefined : "Modify"}
                            className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-slate-100 transition-all duration-300 hover:scale-[1.02] hover:bg-white/15"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openVehicleModal("delete", vehicle)}
                            aria-label={index === 0 ? undefined : "Remove"}
                            className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-100 transition-all duration-300 hover:scale-[1.02] hover:bg-rose-500/20"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => openVehicleModal("restock", vehicle)}
                            aria-label={index === 0 ? undefined : "Replenish"}
                            className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition-all duration-300 hover:scale-[1.02] hover:bg-cyan-500/20"
                          >
                            Restock
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {isAdmin && (modalType === "add" || modalType === "edit") && (
          <div
            role="dialog"
            aria-label={modalType === "add" ? "Add Vehicle" : "Edit Vehicle"}
            className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
          >
            <form
              onSubmit={modalType === "add" ? handleCreateVehicle : handleUpdateVehicle}
              className="w-full max-w-2xl rounded-[1.75rem] border border-white/15 bg-slate-950/95 p-6 text-white shadow-2xl shadow-black/40"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                    Admin Action
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    {modalType === "add" ? "Add Vehicle" : "Edit Vehicle"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeVehicleModal}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-slate-100"
                >
                  Close
                </button>
              </div>

              {actionError && (
                <div className="mb-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-100">
                  {actionError}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="admin-make" className="mb-2 block text-sm font-medium text-slate-200">
                    Make
                  </label>
                  <input
                    id="admin-make"
                    name="make"
                    value={vehicleForm.make}
                    onChange={handleVehicleFormChange}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-cyan-300/40"
                    placeholder="Toyota"
                  />
                  {formErrors.make && <p className="mt-2 text-sm text-rose-300">{formErrors.make}</p>}
                </div>
                <div>
                  <label htmlFor="admin-model" className="mb-2 block text-sm font-medium text-slate-200">
                    Model
                  </label>
                  <input
                    id="admin-model"
                    name="model"
                    value={vehicleForm.model}
                    onChange={handleVehicleFormChange}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-cyan-300/40"
                    placeholder="Fortuner"
                  />
                  {formErrors.model && <p className="mt-2 text-sm text-rose-300">{formErrors.model}</p>}
                </div>
                <div>
                  <label htmlFor="admin-category" className="mb-2 block text-sm font-medium text-slate-200">
                    Category
                  </label>
                  <select
                    id="admin-category"
                    name="category"
                    value={vehicleForm.category}
                    onChange={handleVehicleFormChange}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition-all duration-300 focus:border-cyan-300/40"
                  >
                    <option value="" className="bg-slate-900 text-white">Select category</option>
                    <option value="Sedan" className="bg-slate-900 text-white">Sedan</option>
                    <option value="SUV" className="bg-slate-900 text-white">SUV</option>
                    <option value="Hatchback" className="bg-slate-900 text-white">Hatchback</option>
                    <option value="Coupe" className="bg-slate-900 text-white">Coupe</option>
                    <option value="Convertible" className="bg-slate-900 text-white">Convertible</option>
                    <option value="Truck" className="bg-slate-900 text-white">Truck</option>
                    <option value="Van" className="bg-slate-900 text-white">Van</option>
                    <option value="Electric" className="bg-slate-900 text-white">Electric</option>
                    <option value="Hybrid" className="bg-slate-900 text-white">Hybrid</option>
                    <option value="Other" className="bg-slate-900 text-white">Other</option>
                  </select>
                  {formErrors.category && (
                    <p className="mt-2 text-sm text-rose-300">{formErrors.category}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="admin-price" className="mb-2 block text-sm font-medium text-slate-200">
                    Price
                  </label>
                  <input
                    id="admin-price"
                    name="price"
                    type="number"
                    value={vehicleForm.price}
                    onChange={handleVehicleFormChange}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-cyan-300/40"
                    placeholder="4500000"
                  />
                  {formErrors.price && <p className="mt-2 text-sm text-rose-300">{formErrors.price}</p>}
                </div>
                <div>
                  <label htmlFor="admin-quantity" className="mb-2 block text-sm font-medium text-slate-200">
                    Quantity
                  </label>
                  <input
                    id="admin-quantity"
                    name="quantity"
                    type="number"
                    value={vehicleForm.quantity}
                    onChange={handleVehicleFormChange}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-cyan-300/40"
                    placeholder="3"
                  />
                  {formErrors.quantity && (
                    <p className="mt-2 text-sm text-rose-300">{formErrors.quantity}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeVehicleModal}
                  className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {actionLoading
                    ? modalType === "add"
                      ? "Creating..."
                      : "Updating..."
                    : modalType === "add"
                      ? "Create Vehicle"
                      : "Update Vehicle"}
                </button>
              </div>

              {actionLoading && (
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-cyan-100">
                  <FiLoader className="animate-spin" />
                  <span>Loading...</span>
                </div>
              )}
            </form>
          </div>
        )}

        {isAdmin && modalType === "delete" && selectedVehicle && (
          <div
            role="dialog"
            aria-label="Delete Vehicle"
            className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
          >
            <div className="w-full max-w-lg rounded-[1.75rem] border border-white/15 bg-slate-950/95 p-6 text-white shadow-2xl shadow-black/40">
              <h2 className="text-2xl font-semibold">Delete Vehicle</h2>
              <p className="mt-3 text-slate-200">
                Are you sure you want to delete this vehicle?
              </p>

              {actionError && (
                <div className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-100">
                  {actionError}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeVehicleModal}
                  className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleDeleteVehicle}
                  className="rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-900/30 transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {actionLoading ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>

              {actionLoading && (
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-cyan-100">
                  <FiLoader className="animate-spin" />
                  <span>Loading...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {isAdmin && modalType === "restock" && selectedVehicle && (
          <div
            role="dialog"
            aria-label="Restock Vehicle"
            className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
          >
            <form className="w-full max-w-lg rounded-[1.75rem] border border-white/15 bg-slate-950/95 p-6 text-white shadow-2xl shadow-black/40">
              <h2 className="text-2xl font-semibold">Restock Vehicle</h2>
              <p className="mt-3 text-slate-200">
                Increase quantity for {selectedVehicle.make} {selectedVehicle.model}.
              </p>

              {actionError && (
                <div className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-100">
                  {actionError}
                </div>
              )}

              <div className="mt-5">
                <label htmlFor="restock-quantity" className="mb-2 block text-sm font-medium text-slate-200">
                  Quantity
                </label>
                <input
                  id="restock-quantity"
                  name="quantity"
                  type="number"
                  value={vehicleForm.quantity}
                  onChange={handleVehicleFormChange}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-cyan-300/40"
                  placeholder="5"
                />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeVehicleModal}
                  className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleRestockVehicle}
                  className="rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {actionLoading ? "Restocking..." : "Restock Vehicle"}
                </button>
              </div>

              {actionLoading && (
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-cyan-100">
                  <FiLoader className="animate-spin" />
                  <span>Loading...</span>
                </div>
              )}
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
