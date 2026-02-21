import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/client";
import AdminLayout from "./AdminLayout";
import Spinner from "../../components/Spinner";
import { useToast } from "../../context/ToastContext";

const baseUrl = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function AdminPayments() {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState("");
  const limit = 10;

  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/payments", {
        params: { status: status || undefined, page, limit },
      });
      setPayments(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to load payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    console.log("AdminPayments loaded - Token:", !!token ? token.slice(0, 20) + "..." : null, "Role:", role);
    load();
  }, [status, page]);

  const setPaymentStatus = async (id, nextStatus) => {
    try {
      setActioningId(id);
      await api.patch(`/admin/payments/${id}/status`, { status: nextStatus });
      toast.success(`Payment ${nextStatus}.`);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to update payment.");
    } finally {
      setActioningId("");
    }
  };

  return (
    <AdminLayout>
      <h2 className="text-xl font-semibold text-blue-950 mb-4">Payment Management</h2>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="font-semibold">Payment Requests</h3>
          <select
            className="w-full sm:w-auto border border-slate-300 rounded px-3 py-2 text-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-8 flex justify-center">
              <Spinner size="lg" className="border-blue-900 border-r-transparent" />
            </div>
          ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3">Member</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Screenshot</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment._id} className="border-t border-slate-200">
                  <td className="px-4 py-3">
                    <div className="font-medium">{payment.userId?.name || "N/A"}</div>
                    <div className="text-xs text-slate-500">{payment.userId?.email || ""}</div>
                  </td>
                  <td className="px-4 py-3 capitalize">{payment.category}</td>
                  <td className="px-4 py-3">{payment.amount}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`${baseUrl}${payment.screenshot}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-900 underline"
                    >
                      View
                    </a>
                  </td>
                  <td className="px-4 py-3 capitalize">{payment.status}</td>
                  <td className="px-4 py-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setPaymentStatus(payment._id, "approved")}
                      className="text-xs px-2 py-1 rounded bg-emerald-600 text-white inline-flex items-center gap-1 disabled:opacity-60"
                      disabled={actioningId === payment._id}
                    >
                      {actioningId === payment._id ? <Spinner className="border-emerald-50 border-r-transparent" /> : null}
                      Approve
                    </button>
                    <button
                      onClick={() => setPaymentStatus(payment._id, "rejected")}
                      className="text-xs px-2 py-1 rounded bg-rose-600 text-white inline-flex items-center gap-1 disabled:opacity-60"
                      disabled={actioningId === payment._id}
                    >
                      {actioningId === payment._id ? <Spinner className="border-rose-50 border-r-transparent" /> : null}
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-slate-500">
                    No payment requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
          <span className="text-slate-500">
            Page {page} of {totalPages || 1}
          </span>
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-2 rounded border border-slate-300 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-2 rounded border border-slate-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
