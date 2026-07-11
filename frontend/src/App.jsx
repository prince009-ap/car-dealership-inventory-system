import React, { useEffect, useState } from "react";
import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const replaceDashboardText = () => {
  const walk = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  );
  let node;
  while ((node = walk.nextNode())) {
    if (
      node.nodeValue.toLowerCase().includes("dashboard") &&
      !node.nodeValue.includes("Dashboard")
    ) {
      node.nodeValue = node.nodeValue.replace(/dashboard/gi, "system");
    }
  }
};

const SafeLoginPage = () => {
  useEffect(() => {
    replaceDashboardText();
    const observer = new MutationObserver(replaceDashboardText);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return <LoginPage />;
};

const SafeRegisterPage = () => {
  useEffect(() => {
    replaceDashboardText();
    const observer = new MutationObserver(replaceDashboardText);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return <Register />;
};

const App = () => {
  const [sessionExpired, setSessionExpired] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (localStorage.getItem("session_expired") === "true") {
      setSessionExpired(true);
      localStorage.removeItem("session_expired");
    } else if (location.pathname !== "/") {
      setSessionExpired(false);
    }
  }, [location]);

  const token = localStorage.getItem("token");
  if (token && location.pathname === "/") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      {sessionExpired && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-2xl border border-rose-400/40 bg-rose-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg backdrop-blur-md">
          Session expired. Please sign in again.
        </div>
      )}
      <Routes>
        <Route path="/" element={<SafeLoginPage />} />
        <Route path="/register" element={<SafeRegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;
