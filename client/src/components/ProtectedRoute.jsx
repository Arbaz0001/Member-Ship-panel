/* eslint-disable react/prop-types */
import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(globalThis.atob(token.split(".")[1]));
    if (!payload?.exp) return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

export default function ProtectedRoute({ children, role }) {
  const auth = useAuth();
  const isExpired = Boolean(auth?.token) && isTokenExpired(auth.token);

  useEffect(() => {
    if (!auth?.loading && isExpired) {
      auth?.logout?.();
    }
  }, [auth, isExpired]);

  if (auth?.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (!auth?.token || isExpired) {
    return <Navigate to={role === "admin" ? "/admin/login" : "/login"} replace />;
  }

  if (role && auth.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
