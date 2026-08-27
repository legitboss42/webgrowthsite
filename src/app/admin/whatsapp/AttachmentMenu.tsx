"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { WhatsAppIcon, type WhatsAppIconName } from "@/components/whatsapp/icons";
import { WHATSAPP_MEDIA_KINDS, formatWhatsAppMediaSize, type WhatsAppMediaKind } from "@/lib/whatsapp/media";

/**
 * The composer's `+` menu.
 *
 * Every item maps to something the send route can actually do: the four media kinds Meta
 * accepts, and a link to the templates console for the case the 24-hour window has closed.
 * Nothing here is a placeholder.
 *
 * One panel serves both layouts — a bottom sheet under `sm` where a floating menu would be
 * a 40px-wide target, and an anchored panel above it.
 */
const KIND_ICONS: Record<WhatsAppMediaKind, WhatsAppIconName> = {
  image: "image",
  video: "video",
  document: "document",
  audio: "microphone",
};

const KIND_HINTS: Record<WhatsAppMediaKind, string> = {
  image: "JPEG or PNG",
  video: "MP4 or 3GP",
  document: "PDF, Word, Excel, PowerPoint, or text",
  audio: "OGG, MP3, M4A, AAC, or AMR",
};

/** Mockup order: Document, Image, Video, Audio. */
const MENU_KINDS: readonly WhatsAppMediaKind[] = ["document", "image", "video", "audio"];

/**
 * Shared tile geometry. A four-across grid at 320px leaves ~76px per cell, which clears the
 * 44px touch target with the label underneath.
 */
const TILE_CLASS =
  "flex flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 text-center transition hover:bg-paper-sunk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ledger-bright/40";
const TILE_ICON_CLASS = "grid h-11 w-11 place-items-center rounded-xl";
const TILE_LABEL_CLASS = "block w-full truncate text-[0.7rem] font-medium leading-4 text-ink-soft";

export default function AttachmentMenu({
  onPickKind,
  onOpenQuickReplies,
  disabled = false,
}: {
  onPickKind: (kind: WhatsAppMediaKind) => void;
  /** Omitted when this inbox has no saved quick replies, so the item never appears empty. */
  onOpenQuickReplies?: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelId = useId();

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) close(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        close(true);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, open]);

  function handlePick(kind: WhatsAppMediaKind) {
    close(false);
    onPickKind(kind);
  }

  return (
    <div ref={wrapperRef} className="relative flex-none">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-label="Add an attachment"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? panelId : undefined}
        className={`grid h-11 w-11 place-items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ledger-bright/40 disabled:cursor-not-allowed disabled:border-rule disabled:bg-paper-sunk disabled:text-ink-faint/60 ${
          open
            ? "border-ledger bg-ledger-tint text-ledger"
            : "border-rule bg-paper text-ink-soft hover:border-ledger hover:text-ledger"
        }`}
      >
        <WhatsAppIcon name="plus" className={`h-5 w-5 transition-transform ${open ? "rotate-45" : ""}`} />
      </button>

      {open ? (
        <>
          {/* Bottom-sheet scrim. Phone only: on a pointer device the outside click is enough. */}
          <div className="fixed inset-0 z-40 bg-ink-ground/25 sm:hidden" aria-hidden="true" />
          <div
            id={panelId}
            role="menu"
            aria-label="Attachment types"
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-rule bg-paper-raised p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-18px_40px_-20px_rgba(14,26,20,.45)] sm:absolute sm:inset-x-auto sm:bottom-[calc(100%+0.65rem)] sm:left-0 sm:w-[19.5rem] sm:rounded-2xl sm:border sm:p-2 sm:shadow-[0_18px_40px_-18px_rgba(14,26,20,.45)]"
          >
            {/* The caret that points back at the `+`, as in the approved design. Desktop only:
                the bottom sheet is already anchored to the bottom of the screen. */}
            <span
              aria-hidden="true"
              className="absolute -bottom-[0.4rem] left-[0.95rem] hidden h-3 w-3 rotate-45 border-b border-r border-rule bg-paper-raised sm:block"
            />

            <div className="flex items-center justify-between px-1 pb-1.5 pt-1 sm:hidden">
              <span className="text-sm font-semibold text-ink">Attach</span>
              <button
                type="button"
                onClick={() => close(true)}
                aria-label="Close attachment menu"
                className="grid h-9 w-9 place-items-center rounded-full text-ink-faint transition hover:bg-paper-sunk hover:text-ink"
              >
                <WhatsAppIcon name="close" className="h-[1.05rem] w-[1.05rem]" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-0.5">
              {MENU_KINDS.map((kind) => {
                const spec = WHATSAPP_MEDIA_KINDS[kind];
                const hint = `${KIND_HINTS[kind]} · up to ${formatWhatsAppMediaSize(spec.maxBytes)}`;
                return (
                  <button
                    key={kind}
                    type="button"
                    role="menuitem"
                    onClick={() => handlePick(kind)}
                    title={hint}
                    aria-label={`${spec.label} — ${hint}`}
                    className={TILE_CLASS}
                  >
                    <span className={`${TILE_ICON_CLASS} bg-ledger-tint text-ledger`}>
                      <WhatsAppIcon name={KIND_ICONS[kind]} className="h-[1.15rem] w-[1.15rem]" />
                    </span>
                    <span className={TILE_LABEL_CLASS}>{spec.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="my-1.5 h-px bg-rule" />

            <div className="grid grid-cols-4 gap-0.5">
              {onOpenQuickReplies ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    close(false);
                    onOpenQuickReplies();
                  }}
                  title="Or type / in the editor"
                  aria-label="Quick replies — or type / in the editor"
                  className={TILE_CLASS}
                >
                  <span className={`${TILE_ICON_CLASS} bg-brass-tint text-[#6f4f16]`}>
                    <WhatsAppIcon name="quickReplies" className="h-[1.15rem] w-[1.15rem]" />
                  </span>
                  <span className={TILE_LABEL_CLASS}>Replies</span>
                </button>
              ) : null}

              <Link
                href="/admin/whatsapp/templates/"
                role="menuitem"
                onClick={() => close(false)}
                title="Required once the 24-hour window closes"
                aria-label="Message templates — required once the 24-hour window closes"
                className={TILE_CLASS}
              >
                <span className={`${TILE_ICON_CLASS} bg-brass-tint text-[#6f4f16]`}>
                  <WhatsAppIcon name="templates" className="h-[1.15rem] w-[1.15rem]" />
                </span>
                <span className={TILE_LABEL_CLASS}>Templates</span>
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
