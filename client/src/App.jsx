import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminMemberCreate from "./pages/admin/AdminMemberCreate";
import AdminMemberView from "./pages/admin/AdminMemberView";
import AdminMemberEdit from "./pages/admin/AdminMemberEdit";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminMembershipPrice from "./pages/admin/AdminMembershipPrice";
import AdminSettings from "./pages/admin/AdminSettings";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/member/dashboard"
            element={
              <ProtectedRoute role="member">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/history"
            element={
              <ProtectedRoute role="member">
                <History />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<Navigate to="/member/dashboard" replace />} />
          <Route path="/history" element={<Navigate to="/member/history" replace />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/members"
            element={
              <ProtectedRoute role="admin">
                <AdminMembers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/members/create"
            element={
              <ProtectedRoute role="admin">
                <AdminMemberCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/members/:id"
            element={
              <ProtectedRoute role="admin">
                <AdminMemberView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/members/:id/edit"
            element={
              <ProtectedRoute role="admin">
                <AdminMemberEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute role="admin">
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute role="admin">
                <AdminPayments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/membership-price"
            element={
              <ProtectedRoute role="admin">
                <AdminMembershipPrice />
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
