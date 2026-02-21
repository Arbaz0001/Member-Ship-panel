import React, { useEffect, useState } from "react";
import api from "../../api/client";
import AdminLayout from "./AdminLayout";
import Spinner from "../../components/Spinner";
import { useToast } from "../../context/ToastContext";

const baseUrl = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function AdminSettings() {
  const toast = useToast();
  const [settings, setSettings] = useState({
    qrCodeImage: "",
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
  });
  const [qrImage, setQrImage] = useState(null);
  const [form, setForm] = useState({
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  let qrContent = <p className="text-sm text-slate-500 mb-4">No active QR code uploaded.</p>;

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/settings");
      const nextSettings = {
        qrCodeImage: res.data?.qrCodeImage || "",
        bankName: res.data?.bankName || "",
        accountHolderName: res.data?.accountHolderName || "",
        accountNumber: res.data?.accountNumber || "",
        ifscCode: res.data?.ifscCode || "",
        upiId: res.data?.upiId || "",
      };
      setSettings(nextSettings);
      setForm({
        bankName: nextSettings.bankName,
        accountHolderName: nextSettings.accountHolderName,
        accountNumber: nextSettings.accountNumber,
        ifscCode: nextSettings.ifscCode,
        upiId: nextSettings.upiId,
      });
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const uploadQr = async () => {
    if (!qrImage) return;
    try {
      setUploading(true);
      const data = new FormData();
      data.append("qrCodeImage", qrImage);
      await api.post("/admin/settings/qr", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await load();
      toast.success("QR code uploaded and set active.");
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to upload QR code.");
    } finally {
      setUploading(false);
    }
  };

  const updateFormValue = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const savePaymentDetails = async (event) => {
    event.preventDefault();
    try {
      setSavingDetails(true);
      const res = await api.put("/settings/payment-details", form);
      setSettings((prev) => ({
        ...prev,
        bankName: res.data?.bankName || "",
        accountHolderName: res.data?.accountHolderName || "",
        accountNumber: res.data?.accountNumber || "",
        ifscCode: res.data?.ifscCode || "",
        upiId: res.data?.upiId || "",
      }));
      toast.success("Payment details updated.");
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to save payment details.");
    } finally {
      setSavingDetails(false);
    }
  };

  if (loading) {
    qrContent = (
      <div className="py-8 flex justify-center">
        <Spinner size="lg" className="border-blue-900 border-r-transparent" />
      </div>
    );
  } else if (settings?.qrCodeImage) {
    qrContent = (
      <img
        src={`${baseUrl}${settings.qrCodeImage}`}
        alt="Active QR"
        className="w-56 max-w-full rounded border border-slate-200 mb-4"
      />
    );
  }

  return (
    <AdminLayout>
      <h2 className="text-xl font-semibold text-blue-950 mb-4">Settings</h2>
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-semibold mb-4">QR Code Upload (Single Active)</h3>

        {qrContent}

        <div>
          <label htmlFor="qrImage" className="text-sm text-slate-600">Upload New QR Code</label>
          <input
            id="qrImage"
            type="file"
            accept="image/*"
            className="block mt-2 text-sm w-full"
            onChange={(e) => setQrImage(e.target.files[0])}
          />
          <button
            onClick={uploadQr}
            className="mt-3 w-full sm:w-auto border border-slate-200 px-4 py-2 rounded inline-flex items-center justify-center gap-2 disabled:opacity-60"
            disabled={uploading}
          >
            {uploading ? <Spinner className="border-blue-900 border-r-transparent" /> : null}
            {uploading ? "Uploading..." : "Upload QR"}
          </button>
        </div>

        <hr className="my-6 border-slate-200" />

        <h3 className="font-semibold mb-4">Bank Details & UPI</h3>
        <form onSubmit={savePaymentDetails} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            name="bankName"
            type="text"
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            placeholder="Bank name"
            value={form.bankName}
            onChange={updateFormValue}
          />
          <input
            name="accountHolderName"
            type="text"
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            placeholder="Account holder name"
            value={form.accountHolderName}
            onChange={updateFormValue}
          />
          <input
            name="accountNumber"
            type="text"
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            placeholder="Account number"
            value={form.accountNumber}
            onChange={updateFormValue}
          />
          <input
            name="ifscCode"
            type="text"
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm uppercase"
            placeholder="IFSC code"
            value={form.ifscCode}
            onChange={updateFormValue}
          />
          <input
            name="upiId"
            type="text"
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm sm:col-span-2"
            placeholder="UPI ID"
            value={form.upiId}
            onChange={updateFormValue}
          />

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full sm:w-auto border border-slate-200 px-4 py-2 rounded inline-flex items-center justify-center gap-2 disabled:opacity-60"
              disabled={savingDetails}
            >
              {savingDetails ? <Spinner className="border-blue-900 border-r-transparent" /> : null}
              {savingDetails ? "Saving..." : "Save Details"}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
