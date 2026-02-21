import React, { useEffect, useState } from "react";
import api from "../api/client";
import MemberLayout from "../components/MemberLayout";
import Spinner from "../components/Spinner";
import { useToast } from "../context/ToastContext";

const cards = [
  { key: "imdad", label: "Imdad" },
  { key: "zakat", label: "Zakat" },
  { key: "fitra", label: "Fitra" },
  { key: "blindDonation", label: "Blind Donation" },
];

const baseUrl = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function Dashboard() {
  const toast = useToast();
  const [member, setMember] = useState(null);
  const [settings, setSettings] = useState({
    paymentQrImage: "",
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
  });
  const [selectedCategory, setSelectedCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [memberRes, settingRes] = await Promise.all([
        api.get("/members/me"),
        api.get("/settings"),
      ]);

      setMember(memberRes.data);
      setSettings(
        settingRes.data || {
          paymentQrImage: "",
          bankName: "",
          accountHolderName: "",
          accountNumber: "",
          ifscCode: "",
          upiId: "",
        }
      );
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const submitPayment = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      const data = new FormData();
      data.append("category", selectedCategory);
      data.append("amount", amount);
      if (screenshot) data.append("screenshot", screenshot);

      await api.post("/payment/submit", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Payment submitted successfully.");
      setAmount("");
      setScreenshot(null);
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Payment submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MemberLayout title="Dashboard">
      {loading ? (
        <div className="py-10 flex justify-center">
          <Spinner size="lg" className="border-blue-900 border-r-transparent" />
        </div>
      ) : (
        <>
      <div className="mb-6">
        <div className="bg-gradient-to-r from-blue-950 to-blue-900 rounded-2xl p-4 sm:p-5 text-white shadow-sm">
          <p className="text-xs uppercase tracking-wide text-blue-100">Member ID Card</p>
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-4">
            {member?.profileImage ? (
              <img
                src={`${baseUrl}${member.profileImage}`}
                alt="Member"
                className="h-20 w-20 rounded-xl object-cover border border-white/40 bg-white/10"
              />
            ) : (
              <div className="h-20 w-20 rounded-xl border border-white/40 bg-white/10 flex items-center justify-center text-2xl font-semibold">
                {member?.fullName?.[0]?.toUpperCase() || "M"}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-xl font-semibold truncate">{member?.fullName || "-"}</h2>
              <p className="text-sm text-blue-100 truncate">Member ID: {member?.memberId || "-"}</p>
              <p className="text-sm text-blue-100 truncate">Phone: {member?.mobile || "-"}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            <p className="bg-white/10 rounded-lg px-3 py-2 capitalize">Type: {member?.membershipType || "-"}</p>
            <p className="bg-white/10 rounded-lg px-3 py-2 capitalize">Status: {member?.status || "pending"}</p>
            <p className="bg-white/10 rounded-lg px-3 py-2">Email: {member?.email || "-"}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-slate-500">Membership Type</p>
          <h3 className="text-xl font-semibold text-blue-950 capitalize">
            {member?.membershipType || "-"}
          </h3>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-slate-500">Membership Status</p>
          <h3 className="text-xl font-semibold text-blue-950 capitalize">
            {member?.status || "pending"}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((item) => (
          <button
            key={item.key}
            onClick={() => setSelectedCategory(item.key)}
            className={`rounded-xl border p-5 text-left transition ${
              selectedCategory === item.key
                ? "border-blue-900 bg-blue-50"
                : "border-slate-200 bg-white hover:border-blue-900"
            }`}
          >
            <h4 className="font-semibold text-blue-950">{item.label}</h4>
            <p className="text-xs text-slate-500 mt-1">Click to pay</p>
          </button>
        ))}
      </div>

      {selectedCategory && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
            <h3 className="font-semibold text-blue-950 mb-3">Admin QR Code</h3>
            <div className="space-y-4">
              {settings?.paymentQrImage ? (
                <img
                  src={`${baseUrl}${settings.paymentQrImage}`}
                  alt="Payment QR"
                  className="w-full max-w-sm rounded border border-slate-200"
                />
              ) : (
                <p className="text-sm text-slate-500">Admin has not uploaded QR yet.</p>
              )}

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-sm text-slate-700">
                <p><span className="font-medium text-slate-900">Bank:</span> {settings.bankName || "-"}</p>
                <p><span className="font-medium text-slate-900">Account Name:</span> {settings.accountHolderName || "-"}</p>
                <p><span className="font-medium text-slate-900">Account Number:</span> {settings.accountNumber || "-"}</p>
                <p><span className="font-medium text-slate-900">IFSC:</span> {settings.ifscCode || "-"}</p>
                <p><span className="font-medium text-slate-900">UPI ID:</span> {settings.upiId || "-"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
            <h3 className="font-semibold text-blue-950 mb-3">{cards.find((c) => c.key === selectedCategory)?.label} Payment</h3>
            <form onSubmit={submitPayment} className="space-y-3">
              <input
                type="number"
                min="1"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <input
                type="file"
                accept="image/*"
                className="block text-sm"
                onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                required
              />

              <button
                type="submit"
                className="w-full sm:w-auto bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? <Spinner /> : null}
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </MemberLayout>
  );
}
