"use client";

import { useSearchParams } from "next/navigation";

function messageForError(code: string | null) {
  switch (code) {
    case "cancelled":
      return "Google sign-in was cancelled. Nothing was changed.";
    case "state":
      return "The sign-in session expired or changed tabs mid-flow. Start again from the website.";
    case "code":
      return "Google did not return an authorization code. Start the sign-in again.";
    case "not-approved":
      return "This Google account is not approved for admin access.";
    case "exchange":
      return "Google sign-in could not be completed. Please try again.";
    case "provider":
      return "Google sign-in was refused before the website could finish the session.";
    case "config":
      return "Google sign-in is not configured correctly in this environment yet.";
    default:
      return "This page only appears when Google sign-in cannot finish normally.";
  }
}

export default function GoogleAuthCallback() {
  const searchParams = useSearchParams();
  const message = messageForError(searchParams.get("error"));

  return (
    <main className="min-h-screen bg-[#070a08] px-6 py-20 text-white">
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[36px] border border-[#d9c9ae]/16 bg-[#0d110d] shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,182,120,0.16),transparent_40%),radial-gradient(circle_at_85%_18%,rgba(93,151,121,0.18),transparent_28%)]"
        />
        <div className="relative grid gap-6 p-8 md:grid-cols-[minmax(0,1.1fr)_16rem] md:p-10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#d7c9b2]/72">Google sign-in</p>
            <h1 className="mt-5 font-display text-4xl font-medium tracking-[-0.04em] text-[#f8f1e7] md:text-5xl">
              We could not complete the sign-in
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#e9dfcf]/74">{message}</p>
          </div>

          <aside className="rounded-[28px] border border-white/10 bg-black/18 p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#d7c9b2]/60">What to do next</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-white/68">
              <li>Return to the website page where you started</li>
              <li>Use the same browser tab for the whole Google flow</li>
              <li>Try the approved Google account again if you are opening an admin area</li>
            </ul>
          </aside>
        </div>
      </div>
    </main>
  );
}
