"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useParams } from "next/navigation";

function safeFilePath(file: string | null) {
  if (!file) return null;
  // Only allow files from /downloads to prevent abuse
  if (!file.startsWith("/downloads/")) return null;
  // No directory traversal
  if (file.includes("..")) return null;
  return file;
}

// Minimal GA4 event helper (works if gtag is installed)
function track(eventName: string, params: Record<string, any> = {}) {
  if (typeof window === "undefined") return;
  // @ts-ignore
  const gtag = window.gtag as undefined | ((...args: any[]) => void);
  if (!gtag) return;
  gtag("event", eventName, params);
}

export default function ThankYouPage() {
  const params = useParams<{ slug: string }>();
  const search = useSearchParams();
  const [started, setStarted] = useState(false);

  const slug = params?.slug || "download";
  const file = useMemo(() => safeFilePath(search.get("file")), [search]);

  // Auto-download once
  useEffect(() => {
    if (!file || started) return;

    // Track: download started
    track("lead_download", { slug, file });

    // Trigger browser download/open
    const a = document.createElement("a");
    a.href = file;
    a.download = ""; // hint to download; browser may still open PDF
    document.body.appendChild(a);
    a.click();
    a.remove();

    setStarted(true);
  }, [file, slug, started]);

  if (!file) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="max-w-xl w-full rounded-2xl border border-white/10 bg-white/5 p-7">
          <h1 className="text-2xl font-semibold">Download link is missing</h1>
          <p className="mt-3 text-white/70">
            This page needs a valid file path like{" "}
            <span className="text-white">/downloads/your.pdf</span>.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/blog"
              className="rounded-md border border-white/10 bg-black/30 px-5 py-3 text-sm font-semibold text-white/85 hover:bg-black/45 transition"
            >
              Back to Blog
            </Link>
            <Link
              href="/contact"
              className="rounded-md bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition"
            >
              Contact
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-2xl w-full rounded-2xl border border-white/10 bg-white/5 p-7">
        <div className="text-sm text-white/55">THANK YOU</div>
        <h1 className="mt-2 text-3xl font-semibold">
          Your download should start automatically
        </h1>

        <p className="mt-3 text-white/70 leading-relaxed">
          If it didn’t start, use the manual button below.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={file}
            download
            onClick={() => track("lead_download_manual", { slug, file })}
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition"
          >
            Download again
          </a>

          <Link
            href="/contact"
            onClick={() => track("cta_click", { slug, source: "thank_you" })}
            className="inline-flex items-center justify-center rounded-md border border-white/10 bg-black/30 px-6 py-3 text-sm font-semibold text-white/85 hover:bg-black/45 transition"
          >
            Request a Quote
          </Link>
        </div>

        <div className="mt-6 text-xs text-white/55">
          Slug: <span className="text-white/80">{slug}</span>
        </div>
      </div>
    </main>
  );
}

