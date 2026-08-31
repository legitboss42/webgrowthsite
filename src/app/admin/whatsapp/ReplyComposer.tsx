"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WhatsAppIcon, type WhatsAppIconName } from "@/components/whatsapp/icons";
import { chooseWhatsAppRecordingMimeType, getWhatsAppAudioFilename } from "@/lib/whatsapp/audio";
import {
  WHATSAPP_MEDIA_KINDS,
  formatWhatsAppMediaSize,
  getWhatsAppMediaAccept,
  supportsWhatsAppMediaCaption,
  validateWhatsAppMediaFile,
  type WhatsAppMediaKind,
} from "@/lib/whatsapp/media";
import { shouldSendWhatsAppTypingSignal } from "@/lib/whatsapp/typing";
import AttachmentMenu from "./AttachmentMenu";
import EmojiPicker from "./EmojiPicker";
import {
  applyQuickReply,
  clampComposerHeight,
  createWaveformHistory,
  filterQuickReplies,
  formatRecordingDuration,
  getQuickReplyQuery,
  insertIntoDraft,
  isComposerScrolling,
  measureWaveformLevel,
  pushWaveformLevel,
  shouldSendOnKey,
} from "./composerModel";
import type { WhatsAppReplyComposerState } from "./dashboard";
import { useWhatsAppOutboundQueue } from "./OutboundQueue";
import { useWhatsAppReplyTarget } from "./ReplyTarget";
import type { WhatsAppQuickReply } from "./quickRepliesModel";

type ReplyComposerProps = {
  conversationId: string;
  waId: string;
  initialText?: string;
  composerState: WhatsAppReplyComposerState;
  quickReplies?: WhatsAppQuickReply[];
};

type StagedAttachment = {
  file: File;
  kind: WhatsAppMediaKind;
  /** Object URL for the image thumbnail. Null for every other kind. */
  previewUrl: string | null;
};

type RecordingState = "unsupported" | "idle" | "recording" | "ready";

const reasonCopy: Partial<Record<NonNullable<WhatsAppReplyComposerState["reason"]>, string>> = {
  NOT_CONFIGURED: "Configure the official Meta sender credentials before using this inbox to reply.",
  NO_CUSTOMER_MESSAGE: "Wait for an inbound customer message before sending a manual reply here.",
  SERVICE_WINDOW_CLOSED: "The 24-hour customer service window has closed. Send an approved template instead.",
};

const KIND_ICONS: Record<WhatsAppMediaKind, WhatsAppIconName> = {
  image: "image",
  video: "video",
  document: "document",
  audio: "microphone",
};

function getSupportedRecordingType() {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return null;
  return chooseWhatsAppRecordingMimeType((type) => MediaRecorder.isTypeSupported(type));
}

/**
 * The inbox message composer.
 *
 * Shape is `[ + ] [ editor  😊 📎 ] [ ➤ ]`, and every control is wired to something the
 * server can already do: text and attachments go to their own routes, the microphone
 * records a real Meta-compatible blob, and the typing indicator is the same throttled
 * server call it has always been. Nothing here holds a credential — the routes do.
 *
 * The pure parts (caret arithmetic, the `/` trigger, the clock, the resize clamp, the
 * waveform history) live in `composerModel.ts`.
 */
