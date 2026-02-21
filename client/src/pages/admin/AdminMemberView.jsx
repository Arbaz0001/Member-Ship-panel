import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/client";
import AdminLayout from "./AdminLayout";
import Spinner from "../../components/Spinner";
import { useToast } from "../../context/ToastContext";

const baseUrl = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function AdminMemberView() {
  const { id } = useParams();
  const toast = useToast();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!id || hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/admin/members/${id}`);
        setMember(res.data || null);
      } catch (err) {
        setMember(null);
        toast.error(err?.response?.data?.msg || err?.response?.data?.message || "Unable to load member.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, toast]);

  let content = null;
  if (loading) {
    content = (
      <div className="py-10 flex justify-center">
        <Spinner size="lg" className="border-blue-900 border-r-transparent" />
      </div>
    );
  } else if (member) {
    content = (
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid md:grid-cols-[120px_1fr] gap-4">
          {member.profileImage ? (
            <img
              src={`${baseUrl}${member.profileImage}`}
              alt={member.fullName}
              className="h-28 w-28 rounded-lg object-cover border border-slate-200"
            />
          ) : (
            <div className="h-28 w-28 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-2xl font-semibold text-slate-500">
              {member.fullName?.[0]?.toUpperCase() || "M"}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-2 text-sm text-slate-700">
            <p><span className="font-medium text-slate-900">Name:</span> {member.fullName || "-"}</p>
            <p><span className="font-medium text-slate-900">Father Name:</span> {member.fatherName || "-"}</p>
            <p><span className="font-medium text-slate-900">Member ID:</span> {member.memberId || "-"}</p>
            <p><span className="font-medium text-slate-900">Mobile:</span> {member.mobile || "-"}</p>
            <p><span className="font-medium text-slate-900">Email:</span> {member.email || "-"}</p>
            <p><span className="font-medium text-slate-900">Occupation:</span> {member.occupation || "-"}</p>
            <p><span className="font-medium text-slate-900">Income:</span> {member.annualIncome || "-"}</p>
            <p><span className="font-medium text-slate-900">Status:</span> {member.status || "-"}</p>
            <p><span className="font-medium text-slate-900">Plan:</span> {member.membershipPlanName || "-"}</p>
            <p><span className="font-medium text-slate-900">Fee:</span> {member.membershipFee || 0}</p>
            <p className="sm:col-span-2"><span className="font-medium text-slate-900">Address:</span> {member.address || "-"}</p>
          </div>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="bg-white p-4 rounded-xl border border-slate-200 text-sm text-slate-500">
        Member not found.
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold text-blue-950">Member View</h2>
        <Link to="/admin/members" className="text-sm border border-slate-300 rounded px-3 py-1.5">
          Back to Members
        </Link>
      </div>

      {content}
    </AdminLayout>
  );
}
