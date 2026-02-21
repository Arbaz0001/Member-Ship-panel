import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import AdminLayout from "./AdminLayout";
import Spinner from "../../components/Spinner";
import ConfirmModal from "../../components/ConfirmModal";
import { useToast } from "../../context/ToastContext";

export default function AdminMembers() {
  const toast = useToast();
  const nav = useNavigate();
  const [members, setMembers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [actioningId, setActioningId] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState("");
  const limit = 8;

  const totalPages = useMemo(() => Math.ceil(total / limit), [total]);

  const load = async () => {
    try {
      setLoadingList(true);
      const res = await api.get("/admin/members", {
        params: {
          page,
          limit,
          q: search || undefined,
          status: status || undefined,
        },
      });
      setMembers(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to load members.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, search, status]);

  const updateStatus = async (id, nextStatus) => {
    try {
      setActioningId(id);
      await api.patch(`/admin/members/${id}/status`, { status: nextStatus });
      toast.success(`Member ${nextStatus}.`);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to update member status.");
    } finally {
      setActioningId("");
    }
  };

  const removeMember = async () => {
    if (!confirmDeleteId) return;
    try {
      setActioningId(confirmDeleteId);
      await api.delete(`/admin/members/${confirmDeleteId}`);
      setConfirmDeleteId("");
      toast.success("Member deleted.");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to delete member.");
    } finally {
      setActioningId("");
    }
  };

  return (
    <AdminLayout>
      <h2 className="text-xl font-semibold text-blue-950 mb-4">Members List</h2>

      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h3 className="font-semibold">All Members</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full md:w-auto">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loadingList ? (
            <div className="py-8 flex justify-center">
              <Spinner size="lg" className="border-blue-900 border-r-transparent" />
            </div>
          ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3">Member</th>
                <th className="text-left px-4 py-3">Plan</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member._id} className="border-t border-slate-200">
                  <td className="px-4 py-3">
                    <div className="font-medium">{member.fullName}</div>
                    <div className="text-xs text-slate-500">
                      {member.memberId} · {member.mobile}
                    </div>
                  </td>
                  <td className="px-4 py-3">{member.membershipPlanName || "-"}</td>
                  <td className="px-4 py-3 capitalize">{member.status}</td>
                  <td className="px-4 py-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => nav(`/admin/members/${member._id}`)}
                      className="text-xs px-2 py-1 rounded border border-slate-300"
                    >
                      View
                    </button>
                    <button
                      onClick={() => updateStatus(member._id, "approved")}
                      className="text-xs px-2 py-1 rounded bg-emerald-600 text-white inline-flex items-center gap-1 disabled:opacity-60"
                      disabled={actioningId === member._id}
                    >
                      {actioningId === member._id ? <Spinner className="border-emerald-50 border-r-transparent" /> : null}
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(member._id, "rejected")}
                      className="text-xs px-2 py-1 rounded bg-rose-600 text-white inline-flex items-center gap-1 disabled:opacity-60"
                      disabled={actioningId === member._id}
                    >
                      {actioningId === member._id ? <Spinner className="border-rose-50 border-r-transparent" /> : null}
                      Reject
                    </button>
                    <button
                      onClick={() => nav(`/admin/members/${member._id}/edit`)}
                      className="text-xs px-2 py-1 rounded border border-slate-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(member._id)}
                      className="text-xs px-2 py-1 rounded border border-slate-300"
                      disabled={actioningId === member._id}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={4}>
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>

        <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
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

      <ConfirmModal
        open={Boolean(confirmDeleteId)}
        title="Delete Member"
        message="This action cannot be undone. Do you want to continue?"
        confirmText={actioningId === confirmDeleteId ? "Deleting..." : "Delete"}
        onConfirm={removeMember}
        onCancel={() => setConfirmDeleteId("")}
      />
    </AdminLayout>
  );
}
