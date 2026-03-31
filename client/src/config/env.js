const API_BASE_URL_BY_MODE = {
  development: "http://localhost:5000/api",
  production: "https://member.sspurm.org/api",
};

export const APP_MODE = import.meta.env.MODE;

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  API_BASE_URL_BY_MODE[APP_MODE] ||
  API_BASE_URL_BY_MODE.development;

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");
