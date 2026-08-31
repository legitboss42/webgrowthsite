"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type ActiveCall = {
  callId: string;
  customerWaId: string | null;
  customerName: string | null;
  status: string;
  startedAt: string | null;
  offerSdp: string;
};

type Phase = "ringing" | "connecting" | "active" | "ending";

function waitForIceGathering(peer: RTCPeerConnection) {
  if (peer.iceGatheringState === "complete") return Promise.resolve();
  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, 2500);
    const handler = () => {
      if (peer.iceGatheringState !== "complete") return;
      window.clearTimeout(timeout);
      peer.removeEventListener("icegatheringstatechange", handler);
      resolve();
    };
    peer.addEventListener("icegatheringstatechange", handler);
  });
}

async function callAction(callId: string, action: "pre_accept" | "accept" | "reject" | "terminate", sdp?: string) {
  const response = await fetch("/api/admin/whatsapp/calls/action/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callId, action, ...(sdp ? { sdp } : {}) }),
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(payload.error || `Could not ${action.replace("_", " ")} call.`);
}

export default function IncomingCallOverlay() {
  const [call, setCall] = useState<ActiveCall | null>(null);
  const [phase, setPhase] = useState<Phase>("ringing");
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentIdRef = useRef<string | null>(null);

  const cleanupMedia = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
  }, []);

  useEffect(() => () => cleanupMedia(), [cleanupMedia]);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      if (phase === "active" || phase === "connecting" || phase === "ending") return;
      try {
        const response = await fetch("/api/admin/whatsapp/calls/active/", { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as { call?: ActiveCall | null };
        if (cancelled) return;
        if (response.ok && payload.call) {
          if (currentIdRef.current !== payload.call.callId) {
            currentIdRef.current = payload.call.callId;
            setCall(payload.call);
            setPhase("ringing");
            setError(null);
            setSeconds(0);
          }
        } else if (phase === "ringing") {
          currentIdRef.current = null;
          setCall(null);
        }
      } catch {
        // A transient polling failure must not dismiss a call already visible.
      }
    }
    void poll();
    const timer = window.setInterval(poll, 2000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [phase]);

  useEffect(() => {
    if (phase !== "active") return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  async function answer() {
    if (!call || phase !== "ringing") return;
    setPhase("connecting");
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      localStreamRef.current = stream;
      const peer = new RTCPeerConnection();
      peerRef.current = peer;
      stream.getAudioTracks().forEach((track) => peer.addTrack(track, stream));
      peer.ontrack = (event) => {
        const remoteStream = event.streams[0] || new MediaStream([event.track]);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          void remoteAudioRef.current.play().catch(() => undefined);
        }
      };
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "connected") setPhase("active");
        if (["failed", "closed"].includes(peer.connectionState)) {
          setError("The audio connection ended.");
          cleanupMedia();
          setCall(null);
          currentIdRef.current = null;
          setPhase("ringing");
        }
      };

      await peer.setRemoteDescription({ type: "offer", sdp: call.offerSdp });
      const answerDescription = await peer.createAnswer();
      await peer.setLocalDescription(answerDescription);
      await waitForIceGathering(peer);
      const sdp = peer.localDescription?.sdp;
      if (!sdp) throw new Error("The browser could not create a call answer.");

      await callAction(call.callId, "pre_accept", sdp);
      await callAction(call.callId, "accept", sdp);
      setPhase("active");
    } catch (reason) {
      cleanupMedia();
      setPhase("ringing");
      setError(reason instanceof Error ? reason.message : "Could not answer the call.");
    }
  }

  async function reject() {
    if (!call) return;
    setError(null);
    try {
      await callAction(call.callId, "reject");
      cleanupMedia();
      setCall(null);
      currentIdRef.current = null;
      setPhase("ringing");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not reject the call.");
    }
  }

  async function hangUp() {
    if (!call) return;
    setPhase("ending");
    try {
      await callAction(call.callId, "terminate");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Meta could not confirm hang up.");
    } finally {
      cleanupMedia();
      setCall(null);
      currentIdRef.current = null;
      setPhase("ringing");
    }
  }

  function toggleMute() {
    const next = !muted;
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !next; });
    setMuted(next);
  }

  if (!call) return null;
  const minutes = Math.floor(seconds / 60);
  const elapsed = `${minutes}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-x-3 top-3 z-[100] mx-auto max-w-md rounded-2xl border border-ledger/25 bg-paper-raised p-4 shadow-2xl sm:inset-x-auto sm:right-5 sm:top-5 sm:w-[390px]">
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
      <div className="flex items-start gap-3">
        <span className={`mt-1 h-3 w-3 flex-none rounded-full ${phase === "ringing" ? "animate-pulse bg-ledger-bright" : "bg-ledger"}`} />
        <div className="min-w-0 flex-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[.14em] text-ledger">
            {phase === "ringing" ? "Incoming WhatsApp call" : phase === "connecting" ? "Connecting call" : "WhatsApp call"}
          </p>
          <p className="mt-1 truncate text-base font-semibold text-ink">{call.customerName || call.customerWaId || "WhatsApp caller"}</p>
          <p className="mt-0.5 font-mono text-xs text-ink-faint">{call.customerWaId || "Unknown number"}</p>
          {phase === "active" ? <p className="mt-1 text-xs font-medium text-ledger">Connected · {elapsed}</p> : null}
        </div>
        <Link href="/admin/whatsapp/calls/" className="rounded-lg border border-rule px-2 py-1 text-[0.68rem] font-medium text-ink-soft">Calls</Link>
      </div>

      {error ? <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}

      {phase === "ringing" ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={reject} className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white">Reject</button>
          <button type="button" onClick={answer} className="rounded-xl bg-ledger-bright px-4 py-3 text-sm font-semibold text-white">Answer</button>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={toggleMute} disabled={phase === "connecting" || phase === "ending"} className="rounded-xl border border-rule bg-paper px-4 py-3 text-sm font-semibold text-ink disabled:opacity-50">{muted ? "Unmute" : "Mute"}</button>
          <button type="button" onClick={hangUp} disabled={phase === "connecting" || phase === "ending"} className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{phase === "ending" ? "Ending…" : "Hang up"}</button>
        </div>
      )}
    </div>
  );
}
