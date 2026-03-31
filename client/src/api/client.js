import axios from "axios";
import { API_BASE_URL, APP_MODE } from "../config/env";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      globalThis.location.href = path.startsWith("/admin") ? "/admin/login" : "/login";
    }
    return Promise.reject(error);
  }
);

if (import.meta.env.DEV) {
  console.info(`[api] Using ${APP_MODE} API base URL: ${API_BASE_URL}`);
}

export default api;
