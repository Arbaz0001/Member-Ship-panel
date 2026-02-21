import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const auth = useAuth();
  const nav = useNavigate();

  const login = async () => {
    try {
      setError("");
      await auth.loginAdmin(email, password);
      nav("/admin/dashboard");
    } catch (err) {
      setError(err?.response?.data?.msg || "Invalid admin credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white p-5 sm:p-8 rounded-xl shadow-lg border border-slate-200 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-950">Admin Login</h2>
        <input
          className="border p-2 w-full mb-3 rounded"
          placeholder="Admin Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="border p-2 w-full mb-3 rounded"
          placeholder="Admin Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <button
          onClick={login}
          className="bg-blue-900 hover:bg-blue-950 text-white w-full p-2 rounded"
        >
          Login
        </button>
        <p className="text-center mt-4 text-sm">
          <Link to="/" className="text-blue-900">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
