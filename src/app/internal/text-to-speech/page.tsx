import type { Metadata } from "next";
import { cookies } from "next/headers";
import InternalTextToSpeechTool from "@/components/internal/InternalTextToSpeechTool";
import InternalUtilityUnlockForm from "@/components/internal/InternalUtilityUnlockForm";
import {
  getInternalUtilityCookieName,
  getInternalUtilityLocalPassphrase,
  readInternalUtilityCookie,
} from "@/lib/internalUtilityAuth";

export const metadata: Metadata = {
  title: "Internal Text to Speech | Web Growth",
  description:
    "Private Web Growth utility for generating short narration clips with Edge TTS.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function InternalTextToSpeechPage() {
  const cookieStore = await cookies();
  const unlocked = Boolean(
    readInternalUtilityCookie(cookieStore.get(getInternalUtilityCookieName())?.value)
  );
  const localHint = getInternalUtilityLocalPassphrase();

  return (
    <main className="min-h-screen bg-[#050806] text-white">
      <section className="border-b border-white/10 py-18">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
            Internal Utility
          </p>
          <h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-[-0.03em] md:text-6xl">
            Text to Speech
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">
            Generate short narration clips locally for Web Growth scripts, quick
            testing, subtitle timing, and internal publishing work.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-6">
          {unlocked ? (
            <InternalTextToSpeechTool unlocked={unlocked} />
          ) : (
            <InternalUtilityUnlockForm localHint={localHint || undefined} />
          )}
        </div>
      </section>
    </main>
  );
}
