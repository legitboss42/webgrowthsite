"use client";

import { useEffect } from "react";
import MockupClient from "./MockupClient";

export default function MockupModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // lock body scroll when modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* modal panel */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-6xl h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-black">
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="text-sm font-semibold text-white/90">
              AI Website Mockup
            </div>
            <button
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-sm bg-white/10 hover:bg-white/15 text-white"
            >
              Close
            </button>
          </div>

          {/* content scroll area */}
          <div className="h-[calc(90vh-52px)] overflow-auto">
            <MockupClient />
          </div>
        </div>
      </div>
    </div>
  );
}