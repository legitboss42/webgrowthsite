export default function WhatsAppLoading() {
  return (
    <div className="flex min-h-[16rem] w-full items-center justify-center px-6 py-16" role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-xl border border-rule bg-paper-raised px-4 py-3 text-sm text-ink-soft shadow-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-ledger-bright border-t-transparent" aria-hidden="true" />
        <span>Loading…</span>
      </div>
    </div>
  );
}
