import React, { useEffect, useState, useRef } from "react";
import api from "../api/client";
import MemberLayout from "../components/MemberLayout";
import Spinner from "../components/Spinner";
import { useToast } from "../context/ToastContext";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const cards = [
  { key: "imdad", label: "Imdad" },
  { key: "zakat", label: "Zakat" },
  { key: "fitra", label: "Fitra" },
  { key: "blindDonation", label: "Blind Donation" },
];

const baseUrl = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function Dashboard() {
  const toast = useToast();
  const idCardRef = useRef(null);
  const idCardPdfRef = useRef(null);
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
  const [downloadingCard, setDownloadingCard] = useState(false);

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

      toast.success("Your payment has been submitted successfully.");
      setAmount("");
      setScreenshot(null);
    } catch (err) {
      toast.error(err?.response?.data?.msg || "We were unable to submit your payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadIdCard = async () => {
    if (!idCardPdfRef.current || !member) {
      toast.error("Member profile data is not available.");
      return;
    }

    try {
      setDownloadingCard(true);
      const canvas = await html2canvas(idCardPdfRef.current, {
        scale: 3,
        logging: false,
        useCORS: true,
        backgroundColor: "#ffffff",
        allowTaint: true,
        letterRendering: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [101.6, 152.4], // ID card size (4x6 inches)
      });

      pdf.addImage(imgData, "PNG", 0, 0, 152.4, 101.6);
      pdf.save(`${member?.memberId || "member"}-id-card.pdf`);

      toast.success("Your ID card has been downloaded successfully.");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("We were unable to download the ID card. Please try again.");
    } finally {
      setDownloadingCard(false);
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
        <div ref={idCardRef} className="bg-gradient-to-r from-blue-950 to-blue-900 rounded-2xl p-4 sm:p-5 text-white shadow-sm">
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
        <button
          onClick={downloadIdCard}
          disabled={downloadingCard || !member}
          className="mt-3 w-full sm:w-auto bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {downloadingCard ? <Spinner size="sm" /> : null}
          {downloadingCard ? "Generating..." : "📥 Download ID Card"}
        </button>
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
      
      {/* Hidden PDF Template */}
      <div
        ref={idCardPdfRef}
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1440px",
          height: "960px",
          backgroundColor: "#ffffff",
          padding: "40px",
          fontFamily: "Arial, sans-serif",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#000", margin: "0 0 10px 0" }}>
            MEMBER ID CARD
          </h1>
          <div style={{ height: "2px", backgroundColor: "#1e3a8a", marginBottom: "20px" }}></div>
        </div>

        <div style={{ display: "flex", gap: "30px", marginBottom: "30px" }}>
          <div>
            {member?.profileImage ? (
              <img
                src={`${baseUrl}${member.profileImage}`}
                alt="Member"
                style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "8px",
                  objectFit: "cover",
                  border: "2px solid #1e3a8a",
                }}
              />
            ) : (
              <div
                style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "8px",
                  border: "2px solid #1e3a8a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "48px",
                  fontWeight: "bold",
                  color: "#1e3a8a",
                  backgroundColor: "#f0f4f8",
                }}
              >
                {member?.fullName?.[0]?.toUpperCase() || "M"}
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: "15px" }}>
              <p style={{ margin: "0", fontSize: "12px", color: "#666", fontWeight: "600" }}>
                FULL NAME
              </p>
              <p style={{ margin: "5px 0 0 0", fontSize: "20px", fontWeight: "bold", color: "#000" }}>
                {member?.fullName || "-"}
              </p>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <p style={{ margin: "0", fontSize: "12px", color: "#666", fontWeight: "600" }}>
                MEMBER ID
              </p>
              <p style={{ margin: "5px 0 0 0", fontSize: "18px", fontWeight: "bold", color: "#1e3a8a" }}>
                {member?.memberId || "-"}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <p style={{ margin: "0", fontSize: "12px", color: "#666", fontWeight: "600" }}>
                  MOBILE
                </p>
                <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: "#000" }}>
                  {member?.mobile || "-"}
                </p>
              </div>
              <div>
                <p style={{ margin: "0", fontSize: "12px", color: "#666", fontWeight: "600" }}>
                  EMAIL
                </p>
                <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: "#000" }}>
                  {member?.email || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "20px" }}>
          <div
            style={{
              border: "1px solid #ccc",
              padding: "12px",
              borderRadius: "6px",
              backgroundColor: "#f9fafb",
            }}
          >
            <p style={{ margin: "0", fontSize: "11px", color: "#666", fontWeight: "600" }}>
              TYPE
            </p>
            <p style={{ margin: "5px 0 0 0", fontSize: "16px", fontWeight: "bold", color: "#000", textTransform: "capitalize" }}>
              {member?.membershipType || "-"}
            </p>
          </div>

          <div
            style={{
              border: "1px solid #ccc",
              padding: "12px",
              borderRadius: "6px",
              backgroundColor: "#f9fafb",
            }}
          >
            <p style={{ margin: "0", fontSize: "11px", color: "#666", fontWeight: "600" }}>
              STATUS
            </p>
            <p style={{ margin: "5px 0 0 0", fontSize: "16px", fontWeight: "bold", color: "#000", textTransform: "capitalize" }}>
              {member?.status || "pending"}
            </p>
          </div>

          <div
            style={{
              border: "1px solid #ccc",
              padding: "12px",
              borderRadius: "6px",
              backgroundColor: "#f9fafb",
            }}
          >
            <p style={{ margin: "0", fontSize: "11px", color: "#666", fontWeight: "600" }}>
              MEMBERSHIP YEAR
            </p>
            <p style={{ margin: "5px 0 0 0", fontSize: "16px", fontWeight: "bold", color: "#000" }}>
              2026
            </p>
          </div>
        </div>

        <div
          style={{
            borderTop: "2px solid #1e3a8a",
            paddingTop: "15px",
            marginTop: "15px",
            textAlign: "center",
          }}
        >
          <p style={{ margin: "0", fontSize: "10px", color: "#666" }}>
            This card proves your membership. Please keep it safe.
          </p>
        </div>
      </div>

        </>
      )}
    </MemberLayout>
  );
}
