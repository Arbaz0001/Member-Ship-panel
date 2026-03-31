import React, { useState } from "react";
import api from "../../api/client";
import AdminLayout from "./AdminLayout";
import Spinner from "../../components/Spinner";
import { useToast } from "../../context/ToastContext";

const emptyMemberForm = {
  fullName: "",
  fatherName: "",
  mobile: "",
  email: "",
  address: "",
  occupation: "",
  annualIncome: "",
  membershipType: "two-year",
  status: "approved",
  password: "",
};

export default function AdminMemberCreate() {
  const toast = useToast();
  const [newMember, setNewMember] = useState(emptyMemberForm);
  const [creating, setCreating] = useState(false);

  const createMember = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      await api.post("/admin/members", newMember);
      toast.success("Member record created successfully.");
      setNewMember(emptyMemberForm);
    } catch (err) {
      toast.error(err?.response?.data?.msg || "We were unable to create the member record.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminLayout>
      <h2 className="text-xl font-semibold text-blue-950 mb-4">Create Member</h2>

      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={createMember} className="grid md:grid-cols-2 gap-3">
          <input
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            placeholder="Full Name"
            value={newMember.fullName}
            onChange={(e) => setNewMember((prev) => ({ ...prev, fullName: e.target.value }))}
            required
          />
          <input
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            placeholder="Father Name"
            value={newMember.fatherName}
            onChange={(e) => setNewMember((prev) => ({ ...prev, fatherName: e.target.value }))}
            required
          />
          <input
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            placeholder="Mobile"
            value={newMember.mobile}
            onChange={(e) => setNewMember((prev) => ({ ...prev, mobile: e.target.value }))}
            required
          />
          <input
            type="email"
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            placeholder="Email"
            value={newMember.email}
            onChange={(e) => setNewMember((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <input
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            placeholder="Occupation"
            value={newMember.occupation}
            onChange={(e) => setNewMember((prev) => ({ ...prev, occupation: e.target.value }))}
            required
          />
          <input
            type="number"
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            placeholder="Annual Income"
            value={newMember.annualIncome}
            onChange={(e) => setNewMember((prev) => ({ ...prev, annualIncome: e.target.value }))}
            required
          />
          <select
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            value={newMember.membershipType}
            onChange={(e) => setNewMember((prev) => ({ ...prev, membershipType: e.target.value }))}
          >
            <option value="two-year">Two Year</option>
            <option value="lifetime">Lifetime</option>
          </select>
          <select
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            value={newMember.status}
            onChange={(e) => setNewMember((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <input
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm md:col-span-2"
            placeholder="Address"
            value={newMember.address}
            onChange={(e) => setNewMember((prev) => ({ ...prev, address: e.target.value }))}
            required
          />
          <input
            type="password"
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm md:col-span-2"
            placeholder="Password (optional, defaults to mobile)"
            value={newMember.password}
            onChange={(e) => setNewMember((prev) => ({ ...prev, password: e.target.value }))}
          />
          <button
            type="submit"
            className="md:col-span-2 w-full sm:w-fit bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
            disabled={creating}
          >
            {creating ? <Spinner /> : null}
            {creating ? "Creating..." : "Create Member"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
