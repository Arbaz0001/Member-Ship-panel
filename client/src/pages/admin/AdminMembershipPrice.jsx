import React, { useEffect, useState } from "react";
import api from "../../api/client";
import AdminLayout from "./AdminLayout";
import Spinner from "../../components/Spinner";
import { useToast } from "../../context/ToastContext";

const initialPrices = {
  lifetime: { id: "", price: "0" },
  "two-year": { id: "", price: "0" },
};

export default function AdminMembershipPrice() {
  const toast = useToast();
  const [prices, setPrices] = useState(initialPrices);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/membership-prices");
      const rows = res.data || [];
      const lifetimeRow = rows.find((item) => item.type === "lifetime");
      const twoYearRow = rows.find((item) => item.type === "two-year");
      setPrices({
        lifetime: {
          id: lifetimeRow?._id || "",
          price: String(Number(lifetimeRow?.price || 0)),
        },
        "two-year": {
          id: twoYearRow?._id || "",
          price: String(Number(twoYearRow?.price || 0)),
        },
      });
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Unable to load prices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const savePrice = async () => {
    if (!prices.lifetime.id || !prices["two-year"].id) {
      toast.error("Membership pricing is not initialized yet.");
      return;
    }

    try {
      setSaving(true);
      await Promise.all([
        api.put(`/admin/membership-prices/${prices.lifetime.id}`, {
          price: Number(prices.lifetime.price || 0),
        }),
        api.put(`/admin/membership-prices/${prices["two-year"].id}`, {
          price: Number(prices["two-year"].price || 0),
        }),
      ]);
      toast.success("Membership pricing updated successfully.");
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

  return (
    <AdminLayout>
      <h2 className="text-xl font-semibold text-blue-950 mb-4">Membership Price Management</h2>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <h3 className="font-semibold mb-3">Lifetime & Two Year Price</h3>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-8 flex justify-center">
              <Spinner size="lg" className="border-blue-900 border-r-transparent" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-lg p-4">
                <p className="text-sm font-medium text-slate-800 mb-2">Lifetime Price</p>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                  value={prices.lifetime.price}
                  onChange={(e) =>
                    setPrices((prev) => ({
                      ...prev,
                      lifetime: { ...prev.lifetime, price: e.target.value },
                    }))
                  }
                />
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <p className="text-sm font-medium text-slate-800 mb-2">Two Year Price</p>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                  value={prices["two-year"].price}
                  onChange={(e) =>
                    setPrices((prev) => ({
                      ...prev,
                      "two-year": { ...prev["two-year"], price: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={savePrice}
          className="mt-4 w-full sm:w-auto bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
          disabled={saving || loading}
        >
          {saving ? <Spinner /> : null}
          {saving ? "Saving..." : "Save Prices"}
        </button>
      </div>
    </AdminLayout>
  );
}
