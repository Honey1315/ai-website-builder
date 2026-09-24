"use client";

import { ReactNode } from "react";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function Modal({
  isOpen,
  title,
  children,
  onClose,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#05080c]/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-secondary-900 border border-secondary-700 shadow-2xl max-w-md w-full mx-4 rounded-none overflow-hidden relative">
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary-500 opacity-50"></div>
        
        <div className="border-b border-secondary-800 px-6 py-5 bg-secondary-800/20">
          <h2 className="text-sm font-display text-white uppercase tracking-widest flex items-center gap-3">
            <span className="w-2 h-2 bg-primary-400 block"></span>
            {title}
          </h2>
        </div>

        <div className="px-6 py-6 text-secondary-300 font-light text-sm leading-relaxed">
          {children}
        </div>

        <div className="border-t border-secondary-800 px-6 py-4 bg-[#0a0f16] flex gap-4 justify-end">
          <Button variant="ghost" onClick={onClose}>
            {cancelText}
          </Button>
          {onConfirm && (
            <Button variant="primary" onClick={onConfirm}>
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}