import React, { useState } from "react";
import { Link, MemoryRouter, useInRouterContext, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiLoader } from "react-icons/fi";
import api from "../services/api";

const LoginForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Email is required";
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required";
    }

    setErrors(nextErrors);
    setErrorMessage("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/dashboard");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center px-4 py-10"
      style={{
        backgroundImage: "url('https://4kwallpapers.com/images/wallpapers/lamborghini-cars-sports-cars-luxury-cars-automobile-speed-5k-2880x1800-4140.jpg')"
      }}
    >
      <div className="absolute inset-0 bg-[#020617]/75" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/20 bg-slate-950/70 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.6)] backdrop-blur-3xl transition-all duration-500 hover:-translate-y-1.5 hover:shadow-cyan-500/10 hover:border-white/30 sm:p-10"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.25),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(6,182,212,0.18),_transparent_25%)]" />

        <div className="relative">
          <div className="mb-8 space-y-4">
            <div className="inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 text-lg font-bold text-white shadow-lg shadow-indigo-500/30">
                A
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
                  AI Car
                </p>
                <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Welcome Back
                </h2>
              </div>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-300 sm:text-base">
              Use your dealership credentials to access the inventory dashboard.
            </p>
          </div>

          <div
            className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-300 ${
              errorMessage
                ? "border-rose-400/40 bg-rose-500/10 text-rose-100"
                : "border-transparent bg-transparent"
            }`}
            aria-live="polite"
          >
            {errorMessage || "\u00A0"}
          </div>

          <div
            className={`mb-5 flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-300 ${
              errors.email
                ? "border-rose-500/50 bg-rose-950/20 focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/10"
                : "border-white/10 bg-white/5 focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-400/15 focus-within:bg-slate-900/30"
            }`}
          >
            <FiMail className="text-xl text-cyan-300" />
            <div className="flex-1">
              <label htmlFor="email" className="mb-1 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                className="w-full bg-transparent text-base text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          </div>
          {errors.email && <p className="mb-5 -mt-3 text-sm font-medium text-rose-300">{errors.email}</p>}

          <div
            className={`mb-5 flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-300 ${
              errors.password
                ? "border-rose-500/50 bg-rose-950/20 focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/10"
                : "border-white/10 bg-white/5 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-400/15 focus-within:bg-slate-900/30"
            }`}
          >
            <FiLock className="text-xl text-indigo-300" />
            <div className="flex-1">
              <label htmlFor="password" className="mb-1 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full bg-transparent text-base text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          </div>
          {errors.password && <p className="mb-5 -mt-3 text-sm font-medium text-rose-300">{errors.password}</p>}

          {loading && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-100">
              <FiLoader className="animate-spin text-lg" />
              <span>Loading...</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-950/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-cyan-500/30 hover:from-blue-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-400 disabled:border-white/5 disabled:shadow-none disabled:opacity-50 disabled:hover:scale-100"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-white/10 to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100" />
            <span className="relative">{loading ? "Logging in..." : "Login"}</span>
          </button>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-cyan-300 transition-all duration-300 hover:text-cyan-200 hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

const LoginPageContent = () => {
  const isInsideRouter = useInRouterContext();

  if (isInsideRouter) {
    return <LoginForm />;
  }

  return (
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>
  );
};

export default LoginPageContent;
