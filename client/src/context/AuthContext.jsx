/* eslint-disable react/prop-types */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, loginAdmin as loginAdminRequest, loginMember } from "../api/auth";

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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    setToken(null);
    setRole(null);
    setUser(null);
  };

  const persistSession = (nextToken, nextRole, nextUser = null) => {
    localStorage.setItem("token", nextToken);
    localStorage.setItem("role", nextRole);
    setToken(nextToken);
    setRole(nextRole);

    if (nextUser) {
      localStorage.setItem("user", JSON.stringify(nextUser));
      setUser(nextUser);
      return;
    }

    localStorage.removeItem("user");
    setUser(null);
  };

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("token");
      const storedRole = localStorage.getItem("role");
      const storedUser = localStorage.getItem("user");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      const tokenRole = parseJwtPayload(storedToken)?.role;
      const resolvedRole = storedRole || tokenRole || null;

      setToken(storedToken);
      setRole(resolvedRole);

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem("user");
        }
      }

      if (resolvedRole) {
        localStorage.setItem("role", resolvedRole);
      }

      if (resolvedRole === "member") {
        try {
          const currentUser = await getCurrentUser();
          localStorage.setItem("user", JSON.stringify(currentUser));
          setUser(currentUser);
          if (currentUser?.role) {
            setRole(currentUser.role);
            localStorage.setItem("role", currentUser.role);
          }
        } catch (error) {
          console.error("Failed to restore user session:", error);
          clearSession();
        }
      }

      setLoading(false);
    };

    restoreSession();
  }, []);

  const loginUser = async (email, password) => {
    try {
      const response = await loginMember({ email, password });
      persistSession(response.token, response.role, response.user || null);
      const currentUser = response.user || (await getCurrentUser());
      persistSession(response.token, response.role, currentUser);
      return currentUser;
    } catch (error) {
      console.error("Login failed:", error);
      clearSession();
      throw error;
    }
  };

  const loginAdmin = async (email, password) => {
    try {
      const response = await loginAdminRequest({ email, password });
      const adminUser = { email, role: response.role };
      persistSession(response.token, response.role, adminUser);
      return adminUser;
    } catch (error) {
      console.error("Admin login failed:", error);
      clearSession();
      throw error;
    }
  };

  const logout = () => {
    clearSession();
  };

  const value = useMemo(
    () => ({ token, role, user, loading, loginUser, loginAdmin, logout }),
    [token, role, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
