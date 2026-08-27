"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { WhatsAppIcon } from "@/components/whatsapp/icons";
import {
  WHATSAPP_EMOJI_CATEGORIES,
  WHATSAPP_EMOJI_RECENTS_KEY,
  WHATSAPP_EMOJI_RECENTS_TAB,
  WHATSAPP_EMOJI_RECENTS_TAB_ID,
  addEmojiRecent,
  parseStoredEmojiRecents,
} from "./emojiModel";

/**
 * The composer's emoji picker: trigger button and floating panel together, so the
 * outside-click rule can treat both as "inside" without the parent passing refs around.
 *
 * The glyph list and the frequently-used rule live in `emojiModel.ts`; this file is the
 * panel, the tabs, and the keyboard behaviour.
 */
export default function EmojiPicker({
  onSelect,
  disabled = false,
}: {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [tabId, setTabId] = useState<string>(WHATSAPP_EMOJI_CATEGORIES[0].id);
  const [recents, setRecents] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelId = useId();

  useEffect(() => {
    try {
      setRecents(parseStoredEmojiRecents(window.localStorage.getItem(WHATSAPP_EMOJI_RECENTS_KEY)));
    } catch {
      // Private windows and blocked site data both land here. The picker works without a
      // frequently-used row; it just does not remember one.
    }
  }, []);

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

  function handlePick(emoji: string) {
    onSelect(emoji);
    setRecents((current) => {
      const next = addEmojiRecent(current, emoji);
      try {
        window.localStorage.setItem(WHATSAPP_EMOJI_RECENTS_KEY, JSON.stringify(next));
      } catch {
        // Same as above: remembering is the nice-to-have, inserting is the job.
      }
      return next;
    });
  }

  const showingRecents = tabId === WHATSAPP_EMOJI_RECENTS_TAB_ID;
  const category =
    WHATSAPP_EMOJI_CATEGORIES.find((entry) => entry.id === tabId) || WHATSAPP_EMOJI_CATEGORIES[0];

  return (
    <div ref={wrapperRef} className="relative flex-none">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-label="Insert emoji"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? panelId : undefined}
        className={`grid h-9 w-9 place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ledger-bright/40 disabled:cursor-not-allowed disabled:text-ink-faint/50 ${
          open ? "bg-ledger-tint text-ledger" : "text-ink-faint hover:bg-paper-sunk hover:text-ledger"
        }`}
      >
        <WhatsAppIcon name="smile" className="h-5 w-5" />
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Emoji picker"
          className="absolute bottom-[calc(100%+0.6rem)] right-0 z-30 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-rule bg-paper-raised shadow-[0_18px_40px_-18px_rgba(14,26,20,.45)]"
        >
          <div
            role="tablist"
            aria-label="Emoji categories"
            className="flex items-center gap-0.5 overflow-x-auto border-b border-rule bg-paper px-1.5 pb-2 pt-1.5"
          >
            <EmojiTab
              tab={WHATSAPP_EMOJI_RECENTS_TAB}
              label="Frequently used"
              active={showingRecents}
              onSelect={() => setTabId(WHATSAPP_EMOJI_RECENTS_TAB_ID)}
            />
            {WHATSAPP_EMOJI_CATEGORIES.map((entry) => (
              <EmojiTab
                key={entry.id}
                tab={entry.tab}
                label={entry.label}
                active={!showingRecents && entry.id === category.id}
                onSelect={() => setTabId(entry.id)}
              />
            ))}
          </div>

          <div className="max-h-56 overflow-y-auto px-2 py-2">
            {showingRecents ? (
              <section>
                <h4 className="px-1 pb-1 text-[0.6rem] font-semibold uppercase tracking-[.14em] text-ink-faint">
                  Frequently used
                </h4>
                {recents.length ? (
                  <div className="grid grid-cols-8 gap-0.5">
                    {recents.map((emoji) => (
                      <EmojiButton key={`recent-${emoji}`} emoji={emoji} onPick={handlePick} />
                    ))}
                  </div>
                ) : (
                  <p className="px-1 py-3 text-xs leading-5 text-ink-faint">
                    Emoji you send will collect here.
                  </p>
                )}
              </section>
            ) : (
              <>
                {recents.length ? (
                  <section className="mb-2">
                    <h4 className="px-1 pb-1 text-[0.6rem] font-semibold uppercase tracking-[.14em] text-ink-faint">
                      Frequently used
                    </h4>
                    <div className="grid grid-cols-8 gap-0.5">
                      {recents.map((emoji) => (
                        <EmojiButton key={`recent-${emoji}`} emoji={emoji} onPick={handlePick} />
                      ))}
                    </div>
                  </section>
                ) : null}

                <section>
                  <h4 className="px-1 pb-1 text-[0.6rem] font-semibold uppercase tracking-[.14em] text-ink-faint">
                    {category.label}
                  </h4>
                  <div className="grid grid-cols-8 gap-0.5">
                    {category.emoji.map((emoji) => (
                      <EmojiButton key={`${category.id}-${emoji}`} emoji={emoji} onPick={handlePick} />
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmojiTab({
  tab,
  label,
  active,
  onSelect,
}: {
  tab: string;
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      onClick={onSelect}
      aria-selected={active}
      title={label}
      className={`relative grid h-8 w-8 flex-none place-items-center rounded-lg text-base leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ledger-bright/40 ${
        active ? "opacity-100" : "opacity-55 hover:bg-paper-sunk hover:opacity-100"
      }`}
    >
      <span aria-hidden="true">{tab}</span>
      <span className="sr-only">{label}</span>
      {/* The active marker from the approved design: a green rule under the tab, not a pill.
          Tabs are emoji glyphs, which ignore `color`, so the underline is what has to carry it. */}
      {active ? (
        <span
          aria-hidden="true"
          className="absolute -bottom-1.5 left-1.5 right-1.5 h-[2px] rounded-full bg-ledger-bright"
        />
      ) : null}
    </button>
  );
}

function EmojiButton({ emoji, onPick }: { emoji: string; onPick: (emoji: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick(emoji)}
      aria-label={emoji}
      className="grid h-8 w-8 place-items-center rounded-lg text-lg leading-none transition hover:bg-paper-sunk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ledger-bright/40"
    >
      <span aria-hidden="true">{emoji}</span>
    </button>
  );
}
