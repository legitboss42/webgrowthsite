"use client";

import { useState } from "react";
import LeadMagnetModal from "./LeadMagnetModal";

type Props = {
  label: string;
  href: string; // /downloads/file.pdf
};

const MAILERLITE_FORM_ACTION =
  "https://assets.mailerlite.com/jsonp/2082508/forms/178299108230956075/subscribe";

export default function LeadMagnetCTA({ label, href }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6">
        <button
          onClick={() => setOpen(true)}
          className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          <span className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/3 rotate-12 bg-white/25 blur-xl translate-x-[-70%] group-hover:translate-x-[340%] transition duration-[1100ms]" />
          <span className="relative">{label}</span>
        </button>
        <div className="mt-3 text-xs text-white/55">
          Instant download. No spam. Just the file.
        </div>
      </div>

      <LeadMagnetModal
        open={open}
        onClose={() => setOpen(false)}
        title="Download Guide"
        subtitle="Enter your email to get instant access."
        buttonText="Download"
        formAction={MAILERLITE_FORM_ACTION}
        downloadUrl={href}
      />
    </>
  );
}