export default function ReplyComposer({
  conversationId,
  waId,
  initialText = "",
  composerState,
  quickReplies = [],
}: ReplyComposerProps) {
  const router = useRouter();
  const { queueOutbound, settleOutbound, markOutboundUnconfirmed, dropOutbound } = useWhatsAppOutboundQueue();
  const { target: replyTarget, clearReplyTarget } = useWhatsAppReplyTarget();
  const [message, setMessage] = useState(initialText);
  const [feedback, setFeedback] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [attachment, setAttachment] = useState<StagedAttachment | null>(null);
  const [quickReplyOpen, setQuickReplyOpen] = useState(false);
  const [quickReplyIndex, setQuickReplyIndex] = useState(0);
  const [serviceWindowWarningEnabled, setServiceWindowWarningEnabled] = useState(true);
  const [clockNow, setClockNow] = useState<number | null>(null);

  const [recordingState, setRecordingState] = useState<RecordingState>("unsupported");
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingMimeType, setRecordingMimeType] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [waveform, setWaveform] = useState<number[]>(() => createWaveformHistory());

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const quickReplyRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const sendAfterStopRef = useRef(false);
  const sendAudioRef = useRef<(blob: Blob, mimeType: string) => void>(() => {});
  /** When the last real typing indicator went to Meta, for throttling. */
  const typingSentAtRef = useRef<number | undefined>(undefined);
  /** Belt-and-braces against a double Enter landing before `isPending` flips. */
  const inFlightRef = useRef(false);
  const [isPending, startTransition] = useTransition();

  const disabled = !composerState.enabled;
  const busy = isPending;

  useEffect(() => {
    const supportedType = getSupportedRecordingType();
    setRecordingMimeType(supportedType);
    setRecordingState(
      supportedType && typeof navigator.mediaDevices?.getUserMedia === "function" ? "idle" : "unsupported",
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/whatsapp/quick-settings/", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json().catch(() => null)) as
          | { settings?: { serviceWindowWarningEnabled?: boolean } }
          | null;
      })
      .then((payload) => {
        if (cancelled) return;
        if (typeof payload?.settings?.serviceWindowWarningEnabled === "boolean") {
          setServiceWindowWarningEnabled(payload.settings.serviceWindowWarningEnabled);
        }
      })
      .catch(() => {
        // Keep the safe default: warnings stay visible if settings cannot be loaded.
      });

    setClockNow(Date.now());
    const timer = window.setInterval(() => setClockNow(Date.now()), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  // One teardown for every resource a recording can leave behind. Runs on unmount only,
  // so switching conversations mid-recording cannot leave the microphone light on.
  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      void audioContextRef.current?.close().catch(() => {});
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    };
  }, [recordedAudioUrl]);

  useEffect(() => {
    return () => {
      if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    };
  }, [attachment]);

  // Auto-resize: one line at rest, four at most, then it scrolls. The container owns the
  // vertical padding, so `scrollHeight` here is purely lines × line-height.
  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    const natural = element.scrollHeight;
    element.style.height = `${clampComposerHeight(natural)}px`;
    element.style.overflowY = isComposerScrolling(natural) ? "auto" : "hidden";
  }, [message]);

  // The recording clock. Derived from a start timestamp rather than incremented, so a
  // throttled background tab cannot make the timer disagree with the audio.
  useEffect(() => {
    if (recordingState !== "recording") return;
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [recordingState]);

  // Successful send confirmations are useful for a moment, not forever. Errors remain
  // until the operator takes another action, but success feedback clears itself after 3s.
  useEffect(() => {
    if (feedback?.tone !== "info") return;
    const timer = window.setTimeout(() => setFeedback(null), 3_000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  // The quick-reply list can also be opened from the `+` menu, where there is no draft to
  // clear it, so it needs the same outside-click and Escape rules as the other popovers.
  useEffect(() => {
    if (!quickReplyOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!quickReplyRef.current?.contains(event.target as Node)) setQuickReplyOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setQuickReplyOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [quickReplyOpen]);

  const helperText = useMemo(() => {
    return (composerState.reason ? reasonCopy[composerState.reason] : undefined) || composerState.helperText;
  }, [composerState.helperText, composerState.reason]);

  const serviceWindowSoonText = useMemo(() => {
    if (!serviceWindowWarningEnabled || !composerState.enabled || !composerState.customerMessageTimestamp || clockNow === null) {
      return null;
    }
    const closesAt = composerState.customerMessageTimestamp * 1000 + 24 * 60 * 60 * 1000;
    const remainingMs = closesAt - clockNow;
    if (remainingMs <= 0 || remainingMs > 2 * 60 * 60 * 1000) return null;
    const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60_000));
    if (remainingMinutes < 60) return `Meta's 24-hour reply window closes in about ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"}.`;
    const remainingHours = Math.ceil(remainingMinutes / 60);
    return `Meta's 24-hour reply window closes in about ${remainingHours} hour${remainingHours === 1 ? "" : "s"}.`;
  }, [clockNow, composerState.customerMessageTimestamp, composerState.enabled, serviceWindowWarningEnabled]);

  const showDisabledNotice = disabled && (
    composerState.reason !== "SERVICE_WINDOW_CLOSED" || serviceWindowWarningEnabled
  );

  const quickReplyQuery = getQuickReplyQuery(message);
  const quickReplyMatches = useMemo(() => {
    if (!quickReplies.length) return [];
    if (quickReplyOpen && quickReplyQuery === null) return quickReplies;
    if (quickReplyQuery === null) return [];
    return filterQuickReplies(quickReplies, quickReplyQuery);
  }, [quickReplies, quickReplyOpen, quickReplyQuery]);
  const quickReplyVisible = (quickReplyQuery !== null || quickReplyOpen) && quickReplyMatches.length > 0;

  const canSend = Boolean(attachment) || message.trim().length > 0;

  /**
   * Triggers the real WhatsApp typing indicator on the customer's phone.
   *
   * Throttled to one request per refresh window rather than one per keystroke, and every
   * failure is swallowed on purpose: the indicator is a courtesy, and it must never be
   * able to interfere with sending the message. The credentials stay on the server — this
   * only names the conversation, and the route decides which message the receipt attaches
   * to.
   */
  function signalTyping(draft: string) {
    if (disabled) return;

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
      // Silent. A missed indicator is invisible to the customer; a thrown error here would
      // not be.
    });
  }

  function handleDraftChange(draft: string) {
    setMessage(draft);
    setQuickReplyIndex(0);
    if (getQuickReplyQuery(draft) === null) setQuickReplyOpen(false);
    signalTyping(draft);
  }

  function focusEditor(caret?: number) {
    const element = textareaRef.current;
    if (!element) return;
    element.focus();
    if (typeof caret === "number") {
      window.requestAnimationFrame(() => element.setSelectionRange(caret, caret));
    }
  }

  function handleEmojiSelect(emoji: string) {
    const element = textareaRef.current;
    const start = element?.selectionStart ?? message.length;
    const end = element?.selectionEnd ?? start;
    const next = insertIntoDraft({ value: message, start, end, insert: emoji });
    setMessage(next.value);
    signalTyping(next.value);
    focusEditor(next.cursor);
  }

  function chooseQuickReply(reply: WhatsAppQuickReply) {
    const next = applyQuickReply(message, reply.body);
    setMessage(next);
    setQuickReplyOpen(false);
    setQuickReplyIndex(0);
    setFeedback(null);
    focusEditor(next.length);
  }

  function handleEditorKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (quickReplyVisible) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setQuickReplyIndex((current) => (current + 1) % quickReplyMatches.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setQuickReplyIndex((current) => (current - 1 + quickReplyMatches.length) % quickReplyMatches.length);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setQuickReplyOpen(false);
        return;
      }
      if (event.key === "Tab" || (event.key === "Enter" && !event.shiftKey)) {
        const chosen = quickReplyMatches[quickReplyIndex] || quickReplyMatches[0];
        if (chosen) {
          event.preventDefault();
          chooseQuickReply(chosen);
          return;
        }
      }
    }

    if (shouldSendOnKey({ key: event.key, shiftKey: event.shiftKey, isComposing: event.nativeEvent.isComposing })) {
      event.preventDefault();
      void submit();
      return;
    }

    // Escape leaves reply mode. Checked after the quick-reply list, which closes on Escape
    // first, so one key never does two things at once.
    if (event.key === "Escape" && replyTarget) {
      event.preventDefault();
      clearReplyTarget();
    }
  }

  function resetEditor() {
    setMessage("");
    setQuickReplyOpen(false);
    setQuickReplyIndex(0);
    const element = textareaRef.current;
    if (element) {
      element.style.height = `${clampComposerHeight(0)}px`;
      element.style.overflowY = "hidden";
    }
  }

  async function submit() {
    if (disabled || inFlightRef.current) return;
    setFeedback(null);

    if (attachment) {
      sendAttachment(attachment);
      return;
    }

    const text = message.trim();
    if (!text) {
      setFeedback({ tone: "error", text: "Write a message before sending." });
      return;
    }

    inFlightRef.current = true;
    // Captured now: reply mode can be cleared while the request is in flight, and the
    // message that went out must keep the quote the operator actually chose.
    const quotedMessageId = replyTarget?.messageId;
    startTransition(async () => {
      // The bubble appears before the round trip finishes. Its key is how it gets
      // reconciled: settled with the WhatsApp message id the route returns, which is the
      // same id the stored row carries, so the two can never both be displayed.
      const pendingKey = queueOutbound(text);
      resetEditor();

      try {
        const response = await fetch("/api/admin/whatsapp/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, waId, text, replyToMessageId: quotedMessageId }),
        });
        const payload = (await response.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          messageId?: string;
        };
        if (!response.ok || !payload.ok) {
          // The server answered and refused, so nothing was stored anywhere. Take the
          // bubble back and hand the draft over rather than leaving a reply on screen that
          // never went out.
          dropOutbound(pendingKey);
          setMessage(text);
          if (payload.error === "NOT_CONFIGURED") {
            setFeedback({
              tone: "error",
              text: "Sender credentials are still missing in production, so the inbox cannot send yet.",
            });
            return;
          }
          if (payload.error === "SERVICE_WINDOW_CLOSED") {
            setFeedback({
              tone: "error",
              text: "The 24-hour customer service window is closed for this conversation.",
            });
            return;
          }
          setFeedback({
            tone: "error",
            text: payload.error || "Unable to send the message right now. Please try again in a moment.",
          });
          return;
        }

        settleOutbound(pendingKey, payload.messageId);
        clearReplyTarget();
        router.refresh();
      } catch {
        // No answer at all. Meta may or may not have taken it, so calling this failed would
        // be a guess, and restoring the draft could send the same message twice.
        markOutboundUnconfirmed(pendingKey, "The connection dropped before WhatsApp confirmed it.");
        setFeedback({
          tone: "error",
          text: "The connection dropped before WhatsApp confirmed the message. Check the thread before sending it again.",
        });
      } finally {
        inFlightRef.current = false;
      }
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  /* ---------------------------------------------------------------- attachments */

  function openFilePicker(kind: WhatsAppMediaKind | null) {
    const input = fileInputRef.current;
    if (!input) return;
    // Set imperatively rather than through state: the click has to happen in the same task
    // as the operator's own click, or the browser refuses to open the picker.
    input.accept = kind ? WHATSAPP_MEDIA_KINDS[kind].accept : getWhatsAppMediaAccept();
    input.value = "";
    input.click();
  }

  function stageFile(file: File | null) {
    setFeedback(null);
    if (!file) return;

    const validation = validateWhatsAppMediaFile({ mimeType: file.type, size: file.size, name: file.name });
    if (!validation.ok) {
      setFeedback({ tone: "error", text: validation.error });
      return;
    }

    if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    setAttachment({
      file,
      kind: validation.kind,
      previewUrl: validation.kind === "image" ? URL.createObjectURL(file) : null,
    });
    focusEditor();
  }

  function clearAttachment() {
    if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    setAttachment(null);
  }

  function sendAttachment(staged: StagedAttachment) {
    if (disabled || inFlightRef.current) return;
    const caption = supportsWhatsAppMediaCaption(staged.kind) ? message.trim() : "";

    inFlightRef.current = true;
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("conversationId", conversationId);
        formData.set("waId", waId);
        formData.set("kind", staged.kind);
        formData.set("file", staged.file, staged.file.name);
        if (caption) formData.set("caption", caption);
        if (replyTarget) formData.set("replyToMessageId", replyTarget.messageId);

        const response = await fetch("/api/admin/whatsapp/reply/media/", {
          method: "POST",
          body: formData,
        });
        const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!response.ok || !payload.ok) {
          // The draft and the file both stay put: the operator picked them, and a failed
          // upload is no reason to make them do it again.
          setFeedback({
            tone: "error",
            text: payload.error || "Unable to send this attachment right now. Please try again in a moment.",
          });
          return;
        }

        clearAttachment();
        resetEditor();
        clearReplyTarget();
        setFeedback({ tone: "info", text: `${WHATSAPP_MEDIA_KINDS[staged.kind].label} sent.` });
        router.refresh();
      } catch {
        setFeedback({
          tone: "error",
          text: "The connection dropped before this attachment finished uploading. Check the thread before retrying.",
        });
      } finally {
        inFlightRef.current = false;
      }
    });
  }

  /* --------------------------------------------------------------- voice notes */

  const sendAudioBlob = useCallback(
    (blob: Blob, mimeType: string) => {
      if (disabled || inFlightRef.current) return;
      inFlightRef.current = true;
      startTransition(async () => {
        try {
          const formData = new FormData();
          formData.set("conversationId", conversationId);
          formData.set("waId", waId);
          formData.set("audio", blob, getWhatsAppAudioFilename(mimeType));

          const response = await fetch("/api/admin/whatsapp/reply/audio", {
            method: "POST",
            body: formData,
          });
          const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
          if (!response.ok || !payload.ok) {
            setFeedback({
              tone: "error",
              text: payload.error || "Unable to send the voice note right now. Please try again in a moment.",
            });
            return;
          }

          if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
          setRecordedAudio(null);
          setRecordedAudioUrl(null);
          setRecordingState(getSupportedRecordingType() ? "idle" : "unsupported");
          setElapsedSeconds(0);
          setWaveform(createWaveformHistory());
          setFeedback({ tone: "info", text: "Voice note sent." });
          router.refresh();
        } catch {
          setFeedback({
            tone: "error",
            text: "The connection dropped before the voice note finished uploading. Check the thread before retrying.",
          });
        } finally {
          inFlightRef.current = false;
        }
      });
    },
    [conversationId, disabled, recordedAudioUrl, router, startTransition, waId],
  );

  // Read through a ref inside `MediaRecorder.onstop`: that callback is created once when
  // recording starts, and send-while-recording must use the current sender, not the one
  // that existed at the moment the operator pressed the microphone.
  useEffect(() => {
    sendAudioRef.current = sendAudioBlob;
  }, [sendAudioBlob]);

  function stopWaveform() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    const context = audioContextRef.current;
    audioContextRef.current = null;
    void context?.close().catch(() => {});
  }

  /**
   * Drives the activity strip from the real microphone signal.
   *
   * Measured amplitude, not an animation: a muted or dead microphone draws a flat line,
   * which is the one thing an operator needs to know before sending a note nobody can hear.
   */
  function startWaveform(stream: MediaStream) {
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    try {
      const context = new AudioContextCtor();
      audioContextRef.current = context;
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      context.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);

      let lastPush = 0;
      const loop = () => {
        frameRef.current = requestAnimationFrame(loop);
        const now = Date.now();
        // ~12 bars a second: fast enough to read as live, slow enough not to re-render the
        // composer on every frame.
        if (now - lastPush < 80) return;
        lastPush = now;
        analyser.getByteTimeDomainData(samples);
        const level = measureWaveformLevel(samples);
        setWaveform((current) => pushWaveformLevel(current, level));
      };
      frameRef.current = requestAnimationFrame(loop);
    } catch {
      // No analyser: the timer and the recording still work, the strip just stays flat.
      stopWaveform();
    }
  }

  async function startRecording() {
    if (disabled || !recordingMimeType) return;
    setFeedback(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      sendAfterStopRef.current = false;

      const activeMimeType = recordingMimeType;
      const recorder = new MediaRecorder(stream, { mimeType: activeMimeType });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const audio = new Blob(chunksRef.current, { type: activeMimeType });
        stopWaveform();
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        if (sendAfterStopRef.current) {
          sendAfterStopRef.current = false;
          setRecordingState("ready");
          setRecordedAudio(audio);
          sendAudioRef.current(audio, activeMimeType);
          return;
        }

        setRecordedAudio(audio);
        setRecordedAudioUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return URL.createObjectURL(audio);
        });
        setRecordingState("ready");
      };

      setWaveform(createWaveformHistory());
      setElapsedSeconds(0);
      startedAtRef.current = Date.now();
      recorder.start();
      setRecordingState("recording");
      startWaveform(stream);
    } catch {
      setFeedback({
        tone: "error",
        text: "Microphone access was not granted, so this browser cannot record a voice note.",
      });
      setRecordingState("idle");
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      stopWaveform();
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
  }

  function stopAndSendRecording() {
    if (recordingState === "ready" && recordedAudio && recordingMimeType) {
      sendAudioBlob(recordedAudio, recordingMimeType);
      return;
    }
    sendAfterStopRef.current = true;
    stopRecording();
  }

  function cancelRecording() {
    sendAfterStopRef.current = false;
    if (mediaRecorderRef.current?.state === "recording") {
      // The `onstop` handler still runs and still builds a blob; it is thrown away below.
      mediaRecorderRef.current.stop();
    }
    stopWaveform();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setRecordedAudio(null);
    setRecordedAudioUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setElapsedSeconds(0);
    setWaveform(createWaveformHistory());
    setRecordingState(recordingMimeType ? "idle" : "unsupported");
  }

  /* -------------------------------------------------------------------- render */

  const inRecordingMode = recordingState === "recording" || recordingState === "ready";
  const recordingLabel =
    recordingState === "recording"
      ? `Recording, ${formatRecordingDuration(elapsedSeconds)}`
      : `Voice note ready, ${formatRecordingDuration(elapsedSeconds)}`;

  return (
    <form onSubmit={handleSubmit} className="relative px-3 py-3 sm:px-4">
      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => stageFile(event.target.files?.[0] || null)}
      />

      {showDisabledNotice ? (
        <div className="mb-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-brass/25 bg-brass-tint px-3 py-2 text-xs leading-5 text-[#6f4f16]">
          <span>{helperText}</span>
          {composerState.reason === "SERVICE_WINDOW_CLOSED" ? (
            <Link href="/admin/whatsapp/templates/" className="font-semibold underline decoration-brass/50 underline-offset-2">
              Open templates
            </Link>
          ) : null}
        </div>
      ) : null}

      {serviceWindowSoonText ? (
        <div className="mb-2.5 flex items-center gap-2 rounded-xl border border-brass/25 bg-brass-tint px-3 py-2 text-xs leading-5 text-[#6f4f16]">
          <WhatsAppIcon name="clock" className="h-4 w-4 flex-none" />
          <span>{serviceWindowSoonText}</span>
        </div>
      ) : null}

      {feedback ? (
        <p
          role="status"
          className={`mb-2.5 rounded-xl px-3 py-2 text-xs leading-5 ${
            feedback.tone === "error"
              ? "border border-rose-200 bg-rose-50 text-rose-700"
              : "border border-rule bg-paper text-ink-soft"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}

      {/* Reply mode. The green rule and the name in green are the approved design's cue that
          the next send will quote this message rather than start a new one. */}
      {replyTarget ? (
        <div className="mb-2.5 flex items-start gap-2 rounded-xl border border-rule bg-paper py-2 pl-0 pr-1.5">
          <span aria-hidden="true" className="ml-2 mt-0.5 w-[3px] flex-none self-stretch rounded-full bg-ledger-bright" />
          <span className="min-w-0 flex-1 py-0.5">
            <span className="block text-xs font-semibold text-ledger">{replyTarget.authorLabel}</span>
            <span className="mt-0.5 block truncate text-xs leading-5 text-ink-soft">{replyTarget.excerpt}</span>
          </span>
          <button
            type="button"
            onClick={clearReplyTarget}
            aria-label="Stop replying to this message"
            className="grid h-9 w-9 flex-none place-items-center rounded-full text-ink-faint transition hover:bg-paper-sunk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ledger-bright/40"
          >
            <WhatsAppIcon name="close" className="h-[1.05rem] w-[1.05rem]" />
          </button>
        </div>
      ) : null}

      {attachment ? (
        <div className="mb-2.5 flex items-center gap-3 rounded-xl border border-rule bg-paper px-3 py-2.5">
          {attachment.previewUrl ? (
            <span
              role="img"
              aria-label={`Preview of ${attachment.file.name}`}
              style={{ backgroundImage: `url(${attachment.previewUrl})` }}
              className="h-11 w-11 flex-none rounded-lg border border-rule bg-paper-sunk bg-cover bg-center"
            />
          ) : (
            <span className="grid h-11 w-11 flex-none place-items-center rounded-lg bg-ledger-tint text-ledger">
              <WhatsAppIcon name={KIND_ICONS[attachment.kind]} className="h-5 w-5" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-ink">{attachment.file.name}</span>
            <span className="block text-[0.7rem] text-ink-faint">
              {WHATSAPP_MEDIA_KINDS[attachment.kind].label} · {formatWhatsAppMediaSize(attachment.file.size)}
              {busy ? " · uploading…" : supportsWhatsAppMediaCaption(attachment.kind) ? " · the message below is sent as its caption" : ""}
            </span>
          </span>
          <button
            type="button"
            onClick={clearAttachment}
            disabled={busy}
            aria-label={`Remove ${attachment.file.name}`}
            className="grid h-9 w-9 flex-none place-items-center rounded-full text-ink-faint transition hover:bg-paper-sunk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ledger-bright/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <WhatsAppIcon name="close" className="h-[1.05rem] w-[1.05rem]" />
          </button>
        </div>
      ) : null}

      {quickReplyVisible ? (
        <div
          ref={quickReplyRef}
          className="absolute bottom-[calc(100%-0.25rem)] left-3 right-3 z-30 overflow-hidden rounded-2xl border border-rule bg-paper-raised shadow-[0_18px_40px_-18px_rgba(14,26,20,.45)] sm:left-4 sm:right-auto sm:w-[22rem]"
        >
          <p className="border-b border-rule bg-paper px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[.14em] text-ink-faint">
            Quick replies
          </p>
          <ul className="max-h-52 overflow-y-auto py-1">
            {quickReplyMatches.map((reply, index) => (
              <li key={reply.id}>
                <button
                  type="button"
                  onClick={() => chooseQuickReply(reply)}
                  onMouseEnter={() => setQuickReplyIndex(index)}
                  className={`block w-full px-3 py-2 text-left transition focus-visible:outline-none ${
                    index === quickReplyIndex ? "bg-ledger-tint" : "hover:bg-paper-sunk"
                  }`}
                >
                  <span className="flex items-baseline gap-2">
                    <span className="font-mono text-[0.7rem] text-ledger">/{reply.shortcut}</span>
                    <span className="truncate text-sm font-medium text-ink">{reply.title}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-[0.7rem] text-ink-faint">{reply.body}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {inRecordingMode ? (
        <div className="flex items-center gap-2 rounded-2xl border border-rule bg-paper px-2 py-2">
          <button
            type="button"
            onClick={cancelRecording}
            disabled={busy}
            aria-label="Cancel recording"
            className="grid h-11 w-11 flex-none place-items-center rounded-full text-ink-faint transition hover:bg-paper-sunk hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ledger-bright/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <WhatsAppIcon name="close" className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            {recordingState === "recording" ? (
              <span aria-hidden="true" className="h-2 w-2 flex-none animate-pulse rounded-full bg-rose-600" />
            ) : null}
            <span aria-hidden="true" className="flex h-8 min-w-0 flex-1 items-center gap-[2px] overflow-hidden">
              {waveform.map((level, index) => (
                <span
                  key={index}
                  style={{ height: `${Math.round(level * 100)}%` }}
                  className={`w-full flex-1 rounded-full ${
                    recordingState === "recording" ? "bg-ledger-bright" : "bg-rule-strong"
                  }`}
                />
              ))}
            </span>
            <span className="flex-none text-xs font-medium tabular-nums text-ink-soft">
              {formatRecordingDuration(elapsedSeconds)}
            </span>
          </div>

          <span role="status" aria-live="polite" className="sr-only">
            {recordingLabel}
          </span>

          {recordingState === "ready" && recordedAudioUrl ? (
            <audio controls src={recordedAudioUrl} className="hidden h-9 w-40 flex-none sm:block">
              Your browser cannot play this recording.
            </audio>
          ) : null}

          <button
            type="button"
            onClick={cancelRecording}
            disabled={busy}
            aria-label="Discard recording"
            className="grid h-11 w-11 flex-none place-items-center rounded-full text-ink-faint transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <WhatsAppIcon name="trash" className="h-[1.05rem] w-[1.05rem]" />
          </button>

          <button
            type="button"
            onClick={stopAndSendRecording}
            disabled={disabled || busy}
            aria-label={recordingState === "recording" ? "Stop and send voice note" : "Send voice note"}
            className="grid h-11 w-11 flex-none place-items-center rounded-full bg-ledger-bright text-white shadow-sm transition hover:bg-ledger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ledger-bright/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-raised disabled:cursor-not-allowed disabled:bg-ledger-bright/40"
          >
            {busy ? <Spinner /> : <WhatsAppIcon name="send" className="h-5 w-5" />}
          </button>
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <AttachmentMenu
            onPickKind={openFilePicker}
            onOpenQuickReplies={
              quickReplies.length
                ? () => {
                    setQuickReplyOpen(true);
                    setQuickReplyIndex(0);
                    focusEditor();
                  }
                : undefined
            }
            disabled={disabled || busy}
          />

          <div className="flex min-w-0 flex-1 items-end gap-1 rounded-[1.4rem] border border-rule bg-paper px-2 py-1.5 transition focus-within:border-ledger-bright focus-within:ring-2 focus-within:ring-ledger-bright/20">
            <label htmlFor="whatsapp-composer-editor" className="sr-only">
              Message to this WhatsApp customer
            </label>
            <textarea
              id="whatsapp-composer-editor"
              ref={textareaRef}
              value={message}
              onChange={(event) => handleDraftChange(event.target.value)}
              onKeyDown={handleEditorKeyDown}
              disabled={disabled || busy}
              rows={1}
              placeholder="Type a message..."
              aria-describedby="whatsapp-composer-hint"
              className="min-w-0 flex-1 resize-none self-center bg-transparent px-2 py-1 text-sm leading-6 text-ink outline-none placeholder:text-ink-faint/70 disabled:cursor-not-allowed disabled:opacity-70"
            />
            <EmojiPicker onSelect={handleEmojiSelect} disabled={disabled || busy} />
            <button
              type="button"
              onClick={() => openFilePicker(null)}
              disabled={disabled || busy}
              aria-label="Attach a file"
              className="grid h-9 w-9 flex-none place-items-center rounded-full text-ink-faint transition hover:bg-paper-sunk hover:text-ledger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ledger-bright/40 disabled:cursor-not-allowed disabled:text-ink-faint/50"
            >
              <WhatsAppIcon name="paperclip" className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled || busy || recordingState === "unsupported"}
              aria-label={
                recordingState === "unsupported"
                  ? "Voice recording is unavailable in this browser"
                  : "Record a voice note"
              }
              title={
                recordingState === "unsupported"
                  ? "This browser cannot record in a WhatsApp-compatible format. Attach an audio file instead."
                  : undefined
              }
              className="grid h-9 w-9 flex-none place-items-center rounded-full text-ink-faint transition hover:bg-paper-sunk hover:text-ledger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ledger-bright/40 disabled:cursor-not-allowed disabled:text-ink-faint/50"
            >
              <WhatsAppIcon name="microphone" className="h-5 w-5" />
            </button>
          </div>

          {/* Always the send button, always green: the microphone lives inside the editor, so
              this stays the one primary action instead of changing identity under the cursor.
              Muted until there is something to send, because empty sends are refused. */}
          <button
            type="submit"
            disabled={disabled || busy || !canSend}
            aria-label="Send message"
            className={`grid h-11 w-11 flex-none place-items-center rounded-full text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ledger-bright/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-raised ${
              canSend && !disabled && !busy
                ? "bg-ledger-bright hover:bg-ledger"
                : "cursor-not-allowed bg-ledger-bright/40"
            }`}
          >
            {busy ? <Spinner /> : <WhatsAppIcon name="send" className="h-5 w-5" />}
          </button>
        </div>
      )}

      <p id="whatsapp-composer-hint" className="mt-2 px-1 text-[0.68rem] leading-5 text-ink-faint">
        Enter sends · Shift + Enter adds a line
        {quickReplies.length ? " · / opens quick replies" : ""}
        {composerState.enabled ? " · typing here shows a real typing indicator and marks their last message as read" : ""}
      </p>
    </form>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}
