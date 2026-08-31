"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { WhatsAppQuickSettings } from "@/lib/whatsapp/quickSettings";

function Switch({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="relative inline-flex flex-none cursor-pointer items-center">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="h-6 w-11 rounded-full bg-paper-sunk ring-1 ring-rule transition peer-checked:bg-ledger-bright peer-focus-visible:ring-2 peer-focus-visible:ring-ledger-bright/30 peer-disabled:opacity-50" />
      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
    </label>
  );
}

export default function MessageVisibilitySettingsPanel({
  quickSettings,
}: {
  quickSettings: WhatsAppQuickSettings;
}) {
  const router = useRouter();
  const [deliveryVisible, setDeliveryVisible] = useState(quickSettings.deliveryStatusVisible);
  const [readVisible, setReadVisible] = useState(quickSettings.readStatusVisible);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(update: Partial<WhatsAppQuickSettings>, rollback: () => void) {
    startTransition(async () => {
      setFeedback(null);
      const response = await fetch("/api/admin/whatsapp/quick-settings/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!payload.ok) {
        rollback();
        setFeedback(payload.error || "Could not save message visibility settings.");
        return;
      }
      setFeedback("Saved");
      router.refresh();
    });
  }

  return (
    <section className="relative z-10 mx-4 mt-5 rounded-xl border border-rule bg-paper-raised p-4 shadow-sm sm:mx-6 sm:p-5">
      <div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[.16em] text-ledger">Message visibility</p>
        <h2 className="mt-1 text-sm font-semibold text-ink">Read & delivery status</h2>
        <p className="mt-0.5 text-xs leading-5 text-ink-faint">
          Control which Meta delivery receipts agents see in conversation bubbles. This changes the console display only; it does not change Meta&apos;s delivery or read-receipt behaviour.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rule bg-paper px-3.5 py-3 sm:gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">Delivery status indicators</p>
            <p className="mt-0.5 text-xs leading-4 text-ink-faint">
              Show sending, sent and delivered indicators on outbound messages. Failed sends always remain visible.
            </p>
          </div>
          <Switch
            checked={deliveryVisible}
            disabled={pending}
            onChange={(checked) => {
              const previous = deliveryVisible;
              setDeliveryVisible(checked);
              save({ deliveryStatusVisible: checked }, () => setDeliveryVisible(previous));
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-rule bg-paper px-3.5 py-3 sm:gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">Read status indicators</p>
            <p className="mt-0.5 text-xs leading-4 text-ink-faint">
              Show the read indicator when Meta reports that a customer opened an outbound message.
            </p>
          </div>
          <Switch
            checked={readVisible}
            disabled={pending}
            onChange={(checked) => {
              const previous = readVisible;
              setReadVisible(checked);
              save({ readStatusVisible: checked }, () => setReadVisible(previous));
            }}
          />
        </div>
      </div>

      {feedback ? <p className="mt-3 text-xs text-ink-faint" aria-live="polite">{feedback}</p> : null}
    </section>
  );
}
