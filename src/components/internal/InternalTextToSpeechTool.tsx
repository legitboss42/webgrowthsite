"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const VOICES = [
  {
    value: "en-US-BrianMultilingualNeural",
    label: "Brian Multilingual",
  },
  {
    value: "en-US-AndrewNeural",
    label: "Andrew",
  },
  {
    value: "en-US-GuyNeural",
    label: "Guy",
  },
  {
    value: "en-US-ChristopherNeural",
    label: "Christopher",
  },
] as const;

const DEFAULT_TEXT =
  "Here is a quick website growth update. Your homepage should explain what you do, who it is for, and what the next step is within a few seconds.";

const HISTORY_STORAGE_KEY = "wg-internal-tts-history";

type HistoryItem = {
  id: string;
  text: string;
  voice: string;
  rate: string;
  generatedAt: string;
  characterCount: number;
};

type GeneratedAssets = {
  audioUrl: string;
  vttUrl: string;
  srtUrl: string;
  textUrl: string;
  jsonUrl: string;
  vttText: string;
  srtText: string;
  filenameStem: string;
  generatedAt: string;
  voice: string;
  rate: string;
  characterCount: number;
};

type InternalTextToSpeechToolProps = {
  unlocked: boolean;
};

function createObjectUrl(content: BlobPart, type: string) {
  return URL.createObjectURL(new Blob([content], { type }));
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}

