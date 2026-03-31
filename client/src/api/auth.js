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

const getFormValue = (payload, key) => {
  if (!(payload instanceof FormData)) return "";
  return payload.get(key) || "";
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

    const isRegisterRouteMissing =
      error?.response?.status === 404 &&
      String(error?.response?.data?.message || "").includes("/api/auth/register");

    if (!isRegisterRouteMissing) {
      throw error;
    }

    console.warn("[frontend.register] /auth/register not found on live server. Falling back to /members/apply");

    const fallbackResponse = await api.post("/members/apply", payload, {
      headers: payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    console.log("API Response:", fallbackResponse.data);

    if (fallbackResponse.data?.token) {
      return fallbackResponse.data;
    }

    const email = getFormValue(payload, "email");
    const password = getFormValue(payload, "password");
    const mobile = getFormValue(payload, "mobile");
    const loginPassword = password || mobile;

    console.warn("[frontend.register] Fallback registration did not return token. Attempting auto-login.");

    const loginResponse = await api.post("/auth/login", {
      email,
      password: loginPassword,
    });
    console.log("API Response:", loginResponse.data);

    return {
      ...fallbackResponse.data,
      ...loginResponse.data,
      user: loginResponse.data?.user || null,
    };
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
