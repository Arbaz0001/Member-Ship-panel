/* eslint-disable react/prop-types */
import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { loginAdmin as loginAdminRequest, loginMember } from "../api/auth";

const AuthContext = createContext(null);

const parseJwtPayload = (token) => {
  try {
    const tokenPart = token?.split(".")?.[1];
    if (!tokenPart) return null;
    const base64 = tokenPart.replaceAll("-", "+").replaceAll("_", "/");
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(globalThis.atob(normalized));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    if (storedToken) {
      const tokenRole = parseJwtPayload(storedToken)?.role;
      const resolvedRole = storedRole || tokenRole || null;
      setToken(storedToken);
      setRole(resolvedRole);
      if (resolvedRole) {
        localStorage.setItem("role", resolvedRole);
      }
    }
    setLoading(false);
  }, []);

  const loginUser = async (email, password) => {
    const res = await loginMember({ email, password });
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.setItem("token", res.token);
    localStorage.setItem("role", res.role);
    setToken(res.token);
    setRole(res.role);
    console.log("✅ User Login Success - Role:", res.data.role);
    return res.role;
  };

  const loginAdmin = async (email, password) => {
    const res = await loginAdminRequest({ email, password });
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.setItem("token", res.token);
    localStorage.setItem("role", res.role);
    setToken(res.token);
    setRole(res.role);
    console.log("✅ Admin Login Success - Role:", res.data.role);
    return res.role;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(null);
    setRole(null);
  };

  const value = useMemo(
    () => ({ token, role, loading, loginUser, loginAdmin, logout }),
    [token, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
