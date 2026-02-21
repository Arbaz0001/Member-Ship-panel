/* eslint-disable react/prop-types */
import React from "react";

export default function ConfirmModal({
  open,
  title = "Please confirm",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-blue-950">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-5 grid grid-cols-1 sm:flex gap-2 sm:justify-end">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto rounded border border-slate-300 px-4 py-2 text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto rounded bg-blue-900 px-4 py-2 text-sm text-white hover:bg-blue-950"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
