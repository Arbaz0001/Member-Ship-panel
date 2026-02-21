import React, { useEffect, useState } from "react";
import api from "../api/client";
import MemberLayout from "../components/MemberLayout";

export default function History() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await api.get("/payment/mine");
      setPayments(res.data || []);
    };
    load();
  }, []);

  return (
    <MemberLayout title="Payment History">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment._id} className="border-t border-slate-200">
                  <td className="px-4 py-3 capitalize">{payment.category}</td>
                  <td className="px-4 py-3">{payment.amount}</td>
                  <td className="px-4 py-3">
                    <span className="capitalize px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs">
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(payment.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={4}>
                    No payment history available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MemberLayout>
  );
}
