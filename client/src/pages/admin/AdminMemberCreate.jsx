import React, { useEffect, useState } from "react";
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
  membershipPriceId: "",
  status: "approved",
  password: "",
};

export default function AdminMemberCreate() {
  const toast = useToast();
  const [newMember, setNewMember] = useState(emptyMemberForm);
  const [membershipOptions, setMembershipOptions] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadMembershipOptions = async () => {
      try {
        const res = await api.get("/settings");
        const options = res.data?.membershipOptions || [];
        setMembershipOptions(options);
        if (options.length) {
          setNewMember((prev) => ({ ...prev, membershipPriceId: options[0]._id }));
        }
      } catch (err) {
        console.error(err);
        setMembershipOptions([]);
      }
    };
    loadMembershipOptions();
  }, []);

  const createMember = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      await api.post("/admin/members", newMember);
      toast.success("Member created successfully.");
      setNewMember({
        ...emptyMemberForm,
        membershipPriceId: membershipOptions?.[0]?._id || "",
      });
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to create member.");
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
            value={newMember.membershipPriceId}
            onChange={(e) => setNewMember((prev) => ({ ...prev, membershipPriceId: e.target.value }))}
          >
            <option value="">Select Plan</option>
            {membershipOptions.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name?.trim() || `Plan ${item.price}`} - {item.price}
              </option>
            ))}
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
