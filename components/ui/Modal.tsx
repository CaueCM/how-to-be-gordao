"use client";

import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
}

export function Modal({ title, onClose, children, actions }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5 animate-fade-in"
      style={{ background: "rgba(20,20,30,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full flex flex-col gap-5 rounded-[24px] bg-white p-7 animate-modal-panel-in"
        style={{ maxWidth: 400, boxShadow: "0 32px 64px rgba(10,12,20,0.28)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[19px] font-bold text-[var(--color-text)]">{title}</h2>
        {children}
        {actions && <div className="flex justify-end gap-2">{actions}</div>}
      </div>
    </div>
  );
}
