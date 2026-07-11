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
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex min-h-screen w-full items-center justify-center px-4 py-10"
    >
      <div className="relative w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-8 shadow-2xl shadow-indigo-950/30 backdrop-blur-2xl transition-all duration-300 sm:p-10 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:p-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.25),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(6,182,212,0.18),_transparent_25%)]" />

        <div className="relative hidden flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-indigo-700 to-cyan-600 p-10 text-white lg:flex">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur transition-all duration-300 hover:scale-[1.02]">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.9)]" />
              Premium Car Inventory System
            </div>
            <div className="space-y-4">
              <h1 className="max-w-md text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
                Welcome Back
              </h1>
              <p className="max-w-md text-lg leading-8 text-white/80">
                Sign in to manage inventory, streamline operations, and keep your dealership moving with confidence.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: "Fast Access", value: "One secure sign-in" },
              { title: "Smart Control", value: "Inventory at a glance" }
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/15">
                <p className="text-sm uppercase tracking-[0.2em] text-white/60">{item.title}</p>
                <p className="mt-2 text-lg font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center p-0 lg:p-10">
          <div className="w-full max-w-xl rounded-[1.75rem] border border-white/20 bg-slate-950/75 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.45)] transition-all duration-300 sm:p-10">
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
        </div>
      </div>
    </form>
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
