"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";

const MAX_ROWS = 250;
const MAX_BYTES = 512 * 1024;

type ImportOutcome = {
  row: number;
  whatsappNumber?: string;
  status: "inserted" | "skipped" | "error";
  message: string;
};

type ImportResult = {
  error?: string;
  summary?: { inserted: number; skipped: number; errors: number };
  outcomes?: ImportOutcome[];
};

export default function ContactCsvTools() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] || null;
    setError(null);
    setResult(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.size > MAX_BYTES) {
      setFile(null);
      setError("CSV file must be 512 KB or smaller.");
      event.target.value = "";
      return;
    }
    setFile(selected);
  }

  async function importCsv() {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const csv = await file.text();
      const response = await fetch("/api/admin/whatsapp/contacts/import/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const payload = (await response.json().catch(() => ({}))) as ImportResult;
      if (!response.ok) throw new Error(payload.error || "Contacts could not be imported.");
      setResult(payload);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Contacts could not be imported.");
    } finally {
      setBusy(false);
    }
  }

  function close() {
    if (busy) return;
    setOpen(false);
    setFile(null);
    setError(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <>
      <a href="/api/admin/whatsapp/contacts/export/" className="inline-flex items-center justify-center rounded-lg border border-rule bg-paper-raised px-3 py-2 text-sm font-semibold text-ink-soft transition hover:border-ledger hover:text-ledger">
        Export CSV
      </a>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center justify-center rounded-lg border border-rule bg-paper-raised px-3 py-2 text-sm font-semibold text-ink-soft transition hover:border-ledger hover:text-ledger">
        Import CSV
      </button>

      {open ? (
        <div className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto bg-black/50 px-3 py-10 sm:px-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <section className="w-full max-w-2xl rounded-2xl border border-rule bg-paper-raised shadow-2xl" role="dialog" aria-modal="true" aria-label="Import WhatsApp contacts from CSV">
            <div className="flex items-start gap-4 border-b border-rule px-5 py-4 sm:px-6">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-ink">Import contacts</h2>
                <p className="mt-1 text-xs leading-5 text-ink-faint">Validated CSV import. Existing WhatsApp numbers are skipped, never overwritten.</p>
              </div>
              <button type="button" onClick={close} disabled={busy} className="rounded-lg border border-rule px-2.5 py-1.5 text-xs font-semibold text-ink-soft disabled:opacity-50">Close</button>
            </div>

            <div className="space-y-4 px-5 py-5 sm:px-6">
              <div className="rounded-lg bg-paper-sunk px-3 py-3 text-xs leading-5 text-ink-soft">
                <p>Maximum {MAX_ROWS} contacts per import and 512 KB per file.</p>
                <a href="/api/admin/whatsapp/contacts/export/?template=1" className="font-semibold text-ledger underline decoration-ledger/30 underline-offset-4">Download CSV template</a>
              </div>

              <label className="block rounded-xl border border-dashed border-rule-strong bg-paper px-4 py-5 text-center">
                <span className="block text-sm font-semibold text-ink">Choose CSV file</span>
                <span className="mt-1 block text-xs text-ink-faint">The file is validated before any contact is written.</span>
                <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={chooseFile} className="mt-3 block w-full text-xs text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-ledger-bright file:px-3 file:py-2 file:font-semibold file:text-white" />
              </label>

              {file ? <p className="text-xs text-ink-soft">Selected: <span className="font-semibold text-ink">{file.name}</span> · {(file.size / 1024).toFixed(1)} KB</p> : null}
              {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">{error}</p> : null}

              {result?.summary ? (
                <div className="rounded-xl border border-rule bg-paper px-3 py-3">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div><p className="text-lg font-semibold text-ledger">{result.summary.inserted}</p><p className="text-ink-faint">Inserted</p></div>
                    <div><p className="text-lg font-semibold text-brass">{result.summary.skipped}</p><p className="text-ink-faint">Skipped</p></div>
                    <div><p className="text-lg font-semibold text-rose-700">{result.summary.errors}</p><p className="text-ink-faint">Errors</p></div>
                  </div>
                  {result.outcomes?.length ? (
                    <div className="mt-3 max-h-52 overflow-y-auto border-t border-rule pt-2">
                      {result.outcomes.map((outcome) => (
                        <p key={`${outcome.row}-${outcome.status}`} className="py-1 text-[0.7rem] text-ink-soft">
                          Row {outcome.row}: <span className="font-semibold capitalize">{outcome.status}</span> · {outcome.message}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-rule px-5 py-4 sm:px-6">
              <button type="button" onClick={close} disabled={busy} className="rounded-lg border border-rule px-4 py-2 text-sm font-medium text-ink-soft disabled:opacity-50">Cancel</button>
              <button type="button" onClick={importCsv} disabled={!file || busy} className="rounded-lg bg-ledger-bright px-4 py-2 text-sm font-semibold text-white transition hover:bg-ledger disabled:cursor-not-allowed disabled:opacity-50">
                {busy ? "Importing…" : "Import CSV"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
