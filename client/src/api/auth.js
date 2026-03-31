import api from "./client";

export const loginMember = async (credentials) => {
  console.log("[frontend.login] Request payload", {
    email: credentials?.email || "",
  });
  const response = await api.post("/auth/login", credentials);
  console.log("[frontend.login] Response received", response.data);
  return response.data;
};

export const loginAdmin = async (credentials) => {
  const response = await api.post("/admin/login", credentials);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};
