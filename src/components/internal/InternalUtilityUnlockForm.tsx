"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type InternalUtilityUnlockFormProps = {
  localHint?: string;
};

export default function InternalUtilityUnlockForm({
  localHint,
}: InternalUtilityUnlockFormProps) {
  const router = useRouter();
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleUnlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/internal/session/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unlock failed.");
      }

      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unlock failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-black/35 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.25)] md:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
              Private utility access
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white">
              Unlock the voice tool for this browser session
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/72">
              This utility is meant for a small trusted group, not the open public site.
              Once unlocked, this browser session can generate short narration clips without
              sending the passphrase on every request.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label
                htmlFor="internal-utility-unlock"
                className="mb-2 block text-sm font-medium text-white/88"
              >
                Shared passphrase
              </label>
              <input
                id="internal-utility-unlock"
                type="password"
                value={passphrase}
                onChange={(event) => setPassphrase(event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-white/12 bg-black/35 px-4 text-white outline-none ring-0 placeholder:text-white/30 focus:border-emerald-400/60"
                placeholder="Enter the internal utility passphrase"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Unlocking..." : "Unlock utility"}
              </button>
            </div>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          </form>
        </div>

        <div className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/48">
              Current setup
            </p>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>Private browser-session unlock</li>
              <li>Voice generation stays server-side</li>
              <li>Exports stay in the browser unless you download them</li>
              <li>Route remains noindex and excluded from sitemap</li>
            </ul>
          </div>

          {localHint ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-300/80">
                Local development hint
              </p>
              <p className="mt-2 text-sm text-emerald-100/90">
                Local default passphrase: <span className="font-semibold">{localHint}</span>
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
