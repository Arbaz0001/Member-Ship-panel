import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import logo from "../assets/ssp.jpeg";

export default function Register() {
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
    membershipOptions: [],
    paymentQrImage: "",
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  const submit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setMessage("");
      const data = new FormData();
      const payload = {
        ...form,
        membershipType: "one-time",
      };

      Object.entries(payload).forEach(([key, value]) => data.append(key, value));
      if (profileImage) data.append("profileImage", profileImage);
      const res = await api.post("/members/apply", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(res.data.message || "Submitted successfully");
      setForm({
        fullName: "",
        fatherName: "",
        mobile: "",
        email: "",
        address: "",
        occupation: "",
        annualIncome: "",
        membershipType: "one-time",
        membershipPriceId: settings.membershipOptions?.[0]?._id || "",
      });
      setProfileImage(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Submission failed. Please check the form.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <img src={logo} alt="SSP Logo" className="h-12 w-auto object-contain" />
          <Link to="/" className="text-sm text-blue-900">
            Back to home
          </Link>
        </div>

        <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
          <form
            onSubmit={submit}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <input
                className="border p-2 rounded"
                placeholder="Full Name"
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                required
              />
              <input
                className="border p-2 rounded"
                placeholder="Father Name"
                value={form.fatherName}
                onChange={(e) => updateField("fatherName", e.target.value)}
                required
              />
              <input
                className="border p-2 rounded"
                placeholder="Mobile"
                value={form.mobile}
                onChange={(e) => updateField("mobile", e.target.value)}
                required
              />
              <input
                className="border p-2 rounded"
                placeholder="Email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
              />
              <input
                className="border p-2 rounded"
                placeholder="Occupation"
                value={form.occupation}
                onChange={(e) => updateField("occupation", e.target.value)}
                required
              />
              <input
                className="border p-2 rounded"
                placeholder="Annual Income"
                type="number"
                value={form.annualIncome}
                onChange={(e) => updateField("annualIncome", e.target.value)}
                required
              />
            </div>

            <textarea
              className="border p-2 rounded mt-4 w-full"
              placeholder="Address"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              required
            />

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <select
                className="border p-2 rounded"
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
              <input
                className="border p-2 rounded bg-slate-50"
                value={`Membership Fee: ${membershipFee}`}
                readOnly
              />
            </div>

            <div className="mt-4">
              <label htmlFor="profileImage" className="text-sm text-slate-600">Profile Photo</label>
              <input
                id="profileImage"
                type="file"
                accept="image/*"
                className="block mt-2 text-sm"
                onChange={(e) => setProfileImage(e.target.files[0])}
              />
            </div>

            {message && <p className="text-green-600 text-sm mt-3">{message}</p>}
            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

            <button
              type="submit"
              className="mt-5 bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded"
            >
              Submit Application
            </button>
          </form>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-semibold mb-3">Payment QR</h3>
            {settings.paymentQrImage ? (
              <img
                src={`${import.meta.env.VITE_API_BASE || "http://localhost:5000"}${
                  settings.paymentQrImage
                }`}
                alt="Payment QR"
                className="w-full rounded border"
              />
            ) : (
              <p className="text-sm text-slate-500">Admin will upload QR soon.</p>
            )}
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-sm text-slate-700">
              <p><span className="font-medium text-slate-900">Bank:</span> {settings.bankName || "-"}</p>
              <p><span className="font-medium text-slate-900">Account Name:</span> {settings.accountHolderName || "-"}</p>
              <p><span className="font-medium text-slate-900">Account Number:</span> {settings.accountNumber || "-"}</p>
              <p><span className="font-medium text-slate-900">IFSC:</span> {settings.ifscCode || "-"}</p>
              <p><span className="font-medium text-slate-900">UPI ID:</span> {settings.upiId || "-"}</p>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              After payment, submit the form. Admin will review and approve.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
