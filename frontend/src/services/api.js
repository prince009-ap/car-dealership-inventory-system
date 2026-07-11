import axios from "axios";

if (!axios.defaults) {
  axios.defaults = {};
}

axios.defaults.baseURL = "http://localhost:5000/api";

axios.interceptors.request.use((config) => {
  const nextConfig = { ...config };
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null;

  if (token) {
    nextConfig.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`
    };
  }

  return nextConfig;
});

export default axios;
