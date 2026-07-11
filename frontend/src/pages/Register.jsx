import React, { useState } from "react";
import { FiCheckCircle, FiLoader, FiLock, FiMail, FiUser } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const initialFormValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: ""
};

const Register = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(initialFormValues);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const trimmedName = formValues.name.trim();
    const trimmedEmail = formValues.email.trim();

    if (!trimmedName) {
      nextErrors.name = "Name is required";
    }

    if (!trimmedEmail) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Valid email is required";
    }

    if (!formValues.password) {
      nextErrors.password = "Password is required";
    } else if (formValues.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    if (!formValues.confirmPassword) {
      nextErrors.confirmPassword = "Confirm password is required";
    } else if (formValues.password !== formValues.confirmPassword) {
      nextErrors.confirmPassword = "Passwords must match";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateForm();
    setErrors(nextErrors);
    setErrorMessage("");
    setSuccessMessage("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", {
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        password: formValues.password
      });

      setSuccessMessage("Registration successful");
      navigate("/");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClassName =
    "w-full bg-transparent text-base text-white placeholder:text-slate-500 focus:outline-none";

  const renderField = ({ icon: Icon, label, id, name, type = "text", placeholder, error }) => (
    <>
      <div
        className={`mb-5 flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-300 ${
          error
            ? "border-rose-500/50 bg-rose-950/20 focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/10"
            : "border-white/10 bg-white/5 focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-400/15 focus-within:bg-slate-900/30"
        }`}
      >
        <Icon className="text-xl text-cyan-300" />
        <div className="flex-1">
          <label
            htmlFor={id}
            className="mb-1 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400"
          >
            {label}
          </label>
          <input
            id={id}
            name={name}
            type={type}
            value={formValues[name]}
            onChange={handleChange}
            placeholder={placeholder}
            className={inputClassName}
          />
        </div>
      </div>
      {error && <p className="mb-5 -mt-3 text-sm font-medium text-rose-300">{error}</p>}
    </>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-700 via-indigo-700 to-cyan-600 px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-8 shadow-2xl shadow-indigo-950/30 backdrop-blur-2xl transition-all duration-300 sm:p-10 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:p-0"
      >
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
                Join the platform
              </h1>
              <p className="max-w-md text-lg leading-8 text-white/80">
                Create your access to manage vehicles, teams, and dealership operations from one polished dashboard.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: "Team Ready", value: "Built for daily operations" },
              { title: "Secure Access", value: "Protected account setup" }
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/15"
              >
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
                    Create your account
                  </h2>
                </div>
              </div>
              <p className="max-w-md text-sm leading-6 text-slate-300 sm:text-base">
                Create your account to unlock the inventory workspace and keep your dealership in sync.
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

            {successMessage && (
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-100">
                <FiCheckCircle className="text-lg" />
                <span>{successMessage}</span>
              </div>
            )}

            {renderField({
              icon: FiUser,
              label: "Name",
              id: "name",
              name: "name",
              placeholder: "Enter your full name",
              error: errors.name
            })}

            {renderField({
              icon: FiMail,
              label: "Email",
              id: "email",
              name: "email",
              type: "email",
              placeholder: "Enter your email",
              error: errors.email
            })}

            {renderField({
              icon: FiLock,
              label: "Password",
              id: "password",
              name: "password",
              type: "password",
              placeholder: "Create a password",
              error: errors.password
            })}

            {renderField({
              icon: FiLock,
              label: "Confirm Password",
              id: "confirm-password",
              name: "confirmPassword",
              type: "password",
              placeholder: "Confirm your password",
              error: errors.confirmPassword
            })}

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
              <span className="relative">{loading ? "Registering..." : "Register"}</span>
            </button>

            <Link
              to="/"
              className="mt-6 block text-center text-sm font-semibold text-cyan-300 transition-all duration-300 hover:text-cyan-200 hover:underline"
            >
              Already have an account? Login
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Register;
