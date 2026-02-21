import React, { useEffect, useState } from "react";
import api from "../../api/client";
import AdminLayout from "./AdminLayout";
import Spinner from "../../components/Spinner";
import ConfirmModal from "../../components/ConfirmModal";
import { useToast } from "../../context/ToastContext";

const emptyForm = { name: "", price: "" };

export default function AdminMembershipPrice() {
  const toast = useToast();
  const [prices, setPrices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState("");
  let saveButtonLabel = "Save";

  if (saving) {
    saveButtonLabel = "Saving...";
  } else if (editId) {
    saveButtonLabel = "Update";
  }

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/membership-prices");
      setPrices(res.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to load prices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const savePrice = async (e) => {
    e.preventDefault();
    const normalizedName = form.name.trim();
    if (!normalizedName) {
      toast.error("Plan name is required.");
      return;
    }

    try {
      setSaving(true);
      if (editId) {
        await api.put(`/admin/membership-prices/${editId}`, {
          name: normalizedName,
          type: "onetime",
          price: form.price,
        });
        toast.success("Membership price updated.");
      } else {
        await api.post("/admin/membership-prices", {
          name: normalizedName,
          type: "onetime",
          price: form.price,
        });
        toast.success("Membership price created.");
      }

      setForm(emptyForm);
      setEditId("");
      await load();
    } catch (err) {
      toast.error(
        err?.response?.data?.msg ||
          err?.response?.data?.message ||
          "Unable to save membership price."
      );
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (price) => {
    setEditId(price._id);
    setForm({ name: price.name || "", price: String(price.price) });
  };

  const deletePrice = async () => {
    if (!confirmDeleteId) return;
    try {
      await api.delete(`/admin/membership-prices/${confirmDeleteId}`);
      toast.success("Membership price deleted.");
      if (editId === confirmDeleteId) {
        setEditId("");
        setForm(emptyForm);
      }
      setConfirmDeleteId("");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to delete membership price.");
    }
  };

  return (
    <AdminLayout>
      <h2 className="text-xl font-semibold text-blue-950 mb-4">Membership Price Management</h2>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 mb-6">
        <h3 className="font-semibold mb-3">{editId ? "Edit Price" : "Set Price"}</h3>
        <form onSubmit={savePrice} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] gap-3">
          <input
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            placeholder="Plan Name (e.g. Ahsan Lifetime)"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <input
            type="number"
            min="0"
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
            required
          />
          <button
            type="submit"
            className="w-full sm:w-auto bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
            disabled={saving}
          >
            {saving ? <Spinner /> : null}
            {saveButtonLabel}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <h3 className="font-semibold mb-3">Price List</h3>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-8 flex justify-center">
              <Spinner size="lg" className="border-blue-900 border-r-transparent" />
            </div>
          ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3">Plan Name</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((item) => (
                <tr key={item._id} className="border-t border-slate-200">
                  <td className="px-4 py-3">{item.name?.trim() || `Plan ${item.price}`}</td>
                  <td className="px-4 py-3">{item.price}</td>
                  <td className="px-4 py-3 grid grid-cols-1 sm:flex gap-2">
                    <button
                      onClick={() => startEdit(item)}
                      className="text-xs px-2 py-2 rounded border border-slate-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(item._id)}
                      className="text-xs px-2 py-2 rounded border border-slate-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {prices.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={3}>
                    No membership prices configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>

      <ConfirmModal
        open={Boolean(confirmDeleteId)}
        title="Delete Membership Price"
        message="Are you sure you want to delete this price entry?"
        confirmText="Delete"
        onConfirm={deletePrice}
        onCancel={() => setConfirmDeleteId("")}
      />
    </AdminLayout>
  );
}
