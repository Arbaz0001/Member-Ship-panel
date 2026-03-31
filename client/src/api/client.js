import axios from "axios";
import { API_BASE_URL, APP_MODE } from "../config/env";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("🔐 Sending token with role:", role);
  } else {
    console.log("⚠️  No token found");
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      const path = globalThis.location?.pathname || "/";
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      globalThis.location.href = path.startsWith("/admin") ? "/admin/login" : "/login";
    }
    if (status === 403) {
      console.error("🚫 Forbidden - User role check failed. Token role:", localStorage.getItem("role"));
    }
    return Promise.reject(error);
  }
);

if (import.meta.env.DEV) {
  console.info(`[api] Using ${APP_MODE} API base URL: ${API_BASE_URL}`);
}

export default api;
