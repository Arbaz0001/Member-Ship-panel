import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import { useToast } from "../context/ToastContext";
import logo from "../assets/ssp.jpeg";

const baseUrl = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function Home() {
  const toast = useToast();
  const auth = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    fatherName: "",
    mobile: "",
    email: "",
    address: "",
    occupation: "",
    annualIncome: "",
    membershipType: "one-time",
    membershipPriceId: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [settings, setSettings] = useState({
    lifetimePrice: 0,
    oneTimePrice: 0,
    paymentQrImage: "",
    membershipOptions: [],
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
  });
  const [loading, setLoading] = useState(false);

  const selectedMembershipOption = useMemo(
    () => settings.membershipOptions?.find((item) => item._id === form.membershipPriceId),
    [settings.membershipOptions, form.membershipPriceId]
  );

  const membershipFee = useMemo(() => {
    if (selectedMembershipOption) return Number(selectedMembershipOption.price || 0);
    return settings.oneTimePrice || settings.lifetimePrice;
  }, [selectedMembershipOption, form.membershipType, settings]);

  useEffect(() => {
    const loadSettings = async () => {
      const res = await api.get("/settings");
      const nextSettings = res.data || {
        lifetimePrice: 0,
        oneTimePrice: 0,
        paymentQrImage: "",
        membershipOptions: [],
      };
      setSettings(nextSettings);

      if (nextSettings.membershipOptions?.length) {
        const firstOption = nextSettings.membershipOptions[0];
        setForm((prev) => ({
          ...prev,
          membershipPriceId: firstOption._id,
          membershipType: "one-time",
        }));
      }
    };
    loadSettings();
  }, []);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitMembership = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const data = new FormData();
      const payload = {
        ...form,
        membershipType: "one-time",
      };

      Object.entries(payload).forEach(([key, value]) => data.append(key, value));
      if (profileImage) data.append("profileImage", profileImage);

      await api.post("/members/apply", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await auth.loginUser(form.email, form.mobile);
      toast.success("Membership submitted and logged in successfully.");
      nav("/member/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.msg || err?.response?.data?.message || "Unable to submit membership form.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <img src={logo} alt="SSP Logo" className="h-12 w-auto object-contain" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:flex-wrap">
            {auth?.token && auth?.role === "member" ? (
              <Link to="/member/dashboard" className="px-4 py-2 rounded border border-slate-300 text-sm text-center">
                Dashboard
              </Link>
            ) : (
              <Link to="/login" className="px-4 py-2 rounded border border-slate-300 text-sm text-center">
                Member Login
              </Link>
            )}
            <Link to="/admin/login" className="px-4 py-2 rounded border border-slate-300 text-sm text-center">
              Admin Login
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[2fr_1fr] gap-6">
        <form onSubmit={submitMembership} className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="font-semibold text-blue-950 mb-4">Apply Membership</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <input className="border border-slate-300 p-2 rounded" placeholder="Full Name" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} required />
            <input className="border border-slate-300 p-2 rounded" placeholder="Father Name" value={form.fatherName} onChange={(e) => updateField("fatherName", e.target.value)} required />
            <input className="border border-slate-300 p-2 rounded" placeholder="Mobile" value={form.mobile} onChange={(e) => updateField("mobile", e.target.value)} required />
            <input type="email" className="border border-slate-300 p-2 rounded" placeholder="Email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
            <input className="border border-slate-300 p-2 rounded" placeholder="Occupation" value={form.occupation} onChange={(e) => updateField("occupation", e.target.value)} required />
            <input type="number" className="border border-slate-300 p-2 rounded" placeholder="Annual Income" value={form.annualIncome} onChange={(e) => updateField("annualIncome", e.target.value)} required />
            <select
              className="border border-slate-300 p-2 rounded"
              value={form.membershipPriceId}
              onChange={(e) => {
                const value = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  membershipPriceId: value,
                  membershipType: "one-time",
                }));
              }}
            >
              {settings.membershipOptions?.length ? (
                settings.membershipOptions.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name?.trim() || `Plan ${item.price}`} - {item.price}
                  </option>
                ))
              ) : (
                <option value="">No plan configured</option>
              )}
            </select>
            <input className="border border-slate-300 p-2 rounded bg-slate-50" value={`Membership Fee: ${membershipFee}`} readOnly />
          </div>

          <textarea className="border border-slate-300 p-2 rounded mt-4 w-full" placeholder="Address" value={form.address} onChange={(e) => updateField("address", e.target.value)} required />

          <div className="mt-4">
            <label htmlFor="profileImage" className="text-sm text-slate-600">Profile Photo</label>
            <input id="profileImage" type="file" accept="image/*" className="block mt-2 text-sm" onChange={(e) => setProfileImage(e.target.files?.[0] || null)} />
          </div>

          <button type="submit" disabled={loading} className="mt-5 w-full sm:w-auto bg-blue-900 hover:bg-blue-950 disabled:opacity-60 text-white px-4 py-2 rounded inline-flex items-center justify-center gap-2">
            {loading ? <Spinner /> : null}
            {loading ? "Submitting..." : "Submit & Auto Login"}
          </button>
          <p className="text-xs text-slate-500 mt-2">Membership status will be pending until admin approval.</p>
        </form>

        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-blue-950 mb-3">Admin QR Code</h3>
          {settings.paymentQrImage ? (
            <img src={`${baseUrl}${settings.paymentQrImage}`} alt="Payment QR" className="w-full rounded border border-slate-200" />
          ) : (
            <p className="text-sm text-slate-500">QR code will appear here after admin upload.</p>
          )}

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-sm text-slate-700">
            <p><span className="font-medium text-slate-900">Bank:</span> {settings.bankName || "-"}</p>
            <p><span className="font-medium text-slate-900">Account Name:</span> {settings.accountHolderName || "-"}</p>
            <p><span className="font-medium text-slate-900">Account Number:</span> {settings.accountNumber || "-"}</p>
            <p><span className="font-medium text-slate-900">IFSC:</span> {settings.ifscCode || "-"}</p>
            <p><span className="font-medium text-slate-900">UPI ID:</span> {settings.upiId || "-"}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
