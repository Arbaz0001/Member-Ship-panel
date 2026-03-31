import api from "./client";

export const registerMember = async (payload) => {
  console.log("[frontend.register] Submitting registration", {
    email: payload instanceof FormData ? payload.get("email") : payload?.email || "",
    membershipType: payload instanceof FormData ? payload.get("membershipType") : payload?.membershipType || "",
  });
  const response = await api.post("/auth/register", payload, {
    headers: payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
  console.log("[frontend.register] Response received", response.data);
  return response.data;
};

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
  return response.data?.user;
};
