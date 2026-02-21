import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
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

export default api;
