import React, { useEffect, useState } from "react";
import api from "../../api/client";
import AdminLayout from "./AdminLayout";

export default function AdminDashboard() {
  const [summary, setSummary] = useState({
    totalMembers: 0,
    lifetimeMembers: 0,
    oneTimeMembers: 0,
    pendingMembershipRequests: 0,
    pendingPaymentRequests: 0,
  });

  useEffect(() => {
    const load = async () => {
      const res = await api.get("/admin/dashboard");
      setSummary(res.data);
    };
    load();
  }, []);

  return (
    <AdminLayout>
      <h2 className="text-lg sm:text-xl font-semibold text-blue-950 mb-3 sm:mb-4">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-lg sm:rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs uppercase text-slate-500 mb-1">Total Members</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{summary.totalMembers}</h2>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-lg sm:rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs uppercase text-slate-500 mb-1">Lifetime Members</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{summary.lifetimeMembers}</h2>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-lg sm:rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs uppercase text-slate-500 mb-1">One Time Members</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{summary.oneTimeMembers}</h2>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-lg sm:rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs uppercase text-slate-500 mb-1">Pending Membership Requests</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{summary.pendingMembershipRequests}</h2>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-lg sm:rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs uppercase text-slate-500 mb-1">Pending Payment Requests</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{summary.pendingPaymentRequests}</h2>
        </div>
      </div>
    </AdminLayout>
  );
}
