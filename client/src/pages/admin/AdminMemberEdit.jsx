import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import AdminLayout from "./AdminLayout";
import Spinner from "../../components/Spinner";
import { useToast } from "../../context/ToastContext";

const emptyEditForm = {
  fullName: "",
  fatherName: "",
  mobile: "",
  email: "",
  address: "",
  occupation: "",
  annualIncome: "",
  membershipPriceId: "",
  status: "pending",
};

export default function AdminMemberEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();

  const [edit, setEdit] = useState(emptyEditForm);
  const [membershipOptions, setMembershipOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [memberRes, settingsRes] = await Promise.all([
          api.get(`/admin/members/${id}`),
          api.get("/settings"),
        ]);

        const member = memberRes.data;
        const options = settingsRes.data?.membershipOptions || [];
        setMembershipOptions(options);

        setEdit({
          fullName: member.fullName || "",
          fatherName: member.fatherName || "",
          mobile: member.mobile || "",
          email: member.email || "",
          address: member.address || "",
          occupation: member.occupation || "",
          annualIncome: member.annualIncome || "",
          membershipPriceId: member.membershipPlanId || options?.[0]?._id || "",
          status: member.status || "pending",
        });
      } catch (err) {
        toast.error(err?.response?.data?.msg || "Unable to load member details.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, toast]);

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put(`/admin/members/${id}`, edit);
      toast.success("Member updated.");
      nav("/admin/members");
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to update member.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold text-blue-950">Edit Member</h2>
        <Link to="/admin/members" className="text-sm border border-slate-300 rounded px-3 py-1.5">
          Back to Members
        </Link>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center">
          <Spinner size="lg" className="border-blue-900 border-r-transparent" />
        </div>
      ) : (
        <form onSubmit={saveEdit} className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="grid md:grid-cols-2 gap-4">
            <input
              className="border border-slate-300 p-2 rounded"
              value={edit.fullName}
              onChange={(e) => setEdit({ ...edit, fullName: e.target.value })}
              required
            />
            <input
              className="border border-slate-300 p-2 rounded"
              value={edit.fatherName}
              onChange={(e) => setEdit({ ...edit, fatherName: e.target.value })}
              required
            />
            <input
              className="border border-slate-300 p-2 rounded"
              value={edit.mobile}
              onChange={(e) => setEdit({ ...edit, mobile: e.target.value })}
              required
            />
            <input
              className="border border-slate-300 p-2 rounded"
              type="email"
              value={edit.email}
              onChange={(e) => setEdit({ ...edit, email: e.target.value })}
              required
            />
            <input
              className="border border-slate-300 p-2 rounded"
              value={edit.occupation}
              onChange={(e) => setEdit({ ...edit, occupation: e.target.value })}
              required
            />
            <input
              type="number"
              className="border border-slate-300 p-2 rounded"
              value={edit.annualIncome}
              onChange={(e) => setEdit({ ...edit, annualIncome: e.target.value })}
              required
            />
            <select
              className="border border-slate-300 p-2 rounded"
              value={edit.membershipPriceId}
              onChange={(e) => setEdit({ ...edit, membershipPriceId: e.target.value })}
            >
              <option value="">Select Plan</option>
              {membershipOptions.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name?.trim() || `Plan ${item.price}`} - {item.price}
                </option>
              ))}
            </select>
            <select
              className="border border-slate-300 p-2 rounded"
              value={edit.status}
              onChange={(e) => setEdit({ ...edit, status: e.target.value })}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <textarea
            className="border border-slate-300 p-2 rounded mt-4 w-full"
            value={edit.address}
            onChange={(e) => setEdit({ ...edit, address: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:flex gap-2 mt-4">
            <button
              type="submit"
              className="w-full sm:w-auto bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded inline-flex items-center justify-center gap-2 disabled:opacity-60"
              disabled={saving}
            >
              {saving ? <Spinner /> : null}
              {saving ? "Saving..." : "Save"}
            </button>
            <Link
              to="/admin/members"
              className="w-full sm:w-auto border border-slate-300 px-4 py-2 rounded text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </AdminLayout>
  );
}
