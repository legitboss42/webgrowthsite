"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { WhatsAppReplyComposerState } from "./dashboard";

type ReplyComposerProps = {
  conversationId: string;
  waId: string;
  initialText?: string;
  composerState: WhatsAppReplyComposerState;
};

const reasonCopy: Partial<Record<NonNullable<WhatsAppReplyComposerState["reason"]>, string>> = {
  NOT_CONFIGURED: "Configure the official Meta sender credentials before using this inbox to reply.",
  NO_CUSTOMER_MESSAGE: "Wait for an inbound customer message before sending a manual reply here.",
  SERVICE_WINDOW_CLOSED: "The active customer service window has closed, so a template would be required instead.",
};

const preferredAudioTypes = [
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/aac",
  "audio/amr",
];

function getSupportedRecordingType() {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return null;
  return preferredAudioTypes.find((type) => MediaRecorder.isTypeSupported(type)) || null;
}

export default function ReplyComposer({ conversationId, waId, initialText = "", composerState }: ReplyComposerProps) {
  const router = useRouter();
  const [message, setMessage] = useState(initialText);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [recordingState, setRecordingState] = useState<"unsupported" | "idle" | "recording" | "ready">("unsupported");
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingMimeType, setRecordingMimeType] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supportedType = getSupportedRecordingType();
    setRecordingMimeType(supportedType);
    setRecordingState(
      supportedType && typeof navigator.mediaDevices?.getUserMedia === "function" ? "idle" : "unsupported",
    );
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    };
  }, [recordedAudioUrl]);

  const helperText = useMemo(() => {
    if (feedback) return feedback;
    return (composerState.reason ? reasonCopy[composerState.reason] : undefined) || composerState.helperText;
  }, [composerState.helperText, composerState.reason, feedback]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!composerState.enabled) return;

    setFeedback(null);
    const text = message.trim();
    if (!text) {
      setFeedback("Write a reply before sending.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/whatsapp/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            waId,
            text,
          }),
        });
        const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!response.ok || !payload.ok) {
          if (payload.error === "NOT_CONFIGURED") {
            setFeedback("Sender credentials are still missing in production, so the inbox cannot send yet.");
            return;
          }
          if (payload.error === "SERVICE_WINDOW_CLOSED") {
            setFeedback("The 24-hour customer service window is closed for this conversation.");
            return;
          }
          setFeedback(payload.error || "Unable to send the reply right now. Please try again in a moment.");
          return;
        }

        setMessage("");
        setFeedback("Reply sent and stored in the WhatsApp CRM thread.");
        router.refresh();
      } catch {
        setFeedback("Unable to send the reply right now. Please try again in a moment.");
      }
    });
  }

  async function startRecording() {
    if (!composerState.enabled || !recordingMimeType) return;
    setFeedback(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: recordingMimeType });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const audio = new Blob(chunksRef.current, { type: recordingMimeType });
        if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
        setRecordedAudio(audio);
        setRecordedAudioUrl(URL.createObjectURL(audio));
        setRecordingState("ready");
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };
      recorder.start();
      setRecordingState("recording");
    } catch {
      setFeedback("Microphone access was not granted or recording is unavailable in this browser.");
      setRecordingState("idle");
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  function discardRecording() {
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    setRecordedAudio(null);
    setRecordedAudioUrl(null);
    setRecordingState(recordingMimeType ? "idle" : "unsupported");
  }

  async function sendRecordedAudio() {
    if (!composerState.enabled || !recordedAudio || !recordingMimeType) return;
    setFeedback(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("conversationId", conversationId);
        formData.set("waId", waId);
        formData.set("audio", recordedAudio, recordingMimeType.includes("ogg") ? "webgrowth-voice-note.ogg" : "webgrowth-voice-note.audio");

        const response = await fetch("/api/admin/whatsapp/reply/audio", {
          method: "POST",
          body: formData,
        });
        const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!response.ok || !payload.ok) {
          setFeedback(payload.error || "Unable to send the voice note right now. Please try again in a moment.");
          return;
        }

        discardRecording();
        setFeedback("Voice note sent and stored in the WhatsApp CRM thread.");
        router.refresh();
      } catch {
        setFeedback("Unable to send the voice note right now. Please try again in a moment.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-3xl border border-white/10 bg-black/15 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[.18em] text-white/70">Reply from inbox</h3>
          <p className="mt-2 text-sm text-white/60">{helperText}</p>
        </div>
        <button
          type="submit"
          disabled={!composerState.enabled || isPending}
          className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-medium text-black transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/45"
        >
          {isPending ? "Sending..." : "Send reply"}
        </button>
      </div>

      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        disabled={!composerState.enabled || isPending}
        rows={5}
        className="mt-4 w-full rounded-2xl border border-white/10 bg-[#07110c] px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-white/30 disabled:cursor-not-allowed disabled:opacity-60"
        placeholder="Type a careful reply. Avoid pricing, scope, timeline, or contract commitments unless you are intentionally handling them yourself."
      />

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/55">Voice note</p>
            <p className="mt-1 text-xs text-white/45">
              Record short replies only when the customer service window is open. Your browser will ask for microphone permission.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {recordingState === "recording" ? (
              <button
                type="button"
                onClick={stopRecording}
                disabled={isPending}
                className="rounded-full bg-rose-400 px-4 py-2 text-xs font-semibold text-black transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/45"
              >
                Stop recording
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                disabled={!composerState.enabled || isPending || recordingState === "unsupported"}
                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/45"
              >
                Record voice note
              </button>
            )}
            <button
              type="button"
              onClick={sendRecordedAudio}
              disabled={!composerState.enabled || !recordedAudio || isPending}
              className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-black transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/45"
            >
              Send voice note
            </button>
            {recordedAudio ? (
              <button
                type="button"
                onClick={discardRecording}
                disabled={isPending}
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Discard
              </button>
            ) : null}
          </div>
        </div>
        {recordingState === "unsupported" ? (
          <p className="mt-3 text-xs text-amber-100">
            Voice recording is not supported by this browser in a Meta-compatible audio format.
          </p>
        ) : null}
        {recordedAudioUrl ? (
          <audio controls preload="none" src={recordedAudioUrl} className="mt-3 w-full">
            Your browser cannot preview this voice note.
          </audio>
        ) : null}
      </div>
    </form>
  );
}
