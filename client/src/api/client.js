import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
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
    return Promise.reject(error);
  }
);

export default api;
