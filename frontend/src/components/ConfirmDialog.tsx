"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ title, message, confirmLabel = "Confirm", onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content card w-full max-w-md mx-4 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded flex items-center justify-center shrink-0" style={{ background: "rgba(239,68,68,0.1)" }}>
            <AlertTriangle className="w-4.5 h-4.5 text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{title}</h3>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onCancel} className="btn-secondary !text-sm !py-2">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-full text-sm font-bold text-white" style={{ background: "rgba(239,68,68,0.8)" }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