export default function InternalTextToSpeechTool({
  unlocked,
}: InternalTextToSpeechToolProps) {
  const router = useRouter();
  const [text, setText] = useState(DEFAULT_TEXT);
  const [voice, setVoice] = useState<string>(VOICES[0].value);
  const [rate, setRate] = useState("-4%");
  const [assets, setAssets] = useState<GeneratedAssets | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const remaining = useMemo(() => 900 - text.length, [text.length]);

  const resetAudio = () => {
    if (assets) {
      URL.revokeObjectURL(assets.audioUrl);
      URL.revokeObjectURL(assets.vttUrl);
      URL.revokeObjectURL(assets.srtUrl);
      URL.revokeObjectURL(assets.textUrl);
      URL.revokeObjectURL(assets.jsonUrl);
    }
    setAssets(null);
  };

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as HistoryItem[];
      if (Array.isArray(parsed)) {
        setHistory(parsed.slice(0, 6));
      }
    } catch {
      // Ignore invalid local history.
    }

    return () => {
      resetAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveHistoryItem(item: HistoryItem) {
    const next = [item, ...history.filter((entry) => entry.id !== item.id)].slice(0, 6);
    setHistory(next);
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
  }

  async function handleLockUtility() {
    setError("");
    setSuccess("");
    resetAudio();

    await fetch("/api/internal/session/", { method: "DELETE" });
    router.refresh();
  }

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    resetAudio();

    try {
      const response = await fetch("/api/internal/text-to-speech/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voice,
          rate,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Generation failed.");
      }

      const binary = atob(payload.audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }

      const blob = new Blob([bytes], { type: payload.mimeType || "audio/mpeg" });
      const nextUrl = URL.createObjectURL(blob);
      const vttText = payload.vtt || "";
      const srtText = payload.srt || "";
      const filenameStem = payload.filenameStem || "webgrowth-tts";
      const generatedAt = payload.generatedAt || new Date().toISOString();
      const characterCount = Number(payload.characterCount || text.length);
      const exportData = {
        text,
        voice: payload.voice,
        rate: payload.rate,
        generatedAt,
        characterCount,
      };

      setAssets({
        audioUrl: nextUrl,
        vttUrl: createObjectUrl(vttText, "text/vtt;charset=utf-8"),
        srtUrl: createObjectUrl(srtText, "application/x-subrip;charset=utf-8"),
        textUrl: createObjectUrl(text, "text/plain;charset=utf-8"),
        jsonUrl: createObjectUrl(
          JSON.stringify(exportData, null, 2),
          "application/json;charset=utf-8"
        ),
        vttText,
        srtText,
        filenameStem,
        generatedAt,
        voice: payload.voice,
        rate: payload.rate,
        characterCount,
      });
      setSuccess(`Voice generated with ${payload.voice}.`);
      saveHistoryItem({
        id: generatedAt,
        text,
        voice: payload.voice,
        rate: payload.rate,
        generatedAt,
        characterCount,
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-black/35 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.25)] md:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <form className="space-y-6" onSubmit={handleGenerate}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="internal-tts-voice" className="mb-2 block text-sm font-medium text-white/88">
                Voice
              </label>
              <select
                id="internal-tts-voice"
                value={voice}
                onChange={(event) => setVoice(event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-white/12 bg-black/35 px-4 text-white outline-none focus:border-emerald-400/60"
              >
                {VOICES.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#050806]">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="internal-tts-speed" className="mb-2 block text-sm font-medium text-white/88">
                Speed
              </label>
              <select
                id="internal-tts-speed"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-white/12 bg-black/35 px-4 text-white outline-none focus:border-emerald-400/60"
              >
                <option value="-10%" className="bg-[#050806]">Slow</option>
                <option value="-4%" className="bg-[#050806]">Balanced</option>
                <option value="+0%" className="bg-[#050806]">Normal</option>
                <option value="+8%" className="bg-[#050806]">Fast</option>
              </select>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-4">
              <label htmlFor="internal-tts-text" className="block text-sm font-medium text-white/88">
                Text
              </label>
              <span className={`text-xs ${remaining < 120 ? "text-amber-300" : "text-white/52"}`}>
                {remaining} characters left
              </span>
            </div>
            <textarea
              id="internal-tts-text"
              value={text}
              onChange={(event) => setText(event.target.value.slice(0, 900))}
              rows={9}
              className="w-full rounded-2xl border border-white/12 bg-black/35 px-4 py-4 text-white outline-none placeholder:text-white/30 focus:border-emerald-400/60"
              placeholder="Paste the narration or short script here."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Generating voice..." : "Generate voice"}
            </button>
            <button
              type="button"
              onClick={() => {
                setText(DEFAULT_TEXT);
                setVoice(VOICES[0].value);
                setRate("-4%");
                setError("");
                setSuccess("");
                resetAudio();
              }}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/16 bg-black/25 px-6 py-3 text-sm font-semibold text-white/84 transition-colors hover:border-white/30 hover:bg-black/40"
            >
              Reset sample
            </button>
            {unlocked ? (
              <button
                type="button"
                onClick={handleLockUtility}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-rose-400/18 bg-rose-500/10 px-6 py-3 text-sm font-semibold text-rose-100 transition-colors hover:border-rose-300/30 hover:bg-rose-500/15"
              >
                Lock utility
              </button>
            ) : null}
          </div>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
        </form>

        <div className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-300/80">
              Internal utility
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-white">
              Local-only voice generator
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/68">
              This is intentionally limited for Web Growth use. It is built for short
              scripts, article intros, quick narration tests, and subtitle export.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/48">
              Current rules
            </p>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>Short text only: up to 900 characters</li>
              <li>Approved voices only</li>
              <li>Access requires unlocked browser session</li>
              <li>Generated files stay in your browser unless you export them</li>
            </ul>
          </div>

          {assets ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/48">
                Voice preview
              </p>
              <audio controls src={assets.audioUrl} className="mt-3 w-full" />
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => triggerDownload(assets.audioUrl, `${assets.filenameStem}.mp3`)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                >
                  Download MP3
                </button>
                <button
                  type="button"
                  onClick={() => triggerDownload(assets.vttUrl, `${assets.filenameStem}.vtt`)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/16 bg-black/25 px-4 py-2 text-sm font-semibold text-white/84 transition-colors hover:border-white/30 hover:bg-black/40"
                >
                  Download VTT
                </button>
                <button
                  type="button"
                  onClick={() => triggerDownload(assets.srtUrl, `${assets.filenameStem}.srt`)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/16 bg-black/25 px-4 py-2 text-sm font-semibold text-white/84 transition-colors hover:border-white/30 hover:bg-black/40"
                >
                  Download SRT
                </button>
                <button
                  type="button"
                  onClick={() => triggerDownload(assets.textUrl, `${assets.filenameStem}.txt`)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/16 bg-black/25 px-4 py-2 text-sm font-semibold text-white/84 transition-colors hover:border-white/30 hover:bg-black/40"
                >
                  Download Text
                </button>
                <button
                  type="button"
                  onClick={() => triggerDownload(assets.jsonUrl, `${assets.filenameStem}.json`)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/16 bg-black/25 px-4 py-2 text-sm font-semibold text-white/84 transition-colors hover:border-white/30 hover:bg-black/40 sm:col-span-2"
                >
                  Download Metadata
                </button>
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4 text-xs text-white/60">
                <p>Generated: {new Date(assets.generatedAt).toLocaleString()}</p>
                <p>Voice: {assets.voice}</p>
                <p>Speed: {assets.rate}</p>
                <p>Characters: {assets.characterCount}</p>
              </div>
            </div>
          ) : null}

          {assets?.vttText ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/48">
                VTT subtitles
              </p>
              <textarea
                readOnly
                value={assets.vttText}
                rows={8}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-xs text-white/72"
              />
            </div>
          ) : null}

          {assets?.srtText ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/48">
                SRT subtitles
              </p>
              <textarea
                readOnly
                value={assets.srtText}
                rows={8}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-xs text-white/72"
              />
            </div>
          ) : null}

          {history.length ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/48">
                Recent prompts
              </p>
              <div className="mt-3 space-y-3">
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setText(item.text);
                      setVoice(item.voice);
                      setRate(item.rate);
                      setSuccess("");
                      setError("");
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-black/25 p-3 text-left transition-colors hover:border-white/20 hover:bg-black/35"
                  >
                    <p className="text-sm font-medium text-white/88">
                      {item.text.slice(0, 72)}
                      {item.text.length > 72 ? "..." : ""}
                    </p>
                    <p className="mt-2 text-xs text-white/50">
                      {item.voice} · {item.rate} · {new Date(item.generatedAt).toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
