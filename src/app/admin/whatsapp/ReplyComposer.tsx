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
import {
  resolveWhatsAppQuickReplyVariables,
  type WhatsAppQuickReply,
  type WhatsAppQuickReplyScope,
  type WhatsAppQuickReplyVariableContext,
} from "./quickRepliesModel";

type ReplyComposerProps = {
  conversationId: string;
  waId: string;
  initialText?: string;
  composerState: WhatsAppReplyComposerState;
  quickReplies?: WhatsAppQuickReply[];
  variableContext?: WhatsAppQuickReplyVariableContext;
};

type StagedAttachment = {
  file: File;
  kind: WhatsAppMediaKind;
  previewUrl: string | null;
};

type RecordingState = "unsupported" | "idle" | "recording" | "ready";
type SavedReplyScopeFilter = "ALL" | WhatsAppQuickReplyScope;

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

export default function ReplyComposer({
  conversationId,
  waId,
  initialText = "",
  composerState,
  quickReplies = [],
  variableContext = {},
}: ReplyComposerProps) {
  const router = useRouter();
  const { queueOutbound, settleOutbound, markOutboundUnconfirmed, dropOutbound } = useWhatsAppOutboundQueue();
  const { target: replyTarget, clearReplyTarget } = useWhatsAppReplyTarget();
  const [message, setMessage] = useState(initialText);
  const [feedback, setFeedback] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [attachment, setAttachment] = useState<StagedAttachment | null>(null);
  const [savedReplyMedia, setSavedReplyMedia] = useState<WhatsAppQuickReply | null>(null);
  const [quickReplyOpen, setQuickReplyOpen] = useState(false);
  const [quickReplyIndex, setQuickReplyIndex] = useState(0);
  const [quickReplySearch, setQuickReplySearch] = useState("");
  const [quickReplyCategory, setQuickReplyCategory] = useState("ALL");
  const [quickReplyScope, setQuickReplyScope] = useState<SavedReplyScopeFilter>("ALL");
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
  const typingSentAtRef = useRef<number | undefined>(undefined);
  const inFlightRef = useRef(false);
  const [isPending, startTransition] = useTransition();

  const disabled = !composerState.enabled;
  const busy = isPending;

  useEffect(() => {
    const supportedType = getSupportedRecordingType();
    setRecordingMimeType(supportedType);
    setRecordingState(supportedType && typeof navigator.mediaDevices?.getUserMedia === "function" ? "idle" : "unsupported");
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/whatsapp/quick-settings/", { cache: "no-store" })
      .then(async (response) => response.ok ? (await response.json().catch(() => null)) as { settings?: { serviceWindowWarningEnabled?: boolean } } | null : null)
      .then((payload) => {
        if (!cancelled && typeof payload?.settings?.serviceWindowWarningEnabled === "boolean") setServiceWindowWarningEnabled(payload.settings.serviceWindowWarningEnabled);
      })
      .catch(() => {});
    setClockNow(Date.now());
    const timer = window.setInterval(() => setClockNow(Date.now()), 60_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    void audioContextRef.current?.close().catch(() => {});
  }, []);

  useEffect(() => () => { if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl); }, [recordedAudioUrl]);
  useEffect(() => () => { if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl); }, [attachment]);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    const natural = element.scrollHeight;
    element.style.height = `${clampComposerHeight(natural)}px`;
    element.style.overflowY = isComposerScrolling(natural) ? "auto" : "hidden";
  }, [message]);

  useEffect(() => {
    if (recordingState !== "recording") return;
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [recordingState]);

  useEffect(() => {
    if (feedback?.tone !== "info") return;
    const timer = window.setTimeout(() => setFeedback(null), 3_000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

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

  const helperText = useMemo(() => (composerState.reason ? reasonCopy[composerState.reason] : undefined) || composerState.helperText, [composerState.helperText, composerState.reason]);

  const serviceWindowSoonText = useMemo(() => {
    if (!serviceWindowWarningEnabled || !composerState.enabled || !composerState.customerMessageTimestamp || clockNow === null) return null;
    const closesAt = composerState.customerMessageTimestamp * 1000 + 24 * 60 * 60 * 1000;
    const remainingMs = closesAt - clockNow;
    if (remainingMs <= 0 || remainingMs > 2 * 60 * 60 * 1000) return null;
    const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60_000));
    if (remainingMinutes < 60) return `Meta's 24-hour reply window closes in about ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"}.`;
    const remainingHours = Math.ceil(remainingMinutes / 60);
    return `Meta's 24-hour reply window closes in about ${remainingHours} hour${remainingHours === 1 ? "" : "s"}.`;
  }, [clockNow, composerState.customerMessageTimestamp, composerState.enabled, serviceWindowWarningEnabled]);

  const showDisabledNotice = disabled && (composerState.reason !== "SERVICE_WINDOW_CLOSED" || serviceWindowWarningEnabled);
  const quickReplyQuery = getQuickReplyQuery(message);
  const browseCategories = useMemo(() => Array.from(new Set(quickReplies.map((reply) => reply.category))).sort(), [quickReplies]);
  const quickReplyMatches = useMemo(() => {
    if (!quickReplies.length) return [];
    if (quickReplyQuery !== null) return filterQuickReplies(quickReplies, quickReplyQuery);
    if (!quickReplyOpen) return [];
    let rows = quickReplies;
    if (quickReplyScope !== "ALL") rows = rows.filter((reply) => reply.scope === quickReplyScope);
    if (quickReplyCategory !== "ALL") rows = rows.filter((reply) => reply.category === quickReplyCategory);
    return quickReplySearch.trim() ? filterQuickReplies(rows, quickReplySearch.trim()) : rows;
  }, [quickReplies, quickReplyOpen, quickReplyQuery, quickReplyScope, quickReplyCategory, quickReplySearch]);
  const quickReplyVisible = (quickReplyQuery !== null || quickReplyOpen) && quickReplyMatches.length > 0;
  const canSend = Boolean(attachment || savedReplyMedia) || message.trim().length > 0;

  function openSavedReplies() {
    setQuickReplyOpen(true);
    setQuickReplyIndex(0);
    setQuickReplySearch("");
    setQuickReplyCategory("ALL");
    setQuickReplyScope("ALL");
  }

  function signalTyping(draft: string) {
    if (disabled) return;
    const now = Date.now();
    const due = shouldSendWhatsAppTypingSignal({ hasDraft: draft.trim().length > 0, lastSentAt: typingSentAtRef.current, now });
    if (!due) return;
    typingSentAtRef.current = now;
    void fetch("/api/admin/whatsapp/typing/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, waId }),
      keepalive: true,
    }).catch(() => {});
  }

  function handleDraftChange(draft: string) {
    setMessage(draft);
    setQuickReplyIndex(0);
    if (getQuickReplyQuery(draft) === null && !quickReplyOpen) setQuickReplyOpen(false);
    signalTyping(draft);
  }

  function focusEditor(caret?: number) {
    const element = textareaRef.current;
    if (!element) return;
    element.focus();
    if (typeof caret === "number") window.requestAnimationFrame(() => element.setSelectionRange(caret, caret));
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
    const resolved = resolveWhatsAppQuickReplyVariables(reply.body, variableContext);
    const next = applyQuickReply(message, resolved.text);
    setMessage(next);
    if (reply.media_kind && reply.media_path) {
      clearAttachment();
      setSavedReplyMedia(reply);
    } else {
      setSavedReplyMedia(null);
    }
    setQuickReplyOpen(false);
    setQuickReplyIndex(0);
    setFeedback(resolved.missing.length ? { tone: "error", text: `Missing CRM values: ${resolved.missing.map((item) => `{{${item}}}`).join(", ")}. Review the draft before sending.` } : null);
    signalTyping(next);
    focusEditor(next.length);
  }

  function handleEditorKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (quickReplyVisible) {
      if (event.key === "ArrowDown") { event.preventDefault(); setQuickReplyIndex((current) => (current + 1) % quickReplyMatches.length); return; }
      if (event.key === "ArrowUp") { event.preventDefault(); setQuickReplyIndex((current) => (current - 1 + quickReplyMatches.length) % quickReplyMatches.length); return; }
      if (event.key === "Escape") { event.preventDefault(); setQuickReplyOpen(false); return; }
      if (event.key === "Tab" || (event.key === "Enter" && !event.shiftKey)) {
        const chosen = quickReplyMatches[quickReplyIndex] || quickReplyMatches[0];
        if (chosen) { event.preventDefault(); chooseQuickReply(chosen); return; }
      }
    }
    if (shouldSendOnKey({ key: event.key, shiftKey: event.shiftKey, isComposing: event.nativeEvent.isComposing })) {
      event.preventDefault(); void submit(); return;
    }
    if (event.key === "Escape" && replyTarget) { event.preventDefault(); clearReplyTarget(); }
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
    if (attachment) { sendAttachment(attachment); return; }
    if (savedReplyMedia) { sendSavedReply(savedReplyMedia); return; }

    const text = message.trim();
    if (!text) { setFeedback({ tone: "error", text: "Write a message before sending." }); return; }
    inFlightRef.current = true;
    const quotedMessageId = replyTarget?.messageId;
    startTransition(async () => {
      const pendingKey = queueOutbound(text);
      resetEditor();
      try {
        const response = await fetch("/api/admin/whatsapp/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, waId, text, replyToMessageId: quotedMessageId }),
        });
        const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; messageId?: string };
        if (!response.ok || !payload.ok) {
          dropOutbound(pendingKey); setMessage(text);
          if (payload.error === "NOT_CONFIGURED") { setFeedback({ tone: "error", text: "Sender credentials are still missing in production, so the inbox cannot send yet." }); return; }
          if (payload.error === "SERVICE_WINDOW_CLOSED") { setFeedback({ tone: "error", text: "The 24-hour customer service window is closed for this conversation." }); return; }
          setFeedback({ tone: "error", text: payload.error || "Unable to send the message right now. Please try again in a moment." }); return;
        }
        settleOutbound(pendingKey, payload.messageId); clearReplyTarget(); router.refresh();
      } catch {
        markOutboundUnconfirmed(pendingKey, "The connection dropped before WhatsApp confirmed it.");
        setFeedback({ tone: "error", text: "The connection dropped before WhatsApp confirmed the message. Check the thread before sending it again." });
      } finally { inFlightRef.current = false; }
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void submit(); }

  function sendSavedReply(reply: WhatsAppQuickReply) {
    if (disabled || inFlightRef.current || !reply.media_kind) return;
    const text = message.trim();
    const quotedMessageId = replyTarget?.messageId;
    inFlightRef.current = true;
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/whatsapp/reply/saved-reply/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, waId, savedReplyId: reply.id, text, replyToMessageId: quotedMessageId }),
        });
        const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; partial?: boolean; textMessageId?: string };
        if (!response.ok || !payload.ok) {
          if (payload.partial) {
            setMessage("");
            clearReplyTarget();
            setFeedback({ tone: "error", text: payload.error || "The text was sent, but the saved attachment failed. Retry to send only the attachment." });
            router.refresh();
            return;
          }
          setFeedback({ tone: "error", text: payload.error || "Unable to send the saved reply right now." });
          return;
        }
        setSavedReplyMedia(null); resetEditor(); clearReplyTarget(); setFeedback({ tone: "info", text: "Saved reply sent." }); router.refresh();
      } catch {
        setFeedback({ tone: "error", text: "The connection dropped while sending the saved reply. Check the thread before retrying." });
      } finally { inFlightRef.current = false; }
    });
  }

  function openFilePicker(kind: WhatsAppMediaKind | null) {
    const input = fileInputRef.current;
    if (!input) return;
    input.accept = kind ? WHATSAPP_MEDIA_KINDS[kind].accept : getWhatsAppMediaAccept();
    input.value = "";
    input.click();
  }

  function stageFile(file: File | null) {
    setFeedback(null);
    if (!file) return;
    const validation = validateWhatsAppMediaFile({ mimeType: file.type, size: file.size, name: file.name });
    if (!validation.ok) { setFeedback({ tone: "error", text: validation.error }); return; }
    if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    setSavedReplyMedia(null);
    setAttachment({ file, kind: validation.kind, previewUrl: validation.kind === "image" ? URL.createObjectURL(file) : null });
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
        formData.set("conversationId", conversationId); formData.set("waId", waId); formData.set("kind", staged.kind); formData.set("file", staged.file, staged.file.name);
        if (caption) formData.set("caption", caption);
        if (replyTarget) formData.set("replyToMessageId", replyTarget.messageId);
        const response = await fetch("/api/admin/whatsapp/reply/media/", { method: "POST", body: formData });
        const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!response.ok || !payload.ok) { setFeedback({ tone: "error", text: payload.error || "Unable to send this attachment right now. Please try again in a moment." }); return; }
        clearAttachment(); resetEditor(); clearReplyTarget(); setFeedback({ tone: "info", text: `${WHATSAPP_MEDIA_KINDS[staged.kind].label} sent.` }); router.refresh();
      } catch { setFeedback({ tone: "error", text: "The connection dropped before this attachment finished uploading. Check the thread before retrying." }); }
      finally { inFlightRef.current = false; }
    });
  }

  const sendAudioBlob = useCallback((blob: Blob, mimeType: string) => {
    if (disabled || inFlightRef.current) return;
    inFlightRef.current = true;
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("conversationId", conversationId); formData.set("waId", waId); formData.set("audio", blob, getWhatsAppAudioFilename(mimeType));
        const response = await fetch("/api/admin/whatsapp/reply/audio", { method: "POST", body: formData });
        const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!response.ok || !payload.ok) { setFeedback({ tone: "error", text: payload.error || "Unable to send the voice note right now. Please try again in a moment." }); return; }
        if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
        setRecordedAudio(null); setRecordedAudioUrl(null); setRecordingState(getSupportedRecordingType() ? "idle" : "unsupported"); setElapsedSeconds(0); setWaveform(createWaveformHistory()); setFeedback({ tone: "info", text: "Voice note sent." }); router.refresh();
      } catch { setFeedback({ tone: "error", text: "The connection dropped before the voice note finished uploading. Check the thread before retrying." }); }
      finally { inFlightRef.current = false; }
    });
  }, [conversationId, disabled, recordedAudioUrl, router, startTransition, waId]);

  useEffect(() => { sendAudioRef.current = sendAudioBlob; }, [sendAudioBlob]);

  function stopWaveform() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    const context = audioContextRef.current;
    audioContextRef.current = null;
    void context?.close().catch(() => {});
  }

  function startWaveform(stream: MediaStream) {
    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    try {
      const context = new AudioContextCtor(); audioContextRef.current = context;
      const analyser = context.createAnalyser(); analyser.fftSize = 1024; context.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize); let lastPush = 0;
      const loop = () => {
        frameRef.current = requestAnimationFrame(loop);
        const now = Date.now(); if (now - lastPush < 80) return; lastPush = now;
        analyser.getByteTimeDomainData(samples); setWaveform((current) => pushWaveformLevel(current, measureWaveformLevel(samples)));
      };
      frameRef.current = requestAnimationFrame(loop);
    } catch { stopWaveform(); }
  }

  async function startRecording() {
    if (disabled || !recordingMimeType) return;
    setFeedback(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream; chunksRef.current = []; sendAfterStopRef.current = false;
      const activeMimeType = recordingMimeType;
      const recorder = new MediaRecorder(stream, { mimeType: activeMimeType });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const audio = new Blob(chunksRef.current, { type: activeMimeType });
        stopWaveform(); stream.getTracks().forEach((track) => track.stop()); streamRef.current = null;
        if (sendAfterStopRef.current) { sendAfterStopRef.current = false; setRecordingState("ready"); setRecordedAudio(audio); sendAudioRef.current(audio, activeMimeType); return; }
        setRecordedAudio(audio); setRecordedAudioUrl((current) => { if (current) URL.revokeObjectURL(current); return URL.createObjectURL(audio); }); setRecordingState("ready");
      };
      setWaveform(createWaveformHistory()); setElapsedSeconds(0); startedAtRef.current = Date.now(); recorder.start(); setRecordingState("recording"); startWaveform(stream);
    } catch {
      setFeedback({ tone: "error", text: "Microphone access was not granted, so this browser cannot record a voice note." }); setRecordingState("idle"); streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; stopWaveform();
    }
  }

  function stopRecording() { if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop(); }
  function stopAndSendRecording() { if (recordingState === "ready" && recordedAudio && recordingMimeType) { sendAudioBlob(recordedAudio, recordingMimeType); return; } sendAfterStopRef.current = true; stopRecording(); }
  function cancelRecording() {
    sendAfterStopRef.current = false;
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    stopWaveform(); streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; setRecordedAudio(null);
    setRecordedAudioUrl((current) => { if (current) URL.revokeObjectURL(current); return null; }); setElapsedSeconds(0); setWaveform(createWaveformHistory()); setRecordingState(recordingMimeType ? "idle" : "unsupported");
  }

  const inRecordingMode = recordingState === "recording" || recordingState === "ready";
  const recordingLabel = recordingState === "recording" ? `Recording, ${formatRecordingDuration(elapsedSeconds)}` : `Voice note ready, ${formatRecordingDuration(elapsedSeconds)}`;
  const savedMediaSrc = savedReplyMedia ? `/api/admin/whatsapp/quick-replies/media/?id=${encodeURIComponent(savedReplyMedia.id)}` : null;

  return (
    <form onSubmit={handleSubmit} className="relative px-3 py-3 sm:px-4">
      <input ref={fileInputRef} type="file" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(event) => stageFile(event.target.files?.[0] || null)} />

      {showDisabledNotice ? <div className="mb-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-brass/25 bg-brass-tint px-3 py-2 text-xs leading-5 text-[#6f4f16]"><span>{helperText}</span>{composerState.reason === "SERVICE_WINDOW_CLOSED" ? <Link href="/admin/whatsapp/templates/" className="font-semibold underline decoration-brass/50 underline-offset-2">Open templates</Link> : null}</div> : null}
      {serviceWindowSoonText ? <div className="mb-2.5 flex items-center gap-2 rounded-xl border border-brass/25 bg-brass-tint px-3 py-2 text-xs leading-5 text-[#6f4f16]"><WhatsAppIcon name="clock" className="h-4 w-4 flex-none" /><span>{serviceWindowSoonText}</span></div> : null}
      {feedback ? <p role="status" className={`mb-2.5 rounded-xl px-3 py-2 text-xs leading-5 ${feedback.tone === "error" ? "border border-rose-200 bg-rose-50 text-rose-700" : "border border-rule bg-paper text-ink-soft"}`}>{feedback.text}</p> : null}

      {replyTarget ? <div className="mb-2.5 flex items-start gap-2 rounded-xl border border-rule bg-paper py-2 pl-0 pr-1.5"><span aria-hidden="true" className="ml-2 mt-0.5 w-[3px] flex-none self-stretch rounded-full bg-ledger-bright" /><span className="min-w-0 flex-1 py-0.5"><span className="block text-xs font-semibold text-ledger">{replyTarget.authorLabel}</span><span className="mt-0.5 block truncate text-xs leading-5 text-ink-soft">{replyTarget.excerpt}</span></span><button type="button" onClick={clearReplyTarget} aria-label="Stop replying to this message" className="grid h-9 w-9 flex-none place-items-center rounded-full text-ink-faint hover:bg-paper-sunk hover:text-ink"><WhatsAppIcon name="close" className="h-[1.05rem] w-[1.05rem]" /></button></div> : null}

      {attachment ? <div className="mb-2.5 flex items-center gap-3 rounded-xl border border-rule bg-paper px-3 py-2.5">{attachment.previewUrl ? <span role="img" aria-label={`Preview of ${attachment.file.name}`} style={{ backgroundImage: `url(${attachment.previewUrl})` }} className="h-11 w-11 flex-none rounded-lg border border-rule bg-paper-sunk bg-cover bg-center" /> : <span className="grid h-11 w-11 flex-none place-items-center rounded-lg bg-ledger-tint text-ledger"><WhatsAppIcon name={KIND_ICONS[attachment.kind]} className="h-5 w-5" /></span>}<span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-ink">{attachment.file.name}</span><span className="block text-[0.7rem] text-ink-faint">{WHATSAPP_MEDIA_KINDS[attachment.kind].label} · {formatWhatsAppMediaSize(attachment.file.size)}{busy ? " · uploading…" : supportsWhatsAppMediaCaption(attachment.kind) ? " · the message below is sent as its caption" : ""}</span></span><button type="button" onClick={clearAttachment} disabled={busy} aria-label={`Remove ${attachment.file.name}`} className="grid h-9 w-9 flex-none place-items-center rounded-full text-ink-faint hover:bg-paper-sunk hover:text-ink disabled:opacity-50"><WhatsAppIcon name="close" className="h-[1.05rem] w-[1.05rem]" /></button></div> : null}

      {savedReplyMedia && savedReplyMedia.media_kind ? <div className="mb-2.5 flex items-center gap-3 rounded-xl border border-ledger/20 bg-ledger-tint/40 px-3 py-2.5">{savedReplyMedia.media_kind === "image" && savedMediaSrc ? <span role="img" aria-label={savedReplyMedia.media_filename || "Saved reply image"} style={{ backgroundImage: `url(${savedMediaSrc})` }} className="h-11 w-11 flex-none rounded-lg border border-ledger/20 bg-paper bg-cover bg-center" /> : <span className="grid h-11 w-11 flex-none place-items-center rounded-lg bg-paper text-ledger"><WhatsAppIcon name={KIND_ICONS[savedReplyMedia.media_kind]} className="h-5 w-5" /></span>}<span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-ink">{savedReplyMedia.media_filename || "Saved attachment"}</span><span className="block text-[0.7rem] text-ink-faint">From /{savedReplyMedia.shortcut}{savedReplyMedia.media_size ? ` · ${formatWhatsAppMediaSize(savedReplyMedia.media_size)}` : ""}</span>{savedMediaSrc ? <a href={savedMediaSrc} target="_blank" rel="noreferrer" className="mt-0.5 inline-block text-[0.68rem] font-semibold text-ledger underline decoration-ledger/30 underline-offset-2">Preview attachment</a> : null}</span><button type="button" onClick={() => setSavedReplyMedia(null)} disabled={busy} aria-label="Remove saved-reply attachment" className="grid h-9 w-9 flex-none place-items-center rounded-full text-ink-faint hover:bg-paper-sunk hover:text-ink disabled:opacity-50"><WhatsAppIcon name="close" className="h-[1.05rem] w-[1.05rem]" /></button></div> : null}

      {quickReplyVisible ? <div ref={quickReplyRef} className="absolute bottom-[calc(100%-0.25rem)] left-3 right-3 z-30 overflow-hidden rounded-2xl border border-rule bg-paper-raised shadow-[0_18px_40px_-18px_rgba(14,26,20,.45)] sm:left-4 sm:right-auto sm:w-[27rem]">
        <div className="border-b border-rule bg-paper px-3 py-2">
          <div className="flex items-center justify-between gap-2"><p className="text-[0.62rem] font-semibold uppercase tracking-[.14em] text-ink-faint">Saved replies</p><span className="text-[0.65rem] text-ink-faint">{quickReplyMatches.length}</span></div>
          {quickReplyQuery === null ? <div className="mt-2 space-y-2"><input autoFocus value={quickReplySearch} onChange={(e) => { setQuickReplySearch(e.target.value); setQuickReplyIndex(0); }} placeholder="Search shortcut, message or category" className="w-full rounded-lg border border-rule bg-paper-raised px-3 py-2 text-xs text-ink outline-none focus:border-ledger-bright" /><div className="grid grid-cols-2 gap-2"><select value={quickReplyScope} onChange={(e) => { setQuickReplyScope(e.target.value as SavedReplyScopeFilter); setQuickReplyIndex(0); }} className="rounded-lg border border-rule bg-paper-raised px-2 py-1.5 text-xs text-ink"><option value="ALL">Team + My replies</option><option value="TEAM">Team only</option><option value="PERSONAL">My replies</option></select><select value={quickReplyCategory} onChange={(e) => { setQuickReplyCategory(e.target.value); setQuickReplyIndex(0); }} className="rounded-lg border border-rule bg-paper-raised px-2 py-1.5 text-xs text-ink"><option value="ALL">All categories</option>{browseCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></div></div> : null}
        </div>
        <ul className="max-h-72 overflow-y-auto py-1">{quickReplyMatches.map((reply, index) => { const resolved = resolveWhatsAppQuickReplyVariables(reply.body, variableContext); return <li key={reply.id}><button type="button" onClick={() => chooseQuickReply(reply)} onMouseEnter={() => setQuickReplyIndex(index)} className={`block w-full px-3 py-2.5 text-left transition ${index === quickReplyIndex ? "bg-ledger-tint" : "hover:bg-paper-sunk"}`}><span className="flex items-center gap-2"><span className="font-mono text-[0.7rem] font-semibold text-ledger">/{reply.shortcut}</span><span className="truncate text-sm font-medium text-ink">{reply.title}</span><span className="ml-auto rounded-full bg-paper-sunk px-1.5 py-0.5 text-[0.58rem] text-ink-faint">{reply.scope === "TEAM" ? "Team" : "Mine"}</span></span><span className="mt-1 flex items-center gap-1.5"><span className="rounded-full bg-paper-sunk px-1.5 py-0.5 text-[0.58rem] text-ink-faint">{reply.category}</span>{reply.media_kind ? <span className="rounded-full bg-brass-tint px-1.5 py-0.5 text-[0.58rem] text-[#6f4f16]">{reply.media_kind}</span> : null}{resolved.missing.length ? <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[0.58rem] text-rose-700">{resolved.missing.length} missing</span> : null}</span><span className="mt-1 block whitespace-pre-wrap text-[0.7rem] leading-5 text-ink-soft">{resolved.text}</span>{resolved.missing.length ? <span className="mt-1 block font-mono text-[0.6rem] text-rose-700">Missing: {resolved.missing.map((item) => `{{${item}}}`).join(", ")}</span> : null}{reply.media_filename ? <span className="mt-1 block truncate text-[0.62rem] text-ink-faint">Attachment: {reply.media_filename}</span> : null}</button></li>; })}</ul>
      </div> : null}

      {inRecordingMode ? <div className="flex items-center gap-2 rounded-2xl border border-rule bg-paper px-2 py-2"><button type="button" onClick={cancelRecording} disabled={busy} aria-label="Cancel recording" className="grid h-11 w-11 flex-none place-items-center rounded-full text-ink-faint hover:bg-paper-sunk hover:text-ink disabled:opacity-50"><WhatsAppIcon name="close" className="h-5 w-5" /></button><div className="flex min-w-0 flex-1 items-center gap-2">{recordingState === "recording" ? <span aria-hidden="true" className="h-2 w-2 flex-none animate-pulse rounded-full bg-rose-600" /> : null}<span aria-hidden="true" className="flex h-8 min-w-0 flex-1 items-center gap-[2px] overflow-hidden">{waveform.map((level, index) => <span key={index} style={{ height: `${Math.round(level * 100)}%` }} className={`w-full flex-1 rounded-full ${recordingState === "recording" ? "bg-ledger-bright" : "bg-rule-strong"}`} />)}</span><span className="flex-none text-xs font-medium tabular-nums text-ink-soft">{formatRecordingDuration(elapsedSeconds)}</span></div><span role="status" aria-live="polite" className="sr-only">{recordingLabel}</span>{recordingState === "ready" && recordedAudioUrl ? <audio controls src={recordedAudioUrl} className="hidden h-9 w-40 flex-none sm:block">Your browser cannot play this recording.</audio> : null}<button type="button" onClick={cancelRecording} disabled={busy} aria-label="Discard recording" className="grid h-11 w-11 flex-none place-items-center rounded-full text-ink-faint hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"><WhatsAppIcon name="trash" className="h-[1.05rem] w-[1.05rem]" /></button><button type="button" onClick={stopAndSendRecording} disabled={disabled || busy} aria-label={recordingState === "recording" ? "Stop and send voice note" : "Send voice note"} className="grid h-11 w-11 flex-none place-items-center rounded-full bg-ledger-bright text-white shadow-sm hover:bg-ledger disabled:bg-ledger-bright/40">{busy ? <Spinner /> : <WhatsAppIcon name="send" className="h-5 w-5" />}</button></div> : <div className="flex items-end gap-2">
        <AttachmentMenu onPickKind={openFilePicker} onOpenQuickReplies={quickReplies.length ? openSavedReplies : undefined} disabled={disabled || busy} />
        <div className="flex min-w-0 flex-1 items-end gap-1 rounded-[1.4rem] border border-rule bg-paper px-2 py-1.5 transition focus-within:border-ledger-bright focus-within:ring-2 focus-within:ring-ledger-bright/20"><label htmlFor="whatsapp-composer-editor" className="sr-only">Message to this WhatsApp customer</label><textarea id="whatsapp-composer-editor" ref={textareaRef} value={message} onChange={(event) => handleDraftChange(event.target.value)} onKeyDown={handleEditorKeyDown} disabled={disabled || busy} rows={1} placeholder="Type a message..." aria-describedby="whatsapp-composer-hint" className="min-w-0 flex-1 resize-none self-center bg-transparent px-2 py-1 text-sm leading-6 text-ink outline-none placeholder:text-ink-faint/70 disabled:opacity-70" />{quickReplies.length ? <button type="button" onClick={openSavedReplies} disabled={disabled || busy} aria-label="Open saved replies" title="Saved replies" className="grid h-9 w-9 flex-none place-items-center rounded-full text-ink-faint hover:bg-paper-sunk hover:text-ledger disabled:text-ink-faint/50"><WhatsAppIcon name="quickReplies" className="h-5 w-5" /></button> : null}<EmojiPicker onSelect={handleEmojiSelect} disabled={disabled || busy} /><button type="button" onClick={() => openFilePicker(null)} disabled={disabled || busy} aria-label="Attach a file" className="grid h-9 w-9 flex-none place-items-center rounded-full text-ink-faint hover:bg-paper-sunk hover:text-ledger disabled:text-ink-faint/50"><WhatsAppIcon name="paperclip" className="h-5 w-5" /></button><button type="button" onClick={startRecording} disabled={disabled || busy || recordingState === "unsupported"} aria-label={recordingState === "unsupported" ? "Voice recording is unavailable in this browser" : "Record a voice note"} title={recordingState === "unsupported" ? "This browser cannot record in a WhatsApp-compatible format. Attach an audio file instead." : undefined} className="grid h-9 w-9 flex-none place-items-center rounded-full text-ink-faint hover:bg-paper-sunk hover:text-ledger disabled:text-ink-faint/50"><WhatsAppIcon name="microphone" className="h-5 w-5" /></button></div>
        <button type="submit" disabled={disabled || busy || !canSend} aria-label="Send message" className={`grid h-11 w-11 flex-none place-items-center rounded-full text-white shadow-sm transition ${canSend && !disabled && !busy ? "bg-ledger-bright hover:bg-ledger" : "cursor-not-allowed bg-ledger-bright/40"}`}>{busy ? <Spinner /> : <WhatsAppIcon name="send" className="h-5 w-5" />}</button>
      </div>}

      <p id="whatsapp-composer-hint" className="mt-2 px-1 text-[0.68rem] leading-5 text-ink-faint">Enter sends · Shift + Enter adds a line{quickReplies.length ? " · / opens saved replies" : ""}{composerState.enabled ? " · typing here shows a real typing indicator and marks their last message as read" : ""}</p>
    </form>
  );
}

function Spinner() {
  return <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}
