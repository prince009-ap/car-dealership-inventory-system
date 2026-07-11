import React, { useEffect, useState } from "react";
import { FiLoader, FiPackage, FiShoppingCart } from "react-icons/fi";
import api from "../services/api";

const Dashboard = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchVehicles = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const response = await api.get("/vehicles");
        const nextVehicles = response.data?.vehicles || [];

        if (isMounted) {
          setVehicles(nextVehicles);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.response?.data?.message || "Failed to fetch vehicles");
          setVehicles([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchVehicles();

    return () => {
      isMounted = false;
    };
  }, []);

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
          <div className="hidden rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 backdrop-blur md:block">
            Inventory Overview
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
            <div className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 backdrop-blur-xl">
              Quantity
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {vehicles.map((vehicle) => {
              const isOutOfStock = vehicle.quantity === 0;

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
                      <p className="mt-1 text-lg text-slate-200">{vehicle.model}</p>
                    </div>
                    <div className="rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-900/30">
                      {vehicle.price}
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
                      disabled={isOutOfStock}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                    >
                      <FiShoppingCart />
                      <span>Purchase</span>
                    </button>
                    {isOutOfStock && (
                      <div className="flex items-center justify-center gap-2 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-100">
                        <FiPackage />
                        <span>Out of Stock</span>
                      </div>
                    )}
                  </div>
                </article>
              );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
