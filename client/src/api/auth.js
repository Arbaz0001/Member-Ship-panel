import api from "./client";

const logFormData = (payload) => {
  if (!(payload instanceof FormData)) return;

  const entries = {};
  for (const [key, value] of payload.entries()) {
    if (value instanceof File) {
      entries[key] = {
        name: value.name,
        type: value.type,
        size: value.size,
      };
      continue;
    }

    entries[key] = value;
  }

  console.log("FormData:", entries);
  console.log("File:", payload.get("profileImage") || null);
};

export const registerMember = async (payload) => {
  console.log("[frontend.register] Submitting registration", {
    email: payload instanceof FormData ? payload.get("email") : payload?.email || "",
    membershipType: payload instanceof FormData ? payload.get("membershipType") : payload?.membershipType || "",
  });
  logFormData(payload);
  try {
    const response = await api.post("/auth/register", payload, {
      headers: payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    console.log("API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    throw error;
  }
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
