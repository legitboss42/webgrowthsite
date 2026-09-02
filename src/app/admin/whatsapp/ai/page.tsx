"use client";

import { useEffect, useState } from "react";

function openAIWorkspace() {
  const button = document.querySelector<HTMLButtonElement>('button[aria-label="Open AI workspace"]');
  if (!button) return false;
  button.click();
  return true;
}

export default function WhatsAppAIPage() {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (openAIWorkspace()) {
      setOpened(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setOpened(openAIWorkspace());
    }, 150);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="rounded-3xl border border-rule bg-paper-raised p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-ledger">Stage 10</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Web Growth AI</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-faint">
          Manage AI Assist, business knowledge, AI Agents, safety controls and usage from one workspace.
        </p>
        <button
          type="button"
          onClick={() => setOpened(openAIWorkspace())}
          className="mt-6 rounded-xl bg-ledger px-4 py-2.5 text-sm font-semibold text-white"
        >
          {opened ? "Reopen AI workspace" : "Open AI workspace"}
        </button>
      </div>
    </main>
  );
}
