"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { chooseWhatsAppRecordingMimeType, getWhatsAppAudioFilename, isSupportedWhatsAppAudioMimeType } from "@/lib/whatsapp/audio";
import { shouldSendWhatsAppTypingSignal } from "@/lib/whatsapp/typing";
import type { WhatsAppReplyComposerState } from "./dashboard";
import { useWhatsAppOutboundQueue } from "./OutboundQueue";
import type { WhatsAppQuickReply } from "./quickRepliesModel";

type ReplyComposerProps = {
  conversationId: string;
  waId: string;
  initialText?: string;
  composerState: WhatsAppReplyComposerState;
  quickReplies?: WhatsAppQuickReply[];
};

const reasonCopy: Partial<Record<NonNullable<WhatsAppReplyComposerState["reason"]>, string>> = {
  NOT_CONFIGURED: "Configure the official Meta sender credentials before using this inbox to reply.",
  NO_CUSTOMER_MESSAGE: "Wait for an inbound customer message before sending a manual reply here.",
  SERVICE_WINDOW_CLOSED: "The active customer service window has closed, so a template would be required instead.",
};

function getSupportedRecordingType() {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return null;
  return chooseWhatsAppRecordingMimeType((type) => MediaRecorder.isTypeSupported(type));
}

export default function ReplyComposer({
  conversationId,
  waId,
  initialText = "",
  composerState,
  quickReplies = [],
}: ReplyComposerProps) {
  const router = useRouter();
  const { queueOutbound, settleOutbound, markOutboundUnconfirmed, dropOutbound } = useWhatsAppOutboundQueue();
  const [message, setMessage] = useState(initialText);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [recordingState, setRecordingState] = useState<"unsupported" | "idle" | "recording" | "ready">("unsupported");
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingMimeType, setRecordingMimeType] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  /** When the last real typing indicator went to Meta, for throttling. */
  const typingSentAtRef = useRef<number | undefined>(undefined);
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

  /**
   * Triggers the real WhatsApp typing indicator on the customer's phone.
   *
   * Throttled to one request per refresh window rather than one per keystroke, and
   * every failure is swallowed on purpose: the indicator is a courtesy, and it must
   * never be able to interfere with sending the message. The credentials stay on the
   * server — this only names the conversation, and the route decides which message
   * the receipt attaches to.
   */
  function signalTyping(draft: string) {
    if (!composerState.enabled) return;

    const now = Date.now();
    const due = shouldSendWhatsAppTypingSignal({
      hasDraft: draft.trim().length > 0,
      lastSentAt: typingSentAtRef.current,
      now,
    });
    if (!due) return;

    typingSentAtRef.current = now;
    void fetch("/api/admin/whatsapp/typing/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, waId }),
      keepalive: true,
    }).catch(() => {
      // Silent. A missed indicator is invisible to the customer; a thrown error here
      // would not be.
    });
  }

  function handleDraftChange(draft: string) {
    setMessage(draft);
    signalTyping(draft);
  }

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
      // The bubble appears before the round trip finishes. Its key is how it gets
      // reconciled: settled with the WhatsApp message id the route returns, which is
      // the same id the stored row carries, so the two can never both be displayed.
      const pendingKey = queueOutbound(text);
      setMessage("");

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
        const payload = (await response.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          messageId?: string;
        };
        if (!response.ok || !payload.ok) {
          // The server answered and refused, so nothing was stored anywhere. Take the
          // bubble back and hand the draft over rather than leaving a reply on screen
          // that never went out.
          dropOutbound(pendingKey);
          setMessage(text);
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

        settleOutbound(pendingKey, payload.messageId);
        setFeedback("Reply sent and stored in the WhatsApp CRM thread.");
        router.refresh();
      } catch {
        // No answer at all. Meta may or may not have taken it, so calling this failed
        // would be a guess, and restoring the draft could send the same reply twice.
        markOutboundUnconfirmed(
          pendingKey,
          "The connection dropped before WhatsApp confirmed it.",
        );
        setFeedback(
          "The connection dropped before WhatsApp confirmed the reply. Check the thread before sending it again.",
        );
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
        formData.set("audio", recordedAudio, getWhatsAppAudioFilename(recordingMimeType));

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

  function handleAudioFileSelected(file: File | null) {
    setFeedback(null);
    if (!file) return;
    if (!isSupportedWhatsAppAudioMimeType(file.type)) {
      setFeedback(`Unsupported audio format (${file.type || "unknown"}). Use OGG, MP3, MP4/M4A, AAC, or AMR audio.`);
      return;
    }
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    setRecordedAudio(file);
    setRecordingMimeType(file.type);
    setRecordedAudioUrl(URL.createObjectURL(file));
    setRecordingState("ready");
  }

  /** Quick replies only fill the textarea — sending stays the normal reply flow. */
  function insertQuickReply(body: string) {
    setFeedback(null);
    setMessage((current) => {
      const trimmed = current.trimEnd();
      return trimmed ? `${trimmed}\n\n${body}` : body;
    });
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[0.7rem] font-semibold uppercase tracking-[.16em] text-ink-faint">
            Reply from inbox
          </h3>
          <p className="mt-1.5 text-sm leading-6 text-ink-soft">{helperText}</p>
        </div>
        <button
          type="submit"
          disabled={!composerState.enabled || isPending}
          className="flex-none rounded-full bg-ledger-bright px-4 py-2 text-sm font-medium text-white transition hover:bg-ledger disabled:cursor-not-allowed disabled:bg-paper-sunk disabled:text-ink-faint"
        >
          {isPending ? "Sending..." : "Send reply"}
        </button>
      </div>

      <textarea
        value={message}
        onChange={(event) => handleDraftChange(event.target.value)}
        disabled={!composerState.enabled || isPending}
        rows={3}
        className="mt-3 w-full rounded-lg border border-rule bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint/70 focus:border-ledger-bright focus:ring-2 focus:ring-ledger-bright/20 disabled:cursor-not-allowed disabled:bg-paper-sunk disabled:opacity-70"
        placeholder="Type a careful reply. Avoid pricing, scope, timeline, or contract commitments unless you are intentionally handling them yourself."
      />

      {composerState.enabled ? (
        <p className="mt-1.5 text-[0.7rem] leading-5 text-ink-faint">
          Typing here shows a real typing indicator on the customer&rsquo;s WhatsApp. Meta sends
          that together with a read receipt, so their last message is marked as read at the
          same time.
        </p>
      ) : null}

      {quickReplies.length ? (
        <div className="mt-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[.14em] text-ink-faint">
            Quick replies
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {quickReplies.map((reply) => (
              <button
                key={reply.id}
                type="button"
                onClick={() => insertQuickReply(reply.body)}
                disabled={!composerState.enabled || isPending}
                title={reply.body}
                className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-paper-raised px-2.5 py-1 text-xs text-ink-soft transition hover:border-ledger hover:text-ledger disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="font-mono text-[0.65rem] text-ink-faint">/{reply.shortcut}</span>
                <span className="max-w-[10rem] truncate">{reply.title}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3 rounded-lg border border-rule bg-paper p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[.16em] text-ink-faint">Voice note</p>
            <p className="mt-1 text-xs leading-5 text-ink-faint">
              Record short replies only when the customer service window is open. Your browser will ask for microphone permission.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {recordingState === "recording" ? (
              <button
                type="button"
                onClick={stopRecording}
                disabled={isPending}
                className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-paper-sunk disabled:text-ink-faint"
              >
                Stop recording
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                disabled={!composerState.enabled || isPending || recordingState === "unsupported"}
                className="rounded-full border border-rule-strong bg-paper px-4 py-2 text-xs font-semibold text-ink transition hover:border-ledger hover:text-ledger disabled:cursor-not-allowed disabled:border-rule disabled:bg-paper-sunk disabled:text-ink-faint"
              >
                Record voice note
              </button>
            )}
            <button
              type="button"
              onClick={sendRecordedAudio}
              disabled={!composerState.enabled || !recordedAudio || isPending}
              className="rounded-full bg-ledger-bright px-4 py-2 text-xs font-semibold text-white transition hover:bg-ledger disabled:cursor-not-allowed disabled:bg-paper-sunk disabled:text-ink-faint"
            >
              Send voice note
            </button>
            {recordedAudio ? (
              <button
                type="button"
                onClick={discardRecording}
                disabled={isPending}
                className="rounded-full border border-rule px-4 py-2 text-xs font-semibold text-ink-soft transition hover:border-rule-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                Discard
              </button>
            ) : null}
          </div>
        </div>
        {recordingState === "unsupported" ? (
          <p className="mt-3 rounded-lg border border-brass/25 bg-brass-tint px-3 py-2 text-xs leading-5 text-[#6f4f16]">
            In-browser recording is not supported by this browser in a Meta-compatible audio format. Use the audio upload fallback below.
          </p>
        ) : null}
        <label className="mt-3 block rounded-lg border border-dashed border-rule-strong bg-paper p-3 text-xs text-ink-soft">
          <span className="block font-semibold text-ink">Mobile fallback: upload a recorded audio file</span>
          <span className="mt-1 block leading-5 text-ink-faint">Accepted: OGG, MP3, MP4/M4A, AAC, or AMR. This is useful when your phone browser cannot record a Meta-compatible voice note directly.</span>
          <input
            type="file"
            accept="audio/ogg,audio/mpeg,audio/mp4,audio/aac,audio/amr,.ogg,.mp3,.m4a,.mp4,.aac,.amr"
            disabled={!composerState.enabled || isPending}
            onChange={(event) => handleAudioFileSelected(event.target.files?.[0] || null)}
            className="mt-3 block w-full text-xs text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-ledger file:px-3 file:py-2 file:text-xs file:font-semibold file:text-on-dark disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>
        {recordedAudioUrl ? (
          <audio controls preload="none" src={recordedAudioUrl} className="mt-3 w-full">
            Your browser cannot preview this voice note.
          </audio>
        ) : null}
      </div>
    </form>
  );
}
