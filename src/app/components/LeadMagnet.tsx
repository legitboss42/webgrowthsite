"use client";

import { useState } from "react";

export default function LeadMagnet({
  action, // The MailerLite Form Action URL
  file,   // The local path e.g. "/downloads/service-wireframe.pdf"
}: {
  action: string;
  file: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  // 1. CONFIG: Your live domain
  // This is needed so the link in the email is clickable (e.g. https://webgrowth.info/...)
  const domain = "https://webgrowth.info";
  const fullDownloadUrl = `${domain}${file}`;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);

    // 2. LOGIC: Inject the specific file link into MailerLite
    // You must create a custom field in MailerLite called "download_link" for this to work
    formData.append("fields[download_link]", fullDownloadUrl);

    try {
      await fetch(action, {
        method: "POST",
        body: formData,
      });

      setStatus("success");

      // 3. UX: Open download in new tab (Don't navigate away)
      window.open(file, "_blank");
    } catch (error) {
      console.error("Submission failed", error);
      setStatus("idle");
    }
  }

  if (status === "success") {
    return (
      <div className="mt-6 p-4 bg-emerald-900/20 text-emerald-400 border border-emerald-900 rounded-lg">
        <p className="font-bold flex items-center gap-2">
          <span>OK</span> Check your new tab!
        </p>
        <p className="text-sm mt-1 text-emerald-200/80">
          The download has started. I also sent a backup link to your inbox.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          name="fields[email]"
          type="email"
          required
          disabled={status === "loading"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address..."
          className="flex-1 rounded-lg bg-gray-900 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
        />

        {/* HIDDEN FIELD: This sends the link to the email automation */}
        <input
          type="hidden"
          name="fields[download_link]"
          value={fullDownloadUrl}
        />

        <button
          disabled={status === "loading"}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
        >
          {status === "loading" ? "Processing..." : "Download System"}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-3 text-center sm:text-left">
        No spam. Unsubscribe anytime.
      </p>
    </form>
  );
}
